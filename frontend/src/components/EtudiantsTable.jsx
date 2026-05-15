import React from "react";
import "./Table.css";
function EtudiantsTable({ etudiants, onEdit, onDelete, filterBy = ['Tous les champs'] }) {
  const showField = (field) => Array.isArray(filterBy) ? (filterBy.includes('Tous les champs') || filterBy.includes(field)) : (filterBy === 'Tous les champs' || filterBy === field);

  return (
<table className="table"> 
<thead>

<tr>
<th>🆔ID</th>
{showField('CIN') && <th>🪪CIN</th>}
{filterBy === 'Tous les champs' && <th>🛂 Passport</th>}
{showField('Nationalité') && <th>🌍 Nationalité</th>}
{showField('Nom') && <th>👤Nom</th>}
{showField('Prénom') && <th>👤Prénom</th>}
{showField('Email') && <th>📧Email</th>}
{showField('Téléphone') && <th>📞Téléphone</th>}
{filterBy === 'Tous les champs' && <th>🎂Naissance</th>}
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
          <tr key={e.idEtudiant}>
            <td>{e.idEtudiant ?? '-'}</td>
            {showField('CIN') && <td>{e.cin || '-'}</td>}
            {filterBy === 'Tous les champs' && <td>{e.passport || '-'}</td>}
            {showField('Nationalité') && <td>{e.nationalite || '-'}</td>}
            {showField('Nom') && <td>{e.nom || '-'}</td>}
            {showField('Prénom') && <td>{e.prenom || '-'}</td>}
            {showField('Email') && <td>{e.email || '-'}</td>}
            {showField('Téléphone') && <td>{e.numTel || '-'}</td>}
            {filterBy === 'Tous les champs' && <td>{e.dateNaissance || '-'}</td>}
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