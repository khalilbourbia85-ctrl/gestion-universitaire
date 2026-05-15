import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import EtudiantsTable from "../components/EtudiantsTable";
import EtudiantForm from "../components/EtudiantForm";
import MultiSelectDropdown from "../components/MultiSelectDropdown";
import { parseFile } from "../utils/fileParser";
import "./GestionEtudiants.css";

function GestionEtudiants() {
  const [etudiants, setEtudiants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState(["Tous les champs"]);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [licences, setLicences] = useState([]);
  const [specialites, setSpecialites] = useState([]);

  const fileRef = useRef(null);

  /*
  LOAD DATA FROM API
  */
  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [etRes, licRes, specRes] = await Promise.all([
        axios.get("/api/etudiants/"),
        axios.get("/api/licences/").catch(() => ({ data: [] })),
        axios.get("/api/specialites/").catch(() => ({ data: [] })),
      ]);
      setEtudiants(Array.isArray(etRes.data) ? etRes.data : []);
      setLicences(Array.isArray(licRes.data) ? licRes.data : []);
      setSpecialites(Array.isArray(specRes.data) ? specRes.data : []);
    } catch (err) {
      const message = err.response?.data?.detail || err.message || "Impossible de charger les étudiants.";
      setError(message);
      setLicences([]);
      setSpecialites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);


  /*
  ADD OR UPDATE ETUDIANT VIA API
  */
  const handleAddOrUpdate = async (etudiant) => {
    try {
      setError("");

      if (selected) {
        // UPDATE MODE
        await axios.put(`/api/etudiants/${selected.idEtudiant}/`, etudiant);
        setSuccessMessage("Étudiant modifié avec succès");
      } else {
        // ADD MODE
        await axios.post("/api/etudiants/", etudiant);
        setSuccessMessage("Étudiant ajouté avec succès");
      }

      // Reload data from API
      await loadData();

      // RESET FORM STATE
      setSelected(null);
      setShowForm(false);

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);

    } catch (err) {
      const responseData = err.response?.data;
      let errorMsg = "Erreur lors de la sauvegarde";
      
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


  /*
  DELETE ETUDIANT
  */

  const normalizeSpaces = (value) =>
    typeof value === "string"
      ? value.trim().replace(/\s+/g, " ")
      : value;

  const cleanDigits = (value) =>
    String(value || "").replace(/\D/g, "");

  const cleanEmail = (value) =>
    String(value || "").trim().toLowerCase();

  const cleanEtudiant = (item) => ({
    idEtudiant: item.idEtudiant ? Number(item.idEtudiant) : null,
    cin: cleanDigits(item.cin),
    nom: normalizeSpaces(item.nom),
    prenom: normalizeSpaces(item.prenom),
    email: cleanEmail(item.email),
    numTel: cleanDigits(item.numTel),
    dateNaissance: String(item.dateNaissance || "").trim(),
    adresse: normalizeSpaces(item.adresse),
    dateInscription: String(item.dateInscription || "").trim(),
    nationalite: normalizeSpaces(item.nationalite),
    passport: String(item.passport || "").trim(),
    groupe: String(item.groupe || "").trim(),
    licence:
      item.licence != null && item.licence !== ""
        ? Number(item.licence)
        : null,
    specialite:
      item.specialite != null && item.specialite !== ""
        ? Number(item.specialite)
        : null,
    situation_s5: item.situation_s5 && item.situation_s5.toUpperCase().startsWith('R') ? 'R' : 'N',
    situation_pfe: item.situation_pfe && item.situation_pfe.toUpperCase().startsWith('R') ? 'R' : 'N',
  });

  const normalizeHeader = (header) =>
    String(header)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[^a-z0-9 ]/g, "");

  const parseCsvLine = (line) => {
    // Keep this function around just in case it's used elsewhere, 
    // but the main logic is moved to parseFile.
    const parts = [];
    const regex = /(?:"([^"]*(?:""[^"]*)*)"|([^",]*))(?:,|$)/g;
    let match;
    while ((match = regex.exec(line))) {
      let value = match[1] || match[2] || "";
      value = value.replace(/""/g, '"');
      parts.push(value.trim());
    }
    return parts;
  };

  const getNormalizedKey = (field) => {
    const normalized = normalizeHeader(field);
    switch (normalized) {
      case "cin":
      case "cni":
        return "cin";
      case "nom":
        return "nom";
      case "prenom":
        return "prenom";
      case "email":
        return "email";
      case "telephone":
      case "numtel":
      case "num tele":
        return "numTel";
      case "datenaissance":
      case "date naissance":
        return "dateNaissance";
      case "adresse":
        return "adresse";
      case "dateinscription":
      case "date inscription":
        return "dateInscription";
      case "nationalite":
      case "nationalité":
        return "nationalite";
      case "passport":
      case "passeport":
        return "passport";
      case "idetudiant":
      case "id etudiant":
        return "idEtudiant";
      case "groupe":
      case "group":
        return "groupe";
      case "situation s5":
      case "situation_s5":
      case "situation semestre 5":
        return "situation_s5";
      case "situation pfe":
      case "situation_pfe":
        return "situation_pfe";
      default:
        return normalized;
    }
  };

  /*
  IMPORT BUTTON CLICK
  */

  const handleImportClick = () => {
    fileRef.current.click();
  };

  const handleOpenForm = (etudiant = null) => {
    setSelected(etudiant);
    setShowForm(true);
    setSuccessMessage("");
  };

  const handleCloseForm = () => {
    setSelected(null);
    setShowForm(false);
  };

  /*
  IMPORT FILE FUNCTION
  */

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const rawData = await parseFile(file);
      
      const importedData = rawData.map(row => {
        return Object.keys(row).reduce((acc, key) => {
          acc[getNormalizedKey(key)] = row[key];
          return acc;
        }, {});
      });

      if (!Array.isArray(importedData) || !importedData.length) {
        return alert("Aucune donnée importable trouvée.");
      }

      const cleanedData = importedData
        .map(cleanEtudiant)
        .filter((item) => item.cin || item.nom || item.prenom);

      if (!cleanedData.length) {
        return alert("Aucune ligne valide trouvée après nettoyage.");
      }

      setError("");
      let successCount = 0;

      for (const student of cleanedData) {
        try {
          await axios.post("/api/etudiants/", student);
          successCount++;
        } catch (err) {
          console.error("Erreur lors de l'import d'un étudiant:", err);
        }
      }

      setSuccessMessage(`${successCount} étudiant(s) importé(s) avec succès`);
      await loadData();
      setTimeout(() => setSuccessMessage(""), 3000);
      
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'importation: " + (err.message || "Veuillez vérifier le format de vos données."));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (idEtudiant) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet étudiant ?")) return;

    try {
      setError("");
      await axios.delete(`/api/etudiants/${idEtudiant}/`);
      setSuccessMessage("Étudiant supprimé avec succès");

      // Reload data from API
      await loadData();

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      const message = err.response?.data?.detail ||
                     err.response?.data?.message ||
                     err.message ||
                     "Erreur lors de la suppression";
      setError(message);
    }
  };


  /*
  FILTRAGE + SEARCH SYSTEM (CORRECT VERSION)
  */

  const filteredEtudiants = etudiants.filter((e) => {
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();

    if (filterBy.includes("Tous les champs")) {
      return (
        String(e.idEtudiant || "").toLowerCase().includes(term) ||
        e.cin.toLowerCase().includes(term) ||
        e.nom.toLowerCase().includes(term) ||
        e.prenom.toLowerCase().includes(term) ||
        e.email.toLowerCase().includes(term) ||
        String(e.numTel || "").toLowerCase().includes(term) ||
        String(e.nationalite || "").toLowerCase().includes(term) ||
        String(e.licence_detail?.nom || "").toLowerCase().includes(term) ||
        String(e.specialite_detail?.nom || "").toLowerCase().includes(term) ||
        String(e.groupe || "").toLowerCase().includes(term) ||
        (e.situation_s5 === 'N' ? 'nouveau' : 'redoublant').includes(term) ||
        (e.situation_pfe === 'N' ? 'nouveau' : 'redoublant').includes(term)
      );
    } else {
      return filterBy.some(field => {
        switch (field) {
          case "Matricule": return String(e.idEtudiant || "").toLowerCase().includes(term);
          case "CIN": return e.cin.toLowerCase().includes(term);
          case "Nom": return e.nom.toLowerCase().includes(term);
          case "Prénom": return e.prenom.toLowerCase().includes(term);
          case "Email": return e.email.toLowerCase().includes(term);
          case "Téléphone": return String(e.numTel || "").toLowerCase().includes(term);
          case "Nationalité": return String(e.nationalite || "").toLowerCase().includes(term);
          case "Licence": return String(e.licence_detail?.nom || e.licence_detail?.code || "").toLowerCase().includes(term);
          case "Spécialité": return String(e.specialite_detail?.nom || e.specialite_detail?.code || "").toLowerCase().includes(term);
          case "Groupe": return String(e.groupe || "").toLowerCase().includes(term);
          case "Situation Semestre 5": return (e.situation_s5 === 'N' ? 'nouveau' : 'redoublant').includes(term);
          case "Situation PFE": return (e.situation_pfe === 'N' ? 'nouveau' : 'redoublant').includes(term);
          default: return false;
        }
      });
    }
  });


  /*
  RENDER UI
  */

  return (

    <>
  
      <h2 className="page-title">Gestion des étudiants</h2>
  
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="success-message" style={{ background: '#e53e3e' }}>
          {error}
        </div>
      )}
  
      <div className="page-container">

        <div className="search-area" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569' }}>Afficher/Chercher :</span>
            <MultiSelectDropdown
              label="Tous les champs sélectionnés"
              options={["Tous les champs", "Matricule", "CIN", "Nom", "Prénom", "Email", "Téléphone", "Nationalité", "Licence", "Spécialité", "Groupe", "Situation Semestre 5", "Situation PFE"]}
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

        <div className="buttons-area">
          <button
            className="btn import-btn"
            type="button"
            onClick={handleImportClick}
          >
            Importer fichier
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => handleOpenForm(null)}
          >
            Nouvel étudiant
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

      <EtudiantsTable
        etudiants={filteredEtudiants}
        onEdit={(e) => {
          setSelected(e);
          setShowForm(true);
        }}
        onDelete={handleDelete}
        filterBy={filterBy}
      />
  
    </>
  
  );

}

export default GestionEtudiants;