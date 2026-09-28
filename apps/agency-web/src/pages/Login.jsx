import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, Button, Form, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './Login.css';
import logo from '../assets/logo-opsynq.png';
import { API_URL } from '../config';


const Login = () => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mobileError, setMobileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const navigate = useNavigate();

  const demoAccounts = [
    { label: 'Agency Superadmin', mobile: '9200000001' },
    { label: 'Agency Admin', mobile: '9200000002' },
    { label: 'Field Technician', mobile: '9200000003' },
  ];

  const useDemoAccount = (account) => {
    setMobile(account.mobile);
    setPassword('Demo@1234');
    setMobileError('');
    setPasswordError('');
    setError('');
  };

  // Normalize role for consistent comparison
  const normalizeRole = (role) => role?.toLowerCase()?.replace(/[-_\s]/g, '');

  // Session check on mount
  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem('token');
    if (token) {
      const role = localStorage.getItem('userRole');
      console.log('Session Check - Stored Role:', role, 'Normalized:', normalizeRole(role));
      const normalizedRole = normalizeRole(role);
      if (normalizedRole === 'fieldtechnician') {
        navigate('/dashboard/technician');
      } else if (normalizedRole === 'superadmin') {
        navigate('/dashboard/superadmin');
      } else {
        navigate('/dashboard/admin');
      }
    }
  }, [navigate]);

  // Real-time validation
  const validateMobile = (value) => {
    const mobileRegex = /^[0-9]{10}$/;
    if (!value) {
      setMobileError('Mobile number is required');
      return false;
    } else if (!mobileRegex.test(value)) {
      setMobileError('Enter a valid 10-digit mobile number');
      return false;
    }
    setMobileError('');
    return true;
  };

  const validatePassword = (value) => {
    if (!value) {
      setPasswordError('Password is required');
      return false;
    } else if (value.length < 5) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const isMobileValid = validateMobile(mobile);
    const isPasswordValid = validatePassword(password);

    if (!isMobileValid || !isPasswordValid) return;

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { mobile, password });
      console.log('Login Response:', res.data);
      console.log('Login Role:', res.data.user.role, 'Normalized:', normalizeRole(res.data.user.role));

      // Store authentication details in localStorage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userRole', res.data.user.role);
      localStorage.setItem('username', res.data.user.username || res.data.user.mobile);
      localStorage.setItem('userId', res.data.user.id); // Store userId
      localStorage.setItem('userMobile', res.data.user.mobile);

      const normalizedRole = normalizeRole(res.data.user.role);
      if (normalizedRole === 'fieldtechnician') {
        localStorage.setItem('technicianMobile', res.data.user.mobile);
        navigate('/dashboard/technician');
      } else if (normalizedRole === 'superadmin') {
        navigate('/dashboard/superadmin');
      } else {
        navigate('/dashboard/admin');
      }

      toast.success('Login successful!', { position: 'top-right' });
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg, { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Brand panel */}
      <aside className="login-brand">
        <div className="brand-mark">
          <img src={logo} alt="Opsynq Agency Operations Logo" />
          <span>Opsynq Agency Operations</span>
        </div>

        <div className="brand-copy">
          <span className="brand-eyebrow">Operations Platform</span>
          <h1>
            Power your <em>field, fleet &amp; back office</em> from one place
          </h1>
          <p>
            Sign in to schedule installs, track technicians, and manage
            every project — from first survey to final commissioning.
          </p>
        </div>

        <div>
          <div className="brand-stats">
            <div>
              <strong>24/7</strong>
              <span>Live site monitoring</span>
            </div>
            <div>
              <strong>360°</strong>
              <span>Project visibility</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>Paperless workflow</span>
            </div>
          </div>
          <p className="brand-foot" style={{ marginTop: 28 }}>
            &copy; {new Date().getFullYear()} Opsynq Agency Operations. All rights reserved.
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="login-form-panel">
        <Card className={`login-card ${isMounted ? 'fade-in' : ''}`} aria-labelledby="login-title">
          <Card.Body>
            <div className="login-mobile-mark text-center mb-4">
              <img src={logo} alt="Opsynq Agency Operations Logo" style={{ width: 44 }} />
            </div>

            <div className="login-form-header">
              <span className="eyebrow">Welcome back</span>
              <h3 id="login-title">Sign in to your account</h3>
              <p className="sub">Enter your credentials to continue</p>
            </div>

            <div className="demo-access-panel" aria-label="Demo agency accounts">
              <div className="demo-access-panel__head">
                <div><strong>Demo access</strong><span>Use a seeded Agency Operations role</span></div>
                <span className="demo-password">Demo@1234</span>
              </div>
              <div className="demo-access-grid">
                {demoAccounts.map((account) => (
                  <button type="button" key={account.mobile} onClick={() => useDemoAccount(account)}>
                    <span>{account.label}</span>
                    <small>{account.mobile}</small>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <Alert variant="warning" className="mb-4">
                {error}
              </Alert>
            )}

            <Form onSubmit={handleSubmit} noValidate>
              <Form.Group controlId="mobile" className="mb-4">
                <Form.Label>Mobile Number</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-phone"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Enter 10-digit mobile number"
                    value={mobile}
                    onChange={(e) => {
                      setMobile(e.target.value);
                      validateMobile(e.target.value);
                    }}
                    isInvalid={!!mobileError}
                    required
                    aria-describedby="mobile-error"
                  />
                  <Form.Control.Feedback type="invalid" id="mobile-error">
                    {mobileError}
                  </Form.Control.Feedback>
                </InputGroup>
              </Form.Group>

              <Form.Group controlId="password" className="mb-4">
                <Form.Label>Password</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-lock"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      validatePassword(e.target.value);
                    }}
                    isInvalid={!!passwordError}
                    required
                    aria-describedby="password-error"
                  />
                  <InputGroup.Text
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ cursor: 'pointer' }}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </InputGroup.Text>
                  <Form.Control.Feedback type="invalid" id="password-error">
                    {passwordError}
                  </Form.Control.Feedback>
                </InputGroup>
              </Form.Group>

              <Button
                variant="primary"
                type="submit"
                className="w-100 login-btn"
                disabled={loading}
                aria-label={loading ? 'Logging in' : 'Login'}
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </main>

      <ToastContainer />
    </div>
  );
};

export default Login;
