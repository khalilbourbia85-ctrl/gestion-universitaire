import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import LicenceForm from '../components/LicenceForm';
import LicenceTable from '../components/LicenceTable';
import { parseFile } from "../utils/fileParser";
import './GestionEtudiants.css';

const GestionLicences = () => {
  const [licences, setLicences] = useState([]);
  const [filteredLicences, setFilteredLicences] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('Nom');
  const [showForm, setShowForm] = useState(false);
  const [selectedLicence, setSelectedLicence] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const fileRef = useRef(null);

  const fetchLicences = async () => {
    try {
      const response = await axios.get('/api/licences/');
      setLicences(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des licences:', error);
      setError('Erreur lors du chargement des licences: ' + (error.response?.data?.detail || error.message));
      // Ne pas afficher d'alert, utiliser le state error à la place
    }
  };

  const fetchDepartements = async () => {
    try {
      const response = await axios.get('/api/departements/');
      setDepartements(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des départements:', error);
      setError('Erreur lors du chargement des départements: ' + (error.response?.data?.detail || error.message));
    }
  };

  useEffect(() => {
    fetchLicences();
    fetchDepartements();
  }, []);

  const applyFilters = () => {
    let filtered = licences;

    if (searchTerm) {
      filtered = filtered.filter(lic => {
        switch (filterBy) {
          case 'Mention':
            return lic.nom.toLowerCase().includes(searchTerm.toLowerCase());
          case 'Domaine':
            return lic.domaine && lic.domaine.toLowerCase().includes(searchTerm.toLowerCase());
          case 'Parcours':
            return lic.parcours && lic.parcours.toLowerCase().includes(searchTerm.toLowerCase());
          case 'Département':
            return lic.departement_nom && lic.departement_nom.toLowerCase().includes(searchTerm.toLowerCase());
          default:
            return lic.nom.toLowerCase().includes(searchTerm.toLowerCase());
        }
      });
    }

    setFilteredLicences(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [licences, searchTerm, filterBy]);

  const handleAdd = async (formData) => {
    try {
      if (selectedLicence) {
        await axios.put(`/api/licences/${selectedLicence.id}/`, formData);
        setMessage('Licence mise à jour avec succès !');
        setError('');
      } else {
        await axios.post('/api/licences/', formData);
        setMessage('Licence ajoutée avec succès !');
        setError('');
      }
      fetchLicences();
      setShowForm(false);
      setSelectedLicence(null);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      setError('Erreur lors de l\'enregistrement : ' + (error.response?.data?.error || error.message));
      setMessage('');
    }
  };

  const handleEdit = (lic) => {
    setSelectedLicence(lic);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette licence ?')) {
      try {
        await axios.delete(`/api/licences/${id}/`);
        setMessage('Licence supprimée avec succès !');
        setError('');
        fetchLicences();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        setError('Erreur lors de la suppression : ' + (error.response?.data?.error || error.message));
        setMessage('');
      }
    }
  };

  const handleImportExcel = () => {
    fileRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
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
          if (normKey === 'nom' || normKey === 'mention') finalKey = 'nom';
          if (normKey === 'code' || normKey === 'identifiant') finalKey = 'code';
          if (normKey === 'domaine') finalKey = 'domaine';
          if (normKey === 'parcours') finalKey = 'parcours';
          if (normKey === 'departement' || normKey === 'département') finalKey = 'departement'; // this usually expects an ID, but backend handles it or it's a separate process... let's just use it
          
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
          await axios.post('/api/licences/', record);
          successCount++;
        } catch (itemErr) {
          console.error(`Erreur lors de l'import:`, itemErr);
        }
      }
      setMessage(`${successCount} licence(s) importée(s) avec succès !`);
      setError('');
      fetchLicences();
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'importation: " + (err.message || "Veuillez vérifier le format de vos données."));
    } finally {
      event.target.value = null;
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedLicence(null);
  };

  return (
    <div className="gestion-container">
      <h2>Gestion des Licences</h2>

      <div className="controls-section">
        <div className="search-area">
          <div className="filter-group">
            <label>Filtrer par:</label>
            <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
              <option value="Mention">Mention</option>
              <option value="Domaine">Domaine</option>
              <option value="Parcours">Parcours</option>
              <option value="Département">Département</option>
            </select>
          </div>
          <input
            type="text"
            placeholder={`Rechercher par ${filterBy.toLowerCase()}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <button
          className="btn btn-add"
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) setSelectedLicence(null);
          }}
        >
          {showForm ? 'Annuler' : '+ Nouvelle Licence'}
        </button>
        <button className="btn btn-import" onClick={handleImportExcel}>
          📥 Importer fichier
        </button>
        <input
          type="file"
          ref={fileRef}
          onChange={handleFileChange}
          accept=".csv,.json,.xlsx,.xls"
          style={{ display: 'none' }}
        />
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="form-container">
          <LicenceForm
            onSubmit={handleAdd}
            selectedLicence={selectedLicence}
            onCancel={handleCancel}
            departements={departements}
          />
        </div>
      )}

      <div className="table-container">
        <LicenceTable
          licences={filteredLicences}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default GestionLicences;
