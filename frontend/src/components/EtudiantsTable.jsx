import React, { useState } from "react";
import "./Table.css";
import DetailsModal from './DetailsModal';

function EtudiantsTable({ etudiants, onEdit, onDelete, filterBy = ['Tous les champs'], selectedEtudiants = new Set(), onToggleSelect }) {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEtudiant, setSelectedEtudiant] = useState(null);
  
  const showField = (field) => Array.isArray(filterBy) ? (filterBy.includes('Tous les champs') || filterBy.includes(field)) : (filterBy === 'Tous les champs' || filterBy === field);

  return (
<>
<div className="table-wrapper">
<table className="table"> 
<thead>
<tr>
<th style={{ width: '40px', textAlign: 'center' }}>
  <input
    type="checkbox"
    checked={etudiants.length > 0 && Array.from(selectedEtudiants).length === etudiants.length}
    onChange={() => {
      if (onToggleSelect) {
        etudiants.forEach(e => {
          if (
            (Array.from(selectedEtudiants).length === etudiants.length && selectedEtudiants.has(e.idEtudiant)) ||
            (Array.from(selectedEtudiants).length < etudiants.length && !selectedEtudiants.has(e.idEtudiant))
          ) {
            onToggleSelect(e.idEtudiant);
          }
        });
      }
    }}
  />
</th>

<th>🆔ID</th>
{showField('CIN') && <th>🪪CIN</th>}
{showField('Passport') && <th>🛂 Passport</th>}
{showField('Nationalité') && <th>🌍 Nationalité</th>}
{showField('Nom') && <th>👤Nom</th>}
{showField('Prénom') && <th>👤Prénom</th>}
{showField('Genre') && <th>⚧Genre</th>}
{showField('Email') && <th>📧Email</th>}
{showField('Téléphone') && <th>📞Téléphone</th>}
{showField('Date de Naissance') && <th>🎂Naissance</th>}
{filterBy === 'Tous les champs' && <th>🏠Adresse</th>}
{showField('Licence') && <th>🎓Licence</th>}
{showField('Spécialité') && <th>📚Spécialité</th>}
{showField('Groupe') && <th>👥Groupe</th>}
{showField('Situation') && <th>📊Situation</th>}
<th>⚙️Actions</th>
</tr>

</thead>
      <tbody>
        {etudiants.map((e) => (
          <tr key={e.idEtudiant} style={{ backgroundColor: selectedEtudiants.has(e.idEtudiant) ? '#e0f2fe' : 'transparent' }}>
            <td style={{ width: '40px', textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={selectedEtudiants.has(e.idEtudiant)}
                onChange={() => onToggleSelect && onToggleSelect(e.idEtudiant)}
                style={{ cursor: 'pointer' }}
              />
            </td>
            <td>{e.idEtudiant ?? '-'}</td>
            {showField('CIN') && <td>{e.cin || '-'}</td>}
            {showField('Passport') && <td>{e.passport || '-'}</td>}
            {showField('Nationalité') && <td>{e.nationalite || '-'}</td>}
            {showField('Nom') && <td>{e.nom_fr || '-'}</td>}
            {showField('Prénom') && <td>{e.prenom_fr || '-'}</td>}
            {showField('Genre') && <td>{e.genre === 'F' ? 'Femme' : 'Homme'}</td>}
            {showField('Email') && <td>{e.email || '-'}</td>}
            {showField('Téléphone') && <td>{e.numTel || '-'}</td>}
            {showField('Date de Naissance') && <td>{e.dateNaissance || '-'}</td>}
            {filterBy === 'Tous les champs' && <td>{e.adresse || '-'}</td>}
            {showField('Licence') && <td>{e.licence_detail ? `${e.licence_detail.nom} (${e.licence_detail.code})` : '—'}</td>}
            {showField('Spécialité') && <td>{e.specialite_detail ? `${e.specialite_detail.nom} (${e.specialite_detail.code})` : '—'}</td>}
            {showField('Groupe') && <td>{e.groupe || '-'}</td>}
            {showField('Situation') && (
              <td>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                  <span><strong style={{color: '#475569'}}>S5:</strong> {e.situation_s5 === 'N' ? 'Nouveau' : e.situation_s5 === 'R' ? 'Redoublant' : '-'}</span>
                  <span><strong style={{color: '#475569'}}>PFE:</strong> {e.situation_pfe === 'N' ? 'Nouveau' : e.situation_pfe === 'R' ? 'Redoublant' : '-'}</span>
                </div>
              </td>
            )}

            <td>
              <span
                className="view-icon"
                onClick={() => {
                  setSelectedEtudiant(e);
                  setShowDetailsModal(true);
                }}
                title="Voir les détails"
              >
                👁️
              </span>
              <span
                className="icon edit-icon"
                onClick={() => onEdit(e)}
              >
                ✏️
              </span>
              <span
                className="icon delete-icon"
                onClick={() => onDelete(e.idEtudiant)}
              >
                🗑️
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
    <DetailsModal
      isOpen={showDetailsModal}
      onClose={() => {
        setShowDetailsModal(false);
        setSelectedEtudiant(null);
      }}
      title={selectedEtudiant ? `Détails - ${selectedEtudiant.nom_fr || selectedEtudiant.nom} ${selectedEtudiant.prenom_fr || selectedEtudiant.prenom}` : 'Détails'}
      details={selectedEtudiant ? {
        'ID': selectedEtudiant.idEtudiant,
        'CIN': selectedEtudiant.cin,
        'Passport': selectedEtudiant.passport,
        'Nationalité': selectedEtudiant.nationalite,
        'Nom': selectedEtudiant.nom_fr || selectedEtudiant.nom,
        'Prénom': selectedEtudiant.prenom_fr || selectedEtudiant.prenom,
        'Genre': selectedEtudiant.genre === 'F' ? 'Femme' : 'Homme',
        'Email': selectedEtudiant.email,
        'Téléphone': selectedEtudiant.numTel,
        'Date Naissance': selectedEtudiant.dateNaissance,
        'Adresse': selectedEtudiant.adresse,
        'Licence': selectedEtudiant.licence_detail ? `${selectedEtudiant.licence_detail.nom} (${selectedEtudiant.licence_detail.code})` : '—',
        'Spécialité': selectedEtudiant.specialite_detail ? `${selectedEtudiant.specialite_detail.nom} (${selectedEtudiant.specialite_detail.code})` : '—',
        'Groupe': selectedEtudiant.groupe,
        'Situation S5': selectedEtudiant.situation_s5 === 'N' ? 'Nouveau' : selectedEtudiant.situation_s5 === 'R' ? 'Redoublant' : '-',
        'Situation PFE': selectedEtudiant.situation_pfe === 'N' ? 'Nouveau' : selectedEtudiant.situation_pfe === 'R' ? 'Redoublant' : '-',
      } : {}}
    />
</>
  );
}

export default EtudiantsTable;