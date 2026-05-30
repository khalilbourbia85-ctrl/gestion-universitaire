import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./layout/Layout";
import ErrorBoundary from "./components/ErrorBoundary";

import GestionEtudiants from "./pages/GestionEtudiants";
import GestionEnseignants from "./pages/GestionEnseignants";
import GestionPFEs from "./pages/GestionPFEs";
import GestionEncadrants from "./pages/GestionEncadrants";
import GestionRapporteurs from "./pages/GestionRapporteurs";
import GestionSoutenances from "./pages/GestionSoutenances";
import GestionDepartements from "./pages/GestionDepartements";
import GestionLicences from "./pages/GestionLicences";
import GestionAffectationsAcademiques from "./pages/GestionAffectationsAcademiques";
import GestionModules from "./pages/GestionModules";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ChatAssistant from "./components/ChatAssistant";
import { useState, useEffect } from "react";
import axiosInstance from "./utils/axiosConfig";

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [role, setRole] = useState(() => localStorage.getItem("role"));

  useEffect(() => {
    // Listen for storage changes from other tabs/windows
    const handleStorageChange = () => {
      const newToken = localStorage.getItem("token");
      const newRole = localStorage.getItem("role");
      setToken(newToken);
      setRole(newRole);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogin = (newToken, newRole) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("role", newRole);
    setToken(newToken);
    setRole(newRole);
  };

  // Add interceptor to catch 401 and auto logout
  useEffect(() => {
    const interceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          console.warn('Token invalide ou expiré, déconnexion...');
          localStorage.clear();
          setToken(null);
          setRole(null);
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

return (
  <ErrorBoundary>
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      
      {token ? (
        <Route element={<Layout role={role}><ChatAssistant /></Layout>}>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/etudiants" element={<GestionEtudiants />} />
          <Route path="/enseignants" element={<GestionEnseignants />} />
          <Route path="/pfes" element={<GestionPFEs />} />
          <Route path="/encadrants" element={<GestionEncadrants />} />
          <Route path="/rapporteurs" element={<GestionRapporteurs />} />
          <Route path="/soutenances" element={<GestionSoutenances />} />
          <Route path="/departements" element={<GestionDepartements />} />
          <Route path="/licences" element={<GestionLicences />} />
          <Route path="/affectations" element={<GestionAffectationsAcademiques />} />
          <Route path="/modules" element={<GestionModules />} />
        </Route>
      ) : null}
      
      <Route path="/" element={<Navigate to="/login" />} />
      {/* Catch-all: redirect unauthenticated users to login, authenticated to dashboard */}
      <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
    </Routes>
  </ErrorBoundary>
);

}

export default App;