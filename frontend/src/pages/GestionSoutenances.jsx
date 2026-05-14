import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import SoutenancesTable from '../components/SoutenancesTable';
import SoutenanceForm from '../components/SoutenanceForm';
import MultiSelectDropdown from "../components/MultiSelectDropdown";
import { parseFile } from "../utils/fileParser";
import './GestionSoutenances.css';

function GestionSoutenances() {
  const [soutenances, setSoutenances] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [pfes, setPFEs] = useState([]);
  const [selectedSoutenance, setSelectedSoutenance] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState(['Tous les champs']);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const fileRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [soutenanceRes, enseignantRes, etudiantRes, pfeRes] = await Promise.all([
        axios.get('/api/soutenances/'),
        axios.get('/api/enseignants/'),
        axios.get('/api/etudiants/'),
        axios.get('/api/pfes/')
      ]);

      setSoutenances(Array.isArray(soutenanceRes.data) ? soutenanceRes.data : (soutenanceRes.data?.results || []));
      setEnseignants(Array.isArray(enseignantRes.data) ? enseignantRes.data : (enseignantRes.data?.results || []));
      setEtudiants(Array.isArray(etudiantRes.data) ? etudiantRes.data : (etudiantRes.data?.results || []));
      setPFEs(Array.isArray(pfeRes.data) ? pfeRes.data : (pfeRes.data?.results || []));
      setError('');
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Impossible de charger les données.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSoutenances = soutenances.filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    
    if (filterBy.includes("Tous les champs")) {
      return (
          String(s?.idSoutenance || '').toLowerCase().includes(term) ||
          String(s?.date_soutenance || '').toLowerCase().includes(term) ||
          String(s?.heure_soutenance || '').toLowerCase().includes(term) ||
          String(s?.salle || '').toLowerCase().includes(term) ||
          String(s?.encadrant_detail?.nom || '').toLowerCase().includes(term) ||
          String(s?.encadrant_detail?.prenom || '').toLowerCase().includes(term) ||
          String(s?.encadrant_detail?.typeContrat || '').toLowerCase().includes(term) ||
          String(s?.rapporteur_detail?.nom || '').toLowerCase().includes(term) ||
          String(s?.rapporteur_detail?.prenom || '').toLowerCase().includes(term) ||
          String(s?.rapporteur_detail?.typeContrat || '').toLowerCase().includes(term)
      );
    } else {
      return filterBy.some(field => {
        switch (field) {
          case "ID Soutenance":
            return String(s?.idSoutenance || '').toLowerCase().includes(term);
          case "Date":
            return String(s?.date_soutenance || '').toLowerCase().includes(term);
          case "Heure":
            return String(s?.heure_soutenance || '').toLowerCase().includes(term);
          case "Salle":
            return String(s?.salle || '').toLowerCase().includes(term);
          case "Encadrant":
            return String(s?.encadrant_detail?.nom || '').toLowerCase().includes(term) ||
              String(s?.encadrant_detail?.prenom || '').toLowerCase().includes(term);
          case "Type contrat (enc.)":
            return String(s?.encadrant_detail?.typeContrat || '').toLowerCase().includes(term);
          case "Rapporteur":
            return String(s?.rapporteur_detail?.nom || '').toLowerCase().includes(term) ||
              String(s?.rapporteur_detail?.prenom || '').toLowerCase().includes(term);
          case "Type contrat (rap.)":
            return String(s?.rapporteur_detail?.typeContrat || '').toLowerCase().includes(term);
          default:
            return false;
        }
      });
    }
  });

  const handleOpenForm = (soutenance = null) => {
    setSelectedSoutenance(soutenance);
    setShowForm(true);
    setError('');
    setMessage('');
  };

  const handleCloseForm = () => {
    setSelectedSoutenance(null);
    setShowForm(false);
  };

  const handleSaveSoutenance = async (data) => {
    try {
      if (selectedSoutenance) {
        await axios.put(`/api/soutenances/${selectedSoutenance.idSoutenance}/`, data);
        setMessage('Soutenance modifiée avec succès.');
      } else {
        await axios.post('/api/soutenances/', data);
        setMessage('Soutenance ajoutée avec succès.');
      }
      handleCloseForm();
      loadData();
    } catch (err) {
      const d = err.response?.data;
      let msg = "Erreur lors de l'enregistrement.";
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

  const handleDeleteSoutenance = async (idSoutenance) => {
    if (!window.confirm('Supprimer cette soutenance ?')) return;
    try {
      await axios.delete(`/api/soutenances/${idSoutenance}/`);
      setMessage('Soutenance supprimée avec succès.');
      loadData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Erreur lors de la suppression de la soutenance.");
    }
  };

  const handleImportClick = () => {
    fileRef.current.click();
  };

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
          if (normKey === 'idsoutenance' || normKey === 'id soutenance') finalKey = 'idSoutenance';
          if (normKey === 'date' || normKey === 'date soutenance' || normKey === 'date_soutenance') finalKey = 'date_soutenance';
          if (normKey === 'heure' || normKey === 'heure soutenance' || normKey === 'heure_soutenance') finalKey = 'heure_soutenance';
          
          acc[finalKey] = row[key];
          return acc;
        }, {});
      });

      if (!Array.isArray(importedData) || !importedData.length) {
        return alert('Aucune donnée importable trouvée.');
      }

      setLoading(true);
      let successCount = 0;
      for (const record of importedData) {
        try {
          if (record.etudiants && typeof record.etudiants === 'string') {
            record.etudiants = record.etudiants.split(';').map(id => Number(id.trim())).filter(id => !isNaN(id));
          }
          await axios.post('/api/soutenances/', record);
          successCount++;
        } catch (err) {
          console.error("Erreur lors de l'import:", err);
        }
      }
      setMessage(`${successCount} soutenance(s) importée(s) avec succès.`);
      await loadData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'importation: " + (err.message || "Veuillez vérifier le format de vos données."));
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="main-container soutenances-page-container">
      <h2 className="page-title">Gestion des Soutenances</h2>
      {message && <div className="success-message">{message}</div>}
      {error && <div className="success-message" style={{ background: '#e53e3e' }}>{error}</div>}

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
                  options={[
                    "Tous les champs",
                    "ID Soutenance",
                    "Date",
                    "Heure",
                    "Salle",
                    "Encadrant",
                    "Type contrat (enc.)",
                    "Rapporteur",
                    "Type contrat (rap.)"
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

            <div className="buttons-area">
              <button
                className="btn import-btn"
                onClick={handleImportClick}
              >
                Importer fichier
              </button>
              <button
                className="btn"
                onClick={() => handleOpenForm(null)}
              >
                Nouvelle soutenance
              </button>
            </div>
          </div>

          <input
            type="file"
            accept=".csv,.json,.xlsx,.xls"
            ref={fileRef}
            style={{ display: 'none' }}
            onChange={handleImport}
          />

          <SoutenancesTable
            soutenances={filteredSoutenances}
            onEdit={handleOpenForm}
            onDelete={handleDeleteSoutenance}
            filterBy={filterBy}
          />
        </>
      )}

      {showForm && (
        <SoutenanceForm
          soutenance={selectedSoutenance}
          soutenances={soutenances}
          enseignants={enseignants}
          etudiants={etudiants}
          pfes={pfes}
          onCancel={handleCloseForm}
          onSubmit={handleSaveSoutenance}
        />
      )}
    </div>
  );
}

export default GestionSoutenances;