import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email || !password) {
      setFormError('Please enter your email/username and password.');
      return;
    }

    try {
      const success = await login(email, password);
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
        {/* Main Instagram Login Card */}
        <div className="insta-auth-card">
          <h1 className="insta-logo-text">Tea</h1>

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
            {/* Phone, username, or email */}
            <div className="insta-field-wrapper">
              <input
                type="text"
                className="insta-input"
                placeholder="Phone number, username, or email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoFocus
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

            {/* Log In Button */}
            <button 
              type="submit" 
              className="insta-btn-primary" 
              disabled={loading || !email.trim() || !password}
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          {/* OR Divider Line */}
          <div className="insta-divider">
            <div className="insta-divider-line" />
            <span className="insta-divider-text">OR</span>
            <div className="insta-divider-line" />
          </div>

          {/* Forgot Password Link */}
          <a href="#forgot" className="insta-link-muted" onClick={(e) => e.preventDefault()}>
            Forgot password?
          </a>
        </div>

        {/* Secondary Card: Switch to Signup */}
        <div className="insta-switch-card">
          <span>Don't have an account?</span>
          <Link to="/register" className="insta-switch-link">Sign up</Link>
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
            <a href="#lite">Tea Lite</a>
          </div>
          <span>© 2026 Tea Space</span>
        </footer>
      </div>
    </div>
  );
};

export default Login;
