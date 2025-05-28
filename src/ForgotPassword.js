import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './App.css';

const API_URL = 'https://login-1-8dx3.onrender.com';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword: newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Password reset failed');
      }

      const data = await response.json();
      if (data.status === 'success') {
        setSuccessMessage('Password updated successfully. Please log in.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(data.error || 'Password reset failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="form-card">
        <img
          src="/logo.png"
          alt="Logo"
          className="form-logo"
          onError={(e) => (e.target.src = 'https://via.placeholder.com/40')}
        />
        <h2 className="form-title">Reset Password</h2>
        <form onSubmit={handleResetPassword}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="new-password">
              New Password
            </label>
            <input
              type="password"
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="form-input"
              placeholder="Enter new password"
              required
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          {success <p className="form-success">{success}</p>}
          <button type="submit" className="form-button" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        <p className="form-link">
          Back to <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;