import React, { useState, useEffect } from "react";
import axios from "../utils/axiosConfig";
import "./Table.css";

function DiplomesTable() {
  const [diplomes, setDiplomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDiplomes();
  }, []);

  const fetchDiplomes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('diplomes/');
      setDiplomes(response.data);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement des diplômes");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <h3>Tableau des Diplômes</h3>
        <table className="table">
          <tbody>
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>
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
        <h3>Tableau des Diplômes</h3>
        <table className="table">
          <tbody>
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', color: 'red' }}>
                Erreur: {error}
              </td>
            </tr>
          </tbody>
        </table>
      </>
    );
  }

  if (!Array.isArray(diplomes) || diplomes.length === 0) {
    return (
      <>
        <h3>Tableau des Diplômes</h3>
        <table className="table">
          <tbody>
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>
                Aucun diplôme à afficher.
              </td>
            </tr>
          </tbody>
        </table>
      </>
    );
  }

  return (
    <>
      <h3>Tableau des Diplômes</h3>
      <table className="table">
        <thead>
          <tr>
            <th>🎓 ID Diplôme</th>
            <th>📄 Libellé</th>
            <th>🧩 Spécialité</th>
            <th>🏛️ Université</th>
            <th>📅 Date obtention</th>
          </tr>
        </thead>
        <tbody>
          {diplomes.map((diplome) => (
            <tr key={diplome?.idDiplome || 'unknown'}>
              <td>{diplome?.idDiplome || "-"}</td>
              <td>{diplome?.libelleDiplome || "-"}</td>
              <td>{diplome?.specialite || "-"}</td>
              <td>{diplome?.universite || "-"}</td>
              <td>{diplome?.dateObtention || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default DiplomesTable;