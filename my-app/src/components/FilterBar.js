import React from 'react';

export const FilterBar = ({
  filters = {},
  filterOptions = {},
  onFilterChange = () => {},
  onApply = () => {},
  onReset = () => {},
  loading = false,
  displayFields = []
}) => {
  return (
    <div className="filter-bar">
      {displayFields.map(field => (
        <div key={field} className="filter-item">
          {/* Nếu có filterOptions thì dùng select, không thì dùng input */}
          {filterOptions[field] && filterOptions[field].length > 0 ? (
            <>
              <label>{field}</label>
              <select
                value={filters[field] || 'all'}
                onChange={(e) => onFilterChange(field, e.target.value)}
                className="input"
              >
                <option value="all">Tất cả</option>
                {filterOptions[field].slice(0, 50).map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </>
          ) : (
            <>
              <label>{field}</label>
              <input
                type="text"
                value={filters[field] || ''}
                onChange={(e) => onFilterChange(field, e.target.value)}
                placeholder={`Tìm kiếm ${field}...`}
                className="input"
              />
            </>
          )}
        </div>
      ))}

      <div className="filter-actions">
        <button onClick={onApply} className="btn" disabled={loading}>
          {loading ? '⏳' : '🔍'} Áp dụng
        </button>
        <button onClick={onReset} className="btn">🔄 Reset</button>
      </div>
    </div>
  );
};