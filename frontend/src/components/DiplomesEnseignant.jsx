import React from "react";
import "./Table.css";

function DiplomesTable({ enseignants }) {
  if (!Array.isArray(enseignants) || enseignants.length === 0) {
    return (
      <>
        <h3>Tableau des Diplômes</h3>
        <table className="table">
          <tbody>
            <tr>
              <td colSpan="6" style={{ textAlign: 'center' }}>
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
            <th>🆔 Matricule</th>
            <th>👤 Nom</th>
            <th>🧑‍🎓 Prénom</th>
            <th>🎓 ID Diplôme</th>
            <th>📄 Libellé</th>
            <th>🧩 Spécialité</th>
            <th>🏛️ Université</th>
            <th>📅 Date obtention</th>
          </tr>
        </thead>
        <tbody>
          {enseignants.map((e) => (
            <tr key={e?.matricule || 'unknown'}>
              <td>{e?.matricule || "-"}</td>
              <td>{e?.nom || "-"}</td>
              <td>{e?.prenom || "-"}</td>
              <td>{e?.diplome?.idDiplome || "-"}</td>
              <td>{e?.diplome?.libelleDiplome || "-"}</td>
              <td>{e?.diplome?.specialite || "-"}</td>
              <td>{e?.diplome?.universite || "-"}</td>
              <td>{e?.diplome?.dateObtention || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default DiplomesTable;