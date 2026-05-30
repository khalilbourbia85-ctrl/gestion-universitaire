import "./NavbarTop.css";
import { useEffect, useState } from "react";
import axios from "../utils/axiosConfig";
import { FaUserCircle } from "react-icons/fa";
import ChangePasswordModal from "../components/ChangePasswordModal";
import ChefProfileModal from "../components/ChefProfileModal";

function NavbarTop({ role }) {
  const [darkMode, setDarkMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [deptPhoto, setDeptPhoto] = useState(null);

  const fetchProfilePhoto = async () => {
    if (role === 'chef_departement') {
      try {
        const res = await axios.get('departements/');
        if (res.data && res.data.length > 0 && res.data[0].photo) {
          setDeptPhoto(res.data[0].photo);
        } else {
          setDeptPhoto(null);
        }
      } catch (e) {
        console.error("Erreur de chargement photo navbar", e);
      }
    }
  };
  // role is now received as a prop from App.jsx -> Layout.jsx

  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode === "true") {
      document.body.classList.add("dark-mode");
      setDarkMode(true);
    }
    fetchProfilePhoto();
  }, [role]);

  const toggleDarkMode = () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("darkMode", isDark);
    setDarkMode(isDark);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="navbar-top">
      <div className="navbar-left">
        <h3 className="navbar-logo">🎓 UniManage</h3>
      </div>

      <div className="navbar-actions">
        <span className="user" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {role === 'admin' ? 'Administrateur' : 'Chef de Dép.'}
          {role === 'chef_departement' && (
            deptPhoto ? (
              <img 
                src={deptPhoto} 
                alt="Profil" 
                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '1px solid #cbd5e1' }}
                onClick={() => setShowProfileModal(true)}
                title="Voir le profil du département"
              />
            ) : (
              <FaUserCircle 
                size={26} 
                style={{ cursor: 'pointer', color: '#cbd5e1' }} 
                onClick={() => setShowProfileModal(true)}
                title="Voir le profil du département"
              />
            )
          )}
        </span>

        <button className="dark-btn" onClick={() => setShowPasswordModal(true)} title="Changer le mot de passe" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px' }}>
          🔑
        </button>

        <button className="dark-btn" onClick={toggleDarkMode} title="Mode Sombre">
          {darkMode ? "☀️" : "🌙"}
        </button>

        <button onClick={handleLogout} className="logout-btn">
          Déconnexion
        </button>
      </div>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}

      {showProfileModal && (
        <ChefProfileModal 
          onClose={() => setShowProfileModal(false)} 
          onUpdate={fetchProfilePhoto}
        />
      )}
    </div>
  );
}

export default NavbarTop;