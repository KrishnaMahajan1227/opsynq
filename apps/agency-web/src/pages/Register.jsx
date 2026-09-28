import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import './Register.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/users/register`, { username, email, mobile, password, role }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('User registered successfully');
      setUsername('');
      setEmail('');
      setMobile('');
      setPassword('');
    } catch (err) {
      console.error(err);
      alert('Registration failed');
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <div className="register-card-header">
          <span className="eyebrow">Team Access</span>
          <h3>Register New User</h3>
          <p>Add an admin or field technician to Opsynq Agency Operations</p>
        </div>

        <div className="register-card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Username</label>
              <input type="text" className="form-control" placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <div className="form-text">Used for secure password recovery.</div>
            </div>
            <div className="mb-3">
              <label className="form-label">Mobile Number</label>
              <input type="text" className="form-control" placeholder="Enter mobile number" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input type="password" minLength={12} maxLength={128} className="form-control" placeholder="12+ characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="mb-4">
              <label className="form-label">Role</label>
              <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="admin">Admin</option>
                <option value="field_technician">Field Technician</option>
              </select>
            </div>
            <div className="d-grid">
              <button type="submit" className="register-btn">Register</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
