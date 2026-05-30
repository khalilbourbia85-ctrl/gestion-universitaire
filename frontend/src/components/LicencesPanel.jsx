import React, { useState, useEffect } from "react";
import axios from "../utils/axiosConfig";
import "./LicencesPanel.css";

function LicencesPanel() {
  const [licences, setLicences] = useState([]);
  const [selectedLicence, setSelectedLicence] = useState(null);
  const [licenceDetails, setLicenceDetails] = useState(null);
  const [filteredModules, setFilteredModules] = useState([]);
  const [selectedSpecialite, setSelectedSpecialite] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Charger les licences au montage
  useEffect(() => {
    loadLicences();
  }, []);

  const loadLicences = async () => {
    try {
      const response = await axios.get("licences/");
      setLicences(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des licences:", error);
    }
  };

  const loadLicenceDetails = async (licenceId) => {
    setLoading(true);
    setSelectedSpecialite(null);
    try {
      // Charger la licence avec ses spécialités et modules
      const [licenceRes, specialitesRes, modulesRes] = await Promise.all([
        axios.get(`licences/${licenceId}/`),
        axios.get(`specialites/?licence=${licenceId}`),
        axios.get(`modules/?licence=${licenceId}`)
      ]);

      const specialites = specialitesRes.data;
      const modules = modulesRes.data;

      setLicenceDetails({
        licence: licenceRes.data,
        specialites,
        modules
      });
      setFilteredModules(modules);
      setSelectedSpecialite(null);
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLicenceClick = (licence) => {
    setSelectedLicence(licence);
    setSelectedSpecialite(null);
    loadLicenceDetails(licence.id);
  };

  const handleSpecialiteClick = async (specialite) => {
    if (!licenceDetails) {
      return;
    }

    setSelectedSpecialite(specialite);

    if (!specialite) {
      setFilteredModules(licenceDetails.modules);
      return;
    }

    if (specialite === "TRONC_COMMUN") {
      setFilteredModules(licenceDetails.modules.filter(module => !module.specialite));
      return;
    }

    try {
      const response = await axios.get(
        `/api/modules/?specialite=${specialite.id}`
      );
      setFilteredModules(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des modules de spécialité:", error);
      setFilteredModules(licenceDetails.modules.filter(module => module.specialite === specialite.id));
    }
  };

  const getFilteredModules = () => {
    if (!licenceDetails) {
      return [];
    }

    return filteredModules;
  };

  return (
    <div className="licences-panel">
      <button
        className="licences-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        📚 Licences Académiques
        <span className={`arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="licences-content">
          {!selectedLicence ? (
            // Liste des licences
            <div className="licences-list">
              <h3>Sélectionnez une licence</h3>
              {licences.map(licence => (
                <div
                  key={licence.id}
                  className="licence-item"
                  onClick={() => handleLicenceClick(licence)}
                >
                  <div className="licence-header">
                    <h4>{licence.nom}</h4>
                    <span className="licence-code">{licence.code}</span>
                  </div>
                  <p className="licence-dept">{licence.departement_nom}</p>
                  <p className="licence-duree">{licence.duree}</p>
                </div>
              ))}
            </div>
          ) : (
            // Détails de la licence sélectionnée
            <div className="licence-details">
              <div className="licence-details-header">
                <button
                  className="back-btn"
                  onClick={() => {
                    setSelectedLicence(null);
                    setLicenceDetails(null);
                  }}
                >
                  ← Retour aux licences
                </button>
                <h3>{selectedLicence.nom} ({selectedLicence.code})</h3>
                <p className="licence-info">
                  {selectedLicence.departement_nom} • {selectedLicence.duree}
                </p>
              </div>

              {loading ? (
                <div className="loading">Chargement...</div>
              ) : licenceDetails ? (
                <div className="licence-content">
                  {/* Spécialités */}
                  <div className="specialites-section">
                    <h4>🎯 Spécialités ({licenceDetails.specialites.length})</h4>
                    <div className="specialites-grid">
                      {licenceDetails.specialites.length > 0 && (
                        <div
                          className={`specialite-card filter-card ${selectedSpecialite === null ? 'active' : ''}`}
                          onClick={() => handleSpecialiteClick(null)}
                        >
                          <h5>Toutes</h5>
                          <p className="specialite-code">All</p>
                        </div>
                      )}
                      {licenceDetails.specialites.length === 0 && (
                        <div
                          className={`specialite-card filter-card ${selectedSpecialite === 'TRONC_COMMUN' ? 'active' : ''}`}
                          onClick={() => handleSpecialiteClick('TRONC_COMMUN')}
                        >
                          <h5>Tronc commun</h5>
                          <p className="specialite-code">TC</p>
                        </div>
                      )}
                      {licenceDetails.specialites.length > 0 && (
                        licenceDetails.specialites.map(specialite => (
                          <div
                            key={specialite.id}
                            className={`specialite-card filter-card ${selectedSpecialite?.id === specialite.id ? 'active' : ''}`}
                            onClick={() => handleSpecialiteClick(specialite)}
                          >
                            <h5>{specialite.nom}</h5>
                            <p className="specialite-code">{specialite.code}</p>
                            {specialite.description && (
                              <p className="specialite-desc">{specialite.description}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    {licenceDetails.specialites.length === 0 && !licenceDetails.modules.some(module => !module.specialite) && (
                      <p className="no-data">Aucune spécialité ou module disponible</p>
                    )}
                  </div>

                  {/* Modules par année et semestre */}
                  <div className="modules-section">
                    <h4>📖 Modules ({getFilteredModules().length})</h4>
                    {getFilteredModules().length > 0 ? (
                      <div className="modules-by-annee">
                        {['L1', 'L2', 'L3'].map(annee => {
                          const modulesAnnee = getFilteredModules().filter(m => m.annee === annee);
                          if (modulesAnnee.length === 0) return null;

                          return (
                            <div key={annee} className="annee-section">
                              <h5>{annee}ère année</h5>
                              <div className="semestres-grid">
                                {['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].map(semestre => {
                                  const modulesSemestre = modulesAnnee.filter(m => m.semestre === semestre);
                                  if (modulesSemestre.length === 0) return null;

                                  return (
                                    <div key={semestre} className="semestre-card">
                                      <h6>{semestre}</h6>
                                      <div className="modules-list">
                                        {modulesSemestre.map(module => (
                                          <div key={module.id} className="module-item">
                                            <div className="module-header">
                                              <span className="module-name">{module.nom}</span>
                                              <span className="module-code">{module.code}</span>
                                            </div>
                                            <div className="module-details">
                                              <span className="module-type">{module.type}</span>
                                              <span className="module-credits">{module.credit} crédits</span>
                                              <span className="module-hours">{module.volume_horaire}h</span>
                                            </div>
                                            {module.specialite_nom && (
                                              <div className="module-specialite">
                                                Spécialité: {module.specialite_nom}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="no-data">Aucun module défini pour ce filtre</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LicencesPanel;