import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SpecialiteForm from '../components/SpecialiteForm';
import SpecialiteTable from '../components/SpecialiteTable';
import MultiSelectDropdown from "../components/MultiSelectDropdown";
import './GestionEtudiants.css';

const GestionSpecialites = () => {
  const [specialites, setSpecialites] = useState([]);
  const [filteredSpecialites, setFilteredSpecialites] = useState([]);
  const [licences, setLicences] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState(['Tous les champs']);
  const [showForm, setShowForm] = useState(false);
  const [selectedSpecialite, setSelectedSpecialite] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchSpecialites = async () => {
    try {
      const response = await axios.get('/api/specialites/');
      setSpecialites(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des spécialités:', error);
      setError('Erreur lors du chargement des spécialités: ' + (error.response?.data?.detail || error.message));
    }
  };

  const fetchLicences = async () => {
    try {
      const response = await axios.get('/api/licences/');
      setLicences(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des licences:', error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSpecialites();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLicences();
  }, []);

  const applyFilters = () => {
    let filtered = specialites;

    if (searchTerm) {
      filtered = filtered.filter(spec => {
        if (filterBy.includes('Tous les champs')) {
          return (
            spec.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            spec.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (spec.licence_nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (spec.departement_nom || '').toLowerCase().includes(searchTerm.toLowerCase())
          );
        } else {
          return filterBy.some(field => {
            switch (field) {
              case 'Nom':
                return spec.nom.toLowerCase().includes(searchTerm.toLowerCase());
              case 'Code':
                return spec.code.toLowerCase().includes(searchTerm.toLowerCase());
              case 'Licence':
                return (spec.licence_nom || '').toLowerCase().includes(searchTerm.toLowerCase());
              case 'Département':
                return (spec.departement_nom || '').toLowerCase().includes(searchTerm.toLowerCase());
              default:
                return false;
            }
          });
        }
      });
    }

    setFilteredSpecialites(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [specialites, searchTerm, filterBy]);

  const handleAdd = async (formData) => {
    try {
      if (selectedSpecialite) {
        await axios.put(`/api/specialites/${selectedSpecialite.id}/`, formData);
        setMessage('Spécialité mise à jour avec succès !');
        setError('');
      } else {
        await axios.post('/api/specialites/', formData);
        setMessage('Spécialité ajoutée avec succès !');
        setError('');
      }
      fetchSpecialites();
      setShowForm(false);
      setSelectedSpecialite(null);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      setError('Erreur lors de l\'enregistrement : ' + (error.response?.data?.error || error.message));
      setMessage('');
    }
  };

  const handleEdit = (spec) => {
    setSelectedSpecialite(spec);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette spécialité ?')) {
      try {
        await axios.delete(`/api/specialites/${id}/`);
        setMessage('Spécialité supprimée avec succès !');
        setError('');
        fetchSpecialites();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        setError('Erreur lors de la suppression : ' + (error.response?.data?.error || error.message));
        setMessage('');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedSpecialite(null);
  };

  return (
    <div className="gestion-container">
      <h2>Gestion des Spécialités</h2>

      <div className="controls-section">
        <div className="search-area" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569' }}>Afficher/Chercher :</span>
            <MultiSelectDropdown
              label="Tous les champs sélectionnés"
              options={[
                "Tous les champs",
                "Nom",
                "Code",
                "Licence",
                "Département"
              ]}
              selected={filterBy}
              onChange={setFilterBy}
            />
          </div>
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <button
          className="btn btn-add"
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) setSelectedSpecialite(null);
          }}
        >
          {showForm ? 'Annuler' : '+ Nouvelle Spécialité'}
        </button>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <SpecialiteForm
              onSubmit={handleAdd}
              selectedSpecialite={selectedSpecialite}
              onCancel={handleCancel}
              licences={licences}
            />
          </div>
        </div>
      )}

      <div className="table-container">
        <SpecialiteTable
          specialites={filteredSpecialites}
          onEdit={handleEdit}
          onDelete={handleDelete}
          filterBy={filterBy}
        />
      </div>
    </div>
  );
};

export default GestionSpecialites;