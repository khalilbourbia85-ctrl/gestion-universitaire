import React from "react";
import "./Table.css";

function EnseignantsTable({ enseignants, onEdit, onDelete, filterBy = ['Tous les champs'], selectedEnseignants = new Set(), onToggleSelect }) {

const showField = (field) => Array.isArray(filterBy) ? (filterBy.includes('Tous les champs') || filterBy.includes(field)) : (filterBy === 'Tous les champs' || filterBy === field);

return(

<table className="table">

<thead>

<tr>
  <th style={{ width: '40px', textAlign: 'center' }}>
    <input
      type="checkbox"
      checked={enseignants.length > 0 && Array.from(selectedEnseignants).length === enseignants.length}
      onChange={() => {
        if (onToggleSelect) {
          const allSelected = enseignants.length > 0 && Array.from(selectedEnseignants).length === enseignants.length;
          enseignants.forEach(e => {
            const isCurrentlySelected = selectedEnseignants.has(e.matricule);
            if (allSelected && isCurrentlySelected) {
              // Désélectionner tous
              onToggleSelect(e.matricule);
            } else if (!allSelected && !isCurrentlySelected) {
              // Sélectionner tous
              onToggleSelect(e.matricule);
            }
          });
        }
      }}
      style={{ cursor: 'pointer' }}
    />
  </th>
  <th>🆔 Matricule</th>
  {showField('CIN') && <th>📝 CIN</th>}
  {showField('Nom') && <th>👤 Nom</th>}
  {showField('Prénom') && <th>🧑‍🎓 Prénom</th>}
  {showField('Email') && <th>📧 Email</th>}
  {showField('Grade') && <th>🎖️ Grade</th>}
  {showField('Téléphone') && <th>📱 Téléphone</th>}
  {filterBy === 'Tous les champs' && <th>📅 Date recrutement</th>}
  {filterBy === 'Tous les champs' && <th>📄 Type contrat</th>}
  {filterBy === 'Tous les champs' && <th>⚙️ Statut Administratif</th>}
  {filterBy === 'Tous les champs' && <th>🎓 Diplôme</th>}
  <th>⚙️ Actions</th>
</tr>

</thead>

<tbody>

{enseignants.map((e)=>(
<tr key={e.matricule} style={{ backgroundColor: selectedEnseignants.has(e.matricule) ? '#e3f2fd' : 'white' }}>
  <td style={{ width: '40px', textAlign: 'center' }}>
    <input
      type="checkbox"
      checked={selectedEnseignants.has(e.matricule)}
      onChange={() => onToggleSelect && onToggleSelect(e.matricule)}
      style={{ cursor: 'pointer' }}
    />
  </td>
  <td>{e.matricule}</td>
{showField('CIN') && <td>{e.cin}</td>}
{showField('Nom') && <td>{e.nom}</td>}
{showField('Prénom') && <td>{e.prenom}</td>}
{showField('Email') && <td>{e.email}</td>}
{showField('Grade') && <td>{e.grade}</td>}
{showField('Téléphone') && <td>{e.numTel}</td>}
{filterBy === 'Tous les champs' && <td>{e.dateRecrutement}</td>}
{filterBy === 'Tous les champs' && <td>{e.typeContrat}</td>}
{filterBy === 'Tous les champs' && <td>{e.statutAdministratif}</td>}
{filterBy === 'Tous les champs' && <td>{e.diplome?.libelleDiplome}</td>}

<td>
  <span
    className="icon edit-icon"
    onClick={() => onEdit(e)}
  >
    ✏️
  </span>
  <span
    className="icon delete-icon"
    onClick={() => onDelete(e.matricule)}
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

export default EnseignantsTable;