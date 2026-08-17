import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ProfileDashboard({
  currentUser,
  onUserUpdated,
  onEditItem,
  onDeleteItem,
  onViewItem,
  onNavigate,
}) {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    total_posts: 0,
    lost_count: 0,
    found_count: 0,
    resolved_count: 0,
  });
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'lost' | 'found' | 'resolved'
  const [search, setSearch] = useState('');

  // Editing profile state
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [meRes, itemsRes] = await Promise.all([
        api.getMe(),
        api.getMyItems(),
      ]);
      setProfile(meRes.user);
      setStats(meRes.stats);
      setMyItems(itemsRes);
      setEditName(meRes.user.name || '');
      setEditPhone(meRes.user.phone || '');
    } catch (err) {
      setError(err.message || 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg('');
    try {
      const updated = await api.updateMe({ name: editName, phone: editPhone });
      setProfile((prev) => ({ ...prev, ...updated }));
      if (onUserUpdated) onUserUpdated(updated);
      setProfileMsg('Profile updated successfully!');
      setEditingProfile(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleToggleStatus(item) {
    const next = item.status === 'resolved' ? 'open' : 'resolved';
    try {
      const updated = await api.updateStatus(item.id, next);
      setMyItems((prev) =>
        prev.map((it) => (it.id === updated.id ? updated : it))
      );
      // Reload stats
      const meRes = await api.getMe();
      setStats(meRes.stats);
    } catch (err) {
      window.alert(err.message || 'Failed to update status.');
    }
  }

  const filteredItems = myItems.filter((item) => {
    if (statusFilter === 'lost' && item.post_type !== 'lost') return false;
    if (statusFilter === 'found' && item.post_type !== 'found') return false;
    if (statusFilter === 'resolved' && item.status !== 'resolved') return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        item.title.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.location.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const initials = profile?.name
    ? profile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div className="dashboard-container">
      {/* Profile Header */}
      <div className="profile-header-card">
        <div className="profile-header-card__main">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-details">
            <div className="profile-title-row">
              <h1 className="profile-name">{profile?.name || currentUser?.name}</h1>
              <span className={`badge ${profile?.role === 'admin' ? 'badge--admin' : 'badge--user'}`}>
                {profile?.role === 'admin' ? 'Administrator' : 'Community Member'}
              </span>
            </div>
            <p className="profile-email">
              ✉️ {profile?.email || currentUser?.email}
              {profile?.phone && <span className="profile-phone"> · 📞 {profile.phone}</span>}
            </p>
          </div>
        </div>

        <div className="profile-header-card__actions">
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => setEditingProfile(!editingProfile)}
          >
            {editingProfile ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {profileMsg && <div className="alert alert--success">{profileMsg}</div>}
      {error && <div className="alert alert--error">{error}</div>}

      {/* Edit Profile Form Collapsible */}
      {editingProfile && (
        <form onSubmit={handleSaveProfile} className="profile-edit-box">
          <h3>Update Your Information</h3>
          <div className="form__grid-2">
            <label className="form__field">
              <span>Full Name</span>
              <input
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </label>
            <label className="form__field">
              <span>Phone Number</span>
              <input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="01700-000000"
              />
            </label>
          </div>
          <div className="form__actions">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={savingProfile}
            >
              {savingProfile ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Stats Counter Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--total">📋</div>
          <div className="stat-card__data">
            <span className="stat-card__value">{stats.total_posts}</span>
            <span className="stat-card__label">Total Reported</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--lost">🔍</div>
          <div className="stat-card__data">
            <span className="stat-card__value">{stats.lost_count}</span>
            <span className="stat-card__label">Lost Items</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--found">🎁</div>
          <div className="stat-card__data">
            <span className="stat-card__value">{stats.found_count}</span>
            <span className="stat-card__label">Found Items</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--resolved">✅</div>
          <div className="stat-card__data">
            <span className="stat-card__value">{stats.resolved_count}</span>
            <span className="stat-card__label">Resolved / Returned</span>
          </div>
        </div>
      </div>

      {/* My Posts Section */}
      <div className="section-card">
        <div className="section-card__header">
          <div>
            <h2 className="section-card__title">My Pinned Items</h2>
            <p className="section-card__subtitle">
              Manage your lost and found postings, edit details, update recovery status, or remove posts.
            </p>
          </div>
          <div className="section-card__cta-group">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => onNavigate('report-lost')}
            >
              + Report Lost
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => onNavigate('report-found')}
            >
              + Report Found
            </button>
          </div>
        </div>

        {/* Filters and search */}
        <div className="filter-toolbar">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${statusFilter === 'all' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All ({myItems.length})
            </button>
            <button
              className={`filter-tab ${statusFilter === 'lost' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('lost')}
            >
              Lost ({myItems.filter((i) => i.post_type === 'lost').length})
            </button>
            <button
              className={`filter-tab ${statusFilter === 'found' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('found')}
            >
              Found ({myItems.filter((i) => i.post_type === 'found').length})
            </button>
            <button
              className={`filter-tab ${statusFilter === 'resolved' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('resolved')}
            >
              Resolved ({myItems.filter((i) => i.status === 'resolved').length})
            </button>
          </div>

          <div className="filter-search-box">
            <input
              type="text"
              placeholder="Search your items…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-search"
            />
          </div>
        </div>

        {/* Item List / Grid */}
        {loading ? (
          <div className="empty-state">
            <div className="spinner" />
            <p>Loading your items…</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__icon">📭</span>
            <h3>No items found</h3>
            <p>
              {myItems.length === 0
                ? "You haven't reported any lost or found items yet."
                : 'No items match your current filter or search.'}
            </p>
            {myItems.length === 0 && (
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn--primary"
                  onClick={() => onNavigate('report-lost')}
                >
                  I Lost Something
                </button>
                <button
                  className="btn btn--secondary"
                  onClick={() => onNavigate('report-found')}
                >
                  I Found Something
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="my-items-grid">
            {filteredItems.map((item) => {
              const isLost = item.post_type === 'lost';
              const isResolved = item.status === 'resolved';

              return (
                <div
                  key={item.id}
                  className={`dashboard-item-card ${
                    isResolved ? 'dashboard-item-card--resolved' : ''
                  }`}
                >
                  <div className="dashboard-item-card__header">
                    <div className="dashboard-item-card__tags">
                      <span
                        className={`badge ${
                          isLost ? 'badge--lost' : 'badge--found'
                        }`}
                      >
                        {isLost ? 'LOST' : 'FOUND'}
                      </span>
                      <span className="badge badge--category">{item.category}</span>
                      <span
                        className={`badge ${
                          isResolved ? 'badge--resolved' : 'badge--open'
                        }`}
                      >
                        {isResolved ? '✓ Resolved' : '● Active'}
                      </span>
                    </div>

                    <div className="dashboard-item-card__actions">
                      <button
                        type="button"
                        className="btn-icon"
                        title="Edit Item"
                        onClick={() => onEditItem(item)}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="btn-icon btn-icon--danger"
                        title="Delete Item"
                        onClick={() => onDeleteItem(item)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div
                    className="dashboard-item-card__body"
                    onClick={() => onViewItem(item)}
                  >
                    <h3 className="dashboard-item-card__title">{item.title}</h3>
                    {item.description && (
                      <p className="dashboard-item-card__desc">
                        {item.description}
                      </p>
                    )}

                    <div className="dashboard-item-card__meta">
                      <span>📍 {item.location}</span>
                      <span>🗓 {formatDate(item.date_occurred)}</span>
                    </div>
                  </div>

                  <div className="dashboard-item-card__footer">
                    <button
                      type="button"
                      className={`btn btn--sm ${
                        isResolved ? 'btn--outline' : 'btn--success'
                      }`}
                      onClick={() => handleToggleStatus(item)}
                    >
                      {isResolved ? 'Mark as Open' : '✓ Mark as Resolved'}
                    </button>
                    <button
                      type="button"
                      className="btn btn--sm btn--outline"
                      onClick={() => onViewItem(item)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
