import React from 'react';
import './Table.css';

function RapporteursTable({ rapporteurs, onEdit, onDelete, filterBy = ['Tous les champs'] }) {
  const safeRapporteurs = Array.isArray(rapporteurs) ? rapporteurs : [];
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
          {filterBy.includes('Tous les champs') && <th style={{ whiteSpace: 'nowrap' }}>Groupes encadrés</th>}
          {filterBy.includes('Tous les champs') && <th style={{ whiteSpace: 'nowrap' }}>Soutenances rapporteur</th>}
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {safeRapporteurs.length === 0 ? (
          <tr>
            <td colSpan="10">Aucun rapporteur disponible.</td>
          </tr>
        ) : (
          safeRapporteurs.map((rapporteur) => {
            const nEnc = Number(rapporteur.nbGroupesEncadres);
            const nRap = Number(rapporteur.nbGroupesRapporteur);
            const encOk = Number.isFinite(nEnc) ? nEnc : 0;
            const rapOk = Number.isFinite(nRap) ? nRap : 0;
            const equilibre = encOk === rapOk;
            return (
            <tr
              key={rapporteur.matricule}
              title={
                equilibre
                  ? undefined
                  : 'À équilibrer : viser le même nombre de groupes encadrés et de soutenances comme rapporteur'
              }
              style={
                equilibre
                  ? undefined
                  : { backgroundColor: '#e2e8f0', color: '#475569' }
              }
            >
              <td>{rapporteur.matricule}</td>
              {showField('Nom') && <td>{rapporteur.nom}</td>}
              {showField('Prénom') && <td>{rapporteur.prenom}</td>}
              {showField('Email') && <td>{rapporteur.email}</td>}
              {filterBy.includes('Tous les champs') && <td>{rapporteur.numtel || ''}</td>}
              {showField('Grade') && <td>{rapporteur.grade}</td>}
              {showField('Type contrat') && <td>{rapporteur.typeContrat || '—'}</td>}
              {filterBy.includes('Tous les champs') && <td style={{ fontWeight: 600, textAlign: 'center' }}>{encOk}</td>}
              {filterBy.includes('Tous les champs') && <td style={{ fontWeight: 600, textAlign: 'center' }}>{rapOk}</td>}
              <td>
                <span className="icon edit-icon" onClick={() => onEdit(rapporteur)}>
                  ✏️
                </span>
                {!rapporteur.syncedFromEnseignant && (
                  <span className="icon delete-icon" onClick={() => onDelete(rapporteur.matricule)}>
                    🗑️
                  </span>
                )}
              </td>
            </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

export default RapporteursTable;
