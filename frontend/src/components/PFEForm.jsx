import React, { useState, useEffect, useMemo } from 'react';

/** IDs étudiants liés à un PFE (réponse API : etudiants_detail et/ou etudiants). */
function collectEtudiantIdsFromPfe(p) {
  const ids = [];
  if (Array.isArray(p?.etudiants_detail)) {
    p.etudiants_detail.forEach((e) => {
      const id = e?.idEtudiant ?? e?.id;
      if (id != null && !Number.isNaN(Number(id))) ids.push(Number(id));
    });
    if (ids.length) return ids;
  }
  if (Array.isArray(p?.etudiants)) {
    p.etudiants.forEach((x) => {
      if (x != null && typeof x === 'object') {
        const id = x.idEtudiant ?? x.id;
        if (id != null && !Number.isNaN(Number(id))) ids.push(Number(id));
      } else if (x !== '' && x != null && !Number.isNaN(Number(x))) {
        ids.push(Number(x));
      }
    });
  }
  return ids;
}

function PFEForm({ pfe, pfes = [], enseignants, etudiants, specialites = [], licences = [], onCancel, onSubmit }) {
  const [sujet, setSujet] = useState('');
  const [duree, setDuree] = useState('');
  const [lieu_stage, setLieu_stage] = useState('');
  const [licence, setLicence] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [encadrant, setEncadrant] = useState('');
  const [selectedEtudiants, setSelectedEtudiants] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [resultatTechnique, setResultatTechnique] = useState('');
  const [resultatFinale, setResultatFinale] = useState('');

  useEffect(() => {
    if (pfe) {
      setSujet(pfe.sujet || '');
      setDuree(pfe.duree || '');
      setLieu_stage(pfe.lieu_stage || '');
      
      let initialSpec = pfe.specialite || '';
      let initialLicence = '';

      // Essayer de trouver la licence correspondant à la spécialité du PFE
      if (initialSpec) {
        const specObj = specialites.find(s => s.nom === initialSpec);
        if (specObj && specObj.licence) {
          initialLicence = String(specObj.licence);
        }
      }

      const loadedEtudiants = Array.isArray(pfe.etudiants) ? pfe.etudiants.map((e) => e.idEtudiant || e) : [];
      setSelectedEtudiants(loadedEtudiants);

      // Si le PFE n'a pas de spécialité/licence, essayer de récupérer depuis l'étudiant
      if (!initialSpec && loadedEtudiants.length > 0) {
        const firstStudent = etudiants.find((e) => Number(e.idEtudiant) === loadedEtudiants[0]);
        if (firstStudent) {
          if (firstStudent.licence) {
            initialLicence = String(firstStudent.licence);
          }
          if (firstStudent.specialite_detail?.nom) {
            initialSpec = firstStudent.specialite_detail.nom;
          } else if (firstStudent.specialite) {
            const specObj = specialites.find(s => String(s.id) === String(firstStudent.specialite));
            if (specObj) initialSpec = specObj.nom;
          }
        }
      }

      setSpecialite(initialSpec);
      setLicence(initialLicence);
      setEncadrant(pfe.encadrant || '');
      setRulesAccepted(Boolean(pfe?.rulesAccepted));
      setResultatTechnique(pfe.resultat_soutenance_technique || '');
      setResultatFinale(pfe.resultat_soutenance_finale || '');
    } else {
      setRulesAccepted(false);
      setSujet('');
      setDuree('');
      setLieu_stage('');
      setSpecialite('');
      setLicence('');
      setEncadrant('');
      setSelectedEtudiants([]);
      setResultatTechnique('');
      setResultatFinale('');
    }
  }, [pfe, specialites, etudiants]);

  const currentPfeId = pfe?.idPfe ?? null;
  const etudiantsDejaPfeAilleurs = useMemo(() => {
    const s = new Set();
    (pfes || []).forEach((row) => {
      if (currentPfeId != null && row.idPfe === currentPfeId) return;
      collectEtudiantIdsFromPfe(row).forEach((id) => s.add(id));
    });
    return s;
  }, [pfes, currentPfeId]);

  const handleSave = (event) => {
    event.preventDefault();

    if (!sujet.trim() || !duree || !specialite.trim()) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires (Sujet, Durée, Spécialité).');
      return;
    }

    if (selectedEtudiants.length < 1 || selectedEtudiants.length > 2) {
      setErrorMessage('Un PFE doit contenir 1 ou 2 étudiants.');
      return;
    }

    if (!rulesAccepted) {
      setErrorMessage('Vous devez accepter les règles du PFE pour continuer.');
      return;
    }

    setErrorMessage('');

    onSubmit({
      sujet: sujet.trim(),
      duree: Number(duree),
      lieu_stage: lieu_stage.trim(),
      specialite: specialite.trim(),
      encadrant: encadrant || null,
      etudiants: selectedEtudiants,
      resultat_soutenance_technique: resultatTechnique.trim(),
      resultat_soutenance_finale: resultatFinale.trim(),
      idPfe: pfe?.idPfe,
    });
  };

  const handleStudentChange = (event) => {
    const value = Number(event.target.value);
    const isSelected = selectedEtudiants.includes(value);
    let next = [];

    if (isSelected) {
      next = selectedEtudiants.filter((item) => item !== value);
    } else {
      next = [...selectedEtudiants, value];
    }

    if (next.length <= 2) {
      setSelectedEtudiants(next);
      setErrorMessage('');

      // Auto-fill licence et specialite en fonction du premier étudiant
      if (next.length > 0) {
        const firstStudent = etudiants.find((e) => String(e.idEtudiant) === String(next[0]) || String(e.id) === String(next[0]));
        if (firstStudent) {
          const studentLicence = firstStudent.licence || (firstStudent.licence_detail ? firstStudent.licence_detail.id : null);
          if (studentLicence) {
            setLicence(String(studentLicence));
          }
          const studentSpecNom = firstStudent.specialite_detail?.nom;
          if (studentSpecNom) {
            setSpecialite(studentSpecNom);
          } else if (firstStudent.specialite) {
            const specObj = specialites.find(s => String(s.id) === String(firstStudent.specialite));
            if (specObj) setSpecialite(specObj.nom);
          }
        }
      }
    } else {
      setErrorMessage('Vous ne pouvez sélectionner que 2 étudiants maximum.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{pfe ? 'Modifier le PFE' : 'Ajouter un nouveau PFE'}</h3>
        {errorMessage && <div className="success-message" style={{ background: '#e53e3e' }}>{errorMessage}</div>}
        <form onSubmit={handleSave}>
          <div className="form-row">
            <label>Étudiants *</label>
            <div style={{ marginBottom: '8px', fontSize: '13px', color: '#64748b' }}>
              Sélectionnez {selectedEtudiants.length === 0 ? '1 ou 2 étudiants' : selectedEtudiants.length === 1 ? '1 étudiant (Monôme)' : '2 étudiants (Binôme)'}
            </div>
            <input
              type="text"
              placeholder="Rechercher un étudiant (nom ou prénom)... Tapez pour voir la liste"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                marginBottom: '12px',
                border: '2px solid #e0e7ff',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#f8fafc',
                transition: 'all 0.3s'
              }}
            />
            {studentSearch.trim() && (
              <div className="checkbox-grid" style={{
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid #e0e7ff',
                borderRadius: '6px',
                padding: '8px',
                backgroundColor: 'white',
                marginBottom: '12px'
              }}>
                {etudiants
                  .filter((etudiant) => {
                    const searchLower = studentSearch.toLowerCase();
                    return (
                      etudiant.nom.toLowerCase().includes(searchLower) ||
                      etudiant.prenom.toLowerCase().includes(searchLower) ||
                      etudiant.cin.toLowerCase().includes(searchLower)
                    );
                  })
                  .slice(0, 10)
                  .map((etudiant) => {
                    const etudId = etudiant.idEtudiant || etudiant.id;
                    const sid = Number(etudId);
                    const dejaSelectionne = selectedEtudiants.some((x) => Number(x) === sid);
                    const prisAilleurs = etudiantsDejaPfeAilleurs.has(sid) && !dejaSelectionne;
                    return (
                      <label
                        key={etudId}
                        className="checkbox-label"
                        style={prisAilleurs ? { opacity: 0.55 } : undefined}
                      >
                        <input
                          type="checkbox"
                          value={etudId}
                          checked={selectedEtudiants.includes(etudId) || selectedEtudiants.includes(sid)}
                          onChange={handleStudentChange}
                          disabled={prisAilleurs}
                        />
                        {etudiant.nom} {etudiant.prenom} ({etudiant.cin})
                        {prisAilleurs && (
                          <span style={{ color: '#94a3b8', marginLeft: '6px' }}>
                            — déjà un PFE (un seul encadrant)
                          </span>
                        )}
                      </label>
                    );
                  })}
                {etudiants.filter((etudiant) => {
                  const searchLower = studentSearch.toLowerCase();
                  return (
                    etudiant.nom.toLowerCase().includes(searchLower) ||
                    etudiant.prenom.toLowerCase().includes(searchLower) ||
                    etudiant.cin.toLowerCase().includes(searchLower)
                  );
                }).length === 0 && (
                    <div style={{ padding: '8px', color: '#64748b', fontStyle: 'italic' }}>
                      Aucun étudiant trouvé pour "{studentSearch}"
                    </div>
                  )}
                {etudiants.filter((etudiant) => {
                  const searchLower = studentSearch.toLowerCase();
                  return (
                    etudiant.nom.toLowerCase().includes(searchLower) ||
                    etudiant.prenom.toLowerCase().includes(searchLower) ||
                    etudiant.cin.toLowerCase().includes(searchLower)
                  );
                }).length > 10 && (
                    <div style={{ padding: '8px', color: '#64748b', fontSize: '12px', fontStyle: 'italic' }}>
                      ... et {etudiants.filter((etudiant) => {
                        const searchLower = studentSearch.toLowerCase();
                        return (
                          etudiant.nom.toLowerCase().includes(searchLower) ||
                          etudiant.prenom.toLowerCase().includes(searchLower) ||
                          etudiant.cin.toLowerCase().includes(searchLower)
                        );
                      }).length - 10} autres résultats
                    </div>
                  )}
              </div>
            )}
            <div className={`student-count ${selectedEtudiants.length >= 1 && selectedEtudiants.length <= 2 ? 'valid' : 'invalid'}`}>
              {selectedEtudiants.length === 0 && '❌ Veuillez sélectionner au moins 1 étudiant'}
              {selectedEtudiants.length === 1 && '✓ Monôme - 1 étudiant sélectionné'}
              {selectedEtudiants.length === 2 && '✓ Binôme - 2 étudiants sélectionnés'}
              {selectedEtudiants.length > 2 && '❌ Maximum 2 étudiants autorisés'}
            </div>
          </div>

          <div className="form-row">
            <label>Sujet</label>
            <textarea
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="form-row">
            <label>Durée (en mois)</label>
            <input
              type="number"
              value={duree}
              min="1"
              placeholder="Ex: 6"
              onChange={(e) => setDuree(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <label>Lieu de stage</label>
            <input
              type="text"
              value={lieu_stage}
              placeholder="Entreprise ou lieu"
              onChange={(e) => setLieu_stage(e.target.value)}
            />
          </div>

          <div className="form-row">
            <label>Spécialité</label>
            <select
              value={specialite}
              onChange={(e) => setSpecialite(e.target.value)}
              required
            >
              <option value="">Sélectionner une spécialité</option>
              {specialites
                .filter(spec => !licence || String(spec.licence) === String(licence))
                .map((spec) => (
                <option key={spec.id} value={spec.nom}>
                  {spec.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>Encadrant (Optionnel)</label>
            <select value={encadrant} onChange={(e) => setEncadrant(e.target.value)}>
              <option value="">Sélectionner un encadrant</option>
              {enseignants.map((enseignant) => (
                <option key={enseignant.matricule} value={enseignant.id ?? enseignant.matricule}>
                  {enseignant.nom} {enseignant.prenom} ({enseignant.matricule})
                </option>
              ))}
            </select>
          </div>

          {pfe && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-row">
                <label>Résultat Soutenance Technique</label>
                <input
                  type="text"
                  value={resultatTechnique}
                  placeholder="Ex: Validé, Non validé, Note..."
                  onChange={(e) => setResultatTechnique(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label>Résultat Soutenance Finale</label>
                <input
                  type="text"
                  value={resultatFinale}
                  placeholder="Ex: 16/20, Mention..."
                  onChange={(e) => setResultatFinale(e.target.value)}
                />
              </div>
            </div>
          )}



          <div className="form-row" style={{ marginTop: '16px' }}>
            <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={rulesAccepted}
                onChange={(e) => setRulesAccepted(e.target.checked)}
                style={{ marginRight: '10px' }}
              />
              J'accepte les règles du PFE et m'engage à respecter le sujet, la durée et les consignes.
            </label>
            <div style={{ marginTop: '8px', fontSize: '13px', color: '#475569' }}>
              <strong>Règles provisoires :</strong>
              <ul style={{ marginTop: '6px', lineHeight: '1.5' }}>
                <li>Le sujet doit être conforme à la spécialité choisie.</li>
                <li>La durée est indiquée en mois.</li>
                <li>Le PFE doit être réalisé par 1 ou 2 étudiants.</li>
                <li>Chaque étudiant n’a qu’un seul encadrant : il ne peut figurer que dans un seul PFE.</li>
              </ul>
            </div>
          </div>

          <div className="buttons-area">
            <button type="submit" className="btn">
              Enregistrer
            </button>
            <button type="button" className="btn import-btn" onClick={onCancel}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PFEForm;
