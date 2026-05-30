  // === IMPORTS ===
  import React, { useEffect, useState, useRef, useCallback } from 'react';
  import axios from '../utils/axiosConfig'; // Configuration axios pour les requêtes API
  import PFEsTable from '../components/PFEsTable'; // Tableau d'affichage des PFE
  import PFEForm from '../components/PFEForm'; // Formulaire de création/édition de PFE
  import AffectationKanban from '../components/AffectationKanban'; // Vue Kanban pour l'affectation
  import './GestionEtudiants.css'; // Styles CSS partagés


  // Capture les erreurs React et affiche une interface d'erreur au lieu de bloquer l'app
  class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    // Appelée lorsqu'une erreur est lancée dans un composant enfant
    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    // Enregistre l'erreur dans la console pour le débogage
    componentDidCatch(error, errorInfo) {
      console.error('Erreur capturée:', error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="main-container">
            <h2 className="page-title">Erreur dans Gestion des PFE</h2>
            <div className="success-message" style={{ background: '#e53e3e' }}>
              Une erreur s'est produite: {this.state.error?.message}
            </div>
            <button onClick={() => window.location.reload()}>Recharger la page</button>
          </div>
        );
      }

      return this.props.children;
    }
  }

  // === FONCTIONS UTILITAIRES ===
  
  // Valider et limiter le plafond entre 1-99
  function clampPlafondInput(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return 5;
    return Math.min(99, Math.max(1, Math.floor(x)));
  }

  // Normaliser la clé du matricule (évite collisions number/string)
  function matriculeKey(m) {
    if (m === null || m === undefined || typeof m === 'object') return '';
    return String(m).trim();
  }

  // === COMPOSANT PRINCIPAL ===
  function GestionPFEs() {
    // === ÉTATS PRINCIPAUX ===
    const [pfes, setPFEs] = useState([]);        // Liste des PFE
    const [enseignants, setEnseignants] = useState([]); // Liste des encadrants
    const [etudiants, setEtudiants] = useState([]);     // Liste des étudiants
    const [specialites, setSpecialites] = useState([]); // Spécialités disponibles
    const [licences, setLicences] = useState([]);       // Licences disponibles
    
    // === ÉTATS UI ===
    const [selectedPFE, setSelectedPFE] = useState(null); // PFE en édition
    const [showForm, setShowForm] = useState(false);     // Affichage du formulaire
    const [loading, setLoading] = useState(true);        // Chargement des données
    const [activeTab, setActiveTab] = useState('liste'); // Onglet actif (liste/kanban/capacites)
    
    // ======== ÉTATS FILTRAGE ET RECHERCHE ========
    // Contient le texte saisi dans la barre de recherche pour filtrer les PFE
    const [searchTerm, setSearchTerm] = useState('');
    // Indique le champ sur lequel chercher (ex: 'Sujet', 'Encadrant', 'Tous les champs', etc.)
    const [filterBy, setFilterBy] = useState('Tous les champs');
    
    // ======== ÉTATS MESSAGES ========
    // Message de succès affiché en haut de la page (ex: "PFE créé avec succès")
    const [message, setMessage] = useState('');
    // Message d'erreur affiché en haut de la page avec fond rouge (ex: "Erreur API")
    const [error, setError] = useState('');
    
    // ======== ÉTATS PLAFOND ET CAPACITÉS ========
    // Nombre maximum de groupes PFE qu'un encadrant peut superviser (plafond global)
    const [plafondGroupes, setPlafondGroupes] = useState(5);
    // Référence du dernier plafond sauvegardé avec succès (pour détecter les modifications)
    const lastSavedPlafondRef = useRef(5);
    // Flag indiquant qu'une sauvegarde du plafond global est en cours (affiche le spinner)
    const [savingPlafond, setSavingPlafond] = useState(false);
    // Objet stockant les éditions temporaires de capacité avant sauvegarde (clé: matricule, valeur: nouveau plafond)
    const [capacitesEdits, setCapacitesEdits] = useState({});      // Éditions temporaires des capacités
    const [savingCapacites, setSavingCapacites] = useState({});   // Indicateurs de sauvegarde par matricule
    
    // === RÉFÉRENCES ===
    const pfeFileRef = useRef(null); // Input file caché pour importer Excel

    // DEBUG : Affiche la liste des PFEs reçus du backend
    React.useEffect(() => {
      console.log('PFEs reçus du backend :', pfes);
    }, [pfes]);


    // Récupérer le plafond max pour un encadrant (spécifique ou global)
    const getEncadrantMaxGroupes = useCallback(
      (matriculeOrEnseignant) => {
        // Initialiser le plafond à null (signifie: utiliser le plafond global)
        try {
          let plaf = null;
          
          // Cas 1: Le paramètre est un objet enseignant complet
          if (matriculeOrEnseignant && typeof matriculeOrEnseignant === 'object') {
            // Extraire directement le champ plafond_pfe de l'objet
            plaf = matriculeOrEnseignant.plafond_pfe;
          } 
          // Cas 2: Le paramètre est une chaîne matricule
          else if (matriculeOrEnseignant && typeof matriculeOrEnseignant === 'string') {
            // Rechercher cet enseignant dans la liste par son matricule
            const found = (enseignants || []).find((x) => String(x.matricule) === String(matriculeOrEnseignant));
            // S'il est trouvé, récupérer son plafond individuel
            if (found) plaf = found.plafond_pfe;
          }
          
          // Récupérer le matricule pour chercher les éditions temporaires (non sauvegardées)
          const mk = matriculeOrEnseignant && typeof matriculeOrEnseignant === 'string' 
            ? String(matriculeOrEnseignant) 
            : (matriculeOrEnseignant && matriculeOrEnseignant.matricule);
          
          // Vérifier si l'utilisateur a modifié ce plafond dans le formulaire mais pas encore sauvegardé
          if (mk && capacitesEdits && Object.prototype.hasOwnProperty.call(capacitesEdits, mk)) {
            // Récupérer la valeur modifiée (non sauvegardée)
            const v = capacitesEdits[mk];
            // Si l'utilisateur a vidé le champ, cela signifie: utiliser le plafond global
            if (v === null || v === undefined || v === '') {
              plaf = null;
            }
            // Sinon, utiliser la valeur modifiée
            else {
              plaf = v;
            }
          }
          
          // Retourner le plafond validé (entre 1 et 99) ou le plafond global s'il n'y a pas de plafond spécifique
          return clampPlafondInput(plaf != null ? plaf : plafondGroupes);
        } 
        // En cas d'erreur, retourner le plafond global par défaut
        catch (e) {
          return clampPlafondInput(plafondGroupes);
        }
      },
      // Les dépendances: la fonction se recalcule si l'un de ces états change
      [plafondGroupes, enseignants, capacitesEdits]
    );

    // === FONCTION: Charger toutes les données du backend ===
    // Récupère depuis l'API: PFE, enseignants, étudiants, spécialités, licences et paramètres globaux
    // Met à jour tous les états principaux et affiche un spinner pendant le chargement
    const loadData = async () => {
      // Afficher le spinner de chargement
      setLoading(true);
      // Effacer tout message d'erreur précédent
      setError('');
      
      try {
        // Utiliser Promise.all pour charger toutes les ressources en parallèle (plus rapide)
        // Chaque requête axios fait une requête GET à l'API
        const [pfeRes, enseignantRes, etudiantRes, paramRes, specialitesRes, licencesRes] = await Promise.all([
          // Récupérer tous les PFE
          axios.get('pfes/'),
          // Récupérer tous les enseignants (avec leurs plafonds individuels)
          axios.get('enseignants/'),
          // Récupérer tous les étudiants
          axios.get('etudiants/'),
          // Récupérer les paramètres globaux (plafond global, etc.)          // .catch() retourne un objet par défaut si la requête échoue
          axios.get('pfes/parametres/').catch(() => ({ data: { plafond_groupes: 5 } })),
          // Récupérer toutes les spécialités disponibles          // .catch() retourne un tableau vide si la requête échoue
          axios.get('specialites/').catch(() => ({ data: [] })),
          // Récupérer toutes les licences disponibles          // .catch() retourne un tableau vide si la requête échoue
          axios.get('licences/').catch(() => ({ data: [] })),
        ]);

        // Définir les données reçues dans les états
        // Mettre à jour la liste des PFE (ou tableau vide si réponse invalide)
        setPFEs(Array.isArray(pfeRes.data) ? pfeRes.data : []);
        
        // Traiter la liste des enseignants: normaliser les matricules pour éviter les collisions
        const ensRaw = Array.isArray(enseignantRes.data) ? enseignantRes.data : [];
        setEnseignants(
          ensRaw.map((row) =>
            row && typeof row === 'object'
              ? {
                  // Copier tous les champs de l'enseignant
                  ...row,
                  // Normaliser le matricule: le convertir en string et supprimer les espaces
                  matricule:
                    row.matricule != null && typeof row.matricule !== 'object'
                      ? String(row.matricule).trim()
                      : row.matricule,
                }
              : row
          )
        );
        // Mettre à jour la liste des étudiants
        setEtudiants(Array.isArray(etudiantRes.data) ? etudiantRes.data : []);
        // Mettre à jour la liste des spécialités
        setSpecialites(Array.isArray(specialitesRes.data) ? specialitesRes.data : []);
        // Mettre à jour la liste des licences
        setLicences(Array.isArray(licencesRes.data) ? licencesRes.data : []);
        
        // === Mettre à jour le plafond global ===        // Valider et limiter le plafond reçu du backend (entre 1 et 99)
        const pg = clampPlafondInput(paramRes?.data?.plafond_groupes ?? 5);
        // Mettre à jour l'état du plafond global
        setPlafondGroupes(pg);
        // Sauvegarder le plafond dans la référence pour détecter les modifications ultérieures
        lastSavedPlafondRef.current = pg;
      } 
      // Gestion des erreurs réseau ou API
      catch (err) {
        // Extraire le message d'erreur de la réponse API ou du message d'erreur général
        const message = err.response?.data?.detail || err.message || 'Impossible de charger les données. Vérifiez que le backend est disponible.';
        // Afficher le message d'erreur à l'écran
        setError(message);
      } 
      // Bloc finalement: toujours exécuté, même en cas d'erreur
      finally {
        // Masquer le spinner de chargement
        setLoading(false);
      }
    };

    // === EFFET: Charger les données au montage du composant ===
    // S'exécute une seule fois lors du premier rendu du composant ([] = pas de dépendances)
    useEffect(() => {
      // Appeler la fonction de chargement des données
      loadData();
    }, []); // Tableau de dépendances vide = s'exécute une seule fois


    // === FONCTION: Compter les PFEs par encadrant ===
    // Parcourt tous les PFE et compte combien en sont assignés à chaque enseignant
    // Retourne un objet: { matricule1: 3, matricule2: 1, ... }
    const getEncadrantGroupCount = () => {
      // Initialiser un objet vide pour accumuler les comptages
      const count = {};
      // Parcourir chaque PFE du tableau
      pfes.forEach((p) => {
        // Vérifier que le PFE a un encadrant assigné (pas null, pas undefined, pas vide)
        if (p.encadrant != null && p.encadrant !== '') {
          // Convertir le matricule en clé stable (string, trimé)
          const k = matriculeKey(p.encadrant);
          // Si la clé est valide, incrémenter le comptage pour cet enseignant
          if (k) count[k] = (count[k] || 0) + 1;
        }
      });
      // Retourner l'objet de comptage
      return count;
    };

    // === FONCTION: Calculer les statistiques d'assignation ===
    // Calcule des statistiques globales sur l'assignation des PFE et la disponibilité des encadrants
    // Retourne un objet avec: totalPfes, pfesWithEncadrant, pfesWithoutEncadrant, totalEncadrants, availableEncadrants
    const getEncadrantStats = () => {
      // Compter le nombre total de PFE
      const totalPfes = pfes?.length || 0;
      // Compter les PFE qui ont un encadrant assigné (non null, non undefined, non vide)
      const pfesWithEncadrant = pfes?.filter(p => p?.encadrant)?.length || 0;
      // Compter les PFE sans encadrant
      const pfesWithoutEncadrant = totalPfes - pfesWithEncadrant;

      // Récupérer le comptage actuel des PFE par encadrant
      const encadrantCount = getEncadrantGroupCount();
      // Compter le nombre total d'enseignants disponibles
      const totalEncadrants = enseignants?.length || 0;
      // Compter les enseignants qui ont encore de la capacité (sous leur plafond)
      const availableEncadrants =
        enseignants?.filter((e) => {
          // Récupérer la clé stable du matricule
          const k = matriculeKey(e?.matricule);
          // Obtenir le nombre de PFE actuellement assignés à cet enseignant
          const used = k ? encadrantCount[k] || 0 : 0;
          // Vérifier si le nombre assigné est inférieur au plafond
          return used < getEncadrantMaxGroupes(e.matricule);
        })?.length || 0;

      // Retourner un objet avec toutes les statistiques calculées
      return {
        totalPfes,
        pfesWithEncadrant,
        pfesWithoutEncadrant,
        totalEncadrants,
        availableEncadrants
      };
    };

    // === FONCTION: Filtrer les PFEs selon le terme de recherche et le champ sélectionné ===
    // Retourne un tableau contenant uniquement les PFE qui correspondent au critère de recherche
    const safePFEs = Array.isArray(pfes) ? pfes : [];
    const filteredPFEs = safePFEs.filter((item) => {
      // S'assurer que searchTerm est une chaîne valide (éviter les erreurs avec undefined)
      const safeSearchTerm = searchTerm || '';
      // Si le champ de recherche est vide, retourner tous les PFE
      if (!safeSearchTerm.trim()) return true;
      // Convertir le terme de recherche en minuscules pour une comparaison insensible à la casse
      const term = safeSearchTerm.toLowerCase();

      // Appliquer le filtre selon le champ sélectionné par l'utilisateur
      switch (filterBy) {
        case 'ID PFE':
          // Chercher dans l'ID du PFE
          return String(item?.idPfe || '').toLowerCase().includes(term);
        case 'Sujet':
          // Chercher dans le sujet du PFE
          return String(item?.sujet || '').toLowerCase().includes(term);
        case 'Type de projet':
          // Chercher dans le type de projet (ex: entreprise, recherche)
          return String(item?.type_projet || '').toLowerCase().includes(term);
        case 'Spécialité':
          // Chercher dans la spécialité du PFE
          return String(item?.specialite || '').toLowerCase().includes(term);
        case 'Encadrant':
          // Chercher dans le nom ou prénom de l'encadrant
          return String(item?.encadrant_detail?.nom || '').toLowerCase().includes(term) ||
            String(item?.encadrant_detail?.prenom || '').toLowerCase().includes(term);
        case 'Type contrat enc.':
          // Chercher dans le type de contrat de l'encadrant (ex: titulaire, vacataire)
          return String(item?.encadrant_detail?.typeContrat || '').toLowerCase().includes(term);
        default:
          // Mode \"Tous les champs\": chercher dans tous les champs disponibles
          return (
            String(item?.idPfe || '').toLowerCase().includes(term) ||
            String(item?.sujet || '').toLowerCase().includes(term) ||
            String(item?.type_projet || '').toLowerCase().includes(term) ||
            String(item?.specialite || '').toLowerCase().includes(term) ||
            String(item?.encadrant_detail?.nom || '').toLowerCase().includes(term) ||
            String(item?.encadrant_detail?.prenom || '').toLowerCase().includes(term) ||
            String(item?.encadrant_detail?.typeContrat || '').toLowerCase().includes(term)
          );
      }
    });


    // === HANDLERS: Gestion du formulaire ===
    
    // === HANDLER: Ouvrir le formulaire pour créer ou éditer un PFE ===
    // Paramètre: pfe = objet PFE à éditer, ou null pour une création
    const handleOpenForm = (pfe = null) => {
      // Stocker le PFE à éditer (null pour une création)
      setSelectedPFE(pfe);
      // Afficher le modal du formulaire
      setShowForm(true);
      // Effacer les messages d'erreur précédents
      setError('');
      // Effacer les messages de succès précédents
      setMessage('');
    };

    // === HANDLER: Fermer le formulaire ===
    // Appelé quand l'utilisateur clique sur "Annuler" ou "Fermer"
    const handleCloseForm = () => {
      // Désélectionner le PFE en cours d'édition
      setSelectedPFE(null);
      // Masquer le modal du formulaire
      setShowForm(false);
    };

    // Sauvegarder un PFE (créer ou modifier)
    const handleSavePFE = async (data) => {
      try {
        const payload = {
          sujet: data.sujet,
          duree: Number(data.duree),
          specialite: data.specialite,
          type_projet: data.typeProjet,
          lieu_stage: data.lieu_stage || null,
          encadrant: data.encadrant || null,
          etudiants: data.etudiants,
        };

        // Afficher le payload dans la console pour déboguer
        console.log('Payload à envoyer:', JSON.stringify(payload, null, 2));

        // === Vérifier si c'est une création ou une modification ===
        if (data.idPfe) {
          // Mode modification: utiliser PUT pour mettre à jour
          await axios.put(`pfes/${data.idPfe}/`, payload);
          // Afficher un message de succès
          setMessage('PFE modifié avec succès.');
        } else {
          // Mode création: utiliser POST pour créer un nouveau PFE
          await axios.post('pfes/', payload);
          // Afficher un message de succès
          setMessage('PFE créé avec succès.');
        }

        // Fermer le formulaire après succès
        handleCloseForm();
        // Recharger les données du backend pour refléter les changements
        loadData();
      } catch (err) {
        // Afficher l'erreur complète dans la console pour déboguer
        console.error('Erreur API complète:', err);
        console.error('Réponse:', err.response?.data);
        
        // === Extraire et formater le message d'erreur ===
        // Message par défaut en cas d'erreur inconnue
        let errorMessage = 'Erreur lors de l\'enregistrement.';
        
        // Cas 1: L'API retourne un message "detail" (erreur simple)
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } 
        // Cas 2: L'API retourne un objet "errors" (anciennes API)
        else if (err.response?.data?.errors) {
          errorMessage = JSON.stringify(err.response.data.errors);
        } 
        // Cas 3: L'API retourne un objet avec erreurs par champ (Django REST Framework)
        // Ex: {sujet: ['Ce champ est obligatoire'], duree: ['...']}
        else if (typeof err.response?.data === 'object') {
          // Récupérer l'objet d'erreurs
          const errors = err.response.data;
          // Tableau pour accumuler les messages formatés
          const errorMessages = [];
          
          // Parcourir chaque champ et ses erreurs
          for (const [field, messages] of Object.entries(errors)) {
            // Si les erreurs du champ sont un tableau, les joindre avec une virgule
            if (Array.isArray(messages)) {
              errorMessages.push(`${field}: ${messages.join(', ')}`);
            } 
            // Sinon, convertir le message en string
            else {
              errorMessages.push(`${field}: ${messages}`);
            }
          }
          
          // Si on a extrait des erreurs, les afficher jointes par des retours à la ligne
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join('');
          }
        }
        
        // Afficher le message d'erreur à l'écran
        setError(errorMessage);
      }
    };

    // Supprimer un PFE avec confirmation
    const handleDeletePFE = async (idPfe) => {
      if (!window.confirm('Supprimer ce PFE ?')) return;
      
      try {
        // Envoyer une requête DELETE à l'API pour supprimer le PFE
        await axios.delete(`pfes/${idPfe}/`);
        // Afficher un message de succès
        setMessage('PFE supprimé avec succès.');
        setPFEs((prev) => prev.filter((item) => item.idPfe !== idPfe));
      } catch (err) {
        setError('Impossible de supprimer le PFE.');
      }
    };


    // Assigner manuellement un encadrant avec vérifications de capacité
    const handleAssignEncadrant = async (pfeId, matricule) => {
      // Validation: vérifier PFE, enseignant, et capacité
      const pfe = pfes.find(p => p.idPfe === pfeId);
      if (!pfe) { setError('PFE non trouvé.'); return; }
      
      const enseignant = enseignants.find(e => matriculeKey(e.matricule) === matriculeKey(matricule));
      if (!enseignant) { setError('Enseignant non trouvé.'); return; }
      
      const encadrantCount = getEncadrantGroupCount();
      const k = matriculeKey(matricule);
      const currentCount = k ? encadrantCount[k] || 0 : 0;
      const maxGroupes = getEncadrantMaxGroupes(matricule);
      if (currentCount >= maxGroupes) { setError(`Cet enseignant a atteint son plafond de ${maxGroupes} groupes.`); return; }
      
      try {
        // === Préparer les données pour l'API ===
        // Extraire les IDs des étudiants (s'ils sont stockés comme objets ou comme IDs)
        let studentIds = [];
        // Vérifier que le PFE a des étudiants et que c'est un tableau
        if (Array.isArray(pfe.etudiants) && pfe.etudiants.length > 0) {
          // Convertir chaque étudiant en ID (gérer les cas où c'est un objet ou un ID simple)
          studentIds = pfe.etudiants.map(student =>
            typeof student === 'object' ? (student.numEtudiant || student.idEtudiant || student.id) : student
          );
        }
        
        // Construire le payload avec tous les champs requis par l'API
        const payload = {
          // Copier les champs existants du PFE
          sujet: pfe.sujet,
          duree: pfe.duree,
          specialite: pfe.specialite,
          // Assigner le nouvel encadrant
          encadrant: matricule,
          // Copier tous les étudiants (ou tableau vide si aucun)
          etudiants: studentIds.length > 0 ? studentIds : pfe.etudiants || [],
        };
        
        // === Envoyer la requête PUT à l'API ===
        // PUT pour mettre à jour le PFE avec le nouvel encadrant
        const response = await axios.put(`pfes/${pfeId}/`, payload);
        setMessage(`✅ Encadrant assigné : ${enseignant.nom} ${enseignant.prenom} (${currentCount + 1}/${maxGroupes} groupes)`);
        setError('');
        loadData();
      } catch (err) {
        const errorDetail = err.response?.data?.detail || err.response?.data?.errors || err.message;
        setError(`Erreur ${err.response?.status || 'inconnue'}: ${JSON.stringify(errorDetail)}`);
      }
    };

  // Assigner aléatoirement un encadrant à un PFE unique
  const handleRandomAssignEncadrant = async (pfe) => {
    // Afficher les informations dans la console pour déboguer
    console.log('=== Début assignation aléatoire ===');
    console.log('PFE complet:', JSON.stringify(pfe, null, 2));
    console.log('Enseignants disponibles:', enseignants);
    console.log('PFEs actuels:', pfes);

    // === VALIDATION: Vérifier qu'il y a des enseignants disponibles ===
    if (!enseignants || enseignants.length === 0) {
      setError('Aucun encadrant disponible.');
      // Afficher dans la console pour le débogage
      console.error('Erreur: Pas d\'enseignants');
      return;
    }

    // Compter les PFEs par encadrant (EXCLUANT le PFE actuel)
    const encadrantCount = {};
    pfes.forEach((p) => {
      if (p.idPfe !== pfe.idPfe && p.encadrant != null && p.encadrant !== '') {
        const k = matriculeKey(p.encadrant);
        if (k) encadrantCount[k] = (encadrantCount[k] || 0) + 1;
      }
    });

    // Afficher le comptage pour déboguer
    console.log('Comptage des encadrants (PFE actuel EXCLU):', encadrantCount);

    // === ÉTAPE 2: Filtrer les encadrants qui ont une capacité disponible ===
    const availableEncadrants = enseignants.filter((enseignant) => {
      // Normaliser la clé du matricule
      const k = matriculeKey(enseignant.matricule);
      // Compter combien de groupes sont actuellement assignés (0 par défaut)
      const count = k ? encadrantCount[k] || 0 : 0;
      // Récupérer la capacité maximale pour cet enseignant
      const cap = getEncadrantMaxGroupes(enseignant.matricule);
      // Vérifier que l'encadrant a encore de la place
      const isAvailable = count < cap;
      // Afficher pour le débogage
      console.log(`${enseignant.nom} : ${count}/${cap} groupes -> Disponible: ${isAvailable}`);
      // Retourner true si disponible, false sinon
      return isAvailable;
    });

    // Vérifier qu'il y a des encadrants disponibles
    if (availableEncadrants.length === 0) {
      setError('Aucun encadrant disponible (plafond de groupes atteint pour tous).');
      return;
    }

    // Sélectionner aléatoirement un encadrant
    const randomIndex = Math.floor(Math.random() * availableEncadrants.length);
    const randomEncadrant = availableEncadrants[randomIndex];

    try {
      // Extraire les IDs des étudiants
      let studentIds = [];
      if (Array.isArray(pfe.etudiants) && pfe.etudiants.length > 0) {
        studentIds = pfe.etudiants.map(student =>
          typeof student === 'object' ? (student.numEtudiant || student.idEtudiant || student.id) : student
        );
      }

      // Construire et envoyer le payload
      const payload = {
        sujet: pfe.sujet,
        duree: pfe.duree,
        specialite: pfe.specialite,
        encadrant: randomEncadrant.matricule,
        etudiants: studentIds.length > 0 ? studentIds : pfe.etudiants || [],
      };
      
      await axios.put(`pfes/${pfe.idPfe}/`, payload);

      // Afficher le succès
      const kR = matriculeKey(randomEncadrant.matricule);
      const currentCount = kR ? encadrantCount[kR] || 0 : 0;
      const cap = getEncadrantMaxGroupes(randomEncadrant.matricule);
      setMessage(`✅ Encadrant aléatoire assigné : ${randomEncadrant.nom} ${randomEncadrant.prenom} (${currentCount + 1}/${cap} groupes)`);
      setError('');
      loadData();
    } catch (err) {
      const errorDetail = err.response?.data?.detail || err.response?.data?.errors || err.response?.data;
      setError(`Erreur ${err.response?.status || 'inconnue'}: ${JSON.stringify(errorDetail)}`);
    }
  };

  // Assigner aléatoirement des encadrants à tous les PFEs sans encadrant
  const handleBulkRandomAssign = async () => {
    // Afficher le début de l'opération dans la console
    console.log('=== Début assignation globale aléatoire ===');

    // Vérifier qu'il y a des encadrants et des PFEs à assigner
    if (!enseignants || enseignants.length === 0) {
      setError('Aucun encadrant disponible.');
      return;
    }

    if (!pfes || pfes.length === 0) {
      setError('Aucun PFE disponible.');
      return;
    }

    // Filtrer les PFEs sans encadrant
    const pfesWithoutEncadrant = pfes.filter(pfe => !pfe.encadrant);

    if (pfesWithoutEncadrant.length === 0) {
      setMessage('✅ Tous les PFEs ont déjà un encadrant assigné.');
      return;
    }

    // Compter les PFEs par encadrant
    const encadrantCount = {};
    pfes.forEach((p) => {
      if (p.encadrant != null && p.encadrant !== '') {
        const k = matriculeKey(p.encadrant);
        if (k) encadrantCount[k] = (encadrantCount[k] || 0) + 1;
      }
    });

    // Trier par priorité (plus d'étudiants d'abord)
    const sortedPfes = [...pfesWithoutEncadrant].sort((a, b) => {
      const aStudents = Array.isArray(a.etudiants) ? a.etudiants.length : 0;
      const bStudents = Array.isArray(b.etudiants) ? b.etudiants.length : 0;
      return bStudents - aStudents;
    });

    // Assigner les encadrants aux PFEs un par un
    let assignedCount = 0;
    let skippedCount = 0;

    for (const pfe of sortedPfes) {
      // Filtrer les encadrants avec capacité disponible
      const availableEncadrants = enseignants.filter((enseignant) => {
        const mk = matriculeKey(enseignant.matricule);
        const count = mk ? encadrantCount[mk] || 0 : 0;
        const max = getEncadrantMaxGroupes(enseignant.matricule);
        return count < max;
      });

      if (availableEncadrants.length === 0) {
        skippedCount++;
        continue;
      }

      // Sélectionner aléatoirement un encadrant disponible
      const randomIndex = Math.floor(Math.random() * availableEncadrants.length);
      const randomEncadrant = availableEncadrants[randomIndex];

      try {
        // Extraire les IDs des étudiants
        let studentIds = [];
        if (Array.isArray(pfe.etudiants) && pfe.etudiants.length > 0) {
          studentIds = pfe.etudiants.map(student =>
            typeof student === 'object' ? (student.numEtudiant || student.idEtudiant || student.id) : student
          );
        }

        const payload = {
          sujet: pfe.sujet,
          duree: pfe.duree,
          specialite: pfe.specialite,
          encadrant: randomEncadrant.matricule,
          etudiants: studentIds.length > 0 ? studentIds : pfe.etudiants || [],
        };

        await axios.put(`/api/pfes/${pfe.idPfe}/`, payload);

        // Mettre à jour le comptage local
        const rk = matriculeKey(randomEncadrant.matricule);
        if (rk) encadrantCount[rk] = (encadrantCount[rk] || 0) + 1;

        assignedCount++;
      } catch (err) {
        skippedCount++;
      }
    }

    // Recharger et afficher le résultat
    await loadData();
    if (assignedCount > 0) {
      setMessage(`✅ Assignation globale terminée: ${assignedCount} PFE(s) assigné(s)${skippedCount > 0 ? `, ${skippedCount} ignoré(s)` : ''}`);
      setError('');
    } else {
      setError('❌ Aucun PFE n\'a pu être assigné (capacité maximale atteinte pour tous les encadrants).');
    }
  };

  // Réassigner TOUS les encadrants de manière aléatoire (demande confirmation)
  const handleReassignAllEncadrants = async () => {
    // Demander une confirmation explicite (l'utilisateur doit cliquer "OK" pour continuer)
    if (!window.confirm('⚠️ ATTENTION: Cette action va réassigner TOUS les encadrants de manière aléatoire. Tous les PFEs perdront leur encadrant actuel. Voulez-vous continuer ?')) {
      return;
    }

    // Vérifier qu'il y a des encadrants et PFEs à assigner
    if (!enseignants || enseignants.length === 0) {
      setError('Aucun encadrant disponible.');
      return;
    }

    if (!pfes || pfes.length === 0) {
      setError('Aucun PFE à assigner.');
      return;
    }

    // Trier les PFEs par priorité (plus d'étudiants d'abord)
    const sortedPfes = [...pfes].sort((a, b) => {
      const aStudents = Array.isArray(a.etudiants) ? a.etudiants.length : 0;
      const bStudents = Array.isArray(b.etudiants) ? b.etudiants.length : 0;
      return bStudents - aStudents;
    });

    let assignedCount = 0;
    let skippedCount = 0;
    const assignmentResults = [];

    // Retirer TOUS les encadrants des PFEs (mettre à null)
    for (const pfe of pfes) {
      try {
        // Extraire les IDs des étudiants
        let studentIds = [];
        if (Array.isArray(pfe.etudiants) && pfe.etudiants.length > 0) {
          studentIds = pfe.etudiants.map(student =>
            typeof student === 'object' ? (student.numEtudiant || student.idEtudiant || student.id) : student
          );
        }

        // Construire le payload avec encadrant = null
        const payload = {
          sujet: pfe.sujet,
          duree: pfe.duree,
          specialite: pfe.specialite,
          encadrant: null,
          etudiants: studentIds.length > 0 ? studentIds : pfe.etudiants || [],
        };

        await axios.put(`/api/pfes/${pfe.idPfe}/`, payload);
      } catch (err) {
        console.error(`Erreur lors du retrait de l'encadrant du PFE ${pfe.idPfe}:`, err);
      }
    }

    // Réassigner aléatoirement les encadrants
    const encadrantCount = {};

    for (const pfe of sortedPfes) {
      // Filtrer les encadrants avec capacité disponible
      const availableEncadrants = enseignants.filter((enseignant) => {
        const mk = matriculeKey(enseignant.matricule);
        const count = mk ? encadrantCount[mk] || 0 : 0;
        return count < getEncadrantMaxGroupes(enseignant.matricule);
      });

      if (availableEncadrants.length === 0) {
        skippedCount++;
        continue;
      }

      // Sélectionner aléatoirement un encadrant disponible
      const randomIndex = Math.floor(Math.random() * availableEncadrants.length);
      const randomEncadrant = availableEncadrants[randomIndex];

      try {
        // Extraire les IDs des étudiants
        let studentIds = [];
        if (Array.isArray(pfe.etudiants) && pfe.etudiants.length > 0) {
          studentIds = pfe.etudiants.map(student =>
            typeof student === 'object' ? (student.numEtudiant || student.idEtudiant || student.id) : student
          );
        }

        // Construire le payload
        const payload = {
          sujet: pfe.sujet,
          duree: pfe.duree,
          specialite: pfe.specialite,
          encadrant: randomEncadrant.matricule,
          etudiants: studentIds.length > 0 ? studentIds : pfe.etudiants || [],
        };

        await axios.put(`/api/pfes/${pfe.idPfe}/`, payload);

        // Mettre à jour le comptage local
        const rk = matriculeKey(randomEncadrant.matricule);
        if (rk) encadrantCount[rk] = (encadrantCount[rk] || 0) + 1;

        assignmentResults.push(`${pfe.idPfe} → ${randomEncadrant.nom} ${randomEncadrant.prenom}`);
        assignedCount++;
      } catch (err) {
        console.error(`Erreur lors de la réassignation du PFE ${pfe.idPfe}:`, err);
        skippedCount++;
      }
    }

    // === ÉTAPE 4: Recharger les données depuis le backend ===
    // Attendre que la fonction async se termine
    await loadData();

    // === ÉTAPE 5: Afficher le message de résultat ===
    // Si au moins un PFE a été réassigné
    if (assignedCount > 0) {
      // Afficher le message de succès avec le nombre réassigné et ignoré
      setMessage(`🔄 Réassignation complète terminée: ${assignedCount} PFE(s) réassigné(s)${skippedCount > 0 ? `, ${skippedCount} ignoré(s)` : ''}`);
      // Effacer les erreurs
      setError('');
      // Afficher les résultats détaillés dans la console
      console.log('Résultats de réassignation:', assignmentResults);
    } else {
      // Si aucun PFE n'a pu être réassigné
      setError('❌ Aucun PFE n\'a pu être réassigné.');
    }
  };

  // === VARIABLES DÉRIVÉES: Calculs basés sur les états ===

  // === enseignantsTriés ===
  // Tableau des enseignants triés alphabétiquement par nom, puis par prénom
  // Utilise la locale française pour le tri (accents, ç, etc.)
  const enseignantsTriés = [...(enseignants || [])].sort((a, b) =>
    // Comparer les noms (fallback: '' si null/undefined)
    String(a.nom || '').localeCompare(String(b.nom || ''), 'fr', { sensitivity: 'base' }) ||
    // Si les noms sont identiques, comparer les prénoms
    String(a.prenom || '').localeCompare(String(b.prenom || ''), 'fr', { sensitivity: 'base' })
  );

  // === plafondDirty ===
  // Détecte si le plafond global a été modifié mais pas encore sauvegardé
  // Utilise clampPlafondInput pour normaliser les valeurs (1-99)
  // Compare la valeur actuelle avec la dernière valeur sauvegardée stockée dans lastSavedPlafondRef.current
  const plafondDirty =
    clampPlafondInput(plafondGroupes) !== clampPlafondInput(lastSavedPlafondRef.current);

  // === HANDLER: Sauvegarder le plafond global d'encadrants par groupe ===
  // Paramètre: aucun (utilise la valeur de l'état plafondGroupes)
  // Envoie une requête PATCH au backend pour sauvegarder le plafond
  const handleSavePlafondGlobal = async () => {
    // Afficher l'indicateur de chargement
    setSavingPlafond(true);
    // Effacer les messages d'erreur précédents
    setError('');
    try {
      // Valider et clamper le plafond (1-99)
      const cible = clampPlafondInput(plafondGroupes);
      
      // Envoyer la requête PATCH au backend
      const { data } = await axios.patch('pfes/parametres/', { plafond_groupes: cible });
      
      // Mettre à jour avec la valeur confirmée du backend
      const v = clampPlafondInput(data?.plafond_groupes ?? cible);
      setPlafondGroupes(v);
      lastSavedPlafondRef.current = v;
      setMessage('Plafond global enregistré.');
    } catch (err) {
      const d = err.response?.data;
      const msg = (typeof d === 'string' && d) || d?.detail || d?.plafond_groupes || (d && typeof d === 'object' ? JSON.stringify(d) : null) || "Erreur lors de l'enregistrement du plafond.";
      setError(msg);
    } finally {
      setSavingPlafond(false);
    }
  };

  const handleImportExcel = () => {
    // Déclencher la sélection de fichier
    pfeFileRef.current?.click();
  };

  // Modifier la capacité d'un enseignant (avant sauvegarde)
  const handleChangeCapacite = (matricule, rawValue) => {
    const v = rawValue === '' ? '' : clampPlafondInput(rawValue);
    setCapacitesEdits((s) => ({ ...s, [matricule]: v }));
  };

  // Sauvegarder la capacité d'un enseignant
  const handleSaveCapacite = async (matricule) => {
    setSavingCapacites((s) => ({ ...s, [matricule]: true }));
    setError('');
    try {
      // Préparer le payload
      const raw = capacitesEdits[matricule];
      const payload = {};
      
      if (raw === '' || raw === null || raw === undefined) {
        payload.plafond_pfe = null;
      } else {
        payload.plafond_pfe = clampPlafondInput(raw);
      }
      
      // Envoyer la requête PATCH au backend
      const { data } = await axios.patch(`enseignants/${encodeURIComponent(matricule)}/`, payload);
      
      // Mettre à jour la liste locale
      setEnseignants((prev) =>
        (prev || []).map((e) =>
          String(e.matricule) === String(matricule)
            ? { ...e, plafond_pfe: data.plafond_pfe }
            : e
        )
      );
      setMessage('Capacité enregistrée.');
      
      // Nettoyer l'édition temporaire
      setCapacitesEdits((s) => {
        const copy = { ...s };
        delete copy[matricule];
        return copy;
      });
    } catch (err) {
      // === Gérer les erreurs ===
      // Extraire le message d'erreur depuis la réponse ou le message JavaScript
      setError(err.response?.data || err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      // === Arrêter l'indicateur de chargement ===
      // Marquer ce matricule comme n'étant plus en cours de sauvegarde (succès ou erreur)
      setSavingCapacites((s) => ({ ...s, [matricule]: false }));
    }
  };






  // === HANDLER: Traiter l'upload d'un fichier Excel ===
  // Paramètre: event = événement du changement de fichier (event.target.files[0])
  // Envoie le fichier à l'API en tant que multipart form data
  const handleFileChange = async (event) => {
    // === Récupérer le fichier sélectionné ===
    // event.target.files est un FileList (array-like), donc utiliser ?.[0] pour le premier fichier
    const file = event.target.files?.[0];
    // Si aucun fichier n'est sélectionné, arrêter
    if (!file) return;

    // === Préparer les données pour l'upload ===
    // FormData est utilisé pour envoyer des fichiers (multipart/form-data)
    const formData = new FormData();
    // Ajouter le fichier à la clé 'file'
    formData.append('file', file);

    try {
      // Envoyer le fichier au backend
      const response = await axios.post('pfes/import-excel/', formData);
      setMessage(`Import réussi : ${response.data.created.length} PFE(s) ajoutés.`);
      setError('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.errors || err.response?.data?.detail || 'Erreur d\'import Excel.');
    } finally {
      // Réinitialiser l'input file
      event.target.value = null;
    }
  };

  // Rendu principal JSX
  return (
    <div className="main-container">
      {/* Titre de la page */}
      <h2 className="page-title">Gestion des PFE</h2>
      
      {/* Messages de succès et d'erreur */}
      {message && <div className="success-message">{message}</div>}
      {error && <div className="success-message" style={{ background: '#e53e3e' }}>{JSON.stringify(error)}</div>}

      {/* Conteneur principal */}
      <div className="page-container">
        {/* === Zone de recherche et filtrage === */}
        {/* Permet de filtrer les PFEs par différents champs */}
        <div className="search-area">
          {/* Dropdown pour sélectionner le champ de recherche */}
          <select
            className="filter-select"
            // Récupérer la valeur du filtreçonsignee dans l'état
            value={filterBy}
            // Mettre à jour l'état quand l'utilisateur change de sélection
            onChange={(e) => setFilterBy(e.target.value)}
          >
            {/* Option par défaut: rechercher dans tous les champs */}
            <option>Tous les champs</option>
            {/* Options spécifiques pour chaque champ */}
            <option>ID PFE</option>
            <option>Sujet</option>
            <option>Type de projet</option>
            <option>Spécialité</option>
            <option>Encadrant</option>
            <option>Type contrat enc.</option>
          </select>
          
          {/* Champ de recherche */}
          <input
            type="text"
            placeholder="Rechercher..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Zone des boutons d'action */}
        <div className="buttons-area">
          {/* Ajouter un nouveau PFE */}
          <button className="btn" type="button" onClick={() => handleOpenForm(null)}>
            Ajouter un PFE
          </button>
          
          {/* Importer des PFEs depuis Excel */}
          <button className="btn import-btn" type="button" onClick={handleImportExcel}>
            Importer PFE
          </button>

          {/* Assigner des encadrants aux PFEs non assignés */}
          <button
            className="btn bulk-assign-btn"
            type="button"
            onClick={handleBulkRandomAssign}
            title="Assigner automatiquement des encadrants aux PFEs qui n'en ont pas"
          >
            🔄 Assigner Encadrants (Auto)
          </button>
          
          {/* Réassigner TOUS les encadrants aléatoirement (demande confirmation) */}
          <button
            className="btn reassign-btn"
            type="button"
            onClick={handleReassignAllEncadrants}
            title="Réassigner tous les encadrants de manière aléatoire"
          >
            🔄 Réassigner Tous
          </button>

          {/* Input file caché pour importer Excel */}
          <input
            type="file"
            accept=".xlsx,.xls"
            ref={pfeFileRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Afficher le chargement ou le contenu */}
      {loading ? (
        <div className="table-card">Chargement en cours...</div>
      ) : (
        <>
          <div className="stats-card">
            <h3>Plafond global de groupes PFE (tous les encadrants)</h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#64748b' }}>
              Le même plafond s’applique à chaque encadrant (et au même titre pour le rôle rapporteur
              côté soutenances). Modifiez la valeur puis enregistrez.
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <label htmlFor="plafond-global-pfe" style={{ fontWeight: 600 }}>
                Max. groupes simultanés
              </label>
              <input
                id="plafond-global-pfe"
                type="number"
                min={1}
                max={99}
                style={{ width: '80px', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                value={plafondGroupes}
                onChange={(ev) => {
                  const v = ev.target.value;
                  if (v === '') return;
                  const parsed = parseInt(v, 10);
                  if (!Number.isNaN(parsed)) setPlafondGroupes(parsed);
                }}
                onBlur={() => setPlafondGroupes((x) => clampPlafondInput(x))}
              />
              <button
                type="button"
                className="btn"
                disabled={savingPlafond || !plafondDirty}
                onClick={handleSavePlafondGlobal}
              >
                {savingPlafond ? 'Enregistrement…' : 'Enregistrer le plafond'}
              </button>
              {!plafondDirty && (
                <span style={{ fontSize: '13px', color: '#64748b' }}>Modifiez la valeur pour enregistrer.</span>
              )}
            </div>
            <div style={{ maxHeight: '320px', overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Matricule</th>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th style={{ width: '100px' }}>Actifs</th>
                  </tr>
                </thead>
                <tbody>
                  {enseignantsTriés.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ color: '#64748b' }}>
                        Aucun encadrant chargé.
                      </td>
                    </tr>
                  ) : (
                    enseignantsTriés.map((e, rowIndex) => {
                      const mk = matriculeKey(e.matricule);
                      const actifs = mk ? getEncadrantGroupCount()[mk] || 0 : 0;
                      const max = getEncadrantMaxGroupes(e);
                      const plafondAtteint = max >= 1 && actifs >= max;
                      return (
                        <tr
                          key={`plafond-${rowIndex}-${mk || rowIndex}`}
                          title={plafondAtteint ? 'Plafond de groupes PFE atteint' : undefined}
                          style={
                            plafondAtteint
                              ? {
                                  backgroundColor: '#e2e8f0',
                                  color: '#475569',
                                }
                              : undefined
                          }
                        >
                          <td>{e.matricule}</td>
                          <td>{e.nom}</td>
                          <td>{e.prenom}</td>
                          <td>
                            <span
                              style={{
                                fontWeight: 600,
                                color: plafondAtteint ? '#64748b' : '#0f172a',
                              }}
                            >
                              {actifs}/{max}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            marginBottom: '20px', 
            borderBottom: '2px solid #e2e8f0', 
            paddingBottom: '10px' 
          }}>
            <button
              className="btn"
              type="button"
              onClick={() => setActiveTab('liste')}
              style={{
                backgroundColor: activeTab === 'liste' ? '#3b82f6' : '#f8fafc',
                color: activeTab === 'liste' ? 'white' : '#475569',
                border: '1px solid #cbd5e1',
                padding: '10px 16px'
              }}
            >
              📋 Liste des PFE
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => setActiveTab('kanban')}
              style={{
                backgroundColor: activeTab === 'kanban' ? '#3b82f6' : '#f8fafc',
                color: activeTab === 'kanban' ? 'white' : '#475569',
                border: '1px solid #cbd5e1',
                padding: '10px 16px'
              }}
            >
              📊 Tableau Kanban
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => setActiveTab('capacites')}
              style={{
                backgroundColor: activeTab === 'capacites' ? '#3b82f6' : '#f8fafc',
                color: activeTab === 'capacites' ? 'white' : '#475569',
                border: '1px solid #cbd5e1',
                padding: '10px 16px'
              }}
            >
              ⚙️ Capacité et enseignant
            </button>
          </div>

          {/* Statistiques des assignations */}
          <div className="stats-card">
            <h3>📊 État des Assignations</h3>
            {/* Affiche les statistiques principales: PFEs sans encadrant, avec encadrant, encadrants disponibles */}
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">PFEs sans encadrant:</span>
                <span className="stat-value">{getEncadrantStats().pfesWithoutEncadrant}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">PFEs avec encadrant:</span>
                <span className="stat-value">{getEncadrantStats().pfesWithEncadrant}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Encadrants disponibles:</span>
                <span className="stat-value">{getEncadrantStats().availableEncadrants}/{getEncadrantStats().totalEncadrants}</span>
              </div>
            </div>
          </div>

          {/* Système d'onglets avec 3 vues: Liste, Kanban, Capacités */}
          {activeTab === 'liste' && (
            // === ONGLET 1: VUE LISTE ===
            // Affiche la liste des PFEs filtrés dans un tableau avec options d'édition/suppression
            <div className="table-card">
              <div className="card-header">
                <h3>PFE</h3>
              </div>
              <PFEsTable
                pfes={filteredPFEs}
                onEdit={handleOpenForm}
                onDelete={handleDeletePFE}
                onRandomAssign={handleRandomAssignEncadrant}
                enseignants={enseignants || []}
                encadrantGroupCount={getEncadrantGroupCount()}
                getEncadrantMaxGroupes={getEncadrantMaxGroupes}
              />
            </div>
          )}

          {activeTab === 'kanban' && (
            // === ONGLET 2: VUE KANBAN ===
            // Affiche les PFEs organisés par encadrant dans des colonnes (style tableau Kanban)
            <div className="table-card">
              <div className="card-header">
                <h3>🎯 Vue Kanban - Affectation des PFEs par Encadrant</h3>
              </div>
              <AffectationKanban
                pfes={pfes || []}
                enseignants={enseignants || []}
                onAssign={handleAssignEncadrant}
                getEncadrantMaxGroupes={getEncadrantMaxGroupes}
                getEncadrantGroupCount={getEncadrantGroupCount}
              />
            </div>
          )}

          {activeTab === 'capacites' && (
            // === ONGLET 3: GESTION DES CAPACITÉS ===
            // Permet de définir le plafond de groupes PFE pour chaque enseignant individuellement
            <div className="table-card">
              <div className="card-header">
                <h3>⚙️ Capacités & Enseignants</h3>
              </div>
              <div style={{ padding: '20px' }}>
                <h4>Capacités Individuelles des Enseignants</h4>
                <table className="table" style={{ marginTop: '15px', width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Matricule</th>
                      <th>Nom</th>
                      <th>Prénom</th>
                      <th>Groupes (Actifs / Plafond)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enseignantsTriés.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
                          Aucun encadrant chargé.
                        </td>
                      </tr>
                    ) : (
                      enseignantsTriés.map((e, rowIndex) => {
                        const mk = matriculeKey(e.matricule);
                        const actifs = mk ? getEncadrantGroupCount()[mk] || 0 : 0;
                        const max = getEncadrantMaxGroupes(e);
                        const plafondAtteint = max >= 1 && actifs >= max;
                        return (
                          <tr
                            key={`plafond-${rowIndex}-${mk || rowIndex}`}
                            title={plafondAtteint ? 'Plafond de groupes PFE atteint' : undefined}
                            style={
                              plafondAtteint
                                ? {
                                    backgroundColor: '#e2e8f0',
                                    color: '#475569',
                                  }
                                : undefined
                            }
                          >
                            <td>{e.matricule}</td>
                            <td>{e.nom}</td>
                            <td>{e.prenom}</td>
                            <td style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span
                                style={{
                                  fontWeight: 600,
                                  color: plafondAtteint ? '#64748b' : '#0f172a',
                                }}
                              >
                                {actifs}/{max}
                              </span>
                              <input
                                type="number"
                                min=""
                                max="99"
                                value={
                                  capacitesEdits[mk] !== undefined
                                    ? capacitesEdits[mk]
                                    : (e?.plafond_pfe ?? '')
                                }
                                onChange={(ev) => handleChangeCapacite(mk, ev.target.value)}
                                placeholder="Auto"
                                style={{ width: '80px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                              />
                              <button
                                className="btn"
                                onClick={() => handleSaveCapacite(mk)}
                                disabled={savingCapacites[mk]}
                                style={{ padding: '6px 10px' }}
                              >
                                {savingCapacites[mk] ? '...' : 'Enregistrer'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* === FORMULAIRE D'ÉDITION DE PFE ===
          Affiche le formulaire de création/édition d'un PFE lorsque showForm est true.
          Permet de modifier les informations du PFE: sujet, durée, spécialité, encadrant, étudiants.
      */}
      {showForm && (
        <PFEForm
          pfe={selectedPFE}
          pfes={pfes || []}
          enseignants={enseignants || []}
          etudiants={etudiants || []}
          specialites={specialites || []}
          licences={licences || []}
          jurys={[]}
          onCancel={handleCloseForm}
          onSubmit={handleSavePFE}
        />
      )}
    </div>
  );
}

export default function GestionPFEsWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <GestionPFEs />
    </ErrorBoundary>
  );
}
