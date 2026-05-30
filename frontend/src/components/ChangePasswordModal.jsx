import React, { useState } from 'react';

// Axios configuré (avec token automatiquement)
import axios from "../utils/axiosConfig";

// CSS du modal
import './ChangePasswordModal.css';

export default function ChangePasswordModal({ onClose }) {

  // =========================
  // États du formulaire
  // =========================

  const [oldPassword, setOldPassword] = useState(''); // ancien mot de passe
  const [newPassword, setNewPassword] = useState(''); // nouveau mot de passe
  const [confirmPassword, setConfirmPassword] = useState(''); // confirmation

  // Messages UI
  const [message, setMessage] = useState(''); // succès
  const [error, setError] = useState(''); // erreur

  // =========================
  // Fonction de soumission
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault(); // empêcher reload de la page

    // Vérification côté frontend
    if (newPassword !== confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    try {
      // Appel API vers backend Django
      const res = await axios.post('change-password/', {
        old_password: oldPassword,
        new_password: newPassword
      });

      // Message de succès reçu du backend
      setMessage(res.data.message);
      setError('');

      // Fermeture automatique du modal après 1.5s
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      // Gestion des erreurs backend
      setError(
        err.response?.data?.error ||
        'Erreur lors de la modification du mot de passe.'
      );

      setMessage('');
    }
  };

  // =========================
  // Interface utilisateur
  // =========================
  return (
    <div className="modal-overlay">

      <div className="modal-content change-password-modal">

        {/* Titre */}
        <h3>Changer le mot de passe</h3>

        {/* Messages */}
        {message && <p className="success-msg">{message}</p>}
        {error && <p className="error-msg">{error}</p>}

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>

          {/* Ancien mot de passe */}
          <div className="form-group">
            <label>Ancien mot de passe</label>
            <input
              type="password"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              required
            />
          </div>

          {/* Nouveau mot de passe */}
          <div className="form-group">
            <label>Nouveau mot de passe</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
          </div>

          {/* Confirmation mot de passe */}
          <div className="form-group">
            <label>Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* Boutons d'action */}
          <div className="modal-actions">

            {/* Annuler */}
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
            >
              Annuler
            </button>

            {/* Valider */}
            <button
              type="submit"
              className="btn-save"
            >
              Enregistrer
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}