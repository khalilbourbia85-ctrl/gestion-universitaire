import React, { useState } from 'react';
import './EtudiantForm.css';

const DepartementForm = ({ onSubmit, selectedDepartement, onCancel }) => {
  // Liste des départements officiels
  const departementsList = [
    { nom: 'Sciences de gestion', code: 'SG' },
    { nom: 'Méthodes quantitatives', code: 'MQ' },
    { nom: 'Informatique de gestion', code: 'IG' },
    { nom: 'Sciences économiques et commerce international', code: 'SECI' },
    { nom: 'Fiscalité et droit des affaires', code: 'FDA' },
    { nom: 'Cellule langue et informatique', code: 'CLI' },
  ];

  const [formData, setFormData] = useState({
    nom: selectedDepartement?.nom || '',
    code: selectedDepartement?.code || '',
    description: selectedDepartement?.description || '',
    responsable: selectedDepartement?.responsable || '',
    email: selectedDepartement?.email || '',
    telephone: selectedDepartement?.telephone || '',
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.code.trim()) newErrors.code = 'Le code est requis';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Si on change le département, mettre à jour le code automatiquement
    if (name === 'nom') {
      const selectedDept = departementsList.find(d => d.nom === value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        code: selectedDept ? selectedDept.code : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        id: selectedDepartement?.id
      });
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      code: '',
      description: '',
      responsable: '',
      email: '',
      telephone: '',
    });
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="form-title">{selectedDepartement ? 'Modifier le département' : 'Nouveau Département'}</h3>
      <div className="form-grid">
        <div className="input-group">
          <label>Nom du Département *</label>
        <select
          name="nom"
          value={formData.nom}
          onChange={handleChange}
          className={errors.nom ? 'input-error' : ''}
        >
          <option value="">Sélectionner un département</option>
          {departementsList.map(dept => (
            <option key={dept.code} value={dept.nom}>{dept.nom}</option>
          ))}
        </select>
        {errors.nom && <span className="error" style={{color: '#dc3545', fontSize: '12px'}}>{errors.nom}</span>}
        </div>

        <div className="input-group">
          <label>Code *</label>
        <input
          type="text"
          name="code"
          value={formData.code}
          onChange={handleChange}
          className={errors.code ? 'input-error' : ''}
        />
        <small style={{color: '#666', marginTop: '4px'}}>Ce code correspondra au mot de passe de connexion du responsable</small>
        {errors.code && <span className="error" style={{color: '#dc3545', fontSize: '12px'}}>{errors.code}</span>}
        </div>

        <div className="input-group">
          <label>Responsable</label>
          <input
            type="text"
            name="responsable"
            value={formData.responsable}
            onChange={handleChange}
          />
        </div>

        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? 'input-error' : ''}
          />
          {errors.email && <span className="error" style={{color: '#dc3545', fontSize: '12px'}}>{errors.email}</span>}
        </div>

        <div className="input-group">
          <label>Téléphone</label>
          <input
            type="tel"
            name="telephone"
            value={formData.telephone}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="input-group" style={{ marginBottom: '16px' }}>
        <label>Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '8px' }}
        />
      </div>

      <div className="form-buttons">
        <button type="submit" className="btn save-btn">
          {selectedDepartement ? 'Mettre à jour' : 'Ajouter'}
        </button>
        <button type="button" className="btn cancel-btn" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
};

export default DepartementForm;
