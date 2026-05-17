import React, { useState } from 'react';
import axios from 'axios';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api-token-auth/', { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      axios.defaults.headers.common['Authorization'] = `Token ${res.data.token}`;
      setSuccess('Connexion réussie ! Bienvenue...');
      setError('');
      
      setTimeout(() => {
        onLogin(res.data.token, res.data.role);
      }, 1200);
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setError('Identifiants incorrects');
      } else {
        const details = err.response ? err.response.status : err.message;
        setError(`Erreur de connexion au serveur (${details})`);
      }
      setSuccess('');
    }
  };

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
      <form onSubmit={handleLogin} style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '15px', 
        padding: '40px', 
        backgroundColor: 'rgba(255, 255, 255, 0.85)', 
        borderRadius: '12px', 
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)', 
        width: '320px',
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img src="/logo-isgs.png" alt="ISG Sousse" style={{ height: '110px', width: 'auto', marginBottom: '10px' }} />
          <h2 style={{ margin: 0, fontSize: '28px', color: '#333' }}>🎓 UniManage</h2>
        </div>
        {error && <p style={{ color: 'red', textAlign: 'center', margin: 0 }}>{error}</p>}
        {success && <p style={{ color: 'green', textAlign: 'center', margin: 0, fontWeight: 'bold' }}>{success}</p>}
        <input 
          placeholder="Nom d'utilisateur" 
          value={username} 
          onChange={e => setUsername(e.target.value)} 
          required 
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input 
          type="password" 
          placeholder="Mot de passe" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '10px', backgroundColor: '#1890ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Se connecter
        </button>
      </form>
    </div>
  );
}
