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
  FaChartPie
} from "react-icons/fa";

import { NavLink, useLocation } from "react-router-dom";

function Sidebar({ role }) {
  const location = useLocation();
  const pfeRoutes = ["/pfes", "/encadrants", "/rapporteurs", "/soutenances"];
  const isPfeSectionActive = pfeRoutes.includes(location.pathname);
  const [pfeOpen, setPfeOpen] = useState(false);
  
  const academicRoutes = ["/departements", "/licences", "/modules"];
  const isAcademicSectionActive = academicRoutes.includes(location.pathname);
  const [academicOpen, setAcademicOpen] = useState(false);

  const dashboardRoutes = ["/dashboard", "/dashboard-pfe"];
  const isDashboardSectionActive = dashboardRoutes.includes(location.pathname);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  return (
    <div className="sidebar">
      <div className="logo">
        <h2 className="logo-app">🎓 UniManage</h2>
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
              {role === 'admin' && (
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
              )}
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
            </ul>
          </li>
          <li className={`menu-header ${isDashboardSectionActive ? "active" : ""}`}>
            <button
              type="button"
              className="menu-button"
              onClick={() => setDashboardOpen((prev) => !prev)}
            >
              <FaChartPie />
              Tableaux de Bord
              <FaChevronDown className={`chevron ${dashboardOpen ? "open" : ""}`} />
            </button>
            <ul className={`submenu ${dashboardOpen ? "open" : ""}`}>
              <li>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    isActive ? "active-link" : ""
                  }
                >
                  <FaChartPie />
                  Global
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/dashboard-pfe"
                  className={({ isActive }) =>
                    isActive ? "active-link" : ""
                  }
                >
                  <FaChartPie />
                  PFE
                </NavLink>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;