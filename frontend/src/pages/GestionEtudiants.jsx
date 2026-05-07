import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import EtudiantsTable from "../components/EtudiantsTable";
import EtudiantForm from "../components/EtudiantForm";
import "./GestionEtudiants.css";

function GestionEtudiants() {
  const [etudiants, setEtudiants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("Tous les champs");
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
    situation: item.situation && item.situation.toUpperCase().startsWith('R') ? 'R' : 'N',
  });

  const normalizeHeader = (header) =>
    String(header)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[^a-z0-9 ]/g, "");

  const parseCsvLine = (line) => {
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

  const parseCsv = (text) => {
    const rows = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (rows.length < 2) return [];

    const rawHeaders = parseCsvLine(rows[0]);
    const headers = rawHeaders.map((field) => {
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
        case "situation":
        case "etat":
          return "situation";
        default:
          return normalized;
      }
    });

    return rows.slice(1).map((line) => {
      const values = parseCsvLine(line);
      return headers.reduce((acc, header, index) => {
        acc[header] = values[index] ?? "";
        return acc;
      }, {});
    });
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

    const reader = new FileReader();
    reader.onload = async () => {
      let importedData = [];
      const text = reader.result;

      if (file.name.toLowerCase().endsWith(".json")) {
        try {
          importedData = JSON.parse(text);
        } catch (error) {
          return alert("Impossible de lire le fichier JSON.");
        }
      } else {
        importedData = parseCsv(text);
      }

      if (!Array.isArray(importedData) || !importedData.length) {
        return alert("Aucune donnée importable trouvée.");
      }

      const cleanedData = importedData
        .map(cleanEtudiant)
        .filter((item) => item.cin || item.nom || item.prenom);

      if (!cleanedData.length) {
        return alert("Aucune ligne valide trouvée après nettoyage.");
      }

      try {
        setError("");
        let successCount = 0;

        // Import each student via API
        for (const student of cleanedData) {
          try {
            await axios.post("/api/etudiants/", student);
            successCount++;
          } catch (err) {
            console.error("Erreur lors de l'import d'un étudiant:", err);
            // Continue with next student
          }
        }

        setSuccessMessage(`${successCount} étudiant(s) importé(s) avec succès`);

        // Reload data from API
        await loadData();

        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (err) {
        const message = err.response?.data?.detail ||
                       err.response?.data?.message ||
                       err.message ||
                       "Erreur lors de l'import";
        setError(message);
      }
    };

    reader.readAsText(file);
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

    switch (filterBy) {

      case "Matricule":
        return String(e.idEtudiant || "").toLowerCase().includes(term);

      case "CIN":
        return e.cin.toLowerCase().includes(term);

      case "Nom":
        return e.nom.toLowerCase().includes(term);

      case "Prénom":
        return e.prenom.toLowerCase().includes(term);

      case "Email":
        return e.email.toLowerCase().includes(term);

      case "Téléphone":
        return String(e.numTel || "").toLowerCase().includes(term);

      case "Nationalité":
        return String(e.nationalite || "").toLowerCase().includes(term);

      case "Licence":
        return String(e.licence_detail?.nom || e.licence_detail?.code || "").toLowerCase().includes(term);

      case "Spécialité":
        return String(e.specialite_detail?.nom || e.specialite_detail?.code || "").toLowerCase().includes(term);

      case "Groupe":
        return String(e.groupe || "").toLowerCase().includes(term);

      case "Situation":
        return (e.situation === 'N' ? 'nouveau' : 'redoublant').includes(term) || (e.situation || "").toLowerCase().includes(term);

      default:
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
          (e.situation === 'N' ? 'nouveau' : 'redoublant').includes(term)
        );

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

        <div className="search-area">

          <select
            className="filter-select"
            value={filterBy}
            onChange={(e) =>
              setFilterBy(e.target.value)
            }
          >

            <option value="Tous les champs">
              Tous les champs
            </option>

            <option value="Matricule">
              Matricule
            </option>

            <option value="CIN">
              CIN
            </option>

            <option value="Nom">
              Nom
            </option>

            <option value="Prénom">
              Prénom
            </option>

            <option value="Email">
              Email
            </option>

            <option value="Téléphone">
              Téléphone
            </option>

            <option value="Nationalité">
              Nationalité
            </option>

            <option value="Licence">
              Licence
            </option>

            <option value="Spécialité">
              Spécialité
            </option>

            <option value="Groupe">
              Groupe
            </option>

            <option value="Situation">
              Situation
            </option>
          </select>
  
          <input
            type="text"
            className="search-input"
            placeholder={`Rechercher par ${filterBy.toLowerCase()}`}
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
        accept=".csv,.json"
        ref={fileRef}
        style={{ display: "none" }}
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
      />
  
    </>
  
  );

}

export default GestionEtudiants;