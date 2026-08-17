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

export default function AdminDashboard({
  currentUser,
  onEditItem,
  onDeleteItem,
  onViewItem,
}) {
  const [tab, setTab] = useState('items'); // 'items' | 'users'
  const [stats, setStats] = useState({
    total_items: 0,
    total_lost: 0,
    total_found: 0,
    total_resolved: 0,
    total_open: 0,
    resolution_rate: 0,
    total_users: 0,
    total_admins: 0,
    total_regular_users: 0,
  });
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [itemSearch, setItemSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, itemsRes, usersRes] = await Promise.all([
        api.getAdminStats(),
        api.getItems(),
        api.getUsers(),
      ]);
      setStats(statsRes);
      setItems(itemsRes);
      setUsers(usersRes);
    } catch (err) {
      setError(err.message || 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleToggleStatus(item) {
    const next = item.status === 'resolved' ? 'open' : 'resolved';
    try {
      const updated = await api.updateStatus(item.id, next);
      setItems((prev) =>
        prev.map((it) => (it.id === updated.id ? updated : it))
      );
      // Reload stats
      const statsRes = await api.getAdminStats();
      setStats(statsRes);
    } catch (err) {
      window.alert(err.message || 'Failed to update status.');
    }
  }

  async function handleDeleteUserConfirm(userId) {
    if (!window.confirm('Are you sure you want to remove this user? Their items will remain but become unassigned.')) {
      return;
    }
    try {
      await api.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setSuccessMsg('User removed successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
      const statsRes = await api.getAdminStats();
      setStats(statsRes);
    } catch (err) {
      window.alert(err.message || 'Failed to delete user.');
    }
  }

  const filteredItems = items.filter((item) => {
    if (typeFilter !== 'all' && item.post_type !== typeFilter) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (itemSearch) {
      const q = itemSearch.toLowerCase();
      const match =
        item.title.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.location.toLowerCase().includes(q) ||
        (item.user_name && item.user_name.toLowerCase().includes(q)) ||
        (item.user_email && item.user_email.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const filteredUsers = users.filter((u) => {
    if (userSearch) {
      const q = userSearch.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="dashboard-container">
      {/* Admin Header */}
      <div className="admin-header-card">
        <div className="admin-header-card__info">
          <div className="badge badge--admin">🛡️ System Administration</div>
          <h1 className="admin-header-card__title">Admin Control Hub</h1>
          <p className="admin-header-card__subtitle">
            System-wide oversight: monitor all pinned reports, manage registered users, and edit or moderate content.
          </p>
        </div>
      </div>

      {successMsg && <div className="alert alert--success">{successMsg}</div>}
      {error && <div className="alert alert--error">{error}</div>}

      {/* KPI Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--total">📊</div>
          <div className="stat-card__data">
            <span className="stat-card__value">{stats.total_items}</span>
            <span className="stat-card__label">Total Postings</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--lost">🔍</div>
          <div className="stat-card__data">
            <span className="stat-card__value">{stats.total_lost}</span>
            <span className="stat-card__label">Lost Items ({stats.total_items > 0 ? Math.round((stats.total_lost / stats.total_items) * 100) : 0}%)</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--found">🎁</div>
          <div className="stat-card__data">
            <span className="stat-card__value">{stats.total_found}</span>
            <span className="stat-card__label">Found Items</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--resolved">🏆</div>
          <div className="stat-card__data">
            <span className="stat-card__value">{stats.resolution_rate}%</span>
            <span className="stat-card__label">Resolution Rate ({stats.total_resolved} solved)</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--users">👥</div>
          <div className="stat-card__data">
            <span className="stat-card__value">{stats.total_users}</span>
            <span className="stat-card__label">Registered Users</span>
          </div>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab ${tab === 'items' ? 'is-active' : ''}`}
          onClick={() => setTab('items')}
        >
          📋 Manage All Postings ({items.length})
        </button>
        <button
          type="button"
          className={`admin-tab ${tab === 'users' ? 'is-active' : ''}`}
          onClick={() => setTab('users')}
        >
          👥 Manage Users ({users.length})
        </button>
      </div>

      {/* TAB 1: ALL POSTINGS */}
      {tab === 'items' && (
        <div className="section-card">
          <div className="filter-toolbar">
            <div className="filter-tabs">
              <button
                className={`filter-tab ${typeFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => setTypeFilter('all')}
              >
                All Types
              </button>
              <button
                className={`filter-tab ${typeFilter === 'lost' ? 'is-active' : ''}`}
                onClick={() => setTypeFilter('lost')}
              >
                Lost Only
              </button>
              <button
                className={`filter-tab ${typeFilter === 'found' ? 'is-active' : ''}`}
                onClick={() => setTypeFilter('found')}
              >
                Found Only
              </button>
            </div>

            <div className="filter-select-group">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-select"
              >
                <option value="all">All Statuses</option>
                <option value="open">Active / Open</option>
                <option value="resolved">Resolved</option>
              </select>

              <input
                type="text"
                placeholder="Search postings by title, location, author…"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                className="input-search"
                style={{ minWidth: '240px' }}
              />
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="spinner" />
              <p>Loading items…</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state__icon">🔍</span>
              <h3>No items match criteria</h3>
              <p>Try adjusting your search terms or filters.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Title &amp; Category</th>
                    <th>Location &amp; Date</th>
                    <th>Reported By</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const isLost = item.post_type === 'lost';
                    const isResolved = item.status === 'resolved';

                    return (
                      <tr key={item.id}>
                        <td>
                          <span
                            className={`badge ${
                              isLost ? 'badge--lost' : 'badge--found'
                            }`}
                          >
                            {isLost ? 'LOST' : 'FOUND'}
                          </span>
                        </td>
                        <td>
                          <div className="table-title-cell">
                            <strong>{item.title}</strong>
                            <span className="table-sub">{item.category}</span>
                          </div>
                        </td>
                        <td>
                          <div className="table-meta-cell">
                            <span>📍 {item.location}</span>
                            <small>🗓 {formatDate(item.date_occurred)}</small>
                          </div>
                        </td>
                        <td>
                          <div className="table-user-cell">
                            <span>{item.user_name || item.contact_name}</span>
                            <small>{item.user_email || item.contact_email}</small>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              isResolved ? 'badge--resolved' : 'badge--open'
                            }`}
                          >
                            {isResolved ? '✓ Resolved' : '● Open'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="btn btn--xs btn--outline"
                              onClick={() => handleToggleStatus(item)}
                              title="Toggle Status"
                            >
                              {isResolved ? 'Reopen' : 'Resolve'}
                            </button>
                            <button
                              type="button"
                              className="btn btn--xs btn--outline"
                              onClick={() => onEditItem(item)}
                              title="Edit item details"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn--xs btn--danger"
                              onClick={() => onDeleteItem(item)}
                              title="Delete item from board"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {tab === 'users' && (
        <div className="section-card">
          <div className="filter-toolbar">
            <h2 className="section-card__title" style={{ margin: 0 }}>
              Registered Community Members
            </h2>
            <div className="filter-search-box">
              <input
                type="text"
                placeholder="Search users by name, email, phone…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="input-search"
                style={{ minWidth: '240px' }}
              />
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state__icon">👥</span>
              <h3>No users found</h3>
              <p>No user matched your search criteria.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Posts</th>
                    <th>Joined</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    const isAdmin = u.role === 'admin';

                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="table-user-row">
                            <span className="avatar-sm">
                              {u.name ? u.name.slice(0, 2).toUpperCase() : 'U'}
                            </span>
                            <strong>{u.name} {isSelf && <small className="text-muted">(You)</small>}</strong>
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td>{u.phone || '—'}</td>
                        <td>
                          <span className={`badge ${isAdmin ? 'badge--admin' : 'badge--user'}`}>
                            {isAdmin ? '🛡️ Admin' : '👤 User'}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge--category">{u.item_count || 0} posts</span>
                        </td>
                        <td>{formatDate(u.created_at)}</td>
                        <td style={{ textAlign: 'right' }}>
                          {!isSelf && (
                            <button
                              type="button"
                              className="btn btn--xs btn--danger"
                              onClick={() => handleDeleteUserConfirm(u.id)}
                            >
                              Remove User
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
