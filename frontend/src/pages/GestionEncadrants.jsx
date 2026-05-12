import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import EncadrantsTable from '../components/EncadrantsTable';
import EncadrantsForm from '../components/EncadrantsForm';
import { parseFile } from "../utils/fileParser";
import './GestionEtudiants.css';

function matriculeKeyPlafond(m) {
  if (m === null || m === undefined) return '';
  if (typeof m === 'object') return '';
  return String(m).trim();
}

function clampPlafond(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 5;
  return Math.min(99, Math.max(1, Math.floor(x)));
}

function GestionEncadrants() {
  const [enseignants, setEnseignants] = useState([]);
  const [pfes, setPfes] = useState([]);
  const [plafondGroupesGlobal, setPlafondGroupesGlobal] = useState(5);
  const [selectedEncadrant, setSelectedEncadrant] = useState(null);
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
      const [ensRes, pfesRes, paramRes] = await Promise.all([
        axios.get('/api/enseignants/'),
        axios.get('/api/pfes/'),
        axios.get('/api/pfes/parametres/').catch(() => ({ data: { plafond_groupes: 5 } })),
      ]);
      setEnseignants(Array.isArray(ensRes.data) ? ensRes.data : []);
      setPfes(Array.isArray(pfesRes.data) ? pfesRes.data : []);
      setPlafondGroupesGlobal(clampPlafond(paramRes?.data?.plafond_groupes ?? 5));
      setError('');
    } catch (err) {
      setError('Impossible de charger les encadrants');
      setEnseignants([]);
      setPfes([]);
    } finally {
      setLoading(false);
    }
  };

  const countPfeParEncadrant = useMemo(() => {
    const c = {};
    (pfes || []).forEach((p) => {
      if (p.encadrant != null && p.encadrant !== '') {
        const k = String(p.encadrant).trim();
        if (k) c[k] = (c[k] || 0) + 1;
      }
    });
    return c;
  }, [pfes]);

  const encadrantAuPlafondPfe = useCallback(
    (e) => {
      const mk = matriculeKeyPlafond(e?.matricule);
      if (!mk) return false;
      const actifs = countPfeParEncadrant[mk] || 0;
      const max = plafondGroupesGlobal;
      return max >= 1 && actifs >= max;
    },
    [countPfeParEncadrant, plafondGroupesGlobal]
  );

  useEffect(() => {
    loadData();
  }, []);

  const filteredEnseignants = enseignants.filter((e) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    switch (filterBy) {
      case "Matricule":
        return String(e.matricule || "").toLowerCase().includes(term);
      case "CIN":
        return e.cin.toLowerCase().includes(term);
      case "Nom":
        return e.nom.toLowerCase().includes(term);
      case "Prénom":
        return e.prenom.toLowerCase().includes(term);
      case "Email":
        return e.email.toLowerCase().includes(term);
      case "Grade":
        return e.grade.toLowerCase().includes(term);
      case "Type contrat":
        return String(e.typeContrat || "").toLowerCase().includes(term);
      default:
        return (
          String(e.matricule || "").toLowerCase().includes(term) ||
          e.cin.toLowerCase().includes(term) ||
          e.nom.toLowerCase().includes(term) ||
          e.prenom.toLowerCase().includes(term) ||
          e.email.toLowerCase().includes(term) ||
          e.grade.toLowerCase().includes(term) ||
          String(e.typeContrat || "").toLowerCase().includes(term)
        );
    }
  });

  const handleOpenForm = (enseignant = null) => {
    setSelectedEncadrant(enseignant);
    setShowForm(true);
    setError('');
    setMessage('');
  };

  const handleCloseForm = () => {
    setSelectedEncadrant(null);
    setShowForm(false);
  };

  const handleSaveEncadrant = async (data) => {
    try {
      if (selectedEncadrant) {
        await axios.put(`/api/enseignants/${selectedEncadrant.matricule}/`, data);
        setMessage('Encadrant modifié avec succès.');
      } else {
        await axios.post('/api/enseignants/', data);
        setMessage('Encadrant ajouté avec succès.');
      }
      handleCloseForm();
      loadData();
    } catch (err) {
      const data = err.response?.data;
      let msg = 'Erreur lors de l\'enregistrement.';
      if (data) {
        if (typeof data === 'string') msg = data;
        else if (data.detail) msg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        else if (Array.isArray(data)) msg = data.join('; ');
        else if (typeof data === 'object') {
          const parts = Object.entries(data).map(([k, v]) => {
            const s = Array.isArray(v) ? v.join(' ') : String(v);
            return `${k}: ${s}`;
          });
          if (parts.length) msg = parts.join('; ');
        }
      }
      setError(msg);
    }
  };

  const handleDeleteEncadrant = async (matricule) => {
    if (!window.confirm('Supprimer cet encadrant ?')) return;
    try {
      await axios.delete(`/api/enseignants/${matricule}/`);
      setMessage('Encadrant supprimé avec succès.');
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Impossible de supprimer l'encadrant.");
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
      for (const enseignant of cleanedData) {
        try {
          await axios.post('/api/enseignants/', enseignant);
          successCount++;
        } catch (itemErr) {
          console.error(`Erreur pour ${enseignant.matricule}:`, itemErr);
        }
      }
      setMessage(`${successCount} encadrant(s) importé(s) avec succès`);
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

  const cleanEnseignant = (item) => ({
    matricule: normalizeSpaces(item.matricule),
    cin: cleanDigits(item.cin),
    nom: normalizeSpaces(item.nom),
    prenom: normalizeSpaces(item.prenom),
    email: cleanEmail(item.email),
    grade: normalizeSpaces(item.grade),
    numTel: cleanDigits(item.numTel),
    dateRecrutement: String(item.dateRecrutement || "").trim(),
    typeContrat: normalizeSpaces(item.typeContrat),
    dateTitularisation: String(item.dateTitularisation || "").trim(),
    statutAdministratif: normalizeSpaces(item.statutAdministratif),
    diplome: {
      idDiplome: normalizeSpaces(item.idDiplome),
      libelleDiplome: normalizeSpaces(item.libelleDiplome),
      specialite: normalizeSpaces(item.specialite),
      dateObtention: String(item.dateObtention || "").trim()
    }
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
      <h2 className="page-title">Gestion des Encadrants</h2>
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
                Nouvel encadrant
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

          <EncadrantsTable
            enseignants={filteredEnseignants}
            onEdit={handleOpenForm}
            onDelete={handleDeleteEncadrant}
            encadrantAuPlafondPfe={encadrantAuPlafondPfe}
          />
        </>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <EncadrantsForm
              key={selectedEncadrant ? selectedEncadrant.matricule : 'nouveau'}
              selected={selectedEncadrant}
              onSubmit={handleSaveEncadrant}
              onCancel={handleCloseForm}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionEncadrants;