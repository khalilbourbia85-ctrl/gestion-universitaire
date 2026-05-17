import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./layout/Layout";

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
import axios from "axios";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));

  const handleLogin = (newToken, newRole) => {
    setToken(newToken);
    setRole(newRole);
  };

  // Add interceptor to catch 401 and auto logout
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          localStorage.clear();
          setToken(null);
          setRole(null);
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

return (

<Layout role={role}>

<Routes>

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

</Routes>

<ChatAssistant />
</Layout>

);

}

export default App;