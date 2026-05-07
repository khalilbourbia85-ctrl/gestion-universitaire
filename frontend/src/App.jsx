import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

import Layout from "./layout/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DashboardPFE from "./pages/DashboardPFE";

import GestionEtudiants from "./pages/GestionEtudiants";
import GestionEnseignants from "./pages/GestionEnseignants";
import GestionPFEs from "./pages/GestionPFEs";
import GestionEncadrants from "./pages/GestionEncadrants";
import GestionRapporteurs from "./pages/GestionRapporteurs";
import GestionSoutenances from "./pages/GestionSoutenances";
import GestionDepartements from "./pages/GestionDepartements";
import GestionLicences from "./pages/GestionLicences";
import GestionModules from "./pages/GestionModules";

function App() {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
    }
  }, [token]);

  if (!token) {
    return <Login onLogin={(token, role) => { setToken(token); setRole(role); }} />;
  }

return (

<Layout role={role}>



<Routes>

<Route path="/" element={<Navigate to="/dashboard" />} />
<Route path="/dashboard" element={<Dashboard />} />
<Route path="/dashboard-pfe" element={<DashboardPFE />} />


<Route path="/etudiants" element={<GestionEtudiants />} />

<Route path="/enseignants" element={<GestionEnseignants />} />

<Route path="/pfes" element={<GestionPFEs />} />

<Route path="/encadrants" element={<GestionEncadrants />} />

<Route path="/rapporteurs" element={<GestionRapporteurs />} />

<Route path="/soutenances" element={<GestionSoutenances />} />

{role === 'admin' && <Route path="/departements" element={<GestionDepartements role={role} />} />}

<Route path="/licences" element={<GestionLicences />} />

<Route path="/modules" element={<GestionModules />} />

</Routes>

</Layout>

);

}

export default App;