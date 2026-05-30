import React, { useState, useEffect } from "react";
import "./Sidebar.css";

import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaProjectDiagram,
  FaUserTie,
  FaFileAlt,
  FaCalendarAlt,
  FaChevronDown,
  FaUniversity,
  FaBook,
  FaPencilAlt,
  FaChartBar
} from "react-icons/fa";

import { NavLink, useLocation } from "react-router-dom";

function Sidebar() {
  const location = useLocation();
  const pfeRoutes = ["/pfes", "/encadrants", "/rapporteurs", "/soutenances"];
  const isPfeSectionActive = pfeRoutes.includes(location.pathname);
  const [pfeOpen, setPfeOpen] = useState(false);
  
  const academicRoutes = ["/departements", "/licences", "/modules", "/affectations"];
  const isAcademicSectionActive = academicRoutes.includes(location.pathname);
  const [academicOpen, setAcademicOpen] = useState(false);

  useEffect(() => {
    if (isPfeSectionActive) {
      setPfeOpen(true);
    }
  }, [isPfeSectionActive]);

  useEffect(() => {
    if (isAcademicSectionActive) {
      setAcademicOpen(true);
    }
  }, [isAcademicSectionActive]);

  return (
    <div className="sidebar">
      <div className="logo">

        <h2 className="logo-app">🎓 UniDepart</h2>
      </div>
      <nav>
        <ul>
          <li>
            <NavLink
              to="/etudiants"
              className={({ isActive }) =>
                isActive ? "active-link" : ""
              }
            >
              <FaUserGraduate />
              Gestion Étudiants
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/enseignants"
              className={({ isActive }) =>
                isActive ? "active-link" : ""
              }
            >
              <FaChalkboardTeacher />
              Gestion Enseignants
            </NavLink>
          </li>

          <li className={`menu-header ${isPfeSectionActive ? "active" : ""}`}>
            <button
              type="button"
              className="menu-button"
              onClick={() => setPfeOpen((prev) => !prev)}
            >
              <FaProjectDiagram />
              Gestion PFE
              <FaChevronDown className={`chevron ${pfeOpen ? "open" : ""}`} />
            </button>
            <ul className={`submenu ${pfeOpen ? "open" : ""}`}>
              <li>
                <NavLink
                  to="/pfes"
                  className={({ isActive }) =>
                    isActive ? "active-link" : ""
                  }
                >
                  <FaProjectDiagram />
                  Affectation PFE
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/encadrants"
                  className={({ isActive }) =>
                    isActive ? "active-link" : ""
                  }
                >
                  <FaUserTie />
                  Gestion Encadrants
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/rapporteurs"
                  className={({ isActive }) =>
                    isActive ? "active-link" : ""
                  }
                >
                  <FaFileAlt />
                  Gestion Rapporteurs
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/soutenances"
                  className={({ isActive }) =>
                    isActive ? "active-link" : ""
                  }
                >
                  <FaCalendarAlt />
                  Gestion Soutenances
                </NavLink>
              </li>
            </ul>
          </li>

          <li className={`menu-header ${isAcademicSectionActive ? "active" : ""}`}>
            <button
              type="button"
              className="menu-button"
              onClick={() => setAcademicOpen((prev) => !prev)}
            >
              <FaUniversity />
              Gestion Académique
              <FaChevronDown className={`chevron ${academicOpen ? "open" : ""}`} />
            </button>
            <ul className={`submenu ${academicOpen ? "open" : ""}`}>
              <li>
                <NavLink
                  to="/departements"
                  className={({ isActive }) =>
                    isActive ? "active-link" : ""
                  }
                >
                  <FaUniversity />
                  Gestion Départements
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/licences"
                  className={({ isActive }) =>
                    isActive ? "active-link" : ""
                  }
                >
                  <FaBook />
                  Gestion Licences
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/modules"
                  className={({ isActive }) =>
                    isActive ? "active-link" : ""
                  }
                >
                  <FaPencilAlt />
                  Gestion Modules
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/affectations"
                  className={({ isActive }) =>
                    isActive ? "active-link" : ""
                  }
                >
                  <FaProjectDiagram />
                  Affectations Académiques
                </NavLink>
              </li>
            </ul>
          </li>

          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                isActive ? "active-link" : ""
              }
            >
              <FaChartBar />
              Tableau de Bord
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;