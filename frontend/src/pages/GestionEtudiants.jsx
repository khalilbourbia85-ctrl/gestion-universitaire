// Gestion des étudiants - Container component principal
import React, { useState, useEffect, useRef } from "react";
import axios from "../utils/axiosConfig";
import EtudiantsTable from "../components/EtudiantsTable";
import EtudiantForm from "../components/EtudiantForm";
import MultiSelectDropdown from "../components/MultiSelectDropdown";
import { parseFile } from "../utils/fileParser";
import useAcademicData from "../hooks/useAcademicData";
import "./GestionEtudiants.css";

function GestionEtudiants() {
  // === STATES ===
  const [etudiants, setEtudiants] = useState([]); // liste des étudiants
  const [selected, setSelected] = useState(null); // étudiant en édition
  const [showForm, setShowForm] = useState(false); // afficher formulaire?
  const [searchTerm, setSearchTerm] = useState(""); // texte recherche
  const [filterBy, setFilterBy] = useState(["Tous les champs"]); // champs recherche
  const [successMessage, setSuccessMessage] = useState(""); // msg succès
  const [error, setError] = useState(""); // msg erreur
  const [loading, setLoading] = useState(true); // en attente API?
  const [importPreview, setImportPreview] = useState(null); // aperçu import
  const [selectedEtudiants, setSelectedEtudiants] = useState(new Set()); // sélection multiple

  // Utiliser le hook pour licences et spécialités (auto-refresh 30s)
  const { licences, specialites, refresh: refreshAcademicData } = useAcademicData(30000);

  // Année universitaire par défaut selon mois courant
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const defaultYear = currentMonth >= 8 
    ? `${currentYear}/${currentYear + 1}` 
    : `${currentYear - 1}/${currentYear}`;
  const [anneeUniversitaire, setAnneeUniversitaire] = useState(defaultYear);

  // Années disponibles
  const yearOptions = ["2022/2023", "2023/2024", "2024/2025", "2025/2026", "2026/2027", "2027/2028", "2028/2029"];

  // Référence input file caché pour import
  const fileRef = useRef(null);

  // Charger UNIQUEMENT les étudiants (licences/specialites viennent du hook)
  const loadEtudiants = async () => {
    setLoading(true);
    setError("");

    try {
      const etRes = await axios.get("etudiants/?page_size=200");
      setEtudiants(Array.isArray(etRes.data) ? etRes.data : (etRes.data?.results || []));
    } catch (err) {
      const message = err.response?.data?.detail || err.response?.data?.error || err.message || "Erreur chargement";
      console.error("Erreur:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Exécuter au montage du composant
  useEffect(() => {
    loadEtudiants();
  }, []);

  // Créer ou modifier un étudiant
  const handleAddOrUpdate = async (etudiant) => {
    try {
      setError("");

      const payload = {
        ...etudiant,
        annee_universitaire: anneeUniversitaire
      };

      if (selected) {
        // Modification (PUT)
        await axios.put(`etudiants/${selected.idEtudiant}/`, payload);
        setSuccessMessage("✅ Étudiant modifié avec succès");
      } else {
        // Création (POST)
        await axios.post("etudiants/", payload);
        setSuccessMessage("✅ Étudiant ajouté avec succès");
      }

      await loadEtudiants();
      refreshAcademicData();
      setSelected(null);
      setShowForm(false);

      setTimeout(() => setSuccessMessage(""), 3000);

    } catch (err) {
      const responseData = err.response?.data;
      let errorMsg = "❌ Erreur lors de la sauvegarde";

      if (typeof responseData === 'string') {
        errorMsg = responseData;
      } else if (responseData?.detail) {
        errorMsg = typeof responseData.detail === 'string' ? responseData.detail : JSON.stringify(responseData.detail);
      } else if (responseData?.message) {
        errorMsg = responseData.message;
      } else if (responseData && typeof responseData === 'object') {
        errorMsg = Object.entries(responseData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
          .join(' | ');
      } else if (err.message) {
        errorMsg = err.message;
      }

      setError(errorMsg);
    }
  };

  // Déclencher le dialogue de fichier
  const handleImportClick = () => {
    fileRef.current.click();
  };

  // Ouvrir le formulaire
  const handleOpenForm = (etudiant = null) => {
    setSelected(etudiant);
    setShowForm(true);
    setSuccessMessage("");
  };

  // Fermer le formulaire
  const handleCloseForm = () => {
    setSelected(null);
    setShowForm(false);
  };

  // Import fichier Excel/CSV avec validation et mapping automatique
  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setError("❌ Veuillez sélectionner un fichier");
      return;
    }

    // Validation taille (max 100 MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`❌ Le fichier est trop volumineux (max 100 MB). Votre fichier: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      console.warn(`⚠️ Fichier volumineux: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    }

    // Validation format
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv', 'text/plain', 'application/octet-stream'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isValidExtension = ['xls', 'xlsx', 'csv'].includes(fileExtension);
    const isValidType = validTypes.includes(file.type) || isValidExtension;
    
    if (!isValidType) {
      setError(`❌ Format invalide. Acceptés: Excel 2007+ (.xlsx), Excel 1997-2003 (.xls), CSV`);
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      console.log(`📤 Envoi: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      
      if (file.size > 5 * 1024 * 1024) {
        setSuccessMessage(`⏳ Import en cours... (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      }
      
      const response = await axios.post("etudiants/import-excel/", formData);
      console.log("✅ Réponse:", response.data);
      
      if (response.data.success || response.data.imported_count > 0) {
        const msg = `✅ ${response.data.message || response.data.imported_count + ' étudiant(s) importé(s)'}`;
        setSuccessMessage(msg);
        
        // Afficher résumé dans console
        if (response.data.report) {
          const report = response.data.report;
          console.log(`📊 Résumé: ${report.imported_count} importés, ${report.error_count} erreurs, ${report.skipped_count} skippés`);
          
          if (response.data.mapping_info?.mapped_columns) {
            console.log("📍 Colonnes trouvées:", response.data.mapping_info.mapped_columns);
          }
        }
        
        await loadEtudiants();
        refreshAcademicData();
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        setError(response.data.error || response.data.message || "❌ Erreur lors de l'import");
      }
      
    } catch (err) {
      console.error("❌ Erreur import:", err);
      let errorMsg = err.response?.data?.error || err.response?.data?.message || "❌ Erreur lors de la lecture du fichier";
      
      if (errorMsg.includes("Aucune donnée") || errorMsg.includes("No data")) {
        errorMsg += "\n💡 Conseil: Colonnes requises: CIN, Nom, Prénom";
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // Supprimer un étudiant
  const handleDelete = async (idEtudiant) => {
    if (!window.confirm("⚠️ Confirmer la suppression?")) return;

    try {
      setError("");
      await axios.delete(`etudiants/${idEtudiant}/`);
      setSuccessMessage("✅ Étudiant supprimé");
      await loadEtudiants();
      refreshAcademicData();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      const message = err.response?.data?.detail || err.response?.data?.message || err.message || "❌ Erreur suppression";
      setError(message);
    }
  };

  // Sélection multiple - toggle
  const toggleEtudiantSelection = (idEtudiant) => {
    const newSelected = new Set(selectedEtudiants);
    if (newSelected.has(idEtudiant)) {
      newSelected.delete(idEtudiant);
    } else {
      newSelected.add(idEtudiant);
    }
    setSelectedEtudiants(newSelected);
  };

  // Sélectionner/désélectionner tous
  const selectAllEtudiants = () => {
    if (selectedEtudiants.size === filteredEtudiants.length) {
      setSelectedEtudiants(new Set());
    } else {
      setSelectedEtudiants(new Set(filteredEtudiants.map(e => e.idEtudiant)));
    }
  };

  // =======================================
// SUPPRESSION MULTIPLE DES ÉTUDIANTS
// =======================================
const handleDeleteMultiple = async () => {

  // Vérifier qu'au moins un étudiant est sélectionné
  if (selectedEtudiants.size === 0) {
    setError("❌ Sélectionnez au moins un étudiant");
    return;
  }

  // Construire le message de confirmation
  const msg = selectedEtudiants.size === 1
    ? "Supprimer cet étudiant?"
    : `Supprimer ${selectedEtudiants.size} étudiants?`;

  // Demander confirmation avant suppression
  if (!window.confirm("⚠️ " + msg)) return;

  try {
    // Réinitialiser les erreurs précédentes
    setError("");

    // Activer l'état de chargement
    setLoading(true);

    // Générer une requête DELETE pour chaque étudiant sélectionné
    const deletePromises = Array.from(selectedEtudiants)
      .map(id => axios.delete(`etudiants/${id}/`));

    // Exécuter toutes les suppressions en parallèle
    await Promise.all(deletePromises);

    // Afficher un message de succès
    setSuccessMessage(
      `✅ ${selectedEtudiants.size} étudiant(s) supprimé(s)`
    );

    // Réinitialiser la sélection
    setSelectedEtudiants(new Set());

    // Recharger les données depuis l'API
    await loadEtudiants();
    refreshAcademicData();

    // Masquer le message après 3 secondes
    setTimeout(() => setSuccessMessage(""), 3000);

  } catch (err) {

    // Récupérer et afficher le message d'erreur
    const message =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      "❌ Erreur";

    setError(message);

  } finally {

    // Désactiver le chargement dans tous les cas
    setLoading(false);
  }
};
  // Filtrer et rechercher les étudiants
  const filteredEtudiants = etudiants.filter((e) => {
    // Filtrer par année
    if (e.annee_universitaire && e.annee_universitaire !== anneeUniversitaire) return false;

    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();

    // Tous les champs
    if (filterBy.includes("Tous les champs")) {
      return (
        String(e.idEtudiant || "").toLowerCase().includes(term) ||
        String(e.cin || "").toLowerCase().includes(term) ||
        String(e.nom_fr || "").toLowerCase().includes(term) ||
        String(e.prenom_fr || "").toLowerCase().includes(term) ||
        String(e.email || "").toLowerCase().includes(term) ||
        String(e.numTel || "").toLowerCase().includes(term) ||
        String(e.nationalite || "").toLowerCase().includes(term) ||
        String(e.passport || "").toLowerCase().includes(term) ||
        String(e.licence_detail?.nom || "").toLowerCase().includes(term) ||
        String(e.specialite_detail?.nom || "").toLowerCase().includes(term) ||
        String(e.groupe || "").toLowerCase().includes(term) ||
        String(e.dateNaissance || "").toLowerCase().includes(term) ||
        (e.situation_s5 === 'N' ? 'nouveau' : 'redoublant').includes(term) ||
        (e.situation_pfe === 'N' ? 'nouveau' : 'redoublant').includes(term)
      );
    }
    
    // Champs sélectionnés
    return filterBy.some(field => {
      switch (field) {
        case "Matricule": return String(e.idEtudiant || "").toLowerCase().includes(term);
        case "CIN": return String(e.cin || "").toLowerCase().includes(term);
        case "Nom": return String(e.nom_fr || e.nom || "").toLowerCase().includes(term);
        case "Prénom": return String(e.prenom_fr || e.prenom || "").toLowerCase().includes(term);
        case "Genre": return (e.genre === 'F' ? 'femme' : 'homme').includes(term);
        case "Email": return String(e.email || "").toLowerCase().includes(term);
        case "Téléphone": return String(e.numTel || "").toLowerCase().includes(term);
        case "Nationalité": return String(e.nationalite || "").toLowerCase().includes(term);
        case "Passport": return String(e.passport || "").toLowerCase().includes(term);
        case "Date de Naissance": return String(e.dateNaissance || "").toLowerCase().includes(term);
        case "Licence": return String(e.licence_detail?.nom || e.licence_detail?.code || "").toLowerCase().includes(term);
        case "Spécialité": return String(e.specialite_detail?.nom || e.specialite_detail?.code || "").toLowerCase().includes(term);
        case "Groupe": return String(e.groupe || "").toLowerCase().includes(term);
        case "Situation": return (e.situation_s5 === 'N' ? 'nouveau' : 'redoublant').includes(term) || (e.situation_pfe === 'N' ? 'nouveau' : 'redoublant').includes(term);
        default: return false;
      }
    });
  });

  // === RENDER UI ===
  return (
    <>
      {/* Titre + Année universitaire */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        <h2 className="page-title" style={{ marginBottom: '0' }}>👥 Gestion des étudiants</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '16px', fontWeight: '500', color: '#64748b' }}>Année universitaire :</span>
          <select 
            value={anneeUniversitaire}
            onChange={(e) => setAnneeUniversitaire(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px', fontWeight: '600', color: '#334155', backgroundColor: '#f8fafc', cursor: 'pointer', outline: 'none' }}
          >
            {yearOptions.map(year => (<option key={year} value={year}>{year}</option>))}
          </select>
        </div>
      </div>

      {/* Messages */}
      {successMessage && <div className="success-message">{successMessage}</div>}
      {error && <div className="success-message" style={{ background: '#e53e3e' }}>{error}</div>}

      {/* Zone principale */}
      <div className="page-container">
        {/* Recherche et filtres */}
        <div className="search-area" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569' }}>🔍 Afficher/Chercher :</span>
            <MultiSelectDropdown
              label="Tous les champs sélectionnés"
              options={["Tous les champs", "Matricule", "CIN", "Nom", "Prénom", "Genre", "Email", "Téléphone", "Nationalité", "Passport", "Date de Naissance", "Licence", "Spécialité", "Groupe", "Situation"]}
              selected={filterBy}
              onChange={setFilterBy}
            />
          </div>

          <input
            type="text"
            className="search-input"
            placeholder={`Rechercher par ${Array.isArray(filterBy) ? (filterBy.includes('Tous les champs') ? 'tous les champs' : filterBy.join(', ').toLowerCase()) : '...'}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Boutons d'action */}
        <div className="buttons-area">
          <button className="btn import-btn" type="button" onClick={handleImportClick} disabled={loading}>📥 Importer fichier</button>
          <button className="btn" type="button" onClick={() => handleOpenForm(null)} disabled={loading}>➕ Nouvel étudiant</button>
          <button className="btn" type="button" onClick={selectAllEtudiants} disabled={loading} style={{ backgroundColor: selectedEtudiants.size === filteredEtudiants.length && filteredEtudiants.length > 0 ? '#10b981' : '#3b82f6' }}>
            {selectedEtudiants.size === filteredEtudiants.length && filteredEtudiants.length > 0 ? '✓ Tous sélectionnés' : '☐ Sélectionner tous'}
          </button>
          {selectedEtudiants.size > 0 && (
            <button className="btn" type="button" onClick={handleDeleteMultiple} disabled={loading} style={{ backgroundColor: '#ef4444' }}>
              🗑️ Supprimer {selectedEtudiants.size} sélectionné{selectedEtudiants.size > 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {/* Input file caché */}
      <input type="file" ref={fileRef} style={{ display: "none" }} accept=".csv,.json,.xlsx,.xls" onChange={handleImport} />

      {/* Modal import */}
      {importPreview && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0, color: '#1e293b' }}>Importation en cours...</h3>
            <p style={{ color: '#475569', marginBottom: '20px' }}>Veuillez patienter...</p>
          </div>
        </div>
      )}

      {/* Modal formulaire */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            {error && <div className="success-message" style={{ background: '#e53e3e', marginBottom: '15px' }}>{error}</div>}
            <EtudiantForm
              selected={selected}
              licences={licences}
              specialites={specialites}
              onSubmit={handleAddOrUpdate}
              onCancel={() => {
                setSelected(null);
                setShowForm(false);
                setError("");
              }}
            />
          </div>
        </div>
      )}

      {/* Tableau */}
      <EtudiantsTable
        etudiants={filteredEtudiants}
        onEdit={(e) => {
          setSelected(e);
          setShowForm(true);
        }}
        onDelete={handleDelete}
        filterBy={filterBy}
        selectedEtudiants={selectedEtudiants}
        onToggleSelect={toggleEtudiantSelection}
      />
    </>
  );
}

export default GestionEtudiants;