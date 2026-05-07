import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { FaProjectDiagram, FaUserTie, FaFileAlt, FaCalendarAlt } from 'react-icons/fa';
import './Dashboard.css';

const COLORS = ['#ec4899', '#8b5cf6', '#14b8a6', '#f59e0b'];

export default function DashboardPFE() {
  const [stats, setStats] = useState({
    pfes: 0,
    encadrants: 0,
    rapporteurs: 0,
    soutenances: 0
  });

  const [chartData, setChartData] = useState({
    specialites: [],
    salles: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [pfes, encadrants, rapporteurs, soutenances] = await Promise.all([
          axios.get('/api/pfes/'),
          axios.get('/api/enseignants/'),
          axios.get('/api/rapporteurs/'),
          axios.get('/api/soutenances/')
        ]);

        const pfesData = Array.isArray(pfes.data) ? pfes.data : [];
        const soutenancesData = Array.isArray(soutenances.data) ? soutenances.data : [];

        setStats({
          pfes: pfesData.length,
          encadrants: Array.isArray(encadrants.data) ? encadrants.data.length : 0,
          rapporteurs: Array.isArray(rapporteurs.data) ? rapporteurs.data.length : 0,
          soutenances: soutenancesData.length
        });

        // 1. Répartition des PFEs par spécialité
        const specCount = {};
        pfesData.forEach(pfe => {
          const spec = pfe.specialite || 'Non spécifiée';
          specCount[spec] = (specCount[spec] || 0) + 1;
        });
        const specialitesData = Object.keys(specCount).map(key => ({
          name: key,
          value: specCount[key]
        }));

        // 2. Répartition des soutenances par salle
        const salleCount = {};
        soutenancesData.forEach(sout => {
          const salle = sout.salle || 'Non définie';
          salleCount[salle] = (salleCount[salle] || 0) + 1;
        });
        const sallesData = Object.keys(salleCount).map(key => ({
          name: key,
          value: salleCount[key]
        }));

        setChartData({
          specialites: specialitesData,
          salles: sallesData
        });

      } catch (err) {
        console.error("Erreur lors du chargement des statistiques PFE", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="dashboard-container">
      <h2>Tableau de Bord - PFE</h2>
      
      {loading ? (
        <div className="loading-spinner">Chargement des données...</div>
      ) : (
        <>
          <div className="kpi-cards">
            <div className="kpi-card pfes">
              <div className="kpi-icon"><FaProjectDiagram /></div>
              <div className="kpi-content">
                <h3>PFEs</h3>
                <p className="kpi-value">{stats.pfes}</p>
              </div>
            </div>
            
            <div className="kpi-card encadrants">
              <div className="kpi-icon"><FaUserTie /></div>
              <div className="kpi-content">
                <h3>Encadrants</h3>
                <p className="kpi-value">{stats.encadrants}</p>
              </div>
            </div>

            <div className="kpi-card rapporteurs">
              <div className="kpi-icon"><FaFileAlt /></div>
              <div className="kpi-content">
                <h3>Rapporteurs</h3>
                <p className="kpi-value">{stats.rapporteurs}</p>
              </div>
            </div>

            <div className="kpi-card soutenances">
              <div className="kpi-icon"><FaCalendarAlt /></div>
              <div className="kpi-content">
                <h3>Soutenances</h3>
                <p className="kpi-value">{stats.soutenances}</p>
              </div>
            </div>
          </div>

          <div className="charts-section">
            <div className="chart-card">
              <h3>Répartition des Soutenances par Salle</h3>
              <div className="chart-wrapper">
                {chartData.salles.length > 0 ? (
                  <div style={{ width: '100%', overflowX: 'auto' }}>
                    <BarChart width={500} height={300} data={chartData.salles}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {chartData.salles.map((entry, index) => (
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
              <h3>PFEs par Spécialité</h3>
              <div className="chart-wrapper">
                {chartData.specialites.length > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <PieChart width={400} height={300}>
                      <Pie
                        data={chartData.specialites}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {chartData.specialites.map((entry, index) => (
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
