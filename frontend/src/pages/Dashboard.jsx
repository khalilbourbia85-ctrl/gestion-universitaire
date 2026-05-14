import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { FaUserGraduate, FaChalkboardTeacher, FaUniversity, FaBook, FaPencilAlt, FaUsers } from 'react-icons/fa';
import './Dashboard.css';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b'];

export default function Dashboard() {
  const [stats, setStats] = useState({
    etudiants: 0,
    enseignants: 0,
    departements: 0,
    licences: 0,
    modules: 0,
    classes: 0
  });

  const [chartData, setChartData] = useState({
    etudiantsParLicence: [],
    enseignantsParContrat: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [etudiants, enseignants, departements, licences, modules] = await Promise.all([
          axios.get('/api/etudiants/'),
          axios.get('/api/enseignants/'),
          axios.get('/api/departements/'),
          axios.get('/api/licences/'),
          axios.get('/api/modules/')
        ]);

        const etudiantsData = Array.isArray(etudiants.data) ? etudiants.data : [];
        const enseignantsData = Array.isArray(enseignants.data) ? enseignants.data : [];

        const classesSet = new Set();
        etudiantsData.forEach(e => {
          if (e.groupe && e.groupe.trim() !== '') {
            classesSet.add(e.groupe.trim().toLowerCase());
          }
        });

        setStats({
          etudiants: etudiantsData.length,
          enseignants: enseignantsData.length,
          departements: Array.isArray(departements.data) ? departements.data.length : 0,
          licences: Array.isArray(licences.data) ? licences.data.length : 0,
          modules: Array.isArray(modules.data) ? modules.data.length : 0,
          classes: classesSet.size
        });

        // 1. Etudiants par Licence
        const etuLicenceCount = {};
        etudiantsData.forEach(e => {
          const licence = e.licence_detail ? e.licence_detail.nom : 'Non assignée';
          etuLicenceCount[licence] = (etuLicenceCount[licence] || 0) + 1;
        });
        const etuLicenceData = Object.keys(etuLicenceCount).map(key => ({
          name: key,
          value: etuLicenceCount[key]
        }));

        // 2. Enseignants par Contrat
        const ensContratCount = {};
        enseignantsData.forEach(e => {
          const contrat = e.typeContrat || 'Non défini';
          ensContratCount[contrat] = (ensContratCount[contrat] || 0) + 1;
        });
        const ensContratData = Object.keys(ensContratCount).map(key => ({
          name: key,
          value: ensContratCount[key]
        }));

        setChartData({
          etudiantsParLicence: etuLicenceData,
          enseignantsParContrat: ensContratData
        });

      } catch (err) {
        console.error("Erreur lors du chargement des statistiques", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="dashboard-container">
      <h2>Tableau de Bord Global</h2>
      
      {loading ? (
        <div className="loading-spinner">Chargement des données...</div>
      ) : (
        <>
          <div className="kpi-cards">
            <div className="kpi-card etudiants">
              <div className="kpi-icon"><FaUserGraduate /></div>
              <div className="kpi-content">
                <h3>Étudiants</h3>
                <p className="kpi-value">{stats.etudiants}</p>
              </div>
            </div>
            
            <div className="kpi-card enseignants">
              <div className="kpi-icon"><FaChalkboardTeacher /></div>
              <div className="kpi-content">
                <h3>Enseignants</h3>
                <p className="kpi-value">{stats.enseignants}</p>
              </div>
            </div>

            <div className="kpi-card departements">
              <div className="kpi-icon"><FaUniversity /></div>
              <div className="kpi-content">
                <h3>Départements</h3>
                <p className="kpi-value">{stats.departements}</p>
              </div>
            </div>

            <div className="kpi-card licences">
              <div className="kpi-icon"><FaBook /></div>
              <div className="kpi-content">
                <h3>Licences</h3>
                <p className="kpi-value">{stats.licences}</p>
              </div>
            </div>
            
            <div className="kpi-card modules">
              <div className="kpi-icon"><FaPencilAlt /></div>
              <div className="kpi-content">
                <h3>Modules</h3>
                <p className="kpi-value">{stats.modules}</p>
              </div>
            </div>

            <div className="kpi-card classes">
              <div className="kpi-icon"><FaUsers /></div>
              <div className="kpi-content">
                <h3>Classes</h3>
                <p className="kpi-value">{stats.classes}</p>
              </div>
            </div>
          </div>

          <div className="charts-section">
            <div className="chart-card">
              <h3>Étudiants par Licence</h3>
              <div className="chart-wrapper">
                {chartData.etudiantsParLicence.length > 0 ? (
                  <div style={{ width: '100%', overflowX: 'auto' }}>
                    <BarChart width={500} height={300} data={chartData.etudiantsParLicence}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {chartData.etudiantsParLicence.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280' }}>
                    Aucune donnée disponible
                  </div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <h3>Enseignants par Type de Contrat</h3>
              <div className="chart-wrapper">
                {chartData.enseignantsParContrat.length > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <PieChart width={400} height={300}>
                      <Pie
                        data={chartData.enseignantsParContrat}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {chartData.enseignantsParContrat.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} />
                    </PieChart>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280' }}>
                    Aucune donnée disponible
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
