import React from 'react';
import './Table.css';
import { FaEdit, FaTrash } from 'react-icons/fa';

const LicenceTable = ({ licences, onEdit, onDelete, filterBy = ['Tous les champs'] }) => {
  const showField = (field) => Array.isArray(filterBy) ? (filterBy.includes('Tous les champs') || filterBy.includes(field)) : (filterBy === 'Tous les champs' || filterBy === field);

  return (
    <table className="table">
      <thead>
        <tr>
          <th>ID</th>
          {showField('Mention') && <th>Mention</th>}
          {showField('Domaine') && <th>Domaine</th>}
          {showField('Spécialité') && <th>Spécialité</th>}
          {showField('Département') && <th>Département</th>}
          {filterBy.includes('Tous les champs') && <th>Durée</th>}
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {licences && licences.length > 0 ? (
          licences.map(lic => (
            <tr key={lic.id}>
              <td>{lic.id}</td>
              {showField('Mention') && <td>{lic.nom}</td>}
              {showField('Domaine') && <td>{lic.domaine}</td>}
              {showField('Spécialité') && <td>{lic.specialite}</td>}
              {showField('Département') && <td>{lic.departement_nom}</td>}
              {filterBy.includes('Tous les champs') && <td>{lic.duree}</td>}
              <td className="actions">
                <button
                  className="btn-icon edit"
                  onClick={() => onEdit(lic)}
                  title="Modifier"
                >
                  <FaEdit />
                </button>
                <button
                  className="btn-icon delete"
                  onClick={() => {
                    if (window.confirm('Êtes-vous sûr?')) {
                      onDelete(lic.id);
                    }
                  }}
                  title="Supprimer"
                >
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="7" className="empty">Aucune licence trouvée</td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default LicenceTable;
