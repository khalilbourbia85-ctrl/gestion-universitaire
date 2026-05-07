import React from 'react';
import './Table.css';
import { FaEdit, FaTrash } from 'react-icons/fa';

const LicenceTable = ({ licences, onEdit, onDelete }) => {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Mention</th>
          <th>Domaine</th>
          <th>Parcours</th>
          <th>Département</th>
          <th>Durée</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {licences && licences.length > 0 ? (
          licences.map(lic => (
            <tr key={lic.id}>
              <td>{lic.id}</td>
              <td>{lic.nom}</td>
              <td>{lic.domaine}</td>
              <td>{lic.parcours}</td>
              <td>{lic.departement_nom}</td>
              <td>{lic.duree}</td>
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
