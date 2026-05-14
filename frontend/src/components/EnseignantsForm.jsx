import React,{useState,useEffect} from "react";
import "./EtudiantForm.css";

function EnseignantForm({ selected, onSubmit, onCancel, onFormChange }) {
  const initialFormState = {
    matricule: "",
    cin: "",
    nom: "",
    prenom: "",
    email: "",
    numTel: "",
    grade: "",
    dateRecrutement: "",
    typeContrat: "",
    dateTitularisation: "",
    statutAdministratif: "",
    anneeInscription: "",
    nbHeures: "",
    tauxHoraire: "",
    dureeContrat: "",
    dateDebut: "",
    dateFin: "",
    sujetThese: "",
    universite: "",
    primeRecherche: "",
    numeroOrdre: "",
    diplome: {
      libelleDiplome: "",
      specialite: "",
      universite: "",
      dateObtention: ""
    }
  };

  const [form, setForm] = useState(initialFormState);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (selected) {
      // Mode modification : initialiser avec les données de selected
      const nextForm = {
        matricule: selected.matricule || "",
        cin: selected.cin || "",
        nom: selected.nom || "",
        prenom: selected.prenom || "",
        email: selected.email || "",
        numTel: selected.numTel || selected.numtel || "",
        grade: selected.grade || "",
        dateRecrutement: selected.dateRecrutement || "",
        typeContrat: selected.typeContrat || "",
        dateTitularisation: selected.dateTitularisation || "",
        statutAdministratif: selected.statutAdministratif || "",
        anneeInscription: selected.anneeInscription || "",
        nbHeures: selected.nbHeures || "",
        tauxHoraire: selected.tauxHoraire || "",
        dureeContrat: selected.dureeContrat || "",
        dateDebut: selected.dateDebut || "",
        dateFin: selected.dateFin || "",
        sujetThese: selected.sujetThese || "",
        universite: selected.universite || "",
        primeRecherche: selected.primeRecherche || "",
        numeroOrdre: selected.numeroOrdre || "",
        diplome: {
          libelleDiplome: selected.diplome?.libelleDiplome || "",
          specialite: selected.diplome?.specialite || "",
          universite: selected.diplome?.universite || "",
          dateObtention: selected.diplome?.dateObtention || ""
        }
      };
      
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(nextForm);
      if (onFormChange) {
        onFormChange(nextForm);
      }
    }
    // Pour un nouvel enseignant, ne rien faire ici - le formulaire reste avec initialFormState
  }, [selected, onFormChange]);

const handleChange = (e) => {
  const { name, value } = e.target;
  const updateForm = (prevForm) => {
    let nextForm;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      nextForm = {
        ...prevForm,
        [parent]: {
          ...prevForm[parent],
          [child]: value,
        },
      };
    } else {
      nextForm = {
        ...prevForm,
        [name]: value,
      };
    }

    // Auto-calcul de la date de fin
    if (name === "dateDebut" || name === "dureeContrat") {
      const duree = parseInt(nextForm.dureeContrat, 10);
      const debut = nextForm.dateDebut;
      
      if (!isNaN(duree) && duree > 0 && debut) {
        const dateObj = new Date(debut);
        if (!isNaN(dateObj.getTime())) {
          dateObj.setFullYear(dateObj.getFullYear() + duree);
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const day = String(dateObj.getDate()).padStart(2, "0");
          nextForm.dateFin = `${year}-${month}-${day}`;
        }
      }
    }

    return nextForm;
  };

  setForm((prevForm) => {
    const updatedForm = updateForm(prevForm);
    if (onFormChange) {
      onFormChange(updatedForm);
    }
    return updatedForm;
  });
};

