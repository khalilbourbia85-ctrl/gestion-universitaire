import React, { useState } from "react";
import "./Table.css";
import DetailsModal from './DetailsModal';

function EnseignantsTable({ enseignants, onEdit, onDelete, filterBy = ['Tous les champs'], selectedEnseignants = new Set(), onToggleSelect, pfes = [] }) {
const [showDetailsModal, setShowDetailsModal] = useState(false);
const [selectedEnseignant, setSelectedEnseignant] = useState(null);

const showField = (field) => Array.isArray(filterBy) ? (filterBy.includes('Tous les champs') || filterBy.includes(field)) : (filterBy === 'Tous les champs' || filterBy === field);

// Compter les PFEs encadrés par un enseignant
const getEncadredPfeCount = (matricule) => {
  return pfes.filter(pfe => pfe.encadrant === matricule || pfe.encadrant_id === matricule).length;
};

// Vérifier si suppression possible
const canDelete = (matricule) => {
  return getEncadredPfeCount(matricule) === 0;
};

return(

<>
<div className="table-wrapper">
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
  {filterBy === 'Tous les champs' && <th>📚 PFEs encadrés</th>}
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
{filterBy === 'Tous les champs' && (
  <td style={{ 
    fontWeight: 'bold', 
    color: getEncadredPfeCount(e.matricule) > 0 ? '#d97706' : '#10b981'
  }}>
    {getEncadredPfeCount(e.matricule)} 📚
  </td>
)}

<td>
  <span
    className="view-icon"
    onClick={() => {
      setSelectedEnseignant(e);
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
    onClick={() => canDelete(e.matricule) ? onDelete(e.matricule) : null}
    style={{
      opacity: canDelete(e.matricule) ? 1 : 0.4,
      cursor: canDelete(e.matricule) ? 'pointer' : 'not-allowed'
    }}
    title={canDelete(e.matricule) ? 'Supprimer' : `Cet enseignant encadre ${getEncadredPfeCount(e.matricule)} PFE(s)`}
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
    setSelectedEnseignant(null);
  }}
  title={selectedEnseignant ? `Détails - ${selectedEnseignant.nom} ${selectedEnseignant.prenom}` : 'Détails'}
  details={selectedEnseignant ? {
    'Matricule': selectedEnseignant.matricule,
    'CIN': selectedEnseignant.cin,
    'Nom': selectedEnseignant.nom,
    'Prénom': selectedEnseignant.prenom,
    'Email': selectedEnseignant.email,
    'Téléphone': selectedEnseignant.numTel,
    'Grade': selectedEnseignant.grade,
    'Date Recrutement': selectedEnseignant.dateRecrutement,
    'Type Contrat': selectedEnseignant.typeContrat,
    'Statut Administratif': selectedEnseignant.statutAdministratif,
    'Diplôme': selectedEnseignant.diplome?.libelleDiplome,
    'PFEs Encadrés': getEncadredPfeCount(selectedEnseignant.matricule),
  } : {}}
/>
</>
);

}

export default EnseignantsTable;