import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useTable } from '../hooks/useTable';
import { useFilter } from '../hooks/useFilter';
import { Stats } from '../components/Stats';
import { FilterBar } from '../components/FilterBar';
import { Table } from '../components/Table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLUMNS = ['CustCode', 'T-3', 'T-2', 'T-1', 'T', 'TB Doanh số', 'Dự báo tháng tới', 'Phân loại'];

export const DoanhsoSheet = () => {
  const api = useApi();
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({});
  const [analytics, setAnalytics] = useState({});
  const [monthlyChart, setMonthlyChart] = useState([]);
  const table = useTable(data);
  const filter = useFilter({ custcode: '', classification: 'all' });

  useEffect(() => {
    loadData();
    table.setPageSize(100);
  }, []);

  const loadData = async () => {
    try {
      const [dataRes, analyticsRes] = await Promise.all([
        api.fetchDoanhsoData(),
        api.fetchDoanhsoAnalytics()
      ]);

      const doanhsoData = dataRes.data || [];
      setData(doanhsoData);
      setStats(dataRes.stats || {});
      setAnalytics(analyticsRes || {});
      generateMonthlyChart(doanhsoData);
    } catch (e) {
      console.error('Error loading data:', e);
    }
  };

  const generateMonthlyChart = (doanhsoData) => {
    try {
      if (!doanhsoData || doanhsoData.length === 0) return;

      // Tính tổng doanh số cho mỗi tháng
      let totalT3 = 0, totalT2 = 0, totalT1 = 0, totalT = 0;

      doanhsoData.forEach(row => {
        totalT3 += parseInt(row['T-3']) || 0;
        totalT2 += parseInt(row['T-2']) || 0;
        totalT1 += parseInt(row['T-1']) || 0;
        totalT += parseInt(row['T']) || 0;
      });

      const chartData = [
        { month: 'T-3', total: totalT3, label: '3 tháng trước' },
        { month: 'T-2', total: totalT2, label: '2 tháng trước' },
        { month: 'T-1', total: totalT1, label: 'Tháng trước' },
        { month: 'T', total: totalT, label: 'Tháng hiện tại' }
      ];

      setMonthlyChart(chartData);
      console.log('Monthly chart data:', chartData);
    } catch (e) {
      console.error('Error generating monthly chart:', e);
    }
  };

  const handleFilter = async () => {
    try {
      const filtered = await api.filterDoanhso(filter.filters.custcode, filter.filters.classification);
      setData(filtered);
      generateMonthlyChart(filtered);
      filter.applyFilters();
    } catch (e) {
      console.error('Error filtering:', e);
    }
  };

  const handleReset = async () => {
    filter.resetFilters();
    loadData();
  };

  const formatCell = (value, col) => {
    if (col === 'Phân loại') {
      return <span className={`badge ${String(value).toLowerCase()}`}>{value}</span>;
    }
    if (['T-3', 'T-2', 'T-1', 'T', 'TB Doanh số', 'Dự báo tháng tới'].includes(col)) {
      return (value || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 });
    }
    return String(value || '-');
  };

  return (
    <div className="sheet">
      <Stats data={stats} />

      <FilterBar
        filters={filter.filters}
        filterOptions={{
          custcode: [],
          classification: ['VIP', 'High', 'Medium', 'Low']
        }}
        displayFields={['custcode', 'classification']}
        onFilterChange={(key, val) => {
          if (key === 'custcode') filter.updateFilter('custcode', val);
          if (key === 'classification') filter.updateFilter('classification', val);
        }}
        onApply={handleFilter}
        onReset={handleReset}
        loading={api.loading}
      />

      {/* Monthly Revenue Chart */}
      {monthlyChart.length > 0 && (
        <div className="chart-card-doanhso">
          <h3>📊 Tổng doanh số theo tháng</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value) => value.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}
                labelFormatter={(label) => {
                  const item = monthlyChart.find(m => m.month === label);
                  return item ? item.label : label;
                }}
              />
              <Legend />
              <Bar dataKey="total" fill="#667eea" name="Tổng doanh số" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <Table
        data={table.paginated}
        columns={COLUMNS}
        sortKey={table.sortKey}
        sortAsc={table.sortAsc}
        onSort={table.handleSort}
        loading={api.loading}
        renderCell={formatCell}
      />

      {/* Analytics */}
      {analytics.forecast && (
        <div className="analytics">
          <h2>📈 Phân tích</h2>
          <div className="forecast-grid">
            {analytics.forecast.map((item, i) => (
              <div key={i} className={`forecast-card ${item.class.toLowerCase()}`}>
                <h3>{item.class}</h3>
                <p>Khách hàng: <strong>{item.count}</strong></p>
                <p>Doanh số: <strong>{item.current.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}</strong></p>
                <p>Trung bình: <strong>{item.avg.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}</strong></p>
              </div>
            ))}
          </div>

          {analytics.top10 && (
            <div className="top10">
              <h3>🏆 Top 10 khách hàng</h3>
              <Table
                data={analytics.top10}
                columns={['CustCode', 'TB Doanh số', 'Phân loại']}
                renderCell={formatCell}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};