import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import EnseignantsTable from "../components/EnseignantsTable";
import EnseignantForm from "../components/EnseignantsForm";
import MultiSelectDropdown from "../components/MultiSelectDropdown";
import { parseFile } from "../utils/fileParser";
import "./GestionEtudiants.css";

// Tableaux supplémentaires
import DiplomesEnseignant from "../components/DiplomesEnseignant";
import ContratsEnseignant from "../components/ContratsEnseignant";

function GestionEnseignants() {
  const [enseignants, setEnseignants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [currentForm, setCurrentForm] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState(["Tous les champs"]);

  const fileRef = useRef(null);

  // Charger les données depuis l'API
  const loadData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/enseignants/');
      setEnseignants(Array.isArray(response.data) ? response.data : []);
      console.log('Loaded enseignants:', response.data);
      setErrorMessage('');
    } catch (err) {
      console.error('Erreur lors du chargement des enseignants:', err);
      setErrorMessage('Impossible de charger les enseignants');
      setEnseignants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

      let response;
      if (selected) {
        response = await axios.put(`/api/enseignants/${selected.matricule}/`, payload);
      } else {
        response = await axios.post('/api/enseignants/', payload);
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

  const handleDelete = async (matricule) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet enseignant ?")) return;
    try {
      await axios.delete(`/api/enseignants/${matricule}/`);
      setSuccessMessage("Enseignant supprimé avec succès");
      setErrorMessage('');
      loadData();
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || "Impossible de supprimer l'enseignant");
    }
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleImportClick = () => fileRef.current.click();

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await parseFile(file);
      
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
          if (normKey === 'numtel' || normKey === 'num tel' || normKey === 'telephone') finalKey = 'numTel';
          if (normKey === 'daterecrutement' || normKey === 'date recrutement') finalKey = 'dateRecrutement';
          if (normKey === 'typecontrat' || normKey === 'type contrat') finalKey = 'typeContrat';
          if (normKey === 'datetitularisation' || normKey === 'date titularisation') finalKey = 'dateTitularisation';
          if (normKey === 'statutadministratif' || normKey === 'statut administratif') finalKey = 'statutAdministratif';
          
          acc[finalKey] = row[key];
          return acc;
        }, {});
      });

      const cleanedData = importedData
        .map((item) => ({
          matricule: item.matricule,
          cin: item.cin,
          nom: item.nom,
          prenom: item.prenom,
          email: item.email,
          numtel: item.numTel || item.numtel,
          grade: item.grade,
          dateRecrutement: item.dateRecrutement,
          statutAdministratif: item.statutAdministratif,
        }))
        .filter((item) => item.matricule && item.nom && item.prenom);

      // Envoi des données parsées à l'API
      let successCount = 0;
      for (const item of cleanedData) {
        try {
          await axios.post('/api/enseignants/', item);
          successCount++;
        } catch (itemErr) {
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

  // Filtrage
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
      {errorMessage && <div className="success-message" style={{ background: '#e53e3e' }}>{errorMessage}</div>}

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
            </div>
          </div>

          <input
            type="file"
            ref={fileRef}
            style={{ display: "none" }}
            accept=".csv,.json,.xlsx,.xls"
            onChange={handleImport}
          />

          {/* Tableau principal */}
          <EnseignantsTable
            enseignants={filteredEnseignants}
            onEdit={(e) => {
              setSelected(e);
              // Initialiser currentForm avec les données de l'enseignant, en s'assurant que diplome et autres champs existent
              setCurrentForm({
                ...e,
                diplome: e.diplome || {
                  idDiplome: "",
                  libelleDiplome: "",
                  specialite: "",
                  universite: "",
                  dateObtention: ""
                },
                // Assurer que tous les champs de contrat existent
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
          />

          <DiplomesEnseignant enseignants={filteredEnseignants} />
          <ContratsEnseignant enseignants={filteredEnseignants} />
        </>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            {errorMessage && <div className="success-message" style={{ background: '#e53e3e', marginBottom: '15px' }}>{errorMessage}</div>}
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