import React, { useEffect, useState, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { useTable } from '../hooks/useTable';
import { useFilter } from '../hooks/useFilter';
import { FilterBar } from '../components/FilterBar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import './ChiTietTuyen.css';

const FILTER_FIELDS = ['MaKhachHang', 'TenNhanVienGoiY', 'KenhHang'];
const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#82ca9d', '#ffc658'];

export const ChiTietTuyenSheet = () => {
  const api = useApi();
  const [allData, setAllData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [groupedColumns, setGroupedColumns] = useState({});
  const [filterOptions, setFilterOptions] = useState({});
  const [analytics, setAnalytics] = useState({});
  const [chartData, setChartData] = useState({
    loTrinhDays: [],
    kenhHang: [],
    tanSuatDMSWeeks: [],
    tanSuatGoiYWeeks: []
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const table = useTable(displayData, 50);
  const filter = useFilter({});

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        console.log('Loading Chi tiết tuyến data...');
        const [dataRes, analyticsRes] = await Promise.all([
          api.fetchChiTietData(),
          api.fetchChiTietAnalytics()
        ]);
        
        if (!isMounted) return;

        const chitietData = dataRes.data || [];
        setAllData(chitietData);
        setDisplayData(chitietData);
        setGroupedColumns(dataRes.grouped_columns || {});
        setFilterOptions(dataRes.filters || {});
        setAnalytics(analyticsRes || {});
        
        generateCharts(analyticsRes);
        
        console.log('Chi tiết tuyến loaded:', {
          rows: chitietData.length,
          columns: dataRes.columns?.length || 0,
        });
      } catch (e) {
        console.error('Error loading Chi tiết tuyến:', e);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const generateCharts = (analyticsData) => {
    if (!analyticsData) return;

    // Bar: Tổng lộ trình theo ngày (T2-T7)
    const loTrinhData = Object.entries(analyticsData?.tan_suat_theo_ngay || {})
      .map(([day, value]) => ({ day, value }))
      .sort((a, b) => {
        const order = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        return order.indexOf(a.day) - order.indexOf(b.day);
      });
    setChartData(prev => ({ ...prev, loTrinhDays: loTrinhData }));

    // Pie: Kênh hàng
    const kenhData = Object.entries(analyticsData?.kenh_hang || {})
      .map(([name, value]) => ({ name, value }));
    setChartData(prev => ({ ...prev, kenhHang: kenhData }));

    // Line: Tần suất DMS theo tuần (W1-W4)
    const dmWeeksData = Object.entries(analyticsData?.tan_suat_dms_theo_tuan || {})
      .map(([week, value]) => ({ week, value }))
      .sort((a, b) => a.week.localeCompare(b.week));
    setChartData(prev => ({ ...prev, tanSuatDMSWeeks: dmWeeksData }));

    // Line: Tần suất Gợi ý theo tuần (W1-W4)
    const gyWeeksData = Object.entries(analyticsData?.tan_suat_goi_y_theo_tuan || {})
      .map(([week, value]) => ({ week, value }))
      .sort((a, b) => a.week.localeCompare(b.week));
    setChartData(prev => ({ ...prev, tanSuatGoiYWeeks: gyWeeksData }));
  };

  const handleApplyFilter = useCallback(() => {
    console.log('Applying filters...');
    const params = filter.getFilterParams();
    
    if (Object.keys(params).length === 0) {
      setDisplayData(allData);
      table.setPage(1);
      console.log('No filters, showing all data:', allData.length);
      return;
    }

    let filtered = allData;
    Object.entries(params).forEach(([key, value]) => {
      filtered = filtered.filter(row => {
        const cellValue = String(row[key] || '').toLowerCase();
        return cellValue.includes(String(value).toLowerCase());
      });
    });

    setDisplayData(filtered);
    table.setPage(1);
    console.log(`Filtered to ${filtered.length} rows`);
  }, [filter, allData, table]);

  const handleResetFilter = useCallback(() => {
    console.log('Resetting filters...');
    filter.resetFilters();
    setDisplayData(allData);
    table.setPage(1);
  }, [filter, allData, table]);

  const formatCellValue = (col, value) => {
    // Format Lo Trinh DMS & Tan Suat DMS: 1 -> 'X', 0 -> '-'
    if ((col.includes('LoTrinhDMS') || col.includes('TanSuatDMS')) && value !== null) {
      return value === 1 || value === '1' ? 'X' : '-';
    }
    
    // Format W*_TanSuatGoiY_Mapping: 1 -> 'X', 0 -> '-'
    if (col.includes('TanSuatGoiY_Mapping') && value !== null) {
      return value === 1 || value === '1' ? 'X' : '-';
    }
    
    // Default: show value or '-'
    return value || '-';
  };

  const renderGroupedTable = () => {
    if (!displayData.length) {
      return (
        <div className="table-wrapper-grouped" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
          No data
        </div>
      );
    }

    return (
      <div className="table-wrapper-grouped">
        <table className="grouped-table">
          <thead>
            <tr className="header-row-1">
              <th colSpan={groupedColumns.base?.length || 4}>Info</th>
              <th colSpan={groupedColumns.lo_trinh_dms?.length || 6}>LO TRINH DMS (GS sửa trực tiếp ở day)</th>
              <th colSpan={groupedColumns.tan_suat_dms?.length || 4}>TAN SUAT DMS</th>
              <th colSpan={groupedColumns.tan_suat_goi_y?.length || 7}>TAN SUAT GOI Y (GS sửa ở day)</th>
              <th colSpan={groupedColumns.mapping?.length || 7}>Mapping</th>
            </tr>
            
            <tr className="header-row-2">
              {groupedColumns.base?.map(col => (
                <th key={col} title={col}>
                  {col === 'STT' ? 'STT' :
                   col === 'MaKhachHang' ? 'Mã khách hàng' :
                   col === 'TenKhachHang' ? 'Tên khách hàng' :
                   col === 'DiaChi' ? 'Địa chỉ' : col}
                </th>
              ))}
              
              {groupedColumns.lo_trinh_dms?.map(col => (
                <th key={col} title={col}>
                  {col.replace('_LoTrinhDMS', '')}
                </th>
              ))}
              
              {groupedColumns.tan_suat_dms?.map(col => (
                <th key={col} title={col}>
                  {col.replace('_TanSuatDMS', '')}
                </th>
              ))}
              
              {groupedColumns.tan_suat_goi_y?.map(col => (
                <th key={col} title={col}>
                  {col === 'MaNhanVienGoiY' ? 'Ma Nhan vien' : 
                   col === 'TenNhanVienGoiY' ? 'Ten Nhan vien' :
                   col === 'TanSuatGoiYValue' ? 'Tan suat goi y' :
                   col.replace('_TanSuatGoiY_Mapping', '')}
                </th>
              ))}
              
              {groupedColumns.mapping?.map(col => (
                <th key={col} title={col}>
                  {col === 'TanSuatGoiY' ? 'Tan suat goi y' :
                   col === 'KenhHang' ? 'Kenh hang' :
                   col === 'DoanhSoTB' ? 'Doanh so TB' :
                   col === 'TanSuatHienTai' ? 'Tan suat hien tai' :
                   col === 'TanSuatGSBHChiaLai' ? 'Tan suat GSBH chia lai' :
                   col === 'TanSuatKhachHang' ? 'Tan suat khach hang' :
                   col === 'KenhPhanPhoi' ? 'Kenh phan phoi' :
                   col}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {table.paginated.map((row, i) => (
              <tr key={i}>
                {groupedColumns.base?.map(col => (
                  <td key={`${i}-${col}`} className="cell-base">
                    {row[col] || '-'}
                  </td>
                ))}
                
                {groupedColumns.lo_trinh_dms?.map(col => (
                  <td key={`${i}-${col}`} className="cell-numeric">
                    {formatCellValue(col, row[col])}
                  </td>
                ))}
                
                {groupedColumns.tan_suat_dms?.map(col => (
                  <td key={`${i}-${col}`} className="cell-numeric">
                    {formatCellValue(col, row[col])}
                  </td>
                ))}
                
                {groupedColumns.tan_suat_goi_y?.map(col => (
                  <td key={`${i}-${col}`} className={col.includes('TanSuatGoiY_Mapping') ? 'cell-numeric' : 'cell-base'}>
                    {formatCellValue(col, row[col])}
                  </td>
                ))}
                
                {groupedColumns.mapping?.map(col => (
                  <td key={`${i}-${col}`} className="cell-base">
                    {row[col] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="sheet chitiet-sheet" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>Chi Tiet Tuyen</h2>
        <p style={{ color: '#999', fontSize: '14px' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="sheet chitiet-sheet">
      <h2>Chi Tiet Tuyen</h2>
      <p className="sheet-subtitle">
        Display: {displayData.length} / {allData.length}
      </p>

      <FilterBar
        filters={filter.filters}
        filterOptions={filterOptions}
        onFilterChange={filter.updateFilter}
        onApply={handleApplyFilter}
        onReset={handleResetFilter}
        displayFields={FILTER_FIELDS}
        loading={api.loading}
      />

      {Object.keys(analytics).length > 0 && (
        <div className="charts-section">
          <div className="charts-grid">
            {chartData.loTrinhDays.length > 0 && (
              <div className="chart-card">
                <h4>Lo Trinh (T2-T7)</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.loTrinhDays}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: '#f9f9f9', border: '1px solid #ddd' }} />
                    <Bar dataKey="value" fill="#667eea" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {chartData.kenhHang.length > 0 && (
              <div className="chart-card">
                <h4>Kenh Hang</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={chartData.kenhHang} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {chartData.kenhHang.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="charts-grid" style={{ marginTop: '20px' }}>
            {chartData.tanSuatDMSWeeks.length > 0 && (
              <div className="chart-card">
                <h4>Tan Suat DMS (W1-W4)</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.tanSuatDMSWeeks}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: '#f9f9f9', border: '1px solid #ddd' }} />
                    <Line type="monotone" dataKey="value" stroke="#667eea" strokeWidth={2} dot={{ fill: '#667eea', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {chartData.tanSuatGoiYWeeks.length > 0 && (
              <div className="chart-card">
                <h4>Tan Suat Goi Y (W1-W4)</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.tanSuatGoiYWeeks}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: '#f9f9f9', border: '1px solid #ddd' }} />
                    <Line type="monotone" dataKey="value" stroke="#f39c12" strokeWidth={2} dot={{ fill: '#f39c12', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        {renderGroupedTable()}
      </div>

      {displayData.length > 0 && (
        <div className="pagination">
          <button 
            onClick={() => table.setPage(p => Math.max(1, p - 1))} 
            disabled={table.page === 1}
            className="btn-pagination"
          >
            Back
          </button>
          <span className="pagination-info">
            Page {table.page} / {table.totalPages} | Display: {table.paginated.length}/{displayData.length}
          </span>
          <button 
            onClick={() => table.setPage(p => Math.min(table.totalPages, p + 1))} 
            disabled={table.page === table.totalPages}
            className="btn-pagination"
          >
            Next
          </button>
          <select 
            value={table.pageSize} 
            onChange={e => {
              table.setPageSize(parseInt(e.target.value));
              table.setPage(1);
            }}
            className="select-page-size"
          >
            <option value={25}>25/page</option>
            <option value={50}>50/page</option>
            <option value={100}>100/page</option>
            <option value={200}>200/page</option>
          </select>
        </div>
      )}

      {Object.keys(analytics).length > 0 && (
        <div className="analytics">
          <h3>Analytics</h3>
          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>Total DS TB</h4>
              <p className="analytics-value">
                {analytics.total_doanh_so_tb?.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) || 0}
              </p>
            </div>
            <div className="analytics-card">
              <h4>Avg Tan Suat</h4>
              <p className="analytics-value">
                {analytics.avg_tan_suat_khach_hang?.toFixed(2) || 0}
              </p>
            </div>
            <div className="analytics-card">
              <h4>Total KH</h4>
              <p className="analytics-value">
                {analytics.total_rows?.toLocaleString('vi-VN') || 0}
              </p>
            </div>
          </div>

          {analytics.top_nhan_vien && analytics.top_nhan_vien.length > 0 && (
            <div className="analytics-section" style={{ marginTop: '20px' }}>
              <h4>Top 10 Nhan Vien</h4>
              <div className="top-list">
                {analytics.top_nhan_vien.map((item, i) => (
                  <div key={i} className="top-item">
                    <span className="rank">#{i + 1}</span>
                    <span className="name">{item.name}</span>
                    <span className="value">{item.doanh_so?.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};