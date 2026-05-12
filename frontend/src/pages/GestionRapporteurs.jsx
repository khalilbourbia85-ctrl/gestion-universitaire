import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import RapporteursTable from '../components/RapporteursTable';
import RapporteursForm from '../components/RapporteursForm';
import { parseFile } from "../utils/fileParser";
import './GestionEtudiants.css';

function GestionRapporteurs() {
  const [rapporteurs, setRapporteurs] = useState([]);
  const [selectedRapporteur, setSelectedRapporteur] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('Tous les champs');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const fileRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/rapporteurs/');
      setRapporteurs(Array.isArray(response.data) ? response.data : []);
      setError('');
    } catch (err) {
      setError('Impossible de charger les rapporteurs');
      setRapporteurs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRapporteurs = rapporteurs.filter((r) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    switch (filterBy) {
      case "Matricule":
        return String(r.matricule || "").toLowerCase().includes(term);
      case "CIN":
        return r.cin.toLowerCase().includes(term);
      case "Nom":
        return r.nom.toLowerCase().includes(term);
      case "Prénom":
        return r.prenom.toLowerCase().includes(term);
      case "Email":
        return r.email.toLowerCase().includes(term);
      case "Grade":
        return r.grade.toLowerCase().includes(term);
      case "Type contrat":
        return String(r.typeContrat || "").toLowerCase().includes(term);
      default:
        return (
          String(r.matricule || "").toLowerCase().includes(term) ||
          r.cin.toLowerCase().includes(term) ||
          r.nom.toLowerCase().includes(term) ||
          r.prenom.toLowerCase().includes(term) ||
          r.email.toLowerCase().includes(term) ||
          r.grade.toLowerCase().includes(term) ||
          String(r.typeContrat || "").toLowerCase().includes(term)
        );
    }
  });

  const handleOpenForm = (rapporteur = null) => {
    setSelectedRapporteur(rapporteur);
    setShowForm(true);
    setError('');
    setMessage('');
  };

  const handleCloseForm = () => {
    setSelectedRapporteur(null);
    setShowForm(false);
  };

  const handleSaveRapporteur = async (data) => {
    try {
      if (selectedRapporteur) {
        await axios.put(`/api/rapporteurs/${selectedRapporteur.matricule}/`, data);
        setMessage('Rapporteur modifié avec succès.');
      } else {
        await axios.post('/api/rapporteurs/', data);
        setMessage('Rapporteur ajouté avec succès.');
      }
      handleCloseForm();
      loadData();
    } catch (err) {
      const d = err.response?.data;
      let msg = 'Erreur lors de l\'enregistrement.';
      if (typeof d === 'string') msg = d;
      else if (d?.detail) msg = typeof d.detail === 'string' ? d.detail : JSON.stringify(d.detail);
      else if (d && typeof d === 'object') {
        msg = Object.entries(d)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
          .join(' · ');
      }
      setError(msg);
    }
  };

  const handleDeleteRapporteur = async (matricule) => {
    if (!window.confirm('Supprimer ce rapporteur ?')) return;
    try {
      await axios.delete(`/api/rapporteurs/${matricule}/`);
      setMessage('Rapporteur supprimé avec succès.');
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Impossible de supprimer le rapporteur.");
    }
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
          if (normKey === 'numtel' || normKey === 'num tel' || normKey === 'telephone' || normKey === 'téléphone') finalKey = 'numTel';
          if (normKey === 'daterecrutement' || normKey === 'date recrutement' || normKey === 'date_recrutement') finalKey = 'dateRecrutement';
          if (normKey === 'typecontrat' || normKey === 'type contrat') finalKey = 'typeContrat';
          if (normKey === 'statutadministratif' || normKey === 'statut administratif' || normKey === 'statut_administratif') finalKey = 'statutAdministratif';
          if (normKey === 'prénom') finalKey = 'prenom';
          
          acc[finalKey] = row[key];
          return acc;
        }, {});
      });

      if (!Array.isArray(importedData) || !importedData.length) {
        setError("Aucune donnée importable trouvée.");
        return;
      }

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

      if (!cleanedData.length) {
        setError("Aucune ligne valide trouvée après nettoyage.");
        return;
      }

      let successCount = 0;
      for (const rapporteur of cleanedData) {
        try {
          await axios.post('/api/rapporteurs/', rapporteur);
          successCount++;
        } catch (itemErr) {
          console.error(`Erreur pour ${rapporteur.matricule}:`, itemErr);
        }
      }
      setMessage(`${successCount} rapporteur(s) importé(s) avec succès`);
      setError('');
      loadData();
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'importation: " + (err.message || "Veuillez vérifier le format de vos données."));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const normalizeSpaces = (value) =>
    typeof value === "string"
      ? value.trim().replace(/\s+/g, " ")
      : value;

  const cleanDigits = (value) =>
    String(value || "").replace(/\D/g, "");

  const cleanEmail = (value) =>
    String(value || "").trim().toLowerCase();

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
        case "matricule":
          return "matricule";
        case "cin":
          return "cin";
        case "nom":
          return "nom";
        case "prenom":
        case "prénom":
          return "prenom";
        case "email":
          return "email";
        case "grade":
          return "grade";
        case "numtel":
        case "num tel":
        case "telephone":
        case "téléphone":
          return "numTel";
        case "daterecrutement":
        case "date recrutement":
        case "date_recrutement":
          return "dateRecrutement";
        case "statutadministratif":
        case "statut administratif":
        case "statut_administratif":
          return "statutAdministratif";
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

  return (
    <div className="main-container">
      <h2 className="page-title">Gestion des Rapporteurs</h2>
      {message && <div className="success-message">{message}</div>}
      {error && <div className="success-message" style={{ background: '#e53e3e' }}>{error}</div>}

      {loading ? (
        <div className="table-card">Chargement en cours...</div>
      ) : (
        <>
          <div className="page-container">
            <div className="search-area">
              <select
                className="filter-select"
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
              >
                <option>Tous les champs</option>
                <option>Matricule</option>
                <option>CIN</option>
                <option>Nom</option>
                <option>Prénom</option>
                <option>Email</option>
                <option>Grade</option>
                <option>Type contrat</option>
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
              <button onClick={handleImportClick} className="btn import-btn">
                Importer fichier
              </button>
              <button
                className="btn"
                onClick={() => handleOpenForm(null)}
              >
                Nouveau rapporteur
              </button>
            </div>
          </div>

          <input
            type="file"
            accept=".csv,.json,.xlsx,.xls"
            ref={fileRef}
            style={{ display: "none" }}
            onChange={handleImport}
          />

          <RapporteursTable
            rapporteurs={filteredRapporteurs}
            onEdit={handleOpenForm}
            onDelete={handleDeleteRapporteur}
          />
        </>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <RapporteursForm
              selected={selectedRapporteur}
              onSubmit={handleSaveRapporteur}
              onCancel={handleCloseForm}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionRapporteurs;