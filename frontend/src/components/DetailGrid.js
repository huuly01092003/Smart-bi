import React, { useState, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

function DetailGrid({ data, onRecalculate, loading }) {
  const [gridApi, setGridApi] = useState(null);

  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 100,
    resizable: true,
  }), []);

  // Các cột cần thiết cho tương tác và hiển thị kết quả
  const [columnDefs] = useState([
    { field: 'Mã khách hàng', headerName: 'Mã KH', filter: true, pinned: 'left', width: 120 },
    { field: 'Tên khách hàng', headerName: 'Tên KH', filter: true, width: 250 },
    { field: 'Mã nhân viên phụ trách', headerName: 'Mã NV', width: 120 },
    { 
        field: 'Freq_Chia', 
        headerName: 'Tần suất GS chia lại', 
        editable: true, 
        width: 150,
        cellStyle: params => ({ backgroundColor: '#fff3cd' }) // Tô màu ô có thể sửa
    },
    { field: 'DS_TB_Final', headerName: 'Doanh số TB (Final)', width: 150, valueFormatter: params => params.value ? params.value.toLocaleString('vi-VN') : '' },
    { field: 'Tần suất gợi ý (Recalc)', headerName: 'Tần suất gợi ý', width: 120 },
    { 
        field: 'Kiểm tra đúng tần suất (Recalc)', 
        headerName: 'Kiểm tra TS', 
        width: 120,
        cellStyle: params => ({ 
            backgroundColor: params.value === 'LỖI' ? '#f8d7da' : '#d4edda' 
        })
    },
    { field: 'So_Call_Thang', headerName: 'Số Calls Thỏa thuận', width: 120 },
    // Thêm các cột khác nếu cần
  ]);

  const onGridReady = useCallback((params) => {
    setGridApi(params.api);
  }, []);

  // Xử lý sự kiện khi giá trị ô bị thay đổi
  const onCellValueChanged = useCallback((event) => {
    // Chỉ gửi dữ liệu nếu giá trị cũ khác giá trị mới
    if (event.oldValue !== event.newValue) {
      const change = {
        'Mã khách hàng': event.data['Mã khách hàng'],
        'column': event.colDef.field, // Sẽ luôn là Freq_Chia
        'new_value': event.newValue
      };
      
      // Gửi thay đổi lên Flask để tính toán lại
      onRecalculate({ chi_tiet_changes: [change] });
    }
  }, [onRecalculate]);

  return (
    <div className="ag-theme-quartz" style={{ height: 500, width: '100%' }}>
      {loading && <div style={{ position: 'absolute', zIndex: 10, backgroundColor: 'rgba(255,255,255,0.7)', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Đang tính toán lại...</div>}
      <AgGridReact
        rowData={data}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={onGridReady}
        onCellValueChanged={onCellValueChanged}
        enableCellChangeFlash={true} // Nháy sáng ô khi có thay đổi
        rowBuffer={0}
      />
    </div>
  );
}

export default DetailGrid;