import React, { useState, useEffect } from 'react';

function MasterControls({ params, onRecalculate }) {
  const [localParams, setLocalParams] = useState(params);

  useEffect(() => {
    if (params) {
        setLocalParams(params);
    }
  }, [params]);

  const handleChange = (key, value) => {
    // Chuyển sang số và chỉ nhận giá trị dương
    const numericValue = Math.max(0, parseFloat(value)); 
    setLocalParams(prev => ({
      ...prev,
      [key]: isNaN(numericValue) ? '' : numericValue,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onRecalculate({ master_params: localParams });
  };

  if (!localParams) return <div>Đang tải tham số Master...</div>;

  return (
    <div className="p-3 border rounded bg-light">
      <h4>2. Tham số Hoạch Định (Master)</h4>
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label className="form-label">Call Min/Max (Tháng):</label>
          <input 
            type="number" 
            className="form-control form-control-sm"
            value={localParams.Call_Min_Thang || 0}
            onChange={(e) => handleChange('Call_Min_Thang', e.target.value)}
          />
          <input 
            type="number" 
            className="form-control form-control-sm mt-1"
            value={localParams.Call_Max_Thang || 0}
            onChange={(e) => handleChange('Call_Max_Thang', e.target.value)}
          />
        </div>
        
        <div className="mb-2">
          <label className="form-label">Ngưỡng DS (F4/F8):</label>
          <input 
            type="number" 
            className="form-control form-control-sm"
            placeholder="DS Ngưỡng F4"
            value={localParams.DS_Nguong_F4 || 0}
            onChange={(e) => handleChange('DS_Nguong_F4', e.target.value)}
          />
          <input 
            type="number" 
            className="form-control form-control-sm mt-1"
            placeholder="DS Ngưỡng F8"
            value={localParams.DS_Nguong_F8 || 0}
            onChange={(e) => handleChange('DS_Nguong_F8', e.target.value)}
          />
        </div>
        
        <button type="submit" className="btn btn-warning btn-sm mt-3 w-100">
          Cập nhật & Tính toán lại
        </button>
      </form>
    </div>
  );
}

export default MasterControls;