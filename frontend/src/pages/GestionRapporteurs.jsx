import React, { useEffect, useState, useRef } from 'react';
import axios from "../utils/axiosConfig";
import RapporteursTable from '../components/RapporteursTable';
import RapporteursForm from '../components/RapporteursForm';
import MultiSelectDropdown from "../components/MultiSelectDropdown";
import { parseFile } from "../utils/fileParser";
import './GestionEtudiants.css';

// Composant principal pour gérer les rapporteurs (affichage, création, modification, suppression, import)
function GestionRapporteurs() {
  // État principal contenant la liste des rapporteurs
  const [rapporteurs, setRapporteurs] = useState([]);
  // Rapporteur sélectionné pour édition
  const [selectedRapporteur, setSelectedRapporteur] = useState(null);
  // Affichage du formulaire modal
  const [showForm, setShowForm] = useState(false);
  // Terme de recherche saisi par l'utilisateur
  const [searchTerm, setSearchTerm] = useState('');
  // Champs sur lesquels filtrer la recherche
  const [filterBy, setFilterBy] = useState(['Tous les champs']);
  // Message de succès
  const [message, setMessage] = useState('');
  // Message d'erreur
  const [error, setError] = useState('');
  // État de chargement des données
  const [loading, setLoading] = useState(true);
  // Référence pour l'input fichier caché
  const fileRef = useRef(null);

  // Récupère la liste des rapporteurs depuis l'API
  const loadData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('rapporteurs/');
      setRapporteurs(Array.isArray(response.data) ? response.data : []);
      setError('');
    } catch (err) {
      setError('Impossible de charger les rapporteurs');
      setRapporteurs([]);
    } finally {
      setLoading(false);
    }
  };

  // Charge les données au montage du composant
  useEffect(() => {
    loadData();
  }, []);

  // Filtre les rapporteurs selon le terme de recherche et les champs sélectionnés
  const filteredRapporteurs = rapporteurs.filter((r) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();

    if (filterBy.includes("Tous les champs")) {
      return (
          String(r.matricule || "").toLowerCase().includes(term) ||
          r.cin.toLowerCase().includes(term) ||
          r.nom.toLowerCase().includes(term) ||
          r.prenom.toLowerCase().includes(term) ||
          r.email.toLowerCase().includes(term) ||
          r.grade.toLowerCase().includes(term) ||
          String(r.typeContrat || "").toLowerCase().includes(term)
      );
    } else {
      return filterBy.some(field => {
        switch (field) {
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
            return false;
        }
      });
    }
  });

  // Ouvre le formulaire modal pour créer ou éditer un rapporteur
  const handleOpenForm = (rapporteur = null) => {
    setSelectedRapporteur(rapporteur);
    setShowForm(true);
    setError('');
    setMessage('');
  };

  // Ferme le formulaire modal
  const handleCloseForm = () => {
    setSelectedRapporteur(null);
    setShowForm(false);
  };

  // Sauvegarde un rapporteur (création ou modification) via l'API
  const handleSaveRapporteur = async (data) => {
    try {
      if (selectedRapporteur) {
        await axios.put(`rapporteurs/${selectedRapporteur.matricule}/`, data);
        setMessage('Rapporteur modifié avec succès.');
      } else {
        await axios.post('rapporteurs/', data);
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

  // Supprime un rapporteur après confirmation
  const handleDeleteRapporteur = async (matricule) => {
    if (!window.confirm('Supprimer ce rapporteur ?')) return;
    try {
      await axios.delete(`rapporteurs/${matricule}/`);
      setMessage('Rapporteur supprimé avec succès.');
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Impossible de supprimer le rapporteur.");
    }
  };

  // Déclenche le sélecteur de fichier
  const handleImportClick = () => fileRef.current.click();

  // Importe les rapporteurs depuis un fichier Excel/CSV
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
          await axios.post('rapporteurs/', rapporteur);
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

  // Normalise les espaces multiples en espace unique
  const normalizeSpaces = (value) =>
    typeof value === "string"
      ? value.trim().replace(/\s+/g, " ")
      : value;

  // Extrait uniquement les chiffres d'une chaîne
  const cleanDigits = (value) =>
    String(value || "").replace(/\D/g, "");

  // Normalise un email en minuscules et sans espaces
  const cleanEmail = (value) =>
    String(value || "").trim().toLowerCase();

  // Normalise un en-tête pour la comparaison (minuscules, pas d'accents, espaces simples)
  const normalizeHeader = (header) =>
    String(header)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[^a-z0-9 ]/g, "");

  // Parse une ligne CSV en tenant compte des guillemets et des séparateurs
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

  // Parse un texte CSV en tableaux d'objets avec en-têtes
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

  // Interface principale : titre, messages, et contenu selon l'état de chargement
  return (
    <div className="main-container">
      <h2 className="page-title">Gestion des Rapporteurs</h2>
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="table-card">Chargement en cours...</div>
      ) : (
        <>
          {/* Contenu principal avec zone de recherche, boutons et tableau */}
          <div className="page-container">
            <div className="search-area" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569' }}>Afficher/Chercher :</span>
                <MultiSelectDropdown
                  label="Tous les champs sélectionnés"
                  options={[
                    "Tous les champs",
                    "Matricule",
                    "CIN",
                    "Nom",
                    "Prénom",
                    "Email",
                    "Grade",
                    "Type contrat"
                  ]}
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

            {/* Boutons d'action : import et création */}
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

          {/* Input fichier caché pour l'import */}
          <input
            type="file"
            accept=".csv,.json,.xlsx,.xls"
            ref={fileRef}
            style={{ display: "none" }}
            onChange={handleImport}
          />

          {/* Tableau des rapporteurs avec actions */}
          <RapporteursTable
            rapporteurs={filteredRapporteurs}
            onEdit={handleOpenForm}
            onDelete={handleDeleteRapporteur}
            filterBy={filterBy}
          />
        </>
      )}

      {/* Modal du formulaire pour créer/éditer un rapporteur */}
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