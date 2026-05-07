import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaUserTie, FaTimes, FaEdit, FaSave } from 'react-icons/fa';
import './ChefProfileModal.css';

const ChefProfileModal = ({ onClose, onUpdate, departementId }) => {
  const [departement, setDepartement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const fileInputRef = useRef(null);

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    const fetchDept = async () => {
      try {
        let dept = null;
        if (departementId) {
          const response = await axios.get(`/api/departements/${departementId}/`);
          dept = response.data;
        } else {
          const response = await axios.get('/api/departements/');
          if (response.data && response.data.length > 0) {
            dept = response.data[0];
          }
        }
        
        if (dept) {
          setDepartement(dept);
          setFormData({
            responsable: dept.responsable || '',
            telephone: dept.telephone || '',
            email: dept.email || ''
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDept();
  }, [departementId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = new FormData();
      data.append('responsable', formData.responsable);
      data.append('telephone', formData.telephone);
      data.append('email', formData.email);
      if (photoFile) {
        data.append('photo', photoFile);
      }

      const response = await axios.patch(`/api/departements/${departement.id}/`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setDepartement(response.data);
      setIsEditing(false);
      setPhotoFile(null);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Erreur lors de la mise à jour', error);
      alert('Erreur lors de la mise à jour du profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="profile-close-btn" onClick={onClose}>
          <FaTimes />
        </button>

        {loading ? (
          <p>Chargement...</p>
        ) : !departement ? (
          <p style={{ color: '#ef4444' }}>Aucun département associé.</p>
        ) : (
          <div className="profile-card">
            <div className="profile-header-actions">
              <h2 className="profile-dept-name">{departement.nom}</h2>
              {!isEditing ? (
                <button className="profile-action-btn edit-btn" onClick={() => setIsEditing(true)} title="Modifier mes informations">
                  <FaEdit />
                </button>
              ) : (
                <button className="profile-action-btn save-btn" onClick={handleSave} disabled={saving} title="Sauvegarder">
                  <FaSave />
                </button>
              )}
            </div>
            <div className="profile-avatar-container" style={{ position: 'relative' }}>
              {photoFile ? (
                <img src={URL.createObjectURL(photoFile)} alt="Preview" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : departement.photo ? (
                <img src={departement.photo} alt="Profil" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <FaUserTie size={70} color="#1f2937" />
              )}
              
              {isEditing && (
                <div 
                  style={{ position: 'absolute', bottom: '0px', right: '0px', background: '#3b82f6', borderRadius: '50%', padding: '6px', cursor: 'pointer', color: 'white', display: 'flex', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                  onClick={() => fileInputRef.current?.click()}
                  title="Changer la photo"
                >
                  <FaEdit size={14} />
                </div>
              )}
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handlePhotoChange} accept="image/*" />
            </div>

            <div className="profile-info">
              {isEditing ? (
                <div className="profile-edit-form">
                  <div className="form-group">
                    <label>Chef de département :</label>
                    <input type="text" name="responsable" value={formData.responsable} onChange={handleChange} className="profile-input" placeholder="Nom du responsable" />
                  </div>
                  <div className="form-group">
                    <label>Téléphone :</label>
                    <input type="text" name="telephone" value={formData.telephone} onChange={handleChange} className="profile-input" placeholder="Numéro de téléphone" />
                  </div>
                  <div className="form-group">
                    <label>Email :</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="profile-input" placeholder="Email" />
                  </div>
                </div>
              ) : (
                <>
                  <p>
                    <strong>Chef de département : </strong> 
                    {departement.responsable || 'Non défini'}
                  </p>
                  <p>
                    <strong>Téléphone : </strong> 
                    {departement.telephone || 'Non défini'}
                  </p>
                  <p>
                    <strong>Email : </strong> 
                    {departement.email || 'Non défini'}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChefProfileModal;
