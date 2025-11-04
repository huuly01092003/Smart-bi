import pandas as pd
import numpy as np

def recalculate_logic(dfs):
    """
    Thực thi lại logic tính toán (giống như Excel tự động cập nhật)
    khi có thay đổi từ Master hoặc Chi tiết tuyến.
    """
    chi_tiet_df = dfs['chi_tiet'].copy()
    doanh_so_df = dfs['doanh_so'].copy()
    master_params = dfs['master_params']

    # --- 1. JOIN/VLOOKUP: Nối Doanh số TB mới nhất vào Chi tiết tuyến ---
    chi_tiet_df = pd.merge(
        chi_tiet_df.drop(columns=['DS_TB_Original'], errors='ignore'),
        doanh_so_df[['Mã khách hàng', 'TB Doanh số']], 
        on='Mã khách hàng', 
        how='left'
    ).rename(columns={'TB Doanh số': 'DS_TB_Final'})
    
    # Đảm bảo cột tính toán là số
    chi_tiet_df['DS_TB_Final'] = pd.to_numeric(chi_tiet_df['DS_TB_Final'], errors='coerce')


    # --- 2. CÔNG THỨC "TẦN SUẤT GỢI Ý" ---
    def calculate_suggested_freq(doanh_so):
        """Phân tần suất F8, F4, F2 dựa trên Doanh số TB và tham số Master."""
        if pd.isna(doanh_so):
            return 'F0'
        elif doanh_so >= master_params['DS_Nguong_F8']:
            return 'F8'
        elif doanh_so >= master_params['DS_Nguong_F4']:
            return 'F4'
        elif doanh_so >= master_params['DS_Nguong_F2']:
            return 'F2'
        else:
            return 'F0'
            
    chi_tiet_df['Tần suất gợi ý (Recalc)'] = chi_tiet_df['DS_TB_Final'].apply(calculate_suggested_freq)
    
    # --- 3. LOGIC IF/AND: KIỂM TRA ĐÚNG TẦN SUẤT ---
    chi_tiet_df['Kiểm tra đúng tần suất (Recalc)'] = np.where(
        chi_tiet_df['Freq_Chia'].astype(str) == chi_tiet_df['Tần suất gợi ý (Recalc)'].astype(str), 
        'OK', 
        'LỖI'
    )

    # --- 4. TÍNH TOÁN DỮ LIỆU TỔNG HỢP (BALANCE LOAD) ---
    freq_call_map = {'F0': 0, 'F1': 1, 'F2': 2, 'F3': 3, 'F4': 4, 'F8': 8, 'F12': 12}
    chi_tiet_df['So_Call_Thang'] = chi_tiet_df['Freq_Chia'].map(freq_call_map).fillna(0)

    balance_df = chi_tiet_df.groupby(['Mã tuyến', 'Mã nhân viên phụ trách']).agg(
        Tong_KH=('Mã khách hàng', 'count'),
        Tong_Calls=('So_Call_Thang', 'sum'),
        Tong_DoanhSo=('DS_TB_Final', 'sum')
    ).reset_index()

    # Thêm các cột giới hạn cho Trực quan
    balance_df['KH_Min'] = master_params['KH_Min_NVBH']
    balance_df['KH_Max'] = master_params['KH_Max_NVBH']
    balance_df['Call_Min'] = master_params['Call_Min_Thang']
    balance_df['Call_Max'] = master_params['Call_Max_Thang']
    balance_df['Tên nhân viên'] = balance_df['Mã nhân viên phụ trách'] # Giả định tên = mã cho đơn giản

    # Cập nhật lại DataFrames trong Session
    dfs['chi_tiet'] = chi_tiet_df
    dfs['balance_load'] = balance_df

    # Trả về các DF cần thiết cho Frontend
    return {
        'master_params': master_params,
        'chi_tiet': chi_tiet_df.head(50).to_dict(orient='records'), # Gửi 50 dòng đầu cho Demo
        'balance_load': balance_df.to_dict(orient='records')
    }