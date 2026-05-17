import React from "react";
import "./Table.css";

function ContratsTable({ enseignants }) {
  if (!Array.isArray(enseignants) || enseignants.length === 0) {
    return (
      <>
        <h3>Tableau des Contrats</h3>
        <table className="table">
          <tbody>
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>
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
            <th>🧑‍🎓 Prénom</th>
            <th>📄 Type Contrat</th>
            <th>📅 Date début</th>
            <th>📅 Date fin</th>
            <th>💼 Infos spécifiques</th>
          </tr>
        </thead>
        <tbody>
          {enseignants.map((e) => {
            let infoSpec = "";
            switch (e?.typeContrat) {
              case "Permanent":
                infoSpec = `Date titularisation: ${e?.dateTitularisation || "-"}, Statut: ${e?.statutAdministratif || "-"}`;
                break;
              case "Vacataire":
                infoSpec = `Nb heures: ${e?.nbHeures || "-"}, Taux horaire: ${e?.tauxHoraire || "-"}`;
                break;
              case "ContratDoctorant":
                infoSpec = `Sujet thèse: ${e?.sujetThese || "-"}, Université: ${e?.universite || "-"}, Année inscription: ${e?.anneeInscription || "-"}`;
                break;
              case "ContratDocteur":
                infoSpec = `Prime recherche: ${e?.primeRecherche || "-"}, Durée: ${e?.dureeContrat || "-"}`;
                break;
              default:
                infoSpec = "-";
            }
            return (
              <tr key={e?.matricule || 'unknown'}>
                <td>{e?.matricule || "-"}</td>
                <td>{e?.nom || "-"}</td>
                <td>{e?.prenom || "-"}</td>
                <td>{e?.typeContrat || "-"}</td>
                <td>{e?.dateDebut || "-"}</td>
                <td>{e?.dateFin || "-"}</td>
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