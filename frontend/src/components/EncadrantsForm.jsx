import React, { useState, useEffect } from 'react';
import FormErrorDisplay from './common/FormErrorDisplay';

function getEmptyEncadrantForm() {
  return {
    matricule: '',
    cin: '',
    nom: '',
    prenom: '',
    email: '',
    numtel: '',
    grade: '',
    dateRecrutement: '',
    statutAdministratif: '',
    typeContrat: '',
    dateTitularisation: '',
    anneeInscription: '',
    nbHeures: '',
    tauxHoraire: '',
    dureeContrat: '',
    dateDebut: '',
    dateFin: '',
    sujetThese: '',
    universite: '',
    primeRecherche: '',
    numeroOrdre: '',
  };
}

function EncadrantsForm({ selected, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => getEmptyEncadrantForm());
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (selected) {
      setForm({  // eslint-disable-line react-hooks/set-state-in-effect
        matricule: selected.matricule || '',
        cin: selected.cin || '',
        nom: selected.nom || '',
        prenom: selected.prenom || '',
        email: selected.email || '',
        numtel: selected.numtel || selected.numTel || '',
        grade: selected.grade || '',
        dateRecrutement: selected.dateRecrutement || '',
        statutAdministratif: selected.statutAdministratif || '',
        typeContrat: selected.typeContrat || '',
        dateTitularisation: selected.dateTitularisation || '',
        anneeInscription: selected.anneeInscription ?? '',
        nbHeures: selected.nbHeures ?? '',
        tauxHoraire: selected.tauxHoraire ?? '',
        dureeContrat: selected.dureeContrat ?? '',
        dateDebut: selected.dateDebut || '',
        dateFin: selected.dateFin || '',
        sujetThese: selected.sujetThese || '',
        universite: selected.universite || '',
        primeRecherche: selected.primeRecherche ?? '',
        numeroOrdre: selected.numeroOrdre ?? '',
      });
    } else {
      setForm(getEmptyEncadrantForm());
    }
  }, [selected]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!String(form.matricule).trim()) {
      setFormError('Matricule obligatoire.');
      return;
    }
    if (!String(form.cin).trim()) {
      setFormError('CIN obligatoire.');
      return;
    }
    if (!String(form.nom).trim() || !String(form.prenom).trim()) {
      setFormError('Nom et prénom sont obligatoires.');
      return;
    }
    if (!String(form.email).trim()) {
      setFormError('Email obligatoire.');
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(String(form.email).trim())) {
      setFormError("L'email n'est pas valide.");
      return;
    }
    if (!String(form.numtel).trim()) {
      setFormError('Téléphone obligatoire.');
      return;
    }
    if (!String(form.grade).trim()) {
      setFormError('Grade obligatoire.');
      return;
    }
    if (!String(form.dateRecrutement).trim()) {
      setFormError('Date de recrutement obligatoire.');
      return;
    }
    const payload = { ...form };
    onSubmit(payload);
  };

  return (
    <>
        <h3>{selected ? 'Modifier un encadrant' : 'Ajouter un encadrant'}</h3>
        {formError && <FormErrorDisplay message={formError} />}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Matricule</label>
            <input
              name="matricule"
              value={form.matricule}
              onChange={handleChange}
              required
              disabled={!!selected}
            />
          </div>
          <div className="form-row">
            <label>CIN</label>
            <input name="cin" value={form.cin} onChange={handleChange} required maxLength={8} />
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
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>Téléphone</label>
            <input name="numtel" value={form.numtel} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>Grade</label>
            <input name="grade" value={form.grade} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>Date de recrutement</label>
            <input type="date" name="dateRecrutement" value={form.dateRecrutement} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>Statut administratif</label>
            <input name="statutAdministratif" value={form.statutAdministratif} onChange={handleChange} />
          </div>

          <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
          <h4 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Contrat</h4>

          <div className="form-row">
            <label>Type de contrat</label>
            <select name="typeContrat" value={form.typeContrat} onChange={handleChange}>
              <option value="">Choisir</option>
              <option value="Permanent">Permanent</option>
              <option value="Vacataire">Vacataire</option>
              <option value="ContratDoctorant">Contrat doctorant</option>
              <option value="ContratDocteur">Contrat docteur</option>
            </select>
          </div>

          {form.typeContrat === 'Permanent' && (
            <>
              <div className="form-row">
                <label>Date de titularisation</label>
                <input type="date" name="dateTitularisation" value={form.dateTitularisation} onChange={handleChange} />
              </div>
              <div className="form-row">
                <label>Année d&apos;inscription</label>
                <input name="anneeInscription" value={form.anneeInscription} onChange={handleChange} />
              </div>
            </>
          )}

          {form.typeContrat === 'Vacataire' && (
            <>
              <div className="form-row">
                <label>Nombre d&apos;heures</label>
                <input name="nbHeures" type="number" min="0" value={form.nbHeures} onChange={handleChange} />
              </div>
              <div className="form-row">
                <label>Taux horaire</label>
                <input name="tauxHoraire" type="number" step="0.01" min="0" value={form.tauxHoraire} onChange={handleChange} />
              </div>
            </>
          )}

          {form.typeContrat === 'ContratDoctorant' && (
            <>
              <div className="form-row">
                <label>Durée du contrat (mois)</label>
                <input name="dureeContrat" type="number" min="0" value={form.dureeContrat} onChange={handleChange} />
              </div>
              <div className="form-row">
                <label>Date début</label>
                <input type="date" name="dateDebut" value={form.dateDebut} onChange={handleChange} />
              </div>
              <div className="form-row">
                <label>Date fin</label>
                <input type="date" name="dateFin" value={form.dateFin} onChange={handleChange} />
              </div>
              <div className="form-row">
                <label>Sujet de thèse</label>
                <input name="sujetThese" value={form.sujetThese} onChange={handleChange} />
              </div>
              <div className="form-row">
                <label>Université d&apos;inscription</label>
                <input name="universite" value={form.universite} onChange={handleChange} />
              </div>
              <div className="form-row">
                <label>Année d&apos;inscription</label>
                <input name="anneeInscription" value={form.anneeInscription} onChange={handleChange} />
              </div>
            </>
          )}

          {form.typeContrat === 'ContratDocteur' && (
            <>
              <div className="form-row">
                <label>Durée du contrat (mois)</label>
                <input name="dureeContrat" type="number" min="0" value={form.dureeContrat} onChange={handleChange} />
              </div>
              <div className="form-row">
                <label>Date début</label>
                <input type="date" name="dateDebut" value={form.dateDebut} onChange={handleChange} />
              </div>
              <div className="form-row">
                <label>Date fin</label>
                <input type="date" name="dateFin" value={form.dateFin} onChange={handleChange} />
              </div>
              <div className="form-row">
                <label>Prime recherche</label>
                <input name="primeRecherche" type="number" step="0.01" min="0" value={form.primeRecherche} onChange={handleChange} />
              </div>
              <div className="form-row">
                <label>Numéro d&apos;ordre</label>
                <input name="numeroOrdre" type="number" min="0" value={form.numeroOrdre} onChange={handleChange} />
              </div>
            </>
          )}

          <div className="buttons-area">
            <button type="submit" className="btn">
              Enregistrer
            </button>
            <button type="button" className="btn import-btn" onClick={onCancel}>
              Annuler
            </button>
          </div>
        </form>
    </>
  );
}

export default EncadrantsForm;
