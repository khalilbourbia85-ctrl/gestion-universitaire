import React, { useState, useEffect } from 'react';
import axios from 'axios';

function GestionSallesModal({ onClose, onSallesChange }) {
  const [salles, setSalles] = useState([]);
  const [newSalleNom, setNewSalleNom] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSalles = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/salles/');
      setSalles(res.data);
    } catch (err) {
      setErrorMessage('Erreur lors du chargement des salles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalles();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newSalleNom.trim()) return;

    try {
      await axios.post('/api/salles/', { nom: newSalleNom.trim() });
      setNewSalleNom('');
      setSuccessMessage('Salle ajoutée avec succès.');
      setErrorMessage('');
      fetchSalles();
      onSallesChange();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.response?.data?.nom?.[0] || 'Erreur lors de l\'ajout de la salle.');
      setSuccessMessage('');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette salle ?')) return;
    
    try {
      await axios.delete(`/api/salles/${id}/`);
      setSuccessMessage('Salle supprimée avec succès.');
      setErrorMessage('');
      fetchSalles();
      onSallesChange();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage('Erreur lors de la suppression de la salle.');
      setSuccessMessage('');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <h3>Gérer les salles de soutenance</h3>
        
        {errorMessage && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{errorMessage}</div>}
        {successMessage && <div className="success-message" style={{ color: 'green', marginBottom: '10px' }}>{successMessage}</div>}

        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="Nom de la nouvelle salle..." 
            value={newSalleNom}
            onChange={(e) => setNewSalleNom(e.target.value)}
            style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button type="submit" className="btn" style={{ padding: '8px 16px' }}>Ajouter</button>
        </form>

        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
          {loading ? (
            <p style={{ padding: '10px', textAlign: 'center' }}>Chargement...</p>
          ) : salles.length === 0 ? (
            <p style={{ padding: '10px', textAlign: 'center' }}>Aucune salle enregistrée.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {salles.map(salle => (
                <li key={salle.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', borderBottom: '1px solid #e2e8f0' }}>
                  <span>{salle.nom}</span>
                  <button 
                    onClick={() => handleDelete(salle.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="buttons-area" style={{ marginTop: '20px' }}>
          <button type="button" className="btn import-btn" onClick={onClose} style={{ width: '100%' }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export default GestionSallesModal;
