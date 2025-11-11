import React, { useState, useEffect } from 'react';
import { useApi } from './hooks/useApi';
import { DoanhsoSheet } from './sheets/DoanhsoSheet';
import { DSKHSheet } from './sheets/DSKHSheet';
import { TuyenSheet } from './sheets/TuyenSheet';
import { ChiTietTuyenSheet } from './sheets/ChiTietTuyenSheet';
import './App.css';

export default function App() {
  const [tab, setTab] = useState('chitiet');
  const [uploadStatus, setUploadStatus] = useState(null);
  const api = useApi();

  useEffect(() => {
    if (api.error) {
      setUploadStatus({ type: 'error', message: api.error });
    }
  }, [api.error]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadStatus({ type: 'loading', message: 'Đang upload...' });
      const result = await api.upload(file);
      
      if (result?.success) {
        setUploadStatus({ type: 'success', message: `✅ Upload thành công! ${result.sheets.join(', ')}` });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setUploadStatus({ type: 'error', message: '❌ Upload thất bại' });
      }
    } catch (e) {
      setUploadStatus({ type: 'error', message: '❌ Lỗi upload: ' + e.message });
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <h1>📊 Excel BI Dashboard</h1>
        </div>
        <div className="header-right">
          <label className="btn-upload">
            📁 Upload
            <input type="file" accept=".xlsx" onChange={handleUpload} hidden />
          </label>
          <button onClick={() => api.download()} className="btn-download" title="Tải file Excel">
            ⬇️ Download
          </button>
          <button onClick={() => window.location.reload()} className="btn-refresh" title="Làm mới trang">
            🔄
          </button>
        </div>
      </header>

      {/* Upload Status */}
      {uploadStatus && (
        <div className={`status-bar ${uploadStatus.type}`} style={{
          padding: '12px 20px',
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: '600',
          backgroundColor: uploadStatus.type === 'success' ? '#d4edda' : uploadStatus.type === 'error' ? '#f8d7da' : '#e7f3ff',
          color: uploadStatus.type === 'success' ? '#155724' : uploadStatus.type === 'error' ? '#721c24' : '#004085',
          borderBottom: `2px solid ${uploadStatus.type === 'success' ? '#28a745' : uploadStatus.type === 'error' ? '#dc3545' : '#0066cc'}`,
        }}>
          {uploadStatus.message}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${tab === 'chitiet' ? 'active' : ''}`}
          onClick={() => setTab('chitiet')}
        >
          🎯 Chi tiết tuyến
        </button>
        <button
          className={`tab ${tab === 'doanhso' ? 'active' : ''}`}
          onClick={() => setTab('doanhso')}
        >
          💰 Doanh số
        </button>
        <button
          className={`tab ${tab === 'dskh' ? 'active' : ''}`}
          onClick={() => setTab('dskh')}
        >
          📋 DSKH
        </button>
        <button
          className={`tab ${tab === 'tuyen' ? 'active' : ''}`}
          onClick={() => setTab('tuyen')}
        >
          👥 Tuyến & NV
        </button>
      </div>

      {/* Content */}
      <div className="content">
        {tab === 'chitiet' && <ChiTietTuyenSheet />}
        {tab === 'doanhso' && <DoanhsoSheet />}
        {tab === 'dskh' && <DSKHSheet />}
        {tab === 'tuyen' && <TuyenSheet />}
      </div>
    </div>
  );
}