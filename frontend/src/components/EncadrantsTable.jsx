import React from 'react';
import './Table.css';

function EncadrantsTable({ enseignants, onEdit, onDelete, encadrantAuPlafondPfe, filterBy = ['Tous les champs'] }) {
  const safeEnseignants = Array.isArray(enseignants) ? enseignants : [];
  const showField = (field) => Array.isArray(filterBy) ? (filterBy.includes('Tous les champs') || filterBy.includes(field)) : (filterBy === 'Tous les champs' || filterBy === field);

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Matricule</th>
          {showField('Nom') && <th>Nom</th>}
          {showField('Prénom') && <th>Prénom</th>}
          {showField('Email') && <th>Email</th>}
          {filterBy.includes('Tous les champs') && <th>Téléphone</th>}
          {showField('Grade') && <th>Grade</th>}
          {showField('Type contrat') && <th>Type contrat</th>}
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {safeEnseignants.length === 0 ? (
          <tr>
            <td colSpan="8">Aucun encadrant disponible.</td>
          </tr>
        ) : (
          safeEnseignants.map((enseignant, index) => {
            const auPlafond =
              typeof encadrantAuPlafondPfe === 'function' && encadrantAuPlafondPfe(enseignant);
            return (
            <tr
              key={enseignant.matricule != null && String(enseignant.matricule) !== '' ? enseignant.matricule : `row-${index}`}
              title={auPlafond ? 'Plafond de groupes PFE atteint' : undefined}
              style={
                auPlafond
                  ? {
                      backgroundColor: '#e2e8f0',
                      color: '#475569',
                    }
                  : undefined
              }
            >
              <td>{enseignant.matricule}</td>
              {showField('Nom') && <td>{enseignant.nom}</td>}
              {showField('Prénom') && <td>{enseignant.prenom}</td>}
              {showField('Email') && <td>{enseignant.email}</td>}
              {filterBy.includes('Tous les champs') && <td>{enseignant.numtel || ''}</td>}
              {showField('Grade') && <td>{enseignant.grade}</td>}
              {showField('Type contrat') && <td>{enseignant.typeContrat || '—'}</td>}
              <td>
                <span className="icon edit-icon" onClick={() => onEdit(enseignant)}>
                  ✏️
                </span>
                <span className="icon delete-icon" onClick={() => onDelete(enseignant.matricule)}>
                  🗑️
                </span>
              </td>
            </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

export default EncadrantsTable;
