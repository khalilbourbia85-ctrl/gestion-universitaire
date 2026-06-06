import React, { useState, useEffect, useRef } from "react";
import axios from "../utils/axiosConfig";
import EnseignantsTable from "../components/EnseignantsTable";
import EnseignantForm from "../components/EnseignantsForm";
import MultiSelectDropdown from "../components/MultiSelectDropdown";
import { parseFile } from "../utils/fileParser";
import "./GestionEtudiants.css";

// Tableaux supplémentaires
import DiplomesEnseignant from "../components/DiplomesEnseignant";
import ContratsEnseignant from "../components/ContratsEnseignant";

function GestionEnseignants() {
  // État principal - liste des enseignants
  const [enseignants, setEnseignants] = useState([]);
  // Enseignant actuellement sélectionné pour édition
  const [selected, setSelected] = useState(null);
  // Données du formulaire actuel
  const [currentForm, setCurrentForm] = useState(null);
  // Affichage du modal du formulaire
  const [showForm, setShowForm] = useState(false);
  // État de chargement des données
  const [loading, setLoading] = useState(false);
  // Message de succès temporaire
  const [successMessage, setSuccessMessage] = useState("");
  // Message d'erreur
  const [errorMessage, setErrorMessage] = useState("");
  // Terme de recherche pour filtrer
  const [searchTerm, setSearchTerm] = useState("");
  // Champs sur lesquels filtrer la recherche
  const [filterBy, setFilterBy] = useState(["Tous les champs"]);
  // Onglet actif (informations, diplômes, contrats)
  const [activeTab, setActiveTab] = useState("informations");
  // Ensemble des matricules sélectionnés pour opérations batch
  const [selectedEnseignants, setSelectedEnseignants] = useState(new Set());
  // PFEs pour vérifier si enseignant encadre des projets
  const [pfes, setPfes] = useState([]);

  const fileRef = useRef(null);

  // Charger les données depuis l'API
  const loadData = async () => {
    setLoading(true);
    try {
      const [ensResponse, pfeResponse] = await Promise.all([
        axios.get('enseignants/'),
        axios.get('pfes/').catch(() => ({ data: [] }))
      ]);
      setEnseignants(Array.isArray(ensResponse.data) ? ensResponse.data : []);
      setPfes(Array.isArray(pfeResponse.data) ? pfeResponse.data : []);
      console.log('Loaded enseignants:', ensResponse.data);
      console.log('Loaded pfes:', pfeResponse.data);
      setErrorMessage('');
    } catch (err) {
      console.error('Erreur lors du chargement des enseignants:', err);
      setErrorMessage('Impossible de charger les enseignants');
      setEnseignants([]);
      setPfes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Initialiser un formulaire vide avec tous les champs
  const createEmptyForm = () => ({
    matricule: "",
    cin: "",
    nom: "",
    prenom: "",
    email: "",
    numTel: "",
    grade: "",
    dateRecrutement: "",
    typeContrat: "",
    dateTitularisation: "",
    statutAdministratif: "",
    anneeInscription: "",
    nbHeures: "",
    tauxHoraire: "",
    dureeContrat: "",
    dateDebut: "",
    dateFin: "",
    sujetThese: "",
    universite: "",
    primeRecherche: "",
    numeroOrdre: "",
    diplome: {
      idDiplome: "",
      libelleDiplome: "",
      specialite: "",
      universite: "",
      dateObtention: ""
    }
  });

  // Créer ou modifier un enseignant avec gestion d'erreur complète
  const handleAddOrUpdate = async (enseignant) => {
    try {
      const payload = {
        matricule: enseignant.matricule,
        cin: enseignant.cin,
        nom: enseignant.nom,
        prenom: enseignant.prenom,
        email: enseignant.email,
        numtel: enseignant.numtel || enseignant.numTel,
        grade: enseignant.grade,
        dateRecrutement: enseignant.dateRecrutement,
        statutAdministratif: enseignant.statutAdministratif,
        // Inclure les données de diplôme et contrat
        diplome: enseignant.diplome,
        typeContrat: enseignant.typeContrat,
        dateDebut: enseignant.dateDebut,
        dateFin: enseignant.dateFin,
        dateTitularisation: enseignant.dateTitularisation,
        anneeInscription: enseignant.anneeInscription,
        nbHeures: enseignant.nbHeures,
        tauxHoraire: enseignant.tauxHoraire,
        dureeContrat: enseignant.dureeContrat,
        sujetThese: enseignant.sujetThese,
        universite: enseignant.universite,
        primeRecherche: enseignant.primeRecherche,
        numeroOrdre: enseignant.numeroOrdre,
      };

      console.log('Sending payload:', payload);

      // PUT pour modification, POST pour création
      let response;
      if (selected) {
        response = await axios.put(`enseignants/${selected.matricule}/`, payload);
      } else {
        response = await axios.post('enseignants/', payload);
      }

      console.log('Response data:', response.data);

      const successText = selected ? 'Enseignant modifié avec succès' : 'Enseignant ajouté avec succès';
      setSuccessMessage(successText);
      setErrorMessage('');
      setShowForm(false);
      setSelected(null);
      setCurrentForm(null);
      
      await loadData();
      
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      // Gérer les différents formats d'erreur de l'API
      let errorMsg = 'Erreur lors de l\'enregistrement';
      const responseData = err?.response?.data;
      if (typeof responseData === 'string') {
        errorMsg = responseData;
      } else if (responseData?.detail) {
        errorMsg = typeof responseData.detail === 'string' ? responseData.detail : JSON.stringify(responseData.detail);
      } else if (responseData?.errors) {
        errorMsg = typeof responseData.errors === 'string' ? responseData.errors : JSON.stringify(responseData.errors);
      } else if (responseData && typeof responseData === 'object') {
        errorMsg = Object.entries(responseData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
          .join(' | ');
      } else if (err?.message) {
        errorMsg = err.message;
      }
      setErrorMessage(errorMsg);
    }
  };

  // Supprimer un enseignant après confirmation
  const handleDelete = async (matricule) => {
    // Vérifier si l'enseignant encadre des PFEs
    const encadredPfes = pfes.filter(pfe => pfe.encadrant === matricule || pfe.encadrant_id === matricule);
    
    if (encadredPfes.length > 0) {
      setErrorMessage(
        `❌ Impossible de supprimer cet enseignant. ` +
        `Il encadre actuellement ${encadredPfes.length} PFE(s). ` +
        `Veuillez d'abord réassigner les PFEs à un autre encadrant.`
      );
      return;
    }

    if (!window.confirm("Voulez-vous vraiment supprimer cet enseignant ?")) return;
    try {
      await axios.delete(`enseignants/${matricule}/`);
      setSuccessMessage("Enseignant supprimé avec succès");
      setErrorMessage('');
      loadData();
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || "Impossible de supprimer l'enseignant");
    }
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Basculer la sélection d'un enseignant individuel
  const toggleEnseignantSelection = (matricule) => {
    const newSelected = new Set(selectedEnseignants);
    if (newSelected.has(matricule)) {
      newSelected.delete(matricule);
    } else {
      newSelected.add(matricule);
    }
    setSelectedEnseignants(newSelected);
  };

  // Sélectionner/désélectionner tous les enseignants filtrés
  const selectAllEnseignants = () => {
    if (selectedEnseignants.size === filteredEnseignants.length) {
      setSelectedEnseignants(new Set());
    } else {
      setSelectedEnseignants(new Set(filteredEnseignants.map(e => e.matricule)));
    }
  };

  // Supprimer plusieurs enseignants sélectionnés avec Promise.all()
  const handleDeleteMultiple = async () => {
    if (selectedEnseignants.size === 0) {
      setErrorMessage("Veuillez sélectionner au moins un enseignant");
      return;
    }

    // Vérifier quels enseignants encadrent des PFEs
    const blockedEnseignants = [];
    const selectedArray = Array.from(selectedEnseignants);
    
    for (const matricule of selectedArray) {
      const encadredPfes = pfes.filter(pfe => pfe.encadrant === matricule || pfe.encadrant_id === matricule);
      if (encadredPfes.length > 0) {
        const ens = enseignants.find(e => e.matricule === matricule);
        blockedEnseignants.push({
          matricule,
          nom: ens ? `${ens.nom} ${ens.prenom}` : matricule,
          count: encadredPfes.length
        });
      }
    }

    // Si des enseignants sont bloqués, afficher un message d'erreur
    if (blockedEnseignants.length > 0) {
      const blockedList = blockedEnseignants
        .map(e => `${e.nom} (${e.count} PFE(s))`)
        .join(', ');
      setErrorMessage(
        `❌ Impossible de supprimer certains enseignants car ils encadrent des PFEs:\n${blockedList}\n` +
        `Veuillez d'abord réassigner les PFEs.`
      );
      return;
    }

    const confirmMsg = selectedEnseignants.size === 1 
      ? "Voulez-vous supprimer cet enseignant ?" 
      : `Voulez-vous vraiment supprimer ${selectedEnseignants.size} enseignants ?`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      setErrorMessage("");
      setLoading(true);
      
      // Supprimer en parallèle avec Promise.all
      const deletePromises = selectedArray.map(matricule =>
        axios.delete(`enseignants/${matricule}/`)
      );
      
      await Promise.all(deletePromises);
      
      setSuccessMessage(`${selectedEnseignants.size} enseignant(s) supprimé(s) avec succès`);
      setSelectedEnseignants(new Set());
      
      // Reload data
      await loadData();
      
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      const message = err.response?.data?.detail ||
                     err.response?.data?.message ||
                     err.message ||
                     "Erreur lors de la suppression";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  // Déclencher le dialogue d'import de fichier
  const handleImportClick = () => fileRef.current.click();



  // Importer les enseignants depuis un fichier Excel/CSV avec validation et mappage intelligent
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await parseFile(file);
      
      // Normaliser les en-têtes et mapper automatiquement les colonnes
      const normalizeHeader = (header) =>
        String(header)
          .trim()
          .toLowerCase()
          .replace(/\s+/g, " ")
          .replace(/[^a-z0-9 ]/g, "");

      const importedData = data.map(row => {
        return Object.keys(row).reduce((acc, key) => {
          const normKey = normalizeHeader(key);
          let finalKey = normKey;
          
          if (normKey.includes("prenom")) finalKey = "prenom";
          else if (normKey.includes("nom")) finalKey = "nom";
          else if (normKey.includes("matricule") || normKey.includes("mat")) finalKey = "matricule";
          else if (normKey.includes("cin") || normKey.includes("cni")) finalKey = "cin";
          else if (normKey.includes("email") || normKey.includes("mail")) finalKey = "email";
          else if (normKey.includes("tel") || normKey.includes("phone") || normKey.includes("portable") || normKey.includes("telephone")) finalKey = "numTel";
          else if (normKey.includes("grade") || normKey.includes("classe")) finalKey = "grade";
          else if (normKey.includes("recrutement") || normKey.includes("recrut")) finalKey = "dateRecrutement";
          else if (normKey.includes("statut") || normKey.includes("administratif")) finalKey = "statutAdministratif";
          else if (normKey.includes("contrat")) finalKey = "typeContrat";
          else if (normKey.includes("titularisation")) finalKey = "dateTitularisation";
          
          acc[finalKey] = row[key];
          return acc;
        }, {});
      });

      // Extraire uniquement les chiffres (pour CIN, téléphone)
      const cleanDigits = (value) => {
        if (value === null || value === undefined) return "";
        let strVal = String(value).trim();
        if (strVal.includes(".")) {
          const parts = strVal.split(".");
          if (parts[1] === "" || /^0+$/.test(parts[1])) {
            strVal = parts[0];
          }
        }
        return strVal.replace(/\D/g, "");
      };

      const cleanedData = importedData
        .map((item) => ({
          matricule: item.matricule ? String(item.matricule).split('.')[0].trim() : "",
          cin: cleanDigits(item.cin),
          nom: item.nom,
          prenom: item.prenom,
          email: item.email,
          numtel: cleanDigits(item.numTel || item.numtel),
          grade: item.grade,
          dateRecrutement: item.dateRecrutement,
          statutAdministratif: item.statutAdministratif,
        }))
        .filter((item) => item.matricule && item.nom && item.prenom);

      // Importer chaque ligne avec gestion d'erreur individuelle
      let successCount = 0;
      for (const item of cleanedData) {
        try {
          await axios.post('enseignants/', item);
          successCount++;
        } catch (itemErr) {
          // Continuer les autres importe même en cas d'erreur
          console.error(`Erreur pour ${item.matricule}:`, itemErr);
        }
      }
      
      setSuccessMessage(`${successCount} enseignant(s) importé(s) avec succès`);
      setErrorMessage('');
      await loadData();
      setTimeout(() => setSuccessMessage(""), 3000);
      
    } catch (err) {
      console.error(err);
      setErrorMessage("Erreur lors de l'importation: " + (err.message || "Veuillez vérifier le format de vos données."));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // Filtrer les enseignants selon le terme de recherche et les champs sélectionnés
  const filteredEnseignants = enseignants.filter((e) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    
    const searchInField = (fieldValue) => 
      String(fieldValue || "").toLowerCase().includes(term);
    
    if (filterBy.includes("Tous les champs")) {
      return (
        searchInField(e.matricule) ||
        searchInField(e.cin) ||
        searchInField(e.nom) ||
        searchInField(e.prenom) ||
        searchInField(e.email) ||
        searchInField(e.grade) ||
        searchInField(e.numTel)
      );
    } else {
      return filterBy.some(field => {
        switch (field) {
          case "Matricule": return searchInField(e.matricule);
          case "CIN": return searchInField(e.cin);
          case "Nom": return searchInField(e.nom);
          case "Prénom": return searchInField(e.prenom);
          case "Email": return searchInField(e.email);
          case "Grade": return searchInField(e.grade);
          case "Téléphone": return searchInField(e.numTel);
          default: return false;
        }
      });
    }
  });

  return (
    <>
      <h2 className="page-title">Gestion des enseignants</h2>
      {successMessage && <div className="success-message">{successMessage}</div>}
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {loading ? (
        <div className="table-card">Chargement en cours...</div>
      ) : (
        <>
          <div className="page-container">
            <div className="search-area" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569' }}>Afficher/Chercher :</span>
                <MultiSelectDropdown
                  label="Tous les champs sélectionnés"
                  options={["Tous les champs", "Matricule", "CIN", "Nom", "Prénom", "Email", "Téléphone", "Grade"]}
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
              <button onClick={handleImportClick} className="btn import-btn">
                Importer fichier
              </button>

              <button
                className="btn"
                onClick={() => {
                  setSelected(null);
                  setCurrentForm(createEmptyForm());
                  setShowForm(true);
                }}
              >
                Nouvel enseignant
              </button>
              <button
                className="btn"
                type="button"
                onClick={selectAllEnseignants}
                style={{ backgroundColor: selectedEnseignants.size === filteredEnseignants.length && filteredEnseignants.length > 0 ? '#10b981' : '#3b82f6' }}
              >
                {selectedEnseignants.size === filteredEnseignants.length && filteredEnseignants.length > 0 ? '✓ Tous sélectionnés' : '☐ Sélectionner tous'}
              </button>
              {selectedEnseignants.size > 0 && (
                <button
                  className="btn"
                  type="button"
                  onClick={handleDeleteMultiple}
                  style={{ backgroundColor: '#ef4444' }}
                >
                  🗑️ Supprimer {selectedEnseignants.size} sélectionné{selectedEnseignants.size > 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>

          <input
            type="file"
            ref={fileRef}
            style={{ display: "none" }}
            accept=".csv,.json,.xlsx,.xls"
            onChange={handleImport}
          />

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
            <button 
              className={`btn ${activeTab === 'informations' ? 'save-btn' : 'cancel-btn'}`}
              style={activeTab === 'informations' ? {background: '#3b82f6', color: 'white', border: 'none'} : {}}
              onClick={() => setActiveTab('informations')}
            >
              Informations des enseignants
            </button>
            <button 
              className={`btn ${activeTab === 'diplomes' ? 'save-btn' : 'cancel-btn'}`}
              style={activeTab === 'diplomes' ? {background: '#3b82f6', color: 'white', border: 'none'} : {}}
              onClick={() => setActiveTab('diplomes')}
            >
              Diplômes
            </button>
            <button 
              className={`btn ${activeTab === 'contrats' ? 'save-btn' : 'cancel-btn'}`}
              style={activeTab === 'contrats' ? {background: '#3b82f6', color: 'white', border: 'none'} : {}}
              onClick={() => setActiveTab('contrats')}
            >
              Contrats
            </button>
          </div>

          {/* Tableau principal */}
          {activeTab === 'informations' && (
            <EnseignantsTable
              enseignants={filteredEnseignants}
              pfes={pfes}
              onEdit={(e) => {
                setSelected(e);
                setCurrentForm({
                  ...e,
                  diplome: e.diplome || {
                    idDiplome: "",
                    libelleDiplome: "",
                    specialite: "",
                    universite: "",
                    dateObtention: ""
                  },
                  typeContrat: e.typeContrat || "",
                  dateTitularisation: e.dateTitularisation || "",
                  anneeInscription: e.anneeInscription || "",
                  nbHeures: e.nbHeures || "",
                  tauxHoraire: e.tauxHoraire || "",
                  dureeContrat: e.dureeContrat || "",
                  dateDebut: e.dateDebut || "",
                  dateFin: e.dateFin || "",
                  sujetThese: e.sujetThese || "",
                  universite: e.universite || "",
                  primeRecherche: e.primeRecherche || "",
                  numeroOrdre: e.numeroOrdre || ""
                });
                setShowForm(true);
              }}
              onDelete={handleDelete}
              filterBy={filterBy}
              selectedEnseignants={selectedEnseignants}
              onToggleSelect={toggleEnseignantSelection}
            />
          )}

          {activeTab === 'diplomes' && <DiplomesEnseignant enseignants={filteredEnseignants} />}
          {activeTab === 'contrats' && <ContratsEnseignant enseignants={filteredEnseignants} />}
        </>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            <EnseignantForm
              selected={selected}
              onSubmit={handleAddOrUpdate}
              onCancel={() => {
                setSelected(null);
                setCurrentForm(null);
                setShowForm(false);
                setErrorMessage("");
              }}
              onFormChange={setCurrentForm}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default GestionEnseignants;