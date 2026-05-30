import React, { useState, useEffect } from "react";
import axios from "../utils/axiosConfig";
import "./Table.css";

function ContratsTable() {
  const [contrats, setContrats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContrats();
  }, []);

  const fetchContrats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('contrats/');
      setContrats(response.data);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement des contrats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <h3>Tableau des Contrats</h3>
        <table className="table">
          <tbody>
            <tr>
              <td colSpan="8" style={{ textAlign: 'center' }}>
                Chargement...
              </td>
            </tr>
          </tbody>
        </table>
      </>
    );
  }

  if (error) {
    return (
      <>
        <h3>Tableau des Contrats</h3>
        <table className="table">
          <tbody>
            <tr>
              <td colSpan="8" style={{ textAlign: 'center', color: 'red' }}>
                Erreur: {error}
              </td>
            </tr>
          </tbody>
        </table>
      </>
    );
  }

  if (!Array.isArray(contrats) || contrats.length === 0) {
    return (
      <>
        <h3>Tableau des Contrats</h3>
        <table className="table">
          <tbody>
            <tr>
              <td colSpan="8" style={{ textAlign: 'center' }}>
                Aucun contrat à afficher.
              </td>
            </tr>
          </tbody>
        </table>
      </>
    );
  }

  return (
    <>
      <h3>Tableau des Contrats</h3>
      <table className="table">
        <thead>
          <tr>
            <th>🆔 Matricule</th>
            <th>👤 Nom</th>
            <th>👤 Prénom</th>
            <th>📄 Type Contrat</th>
            <th>📅 Date début titre</th>
            <th>📅 Date début contrat</th>
            <th>📅 Date fin contrat</th>
            <th>💼 Infos spécifiques</th>
          </tr>
        </thead>
        <tbody>
          {contrats.map((contrat) => {
            let infoSpec = "";
            switch (contrat?.typeContrat) {
              case "ContratDoctorant":
                infoSpec = `Sujet thèse: ${contrat?.sujetThese || "-"}, Université: ${contrat?.universite || "-"}, Année inscription: ${contrat?.anneeInscription || "-"}`;
                break;
              case "ContratDocteur":
                infoSpec = `Prime recherche: ${contrat?.primeRecherche || "-"}, Numéro ordre: ${contrat?.numeroOrdre || "-"}`;
                break;
              default:
                infoSpec = `Durée: ${contrat?.dureeContrat || "-"}`;
            }
            return (
              <tr key={contrat?.matricule || 'unknown'}>
                <td>{contrat?.matricule || "-"}</td>
                <td>{contrat?.nom || "-"}</td>
                <td>{contrat?.prenom || "-"}</td>
                <td>{contrat?.typeContrat || "-"}</td>
                <td>{contrat?.dateDebutTitre || "-"}</td>
                <td>{contrat?.dateDebutContrat || "-"}</td>
                <td>{contrat?.dateFinContrat || "-"}</td>
                <td>{infoSpec}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

export default ContratsTable;