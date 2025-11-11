import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useTable } from '../hooks/useTable';
import { useFilter } from '../hooks/useFilter';
import { Table } from '../components/Table';

export const DSKHSheet = () => {
  const api = useApi();
  const [data, setData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});
  const [analytics, setAnalytics] = useState({});
  const [columnVisibility, setColumnVisibility] = useState({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const table = useTable(data, 100);
  const filter = useFilter({});

  // Các cột dùng để filter (các cột chính)
  const FILTER_COLUMNS = [
    'Trạng thái',
    'Mã khách hàng',
    'Tên phường xã',
    'Quận/huyện',
    'Kênh',
    'Mã nhân viên phụ trách'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.fetchDskhData();
      const dskhData = res.data || [];
      const allColumns = res.columns || [];

      setAllData(dskhData);
      setData(dskhData);
      setColumns(allColumns);
      setFilterOptions(res.filters || {});

      // Mặc định hiển thị tất cả cột
      const visibility = {};
      allColumns.forEach(col => {
        visibility[col] = true;
      });
      setColumnVisibility(visibility);

      // Calculate analytics
      calculateAnalytics(dskhData);
    } catch (e) {
      console.error('Error loading DSKH data:', e);
    }
  };

  const calculateAnalytics = (dskhData) => {
    try {
      // Count by Trang thái
      const trangThaiCount = {};
      dskhData.forEach(row => {
        const status = row['Trang thái'] || 'Không xác định';
        trangThaiCount[status] = (trangThaiCount[status] || 0) + 1;
      });

      // Count by Quận/huyện (top 10)
      const districtCount = {};
      dskhData.forEach(row => {
        const district = row['Quận/huyện'] || 'Không xác định';
        districtCount[district] = (districtCount[district] || 0) + 1;
      });

      const sortedDistricts = Object.entries(districtCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

      setAnalytics({
        totalRows: dskhData.length,
        trangThai: trangThaiCount,
        topDistricts: sortedDistricts,
        totalColumns: Object.keys(dskhData[0] || {}).length
      });
    } catch (e) {
      console.error('Error calculating analytics:', e);
    }
  };

  const handleFilter = async () => {
    try {
      const filtered = await api.filterDskh(filter.filters);
      setData(filtered);
      filter.applyFilters();
    } catch (e) {
      console.error('Error filtering:', e);
    }
  };

  const handleReset = async () => {
    filter.resetFilters();
    setData(allData);
    loadData();
  };

  const toggleColumn = (col) => {
    setColumnVisibility(prev => ({
      ...prev,
      [col]: !prev[col]
    }));
  };

  const toggleAllColumns = () => {
    const allVisible = Object.values(columnVisibility).every(v => v);
    const newVisibility = {};
    columns.forEach(col => {
      newVisibility[col] = !allVisible;
    });
    setColumnVisibility(newVisibility);
  };

  const visibleColumns = columns.filter(col => columnVisibility[col]);

  const formatCell = (value, col) => {
    if (!value && value !== 0) return '-';
    let str = String(value);
    // Cắt ngắn text nếu quá dài (50 ký tự)
    if (str.length > 50) {
      return str.substring(0, 50) + '...';
    }
    return str;
  };

  return (
    <div className="sheet">
      {/* Info */}
      <div className="info-bar">
        <span>📊 Tổng: {analytics.totalRows || 0} dòng | {analytics.totalColumns || 0} cột</span>
        {analytics.trangThai && (
          <>
            {Object.entries(analytics.trangThai).slice(0, 3).map(([status, count]) => (
              <span key={status} style={{ marginLeft: '20px' }}>
                {status}: <strong>{count}</strong>
              </span>
            ))}
          </>
        )}
      </div>

      {/* Filters */}
      <div className="filter-panel-advanced">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>🔍 Bộ lọc</h3>
          <button 
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            className="btn"
            style={{ width: 'auto', padding: '8px 12px', fontSize: '12px' }}
          >
            {showColumnSelector ? '✓ Xong' : '⚙️ Chọn cột'}
          </button>
        </div>

        {/* Column Selector */}
        {showColumnSelector && (
          <div className="column-selector">
            <div className="column-selector-header">
              <button 
                onClick={toggleAllColumns}
                className="btn"
                style={{ width: '100%', marginBottom: '12px' }}
              >
                {Object.values(columnVisibility).every(v => v) ? '❌ Bỏ tất cả' : '✅ Chọn tất cả'}
              </button>
            </div>
            <div className="column-grid">
              {columns.map(col => (
                <label key={col} className="column-checkbox">
                  <input
                    type="checkbox"
                    checked={columnVisibility[col] || false}
                    onChange={() => toggleColumn(col)}
                  />
                  <span>{col}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Filter Inputs */}
        <div className="filter-grid-advanced">
          {FILTER_COLUMNS.filter(col => columns.includes(col)).map(col => (
            <div key={col} className="filter-item">
              <label>{col}</label>
              {filterOptions[col] && filterOptions[col].length > 0 && filterOptions[col].length <= 50 ? (
                <select
                  value={filter.filters[col] || 'all'}
                  onChange={(e) => filter.updateFilter(col, e.target.value)}
                  className="input"
                >
                  <option value="all">Tất cả</option>
                  {filterOptions[col].map(val => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={filter.filters[col] || ''}
                  onChange={(e) => filter.updateFilter(col, e.target.value)}
                  placeholder={`Tìm ${col}...`}
                  className="input"
                />
              )}
            </div>
          ))}
        </div>

        <div className="filter-actions">
          <button onClick={handleFilter} className="btn" disabled={api.loading}>
            {api.loading ? '⏳' : '🔍'} Áp dụng
          </button>
          <button onClick={handleReset} className="btn">🔄 Reset</button>
        </div>
      </div>

      {/* Table */}
      <div className="table-section">
        <div className="table-info-bar">
          <span>📋 Hiển thị {table.paginated.length} / {data.length} dòng ({visibleColumns.length} cột)</span>
        </div>

        <Table
          data={table.paginated}
          columns={visibleColumns}
          sortKey={table.sortKey}
          sortAsc={table.sortAsc}
          onSort={table.handleSort}
          loading={api.loading}
          renderCell={formatCell}
        />
      </div>

      {/* Pagination */}
      {table.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => table.setPage(p => Math.max(1, p - 1))}
            disabled={table.page === 1}
            className="btn"
          >
            ← Trước
          </button>
          <span>Trang {table.page} / {table.totalPages}</span>
          <button
            onClick={() => table.setPage(p => Math.min(table.totalPages, p + 1))}
            disabled={table.page === table.totalPages}
            className="btn"
          >
            Sau →
          </button>
          
          <select 
            value={table.pageSize}
            onChange={(e) => table.setPageSize(parseInt(e.target.value))}
            className="input"
            style={{ width: '100px' }}
          >
            <option value={50}>50/trang</option>
            <option value={100}>100/trang</option>
            <option value={200}>200/trang</option>
            <option value={500}>500/trang</option>
          </select>
        </div>
      )}

      {/* Analytics */}
      {analytics.topDistricts && analytics.topDistricts.length > 0 && (
        <div className="analytics">
          <h2>📈 Phân tích DSKH</h2>
          
          <div className="analysis-grid">
            <div className="analysis-card">
              <h3>Top 10 Quận/Huyện</h3>
              <div className="analysis-list">
                {analytics.topDistricts.map((item, i) => (
                  <div key={i} className="analysis-item">
                    <span>{item.name}</span>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="analysis-card">
              <h3>Trạng thái</h3>
              <div className="analysis-list">
                {Object.entries(analytics.trangThai || {}).map(([status, count]) => (
                  <div key={status} className="analysis-item">
                    <span>{status}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};