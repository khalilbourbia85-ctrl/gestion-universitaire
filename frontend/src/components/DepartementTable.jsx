import React from 'react';
import './Table.css';
import { FaEdit, FaTrash, FaUserCircle } from 'react-icons/fa';

const DepartementTable = ({ departements, onEdit, onDelete, onViewProfile }) => {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nom</th>
          <th>Code</th>
          <th>Responsable</th>
          <th>Email</th>
          <th>Téléphone</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {departements && departements.length > 0 ? (
          departements.map(dept => (
            <tr key={dept.id}>
              <td>{dept.id}</td>
              <td>{dept.nom}</td>
              <td>{dept.code}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {dept.photo ? (
                    <img 
                      src={dept.photo} 
                      alt="Profil" 
                      style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '1px solid #cbd5e1' }}
                      onClick={() => onViewProfile && onViewProfile(dept)}
                      title="Voir le profil du département"
                    />
                  ) : (
                    <FaUserCircle 
                      size={24} 
                      style={{ cursor: 'pointer', color: '#cbd5e1' }} 
                      onClick={() => onViewProfile && onViewProfile(dept)}
                      title="Voir le profil du département"
                    />
                  )}
                  {dept.responsable || '-'}
                </div>
              </td>
              <td>{dept.email || '-'}</td>
              <td>{dept.telephone || '-'}</td>
              <td className="actions">
                <button
                  className="btn-icon edit"
                  onClick={() => onEdit(dept)}
                  title="Modifier"
                >
                  <FaEdit />
                </button>
                <button
                  className="btn-icon delete"
                  onClick={() => {
                    if (window.confirm('Êtes-vous sûr?')) {
                      onDelete(dept.id);
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
            <td colSpan="7" className="empty">Aucun département trouvé</td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default DepartementTable;
