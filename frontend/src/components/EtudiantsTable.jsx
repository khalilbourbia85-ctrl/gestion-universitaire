import React from "react";
import "./Table.css";
function EtudiantsTable({ etudiants, onEdit, onDelete }) {
  return (
<table className="table"> 
<thead>

<tr>
<th>🆔ID</th>
<th>🪪CIN</th>
<th>🛂 Passport</th>
<th>🌍 Nationalité</th>
<th>👤Nom</th>
<th>👤Prénom</th>
<th>📧Email</th>
<th>📞Téléphone</th>
<th>🎂Naissance</th>
<th>🏠Adresse</th>
<th>🎓Licence</th>
<th>📚Spécialité</th>
<th>👥Groupe</th>
<th>📊Situation</th>
<th>⚙️Actions</th>
</tr>

</thead>
      <tbody>
        {etudiants.map((e) => (
          <tr key={e.idEtudiant}>
            <td>{e.idEtudiant ?? '-'}</td>
            <td>{e.cin || '-'}</td>
            <td>{e.passport || '-'}</td>
            <td>{e.nationalite || '-'}</td>
            <td>{e.nom || '-'}</td>
            <td>{e.prenom || '-'}</td>
            <td>{e.email || '-'}</td>
            <td>{e.numTel || '-'}</td>
            <td>{e.dateNaissance || '-'}</td>
            <td>{e.adresse || '-'}</td>
            <td>{e.licence_detail ? `${e.licence_detail.nom} (${e.licence_detail.code})` : '—'}</td>
            <td>{e.specialite_detail ? `${e.specialite_detail.nom} (${e.specialite_detail.code})` : '—'}</td>
            <td>{e.groupe || '-'}</td>
            <td>{e.situation === 'N' ? 'Nouveau' : e.situation === 'R' ? 'Redoublant' : '-'}</td>

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