import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './GestionEtudiants.css';

const GestionAffectationsAcademiques = () => {
  const [elements, setElements] = useState([]);
  const [modules, setModules] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [licences, setLicences] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  
  const [selectedLicence, setSelectedLicence] = useState(null);
  const [selectedSpecialite, setSelectedSpecialite] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [activeElementForAssign, setActiveElementForAssign] = useState(null);
  const [affectations, setAffectations] = useState([]);
  
  const [formSelectedModuleId, setFormSelectedModuleId] = useState('');
  const [availableMatieres, setAvailableMatieres] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchData = async () => {
    try {
      const [elementsRes, modulesRes, enseignantsRes, licencesRes, specialitesRes] = await Promise.all([
        axios.get('/api/ue-elements/'),
        axios.get('/api/modules/'),
        axios.get('/api/enseignants/'),
        axios.get('/api/licences/'),
        axios.get('/api/specialites/')
      ]);
      setElements(elementsRes.data);
      setModules(modulesRes.data);
      setEnseignants(enseignantsRes.data);
      setLicences(licencesRes.data);
      setSpecialites(specialitesRes.data);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des données.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formSelectedModuleId) {
      const mod = modules.find(m => m.id === Number(formSelectedModuleId));
      if (mod && mod.matieres) {
        setAvailableMatieres(mod.matieres);
      } else {
        setAvailableMatieres([]);
      }
    } else {
      setAvailableMatieres([]);
    }
  }, [formSelectedModuleId, modules]);

  const fetchAffectations = async (ueElementId) => {
    try {
      const res = await axios.get(`/api/affectations-details/?ue_element=${ueElementId}`);
      setAffectations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openAssignModal = (element) => {
    setActiveElementForAssign(element);
    fetchAffectations(element.id);
    setShowAssignModal(true);
  };

  const filteredElements = elements.filter((element) => {
    const matchesSearch = element.nom.toLowerCase().includes(searchTerm.toLowerCase())
      || element.module_nom?.toLowerCase().includes(searchTerm.toLowerCase())
      || element.specialite_nom?.toLowerCase().includes(searchTerm.toLowerCase())
      || element.licence_nom?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLicence = selectedLicence ? element.licence_nom && element.licence_nom === licences.find((lic) => lic.id === Number(selectedLicence))?.nom : true;
    const matchesSpecialite = selectedSpecialite ? element.specialite_nom && element.specialite_nom === specialites.find((spec) => spec.id === Number(selectedSpecialite))?.nom : true;
    const matchesModule = selectedModule ? element.module === Number(selectedModule) : true;
    return matchesSearch && matchesLicence && matchesSpecialite && matchesModule;
  });

  const getModulesForSpecialite = () => {
    if (!selectedSpecialite) return modules;
    return modules.filter((mod) => {
      const specialiteId = typeof mod.specialite === 'object' ? mod.specialite?.id : mod.specialite;
      return Number(specialiteId) === Number(selectedSpecialite);
    });
  };

  const resetForm = () => {
    setSelectedElement(null);
    setSelectedModule(null);
    setFormSelectedModuleId('');
    setShowAddForm(false);
    if (document.forms['affectationForm']) {
      document.forms['affectationForm'].reset();
    }
  };

  const handleEdit = (element) => {
    setSelectedElement(element);
    setSelectedModule(element.module);
    setFormSelectedModuleId(element.module);
    setShowAddForm(true);
  };

  const handleDelete = async (element) => {
    if (!window.confirm('Supprimer cette matière ?')) return;
    try {
      await axios.delete(`/api/ue-elements/${element.id}/`);
      setMessage('Matière supprimée avec succès.');
      setError('');
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la suppression.');
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const form = event.target;
    const modId = Number(form.module.value);
    const modObj = modules.find(m => m.id === modId);

    const payload = {
      module: modId,
      nom: modObj ? modObj.nom : 'Matière',
      code: modObj ? modObj.code : '',
      coefficient: 1,
      credit: 0,
      vh_c: Number(form.vh_c.value) || 0,
      vh_td: Number(form.vh_td.value) || 0,
      vh_tp: Number(form.vh_tp.value) || 0,
      vh_ci: Number(form.vh_ci.value) || 0,
      sections: Number(form.sections.value) || 1,
      groupes_td: Number(form.groupes_td.value) || 1,
      sous_groupes_tp: Number(form.sous_groupes_tp.value) || 1,
      etudiants: 0,
    };

    try {
      if (selectedElement?.id) {
        await axios.put(`/api/ue-elements/${selectedElement.id}/`, payload);
        setMessage('Matière mise à jour.');
      } else {
        await axios.post('/api/ue-elements/', payload);
        setMessage('Matière ajoutée.');
      }
      setError('');
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Erreur lors de l\'enregistrement.');
      setMessage('');
    }
  };

  const handleAssignTeacher = async (type_cours, groupe, enseignantId) => {
    try {
      const existing = affectations.find(a => a.type_cours === type_cours && a.groupe === groupe);
      if (!enseignantId) {
        if (existing) await axios.delete(`/api/affectations-details/${existing.id}/`);
      } else {
        const payload = {
          ue_element: activeElementForAssign.id,
          enseignant: enseignantId,
          type_cours,
          groupe
        };
        if (existing) {
          await axios.put(`/api/affectations-details/${existing.id}/`, payload);
        } else {
          await axios.post('/api/affectations-details/', payload);
        }
      }
      fetchAffectations(activeElementForAssign.id);
      fetchData(); // Refresh global hours
    } catch (err) {
      alert("Erreur lors de l'affectation de l'enseignant.");
    }
  };

  const currentElement = selectedElement || {
    module: '', nom: '', code: '', coefficient: 1, credit: 0,
    vh_c: 0, vh_td: 0, vh_tp: 0, vh_ci: 0,
    sections: 1, groupes_td: 1, sous_groupes_tp: 1, etudiants: 0
  };

  const renderAssignBlock = (type_cours, nbGroupes, labelPrefix) => {
    const blocks = [];
    for (let i = 1; i <= nbGroupes; i++) {
      const groupeName = `${labelPrefix} ${i}`;
      const existing = affectations.find(a => a.type_cours === type_cours && a.groupe === groupeName);
      blocks.push(
        <div key={groupeName} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ minWidth: '100px', fontWeight: 'bold' }}>{groupeName}</span>
          <select 
            value={existing?.enseignant || ''} 
            onChange={(e) => handleAssignTeacher(type_cours, groupeName, e.target.value)}
            style={{ padding: '6px', borderRadius: '4px', flex: 1 }}
          >
            <option value="">-- Non affecté --</option>
            {enseignants.map(ens => (
              <option key={ens.matricule} value={ens.matricule}>{ens.nom} {ens.prenom}</option>
            ))}
          </select>
        </div>
      );
    }
    return blocks;
  };

  return (
    <div className="gestion-container">
      <h2>Affectations académiques (Cours / TD / TP)</h2>
      <div className="controls-section" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={{ flex: '1 1 280px' }}>
          <label>Licence</label>
          <select value={selectedLicence || ''} onChange={(e) => { setSelectedLicence(e.target.value || null); setSelectedSpecialite(null); setSelectedModule(null); }}>
            <option value="">Toutes les licences</option>
            {licences.map((lic) => (
              <option key={lic.id} value={lic.id}>{lic.nom}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: '1 1 280px' }}>
          <label>Spécialité</label>
          <select value={selectedSpecialite || ''} onChange={(e) => { setSelectedSpecialite(e.target.value || null); setSelectedModule(null); }}>
            <option value="">Toutes les spécialités</option>
            {specialites
              .filter((spec) => {
                const licenceId = typeof spec.licence === 'object' ? spec.licence?.id : spec.licence;
                return !selectedLicence || Number(licenceId) === Number(selectedLicence);
              })
              .map((spec) => (
                <option key={spec.id} value={spec.id}>{spec.nom}</option>
              ))}
          </select>
        </div>
        <div style={{ flex: '1 1 280px' }}>
          <label>Module</label>
          <select value={selectedModule || ''} onChange={(e) => setSelectedModule(e.target.value || null)}>
            <option value="">Tous les modules</option>
            {getModulesForSpecialite().map((mod) => (
              <option key={mod.id} value={mod.id}>{mod.nom}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: '1 1 240px' }}>
          <label>Rechercher</label>
          <input type="text" placeholder="Rechercher matière..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}



      {!showAddForm && (
        <div style={{ marginBottom: '24px' }}>
          <button 
            onClick={() => setShowAddForm(true)} 
            className="btn" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            ➕ Définir une matière (UE)
          </button>
        </div>
      )}

      {showAddForm && (
        <form name="affectationForm" className="table-card" onSubmit={handleSave} style={{ marginBottom: '24px' }}>
          <h3>{selectedElement ? 'Modifier la structure de la matière' : 'Définir une matière (UE)'}</h3>
        <div className="form-row">
          <div className="form-group" style={{ flex: '1 1 100%' }}>
            <label>Module / Matière *</label>
            <select 
               name="module" 
               value={selectedElement ? selectedElement.module : formSelectedModuleId} 
               onChange={(e) => {
                 const modId = e.target.value;
                 setFormSelectedModuleId(modId);
                 const mod = modules.find(m => m.id === Number(modId));
                 const form = document.forms['affectationForm'];
                 if (mod && mod.matieres && mod.matieres.length > 0 && form && !selectedElement) {
                   const mat = mod.matieres[0];
                   if (form.vh_c) form.vh_c.value = mat.volume_horaire || 0;
                   if (form.vh_td) form.vh_td.value = mat.vh_td || 0;
                   if (form.vh_tp) form.vh_tp.value = mat.vh_tp || 0;
                   if (form.vh_ci) form.vh_ci.value = mat.vh_ci || 0;
                 }
               }} 
               required
               disabled={!!selectedElement}
            >
              <option value="">Sélectionner un module</option>
              {modules.map((mod) => (
                <option key={mod.id} value={mod.id}>{mod.nom}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Volume Cours (VH)</label>
            <input type="number" name="vh_c" step="0.5" defaultValue={currentElement.vh_c} />
          </div>
          <div className="form-group">
            <label>Volume TD (VH)</label>
            <input type="number" name="vh_td" step="0.5" defaultValue={currentElement.vh_td} />
          </div>
          <div className="form-group">
            <label>Volume TP (VH)</label>
            <input type="number" name="vh_tp" step="0.5" defaultValue={currentElement.vh_tp} />
          </div>
          <div className="form-group">
            <label>Volume CI (VH)</label>
            <input type="number" name="vh_ci" step="0.5" defaultValue={currentElement.vh_ci} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Nombre de Sections (Cours)</label>
            <input type="number" name="sections" min="1" defaultValue={currentElement.sections} />
          </div>
          <div className="form-group">
            <label>Nombre de Groupes (TD)</label>
            <input 
              type="number" 
              name="groupes_td" 
              min="1" 
              defaultValue={currentElement.groupes_td} 
              onChange={(e) => {
                const form = document.forms['affectationForm'];
                if (form && form.sous_groupes_tp) {
                  form.sous_groupes_tp.value = parseInt(e.target.value || 0, 10) * 2;
                }
              }}
            />
          </div>
          <div className="form-group">
            <label>Nombre de Sous-groupes (TP)</label>
            <input type="number" name="sous_groupes_tp" min="1" defaultValue={currentElement.sous_groupes_tp} />
          </div>
        </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="submit">Sauvegarder Structure</button>
            <button type="button" onClick={resetForm}>Annuler</button>
          </div>
        </form>
      )}

      <div className="table-card">
        <h3>Matières et Affectations</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Module / Matière</th>
                <th>Structure (Groupes)</th>
                <th>Volume Horaire (C/TD/TP)</th>
                <th>Enseignants Affectés</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredElements.map((element) => {
                const totalEns = element.affectations_details ? element.affectations_details.length : 0;
                return (
                  <tr key={element.id}>
                    <td><strong>{element.module_nom}</strong></td>
                    <td>
                      Sections: {element.sections} <br/>
                      TD: {element.groupes_td} <br/>
                      TP: {element.sous_groupes_tp}
                    </td>
                    <td>
                      C: {element.vh_c}h <br/>
                      TD: {element.vh_td}h <br/>
                      TP: {element.vh_tp}h
                    </td>
                    <td>
                      {totalEns === 0 ? <span style={{color: '#b91c1c'}}>Aucun</span> : <span style={{color: '#15803d'}}>{totalEns} affectation(s)</span>}
                    </td>
                    <td>
                      <button type="button" onClick={() => openAssignModal(element)} style={{ backgroundColor: '#2563eb', color: 'white', marginRight: '8px' }}>
                        Affecter Enseignants
                      </button>
                      <button type="button" onClick={() => handleEdit(element)} style={{ marginRight: '8px' }}>Modifier</button>
                      <button type="button" onClick={() => handleDelete(element)}>Supprimer</button>
                    </td>
                  </tr>
                );
              })}
              {!filteredElements.length && (
                <tr>
                  <td colSpan="6">Aucune matière trouvée.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAssignModal && activeElementForAssign && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0 }}>Affectation : {activeElementForAssign.nom}</h2>
            <p>Affectez les enseignants aux différentes sections et groupes pour cette matière.</p>
            
            {activeElementForAssign.vh_c > 0 && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#0369a1' }}>Cours Magistral (VH: {activeElementForAssign.vh_c}h)</h4>
                {renderAssignBlock('C', activeElementForAssign.sections, 'Section')}
              </div>
            )}

            {activeElementForAssign.vh_td > 0 && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#15803d' }}>Travaux Dirigés - TD (VH: {activeElementForAssign.vh_td}h)</h4>
                {renderAssignBlock('TD', activeElementForAssign.groupes_td, 'Groupe TD')}
              </div>
            )}

            {activeElementForAssign.vh_tp > 0 && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fdf4ff', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#a21caf' }}>Travaux Pratiques - TP (VH: {activeElementForAssign.vh_tp}h)</h4>
                {renderAssignBlock('TP', activeElementForAssign.sous_groupes_tp, 'Sous-groupe TP')}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" onClick={() => setShowAssignModal(false)} style={{ padding: '10px 20px', fontSize: '16px' }}>Fermer</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GestionAffectationsAcademiques;
