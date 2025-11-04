import React, { useState } from 'react';

function UploadForm({ onSubmit, loading }) {
  const [files, setFiles] = useState({});

  const fileLabels = {
    master: 'Master (Tham số)',
    chitiet: 'Chi tiết tuyến',
    doanhso: 'Doanh số khách hàng',
    tuyenvn: 'Tuyến và nhân viên',
  };

  const handleFileChange = (name, event) => {
    setFiles(prev => ({
      ...prev,
      [name]: event.target.files[0],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const requiredKeys = Object.keys(fileLabels);
    if (requiredKeys.some(key => !files[key])) {
        alert("Vui lòng chọn đủ 4 file.");
        return;
    }

    const formData = new FormData();
    requiredKeys.forEach(name => {
        formData.append(name, files[name]);
    });
    
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border rounded">
      <h4>1. Tải lên các Sheet Excel (.csv)</h4>
      {Object.keys(fileLabels).map((name) => (
        <div className="mb-2" key={name}>
          <label className="form-label d-block">
            {fileLabels[name]}: 
            {files[name] && <span className="badge bg-success ms-2">{files[name].name}</span>}
          </label>
          <input
            type="file"
            className="form-control"
            onChange={(e) => handleFileChange(name, e)}
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            required
          />
        </div>
      ))}
      
      <button 
        type="submit" 
        className="btn btn-primary mt-3" 
        disabled={loading || Object.keys(files).length < 4}
      >
        {loading ? 'Đang xử lý...' : 'Tải lên & Khởi tạo'}
      </button>
    </form>
  );
}

export default UploadForm;