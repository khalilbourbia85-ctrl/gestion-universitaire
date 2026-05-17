import React, { useState, useEffect } from "react";
import "./EtudiantForm.css";

function EtudiantForm({ selected, onSubmit, onCancel, licences = [], specialites = [] }) {

  const [form, setForm] = useState({
    idEtudiant: "",
    cin: "",
    nom: "",
    prenom: "",
    email: "",
    numTel: "",
    dateNaissance: "",
    adresse: "",
    nationalite: "",
    passport: "",
    groupe: "",
    situation_s5: "N",
    situation_pfe: "N",
    licence: "",
    specialite: "",
    genre: "M",
  });

  useEffect(() => {

    if (selected) {
  
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        idEtudiant: selected.idEtudiant || "",
        cin: selected.cin || "",
        nom: selected.nom || "",
        prenom: selected.prenom || "",
        email: selected.email || "",
        numTel: selected.numTel || "",
        dateNaissance: selected.dateNaissance || "",
        adresse: selected.adresse || "",
        nationalite: selected.nationalite || "",
        passport: selected.passport || "",
        groupe: selected.groupe || "",
        situation_s5: selected.situation_s5 || "N",
        situation_pfe: selected.situation_pfe || "N",
        licence:
          selected.licence != null && selected.licence !== ""
            ? String(selected.licence)
            : selected.licence_detail?.id != null
              ? String(selected.licence_detail.id)
              : "",
        specialite:
          selected.specialite != null && selected.specialite !== ""
            ? String(selected.specialite)
            : selected.specialite_detail?.id != null
              ? String(selected.specialite_detail.id)
              : "",
        genre: selected.genre || "M",
      });
  
    } else {
  
      setForm({
        idEtudiant: "",
        cin: "",
        nom: "",
        prenom: "",
        email: "",
        numTel: "",
        dateNaissance: "",
        adresse: "",
        nationalite: "",
        passport: "",
        groupe: "",
        situation_s5: "N",
        situation_pfe: "N",
        licence: "",
        specialite: "",
        genre: "M",
      });
  
    }
  
  }, [selected]);

  const normalizeSpaces = (value) =>
    typeof value === "string"
      ? value.trim().replace(/\s+/g, " ")
      : value;

  const cleanFormData = (data) => ({
    ...data,
    cin: String(data.cin || "").replace(/\D/g, ""),
    nom: normalizeSpaces(data.nom),
    prenom: normalizeSpaces(data.prenom),
    email: String(data.email || "").trim().toLowerCase(),
    numTel: String(data.numTel || "").replace(/\D/g, ""),
    adresse: normalizeSpaces(data.adresse),
    nationalite: normalizeSpaces(data.nationalite),
    passport: String(data.passport || "").trim(),
    groupe: normalizeSpaces(data.groupe),
    situation_s5: data.situation_s5 || "N",
    situation_pfe: data.situation_pfe || "N",
    dateNaissance: String(data.dateNaissance || "").trim(),
    genre: data.genre || "M",
    licence:
      data.licence === "" || data.licence == null || data.licence === undefined
        ? null
        : Number(data.licence),
    specialite:
      data.specialite === "" || data.specialite == null || data.specialite === undefined
        ? null
        : Number(data.specialite),
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLicenceChange = (e) => {
    const v = e.target.value;
    setForm((prev) => {
      const next = { ...prev, licence: v };
      if (!v) {
        next.specialite = "";
        return next;
      }
      if (prev.specialite) {
        const spec = specialites.find((s) => String(s.id) === String(prev.specialite));
        if (spec && String(spec.licence) !== String(v)) next.specialite = "";
      }
      return next;
    });
  };

  const handleSpecialiteChange = (e) => {
    const v = e.target.value;
    const spec = specialites.find((s) => String(s.id) === String(v));
    setForm((prev) => ({
      ...prev,
      specialite: v,
      licence: spec ? String(spec.licence) : prev.licence,
    }));
  };

  const specialitesFiltrees = Array.isArray(specialites)
    ? specialites.filter((s) => !form.licence || String(s.licence) === String(form.licence))
    : [];

  const handleSubmit = async (e) => {

    e.preventDefault();
  
  
    /*
    VALIDATION
    */

    const cleanedForm = cleanFormData(form);
  
  
    if (!/^[0-9]{8}$/.test(cleanedForm.cin)) {
  
      alert("CIN doit contenir 8 chiffres");
  
      return;
  
    }
  
  
    if (!/^[a-zA-ZÀ-ÿ\s-]+$/.test(cleanedForm.nom)) {
  
      alert("Nom invalide");
  
      return;
  
    }
  
  
    if (!/^[a-zA-ZÀ-ÿ\s-]+$/.test(cleanedForm.prenom)) {
  
      alert("Prénom invalide");
  
      return;
  
    }
  
  
    if (!/^[0-9]{8}$/.test(cleanedForm.numTel)) {
  
      alert("Téléphone doit contenir 8 chiffres");
  
      return;
  
    }
  
  
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedForm.email)) {
  
      alert("Email invalide");
  
      return;
  
    }

    if (cleanedForm.email && !cleanedForm.email.toLowerCase().endsWith('@gmail.com')) {
  
      alert("doit terminer par @gmail.com");
  
      return;
  
    }

    if (cleanedForm.nationalite && !/^[a-zA-ZÀ-ÿ\s-]+$/.test(cleanedForm.nationalite)) {
  
      alert("Nationalité invalide");
  
      return;
  
    }

    if (cleanedForm.passport && !/^(?=.*[0-9])[A-Za-z0-9-\s]+$/.test(cleanedForm.passport)) {
  
      alert("Passeport invalide : doit contenir au moins un chiffre");
  
      return;
  
    }
  
  
    try {
      await onSubmit(cleanedForm);
    } catch {
      // Error is handled by parent
      return;
    }
  
  };
  return (
    <form className="form-container" onSubmit={handleSubmit}>
      <h2 className="form-title">
        {selected ? "Modifier Étudiant" : "Nouvel Étudiant"}
      </h2>

      <div className="form-grid">
        <div className="input-group">
          <label>CIN</label>
          <input
name="cin"
value={form.cin}
onChange={handleChange}
placeholder="-"
required
/>
        </div>

        <div className="input-group">
          <label>Nom</label>
          <input
name="nom"
value={form.nom}
onChange={handleChange}
placeholder="-"
required
/>
        </div>

        <div className="input-group">
          <label>Prénom</label>
          <input
name="prenom"
value={form.prenom}
onChange={handleChange}
required
/>
        </div>

        <div className="input-group">
          <label>Genre</label>
          <select name="genre" value={form.genre} onChange={handleChange}>
            <option value="M">Homme</option>
            <option value="F">Femme</option>
          </select>
        </div>

        <div className="input-group">
          <label>Email</label>
          <input
name="email"
value={form.email}
onChange={handleChange}
required
/>
        </div>

        <div className="input-group">
          <label>Téléphone</label>
          <input
name="numTel"
value={form.numTel}
onChange={handleChange}
placeholder="-"
required
/>
        </div>

        <div className="input-group">
          <label>Date naissance</label>
          <input type="date" name="dateNaissance" value={form.dateNaissance} onChange={handleChange} />
        </div>

        <div className="input-group">
          <label>Adresse</label>
          <input
name="adresse"
value={form.adresse}
onChange={handleChange}
placeholder="-"
required/>
        </div>

        <div className="input-group">
          <label>Nationalité</label>
          <input
name="nationalite"
value={form.nationalite}
onChange={handleChange}
placeholder="-"
/>
        </div>

        <div className="input-group">
          <label>Passport</label>
          <input
name="passport"
value={form.passport}
onChange={handleChange}
placeholder="-"
/>
        </div>

        <div className="input-group">
          <label>Situation Semestre 5</label>
          <select name="situation_s5" value={form.situation_s5} onChange={handleChange}>
            <option value="N">Nouveau</option>
            <option value="R">Redoublant</option>
          </select>
        </div>

        <div className="input-group">
          <label>Situation PFE</label>
          <select name="situation_pfe" value={form.situation_pfe} onChange={handleChange}>
            <option value="N">Nouveau</option>
            <option value="R">Redoublant</option>
          </select>
        </div>

        <div className="input-group">
          <label>Groupe</label>
          <input
            name="groupe"
            value={form.groupe}
            onChange={handleChange}
            placeholder="-"
          />
        </div>

        <div className="input-group">
          <label>Licence</label>
          <select name="licence" value={form.licence} onChange={handleLicenceChange}>
            <option value="">—</option>
            {licences.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nom} ({l.code})
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Spécialité</label>
          <select name="specialite" value={form.specialite} onChange={handleSpecialiteChange}>
            <option value="">—</option>
            {specialitesFiltrees.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom} ({s.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-buttons">
        <button type="submit" className="btn save-btn">Enregistrer</button>
        <button type="button" className="btn cancel-btn" onClick={onCancel}>Annuler</button>
      </div>
    </form>
  );
}

export default EtudiantForm;