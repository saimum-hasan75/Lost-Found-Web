import React from 'react';

export default function Filters({
  filters,
  onChange,
  categories,
  resultCount,
}) {
  return (
    <div className="filters">
      <div className="filters__tabs">
        {['all', 'lost', 'found'].map((t) => (
          <button
            key={t}
            className={`filters__tab ${
              filters.type === t ? 'is-active' : ''
            }`}
            onClick={() => onChange({ ...filters, type: t })}
          >
            {t === 'all' ? 'All Posts' : t === 'lost' ? 'Lost' : 'Found'}
          </button>
        ))}
      </div>

      <div className="filters__row">
        <input
          type="search"
          className="filters__search"
          placeholder="Search by item, location, keyword…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />

        <select
          className="filters__select"
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className="filters__select"
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
        >
          <option value="">Open &amp; resolved</option>
          <option value="open">Still open</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <p className="filters__count">
        {resultCount} {resultCount === 1 ? 'post' : 'posts'} pinned to the
        board
      </p>
    </div>
  );
}
