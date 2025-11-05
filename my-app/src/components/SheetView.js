import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

// Fix icon Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const SheetView = ({ sheetName, view = 'table' }) => {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({});
  const [chartData, setChartData] = useState({});
  const [mapData, setMapData] = useState([]);

  useEffect(() => {
    loadData();
  }, [sheetName, filters]);

  const loadData = () => {
    const params = new URLSearchParams(filters);
    axios.get(`http://localhost:5000/api/sheet/${sheetName}?${params}`).then(res => setData(res.data));
    if (view !== 'map') {
      axios.get(`http://localhost:5000/api/chart_data/${sheetName}?${params}`).then(res => setChartData(res.data));
    } else {
      axios.get(`http://localhost:5000/api/map_data?${params}`).then(res => setMapData(res.data));
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const gridOptions = {
    columnDefs: data.length > 0 ? Object.keys(data[0]).map(key => ({ field: key, filter: true })) : [],
    rowData: data,
    pagination: true,
    suppressMovableColumns: true,
  };

  const renderChart = () => {
    if (!chartData || Object.keys(chartData).length === 0) return <div>Không có dữ liệu biểu đồ</div>;
    if (sheetName === 'Tuyến và nhân viên') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.labels.map((l, i) => ({ name: l, value: chartData.data[i] }))}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      );
    } else if (sheetName === 'Doanh số khách hàng') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData.labels.map((l, i) => ({ name: l, value: chartData.data[i] }))}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      );
    } else if (sheetName === 'DSKH') {
      const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={chartData.labels.map((l, i) => ({ name: l, value: chartData.data[i] }))} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
              {chartData.labels.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    return <div>Biểu đồ cho {sheetName}</div>;
  };

  const renderMap = () => (
    <MapContainer center={[9.18, 105.15]} zoom={10} style={{ height: '60vh', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {mapData.map((point, i) => (
        <CircleMarker key={i} center={[parseFloat(point.Lat), parseFloat(point.Lng)]} radius={point.size || 10} fillColor={point.color} color="black" weight={2}>
          <Popup>{point['Tên khách hàng']} - {point['Tên Quận/huyện']}: {point['Doanh số trung bình']}</Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );

  const commonFilters = sheetName === 'DSKH' ? ['Tên Quận/huyện', 'KÊNH (bắt buộc nhập)'] : ['Mã tuyến', 'Tên nhân viên'];
  return (
    <div>
      <h2>Xem {sheetName}</h2>
      <div style={{ marginBottom: '20px' }}>
        {commonFilters.map(field => (
          <div key={field} style={{ display: 'inline-block', margin: '5px' }}>
            <label>{field}:</label>
            <input type="text" onChange={(e) => handleFilterChange(field.toLowerCase().replace(/\s+/g, '_'), e.target.value)} placeholder="Lọc..." />
          </div>
        ))}
        <button onClick={loadData}>Áp dụng Lọc</button>
      </div>
      {view === 'map' ? renderMap() : (
        <div>
          <div className="ag-theme-alpine" style={{ height: '40vh', width: '100%' }}>
            <AgGridReact {...gridOptions} />
          </div>
          <div style={{ height: '40vh', marginTop: '20px' }}>
            {renderChart()}
          </div>
        </div>
      )}
    </div>
  );
};

export default SheetView;