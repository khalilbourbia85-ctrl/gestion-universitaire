  import React, { useState, useEffect } from 'react';
  import axios from "../utils/axiosConfig";
  import {
    PieChart, Pie, Cell, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    ResponsiveContainer, LineChart, Line
  } from 'recharts';
  import './GestionEtudiants.css'; // On réutilise les styles pour les cartes
  import './Dashboard.css';

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff7300'];

  const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
      const fetchStats = async () => {
        try {
          const response = await axios.get('dashboard/stats/');
          setStats(response.data);
        } catch (err) {
          console.error(err);
          setError('Erreur lors du chargement des statistiques.');
        } finally {
          setLoading(false);
        }
      };
      fetchStats();
    }, []);

    if (loading) return <div style={{ padding: '20px' }}>Chargement du tableau de bord...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!stats) return null;

    // Formatting data for charts
    const monomeBinomeData = [
      { name: 'Monôme', value: stats.pct_monome },
      { name: 'Binôme', value: stats.pct_binome }
    ];

    const reussiteTechniqueData = [
      { name: 'Validé', value: stats.soutenances_validees },
      { name: 'Non validé', value: stats.soutenances_non_validees }
    ];

    const reussiteFinaleData = [
      { name: 'Validé', value: stats.soutenances_finale_validees },
      { name: 'Non validé', value: stats.soutenances_finale_non_validees }
    ];

    const reussiteGenreData = [
      { name: 'Hommes', taux: Math.round(stats.taux_reussite_hommes) },
      { name: 'Femmes', taux: Math.round(stats.taux_reussite_femmes) }
    ];

    const depStatsData = stats.stats_departements.map(d => ({
      name: d.departement,
      taux: Math.round(d.taux_reussite),
      total: d.total
    }));

    const lieuxStageData = stats.lieux_stage.map(l => ({
      name: l.lieu_stage,
      etudiants: l.count
    }));

    return (
      <div className="gestion-container" style={{ padding: '20px' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '28px', color: '#1e293b' }}>Tableau de Bord Global</h2>
        
        {/* KPI Cards */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <div className="kpi-card" style={{ flex: '1', minWidth: '200px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '500', opacity: 0.9 }}>Dépôt PFE</h3>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{Math.round(stats.pourcentage_depot)}%</div>
            <div style={{ fontSize: '14px', marginTop: '5px', opacity: 0.8 }}>{stats.etudiants_ayant_depose} sur {stats.total_etudiants} étudiants</div>
          </div>
          
          <div className="kpi-card" style={{ flex: '1', minWidth: '200px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '500', opacity: 0.9 }}>Réussite PFE Technique</h3>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{Math.round(stats.taux_reussite_technique)}%</div>
            <div style={{ fontSize: '14px', marginTop: '5px', opacity: 0.8 }}>Soutenances techniques validées</div>
          </div>

          <div className="kpi-card" style={{ flex: '1', minWidth: '200px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '500', opacity: 0.9 }}>Réussite PFE Final</h3>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{Math.round(stats.taux_reussite_finale)}%</div>
            <div style={{ fontSize: '14px', marginTop: '5px', opacity: 0.8 }}>Soutenances finales validées</div>
          </div>

          <div className="kpi-card" style={{ flex: '1', minWidth: '200px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '500', opacity: 0.9 }}>Département Performant</h3>
            <div style={{ fontSize: '24px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {depStatsData.length > 0 ? depStatsData[0].name : 'N/A'}
            </div>
            <div style={{ fontSize: '14px', marginTop: '5px', opacity: 0.8 }}>
              {depStatsData.length > 0 ? `${depStatsData[0].taux}% de réussite` : '-'}
            </div>
          </div>
        </div>

        {/* Sections des Graphiques */}
        <div className="dashboard-sections">

          {/* Section 1 : Performances des Soutenances */}
          <div>
            <h3 className="section-title">
              📊 Performances des Soutenances
            </h3>
            <div className="charts-section">
              {/* Réussite Technique */}
              <div className="table-card" style={{ padding: '20px', background: 'white', borderRadius: '12px' }}>
                <h3 style={{ marginBottom: '15px', color: '#334155' }}>Réussite PFE Technique</h3>
                <div style={{ width: '100%', height: '300px', display: 'block', overflow: 'hidden' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reussiteTechniqueData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Réussite Finale */}
              <div className="table-card" style={{ padding: '20px', background: 'white', borderRadius: '12px' }}>
                <h3 style={{ marginBottom: '15px', color: '#334155' }}>Réussite PFE Final</h3>
                <div style={{ width: '100%', height: '300px', display: 'block', overflow: 'hidden' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reussiteFinaleData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#f43f5e" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 : Analyse Démographique et Structurelle */}
          <div>
            <h3 className="section-title">
              👥 Analyse Démographique & Logistique
            </h3>
            <div className="charts-section">
              {/* Taux de réussite par genre */}
              <div className="table-card" style={{ padding: '20px', background: 'white', borderRadius: '12px' }}>
                <h3 style={{ marginBottom: '15px', color: '#334155' }}>Réussite Globale par Genre (%)</h3>
                <div style={{ width: '100%', height: '300px', display: 'block', overflow: 'hidden' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reussiteGenreData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip cursor={{fill: '#f1f5f9'}} />
                      <Bar dataKey="taux" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={50} name="Taux de Réussite (%)">
                        {reussiteGenreData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#ec4899'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monôme vs Binôme */}
              <div className="table-card" style={{ padding: '20px', background: 'white', borderRadius: '12px' }}>
                <h3 style={{ marginBottom: '15px', color: '#334155' }}>Projets : Monôme vs Binôme</h3>
                <div style={{ width: '100%', height: '300px', display: 'block', overflow: 'hidden' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={monomeBinomeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {monomeBinomeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 : Départements & Lieux de stage */}
          <div>
            <h3 className="section-title">
              🏢 Départements & Lieux de stage
            </h3>
            <div className="charts-section">
              {/* Lieux de stage populaires */}
              <div className="table-card" style={{ padding: '20px', background: 'white', borderRadius: '12px' }}>
                <h3 style={{ marginBottom: '15px', color: '#334155' }}>Top 10 : Lieux de Stage Prisés</h3>
                <div style={{ width: '100%', height: '300px', display: 'block', overflow: 'hidden' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={lieuxStageData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                      <Tooltip cursor={{fill: '#f1f5f9'}} />
                      <Bar dataKey="etudiants" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Nombre d'étudiants" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Réussite par Département */}
              <div className="table-card" style={{ padding: '20px', background: 'white', borderRadius: '12px' }}>
                <h3 style={{ marginBottom: '15px', color: '#334155' }}>Taux de Réussite par Département (%)</h3>
                <div style={{ width: '100%', height: '300px', display: 'block', overflow: 'hidden' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={depStatsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{fontSize: 12}} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="taux" stroke="#10b981" strokeWidth={3} dot={{ r: 6 }} name="Taux de Réussite (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  };

  export default Dashboard;
