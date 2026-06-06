import React, { useState } from 'react';
import { authAxios, axiosInstance } from '../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';

export default function Login({ onLogin }) {

  // États pour stocker les valeurs du formulaire
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // États pour afficher les messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Hook pour la navigation (redirection)
  const navigate = useNavigate();

  // ================================
  // Fonction de connexion (LOGIN)
  // ================================
  const handleLogin = async (e) => {
    e.preventDefault(); // Empêcher le rechargement de la page

    try {
      // Envoi des identifiants au backend Django
      const res = await authAxios.post('/api-token-auth/', {
        username,
        password
      });

      // Stocker le token dans le navigateur
      localStorage.setItem('token', res.data.token);

      // Stocker le rôle de l'utilisateur
      localStorage.setItem('role', res.data.role);

      // Ajouter automatiquement le token dans les requêtes Axios
      axiosInstance.defaults.headers.common['Authorization'] =
        `Token ${res.data.token}`;

      // Message de succès
      setSuccess('Connexion réussie ! Bienvenue...');
      setError('');

      // Redirection vers le dashboard après un petit délai
      setTimeout(() => {
        onLogin(res.data.token, res.data.role);
        navigate('/dashboard');
      }, 1200);

    } catch (err) {

      // Gestion des erreurs de connexion
      if (err.response && err.response.status === 400) {
        setError('Identifiants incorrects');
      } else {
        const details = err.response
          ? err.response.status
          : err.message;

        setError(`Erreur de connexion au serveur (${details})`);
      }

      setSuccess('');
    }
  };

  // ================================
  // Interface utilisateur (UI)
  // ================================
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f4f6f8',
      backgroundImage: 'url(/bg-isg.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>

      {/* Formulaire de connexion */}
      <form
        onSubmit={handleLogin}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          padding: '40px',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          width: '320px',
          backdropFilter: 'blur(8px)'
        }}
      >

        {/* Logo et titre */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img
            src="/logo-isgs.png"
            alt="ISG Sousse"
            style={{ height: '110px', marginBottom: '10px' }}
          />
          <h2 style={{ margin: 0, fontSize: '28px', color: '#333' }}>
            🎓 UniManage
          </h2>
        </div>

        {/* Messages d'erreur ou succès */}
        {error && (
          <p style={{ color: 'red', textAlign: 'center' }}>
            {error}
          </p>
        )}

        {success && (
          <p style={{
            color: 'green',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            {success}
          </p>
        )}

        {/* Champ username */}
        <input
          placeholder="Nom d'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />

        {/* Champ password */}
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />

        {/* Bouton de connexion */}
        <button
          type="submit"
          style={{
            padding: '10px',
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Se connecter
        </button>

      </form>
    </div>
  );
} 
         
