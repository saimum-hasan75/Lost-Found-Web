import React from 'react';
import ItemCard from './ItemCard';

export default function ItemGrid({
  items,
  loading,
  error,
  currentUser,
  onOpen,
  onEdit,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner" />
        <p>Fetching active reports…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert--error">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>Couldn't reach the board: {error}</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state__icon">🔍</span>
        <h3>No matching reports found</h3>
        <p>Try clearing your search or switching categories to find other items.</p>
      </div>
    );
  }

  return (
    <div className="items-grid">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          currentUser={currentUser}
          onOpen={onOpen}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
