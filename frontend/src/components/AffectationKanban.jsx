import React, { useState, useRef, useEffect } from 'react';
import './AffectationKanban.css';

const AffectationKanban = ({
  pfes,
  enseignants,
  onAssign,
  getEncadrantMaxGroupes,
  getEncadrantGroupCount,
}) => {
  const [draggedPfeId, setDraggedPfeId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // On veut scroller la board horizontale, pas le container principal
  const kanbanBoardRef = useRef(null);

  useEffect(() => {
    if (kanbanBoardRef.current) {
      kanbanBoardRef.current.scrollLeft = 0;
      // Patch pour garantir le scroll après le rendu
      setTimeout(() => {
        if (kanbanBoardRef.current) kanbanBoardRef.current.scrollLeft = 0;
      }, 50);
    }
  }, []);

  const handleDragStart = (e, pfeId) => {
    setDraggedPfeId(pfeId);
    e.dataTransfer.effectAllowed = 'move';
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
        className="kanban-pfe-card"
      >
        <div className="kanban-pfe-id">
          {pfe.idPfe}
        </div>

        <div className="kanban-pfe-subject">
          {pfe.sujet?.length > 50
            ? pfe.sujet.substring(0, 50) + '...'
            : pfe.sujet}
        </div>

        <div className="kanban-pfe-students">
          {etudiantsText || 'Aucun étudiant lié'}
        </div>
      </div>
    );
  };

  const term = searchTerm.toLowerCase().trim();

  const pfeMatches = (p) => {
    if (!term) return true;

    const matchId = String(p.idPfe || '')
      .toLowerCase()
      .includes(term);

    const matchSujet = String(p.sujet || '')
      .toLowerCase()
      .includes(term);

    const matchEtudiants = (p.etudiants_detail || []).some((e) => {
      const full1 = `${e.nom || ''} ${e.prenom || ''}`.toLowerCase();
      const full2 = `${e.prenom || ''} ${e.nom || ''}`.toLowerCase();

      return full1.includes(term) || full2.includes(term);
    });

    return matchId || matchSujet || matchEtudiants;
  };

  const filteredUnassignedPfes = pfes.filter(
    p => !p.encadrant && pfeMatches(p)
  );

  const filteredEnseignants = enseignants.filter(ens => {
    if (!term) return true;

    const full1 =
      `${ens.nom || ''} ${ens.prenom || ''}`.toLowerCase();

    const full2 =
      `${ens.prenom || ''} ${ens.nom || ''}`.toLowerCase();

    const matchName =
      full1.includes(term) || full2.includes(term);

    const matchMatricule = String(ens.matricule || '')
      .toLowerCase()
      .includes(term);

    if (matchName || matchMatricule) return true;

    const assignedPfes = pfes.filter(
      p => p.encadrant === ens.matricule
    );

    return assignedPfes.some(pfeMatches);
  });

  const encadrantCount = getEncadrantGroupCount();

  return (
    <div className="kanban-container">

      {/* Barre de recherche */}
      <div className="kanban-search-bar">
        <input
          type="text"
          placeholder="Rechercher PFE, étudiant, enseignant..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="kanban-search-input"
        />
      </div>

      {/* Kanban Board */}
      <div
        className="kanban-board"
        ref={kanbanBoardRef}
      >

        {/* PFE Non Affectés */}
        <div
          className="kanban-column kanban-column--unassigned"
          onDragOver={(e) => handleDragOver(e, null)}
          onDrop={(e) => handleDrop(e, null)}
        >
          <div className="kanban-column-header">
            <h4 className="kanban-column-title">
              Non affectés (
              {pfes.filter(p => !p.encadrant).length}
              )
            </h4>
          </div>

          <div className="kanban-column-content">
            {filteredUnassignedPfes.map((pfe) =>
              renderPfeCard(pfe)
            )}

            {filteredUnassignedPfes.length === 0 && (
              <div className="kanban-empty-state">
                Aucun PFE trouvé
              </div>
            )}
          </div>
        </div>

        {/* Colonnes Enseignants */}
        {filteredEnseignants.map(ens => {
          const matricule = ens.matricule || ens.id;

          const max =
            getEncadrantMaxGroupes(matricule);

          const actifs =
            encadrantCount[matricule] || 0;

          const assignedPfes = pfes.filter(
            p =>
              p.encadrant === matricule &&
              pfeMatches(p)
          );

          const plafondAtteint = actifs >= max;

          return (
            <div
              key={matricule}
              className={`kanban-column ${
                plafondAtteint
                  ? 'kanban-column--full'
                  : ''
              }`}
              onDragOver={(e) => {
                if (!plafondAtteint)
                  handleDragOver(e, matricule);
              }}
              onDrop={(e) => {
                if (!plafondAtteint)
                  handleDrop(e, matricule);
              }}
            >
              <div className="kanban-column-header">
                <h4 className="kanban-column-title">
                  {ens.nom} {ens.prenom}
                </h4>

                <div className="kanban-column-info">
                  <span className="kanban-column-matricule">
                    {matricule}
                  </span>

                  <span
                    className={`kanban-column-count ${
                      plafondAtteint
                        ? 'kanban-column-count--full'
                        : 'kanban-column-count--available'
                    }`}
                  >
                    {actifs} / {max}
                  </span>
                </div>
              </div>

              <div className="kanban-column-content">
                {assignedPfes.map((pfe) =>
                  renderPfeCard(pfe)
                )}

                {assignedPfes.length === 0 && (
                  <div className="kanban-empty-state">
                    Glissez un PFE ici
                  </div>
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