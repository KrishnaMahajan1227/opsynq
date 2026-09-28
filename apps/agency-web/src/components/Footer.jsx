import React from 'react';
import './Footer.css';
import { Container } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';

const Footer = () => {
  const location = useLocation();
  const role = localStorage.getItem('userRole') || '';
  const token = localStorage.getItem('token');
  const hideBackofficeFooter = token && ['admin', 'superadmin'].includes(role) && (location.pathname.startsWith('/dashboard/') || location.pathname === '/upload');
  if (hideBackofficeFooter) return null;
  return (
    <footer className="footer text-light">
      <Container className="d-flex flex-column flex-md-row justify-content-between align-items-center text-center">
        <div className="mb-2 mb-md-0">Agency Operations</div>
        <div><span>© {new Date().getFullYear()} Opsynq Global. All rights reserved.</span></div>
      </Container>
    </footer>
  );
};
export default Footer;
