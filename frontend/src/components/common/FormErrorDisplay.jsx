import React from 'react';
import './FormErrorDisplay.css';

/**
 * Composant uniforme pour afficher les erreurs de formulaire
 * - Affiche les erreurs à l'intérieur du formulaire
 * - Positionné juste après le titre
 * - Support pour erreurs simples et liste d'erreurs
 */
function FormErrorDisplay({ errors, message, type = 'error' }) {
  // Si pas d'erreurs, ne rien afficher
  if (!errors && !message) {
    return null;
  }

  // Cas 1: Erreur simple (string)
  if (typeof errors === 'string') {
    return (
      <div className={`form-error-display ${type}`}>
        <div className="error-icon">⚠️</div>
        <div className="error-content">
          <p>{errors}</p>
        </div>
      </div>
    );
  }

  // Cas 2: Message simple
  if (message) {
    return (
      <div className={`form-error-display ${type}`}>
        <div className="error-icon">⚠️</div>
        <div className="error-content">
          <p>{message}</p>
        </div>
      </div>
    );
  }

  // Cas 3: Objet d'erreurs (champs spécifiques)
  if (typeof errors === 'object' && Object.keys(errors).length > 0) {
    const errorsList = Object.entries(errors).map(([field, msg]) => ({
      field,
      msg: Array.isArray(msg) ? msg[0] : msg
    }));

    return (
      <div className={`form-error-display ${type}`}>
        <div className="error-icon">⚠️</div>
        <div className="error-content">
          {errorsList.length === 1 ? (
            <p>{errorsList[0].msg}</p>
          ) : (
            <>
              <p className="error-title">Erreurs détectées :</p>
              <ul className="error-list">
                {errorsList.map((error, index) => (
                  <li key={index}>
                    <strong>{error.field}:</strong> {error.msg}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export default FormErrorDisplay;
