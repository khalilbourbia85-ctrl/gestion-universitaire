import React, { useState, useEffect } from 'react';
import FormErrorDisplay from './common/FormErrorDisplay';

const emptyRapporteurForm = {
  matricule: '',
  cin: '',
  nom: '',
  prenom: '',
  email: '',
  numtel: '',
  grade: '',
  dateRecrutement: '',
  statutAdministratif: '',
};

function RapporteursForm({ selected, onSubmit, onCancel }) {
  const [form, setForm] = useState(emptyRapporteurForm);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (selected) {
      setForm({
        matricule: selected.matricule || '',
        cin: selected.cin || '',
        nom: selected.nom || '',
        prenom: selected.prenom || '',
        email: selected.email || '',
        numtel: selected.numtel || '',
        grade: selected.grade || '',
        dateRecrutement: selected.dateRecrutement || '',
        statutAdministratif: selected.statutAdministratif || '',
      });
    } else {
      setForm({ ...emptyRapporteurForm });
    }
  }, [selected]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.matricule || !form.nom || !form.prenom) {
      setFormError('Matricule, nom et prénom sont obligatoires.');
      return;
    }
    if (form.cin && !/^\d{8}$/.test(form.cin.trim())) {
      setFormError('Le CIN doit contenir exactement 8 chiffres.');
      return;
    }
    if (form.email && !form.email.trim().toLowerCase().endsWith('@gmail.com')) {
      setFormError("L'email doit se terminer par @gmail.com.");
      return;
    }
    if (form.numtel && !/^\d{8}$/.test(form.numtel.trim())) {
      setFormError('Le numéro de téléphone doit contenir exactement 8 chiffres.');
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{selected ? 'Modifier un rapporteur' : 'Ajouter un rapporteur'}</h3>
        {formError && <FormErrorDisplay message={formError} />}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Matricule</label>
            <input name="matricule" value={form.matricule} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>CIN</label>
            <input name="cin" value={form.cin} onChange={handleChange} />
          </div>
          <div className="form-row">
            <label>Nom</label>
            <input name="nom" value={form.nom} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>Prénom</label>
            <input name="prenom" value={form.prenom} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} />
          </div>
          <div className="form-row">
            <label>Téléphone</label>
            <input name="numtel" value={form.numtel} onChange={handleChange} />
          </div>
          <div className="form-row">
            <label>Grade</label>
            <input name="grade" value={form.grade} onChange={handleChange} />
          </div>
          <div className="form-row">
            <label>Date de recrutement</label>
            <input type="date" name="dateRecrutement" value={form.dateRecrutement} onChange={handleChange} />
          </div>
          <div className="form-row">
            <label>Statut administratif</label>
            <input name="statutAdministratif" value={form.statutAdministratif} onChange={handleChange} />
          </div>
          <div className="buttons-area">
            <button type="submit" className="btn">Enregistrer</button>
            <button type="button" className="btn import-btn" onClick={onCancel}>Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RapporteursForm;
