import React, { useState } from 'react';
import axios from 'axios';
import UploadForm from './components/UploadForm';
import MasterControls from './components/MasterControls';
import BalanceChart from './components/BalanceChart';
import DetailGrid from './components/DetailGrid';
// Bạn cần tạo file này và thêm một số CSS cơ bản, ví dụ:
// @import '~bootstrap/dist/css/bootstrap.min.css'; 
import './App.css'; 

const API_BASE_URL = 'http://127.0.0.1:5000/api';

function App() {
  const [appState, setAppState] = useState({
    loading: false,
    error: null,
    masterParams: null,
    balanceLoad: [],
    chiTietData: [],
    sessionActive: false,
  });

  // Cấu hình Axios để gửi Cookies (cần thiết cho Flask Session)
  axios.defaults.withCredentials = true;

  const handleDataUpdate = (data) => {
    setAppState(prevState => ({
      ...prevState,
      masterParams: data.master_params,
      balanceLoad: data.balance_load,
      chiTietData: data.chi_tiet,
      sessionActive: true,
      loading: false,
      error: null,
    }));
  };

  const handleFileUpload = async (formData) => {
    setAppState(prevState => ({ ...prevState, loading: true, error: null }));
    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      handleDataUpdate(response.data.data);
    } catch (error) {
      setAppState(prevState => ({
        ...prevState,
        loading: false,
        error: error.response?.data?.message || 'Lỗi kết nối hoặc xử lý file.',
        sessionActive: false,
      }));
    }
  };

  const handleRecalculate = async (changes) => {
    setAppState(prevState => ({ ...prevState, loading: true }));
    try {
      const response = await axios.post(`${API_BASE_URL}/recalculate`, changes);
      handleDataUpdate(response.data.data);
    } catch (error) {
      setAppState(prevState => ({
        ...prevState,
        loading: false,
        error: error.response?.data?.message || 'Lỗi tính toán lại.',
      }));
    }
  };

  if (!appState.sessionActive) {
    return (
      <div className="container mt-5">
        <h2 className="text-center">Công cụ Hoạch Định Tuyến</h2>
        {appState.error && <div className="alert alert-danger">{appState.error}</div>}
        <UploadForm onSubmit={handleFileUpload} loading={appState.loading} />
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <h2 className="text-primary mb-4">Hoạch Định Tuyến & Cân Bằng Tải</h2>
      
      {appState.error && <div className="alert alert-danger">{appState.error}</div>}
      
      <div className="row g-4">
        <div className="col-md-3">
          <MasterControls 
            params={appState.masterParams} 
            onRecalculate={handleRecalculate} 
          />
        </div>
        <div className="col-md-9">
          <BalanceChart data={appState.balanceLoad} />
        </div>
      </div>
      
      <h3 className="mt-5 mb-3">Chi Tiết Tuyến (Chỉnh sửa Tần suất GSBH chia lại)</h3>
      <div>
        <DetailGrid 
          data={appState.chiTietData} 
          onRecalculate={handleRecalculate} 
          loading={appState.loading}
        />
      </div>
    </div>
  );
}

export default App;