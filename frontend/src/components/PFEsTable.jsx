import React from 'react';
import './Table.css';

function PFEsTable({
  pfes,
  onEdit,
  onDelete,
  onRandomAssign,
  enseignants,
  encadrantGroupCount,
  getEncadrantMaxGroupes,
  disableActions = false,
}) {
  const safePFEs = Array.isArray(pfes) ? pfes : [];

  const maxFor = (matricule) => (getEncadrantMaxGroupes ? getEncadrantMaxGroupes(matricule) : 5);

  const getAvailableEncadrantCount = () => {
    if (!enseignants) return 0;
    return enseignants.filter((e) => {
      const mk = String(e.matricule ?? '').trim();
      const count = mk ? encadrantGroupCount?.[mk] || 0 : 0;
      return count < maxFor(e.matricule);
    }).length;
  };

  const canAssignRandom = getAvailableEncadrantCount() > 0;

  const renderStudents = (item) => {
    if (!Array.isArray(item?.etudiants_detail) || item.etudiants_detail.length === 0) {
      return <span style={{ color: '#64748b', fontStyle: 'italic' }}>Aucun étudiant assigné</span>;
    }

    return (
      <div style={{ maxWidth: '200px' }}>
        {item.etudiants_detail.map((etudiant, index) => (
          <div key={etudiant.idEtudiant} style={{
            marginBottom: index < item.etudiants_detail.length - 1 ? '4px' : '0',
            padding: '4px 8px',
            backgroundColor: '#f8fafc',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            fontSize: '13px'
          }}>
            <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
              {etudiant.nom} {etudiant.prenom}
            </div>
            <div style={{ color: '#64748b', fontSize: '11px' }}>
              CIN: {etudiant.cin} • {etudiant.email}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <table className="table">
      <thead>
        <tr>
          <th style={{ width: '60px' }}>ID PFE</th>
          <th style={{ width: '25%' }}>Sujet</th>
          <th style={{ width: '100px' }}>Durée (en mois)</th>
          <th style={{ width: '15%' }}>Lieu de stage</th>
          <th style={{ width: '15%' }}>Spécialité</th>
          <th style={{ width: '25%' }}>Étudiants</th>
          <th style={{ width: '15%' }}>Encadrant</th>
          <th style={{ width: '12%' }}>Type contrat (enc.)</th>
          <th style={{ width: '150px' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {safePFEs.map((pfe, index) => (
          <tr key={pfe?.idPfe ?? `pfe-${index}`}>
            <td>{pfe?.idPfe ?? '-'}</td>
            <td>{pfe?.sujet ?? '-'}</td>
            <td>{pfe?.duree ? `${pfe.duree} mois` : '-'}</td>
            <td>{pfe?.lieu_stage ?? '-'}</td>
            <td>{pfe?.specialite ?? '-'}</td>
            <td>{renderStudents(pfe)}</td>
            <td>{pfe?.encadrant_detail ? `${pfe.encadrant_detail.nom} ${pfe.encadrant_detail.prenom}` : '-'}</td>
            <td>{pfe?.encadrant_detail?.typeContrat || '—'}</td>
            <td>
              {!disableActions ? (
                <>
                  <button className="action-button edit-icon" type="button" onClick={() => onEdit(pfe)}>
                    Modifier
                  </button>
                  <button className="action-button delete-icon" type="button" onClick={() => onDelete(pfe.idPfe)}>
                    Supprimer
                  </button>
                  {onRandomAssign && (
                    <button 
                      className="action-button" 
                      type="button" 
                      onClick={() => onRandomAssign(pfe)} 
                      disabled={!canAssignRandom}
                      title={
                        canAssignRandom
                          ? 'Affecter aléatoirement un encadrant'
                          : 'Aucun encadrant disponible (plafonds de groupes atteints)'
                      } 
                      style={{ 
                        backgroundColor: canAssignRandom ? '#8b5cf6' : '#d1d5db', 
                        color: 'white', 
                        padding: '6px 10px', 
                        marginLeft: '4px', 
                        borderRadius: '4px', 
                        border: 'none', 
                        cursor: canAssignRandom ? 'pointer' : 'not-allowed',
                        fontSize: '12px',
                        opacity: canAssignRandom ? 1 : 0.6
                      }}
                    >
                      🎲 Aléa
                    </button>
                  )}
                </>
              ) : (
                <span style={{ color: '#475569', fontSize: '13px' }}>Aucune action sur données provisoires</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default PFEsTable;
