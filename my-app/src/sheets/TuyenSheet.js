import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './TuyenSheet.css';

export const TuyenSheet = () => {
  const api = useApi();
  const [data, setData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});
  const [filters, setFilters] = useState({});
  const [chartData, setChartData] = useState({
    staffPerformance: [],
    weeklyTrend: [],
    weeklyCharts: []
  });

  const FILTER_COLUMNS = [
    'Tên nhân viên',
    'Trạng thái nhân viên gán tuyến',
    'Giám sát'
  ];

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4ecdc4', '#45b7d1', '#f39c12', '#e74c3c'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const res = await api.fetchTuyenData();
      const tuyenData = res?.data || [];
      const allCols = res?.columns || [];

      if (tuyenData.length === 0) {
        console.warn('Không có dữ liệu cho Tuyến & Nhân viên.');
        return;
      }

      setAllData(tuyenData);
      setData(tuyenData);
      setColumns(allCols);
      setFilterOptions(res?.filters || {});
      generateCharts(tuyenData, allCols);
    } catch (e) {
      console.error('Error loading Tuyen data:', e);
    }
  }, [api]);

  /**
   * Tìm tất cả cột day - xử lý duplicate names
   * Pandas khi load Excel có duplicate column names sẽ rename:
   * T2, T3, T4, T5, T6, T7, T2.1, T3.1, T4.1, T5.1, T6.1, T7.1, T2.2, ...
   */
  const extractDayColumns = useCallback((allCols) => {
    console.log('=== EXTRACTING DAY COLUMNS ===');
    console.log('All columns:', allCols);

    // Tìm cột match: T2, T3, T4, T5, T6, T7 (với hoặc không có .1, .2, .3 suffix)
    // Regex: ^T[2-7](\.\d+)?$ 
    // Giải thích: T + [2-7] + optional(.số)
    const dayColumnsRaw = allCols.filter(col => {
      const match = /^T[2-7](\.\d+)?$/.test(col);
      return match;
    });

    console.log('Day columns found:', dayColumnsRaw);
    console.log('Total day columns:', dayColumnsRaw.length);

    // Sort theo thứ tự: T2, T3, T4, T5, T6, T7, T2.1, T3.1, ...
    const dayColumnsSorted = dayColumnsRaw.sort((a, b) => {
      const aNum = parseInt(a.match(/\d+/)[0]);
      const aSuffix = a.includes('.') ? parseInt(a.split('.')[1]) : 0;
      
      const bNum = parseInt(b.match(/\d+/)[0]);
      const bSuffix = b.includes('.') ? parseInt(b.split('.')[1]) : 0;

      if (aSuffix !== bSuffix) {
        return aSuffix - bSuffix;
      }
      return aNum - bNum;
    });

    console.log('Day columns sorted:', dayColumnsSorted);

    return dayColumnsSorted;
  }, []);

  /**
   * Generate chart data cho 4 tuần
   */
  const generateCharts = useCallback((tuyenData, allCols) => {
    try {
      // 1. Staff Performance - Bar chart
      const staffPerf = tuyenData.slice(0, 10).map(row => ({
        name: row['Tên nhân viên'] || 'N/A',
        'Số Calls': parseInt(row['Số Calls']) || 0,
        'Call Min': parseInt(row['Call Min']) || 0,
        'Call Max': parseInt(row['Call Max']) || 0
      }));

      // 2. Lấy day columns
      const dayColumns = extractDayColumns(allCols);
      
      if (dayColumns.length === 0) {
        console.error('❌ No day columns found!');
        return;
      }

      // 3. Weekly Trend - Line chart tổng
      const weeklyData = {};
      dayColumns.forEach(col => {
        const dayNum = col.match(/\d/)[0]; // Lấy số đầu tiên (2, 3, 4, ...)
        const day = `T${dayNum}`;
        
        if (!weeklyData[day]) {
          weeklyData[day] = { day, total: 0, count: 0 };
        }
        
        tuyenData.forEach(row => {
          const val = parseInt(row[col]) || 0;
          weeklyData[day].total += val;
          weeklyData[day].count += 1;
        });
      });

      const weeklyTrend = [
        weeklyData['T2'],
        weeklyData['T3'],
        weeklyData['T4'],
        weeklyData['T5'],
        weeklyData['T6'],
        weeklyData['T7']
      ]
        .filter(Boolean)
        .map(w => ({
          day: w.day,
          'Trung bình': Math.round(w.total / w.count)
        }));

      // 4. Weekly Charts - Chia 4 tuần, mỗi tuần 1 chart
      const weeklyCharts = [];
      
      for (let weekIdx = 0; weekIdx < 4; weekIdx++) {
        const weekStart = weekIdx * 6;
        const weekEnd = Math.min(weekStart + 6, dayColumns.length);
        const weekDayColumns = dayColumns.slice(weekStart, weekEnd);

        if (weekDayColumns.length === 0) break;

        console.log(`📅 Tuần ${weekIdx + 1}: columns ${weekStart}-${weekEnd}`, weekDayColumns);

        // Tạo data array cho 6 ngày
        const dayDataArray = [];

        weekDayColumns.forEach((colName, dayIdx) => {
          const dayNum = colName.match(/\d/)[0];
          const dayNames = ['', '', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
          
          const dayEntry = {
            day: `T${dayNum}`,
            label: dayNames[dayNum] || `T${dayNum}`
          };

          // Lấy top 8 nhân viên + data của họ cho ngày này
          tuyenData.slice(0, 8).forEach(row => {
            const staffName = row['Tên nhân viên'] || 'Unknown';
            const value = parseInt(row[colName]) || 0;
            dayEntry[staffName] = value;
          });

          dayDataArray.push(dayEntry);
        });

        const staffNames = tuyenData.slice(0, 8).map(r => r['Tên nhân viên'] || 'Unknown');

        console.log(`✅ Tuần ${weekIdx + 1} data:`, dayDataArray);

        weeklyCharts.push({
          weekNum: weekIdx + 1,
          data: dayDataArray,
          staffNames: staffNames
        });
      }

      console.log('✅ Chart data generated:', {
        staffPerf: staffPerf.length,
        weeklyTrend: weeklyTrend.length,
        weeklyCharts: weeklyCharts.length
      });

      setChartData({
        staffPerformance: staffPerf,
        weeklyTrend: weeklyTrend,
        weeklyCharts: weeklyCharts
      });
    } catch (e) {
      console.error('❌ Error generating charts:', e);
    }
  }, [extractDayColumns]);

  const handleFilter = useCallback(async () => {
    try {
      const filtered = await api.filterTuyen(filters);
      setData(filtered);
      generateCharts(filtered, columns);
    } catch (e) {
      console.error('Error filtering:', e);
    }
  }, [api, filters, generateCharts, columns]);

  const handleReset = useCallback(() => {
    setFilters({});
    setData(allData);
    generateCharts(allData, columns);
  }, [allData, generateCharts, columns]);

  const getColumnGroups = useCallback(() => {
    const baseColumns = [
      'Tên nhân viên',
      'Từ ngày giao tuyến',
      'Đến ngày giao tuyến',
      'Trạng thái nhân viên gán tuyến',
      'Dự án hoạch định tuyến',
      'Giám sát',
      'Note'
    ];
    
    const callColumns = ['Số Calls', 'Call Min', 'Call Max'];
    
    const dayColumns = extractDayColumns(columns);

    const weeks = [];
    const colsPerWeek = 6;
    
    for (let weekNum = 0; weekNum < Math.ceil(dayColumns.length / colsPerWeek); weekNum++) {
      const weekStart = weekNum * colsPerWeek;
      const weekEnd = Math.min(weekStart + colsPerWeek, dayColumns.length);
      const weekCols = dayColumns.slice(weekStart, weekEnd);
      
      if (weekCols.length > 0) {
        weeks.push({
          weekNum: weekNum + 1,
          days: weekCols.map(col => {
            const dayNum = col.match(/\d/)[0];
            return { col, day: dayNum };
          })
        });
      }
    }

    return {
      baseColumns: baseColumns.filter(col => columns.includes(col)),
      callColumns: callColumns.filter(col => columns.includes(col)),
      weeks: weeks
    };
  }, [columns, extractDayColumns]);

  const columnGroups = useMemo(() => getColumnGroups(), [getColumnGroups]);

  return (
    <div className="sheet">
      <div className="info-bar">
        <span>📊 Tổng: {data.length || 0} dòng | 📈 Biểu đồ Calls theo tuần (T2-T7)</span>
      </div>

      {/* Filter Panel */}
      <div className="filter-panel-advanced">
        <h3>🔎 Bộ lọc</h3>
        <div className="filter-grid-advanced">
          {FILTER_COLUMNS.filter(col => columns.includes(col)).map(col => (
            <div key={col} className="filter-item">
              <label>{col}</label>
              {filterOptions[col] && filterOptions[col].length > 0 ? (
                <select
                  value={filters[col] || 'all'}
                  onChange={(e) => setFilters({ ...filters, [col]: e.target.value })}
                  className="input"
                >
                  <option value="all">Tất cả</option>
                  {filterOptions[col].slice(0, 50).map(val => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={filters[col] || ''}
                  onChange={(e) => setFilters({ ...filters, [col]: e.target.value })}
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

      {/* Charts Section */}
      <div className="charts-section">
        {/* Chart 1: Staff Performance */}
        {chartData.staffPerformance.length > 0 && (
          <div className="chart-card">
            <h4>📈 Hiệu suất nhân viên (Top 10)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.staffPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} interval={0} fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Số Calls" fill="#667eea" />
                <Bar dataKey="Call Min" fill="#4ecdc4" />
                <Bar dataKey="Call Max" fill="#f5576c" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Chart 2: Weekly Trend */}
        {chartData.weeklyTrend.length > 0 && (
          <div className="chart-card">
            <h4>📊 Xu hướng theo ngày trong tuần</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Trung bình" 
                  stroke="#667eea" 
                  strokeWidth={2}
                  dot={{ fill: '#667eea', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Charts 3-6: Weekly Charts (Tuần 1-4) */}
        <div className="charts-grid-weekly">
          {chartData.weeklyCharts.map((week, weekIdx) => (
            week.data.length > 0 && (
              <div key={`week-${weekIdx}`} className="chart-card">
                <h4>📅 Tuần {week.weekNum} - Calls theo thứ của nhân viên</h4>
                <div className="chart-subtitle">Top {week.staffNames.length} nhân viên - T2 đến T7</div>
                
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart
                    data={week.data}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="day"
                      label={{ value: 'Ngày trong tuần', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Số Calls', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value) => value || 0}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      height={60}
                    />

                    {/* Vẽ line cho mỗi nhân viên */}
                    {week.staffNames.map((staffName, idx) => (
                      <Line
                        key={staffName}
                        type="monotone"
                        dataKey={staffName}
                        stroke={COLORS[idx % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="table-wrapper-grouped">
        <table className="grouped-table">
          <thead>
            <tr className="header-row-1">
              <th colSpan={columnGroups.baseColumns.length}>Thông tin nhân viên</th>
              <th colSpan={columnGroups.callColumns.length}>Thực trạng hiện tại</th>
              {columnGroups.weeks.map(week => (
                <th key={`week-${week.weekNum}`} colSpan={week.days.length}>
                  Tuần {week.weekNum}
                </th>
              ))}
            </tr>

            <tr className="header-row-2">
              {columnGroups.baseColumns.map(col => (
                <th key={col} className="base-col">{col}</th>
              ))}
              {columnGroups.callColumns.map(col => (
                <th key={col} className="call-col">{col}</th>
              ))}
              {columnGroups.weeks.flatMap(week =>
                week.days.map(d => (
                  <th key={d.col} className="day-col">
                    T{d.day}
                  </th>
                ))
              )}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columnGroups.baseColumns.length + columnGroups.callColumns.length + columnGroups.weeks.reduce((sum, w) => sum + w.days.length, 0)} style={{ textAlign: 'center', padding: '20px' }}>
                  🔍 Không có dữ liệu
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx}>
                  {columnGroups.baseColumns.map(col => (
                    <td key={`${idx}-${col}`} className="base-cell">
                      {row[col] || '-'}
                    </td>
                  ))}
                  {columnGroups.callColumns.map(col => (
                    <td key={`${idx}-${col}`} className="call-cell">
                      {row[col] || '-'}
                    </td>
                  ))}
                  {columnGroups.weeks.flatMap(week =>
                    week.days.map(d => (
                      <td key={`${idx}-${d.col}`} className="day-cell">
                        {row[d.col] || '-'}
                      </td>
                    ))
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};