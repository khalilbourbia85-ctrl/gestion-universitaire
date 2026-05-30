import React, { useState, useEffect, useMemo } from 'react';

function pickRandomMatriculeFromList(list) {
  if (!Array.isArray(list) || list.length === 0) return '';
  const i = Math.floor(Math.random() * list.length);
  return list[i].matricule;
}

/** Date locale YYYY-MM-DD (évite les rejets liés au fuseau avec `toISOString()`). */
function localDateISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Valeur pour <input type="time"> à partir de la réponse API (ex. "09:00:00"). */
function timeForInput(v) {
  if (v == null || v === '') return '09:00';
  const s = String(v).trim();
  if (/^\d{1,2}:\d{2}/.test(s)) return s.length >= 5 ? s.slice(0, 5) : s;
  return '09:00';
}

function parseTime(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }
  return 0;
}

function SoutenanceForm({ soutenance, soutenances = [], enseignants, etudiants, pfes, sallesList = [], onCancel, onSubmit }) {
  const [dateSoutenance, setDateSoutenance] = useState('');
  const [heureSoutenance, setHeureSoutenance] = useState('09:00');
  const [typeSoutenance, setTypeSoutenance] = useState('finale');
  const [duree, setDuree] = useState('');
  const [salle, setSalle] = useState('');
  const [encadrant, setEncadrant] = useState('');
  const [rapporteur, setRapporteur] = useState('');
  /** 'manual' | 'random' */
  const [rapporteurMode, setRapporteurMode] = useState('manual');
  const [pfe, setPfe] = useState('');
  const [selectedEtudiants, setSelectedEtudiants] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [filteredEtudiants, setFilteredEtudiants] = useState([]);
  const [resultatTechnique, setResultatTechnique] = useState('');
  const [resultatFinale, setResultatFinale] = useState('');
  const [depotElectronique, setDepotElectronique] = useState(false);
  const [depotPapier, setDepotPapier] = useState(false);

  /** Enseignants pouvant être rapporteurs : pas l'encadrant ; pas contrat doctorant ni docteur. */
  const rapporteursEligibles = useMemo(() => {
    if (!Array.isArray(enseignants)) return [];
    const enc = encadrant != null && encadrant !== '' ? String(encadrant) : '';
    return enseignants.filter((e) => {
      if (enc && String(e.matricule) === enc) return false;
      if (e.typeContrat === 'ContratDoctorant' || e.typeContrat === 'ContratDocteur') return false;
      return true;
    });
  }, [enseignants, encadrant]);

  useEffect(() => {
    if (!rapporteur) return;
    const r = String(rapporteur);
    const ok = rapporteursEligibles.some((e) => String(e.matricule) === r);
    if (!ok) setRapporteur('');
  }, [rapporteur, rapporteursEligibles]);

  const availableSalles = useMemo(() => {
    const allSallesNoms = sallesList.map(s => s.nom);
    if (!dateSoutenance || !heureSoutenance || !duree) {
      return allSallesNoms;
    }
    
    const startMins = parseTime(heureSoutenance);
    const endMins = startMins + Number(duree);
    const conflictingSalles = new Set();
    
    soutenances.forEach(s => {
      // Ignore current soutenance being edited
      if (soutenance && s.idSoutenance === soutenance.idSoutenance) return;
      
      if (s.date_soutenance === dateSoutenance && s.heure_soutenance && s.duree) {
        const sStartMins = parseTime(s.heure_soutenance);
        const sEndMins = sStartMins + Number(s.duree);
        
        // Interval [A, B] and [C, D] overlap if Math.max(A, C) < Math.min(B, D)
        const overlap = Math.max(startMins, sStartMins) < Math.min(endMins, sEndMins);
        
        if (overlap && s.salle) {
          conflictingSalles.add(String(s.salle).trim());
        }
      }
    });
    
    return allSallesNoms.filter(salle => !conflictingSalles.has(salle));
  }, [soutenances, soutenance, dateSoutenance, heureSoutenance, duree, sallesList]);

  useEffect(() => {
    if (soutenance) {
      setDateSoutenance(soutenance.date_soutenance || '');
      setHeureSoutenance(timeForInput(soutenance.heure_soutenance));
      setTypeSoutenance(soutenance.type_soutenance || 'finale');
      setDuree(soutenance.duree || '');
      setSalle(soutenance.salle || '');
      setEncadrant(soutenance.encadrant || '');
      setRapporteur(soutenance.rapporteur || '');
      setRapporteurMode('manual');
      setPfe(soutenance.pfe || '');
      setSelectedEtudiants(
        Array.isArray(soutenance.etudiants)
          ? soutenance.etudiants
              .map((e) => Number(typeof e === 'object' ? e.idEtudiant ?? e : e))
              .filter((id) => Number.isFinite(id))
          : []
      );
      setResultatTechnique(soutenance.resultat_technique || '');
      setResultatFinale(soutenance.resultat_finale || '');
      setDepotElectronique(Boolean(soutenance.depot_electronique));
      setDepotPapier(Boolean(soutenance.depot_papier));
    } else {
      setDateSoutenance('');
      setHeureSoutenance('09:00');
      setTypeSoutenance('finale');
      setDuree('');
      setSalle('');
      setEncadrant('');
      setRapporteur('');
      setRapporteurMode('manual');
      setPfe('');
      setSelectedEtudiants([]);
      setResultatTechnique('');
      setResultatFinale('');
      setDepotElectronique(false);
      setDepotPapier(false);
    }
    setStudentSearch('');
    setErrorMessage('');
  }, [soutenance]);

  // Quand l'encadrant change, filtrer les étudiants
  useEffect(() => {
    if (encadrant) {
      // Récupérer les PFEs dirigés par cet encadrant
      const encStr = String(encadrant);
      const pfesByEncadrant = pfes.filter((p) => String(p.encadrant) === encStr);
      // Récupérer les IDs des étudiants dans ces PFEs
      const studentIdsByEncadrant = new Set();
      pfesByEncadrant.forEach((pfe) => {
        if (Array.isArray(pfe.etudiants_detail)) {
          pfe.etudiants_detail.forEach((etudiant) => {
            studentIdsByEncadrant.add(etudiant.idEtudiant);
            studentIdsByEncadrant.add(Number(etudiant.idEtudiant));
          });
        } else if (Array.isArray(pfe.etudiants)) {
          pfe.etudiants.forEach((etudiantId) => {
            studentIdsByEncadrant.add(etudiantId);
            studentIdsByEncadrant.add(Number(etudiantId));
          });
        }
      });
      // Filtrer les étudiants
      const filtered = etudiants.filter((etudiant) =>
        studentIdsByEncadrant.has(etudiant.idEtudiant) ||
        studentIdsByEncadrant.has(Number(etudiant.idEtudiant))
      );
      setFilteredEtudiants(filtered);
      // Réinitialiser la sélection des étudiants
      setSelectedEtudiants([]);
      setStudentSearch('');
    } else {
      setFilteredEtudiants([]);
      setSelectedEtudiants([]);
    }
  }, [encadrant, pfes, etudiants]);

  const handleTirageRapporteur = () => {
    setErrorMessage('');
    if (!rapporteursEligibles.length) {
      setErrorMessage(
        "Aucun enseignant éligible : l'encadrant ne peut pas être rapporteur, ni les enseignants au contrat doctorant ou docteur."
      );
      return;
    }
    setRapporteur(pickRandomMatriculeFromList(rapporteursEligibles));
  };

  const handleSave = (event) => {
    event.preventDefault();

    if (!depotElectronique || !depotPapier) {
      setErrorMessage("Impossible de planifier la soutenance et d'affecter un rapporteur tant que les deux dépôts (électronique et papier) ne sont pas effectués (Oui).");
      return;
    }

    let finalRapporteur = rapporteur;
    if (rapporteurMode === 'random') {
      if (!rapporteursEligibles.length) {
        setErrorMessage(
          "Aucun enseignant éligible pour l'affectation aléatoire (contrats doctorant/docteur exclus, encadrant exclu)."
        );
        return;
      }
      finalRapporteur = rapporteur || pickRandomMatriculeFromList(rapporteursEligibles);
    } else if (!rapporteur) {
      if (!rapporteursEligibles.length) {
        setErrorMessage(
          "Aucun enseignant ne peut tenir le rôle de rapporteur : tous sont peut-être en contrat doctorant/docteur, ou seul l'encadrant est disponible. Ajoutez un enseignant éligible ou changez d'encadrant."
        );
      } else {
        setErrorMessage('Veuillez sélectionner un rapporteur.');
      }
      return;
    }

    if (!dateSoutenance || !heureSoutenance || !salle || !encadrant || !finalRapporteur) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (typeSoutenance === 'finale' && !duree) {
      setErrorMessage('La durée est obligatoire pour une soutenance finale.');
      return;
    }

    const sallesSet = new Set(sallesList.map(s => String(s.nom).trim()));
    if (!sallesSet.has(String(salle).trim())) {
      setErrorMessage('Choisissez une salle parmi la liste.');
      return;
    }

    const today = localDateISO();
    if (dateSoutenance < today) {
      setErrorMessage('La date de soutenance doit être à partir de la date du jour (calendrier local).');
      return;
    }

    if (selectedEtudiants.length === 0) {
      setErrorMessage('Veuillez sélectionner au moins 1 étudiant.');
      return;
    }

    setErrorMessage('');

    const etudiantsPayload = selectedEtudiants
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));

    const payload = {
      type_soutenance: typeSoutenance,
      date_soutenance: dateSoutenance,
      heure_soutenance: heureSoutenance,
      duree: duree ? Number(duree) : null,
      salle: salle.trim(),
      encadrant,
      rapporteur: finalRapporteur,
      pfe:
        pfe !== '' && pfe != null && Number.isFinite(Number(pfe))
          ? Number(pfe)
          : null,
      etudiants: etudiantsPayload,
      resultat_technique: resultatTechnique.trim(),
      resultat_finale: resultatFinale.trim(),
      depot_electronique: depotElectronique,
      depot_papier: depotPapier,
    };
    if (soutenance?.idSoutenance != null) {
      payload.idSoutenance = soutenance.idSoutenance;
    }
    onSubmit(payload);
  };

  const handleStudentChange = (event) => {
    const value = Number(event.target.value);
    const isSelected = selectedEtudiants.includes(value);

    // 1. Trouver le PFE auquel appartient cet étudiant
    const studentPfe = pfes.find((p) => {
      if (Array.isArray(p.etudiants_detail)) {
        return p.etudiants_detail.some((e) => Number(e.idEtudiant) === value);
      } else if (Array.isArray(p.etudiants)) {
        return p.etudiants.some((id) => Number(id) === value);
      }
      return false;
    });

    // 2. Récupérer tous les étudiants de ce PFE (pour le binôme)
    const idsToToggle = [value];
    if (studentPfe) {
      if (Array.isArray(studentPfe.etudiants_detail)) {
        studentPfe.etudiants_detail.forEach((e) => {
          const id = Number(e.idEtudiant);
          if (!idsToToggle.includes(id)) idsToToggle.push(id);
        });
      } else if (Array.isArray(studentPfe.etudiants)) {
        studentPfe.etudiants.forEach((e) => {
          const id = Number(e);
          if (!idsToToggle.includes(id)) idsToToggle.push(id);
        });
      }
    }

    let next = [];

    if (isSelected) {
      // Désélectionner l'étudiant et son binôme
      next = selectedEtudiants.filter((item) => !idsToToggle.includes(item));
      setErrorMessage('');
    } else {
      // Vérifier si l'ajout dépasse la limite de 2
      const futureCount = selectedEtudiants.length + idsToToggle.length;
      if (futureCount > 2) {
        setErrorMessage('⚠️ Maximum 2 étudiants autorisés par soutenance.');
        return;
      }
      // Ajouter l'étudiant et son binôme
      next = [...selectedEtudiants, ...idsToToggle];
      setErrorMessage('');
    }

    setSelectedEtudiants(next);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{soutenance ? 'Modifier la soutenance' : 'Ajouter une nouvelle soutenance'}</h3>
        {errorMessage && <div className="success-message" style={{ background: '#e53e3e' }}>{errorMessage}</div>}
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <div className="form-row" style={{ marginBottom: 0 }}>
              <label className="checkbox-label" style={{ fontWeight: 'bold', cursor: selectedEtudiants.length === 0 ? 'not-allowed' : 'pointer', opacity: selectedEtudiants.length === 0 ? 0.5 : 1 }}>
                <input
                  type="checkbox"
                  checked={depotElectronique}
                  disabled={selectedEtudiants.length === 0}
                  onChange={(e) => setDepotElectronique(e.target.checked)}
                />
                Dépôt électronique effectué
              </label>
            </div>
            <div className="form-row" style={{ marginBottom: 0 }}>
              <label className="checkbox-label" style={{ fontWeight: 'bold', cursor: selectedEtudiants.length === 0 ? 'not-allowed' : 'pointer', opacity: selectedEtudiants.length === 0 ? 0.5 : 1 }}>
                <input
                  type="checkbox"
                  checked={depotPapier}
                  disabled={selectedEtudiants.length === 0}
                  onChange={(e) => setDepotPapier(e.target.checked)}
                />
                Dépôt papier effectué
              </label>
            </div>
          </div>
          <div className="form-row">
            <label>Encadrant *</label>
            <select
              value={encadrant}
              onChange={(e) => {
                setEncadrant(e.target.value);
                // Si l'encadrant change, réinitialiser la sélection d'étudiants
                setSelectedEtudiants([]);
                setPfe('');
              }}
              required
            >
              <option value="">Sélectionner un encadrant</option>
              {enseignants && enseignants.map((ens) => (
                <option key={ens.matricule} value={ens.matricule}>
                  {ens.nom} {ens.prenom} ({ens.matricule})
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>Étudiants *</label>
            {!encadrant && (
              <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#fef3c7', borderRadius: '4px', color: '#92400e', fontSize: '13px' }}>
                Sélectionnez d'abord un encadrant pour voir ses étudiants
              </div>
            )}
            <div style={{ marginBottom: '8px', fontSize: '13px', color: '#64748b' }}>
              {filteredEtudiants.length === 0 && encadrant ? 'Cet encadrant n\'a pas d\'étudiants' : ''}
              {selectedEtudiants.length === 0 ? 'Sélectionnez au moins 1 étudiant' : `${selectedEtudiants.length} étudiant(s) sélectionné(s)`}
            </div>
            {selectedEtudiants.length > 0 && (
              <div style={{ marginBottom: '12px', padding: '8px 12px', backgroundColor: '#e0e7ff', borderRadius: '6px', border: '1px solid #c7d2fe', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                {selectedEtudiants.map((etudiantId) => {
                  const etudiant = filteredEtudiants.find((e) => Number(e.idEtudiant) === Number(etudiantId));
                  return (
                    <span key={etudiantId} style={{ backgroundColor: '#4f46e5', color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {etudiant ? `${etudiant.nom_fr} ${etudiant.prenom_fr}` : `Étudiant ${etudiantId}`}
                      <button
                        type="button"
                        onClick={() => setSelectedEtudiants(selectedEtudiants.filter((id) => Number(id) !== Number(etudiantId)))}
                        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px', padding: '0', display: 'flex', alignItems: 'center' }}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            {encadrant && (
              <input
                type="text"
                placeholder="Rechercher un étudiant (nom ou prénom)..."
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
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px', marginBottom: '12px' }}>
              {filteredEtudiants.length > 0 ? (
                filteredEtudiants
                  .filter((etudiant) => {
                    const searchLower = studentSearch.toLowerCase();
                    const nom = String(etudiant.nom_fr ?? '').toLowerCase();
                    const prenom = String(etudiant.prenom_fr ?? '').toLowerCase();
                    return nom.includes(searchLower) || prenom.includes(searchLower);
                  })
                  .map((etudiant) => {
                    const isSelected = selectedEtudiants.includes(Number(etudiant.idEtudiant));
                    const isDisabled = selectedEtudiants.length >= 2 && !isSelected;
                    return (
                      <div
                        key={etudiant.idEtudiant}
                        onClick={() => {
                          if (!isDisabled) {
                            const event = new Event('change', { bubbles: true });
                            const input = document.querySelector(`input[value="${etudiant.idEtudiant}"]`);
                            if (input) input.click();
                          }
                        }}
                        style={{
                          padding: '12px',
                          border: isSelected ? '2px solid #4f46e5' : '2px solid #e2e8f0',
                          borderRadius: '6px',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          backgroundColor: isSelected ? '#eef2ff' : '#f8fafc',
                          opacity: isDisabled ? 0.5 : 1,
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                        onMouseEnter={(e) => {
                          if (!isDisabled) e.currentTarget.style.backgroundColor = isSelected ? '#e0e7ff' : '#f1f5f9';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isSelected ? '#eef2ff' : '#f8fafc';
                        }}
                      >
                        <input
                          type="checkbox"
                          value={etudiant.idEtudiant}
                          checked={isSelected}
                          onChange={handleStudentChange}
                          disabled={isDisabled}
                          style={{ cursor: isDisabled ? 'not-allowed' : 'pointer', width: '18px', height: '18px' }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: isSelected ? '600' : '500', color: '#1e293b' }}>
                          {etudiant.nom_fr} {etudiant.prenom_fr}
                        </span>
                      </div>
                    );
                  })
              ) : (
                encadrant && <p style={{ color: '#64748b', fontSize: '13px', gridColumn: '1 / -1' }}>Aucun étudiant disponible pour cet encadrant</p>
              )}
            </div>
            <div className={`student-count ${selectedEtudiants.length >= 1 ? 'valid' : 'invalid'}`}>
              {selectedEtudiants.length === 0 && '❌ Veuillez sélectionner au moins 1 étudiant'}
              {selectedEtudiants.length >= 1 && `✓ ${selectedEtudiants.length} étudiant(s) sélectionné(s)`}
            </div>
          </div>

          <div className="form-row">
            <label>Date de soutenance</label>
            <input
              type="date"
              value={dateSoutenance}
              onChange={(e) => setDateSoutenance(e.target.value)}
              min={localDateISO()}
              required
            />
          </div>

          <div className="form-row">
            <label>Heure de début</label>
            <input
              type="time"
              value={heureSoutenance}
              onChange={(e) => setHeureSoutenance(e.target.value)}
              step={60}
              required
            />
          </div>

          <div className="form-row">
            <label>Type de soutenance</label>
            <select
              value={typeSoutenance}
              onChange={(e) => {
                setTypeSoutenance(e.target.value);
                if (e.target.value === 'technique') setDuree('');
              }}
              required
            >
              <option value="finale">Soutenance Finale</option>
              <option value="technique">Soutenance Technique</option>
            </select>
          </div>

          {typeSoutenance === 'finale' && (
            <div className="form-row">
              <label>Durée (minutes) *</label>
              <input
                type="number"
                value={duree}
                min="1"
                onChange={(e) => setDuree(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-row">
            <label>Salle</label>
            <select
              value={salle}
              onChange={(e) => setSalle(e.target.value)}
              required
            >
              <option value="">Sélectionner une salle</option>
              {salle &&
                !sallesList.some(s => String(s.nom).trim() === String(salle).trim()) && (
                  <option value={String(salle).trim()}>
                    {String(salle).trim()} (valeur actuelle — non répertoriée)
                  </option>
                )}
              {availableSalles.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#64748b' }}>
              Seules les salles disponibles pour la date et l'horaire choisis sont affichées.
            </p>
          </div>



          <div className="form-row">
            <label>Rapporteur *</label>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b' }}>
              Tous les enseignants peuvent être rapporteurs sauf ceux au contrat « Contrat doctorant » ou « Contrat
              docteur ». L&apos;encadrant ne peut pas être son propre rapporteur.
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px 20px',
                marginBottom: '10px',
                alignItems: 'center',
              }}
            >
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: (!depotElectronique || !depotPapier) ? 'not-allowed' : 'pointer', opacity: (!depotElectronique || !depotPapier) ? 0.5 : 1 }}>
                <input
                  type="radio"
                  name="rapporteurMode"
                  checked={rapporteurMode === 'manual'}
                  disabled={!depotElectronique || !depotPapier}
                  onChange={() => {
                    setRapporteurMode('manual');
                    setErrorMessage('');
                  }}
                />
                Choix manuel
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: (!depotElectronique || !depotPapier) ? 'not-allowed' : 'pointer', opacity: (!depotElectronique || !depotPapier) ? 0.5 : 1 }}>
                <input
                  type="radio"
                  name="rapporteurMode"
                  checked={rapporteurMode === 'random'}
                  disabled={!depotElectronique || !depotPapier}
                  onChange={() => {
                    setRapporteurMode('random');
                    setRapporteur('');
                    setErrorMessage('');
                  }}
                />
                Affectation aléatoire
              </label>
            </div>
            {rapporteurMode === 'manual' ? (
              <select
                value={rapporteur}
                onChange={(e) => setRapporteur(e.target.value)}
                required={rapporteursEligibles.length > 0}
                disabled={!depotElectronique || !depotPapier}
              >
                <option value="">Sélectionner un rapporteur</option>
                {rapporteursEligibles.map((ens) => (
                  <option key={ens.matricule} value={ens.matricule}>
                    {ens.nom} {ens.prenom} ({ens.matricule})
                    {ens.typeContrat ? ` — ${ens.typeContrat}` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b' }}>
                  Sans tirage préalable, un rapporteur est choisi au hasard à l&apos;enregistrement. Vous pouvez aussi
                  tirer au sort maintenant pour voir le résultat avant de valider.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  <button 
                    type="button" 
                    className="btn import-btn" 
                    onClick={handleTirageRapporteur}
                    disabled={!depotElectronique || !depotPapier}
                  >
                    Tirer au sort un rapporteur
                  </button>
                  {rapporteur && (
                    <span style={{ fontSize: '14px' }}>
                      Tirage actuel :{' '}
                      <strong>
                        {rapporteursEligibles.find((r) => r.matricule === rapporteur)?.nom}{' '}
                        {rapporteursEligibles.find((r) => r.matricule === rapporteur)?.prenom} ({rapporteur})
                      </strong>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="form-row">
            <label>PFE (optionnel)</label>
            <select value={pfe} onChange={(e) => setPfe(e.target.value)}>
              <option value="">Sélectionner un PFE</option>
              {pfes
                .filter((p) => String(p.encadrant) === String(encadrant))
                .map((pfeItem) => {
                  const sujet = typeof pfeItem.sujet === 'string' ? pfeItem.sujet : pfeItem.sujet != null ? String(pfeItem.sujet) : '';
                  const sujetShort = sujet.length > 40 ? `${sujet.slice(0, 40)}…` : sujet || '—';
                  return (
                    <option key={pfeItem.idPfe} value={pfeItem.idPfe}>
                      PFE {pfeItem.idPfe} - {sujetShort}
                    </option>
                  );
                })}
            </select>
          </div>

          {soutenance && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
              {typeSoutenance === 'technique' && (
                <div className="form-row">
                  <label>Résultat Soutenance Technique</label>
                  <select
                    value={resultatTechnique}
                    onChange={(e) => setResultatTechnique(e.target.value)}
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Validé">Validé</option>
                    <option value="Non validé">Non validé</option>
                  </select>
                </div>
              )}
              {typeSoutenance === 'finale' && (
                <div className="form-row">
                  <label>Résultat Soutenance Finale</label>
                  <select
                    value={resultatFinale}
                    onChange={(e) => setResultatFinale(e.target.value)}
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Validé">Validé</option>
                    <option value="Non validé">Non validé</option>
                  </select>
                </div>
              )}
            </div>
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
      </div>
    </div>
  );
}

export default SoutenanceForm;
