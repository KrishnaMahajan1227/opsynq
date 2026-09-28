// src/components/NavbarComponent.jsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaBell } from 'react-icons/fa';
import logo from '../assets/logo-opsynq.png';
import './Navbar.css';

const NavbarComponent = () => {
  // Retrieve token, role, and username from localStorage
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole') || '';
  const displayName = localStorage.getItem('username') || 'User';

  const navigate = useNavigate();
  const location = useLocation();
  const isBackofficeDashboard = token && ['admin', 'superadmin'].includes(role) && (location.pathname.startsWith('/dashboard/') || location.pathname === '/upload');

  // Determine the “home” link based on role
  const homePath =
    role === 'field_technician'
      ? '/dashboard/technician'
      : role === 'superadmin'
      ? '/dashboard/superadmin'
      : '/dashboard/admin';

  const handleLogout = () => {
    localStorage.clear();
    const platformBase=import.meta.env.VITE_PLATFORM_APP_URL||`${window.location.protocol}//${window.location.hostname||'localhost'}:5173`; window.location.assign(`${platformBase}/?login=1`);
  };

  // Purely presentational helpers (no change to app logic/behavior)
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U';

  const roleLabel = role ? role.replace(/_/g, ' ') : 'Member';

  if (isBackofficeDashboard) return null;

  return (
    <nav className="navbar navbar-expand-lg dashboard-navbar shadow-sm">
      <div className="container-fluid px-3">
        {/* logo */}
        <Link className="navbar-brand" to={homePath}>
          <img src={logo} alt="Opsynq logo" className="navbar-logo" height="32" />
          <span className="navbar-brand-text d-none d-sm-flex">
            <span className="navbar-title">Opsynq Agency Operations</span>
            <span className="navbar-subtitle">Operations Suite</span>
          </span>
        </Link>

        {/* burger (for collapsing on small screens) */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#crmNavbar"
          aria-controls="crmNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="crmNavbar">
          {/* left‐side links (only when logged in) */}
          {token && (
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {role === 'superadmin' && (
                <li className="nav-item">
                  <Link
                    className={`nav-link ${
                      location.pathname.startsWith('/dashboard/superadmin') ? 'active' : ''
                    }`}
                    to="/dashboard/superadmin"
                  >
                    SuperAdmin Dashboard
                  </Link>
                </li>
              )}

              {role === 'admin' && (
                <li className="nav-item">
                  <Link
                    className={`nav-link ${
                      location.pathname.startsWith('/dashboard/admin') ? 'active' : ''
                    }`}
                    to="/dashboard/admin"
                  >
                    Admin Dashboard
                  </Link>
                </li>
              )}

              {role === 'field_technician' && (
                <li className="nav-item">
                  <Link
                    className={`nav-link ${
                      location.pathname.startsWith('/dashboard/technician') ? 'active' : ''
                    }`}
                    to="/dashboard/technician"
                  >
                    Technician Dashboard
                  </Link>
                </li>
              )}

              {(role === 'superadmin' || role === 'admin') && (
                <li className="nav-item">
                  <Link
                    className={`nav-link ${
                      location.pathname === '/upload' ? 'active' : ''
                    }`}
                    to="/upload"
                  >
                    Upload Excel
                  </Link>
                </li>
              )}
            </ul>
          )}

          {/* right‐side icons & profile (or Login if not authenticated) */}
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-center gap-2">
            {token ? (
              <>
                {/* bell icon */}
                <li className="nav-item">
                  <button
                    className="navbar-icon-btn"
                    aria-label="Notifications"
                  >
                    <FaBell className="navbar-icon" size={17} />
                    <span className="navbar-badge">
                      <span className="visually-hidden">unread</span>
                    </span>
                  </button>
                </li>

                {/* profile dropdown */}
                <li className="nav-item dropdown profile-dropdown">
                  <button
                    className="btn dropdown-toggle"
                    id="profileMenu"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <span className="profile-avatar" aria-hidden="true">
                      <FaUserCircle size={26} />
                    </span>
                    <span className="navbar-username">
                      {displayName}
                      <small>{roleLabel}</small>
                    </span>
                  </button>
                  <ul
                    className="dropdown-menu dropdown-menu-end navbar-dropdown-menu"
                    aria-labelledby="profileMenu"
                  >
                    <li className="navbar-dropdown-header">
                      <div className="dh-name">{displayName}</div>
                      <span className="dh-role">{roleLabel}</span>
                    </li>
                    <li>
                      <button className="dropdown-item logout-item" onClick={handleLogout}>
                        Logout
                      </button>
                    </li>
                  </ul>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link className="btn navbar-login-btn btn-sm" to="/">
                  Login
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavbarComponent;
