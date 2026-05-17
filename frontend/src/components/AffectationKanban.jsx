import React, { useState } from 'react';

const AffectationKanban = ({
  pfes,
  enseignants,
  onAssign,
  getEncadrantMaxGroupes,
  getEncadrantGroupCount,
}) => {
  const [draggedPfeId, setDraggedPfeId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDragStart = (e, pfeId) => {
    setDraggedPfeId(pfeId);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox requires some data to be set
    e.dataTransfer.setData('text/plain', pfeId);
  };

  const handleDragOver = (e, matricule) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, matricule) => {
    e.preventDefault();
    if (draggedPfeId !== null) {
      onAssign(draggedPfeId, matricule);
    }
    setDraggedPfeId(null);
  };

  const renderPfeCard = (pfe) => {
    const etudiantsText = (pfe.etudiants_detail || [])
      .map(e => `${e.nom} ${e.prenom}`)
      .join(' & ');

    return (
      <div
        key={pfe.idPfe}
        draggable
        onDragStart={(e) => handleDragStart(e, pfe.idPfe)}
        style={{
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '10px',
          marginBottom: '8px',
          cursor: 'grab',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          fontSize: '13px'
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#1e293b' }}>
          PFE #{pfe.idPfe}
        </div>
        <div style={{ color: '#475569', marginBottom: '4px' }}>
          {pfe.sujet?.length > 40 ? pfe.sujet.substring(0, 40) + '...' : pfe.sujet}
        </div>
        <div style={{ color: '#64748b', fontStyle: 'italic', fontSize: '12px' }}>
          {etudiantsText || 'Aucun étudiant lié'}
        </div>
      </div>
    );
  };

  const term = searchTerm.toLowerCase().trim();

  // Helper to check if a PFE matches search
  const pfeMatches = (p) => {
    if (!term) return true;
    const matchId = String(p.idPfe || '').toLowerCase().includes(term);
    const matchSujet = String(p.sujet || '').toLowerCase().includes(term);
    const matchEtudiants = (p.etudiants_detail || []).some(
      (e) => String(e.nom || '').toLowerCase().includes(term) || String(e.prenom || '').toLowerCase().includes(term)
    );
    return matchId || matchSujet || matchEtudiants;
  };

  // Filter PFEs that match search
  const filteredUnassignedPfes = pfes.filter(p => !p.encadrant && pfeMatches(p));
  
  // Filter Enseignants
  // An enseignant is shown if their name/matricule matches OR if they have at least one assigned PFE that matches
  const filteredEnseignants = enseignants.filter(ens => {
    if (!term) return true;
    const matchNom = String(ens.nom || '').toLowerCase().includes(term);
    const matchPrenom = String(ens.prenom || '').toLowerCase().includes(term);
    const matchMatricule = String(ens.matricule || '').toLowerCase().includes(term);
    
    if (matchNom || matchPrenom || matchMatricule) return true;
    
    // Check if any of their assigned PFEs match the search
    const assignedPfes = pfes.filter(p => p.encadrant === ens.matricule);
    return assignedPfes.some(pfeMatches);
  });

  const encadrantCount = getEncadrantGroupCount();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {/* Barre de recherche Kanban */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 20px' }}>
        <input
          type="text"
          placeholder="Rechercher PFE, étudiant, enseignant..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            width: '350px',
            fontSize: '14px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px', minHeight: '500px', padding: '0 20px' }}>
      
      {/* Colonne des PFE non affectés */}
      <div
        style={{
          minWidth: '280px',
          maxWidth: '280px',
          backgroundColor: '#f1f5f9',
          borderRadius: '8px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column'
        }}
        onDragOver={(e) => handleDragOver(e, null)}
        onDrop={(e) => handleDrop(e, null)} // Permettre de désassigner
      >
        <h4 style={{ margin: '0 0 12px 0', color: '#334155', borderBottom: '2px solid #cbd5e1', paddingBottom: '8px' }}>
          Non affectés ({pfes.filter(p => !p.encadrant).length})
        </h4>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredUnassignedPfes.map(renderPfeCard)}
          {filteredUnassignedPfes.length === 0 && (
            <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '20px' }}>Aucun PFE trouvé</div>
          )}
        </div>
      </div>

      {/* Colonnes par enseignant */}
      {filteredEnseignants.map(ens => {
        const matricule = ens.matricule || ens.id;
        const max = getEncadrantMaxGroupes(matricule);
        const actifs = encadrantCount[matricule] || 0;
        const assignedPfes = pfes.filter(p => p.encadrant === matricule && pfeMatches(p));
        const plafondAtteint = actifs >= max;

        return (
          <div
            key={matricule}
            style={{
              minWidth: '280px',
              maxWidth: '280px',
              backgroundColor: plafondAtteint ? '#fef2f2' : '#f8fafc',
              border: plafondAtteint ? '1px solid #fca5a5' : '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column'
            }}
            onDragOver={(e) => {
              if (!plafondAtteint) handleDragOver(e, matricule);
            }}
            onDrop={(e) => {
              if (!plafondAtteint) handleDrop(e, matricule);
            }}
          >
            <div style={{ borderBottom: '2px solid #cbd5e1', paddingBottom: '8px', marginBottom: '12px' }}>
              <h4 style={{ margin: '0 0 4px 0', color: '#0f172a' }}>
                {ens.nom} {ens.prenom}
              </h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: '#64748b' }}>{matricule}</span>
                <span style={{ 
                  fontWeight: 'bold', 
                  color: plafondAtteint ? '#ef4444' : '#10b981',
                  backgroundColor: plafondAtteint ? '#fee2e2' : '#d1fae5',
                  padding: '2px 6px',
                  borderRadius: '10px'
                }}>
                  {actifs} / {max}
                </span>
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {assignedPfes.map(renderPfeCard)}
              {assignedPfes.length === 0 && (
                <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '20px' }}>Glissez un PFE ici</div>
              )}
            </div>
          </div>
        );
      })}

    </div>
    </div>
  );
};

export default AffectationKanban;
