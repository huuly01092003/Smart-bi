import React from 'react';

export const Table = ({
  data = [],
  columns = [],
  sortKey = null,
  sortAsc = true,
  onSort = () => {},
  loading = false,
  renderCell = (value, col) => String(value || '-').substring(0, 100)
}) => {
  if (!columns.length && data.length) {
    columns = Object.keys(data[0]);
  }

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col}
                onClick={() => onSort(col)}
                className={sortKey === col ? 'active' : ''}
                title={col}
              >
                {col} {sortKey === col && (sortAsc ? '↑' : '↓')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '20px' }}>
                {loading ? '⏳ Đang tải...' : '📭 Không có dữ liệu'}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td 
                    key={`${i}-${col}`}
                    title={String(row[col] || '-')}
                  >
                    {renderCell(row[col], col)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};