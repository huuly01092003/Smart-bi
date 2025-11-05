import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import SheetView from './components/SheetView';

function App() {
  const [sheets, setSheets] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/sheets').then(res => setSheets(res.data));
  }, []);

  const handleUpload = (e) => {
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    axios.post('http://localhost:5000/upload', formData).then(res => {
      setSheets(res.data.sheets);
      window.location.reload();
    });
  };

  return (
    <Router>
      <div style={{ display: 'flex', height: '100vh' }}>
        <nav style={{ width: '200px', background: '#f0f0f0', padding: '20px' }}>
          <h3>Xem File Excel</h3>
          <input type="file" accept=".xlsx" onChange={handleUpload} style={{ marginBottom: '20px' }} />
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {sheets.map(sheet => (
              <li key={sheet}>
                <Link to={`/${sheet}`} style={{ display: 'block', margin: '10px 0', textDecoration: 'none' }}>
                  {sheet}
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/map" style={{ display: 'block', margin: '10px 0' }}>Bản Đồ (DSKH)</Link>
          <a href="http://localhost:5000/download" style={{ display: 'block', margin: '10px 0' }}>Tải File Về</a>
        </nav>
        <main style={{ flex: 1, padding: '20px' }}>
          <Routes>
            {sheets.map(sheet => (
              <Route key={sheet} path={`/${sheet}`} element={<SheetView sheetName={sheet} />} />
            ))}
            <Route path="/map" element={<SheetView sheetName="DSKH" view="map" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;