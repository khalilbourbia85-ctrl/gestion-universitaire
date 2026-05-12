import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ModuleForm from '../components/ModuleForm';
import ModuleTable from '../components/ModuleTable';
import { parseFile } from "../utils/fileParser";
import './GestionEtudiants.css';

const GestionModules = () => {
  const [modules, setModules] = useState([]);
  const [filteredModules, setFilteredModules] = useState([]);
  const [licences, setLicences] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('Nom');
  const [selectedLicence, setSelectedLicence] = useState(null);
  const [selectedSpecialite, setSelectedSpecialite] = useState(null);
  const [selectedAnnee, setSelectedAnnee] = useState(null);
  const [filteredSpecialites, setFilteredSpecialites] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const fileRef = useRef(null);

  const fetchModules = async () => {
    try {
      const response = await axios.get('/api/modules/');
      setModules(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du chargement des modules');
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

  const fetchSpecialites = async () => {
    try {
      const response = await axios.get('/api/specialites/');
      setSpecialites(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des spécialités:', error);
    }
  };

  useEffect(() => {
    fetchModules();
    fetchLicences();
    fetchSpecialites();
  }, []);

  const applyFilters = () => {
    let filtered = modules;

    if (selectedAnnee) {
      filtered = filtered.filter(mod => normalizeYear(mod.annee) === selectedAnnee);
    }

    if (selectedSpecialite) {
      filtered = filtered.filter(mod => {
        const modSpecialiteId = typeof mod.specialite === 'object' ? mod.specialite?.id : mod.specialite;
        return modSpecialiteId === selectedSpecialite;
      });
    } else if (selectedLicence) {
      filtered = filtered.filter(mod => {
        const modLicenceId = typeof mod.licence === 'object' ? mod.licence?.id : mod.licence;
        return modLicenceId === selectedLicence;
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(mod => {
        switch (filterBy) {
          case 'Nom':
            return mod.nom.toLowerCase().includes(searchTerm.toLowerCase());
          case 'Spécialité':
            return mod.specialite_nom?.toLowerCase().includes(searchTerm.toLowerCase());
          case 'Licence':
            return mod.licence_nom?.toLowerCase().includes(searchTerm.toLowerCase()) || mod.licence?.toString() === selectedLicence;
          case 'Département':
            return mod.departement_nom?.toLowerCase().includes(searchTerm.toLowerCase());
          case 'Année':
            return mod.annee.toLowerCase().includes(searchTerm.toLowerCase());
          case 'Semestre':
            return mod.semestre.toLowerCase().includes(searchTerm.toLowerCase());
          default:
            return mod.nom.toLowerCase().includes(searchTerm.toLowerCase());
        }
      });
    }

    const SEMESTRE_ORDER = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
    const ANNEE_ORDER = ['L1', 'L2', 'L3'];

    filtered.sort((a, b) => {
      const aYear = normalizeYear(a.annee);
      const bYear = normalizeYear(b.annee);
      const aYearIndex = ANNEE_ORDER.indexOf(aYear) !== -1 ? ANNEE_ORDER.indexOf(aYear) : 99;
      const bYearIndex = ANNEE_ORDER.indexOf(bYear) !== -1 ? ANNEE_ORDER.indexOf(bYear) : 99;
      if (aYearIndex !== bYearIndex) return aYearIndex - bYearIndex;

      const aSem = normalizeSemester(a.semestre);
      const bSem = normalizeSemester(b.semestre);
      const aSemIndex = SEMESTRE_ORDER.indexOf(aSem) !== -1 ? SEMESTRE_ORDER.indexOf(aSem) : 99;
      const bSemIndex = SEMESTRE_ORDER.indexOf(bSem) !== -1 ? SEMESTRE_ORDER.indexOf(bSem) : 99;
      if (aSemIndex !== bSemIndex) return aSemIndex - bSemIndex;

      return a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });
    });

    setFilteredModules(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [modules, searchTerm, filterBy, selectedLicence, selectedSpecialite, selectedAnnee, applyFilters]);

  useEffect(() => {
    if (!selectedLicence) {
      setFilteredSpecialites([]);
      setSelectedSpecialite(null);
      return;
    }

    const filtered = specialites.filter(spec => {
      const specLicenceId = typeof spec.licence === 'object' ? spec.licence?.id : spec.licence;
      return specLicenceId === selectedLicence;
    });
    setFilteredSpecialites(filtered);
    if (!filtered.some(spec => spec.id === selectedSpecialite)) {
      setSelectedSpecialite(null);
    }
  }, [selectedLicence, specialites, selectedSpecialite]);

  const normalizeYear = (annee) => {
    if (!annee) return '';
    const year = String(annee).toUpperCase().trim();
    if (['L1', 'L2', 'L3'].includes(year)) return year;
    if (year === '1') return 'L1';
    if (year === '2') return 'L2';
    if (year === '3') return 'L3';
    return year;
  };

  const normalizeSemester = (semestre) => {
    if (!semestre) return '';
    const sem = String(semestre).toUpperCase().trim();
    if (/^S[1-6]$/.test(sem)) return sem;
    const matched = sem.match(/^([1-6])$/);
    if (matched) return `S${matched[1]}`;
    return sem;
  };

  const handleLicenceChange = (e) => {
    const licenceId = e.target.value ? parseInt(e.target.value, 10) : null;
    setSelectedLicence(licenceId);
    setSelectedSpecialite(null);
  };

  const handleSpecialiteChange = (e) => {
    const specialiteId = e.target.value ? parseInt(e.target.value, 10) : null;
    setSelectedSpecialite(specialiteId);
  };

  const handleAdd = async (formData) => {
    try {
      if (selectedModule) {
        await axios.put(`/api/modules/${selectedModule.id}/`, formData);
        alert('Module mis à jour avec succès');
      } else {
        await axios.post('/api/modules/', formData);
        alert('Module ajouté avec succès');
      }
      fetchModules();
      setShowForm(false);
      setSelectedModule(null);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement du module');
    }
  };

  const handleEdit = (mod) => {
    setSelectedModule(mod);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/modules/${id}/`);
      alert('Module supprimé avec succès');
      fetchModules();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression du module');
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
          if (normKey === 'nom' || normKey === 'intitule') finalKey = 'nom';
          if (normKey === 'code' || normKey === 'identifiant') finalKey = 'code';
          if (normKey === 'specialite' || normKey === 'spécialité') finalKey = 'specialite';
          if (normKey === 'annee' || normKey === 'année') finalKey = 'annee';
          if (normKey === 'semestre') finalKey = 'semestre';
          if (normKey === 'volumecours' || normKey === 'volume cours' || normKey === 'volume_cours') finalKey = 'volume_cours';
          if (normKey === 'volumetd' || normKey === 'volume td' || normKey === 'volume_td') finalKey = 'volume_td';
          if (normKey === 'volumetp' || normKey === 'volume tp' || normKey === 'volume_tp') finalKey = 'volume_tp';
          
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
          await axios.post('/api/modules/', record);
          successCount++;
        } catch (itemErr) {
          console.error(`Erreur lors de l'import:`, itemErr);
        }
      }
      setMessage(`${successCount} module(s) importé(s) avec succès !`);
      setError('');
      fetchModules();
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'importation: " + (err.message || "Veuillez vérifier le format de vos données."));
    } finally {
      event.target.value = null;
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedModule(null);
  };

  return (
    <div className="gestion-container">
      <h2>Gestion des Modules</h2>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
        {['L1', 'L2', 'L3'].map((annee) => (
          <button
            key={annee}
            className={`btn ${selectedAnnee === annee ? 'btn-active' : ''}`}
            style={{
              backgroundColor: selectedAnnee === annee ? '#4a90e2' : '#f0f0f0',
              color: selectedAnnee === annee ? '#fff' : '#333',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onClick={() => setSelectedAnnee(selectedAnnee === annee ? null : annee)}
          >
            {annee === 'L1' ? '1ère année (L1)' : annee === 'L2' ? '2ème année (L2)' : '3ème année (L3)'}
          </button>
        ))}
      </div>

      <div className="controls-section">
        <div className="search-area">
          <div className="filter-group">
            <label>Licence</label>
            <select value={selectedLicence ?? ''} onChange={handleLicenceChange}>
              <option value="">Toutes les licences</option>
              {licences.map(licence => (
                <option key={licence.id} value={licence.id}>
                  {licence.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Spécialité</label>
            <select value={selectedSpecialite ?? ''} onChange={handleSpecialiteChange} disabled={!selectedLicence}>
              <option value="">Toutes les spécialités</option>
              {filteredSpecialites.map(spec => (
                <option key={spec.id} value={spec.id}>
                  {spec.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Filtrer par:</label>
            <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
              <option value="Nom">Nom</option>
              <option value="Spécialité">Spécialité</option>
              <option value="Licence">Licence</option>
              <option value="Département">Département</option>
              <option value="Année">Année</option>
              <option value="Semestre">Semestre</option>
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
            if (showForm) setSelectedModule(null);
          }}
        >
          {showForm ? 'Annuler' : '+ Nouveau Module'}
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
          <ModuleForm
            onSubmit={handleAdd}
            selectedModule={selectedModule}
            onCancel={handleCancel}
            specialites={specialites}
          />
        </div>
      )}

      <div className="table-container">
        {filteredModules.length > 0 ? (
          <>
            {Array.from(new Set(filteredModules.map(m => m.semestre))).sort().map(semestre => {
              const semModules = filteredModules.filter(m => m.semestre === semestre);
              return (
                <div key={semestre} style={{ marginBottom: '40px' }}>
                  <ModuleTable
                    modules={semModules}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
              );
            })}
          </>
        ) : (
          <div className="empty-message">Aucun module trouvé</div>
        )}
      </div>
    </div>
  );
};

export default GestionModules;
