import React from "react";
import "./Table.css";

function EnseignantsTable({ enseignants,onEdit,onDelete, filterBy = ['Tous les champs'] }) {

const showField = (field) => Array.isArray(filterBy) ? (filterBy.includes('Tous les champs') || filterBy.includes(field)) : (filterBy === 'Tous les champs' || filterBy === field);

return(

<table className="table">

<thead>

<tr>
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
<tr key={e.matricule}>

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