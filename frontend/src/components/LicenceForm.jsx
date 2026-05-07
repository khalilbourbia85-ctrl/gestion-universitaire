import React, { useState } from 'react';
import './LicenceForm.css';

const LicenceForm = ({ onSubmit, selectedLicence, onCancel, departements }) => {
  const [formData, setFormData] = useState({
    nom: selectedLicence?.nom || '',
    domaine: selectedLicence?.domaine || '',
    parcours: selectedLicence?.parcours || '',
    description: selectedLicence?.description || '',
    duree: selectedLicence?.duree || '3 ans',
    departement: selectedLicence?.departement || '',
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.departement) newErrors.departement = 'Le département est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        id: selectedLicence?.id
      });
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      domaine: '',
      parcours: '',
      description: '',
      duree: '3 ans',
      departement: '',
    });
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="licence-form">
      <div className="form-group">
        <label>Mention *</label>
        <input
          type="text"
          name="nom"
          value={formData.nom}
          onChange={handleChange}
          className={errors.nom ? 'input-error' : ''}
        />
        {errors.nom && <span className="error">{errors.nom}</span>}
      </div>

      <div className="form-group">
        <label>Domaine</label>
        <input
          type="text"
          name="domaine"
          value={formData.domaine}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label>Parcours (Spécialités)</label>
        <input
          type="text"
          name="parcours"
          value={formData.parcours}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label>Département *</label>
        <select
          name="departement"
          value={formData.departement}
          onChange={handleChange}
          className={errors.departement ? 'input-error' : ''}
        >
          <option value="">Sélectionner un département</option>
          {departements.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.nom}</option>
          ))}
        </select>
        {errors.departement && <span className="error">{errors.departement}</span>}
      </div>

      <div className="form-group">
        <label>Durée</label>
        <input
          type="text"
          name="duree"
          value={formData.duree}
          onChange={handleChange}
          placeholder="ex: 3 ans"
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
        />
      </div>

      <div className="form-buttons">
        <button type="submit" className="btn-submit">
          {selectedLicence ? 'Mettre à jour' : 'Ajouter'}
        </button>
        <button type="button" className="btn-cancel" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
};

export default LicenceForm;
