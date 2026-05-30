import React from "react";
import "./Table.css";
function EtudiantsTable({ etudiants, onEdit, onDelete, filterBy = ['Tous les champs'], selectedEtudiants = new Set(), onToggleSelect }) {
  const showField = (field) => Array.isArray(filterBy) ? (filterBy.includes('Tous les champs') || filterBy.includes(field)) : (filterBy === 'Tous les champs' || filterBy === field);

  return (
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
  );
}

export default EtudiantsTable;