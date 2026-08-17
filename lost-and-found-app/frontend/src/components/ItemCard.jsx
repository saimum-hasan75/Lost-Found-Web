import React from 'react';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ItemCard({
  item,
  currentUser,
  onOpen,
  onEdit,
  onDelete,
}) {
  const isLost = item.post_type === 'lost';
  const isResolved = item.status === 'resolved';
  const isOwner = currentUser && item.user_id === currentUser.id;
  const isAdmin = currentUser && currentUser.role === 'admin';
  const canManage = isOwner || isAdmin;

  return (
    <div
      className={`item-card item-card--${item.post_type} ${
        isResolved ? 'item-card--resolved' : ''
      }`}
      onClick={() => onOpen(item)}
    >
      <div className="item-card__header">
        <div className="item-card__tags">
          <span className={`badge ${isLost ? 'badge--lost' : 'badge--found'}`}>
            {isLost ? 'LOST' : 'FOUND'}
          </span>
          <span className="badge badge--category">{item.category}</span>
          {isResolved && (
            <span className="badge badge--resolved">✓ Resolved</span>
          )}
        </div>

        {canManage && (
          <div
            className="item-card__actions"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="btn-icon"
              title="Edit Item"
              onClick={() => onEdit(item)}
            >
              ✏️
            </button>
            <button
              type="button"
              className="btn-icon btn-icon--danger"
              title="Delete Item"
              onClick={() => onDelete(item)}
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {item.image_url && (
        <div className="item-card__media">
          <img
            src={item.image_url}
            alt={item.title}
            onError={(e) => {
              e.currentTarget.parentElement.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="item-card__body">
        <h3 className="item-card__title">{item.title}</h3>
        {item.description && (
          <p className="item-card__desc">{item.description}</p>
        )}
      </div>

      <div className="item-card__meta">
        <span>📍 {item.location}</span>
        <span>🗓 {formatDate(item.date_occurred)}</span>
      </div>

      {item.user_name && (
        <div className="item-card__author">
          <small>Posted by: {isOwner ? 'You' : item.user_name}</small>
        </div>
      )}
    </div>
  );
}
