import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './DetailsModal.css';

function DetailsModal({ isOpen, onClose, title, details }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="details-modal-overlay" onClick={onClose}>
      <div className="details-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="details-modal-header">
          <h2>{title}</h2>
          <button type="button" className="details-modal-close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>
        <div className="details-modal-body">
          {details && Object.entries(details).map(([key, value]) => {
            if (value === null || value === undefined || value === '') return null;

            let displayValue = value;
            if (Array.isArray(value)) {
              displayValue = value.join(', ');
            } else if (typeof value === 'object') {
              displayValue = JSON.stringify(value, null, 2);
            } else if (typeof value === 'boolean') {
              displayValue = value ? '✓ Oui' : '✗ Non';
            }

            return (
              <div key={key} className="details-row">
                <span className="details-label">{key}</span>
                <span className="details-value">{displayValue}</span>
              </div>
            );
          })}
        </div>
        <div className="details-modal-footer">
          <button type="button" className="details-modal-btn-close" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default DetailsModal;
