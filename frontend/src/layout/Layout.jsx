import Sidebar from "./Sidebar";
import NavbarTop from "./NavbarTop";
import { Outlet } from "react-router-dom";
import "./Layout.css";

/*
Structure global:

HEADER
SIDEBAR + MAIN CONTENT
*/

function Layout({ children, role }) {
  return (
    <div className="layout">

      {/* HEADER (NAVBAR TOP) */}
      <NavbarTop role={role} />

      {/* BODY STRUCTURE */}
      <div className="layout-body">

        {/* LEFT SIDEBAR */}
        <Sidebar role={role} />

        {/* RIGHT MAIN CONTENT */}
        <div className="main-content">
          <Outlet />
          {children}
        </div>

      </div>

    </div>
  );
}

export default Layout;