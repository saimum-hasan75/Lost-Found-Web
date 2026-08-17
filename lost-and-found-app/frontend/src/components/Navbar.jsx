import React from 'react';

export default function Navbar({ onNavigate, view, currentUser, onLogout }) {
  const isAdmin = currentUser?.role === 'admin';
  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <button
          className="navbar__brand"
          onClick={() => onNavigate('board')}
          aria-label="Go to home board"
        >
          <span className="navbar__logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </span>
          <span className="navbar__brand-text">Lost&amp;Found</span>
        </button>

        <nav className="navbar__links">
          <button
            className={`navbar__link ${view === 'board' ? 'is-active' : ''}`}
            onClick={() => onNavigate('board')}
          >
            📋 The Board
          </button>
          <button
            className={`navbar__link navbar__link--lost ${
              view === 'report-lost' ? 'is-active' : ''
            }`}
            onClick={() => onNavigate('report-lost')}
          >
            🔍 I Lost Something
          </button>
          <button
            className={`navbar__link navbar__link--found ${
              view === 'report-found' ? 'is-active' : ''
            }`}
            onClick={() => onNavigate('report-found')}
          >
            🎁 I Found Something
          </button>
        </nav>

        <div className="navbar__user-actions">
          {isAdmin && (
            <button
              className={`navbar__admin-btn ${view === 'admin' ? 'is-active' : ''}`}
              onClick={() => onNavigate('admin')}
              title="Admin Control Hub"
            >
              🛡️ Admin Hub
            </button>
          )}

          <button
            className={`navbar__user-profile-btn ${view === 'profile' ? 'is-active' : ''}`}
            onClick={() => onNavigate('profile')}
            title="View Your Profile &amp; Postings"
          >
            <span className="navbar__avatar">{initials}</span>
            <span className="navbar__user-name">{currentUser?.name || 'Profile'}</span>
          </button>

          <button
            className="navbar__logout-btn"
            onClick={onLogout}
            title="Log Out"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
