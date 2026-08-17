import React, { useState } from 'react';
import { api } from '../api';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ItemModal({
  item,
  currentUser,
  onClose,
  onUpdated,
  onEdit,
  onDelete,
}) {
  const [busy, setBusy] = useState(false);
  const isLost = item.post_type === 'lost';
  const isResolved = item.status === 'resolved';
  const isOwner = currentUser && item.user_id === currentUser.id;
  const isAdmin = currentUser && currentUser.role === 'admin';
  const canManage = isOwner || isAdmin;

  async function handleToggleStatus() {
    setBusy(true);
    try {
      const next = isResolved ? 'open' : 'resolved';
      const updated = await api.updateStatus(item.id, next);
      onUpdated(updated);
    } catch (err) {
      window.alert(err.message || 'Could not update status.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal-card modal-card--${item.post_type}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-card__header">
          <div className="modal-card__tags">
            <span className={`badge ${isLost ? 'badge--lost' : 'badge--found'}`}>
              {isLost ? 'LOST ITEM' : 'FOUND ITEM'}
            </span>
            <span className="badge badge--category">{item.category}</span>
            <span
              className={`badge ${
                isResolved ? 'badge--resolved' : 'badge--open'
              }`}
            >
              {isResolved ? '✓ Resolved' : '● Active Open'}
            </span>
          </div>

          <button
            className="modal-card__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <h2 className="modal-card__title">{item.title}</h2>

        {item.image_url && (
          <div className="modal-card__image-wrap">
            <img
              className="modal-card__image"
              src={item.image_url}
              alt={item.title}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {item.description && (
          <div className="modal-card__desc-box">
            <p className="modal-card__desc">{item.description}</p>
          </div>
        )}

        <div className="modal-card__facts-grid">
          <div className="fact-item">
            <span className="fact-item__label">📍 Location</span>
            <span className="fact-item__val">{item.location}</span>
          </div>
          <div className="fact-item">
            <span className="fact-item__label">🗓 Date Occurred</span>
            <span className="fact-item__val">{formatDate(item.date_occurred)}</span>
          </div>
          <div className="fact-item">
            <span className="fact-item__label">📌 Status</span>
            <span className="fact-item__val">
              {isResolved ? 'Resolved / Found' : 'Still Active'}
            </span>
          </div>
        </div>

        <div className="modal-card__contact">
          <h3>Contact {item.contact_name}</h3>
          <div className="contact-links">
            <a
              href={`mailto:${item.contact_email}`}
              className="contact-pill"
            >
              ✉️ {item.contact_email}
            </a>
            {item.contact_phone && (
              <a
                href={`tel:${item.contact_phone}`}
                className="contact-pill"
              >
                📞 {item.contact_phone}
              </a>
            )}
          </div>
        </div>

        <div className="modal-card__action-bar">
          <div className="action-bar__left">
            {canManage && (
              <>
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => {
                    onClose();
                    onEdit(item);
                  }}
                >
                  ✏️ Edit Post
                </button>
                <button
                  type="button"
                  className="btn btn--danger btn--sm"
                  onClick={() => {
                    onClose();
                    onDelete(item);
                  }}
                >
                  🗑️ Delete Post
                </button>
              </>
            )}
          </div>

          <div className="action-bar__right">
            <button
              type="button"
              className={`btn btn--sm ${
                isResolved ? 'btn--outline' : 'btn--success'
              }`}
              onClick={handleToggleStatus}
              disabled={busy}
            >
              {busy
                ? 'Updating…'
                : isResolved
                ? 'Reopen as Active'
                : '✓ Mark as Resolved'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
