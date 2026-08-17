import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function ItemForm({ postType, categories, currentUser, onPosted, onCancel }) {
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    location: '',
    date_occurred: new Date().toISOString().split('T')[0],
    contact_name: currentUser?.name || '',
    contact_email: currentUser?.email || '',
    contact_phone: currentUser?.phone || '',
    image_url: '',
  });

  useEffect(() => {
    if (currentUser) {
      setForm((prev) => ({
        ...prev,
        contact_name: prev.contact_name || currentUser.name || '',
        contact_email: prev.contact_email || currentUser.email || '',
        contact_phone: prev.contact_phone || currentUser.phone || '',
      }));
    }
  }, [currentUser]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isLost = postType === 'lost';

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const created = await api.createItem({ ...form, post_type: postType });
      onPosted(created);
    } catch (err) {
      setError(err.message || 'Could not pin this item. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="form-page-container">
      <div className={`form-card-container form-card-container--${postType}`}>
        <div className="form-card-header">
          <span className={`badge ${isLost ? 'badge--lost' : 'badge--found'}`}>
            {isLost ? '🔍 Report Lost Item' : '🎁 Report Found Item'}
          </span>
          <h2 className="form-card-title">
            {isLost ? 'What did you lose?' : 'What did you find?'}
          </h2>
          <p className="form-card-sub">
            {isLost
              ? 'Provide as much detail as possible to help the community identify and return your item.'
              : 'Thank you for looking out for someone! Please provide key details to reunite it with its rightful owner.'}
          </p>
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <label className="form__field">
            <span>Item Title *</span>
            <input
              required
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder={
                isLost
                  ? 'e.g. Navy Blue Jansport Backpack'
                  : 'e.g. Set of 4 Keys with Red Tag'
              }
            />
          </label>

          <div className="form__grid-2">
            <label className="form__field">
              <span>Category *</span>
              <select
                required
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
              >
                <option value="" disabled>
                  Select a category
                </option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="form__field">
              <span>Date {isLost ? 'Lost' : 'Found'} *</span>
              <input
                required
                type="date"
                value={form.date_occurred}
                onChange={(e) => update('date_occurred', e.target.value)}
              />
            </label>
          </div>

          <label className="form__field">
            <span>Location {isLost ? 'Last Seen' : 'Found'} *</span>
            <input
              required
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
              placeholder="e.g. Main Library, 2nd Floor Study Room"
            />
          </label>

          <label className="form__field">
            <span>Description</span>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Color, brand, identifying marks, serial numbers, what was inside..."
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

          <div className="form__section-heading">Contact Details</div>

          <div className="form__grid-3">
            <label className="form__field">
              <span>Your Name *</span>
              <input
                required
                value={form.contact_name}
                onChange={(e) => update('contact_name', e.target.value)}
              />
            </label>

            <label className="form__field">
              <span>Contact Email *</span>
              <input
                required
                type="email"
                value={form.contact_email}
                onChange={(e) => update('contact_email', e.target.value)}
              />
            </label>

            <label className="form__field">
              <span>Phone Number (Optional)</span>
              <input
                value={form.contact_phone}
                onChange={(e) => update('contact_phone', e.target.value)}
                placeholder="01700-000000"
              />
            </label>
          </div>

          <div className="form__footer-actions">
            {onCancel && (
              <button
                type="button"
                className="btn btn--outline"
                onClick={onCancel}
                disabled={submitting}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className={`btn btn--${postType} btn--large`}
              disabled={submitting}
            >
              {submitting
                ? 'Publishing…'
                : isLost
                ? '📌 Pin Lost Item Report'
                : '📌 Pin Found Item Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
