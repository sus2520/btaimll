import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from './index';
import './App.css';

const API_URL = 'https://login-1-8dx3.onrender.com';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Client-side validation for password strength
  const checkPasswordStrength = (pwd) => {
    if (pwd.length < 8) return 'Weak';
    if (!/[A-Z]/.test(pwd) || !/\d/.test(pwd)) return 'Moderate';
    return 'Strong';
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(checkPasswordStrength(newPassword));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Client-side validation
    if (!name.trim()) {
      setError('Name cannot be empty');
      setLoading(false);
      return;
    }

    if (passwordStrength !== 'Strong') {
      setError('Password must be at least 8 characters long and contain at least one uppercase letter and one digit');
      setLoading(false);
      return;
    }

    if (profilePic && profilePic.size > 2 * 1024 * 1024) { // 2MB limit
      setError('Profile picture must be less than 2MB');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      if (profilePic) {
        formData.append('profile_pic', profilePic);
      }

      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Signup failed'); // Use 'detail' from HTTPException
      }

      if (data.status === 'success') {
        setSuccess('Signup successful! Redirecting to homepage...');
        login(data.user, null);
        setTimeout(() => navigate('/'), 2000); // Delay redirection for user feedback
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="form-card">
        <img
          src="/logo.png"
          alt="Logo"
          className="form-logo"
          onError={(e) => (e.target.src = 'https://via.placeholder.com/40')}
        />
        <h2 className="form-title">Sign Up for AI Chatbot</h2>
        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              placeholder="Enter your name"
              required
            />
          </div>
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
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              className="form-input"
              placeholder="Enter your password"
              required
            />
            {password && (
              <p className={`password-strength ${passwordStrength.toLowerCase()}`}>
                Password Strength: {passwordStrength}
              </p>
            )}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="profilePic">
              Profile Picture (optional)
            </label>
            <input
              type="file"
              id="profilePic"
              accept="image/*"
              onChange={(e) => setProfilePic(e.target.files[0])}
              className="form-input"
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}
          <button
            type="submit"
            className="form-button"
            disabled={loading || passwordStrength !== 'Strong'}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        <p className="form-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;