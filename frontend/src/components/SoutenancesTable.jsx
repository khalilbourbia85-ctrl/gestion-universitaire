import React, { useState } from 'react';
import './Table.css';
import DetailsModal from './DetailsModal';

function formatHeureApi(h) {
  if (h == null || h === '') return '—';
  const s = String(h).trim();
  return s.length >= 5 ? s.slice(0, 5) : s;
}

function SoutenancesTable({ soutenances, onEdit, onDelete, filterBy = ['Tous les champs'] }) {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSoutenance, setSelectedSoutenance] = useState(null);
  
  const safeSoutenances = Array.isArray(soutenances) ? soutenances : [];
  const showField = (field) => Array.isArray(filterBy) ? (filterBy.includes('Tous les champs') || filterBy.includes(field)) : (filterBy === 'Tous les champs' || filterBy === field);

  return (
    <>
    <div className="table-wrapper">
    <table className="table">
      <thead>
        <tr>
          <th>ID</th>
          {showField('Type') && <th>Type</th>}
          {showField('Date') && <th>Date</th>}
          {showField('Heure') && <th>Heure</th>}
          {filterBy.includes('Tous les champs') && <th>Durée (min)</th>}
          {showField('Salle') && <th>Salle</th>}
          {showField('Encadrant') && <th>Encadrant</th>}
          {showField('Type contrat (enc.)') && <th>Type contrat (enc.)</th>}
          {showField('Rapporteur') && <th>Rapporteur</th>}
          {showField('Type contrat (rap.)') && <th>Type contrat (rap.)</th>}
          {filterBy.includes('Tous les champs') && <th>Étudiants</th>}
          {filterBy.includes('Tous les champs') && <th>Rés. Tech.</th>}
          {filterBy.includes('Tous les champs') && <th>Rés. Fin.</th>}
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {safeSoutenances.length === 0 ? (
          <tr>
            <td colSpan="11">Aucune soutenance disponible.</td>
          </tr>
        ) : (
          safeSoutenances.map((soutenance) => (
            <tr key={soutenance.idSoutenance}>
              <td>{soutenance.idSoutenance}</td>
              {showField('Type') && <td>{soutenance.type_soutenance === 'technique' ? 'Technique' : 'Finale'}</td>}
              {showField('Date') && <td>{new Date(soutenance.date_soutenance).toLocaleDateString('fr-FR')}</td>}
              {showField('Heure') && <td>{formatHeureApi(soutenance.heure_soutenance)}</td>}
              {filterBy.includes('Tous les champs') && <td>{soutenance.duree ? soutenance.duree : '—'}</td>}
              {showField('Salle') && <td>{soutenance.salle}</td>}
              {showField('Encadrant') && <td>
                {soutenance.encadrant_detail
                  ? `${soutenance.encadrant_detail.nom} ${soutenance.encadrant_detail.prenom}`
                  : soutenance.encadrant}
              </td>}
              {showField('Type contrat (enc.)') && <td>{soutenance.encadrant_detail?.typeContrat || '—'}</td>}
              {showField('Rapporteur') && <td>
                {soutenance.rapporteur_detail
                  ? `${soutenance.rapporteur_detail.nom} ${soutenance.rapporteur_detail.prenom}`
                  : soutenance.rapporteur}
              </td>}
              {showField('Type contrat (rap.)') && <td>{soutenance.rapporteur_detail?.typeContrat || '—'}</td>}
              {filterBy.includes('Tous les champs') && <td>
                {soutenance.etudiants_detail && soutenance.etudiants_detail.length > 0
                  ? soutenance.etudiants_detail.map((e) => `${e.nom_fr} ${e.prenom_fr}`).join(', ')
                  : soutenance.etudiants.join(', ')}
              </td>}
              {filterBy.includes('Tous les champs') && <td>{soutenance.resultat_technique || '—'}</td>}
              {filterBy.includes('Tous les champs') && <td>{soutenance.resultat_finale || '—'}</td>}
              <td>
                <span
                  className="view-icon"
                  onClick={() => {
                    setSelectedSoutenance(soutenance);
                    setShowDetailsModal(true);
                  }}
                  title="Voir les détails"
                >
                  👁️
                </span>
                <span className="icon edit-icon" onClick={() => onEdit(soutenance)}>
                  ✏️
                </span>
                <span className="icon delete-icon" onClick={() => onDelete(soutenance.idSoutenance)}>
                  🗑️
                </span>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
    </div>
    <DetailsModal
      isOpen={showDetailsModal}
      onClose={() => {
        setShowDetailsModal(false);
        setSelectedSoutenance(null);
      }}
      title={selectedSoutenance ? `Détails Soutenance #${selectedSoutenance.idSoutenance}` : 'Détails'}
      details={selectedSoutenance ? {
        'ID': selectedSoutenance.idSoutenance,
        'Type': selectedSoutenance.type_soutenance === 'technique' ? 'Technique' : 'Finale',
        'Date': new Date(selectedSoutenance.date_soutenance).toLocaleDateString('fr-FR'),
        'Heure': formatHeureApi(selectedSoutenance.heure_soutenance),
        'Durée (min)': selectedSoutenance.duree || '—',
        'Salle': selectedSoutenance.salle,
        'Encadrant': selectedSoutenance.encadrant_detail ? `${selectedSoutenance.encadrant_detail.nom} ${selectedSoutenance.encadrant_detail.prenom}` : selectedSoutenance.encadrant,
        'Type contrat (enc.)': selectedSoutenance.encadrant_detail?.typeContrat || '—',
        'Rapporteur': selectedSoutenance.rapporteur_detail ? `${selectedSoutenance.rapporteur_detail.nom} ${selectedSoutenance.rapporteur_detail.prenom}` : selectedSoutenance.rapporteur,
        'Type contrat (rap.)': selectedSoutenance.rapporteur_detail?.typeContrat || '—',
        'Étudiants': selectedSoutenance.etudiants_detail && selectedSoutenance.etudiants_detail.length > 0 ? selectedSoutenance.etudiants_detail.map((e) => `${e.nom_fr} ${e.prenom_fr}`).join(', ') : selectedSoutenance.etudiants?.join(', ') || 'Aucun',
        'Résultat Technique': selectedSoutenance.resultat_technique || '—',
        'Résultat Finale': selectedSoutenance.resultat_finale || '—',
        'Dépôt Électronique': selectedSoutenance.depot_electronique,
        'Dépôt Papier': selectedSoutenance.depot_papier,
      } : {}}
    />
    </>
  );
}

export default SoutenancesTable;
