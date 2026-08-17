import React, { useState } from 'react';
import { api, setAuthSession } from '../api';

export default function AuthPage({ onAuthSuccess }) {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');

  async function handleLogin(e) {
    if (e) e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const res = await api.login({
        email: loginEmail,
        password: loginPassword,
      });

      setAuthSession(res.user);
      onAuthSuccess(res.user);
    } catch (err) {
      setError(
        err.message || 'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const res = await api.register({
        name: regName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
      });

      setAuthSession(res.user);
      onAuthSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">

        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo__badge">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </span>
          </div>

          <h1 className="auth-title">Lost &amp; Found Hub</h1>

          <p className="auth-subtitle">
            Community-driven lost and found board. Please sign in or create
            an account to access the board.
          </p>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${
              tab === 'login' ? 'is-active' : ''
            }`}
            onClick={() => {
              setTab('login');
              setError('');
            }}
          >
            Sign In
          </button>

          <button
            type="button"
            className={`auth-tab ${
              tab === 'register' ? 'is-active' : ''
            }`}
            onClick={() => {
              setTab('register');
              setError('');
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert--error" role="alert">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>

            <span>{error}</span>
          </div>
        )}

        {/* Login */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="auth-form">

            <label className="form__field">
              <span>Email Address</span>

              <input
                required
                type="email"
                placeholder="name@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </label>

            <label className="form__field">
              <span>Password</span>

              <input
                required
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </label>

            <button
              type="submit"
              className="btn btn--primary btn--full"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

          </form>
        ) : (

          /* Register */
          <form onSubmit={handleRegister} className="auth-form">

            <label className="form__field">
              <span>Full Name</span>

              <input
                required
                placeholder="e.g. Jordan Smith"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
              />
            </label>

            <label className="form__field">
              <span>Email Address</span>

              <input
                required
                type="email"
                placeholder="jordan@example.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
            </label>

            <label className="form__field">
              <span>Password</span>

              <input
                required
                type="password"
                placeholder="Enter password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />
            </label>

            <label className="form__field">
              <span>Phone Number (Optional)</span>

              <input
                placeholder="e.g. 01700-123456"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
              />
            </label>

            <button
              type="submit"
              className="btn btn--primary btn--full"
              disabled={loading}
            >
              {loading
                ? 'Creating Account…'
                : 'Create Account'}
            </button>

          </form>
        )}
      </div>
    </div>
  );
}