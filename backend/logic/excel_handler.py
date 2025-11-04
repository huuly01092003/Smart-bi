import pandas as pd
from io import BytesIO

# Mã hóa cho Tiếng Việt: 'cp1258' thường dùng cho file CSV/Excel trên Windows
ENCODING = 'cp1258' 

def read_data_files(uploaded_files):
    """
    Đọc các file đã tải lên, xử lý header và trích xuất tham số Master.
    uploaded_files: dictionary chứa tên file và dữ liệu (BytesIO).
    """
    data_frames = {}
    
    # --- 1. Master: Skip 12 dòng đầu, Header None ---
    try:
        master_df = pd.read_csv(uploaded_files['master'], skiprows=12, encoding=ENCODING, header=None)
        # Gán tên cột tạm thời để truy cập theo index
        master_df.columns = [f'Col_{i}' for i in range(master_df.shape[1])]
        
        # Trích xuất tham số Master (Giả định nằm ở cột D - index 3)
        params = {
            'Call_Min_Thang': float(master_df.iloc[0, 3]), 
            'Call_Max_Thang': float(master_df.iloc[1, 3]),
            'KH_Min_NVBH': float(master_df.iloc[4, 3]),
            'KH_Max_NVBH': float(master_df.iloc[5, 3]),
            'KH_Min_Ngay': float(master_df.iloc[6, 3]),
            'KH_Max_Ngay': float(master_df.iloc[7, 3]),
            # Ngưỡng phân tần suất (Giá trị mẫu)
            'DS_Nguong_F8': 10000000.0,
            'DS_Nguong_F4': 5000000.0,
            'DS_Nguong_F2': 1000000.0,
        }
        data_frames['master_params'] = params
    except Exception as e:
        raise ValueError(f"Lỗi đọc/trích xuất file Master: {e}")

    # --- 2. Chi tiết tuyến: Skip 2 dòng đầu ---
    data_frames['chi_tiet'] = pd.read_csv(
        uploaded_files['chitiet'], skiprows=2, encoding=ENCODING
    ).rename(columns={'Tần suất GSBH chia lại': 'Freq_Chia', 'Doanh số TB': 'DS_TB_Original'})

    # --- 3. Doanh số khách hàng: Header chuẩn ---
    data_frames['doanh_so'] = pd.read_csv(
        uploaded_files['doanhso'], encoding=ENCODING
    ).rename(columns={'CustCode': 'Mã khách hàng'})
    
    # --- 4. Tuyến và nhân viên: Skip 1 dòng đầu ---
    data_frames['tuyen_nv'] = pd.read_csv(
        uploaded_files['tuyenvn'], skiprows=1, encoding=ENCODING
    )
    
    return data_frames