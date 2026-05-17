import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import PFEsTable from '../components/PFEsTable';
import PFEForm from '../components/PFEForm';
import AffectationKanban from '../components/AffectationKanban';
import './GestionEtudiants.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

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

function clampPlafondInput(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 5;
  return Math.min(99, Math.max(1, Math.floor(x)));
}

/** Clé stable pour matricule (évite collisions number/string et undefined partagé). */
function matriculeKey(m) {
  if (m === null || m === undefined) return '';
  if (typeof m === 'object') return '';
  return String(m).trim();
}

function GestionPFEs() {
  const [pfes, setPFEs] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [selectedPFE, setSelectedPFE] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('Tous les champs');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('liste');
  /** Plafond global (tous les encadrants) — même valeur que sur le serveur après chargement / enregistrement. */
  const [plafondGroupes, setPlafondGroupes] = useState(5);
  const lastSavedPlafondRef = useRef(5);
  const [savingPlafond, setSavingPlafond] = useState(false);
  
  const [myPlafond, setMyPlafond] = useState('');
  const [savingMyPlafond, setSavingMyPlafond] = useState(false);
  
  const pfeFileRef = useRef(null);

  const role = localStorage.getItem('role');

  const getEncadrantMaxGroupes = useCallback(
    (matriculeOrEnseignant) => {
      const ens =
        typeof matriculeOrEnseignant === 'object'
          ? matriculeOrEnseignant
          : enseignants.find((e) => e.matricule === matriculeOrEnseignant);

      if (ens && ens.plafond_pfe != null && ens.plafond_pfe !== '') {
        return clampPlafondInput(ens.plafond_pfe);
      }
      return clampPlafondInput(plafondGroupes);
    },
    [plafondGroupes, enseignants]
  );

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [pfeRes, enseignantRes, etudiantRes, specRes, paramRes] = await Promise.all([
        axios.get('/api/pfes/'),
        axios.get('/api/enseignants/'),
        axios.get('/api/etudiants/'),
        axios.get('/api/specialites/'),
        axios.get('/api/pfes/parametres/').catch(() => ({ data: { plafond_groupes: 5 } })),
      ]);

      setPFEs(Array.isArray(pfeRes.data) ? pfeRes.data : []);
      const ensRaw = Array.isArray(enseignantRes.data) ? enseignantRes.data : [];
      setEnseignants(
        ensRaw.map((row) =>
          row && typeof row === 'object'
            ? {
                ...row,
                matricule:
                  row.matricule != null && typeof row.matricule !== 'object'
                    ? String(row.matricule).trim()
                    : row.matricule,
              }
            : row
        )
      );
      setEtudiants(Array.isArray(etudiantRes.data) ? etudiantRes.data : []);
      setSpecialites(Array.isArray(specRes.data) ? specRes.data : []);
      const pg = clampPlafondInput(paramRes?.data?.plafond_groupes ?? 5);
      setPlafondGroupes(pg);
      lastSavedPlafondRef.current = pg;

      if (role === 'enseignant' && ensRaw.length === 1) {
        const p = ensRaw[0]?.plafond_pfe;
        setMyPlafond(p != null ? String(p) : '');
      }
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Impossible de charger les données. Vérifiez que le backend est disponible.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getEncadrantGroupCount = () => {
    const count = {};
    pfes.forEach((p) => {
      if (p.encadrant != null && p.encadrant !== '') {
        const k = matriculeKey(p.encadrant);
        if (k) count[k] = (count[k] || 0) + 1;
      }
    });
    return count;
  };

  const getEncadrantStats = () => {
    const totalPfes = pfes?.length || 0;
    const pfesWithEncadrant = pfes?.filter(p => p?.encadrant)?.length || 0;
    const pfesWithoutEncadrant = totalPfes - pfesWithEncadrant;

    const encadrantCount = getEncadrantGroupCount();
    const totalEncadrants = enseignants?.length || 0;
    const availableEncadrants =
      enseignants?.filter((e) => {
        const k = matriculeKey(e?.matricule);
        const used = k ? encadrantCount[k] || 0 : 0;
        return used < getEncadrantMaxGroupes(e.matricule);
      })?.length || 0;

    return {
      totalPfes,
      pfesWithEncadrant,
      pfesWithoutEncadrant,
      totalEncadrants,
      availableEncadrants
    };
  };

  const safePFEs = Array.isArray(pfes) ? pfes : [];
  const filteredPFEs = safePFEs.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();

    switch (filterBy) {
      case 'ID PFE':
        return String(item?.idPfe || '').toLowerCase().includes(term);
      case 'Sujet':
        return String(item?.sujet || '').toLowerCase().includes(term);
      case 'Type de projet':
        return String(item?.type_projet || '').toLowerCase().includes(term);
      case 'Spécialité':
        return String(item?.specialite || '').toLowerCase().includes(term);
      case 'Encadrant':
        return String(item?.encadrant_detail?.nom || '').toLowerCase().includes(term) ||
          String(item?.encadrant_detail?.prenom || '').toLowerCase().includes(term);
      case 'Type contrat enc.':
        return String(item?.encadrant_detail?.typeContrat || '').toLowerCase().includes(term);
      default:
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

  const handleOpenForm = (pfe = null) => {
    setSelectedPFE(pfe);
    setShowForm(true);
    setError('');
    setMessage('');
  };

  const handleCloseForm = () => {
    setSelectedPFE(null);
    setShowForm(false);
  };

  const handleSavePFE = async (data) => {
    try {
      const payload = {
        sujet: data.sujet,
        duree: data.duree,
        specialite: data.specialite,
        type_projet: data.typeProjet,
        encadrant: data.encadrant,
        etudiants: data.etudiants,
        lieu_stage: data.lieu_stage,
      };

      if (data.idPfe) {
        await axios.put(`/api/pfes/${data.idPfe}/`, payload);
        setMessage('PFE modifié avec succès.');
      } else {
        await axios.post('/api/pfes/', payload);
        setMessage('PFE créé avec succès.');
      }

      handleCloseForm();
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.errors || 'Erreur lors de l\'enregistrement.');
    }
  };

  const handleDeletePFE = async (idPfe) => {
    if (!window.confirm('Supprimer ce PFE ?')) return;
    try {
      await axios.delete(`/api/pfes/${idPfe}/`);
      setMessage('PFE supprimé avec succès.');
      setPFEs((prev) => prev.filter((item) => item.idPfe !== idPfe));
    } catch (err) {
      setError('Impossible de supprimer le PFE.');
    }
  };

  const handleRandomAssignEncadrant = async (pfe) => {
    console.log('=== Début assignation aléatoire ===');
    console.log('PFE complet:', JSON.stringify(pfe, null, 2));
    console.log('Enseignants disponibles:', enseignants);
    console.log('PFEs actuels:', pfes);

    if (!enseignants || enseignants.length === 0) {
      setError('Aucun encadrant disponible.');
      console.error('Erreur: Pas d\'enseignants');
      return;
    }

    // Compter les PFEs par encadrant (en EXCLUANT le PFE actuel)
    const encadrantCount = {};
    pfes.forEach((p) => {
      if (p.idPfe !== pfe.idPfe && p.encadrant != null && p.encadrant !== '') {
        const k = matriculeKey(p.encadrant);
        if (k) encadrantCount[k] = (encadrantCount[k] || 0) + 1;
      }
    });

    console.log('Comptage des encadrants (PFE actuel EXCLU):', encadrantCount);

    const availableEncadrants = enseignants.filter((enseignant) => {
      const k = matriculeKey(enseignant.matricule);
      const count = k ? encadrantCount[k] || 0 : 0;
      const cap = getEncadrantMaxGroupes(enseignant.matricule);
      const isAvailable = count < cap;
      console.log(`${enseignant.nom} : ${count}/${cap} groupes -> Disponible: ${isAvailable}`);
      return isAvailable;
    });

    console.log('Encadrants disponibles:', availableEncadrants);

    if (availableEncadrants.length === 0) {
      setError('Aucun encadrant disponible (plafond de groupes atteint pour tous).');
      console.error('Erreur: plafonds atteints');
      return;
    }

    // Sélectionner aléatoirement un encadrant disponible
    const randomIndex = Math.floor(Math.random() * availableEncadrants.length);
    const randomEncadrant = availableEncadrants[randomIndex];

    console.log('Encadrant aléatoire sélectionné:', randomEncadrant);

    try {
      // Extraire les IDs des étudiants depuis le PFE
      // L'API retourne pfe.etudiants comme tableau d'IDs numériques
      let studentIds = [];

      if (Array.isArray(pfe.etudiants) && pfe.etudiants.length > 0) {
        // Si ce sont des objets, extraire l'ID
        studentIds = pfe.etudiants.map(student =>
          typeof student === 'object' ? (student.numEtudiant || student.idEtudiant || student.id) : student
        );
      }

      console.log('PFE original:', pfe);
      console.log('Étudiants du PFE:', pfe.etudiants);
      console.log('IDs des étudiants extraits:', studentIds);

      // Construire le payload
      const payload = {
        sujet: pfe.sujet,
        duree: pfe.duree,
        specialite: pfe.specialite,
        encadrant: randomEncadrant.matricule,
        etudiants: studentIds.length > 0 ? studentIds : pfe.etudiants || [],
      };

      console.log('Payload final à envoyer:', JSON.stringify(payload, null, 2));

      const response = await axios.put(`/api/pfes/${pfe.idPfe}/`, payload);
      console.log('Réponse API (succès):', response);

      const kR = matriculeKey(randomEncadrant.matricule);
      const currentCount = kR ? encadrantCount[kR] || 0 : 0;
      const cap = getEncadrantMaxGroupes(randomEncadrant.matricule);
      setMessage(
        `✅ Encadrant aléatoire assigné : ${randomEncadrant.nom} ${randomEncadrant.prenom} (${currentCount + 1}/${cap} groupes)`
      );
      setError('');
      loadData();
    } catch (err) {
      console.error('ERREUR COMPLÈTE:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        requestData: err.config?.data
      });

      const errorDetail = err.response?.data?.detail
        || err.response?.data?.errors
        || err.response?.data;

      setError(`Erreur ${err.response?.status || 'inconnue'}: ${JSON.stringify(errorDetail)}`);
    }
  };

  const handleBulkRandomAssign = async () => {
    console.log('=== Début assignation globale aléatoire ===');

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
    console.log(`PFEs sans encadrant: ${pfesWithoutEncadrant.length}`);

    if (pfesWithoutEncadrant.length === 0) {
      setMessage('✅ Tous les PFEs ont déjà un encadrant assigné.');
      return;
    }

    // Compter les PFEs actuels par encadrant
    const encadrantCount = {};
    pfes.forEach((p) => {
      if (p.encadrant != null && p.encadrant !== '') {
        const k = matriculeKey(p.encadrant);
        if (k) encadrantCount[k] = (encadrantCount[k] || 0) + 1;
      }
    });

    console.log('Comptage actuel des encadrants:', encadrantCount);

    // Trier les PFEs sans encadrant par priorité (ceux avec plus d'étudiants d'abord)
    const sortedPfes = [...pfesWithoutEncadrant].sort((a, b) => {
      const aStudents = Array.isArray(a.etudiants) ? a.etudiants.length : 0;
      const bStudents = Array.isArray(b.etudiants) ? b.etudiants.length : 0;
      return bStudents - aStudents; // Plus d'étudiants = priorité plus haute
    });

    let assignedCount = 0;
    let skippedCount = 0;
    const assignmentResults = [];

    // Assigner les encadrants aux PFEs un par un
    for (const pfe of sortedPfes) {
      const availableEncadrants = enseignants.filter((enseignant) => {
        const mk = matriculeKey(enseignant.matricule);
        const count = mk ? encadrantCount[mk] || 0 : 0;
        return count < getEncadrantMaxGroupes(enseignant.matricule);
      });

      if (availableEncadrants.length === 0) {
        console.log(`Aucun encadrant disponible pour le PFE ${pfe.idPfe}`);
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

        assignmentResults.push(`${pfe.idPfe} → ${randomEncadrant.nom} ${randomEncadrant.prenom}`);
        assignedCount++;

        console.log(`Assigné: PFE ${pfe.idPfe} → ${randomEncadrant.nom} ${randomEncadrant.prenom}`);

      } catch (err) {
        console.error(`Erreur lors de l'assignation du PFE ${pfe.idPfe}:`, err);
        skippedCount++;
      }
    }

    // Recharger les données
    await loadData();

    // Message de résultat
    if (assignedCount > 0) {
      setMessage(`✅ Assignation globale terminée: ${assignedCount} PFE(s) assigné(s)${skippedCount > 0 ? `, ${skippedCount} ignoré(s)` : ''}`);
      setError('');
      console.log('Résultats d\'assignation:', assignmentResults);
    } else {
      setError('❌ Aucun PFE n\'a pu être assigné (capacité maximale atteinte pour tous les encadrants).');
    }
  };

  const handleReassignAllEncadrants = async () => {
    if (!window.confirm('⚠️ ATTENTION: Cette action va réassigner TOUS les encadrants de manière aléatoire. Tous les PFEs perdront leur encadrant actuel. Voulez-vous continuer ?')) {
      return;
    }

    console.log('=== Réassignation complète de tous les encadrants ===');

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

    // D'abord, retirer tous les encadrants (mettre à null)
    for (const pfe of pfes) {
      try {
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
          encadrant: null, // Retirer l'encadrant
          etudiants: studentIds.length > 0 ? studentIds : pfe.etudiants || [],
        };

        await axios.put(`/api/pfes/${pfe.idPfe}/`, payload);
        console.log(`Encadrant retiré du PFE ${pfe.idPfe}`);
      } catch (err) {
        console.error(`Erreur lors du retrait de l'encadrant du PFE ${pfe.idPfe}:`, err);
      }
    }

    // Maintenant assigner aléatoirement
    const encadrantCount = {}; // Reset du comptage

    for (const pfe of sortedPfes) {
      const availableEncadrants = enseignants.filter((enseignant) => {
        const mk = matriculeKey(enseignant.matricule);
        const count = mk ? encadrantCount[mk] || 0 : 0;
        return count < getEncadrantMaxGroupes(enseignant.matricule);
      });

      if (availableEncadrants.length === 0) {
        console.log(`Aucun encadrant disponible pour le PFE ${pfe.idPfe}`);
        skippedCount++;
        continue;
      }

      const randomIndex = Math.floor(Math.random() * availableEncadrants.length);
      const randomEncadrant = availableEncadrants[randomIndex];

      try {
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

        const rk = matriculeKey(randomEncadrant.matricule);
        if (rk) encadrantCount[rk] = (encadrantCount[rk] || 0) + 1;

        assignmentResults.push(`${pfe.idPfe} → ${randomEncadrant.nom} ${randomEncadrant.prenom}`);
        assignedCount++;

        console.log(`Réassigné: PFE ${pfe.idPfe} → ${randomEncadrant.nom} ${randomEncadrant.prenom}`);

      } catch (err) {
        console.error(`Erreur lors de la réassignation du PFE ${pfe.idPfe}:`, err);
        skippedCount++;
      }
    }

    await loadData();

    if (assignedCount > 0) {
      setMessage(`🔄 Réassignation complète terminée: ${assignedCount} PFE(s) réassigné(s)${skippedCount > 0 ? `, ${skippedCount} ignoré(s)` : ''}`);
      setError('');
      console.log('Résultats de réassignation:', assignmentResults);
    } else {
      setError('❌ Aucun PFE n\'a pu être réassigné.');
    }
  };

  const enseignantsTriés = [...(enseignants || [])].sort((a, b) =>
    String(a.nom || '').localeCompare(String(b.nom || ''), 'fr', { sensitivity: 'base' }) ||
    String(a.prenom || '').localeCompare(String(b.prenom || ''), 'fr', { sensitivity: 'base' })
  );

  const plafondDirty =
    clampPlafondInput(plafondGroupes) !== clampPlafondInput(lastSavedPlafondRef.current);

  const handleSavePlafondGlobal = async () => {
    setSavingPlafond(true);
    setError('');
    try {
      const cible = clampPlafondInput(plafondGroupes);
      const { data } = await axios.patch('/api/pfes/parametres/', { plafond_groupes: cible });
      const v = clampPlafondInput(data?.plafond_groupes ?? cible);
      setPlafondGroupes(v);
      lastSavedPlafondRef.current = v;
      setMessage('Plafond global enregistré.');
    } catch (err) {
      const d = err.response?.data;
      const msg =
        (typeof d === 'string' && d) ||
        d?.detail ||
        d?.plafond_groupes ||
        (d && typeof d === 'object' ? JSON.stringify(d) : null) ||
        "Erreur lors de l'enregistrement du plafond.";
      setError(msg);
    } finally {
      setSavingPlafond(false);
    }
  };

  const handleSaveMyPlafond = async () => {
    if (!enseignants || enseignants.length === 0) return;
    const currentTeacher = enseignants[0];
    
    setSavingMyPlafond(true);
    setError('');
    setMessage('');
    
    try {
      const val = myPlafond === '' ? null : parseInt(myPlafond, 10);
      await axios.patch(`/api/enseignants/${currentTeacher.matricule}/`, { plafond_pfe: val });
      setMessage("Votre capacité d'encadrement a été mise à jour.");
      await loadData();
    } catch (err) {
      setError("Erreur lors de l'enregistrement de votre capacité.");
    } finally {
      setSavingMyPlafond(false);
    }
  };

  const handleImportExcel = () => {
    pfeFileRef.current?.click();
  };

  const handleAssignKanban = async (pfeId, matricule) => {
    try {
      const pfe = pfes.find((p) => p.idPfe === pfeId);
      if (!pfe) return;

      let studentIds = [];
      if (Array.isArray(pfe.etudiants) && pfe.etudiants.length > 0) {
        studentIds = pfe.etudiants.map(student =>
          typeof student === 'object' ? (student.numEtudiant || student.idEtudiant || student.id) : student
        );
      }

      await axios.put(`/api/pfes/${pfe.idPfe}/`, {
        ...pfe,
        encadrant: matricule, // null to unassign
        etudiants: studentIds.length > 0 ? studentIds : pfe.etudiants || [],
      });

      setMessage(`PFE ${pfeId} ${matricule ? `assigné à ${matricule}` : 'désassigné'}.`);
      setError('');
      loadData();
    } catch (err) {
      setError(`Erreur lors de l'assignation du PFE ${pfeId}.`);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/pfes/import-excel/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(`Import réussi : ${response.data.created.length} PFE(s) ajoutés.`);
      setError('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.errors || err.response?.data?.detail || 'Erreur d\'import Excel.');
    } finally {
      event.target.value = null;
    }
  };

  return (
    <div className="main-container">
      <h2 className="page-title">Affectation PFE</h2>
      {message && <div className="success-message">{message}</div>}
      {error && <div className="success-message" style={{ background: '#e53e3e' }}>{JSON.stringify(error)}</div>}

      <div className="tabs-container" style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        <button
          className={`btn ${activeTab === 'liste' ? '' : 'btn-secondary'}`}
          style={{ backgroundColor: activeTab === 'liste' ? '#2563eb' : '#f8fafc', color: activeTab === 'liste' ? 'white' : '#475569', border: '1px solid #cbd5e1' }}
          onClick={() => setActiveTab('liste')}
        >
          📋 Liste des PFE
        </button>
        <button
          className={`btn ${activeTab === 'kanban' ? '' : 'btn-secondary'}`}
          style={{ backgroundColor: activeTab === 'kanban' ? '#2563eb' : '#f8fafc', color: activeTab === 'kanban' ? 'white' : '#475569', border: '1px solid #cbd5e1' }}
          onClick={() => setActiveTab('kanban')}
        >
          🗂️ Tableau Kanban
        </button>
        {role !== 'enseignant' && (
          <button
            className={`btn ${activeTab === 'capacites' ? '' : 'btn-secondary'}`}
            style={{ backgroundColor: activeTab === 'capacites' ? '#2563eb' : '#f8fafc', color: activeTab === 'capacites' ? 'white' : '#475569', border: '1px solid #cbd5e1' }}
            onClick={() => setActiveTab('capacites')}
          >
            ⚙️ Capacités & Enseignants
          </button>
        )}
      </div>

      {activeTab === 'liste' && (
        <div className="page-container">
        <div className="search-area">
          <select className="filter-select" value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
            <option>Tous les champs</option>
            <option>ID PFE</option>
            <option>Sujet</option>
            <option>Type de projet</option>
            <option>Spécialité</option>
            <option>Encadrant</option>
            <option>Type contrat enc.</option>
          </select>
          <input
            type="text"
            placeholder="Rechercher..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="buttons-area">
          <button className="btn" type="button" onClick={() => handleOpenForm(null)}>
            Ajouter un PFE
          </button>
          <button className="btn import-btn" type="button" onClick={handleImportExcel}>
            Importer PFE
          </button>
          <button
            className="btn bulk-assign-btn"
            type="button"
            onClick={handleBulkRandomAssign}
            title="Assigner automatiquement des encadrants aux PFEs qui n'en ont pas"
          >
            🔄 Assigner Encadrants (Auto)
          </button>
          <button
            className="btn reassign-btn"
            type="button"
            onClick={handleReassignAllEncadrants}
            title="Réassigner tous les encadrants de manière aléatoire"
          >
            🔄 Réassigner Tous
          </button>
          <input type="file" accept=".xlsx,.xls" ref={pfeFileRef} onChange={handleFileChange} style={{ display: 'none' }} />
        </div>
        </div>
      )}

      {loading ? (
        <div className="table-card">Chargement en cours...</div>
      ) : (
        <>
          {activeTab === 'capacites' && role !== 'enseignant' && (
            <div className="stats-card">
            {role !== 'enseignant' && (
              <>
                <h3>Plafond global de groupes PFE (tous les encadrants)</h3>
                <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#64748b' }}>
                  Le même plafond s’applique à chaque encadrant par défaut. Vous pouvez cependant définir un plafond individuel par enseignant dans le tableau ci-dessous.
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
              </>
            )}
            <div style={{ maxHeight: '320px', overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Matricule</th>
                    <th>Nom</th>
                    <th>Prénom</th>
                    {role !== 'enseignant' && <th>Plafond Indiv.</th>}
                    <th style={{ width: '100px' }}>Actifs</th>
                  </tr>
                </thead>
                <tbody>
                  {enseignantsTriés.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ color: '#64748b' }}>
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
                          {role !== 'enseignant' && (
                            <td>
                              <input
                                type="number"
                                min={1}
                                max={99}
                                defaultValue={e.plafond_pfe || ''}
                                placeholder="Global"
                                style={{ width: '70px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                onBlur={async (ev) => {
                                  const val = ev.target.value === '' ? null : parseInt(ev.target.value, 10);
                                  if (val === e.plafond_pfe) return;
                                  try {
                                    await axios.patch(`/api/enseignants/${e.matricule}/`, { plafond_pfe: val });
                                    setMessage(`Plafond de ${e.nom} ${e.prenom} mis à jour.`);
                                    loadData();
                                  } catch (err) {
                                    setError(`Erreur lors de la mise à jour pour ${e.nom}`);
                                  }
                                }}
                              />
                            </td>
                          )}
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
          )}

          {activeTab === 'kanban' && (
            <>
              {/* Statistiques des assignations */}
              <div className="stats-card">
                <h3>📊 État des Assignations</h3>
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

              <div className="table-card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                  <h3>Affectation Kanban (Glisser-Déposer)</h3>
                </div>
                <AffectationKanban
                  pfes={filteredPFEs}
                  enseignants={enseignantsTriés}
                  onAssign={handleAssignKanban}
                  getEncadrantMaxGroupes={getEncadrantMaxGroupes}
                  getEncadrantGroupCount={getEncadrantGroupCount}
                />
              </div>
            </>
          )}

          {activeTab === 'liste' && (
            <div className="table-card">
              <div className="card-header">
                <h3>PFE</h3>
                <div className="button-group">
                  <button className="btn" type="button" onClick={() => handleOpenForm(null)}>
                    Ajouter un PFE
                  </button>
                  <button className="btn import-btn" type="button" onClick={handleImportExcel}>
                    Importer PFE
                  </button>
                </div>
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
        </>
      )}

      {showForm && (
        <PFEForm
          pfe={selectedPFE}
          pfes={pfes || []}
          enseignants={enseignants || []}
          jurys={[]}
          etudiants={etudiants || []}
          specialites={specialites || []}
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