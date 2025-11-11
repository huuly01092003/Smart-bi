import React from 'react';

export const Stats = ({ data = {} }) => {
  const statItems = [
    { key: 'vip', label: 'VIP', type: 'vip' },
    { key: 'high', label: 'High', type: 'high' },
    { key: 'medium', label: 'Medium', type: 'medium' },
    { key: 'low', label: 'Low', type: 'low' },
    { key: 'total_rows', label: 'Tổng dòng', type: 'default' },
    { key: 'total_tb', label: 'Tổng doanh số', type: 'default', format: 'number' }
  ];

  return (
    <div className="stats">
      {statItems.map(item => (
        <div key={item.key} className={`stat-box ${item.type}`}>
          <span>{item.label}</span>
          <strong>
            {item.format === 'number'
              ? (data[item.key] || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 })
              : (data[item.key] || 0)
            }
          </strong>
        </div>
      ))}
    </div>
  );
};