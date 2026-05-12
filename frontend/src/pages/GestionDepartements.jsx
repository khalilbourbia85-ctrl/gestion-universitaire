import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import DepartementForm from '../components/DepartementForm';
import DepartementTable from '../components/DepartementTable';
import ChefProfileModal from '../components/ChefProfileModal';
import { parseFile } from "../utils/fileParser";
import './GestionEtudiants.css';

const GestionDepartements = ({ role }) => {
  const [departements, setDepartements] = useState([]);
  const [filteredDepartements, setFilteredDepartements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('Nom');
  const [showForm, setShowForm] = useState(false);
  const [selectedDepartement, setSelectedDepartement] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewProfileId, setViewProfileId] = useState(null);
  
  const fileRef = useRef(null);

  useEffect(() => {
    fetchDepartements();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [departements, searchTerm, filterBy]);

  const fetchDepartements = async () => {
    try {
      const response = await axios.get('/api/departements/');
      setDepartements(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du chargement des départements');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = departements;

    if (searchTerm) {
      filtered = filtered.filter(dept => {
        switch (filterBy) {
          case 'Nom':
            return dept.nom.toLowerCase().includes(searchTerm.toLowerCase());
          case 'Code':
            return dept.code.toLowerCase().includes(searchTerm.toLowerCase());
          case 'Responsable':
            return (dept.responsable || '').toLowerCase().includes(searchTerm.toLowerCase());
          case 'Email':
            return (dept.email || '').toLowerCase().includes(searchTerm.toLowerCase());
          default:
            return dept.nom.toLowerCase().includes(searchTerm.toLowerCase());
        }
      });
    }

    setFilteredDepartements(filtered);
  };

  const handleAdd = async (formData) => {
    try {
      if (selectedDepartement) {
        await axios.put(`/api/departements/${selectedDepartement.id}/`, formData);
        alert('Département mis à jour avec succès');
      } else {
        await axios.post('/api/departements/', formData);
        alert('Département ajouté avec succès');
      }
      fetchDepartements();
      setShowForm(false);
      setSelectedDepartement(null);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement du département');
    }
  };

  const handleEdit = (dept) => {
    setSelectedDepartement(dept);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/departements/${id}/`);
      alert('Département supprimé avec succès');
      fetchDepartements();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression du département');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedDepartement(null);
  };

  const handleImportExcel = () => {
    fileRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
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
          if (normKey === 'nom' || normKey === 'intitule') finalKey = 'nom';
          if (normKey === 'code' || normKey === 'identifiant') finalKey = 'code';
          if (normKey === 'responsable' || normKey === 'chef' || normKey === 'chef de departement') finalKey = 'responsable';
          if (normKey === 'email' || normKey === 'courriel') finalKey = 'email';
          
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
          await axios.post('/api/departements/', record);
          successCount++;
        } catch (itemErr) {
          console.error(`Erreur lors de l'import:`, itemErr);
        }
      }
      setMessage(`${successCount} département(s) importé(s) avec succès.`);
      setError('');
      fetchDepartements();
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'importation: " + (err.message || "Veuillez vérifier le format de vos données."));
    } finally {
      event.target.value = null;
    }
  };

  return (
    <div className="gestion-container">
      <h2>Gestion des Départements</h2>
      
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <input
        type="file"
        ref={fileRef}
        onChange={handleFileChange}
        accept=".csv,.json,.xlsx,.xls"
        style={{ display: 'none' }}
      />

      <div className="controls-section">
        <div className="search-area">
          <div className="filter-group">
            <label>Filtrer par:</label>
            <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
              <option value="Nom">Nom</option>
              <option value="Code">Code</option>
              <option value="Responsable">Responsable</option>
              <option value="Email">Email</option>
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

        <div className="buttons-area">
          <button
            className="btn btn-add"
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) setSelectedDepartement(null);
            }}
          >
            {showForm ? 'Annuler' : '+ Nouveau Département'}
          </button>
          <button className="btn btn-import" onClick={handleImportExcel}>
            📥 Importer Départements
          </button>
        </div>
      </div>

      {showForm && (
        <div className="form-container">
          <DepartementForm
            onSubmit={handleAdd}
            selectedDepartement={selectedDepartement}
            onCancel={handleCancel}
          />
        </div>
      )}

      <div className="table-container">
        <DepartementTable
          departements={filteredDepartements}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewProfile={(dept) => setViewProfileId(dept.id)}
        />
      </div>

      {viewProfileId && (
        <ChefProfileModal 
          departementId={viewProfileId} 
          onClose={() => setViewProfileId(null)} 
          onUpdate={fetchDepartements}
        />
      )}
    </div>
  );
};

export default GestionDepartements;
