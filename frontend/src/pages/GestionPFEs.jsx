import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import PFEsTable from '../components/PFEsTable';
import PFEForm from '../components/PFEForm';
import MultiSelectDropdown from "../components/MultiSelectDropdown";
import { parseFile } from "../utils/fileParser";
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
          <h2 className="page-title">Erreur dans Affectation PFE</h2>
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
  const [filterBy, setFilterBy] = useState(['Tous les champs']);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const pfeFileRef = useRef(null);
  const [plafondGroupes, setPlafondGroupes] = useState(5);
  const lastSavedPlafondRef = useRef(5);
  const [savingPlafond, setSavingPlafond] = useState(false);

  const getEncadrantMaxGroupes = useCallback(
    (_matriculeOrEnseignant) => {
      const ens = typeof _matriculeOrEnseignant === 'object' ? _matriculeOrEnseignant : enseignants.find(e => e.matricule === _matriculeOrEnseignant);
      if (ens && ens.plafond_pfe !== undefined && ens.plafond_pfe !== null && ens.plafond_pfe !== "") {
        return clampPlafondInput(ens.plafond_pfe);
      }
      return clampPlafondInput(plafondGroupes);
    },
    [enseignants, plafondGroupes]
  );

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [pfeRes, enseignantRes, etudiantRes, paramRes, specRes] = await Promise.all([
        axios.get('/api/pfes/'),
        axios.get('/api/enseignants/'),
        axios.get('/api/etudiants/'),
        axios.get('/api/pfes/parametres/').catch(() => ({ data: { plafond_groupes: 5 } })),
        axios.get('/api/specialites/').catch(() => ({ data: [] })),
      ]);

      setPFEs(Array.isArray(pfeRes.data) ? pfeRes.data : (pfeRes.data?.results || []));
      const ensRaw = Array.isArray(enseignantRes.data) ? enseignantRes.data : (enseignantRes.data?.results || []);
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
      setEtudiants(Array.isArray(etudiantRes.data) ? etudiantRes.data : (etudiantRes.data?.results || []));
      setSpecialites(Array.isArray(specRes.data) ? specRes.data : (specRes.data?.results || []));
      const pg = clampPlafondInput(paramRes?.data?.plafond_groupes ?? 5);
      setPlafondGroupes(pg);
      lastSavedPlafondRef.current = pg;
      setSpecialites(Array.isArray(specRes.data) ? specRes.data : (specRes.data?.results || []));
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

    if (filterBy.includes('Tous les champs')) {
      return (
        String(item?.idPfe || '').toLowerCase().includes(term) ||
        String(item?.sujet || '').toLowerCase().includes(term) ||
        String(item?.specialite || '').toLowerCase().includes(term) ||
        String(item?.lieu_stage || '').toLowerCase().includes(term) ||
        String(item?.encadrant_detail?.nom || '').toLowerCase().includes(term) ||
        String(item?.encadrant_detail?.prenom || '').toLowerCase().includes(term) ||
        String(item?.encadrant_detail?.typeContrat || '').toLowerCase().includes(term)
      );
    } else {
      return filterBy.some(field => {
        switch (field) {
          case 'ID PFE':
            return String(item?.idPfe || '').toLowerCase().includes(term);
          case 'Sujet':
            return String(item?.sujet || '').toLowerCase().includes(term);
          case 'Spécialité':
            return String(item?.specialite || '').toLowerCase().includes(term);
          case 'Lieu de stage':
            return String(item?.lieu_stage || '').toLowerCase().includes(term);
          case 'Encadrant':
            return String(item?.encadrant_detail?.nom || '').toLowerCase().includes(term) ||
              String(item?.encadrant_detail?.prenom || '').toLowerCase().includes(term);
          case 'Type contrat enc.':
            return String(item?.encadrant_detail?.typeContrat || '').toLowerCase().includes(term);
          default:
            return false;
        }
      });
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
        lieu_stage: data.lieu_stage,
        specialite: data.specialite,
        encadrant: data.encadrant,
        etudiants: data.etudiants,
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
      const d = err.response?.data;
      const msg =
        (typeof d === 'string' && d) ||
        d?.detail ||
        d?.errors ||
        (d && typeof d === 'object' ? Object.values(d).flat().join(' | ') : null) ||
        "Erreur lors de l'enregistrement.";
      setError(msg);
    }
  };

  const handleDeletePFE = async (idPfe) => {
    if (!window.confirm('Supprimer ce PFE ?')) return;
    try {
      await axios.delete(`/api/pfes/${idPfe}/`);
      setMessage('PFE supprimé avec succès.');
      setPFEs((prev) => prev.filter((item) => item.idPfe !== idPfe));
    } catch (err) {
      setError(err.response?.data?.detail || "Impossible de supprimer le PFE.");
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

  const plafondDirty = clampPlafondInput(plafondGroupes) !== clampPlafondInput(lastSavedPlafondRef.current);

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
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError("Erreur lors de l'enregistrement du plafond global.");
    } finally {
      setSavingPlafond(false);
    }
  };

  const handleUpdateTeacherPlafond = async (matricule, newValue) => {
    try {
      const val = newValue === "" || newValue === null ? null : clampPlafondInput(newValue);
      await axios.patch(`/api/enseignants/${matricule}/`, { plafond_pfe: val });
      setEnseignants(prev => prev.map(e => e.matricule === matricule ? { ...e, plafond_pfe: val } : e));
      setMessage(`Capacité mise à jour pour l'enseignant.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la mise à jour de la capacité d'encadrement.");
    }
  };

  const handleImportExcel = () => {
    pfeFileRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const jsonData = await parseFile(file);

      const normalizeHeader = (header) =>
        String(header)
          .trim()
          .toLowerCase()
          .replace(/\s+/g, " ")
          .replace(/[^a-z0-9 ]/g, "");

      const importedData = jsonData.map(row => {
        return Object.keys(row).reduce((acc, key) => {
          const normKey = normalizeHeader(key);
          let finalKey = normKey;
          if (normKey === 'sujet' || normKey === 'titre') finalKey = 'sujet';
          if (normKey === 'specialite' || normKey === 'spécialité') finalKey = 'specialite';
          if (normKey === 'lieustage' || normKey === 'lieu de stage') finalKey = 'lieu_stage';
          
          acc[finalKey] = row[key];
          return acc;
        }, {});
      });

      if (!Array.isArray(importedData) || !importedData.length) {
        setError("Aucune donnée importable trouvée.");
        return;
      }

      let successCount = 0;
      for (const record of importedData) {
        try {
          if (record.etudiants && typeof record.etudiants === 'string') {
            record.etudiants = record.etudiants.split(';').map(id => Number(id.trim())).filter(id => !isNaN(id));
          }
          await axios.post('/api/pfes/', record);
          successCount++;
        } catch (itemErr) {
          console.error(`Erreur lors de l'import d'un PFE:`, itemErr);
        }
      }
      setMessage(`${successCount} PFE(s) importé(s) avec succès.`);
      setError('');
      loadData();
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'importation: " + (err.message || "Veuillez vérifier le format de vos données."));
    } finally {
      event.target.value = null;
    }
  };

  return (
    <div className="main-container">
      <h2 className="page-title">Affectation PFE</h2>
      {message && <div className="success-message">{message}</div>}
      {error && <div className="success-message" style={{ background: '#e53e3e' }}>{JSON.stringify(error)}</div>}

      <div className="page-container">
        <div className="search-area" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569' }}>Afficher/Chercher :</span>
            <MultiSelectDropdown
              label="Tous les champs sélectionnés"
              options={["Tous les champs", "ID PFE", "Sujet", "Lieu de stage", "Spécialité", "Encadrant", "Type contrat enc."]}
              selected={filterBy}
              onChange={setFilterBy}
            />
          </div>
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
          <input type="file" accept=".csv,.json,.xlsx,.xls" ref={pfeFileRef} onChange={handleFileChange} style={{ display: 'none' }} />
        </div>
      </div>

      {loading ? (
        <div className="table-card">Chargement en cours...</div>
      ) : (
        <>
          <div className="stats-card">
            <h3>Plafond global de groupes PFE</h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#64748b' }}>
              Le plafond par défaut. Si un enseignant n'a pas de capacité spécifique définie ci-dessous, ce plafond s'appliquera.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
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

            <h3 style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>Capacité d'encadrement individuelle</h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#64748b' }}>
              Définissez le nombre d'étudiants (ou groupes PFE) que chaque enseignant souhaite encadrer.
            </p>
            <div style={{ maxHeight: '320px', overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Matricule</th>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th style={{ width: '150px' }}>Capacité Max</th>
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
                                backgroundColor: '#f8fafc',
                              }
                              : undefined
                          }
                        >
                          <td>{e.matricule}</td>
                          <td>{e.nom}</td>
                          <td>{e.prenom}</td>
                          <td>
                            <input
                              type="number"
                              min={1}
                              max={99}
                              placeholder={plafondGroupes}
                              style={{ width: '80px', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                              value={e.plafond_pfe !== null && e.plafond_pfe !== undefined ? e.plafond_pfe : ''}
                              onChange={(ev) => {
                                const v = ev.target.value;
                                handleUpdateTeacherPlafond(e.matricule, v);
                              }}
                            />
                          </td>
                          <td>
                            <span
                              style={{
                                fontWeight: 600,
                                color: plafondAtteint ? '#ef4444' : '#10b981',
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
              filterBy={filterBy}
            />
          </div>
        </>
      )}

      {showForm && (() => {
        const encadrantCount = getEncadrantGroupCount();
        const availableEncadrants = enseignants.filter((e) => {
          if (selectedPFE && e.matricule === selectedPFE.encadrant) return true;
          const k = matriculeKey(e.matricule);
          const used = k ? encadrantCount[k] || 0 : 0;
          return used < clampPlafondInput(plafondGroupes);
        });

        return (
          <PFEForm
            pfe={selectedPFE}
            pfes={pfes || []}
            enseignants={availableEncadrants}
            etudiants={etudiants || []}
            specialites={specialites || []}
            onCancel={handleCloseForm}
            onSubmit={handleSavePFE}
          />
        );
      })()}
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