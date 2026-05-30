import React, { useState, useEffect, useRef } from 'react';
import axios from "../utils/axiosConfig";
import ModuleForm from '../components/ModuleForm';
import ModuleTable from '../components/ModuleTable';
import MultiSelectDropdown from "../components/MultiSelectDropdown";
import { parseFile } from "../utils/fileParser";
import './GestionEtudiants.css';

const GestionModules = () => {
  const [modules, setModules] = useState([]);
  const [filteredModules, setFilteredModules] = useState([]);
  const [licences, setLicences] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState(['Tous les champs']);
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
      const response = await axios.get('modules/');
      setModules(response.data);
      setError('');
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement des modules');
    }
  };

  const fetchLicences = async () => {
    try {
      const response = await axios.get('licences/');
      setLicences(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des licences:', error);
    }
  };

  const fetchSpecialites = async () => {
    try {
      const response = await axios.get('specialites/');
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
        if (filterBy.includes('Tous les champs')) {
          return (
            mod.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (mod.specialite_nom?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (mod.licence_nom?.toLowerCase().includes(searchTerm.toLowerCase()) || mod.licence?.toString() === selectedLicence) ||
            (mod.departement_nom?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (mod.annee.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (mod.semestre.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        } else {
          return filterBy.some(field => {
            switch (field) {
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
                return false;
            }
          });
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
        await axios.put(`modules/${selectedModule.id}/`, formData);
        alert('Module mis à jour avec succès');
      } else {
        await axios.post('modules/', formData);
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
      await axios.delete(`modules/${id}/`);
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

      const getNormalizedKey = (field) => {
        const norm = String(field)
          .trim()
          .toLowerCase()
          .replace(/\s+/g, " ")
          .replace(/[^a-z0-9 ]/g, "");

        if (norm.includes("nom") || norm.includes("intitule") || norm.includes("module") || norm.includes("ue")) {
          return "nom";
        }
        if (norm.includes("code") || norm.includes("identifiant")) {
          return "code";
        }
        if (norm.includes("specialite") || norm.includes("spec")) {
          return "specialite";
        }
        if (norm.includes("licence") || norm.includes("mention")) {
          return "licence";
        }
        if (norm.includes("annee") || norm.includes("niveau")) {
          return "annee";
        }
        if (norm.includes("semestre") || norm.includes("sem")) {
          return "semestre";
        }
        if (norm.includes("cours") || norm === "c") {
          return "volume_cours";
        }
        if (norm.includes("td")) {
          return "volume_td";
        }
        if (norm.includes("tp")) {
          return "volume_tp";
        }
        return null;
      };

      const importedData = data.map(row => {
        return Object.keys(row).reduce((acc, key) => {
          const finalKey = getNormalizedKey(key);
          if (finalKey) {
            acc[finalKey] = row[key];
          }
          return acc;
        }, {});
      });

      if (!Array.isArray(importedData) || !importedData.length) {
        setError("Aucune donnée importable trouvée.");
        return;
      }

      const cleanedData = importedData.map(record => {
        const cleanRec = { ...record };
        
        // 1. Normalize annee & semestre
        if (cleanRec.annee) {
          cleanRec.annee = normalizeYear(cleanRec.annee);
        }
        if (cleanRec.semestre) {
          cleanRec.semestre = normalizeSemester(cleanRec.semestre);
        }

        // 2. Resolve Specialite (Number or Text)
        if (cleanRec.specialite && cleanRec.specialite !== "") {
          const parsedSpec = Number(cleanRec.specialite);
          if (!isNaN(parsedSpec)) {
            cleanRec.specialite = parsedSpec;
          } else {
            const cleanSpecStr = String(cleanRec.specialite).trim().toLowerCase();
            const matchedSpec = specialites.find(
              (s) =>
                String(s.code || "").trim().toLowerCase() === cleanSpecStr ||
                String(s.nom || "").trim().toLowerCase() === cleanSpecStr
            );
            if (matchedSpec) {
              cleanRec.specialite = matchedSpec.id;
              // If licence is missing, we can infer it from specialite!
              if (!cleanRec.licence && matchedSpec.licence) {
                cleanRec.licence = typeof matchedSpec.licence === 'object' ? matchedSpec.licence?.id : matchedSpec.licence;
              }
            } else {
              delete cleanRec.specialite;
            }
          }
        }

        // 3. Resolve Licence (Number or Text)
        if (cleanRec.licence && cleanRec.licence !== "") {
          const parsedLicence = Number(cleanRec.licence);
          if (!isNaN(parsedLicence)) {
            cleanRec.licence = parsedLicence;
          } else {
            const cleanLicStr = String(cleanRec.licence).trim().toLowerCase();
            const matchedLic = licences.find(
              (l) =>
                String(l.code || "").trim().toLowerCase() === cleanLicStr ||
                String(l.nom || "").trim().toLowerCase() === cleanLicStr
            );
            if (matchedLic) {
              cleanRec.licence = matchedLic.id;
            } else {
              delete cleanRec.licence;
            }
          }
        }

        return cleanRec;
      }).filter(record => record.nom && record.licence && record.annee && record.semestre);

      if (!cleanedData.length) {
        setError("Aucune ligne de module valide (avec Licence, Année, Semestre correspondants) n'a été trouvée.");
        return;
      }

      let successCount = 0;
      for (const record of cleanedData) {
        try {
          await axios.post('modules/', record);
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

          <div className="search-area" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569' }}>Afficher/Chercher :</span>
              <MultiSelectDropdown
                label="Tous les champs sélectionnés"
                options={[
                  "Tous les champs",
                  "Nom",
                  "Spécialité",
                  "Licence",
                  "Département",
                  "Année",
                  "Semestre"
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
        <div className="modal-overlay">
          <div className="modal-content">
            <ModuleForm
              onSubmit={handleAdd}
              selectedModule={selectedModule}
              onCancel={handleCancel}
              specialites={specialites}
            />
          </div>
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
                    filterBy={filterBy}
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
