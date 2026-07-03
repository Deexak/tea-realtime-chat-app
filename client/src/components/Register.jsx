import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const { register, error, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!username || !email || !password || !confirmPassword) {
      setFormError('Please fill in all fields.');
      return;
    }

    if (username.length < 3) {
      setFormError('Username must be at least 3 characters.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    try {
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=ef4444&color=ffffff&bold=true&length=2`;
      const success = await register(username, email, password, avatarUrl);
      if (success) {
        navigate('/');
      }
    } catch (err) {
      // Handled by context
    }
  };

  return (
    <div className="insta-auth-container">
      <div className="insta-auth-wrapper">
        {/* Main Instagram Register Card */}
        <div className="insta-auth-card">
          <h1 className="insta-logo-text">Tea Tem</h1>

          <p className="insta-auth-subtitle">
            Sign up to see photos and messages from your friends on Tea Tem.
          </p>

          {(formError || error) && (
            <div 
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '4px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px'
              }}
            >
              <AlertCircle size={16} />
              <span>{formError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="insta-auth-form">
            {/* Email Address */}
            <div className="insta-field-wrapper">
              <input
                type="email"
                className="insta-input"
                placeholder="Mobile Number or Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Username */}
            <div className="insta-field-wrapper" style={{ marginTop: '4px' }}>
              <input
                type="text"
                className="insta-input"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Password with Show/Hide toggle */}
            <div className="insta-field-wrapper" style={{ marginTop: '4px' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="insta-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={{ paddingRight: '60px' }}
              />
              {password && (
                <button
                  type="button"
                  className="insta-toggle-show"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              )}
            </div>

            {/* Confirm Password */}
            <div className="insta-field-wrapper" style={{ marginTop: '4px' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="insta-input"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Sign Up Button */}
            <button 
              type="submit" 
              className="insta-btn-primary" 
              disabled={loading || !username.trim() || !email.trim() || !password || !confirmPassword}
            >
              {loading ? 'Signing up...' : 'Sign up'}
            </button>
          </form>

          <p style={{ fontSize: '11px', color: '#737373', textAlign: 'center', marginTop: '16px', lineHeight: '1.4' }}>
            People who use our service may have uploaded your contact information to Instagram.
          </p>
        </div>

        {/* Secondary Card: Switch to Login */}
        <div className="insta-switch-card">
          <span>Have an account?</span>
          <Link to="/login" className="insta-switch-link">Log in</Link>
        </div>

        {/* Footer Meta Links */}
        <footer className="insta-footer">
          <div className="insta-footer-links">
            <a href="#meta">Meta</a>
            <a href="#about">About</a>
            <a href="#blog">Blog</a>
            <a href="#jobs">Jobs</a>
            <a href="#help">Help</a>
            <a href="#api">API</a>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#locations">Locations</a>
            <a href="#lite">Tea Tem Lite</a>
          </div>
          <span>© 2026 Tea Tem</span>
        </footer>
      </div>
    </div>
  );
};

export default Register;
