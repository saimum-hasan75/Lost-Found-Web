import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function EditItemModal({ item, categories, onClose, onUpdated }) {
  const [form, setForm] = useState({
    post_type: item?.post_type || 'lost',
    title: item?.title || '',
    category: item?.category || '',
    description: item?.description || '',
    location: item?.location || '',
    date_occurred: item?.date_occurred ? item.date_occurred.split('T')[0] : '',
    contact_name: item?.contact_name || '',
    contact_email: item?.contact_email || '',
    contact_phone: item?.contact_phone || '',
    image_url: item?.image_url || '',
    status: item?.status || 'open',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setForm({
        post_type: item.post_type || 'lost',
        title: item.title || '',
        category: item.category || '',
        description: item.description || '',
        location: item.location || '',
        date_occurred: item.date_occurred ? item.date_occurred.split('T')[0] : '',
        contact_name: item.contact_name || '',
        contact_email: item.contact_email || '',
        contact_phone: item.contact_phone || '',
        image_url: item.image_url || '',
        status: item.status || 'open',
      });
    }
  }, [item]);

  if (!item) return null;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const updated = await api.updateItem(item.id, form);
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update item.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-card--edit" onClick={(e) => e.stopPropagation()}>
        <div className="modal-card__header">
          <div>
            <span className="badge badge--pill badge--teal">Edit Post #{item.id}</span>
            <h2 className="modal-card__title" style={{ marginTop: '6px' }}>
              Modify Item Details
            </h2>
          </div>
          <button className="modal-card__close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form form--modal">
          {error && <div className="alert alert--error">{error}</div>}

          <div className="form__grid-2">
            <label className="form__field">
              <span>Post Type</span>
              <select
                value={form.post_type}
                onChange={(e) => update('post_type', e.target.value)}
                required
              >
                <option value="lost">Lost Item (I lost this)</option>
                <option value="found">Found Item (I found this)</option>
              </select>
            </label>

            <label className="form__field">
              <span>Status</span>
              <select
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
                required
              >
                <option value="open">Active / Open</option>
                <option value="resolved">Resolved / Recovered</option>
              </select>
            </label>
          </div>

          <label className="form__field">
            <span>Item Title</span>
            <input
              required
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. Navy blue backpack"
            />
          </label>

          <div className="form__grid-2">
            <label className="form__field">
              <span>Category</span>
              <select
                required
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
              >
                <option value="" disabled>Select category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="form__field">
              <span>Date</span>
              <input
                required
                type="date"
                value={form.date_occurred}
                onChange={(e) => update('date_occurred', e.target.value)}
              />
            </label>
          </div>

          <label className="form__field">
            <span>Location</span>
            <input
              required
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
              placeholder="e.g. Library, 2nd floor"
            />
          </label>

          <label className="form__field">
            <span>Description</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Color, brand, distinguishing marks..."
            />
          </label>

          <label className="form__field">
            <span>Photo URL (Optional)</span>
            <input
              value={form.image_url}
              onChange={(e) => update('image_url', e.target.value)}
              placeholder="https://images.unsplash.com/..."
            />
          </label>

          <div className="form__section-heading">Contact Information</div>

          <div className="form__grid-3">
            <label className="form__field">
              <span>Contact Name</span>
              <input
                required
                value={form.contact_name}
                onChange={(e) => update('contact_name', e.target.value)}
              />
            </label>

            <label className="form__field">
              <span>Email</span>
              <input
                required
                type="email"
                value={form.contact_email}
                onChange={(e) => update('contact_email', e.target.value)}
              />
            </label>

            <label className="form__field">
              <span>Phone (Optional)</span>
              <input
                value={form.contact_phone}
                onChange={(e) => update('contact_phone', e.target.value)}
              />
            </label>
          </div>

          <div className="modal-card__footer">
            <button
              type="button"
              className="btn btn--outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={saving}
            >
              {saving ? 'Saving Changes…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