const validateForm = () => {
    if (!form.matricule.trim()) return "Matricule obligatoire.";
    if (!form.cin.trim()) return "CIN obligatoire.";
    if (!/^\d{8}$/.test(form.cin.trim())) return "Le CIN doit contenir exactement 8 chiffres.";
    if (!form.nom.trim()) return "Nom obligatoire.";
    if (!form.prenom.trim()) return "Prénom obligatoire.";
    if (!form.email.trim()) return "Email obligatoire.";
    if (!form.email.trim().toLowerCase().endsWith("@gmail.com")) return "L'email doit se terminer par @gmail.com.";
    if (!form.numTel.trim()) return "Téléphone obligatoire.";
    if (!/^\d{8}$/.test(form.numTel.trim())) return "Le téléphone doit contenir exactement 8 chiffres.";
    if (!form.grade.trim()) return "Grade obligatoire.";
    if (!form.dateRecrutement.trim()) return "Date de recrutement obligatoire.";

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(form.email)) {
      return "L'email n'est pas valide.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setFormError("");
      await onSubmit(form);
    } catch (err) {
      console.error('Erreur lors de la soumission du formulaire:', err);
      setFormError("Impossible d'enregistrer l'enseignant.");
    }
  };

  return (
<form className="form-container" onSubmit={handleSubmit}>
  <h2 className="form-title">
    {selected ? "Modifier Enseignant" : "Nouvel Enseignant"}
  </h2>

  {formError && <div className="success-message" style={{ background: '#e53e3e', marginBottom: '15px' }}>{formError}</div>}

  <div className="form-grid">
    <div className="input-group">
      <label>Matricule</label>
      <input name="matricule" placeholder="-" value={form.matricule} onChange={handleChange} disabled={!!selected}/>
    </div>
    <div className="input-group">
      <label>CIN</label>
      <input name="cin" placeholder="-" value={form.cin} onChange={handleChange}/>
    </div>
    <div className="input-group">
      <label>Nom</label>
      <input name="nom" placeholder="-" value={form.nom} onChange={handleChange}/>
    </div>
    <div className="input-group">
      <label>Prénom</label>
      <input name="prenom" placeholder="-" value={form.prenom} onChange={handleChange}/>
    </div>
    <div className="input-group">
      <label>Email</label>
      <input name="email" placeholder="-" value={form.email} onChange={handleChange}/>
    </div>
    <div className="input-group">
      <label>Téléphone</label>
      <input name="numTel" placeholder="-" value={form.numTel} onChange={handleChange}/>
    </div>
    <div className="input-group">
      <label>Grade</label>
      <input name="grade" placeholder="-" value={form.grade} onChange={handleChange}/>
    </div>
    <div className="input-group">
      <label>Date de recrutement</label>
      <input type="date" name="dateRecrutement" value={form.dateRecrutement} onChange={handleChange}/>
    </div>
    <div className="input-group">
      <label>Statut Administratif</label>
      <select name="statutAdministratif" value={form.statutAdministratif} onChange={handleChange}>
        <option value="">Choisir</option>
        <option value="en exercice">En exercice</option>
        <option value="en détachement">En détachement</option>
        <option value="en congé étude">En congé étude</option>
      </select>
    </div>
    <div className="input-group">
      <label>Type contrat</label>
      <select name="typeContrat" value={form.typeContrat} onChange={handleChange}>
        <option value="">Choisir</option>
        <option value="Permanent">Permanent</option>
        <option value="Vacataire">Vacataire</option>
        <option value="ContratDoctorant">Contrat Doctorant</option>
        <option value="ContratDocteur">Contrat Docteur</option>
      </select>
    </div>

    {form.typeContrat === "Permanent" && (
      <>
        <div className="input-group">
          <label>Date titularisation</label>
          <input type="date" name="dateTitularisation" value={form.dateTitularisation} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Année inscription</label>
          <input name="anneeInscription" placeholder="-" value={form.anneeInscription} onChange={handleChange} />
        </div>
      </>
    )}

    {form.typeContrat === "Vacataire" && (
      <>
        <div className="input-group">
          <label>Nb heures</label>
          <input name="nbHeures" placeholder="-" value={form.nbHeures} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Taux horaire</label>
          <input name="tauxHoraire" placeholder="-" value={form.tauxHoraire} onChange={handleChange} />
        </div>
      </>
    )}

    {form.typeContrat === "ContratDoctorant" && (
      <>
        <div className="input-group">
          <label>Durée contrat</label>
          <input name="dureeContrat" placeholder="-" value={form.dureeContrat} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Date début</label>
          <input type="date" name="dateDebut" value={form.dateDebut} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Date fin</label>
          <input type="date" name="dateFin" value={form.dateFin} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Sujet thèse</label>
          <input name="sujetThese" placeholder="-" value={form.sujetThese} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Université</label>
          <input name="universite" placeholder="-" value={form.universite} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Année inscription</label>
          <input name="anneeInscription" placeholder="-" value={form.anneeInscription} onChange={handleChange} />
        </div>
      </>
    )}

    {form.typeContrat === "ContratDocteur" && (
      <>
        <div className="input-group">
          <label>Durée contrat</label>
          <input name="dureeContrat" placeholder="-" value={form.dureeContrat} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Date début</label>
          <input type="date" name="dateDebut" value={form.dateDebut} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Date fin</label>
          <input type="date" name="dateFin" value={form.dateFin} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Prime recherche</label>
          <input name="primeRecherche" placeholder="-" value={form.primeRecherche} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Numéro d'ordre</label>
          <input name="numeroOrdre" placeholder="-" value={form.numeroOrdre} onChange={handleChange} />
        </div>
      </>
    )}
  </div>

  <h4 style={{marginTop: '20px', marginBottom: '10px', color: '#102445', width: '100%', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px'}}>Diplôme</h4>
  <div className="form-grid">
    <div className="input-group">
      <label>Libellé diplôme</label>
      <input name="diplome.libelleDiplome" placeholder="-" value={form.diplome.libelleDiplome} onChange={handleChange} />
    </div>
    <div className="input-group">
      <label>Spécialité</label>
      <input name="diplome.specialite" placeholder="-" value={form.diplome.specialite} onChange={handleChange} />
    </div>
    <div className="input-group">
      <label>Université</label>
      <input name="diplome.universite" placeholder="-" value={form.diplome.universite} onChange={handleChange} />
    </div>
    <div className="input-group">
      <label>Date obtention</label>
      <input type="date" name="diplome.dateObtention" value={form.diplome.dateObtention} onChange={handleChange} />
    </div>
  </div>

  <div className="form-buttons" style={{marginTop: '20px'}}>
    <button type="submit" className="btn save-btn">Enregistrer</button>
    <button type="button" className="btn cancel-btn" onClick={onCancel}>Annuler</button>
  </div>
</form>
);
}

export default EnseignantForm;