import React, { useEffect, useState, useCallback } from 'react';
import Navbar from './components/Navbar';
import Filters from './components/Filters';
import ItemGrid from './components/ItemGrid';
import ItemForm from './components/ItemForm';
import ItemModal from './components/ItemModal';
import EditItemModal from './components/EditItemModal';
import ConfirmDialog from './components/ConfirmDialog';
import ProfileDashboard from './components/ProfileDashboard';
import AdminDashboard from './components/AdminDashboard';
import AuthPage from './components/AuthPage';
import Footer from './components/Footer';
import { api, getSavedUser, clearAuthSession } from './api';

export default function App() {
  //usestate hooks used kore application data store kora hoiche
  const [currentUser, setCurrentUser] = useState(getSavedUser());
  const [view, setView] = useState('board'); // 'board' | 'report-lost' | 'report-found' | 'profile' | 'admin'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [banner, setBanner] = useState('');

  // Modals
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [filters, setFilters] = useState({
    type: 'all',
    category: '',
    status: '',
    search: '',
  });

  const loadItems = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.getItems({
        type: filters.type === 'all' ? '' : filters.type,
        category: filters.category,
        status: filters.status,
        search: filters.search,
      });
      setItems(data);
    } catch (err) {
      setError(err.message || 'Could not load items.');
    } finally {
      setLoading(false);
    }
  }, [filters, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const timeout = setTimeout(loadItems, filters.search ? 300 : 0);
      return () => clearTimeout(timeout);
    }
  }, [loadItems, filters.search, currentUser]);

  useEffect(() => {
    if (currentUser) {
      api
        .getCategories()
        .then(setCategories)
        .catch(() => setCategories([]));
    }
  }, [currentUser]);

  function handleNavigate(next) {
    // If navigating to admin but user is not admin, ignore or redirect to board
    if (next === 'admin' && currentUser?.role !== 'admin') {
      setView('board');
      return;
    }
    setView(next);
    setBanner('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleLogout() {
    clearAuthSession();
    setCurrentUser(null);
    setView('board');
    setItems([]);
  }

  function handlePosted(newItem) {
    setBanner(
      newItem.post_type === 'lost'
        ? 'Your lost item report has been published. Hope it finds its way back soon!'
        : 'Thank you for reporting this found item! The owner will be notified.'
    );
    setView('board');
    loadItems();
  }

  function handleUpdated(updated) {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
    if (selectedItem && selectedItem.id === updated.id) {
      setSelectedItem(updated);
    }
    setBanner('Post details updated successfully.');
  }

  async function handleConfirmDelete() {
    if (!deletingItem) return;
    setDeleteLoading(true);
    try {
      await api.deleteItem(deletingItem.id);
      setItems((prev) => prev.filter((it) => it.id !== deletingItem.id));
      if (selectedItem && selectedItem.id === deletingItem.id) {
        setSelectedItem(null);
      }
      setDeletingItem(null);
      setBanner('Post has been deleted.');
    } catch (err) {
      window.alert(err.message || 'Failed to delete post.');
    } finally {
      setDeleteLoading(false);
    }
  }

  // Mandatory Login/Signup Screen
  if (!currentUser) {
    return <AuthPage onAuthSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="app">
      <Navbar
        onNavigate={handleNavigate}
        view={view}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {banner && (
        <div className="banner-container">
          <div className="banner">
            <span>✨ {banner}</span>
            <button
              className="banner-close"
              onClick={() => setBanner('')}
              aria-label="Dismiss banner"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* VIEW: BOARD */}
      {view === 'board' && (
        <main className="board-main">
          <section className="hero">
            <div className="hero__badge">🤝 Community Lost &amp; Found</div>
            <h1 className="hero__title">
              The hub where lost belongings <span>find their way home.</span>
            </h1>
            <p className="hero__sub">
              Search the community board for missing possessions, report items you've lost, or help a neighbor by logging what you found.
            </p>
            <div className="hero__actions">
              <button
                className="btn btn--primary btn--large"
                onClick={() => handleNavigate('report-lost')}
              >
                🔍 Report a Lost Item
              </button>
              <button
                className="btn btn--secondary btn--large"
                onClick={() => handleNavigate('report-found')}
              >
                🎁 Report a Found Item
              </button>
            </div>
          </section>

          <Filters
            filters={filters}
            onChange={setFilters}
            categories={categories}
            resultCount={items.length}
          />

          <ItemGrid
            items={items}
            loading={loading}
            error={error}
            currentUser={currentUser}
            onOpen={setSelectedItem}
            onEdit={setEditingItem}
            onDelete={setDeletingItem}
          />
        </main>
      )}

      {/* VIEW: REPORT LOST */}
      {view === 'report-lost' && (
        <ItemForm
          postType="lost"
          categories={categories}
          currentUser={currentUser}
          onPosted={handlePosted}
          onCancel={() => handleNavigate('board')}
        />
      )}

      {/* VIEW: REPORT FOUND */}
      {view === 'report-found' && (
        <ItemForm
          postType="found"
          categories={categories}
          currentUser={currentUser}
          onPosted={handlePosted}
          onCancel={() => handleNavigate('board')}
        />
      )}

      {/* VIEW: USER PROFILE DASHBOARD */}
      {view === 'profile' && (
        <ProfileDashboard
          currentUser={currentUser}
          onUserUpdated={(u) => setCurrentUser((prev) => ({ ...prev, ...u }))}
          onEditItem={setEditingItem}
          onDeleteItem={setDeletingItem}
          onViewItem={setSelectedItem}
          onNavigate={handleNavigate}
        />
      )}

      {/* VIEW: ADMIN DASHBOARD */}
      {view === 'admin' && (
        <AdminDashboard
          currentUser={currentUser}
          onEditItem={setEditingItem}
          onDeleteItem={setDeletingItem}
          onViewItem={setSelectedItem}
        />
      )}

      {/* ITEM DETAILS MODAL */}
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          currentUser={currentUser}
          onClose={() => setSelectedItem(null)}
          onUpdated={handleUpdated}
          onEdit={(it) => {
            setSelectedItem(null);
            setEditingItem(it);
          }}
          onDelete={(it) => {
            setSelectedItem(null);
            setDeletingItem(it);
          }}
        />
      )}

      {/* EDIT ITEM MODAL */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          categories={categories}
          onClose={() => setEditingItem(null)}
          onUpdated={handleUpdated}
        />
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        title="Delete Post"
        message={`Are you sure you want to remove "${deletingItem?.title}"? This cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        danger={true}
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingItem(null)}
      />

      <Footer />
    </div>
  );
}
