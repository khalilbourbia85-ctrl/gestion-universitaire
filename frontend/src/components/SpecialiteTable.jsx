import React from 'react';
import './Table.css';

const SpecialiteTable = ({ specialites, onEdit, onDelete, filterBy = ['Tous les champs'] }) => {
  const showField = (field) => Array.isArray(filterBy) ? (filterBy.includes('Tous les champs') || filterBy.includes(field)) : (filterBy === 'Tous les champs' || filterBy === field);
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {showField('Nom') && <th>Nom</th>}
            {showField('Code') && <th>Code</th>}
            {showField('Licence') && <th>Licence</th>}
            {showField('Département') && <th>Département</th>}
            {filterBy.includes('Tous les champs') && <th>Description</th>}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {specialites.length === 0 ? (
            <tr>
              <td colSpan="6" className="no-data">
                Aucune spécialité trouvée
              </td>
            </tr>
          ) : (
            specialites.map((specialite) => (
              <tr key={specialite.id}>
                {showField('Nom') && <td>{specialite.nom}</td>}
                {showField('Code') && <td>{specialite.code}</td>}
                {showField('Licence') && <td>{specialite.licence_nom}</td>}
                {showField('Département') && <td>{specialite.departement_nom}</td>}
                {filterBy.includes('Tous les champs') && <td>
                  {specialite.description ?
                    (specialite.description.length > 50 ?
                      `${specialite.description.substring(0, 50)}...` :
                      specialite.description
                    ) :
                    '-'
                  }
                </td>}
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-edit"
                      onClick={() => onEdit(specialite)}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => onDelete(specialite.id)}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SpecialiteTable;