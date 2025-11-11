import pandas as pd
from utils import df_to_dict

class ChitietTuyenService:
    """Handle all Chi tiết tuyến operations"""
    
    def __init__(self, df):
        self.df = df
        self.processed_df = None
        print(f"ChitietTuyenService initialized with {len(df) if df is not None else 0} rows")
        if df is not None:
            print(f"Raw shape: {df.shape}")
            self._process_headers()
    
    def _process_headers(self):
        """Xử lý headers phức tạp từ Excel"""
        if self.df is None or len(self.df) == 0:
            print("Error: DataFrame is empty")
            return
        
        df = self.df.copy()
        print(f"Starting _process_headers...")
        
        column_map = {}
        cols_seen = set()
        
        for col_str in df.columns:
            col_lower = str(col_str).lower()
            target_name = None
            
            # ===== Base columns =====
            if 'stt' in col_lower and target_name is None:
                target_name = 'STT'
            elif 'mã khách hàng' in col_lower and target_name is None:
                target_name = 'MaKhachHang'
            elif 'tên khách hàng' in col_lower and target_name is None:
                target_name = 'TenKhachHang'
            elif 'địa chỉ' in col_lower and target_name is None:
                target_name = 'DiaChi'
            
            # ===== Lộ trình DMS (T2-T7) - NO CN =====
            elif 'lộ trình dms' in col_lower and target_name is None:
                if col_lower.endswith('t2'):
                    target_name = 'T2_LoTrinhDMS'
                elif col_lower.endswith('t3'):
                    target_name = 'T3_LoTrinhDMS'
                elif col_lower.endswith('t4'):
                    target_name = 'T4_LoTrinhDMS'
                elif col_lower.endswith('t5'):
                    target_name = 'T5_LoTrinhDMS'
                elif col_lower.endswith('t6'):
                    target_name = 'T6_LoTrinhDMS'
                elif col_lower.endswith('t7'):
                    target_name = 'T7_LoTrinhDMS'
            
            # ===== Tần suất DMS (W1-W4) =====
            elif ('tần suất dms' in col_lower and 'goi y' not in col_lower) and target_name is None:
                if 'w1' in col_lower:
                    target_name = 'W1_TanSuatDMS'
                elif 'w2' in col_lower:
                    target_name = 'W2_TanSuatDMS'
                elif 'w3' in col_lower:
                    target_name = 'W3_TanSuatDMS'
                elif 'w4' in col_lower:
                    target_name = 'W4_TanSuatDMS'
            
            # ===== Tần suất gợi ý (W1-W4) - CHUYỂN VÀO MAPPING =====
            elif ('tần suất gợi ý' in col_lower or 'tan suat goi y' in col_lower) and 'w' in col_lower and target_name is None:
                if 'w1' in col_lower:
                    target_name = 'W1_TanSuatGoiY_Mapping'
                elif 'w2' in col_lower:
                    target_name = 'W2_TanSuatGoiY_Mapping'
                elif 'w3' in col_lower:
                    target_name = 'W3_TanSuatGoiY_Mapping'
                elif 'w4' in col_lower:
                    target_name = 'W4_TanSuatGoiY_Mapping'
            
            # ===== Mã nhân viên (trong group Tần suất gợi ý) =====
            elif 'mã nhân viên' in col_lower and target_name is None:
                target_name = 'MaNhanVienGoiY'
            
            # ===== Tên nhân viên (trong group Tần suất gợi ý) =====
            elif 'tên nhân viên' in col_lower and target_name is None:
                target_name = 'TenNhanVienGoiY'
            
            # ===== Tần suất gợi ý VALUE (trong group Tần suất gợi ý) =====
            elif ('tần suất gợi ý' in col_lower or 'tan suat goi y' in col_lower) and 'w' not in col_lower and target_name is None and 'TanSuatGoiYValue' not in cols_seen:
                target_name = 'TanSuatGoiYValue'
            
            # ===== Các cột Mapping =====
            elif 'kênh hàng' in col_lower and target_name is None:
                target_name = 'KenhHang'
            elif 'doanh số tb' in col_lower and 'DoanhSoTB' not in cols_seen:
                target_name = 'DoanhSoTB'
            elif 'tần suất hiện tại' in col_lower and target_name is None:
                target_name = 'TanSuatHienTai'
            elif ('tần suất gsbh' in col_lower or 'tần suất chia lại' in col_lower) and target_name is None:
                target_name = 'TanSuatGSBHChiaLai'
            elif 'tần suất' in col_lower and 'khách hàng' in col_lower and target_name is None:
                target_name = 'TanSuatKhachHang'
            elif 'kênh' in col_lower and target_name is None:
                target_name = 'KenhPhanPhoi'
            elif 'tần suất gợi ý' in col_lower and target_name is None and 'TanSuatGoiY' not in cols_seen:
                target_name = 'TanSuatGoiY'
            
            # Map only new targets
            if target_name and target_name not in cols_seen:
                column_map[col_str] = target_name
                cols_seen.add(target_name)
        
        # Rename columns
        df = df.rename(columns=column_map)
        print(f"Renamed {len(column_map)} columns")
        
        # Keep renamed columns
        cols_to_keep = [col for col in column_map.values() if col in df.columns]
        df = df[cols_to_keep]
        print(f"Kept {len(cols_to_keep)} columns: {cols_to_keep}")
        
        # Clean data
        df = df.replace('-', '')
        df = df.dropna(how='all')
        mask = df.applymap(lambda x: str(x).strip() != '' if pd.notna(x) else False).any(axis=1)
        df = df[mask]
        print(f"After cleaning: {len(df)} rows")
        
        # Convert Lo Trinh & Tan Suat: 'x' -> 1, empty/NaN -> 0
        for col in df.columns:
            if any(x in col for x in ['LoTrinhDMS', 'TanSuatDMS']):
                df[col] = df[col].apply(
                    lambda x: 1 if str(x).lower().strip() == 'x' else (0 if pd.isna(x) or str(x).strip() == '' else x)
                )
            # Convert W*_TanSuatGoiY_Mapping: 'x' -> 1, empty/NaN -> 0
            elif 'TanSuatGoiY_Mapping' in col:
                df[col] = df[col].apply(
                    lambda x: 1 if str(x).lower().strip() == 'x' else (0 if pd.isna(x) or str(x).strip() == '' else x)
                )
        
        self.processed_df = df
        print(f"Processing complete!")
        print(f"Final shape: {df.shape}")
        print(f"Final columns: {list(df.columns)}")
    
    def get_data(self):
        """Get Chi tiết tuyến data with grouped columns metadata"""
        if self.processed_df is None or len(self.processed_df) == 0:
            return {
                'data': [], 
                'columns': [], 
                'filters': {}, 
                'total_rows': 0,
                'grouped_columns': {}
            }
        
        df = self.processed_df.copy()
        
        # Grouped metadata for frontend multi-level table - ORDERED
        grouped_columns = {
            'base': ['STT', 'MaKhachHang', 'TenKhachHang', 'DiaChi'],
            'lo_trinh_dms': ['T2_LoTrinhDMS', 'T3_LoTrinhDMS', 'T4_LoTrinhDMS', 'T5_LoTrinhDMS', 'T6_LoTrinhDMS', 'T7_LoTrinhDMS'],
            'tan_suat_dms': ['W1_TanSuatDMS', 'W2_TanSuatDMS', 'W3_TanSuatDMS', 'W4_TanSuatDMS'],
            'tan_suat_goi_y': ['W1_TanSuatGoiY_Mapping', 'W2_TanSuatGoiY_Mapping', 'W3_TanSuatGoiY_Mapping', 'W4_TanSuatGoiY_Mapping', 'MaNhanVienGoiY', 'TenNhanVienGoiY', 'TanSuatGoiYValue'],
            'mapping': ['KenhHang', 'DoanhSoTB', 'TanSuatHienTai', 'TanSuatGSBHChiaLai', 'TanSuatKhachHang', 'KenhPhanPhoi', 'TanSuatGoiY']
        }
        
        # Filter to only existing columns
        for key in grouped_columns:
            grouped_columns[key] = [col for col in grouped_columns[key] if col in df.columns]
        
        # Filters: Unique values for text columns
        filters = {}
        filter_cols = ['MaKhachHang', 'TenKhachHang', 'TenNhanVienGoiY', 'KenhHang', 'KenhPhanPhoi']
        for col in filter_cols:
            if col in df.columns:
                unique = df[col].dropna().unique()
                unique = [str(v).strip() for v in unique if str(v).strip() and str(v) != 'nan']
                if 0 < len(unique) <= 500:
                    filters[col] = sorted(unique)
        
        print(f"get_data: {len(df)} rows")
        
        return {
            'data': df_to_dict(df),
            'columns': list(df.columns),
            'filters': filters,
            'grouped_columns': grouped_columns,
            'total_rows': len(df)
        }
    
    def filter(self, filters_dict):
        """Filter Chi tiết tuyến data"""
        if self.processed_df is None or len(self.processed_df) == 0:
            return []
        
        df = self.processed_df.copy()
        
        for key, value in filters_dict.items():
            if not value or value == 'all' or key not in df.columns:
                continue
            
            try:
                mask = df[key].astype(str).str.lower().str.contains(
                    str(value).lower(), case=False, na=False
                )
                df = df[mask]
            except Exception as e:
                print(f"Error filtering {key}: {e}")
        
        return df_to_dict(df)
    
    def get_analytics(self):
        """Get analytics for Chi tiết tuyến"""
        if self.processed_df is None or len(self.processed_df) == 0:
            return {}
        
        try:
            df = self.processed_df.copy()
            analytics = {
                'total_rows': len(df),
                'total_columns': len(df.columns)
            }
            
            # Total doanh số TB
            if 'DoanhSoTB' in df.columns:
                analytics['total_doanh_so_tb'] = float(pd.to_numeric(df['DoanhSoTB'], errors='coerce').sum())
            
            # Average tần suất khách hàng
            if 'TanSuatKhachHang' in df.columns:
                analytics['avg_tan_suat_khach_hang'] = float(pd.to_numeric(df['TanSuatKhachHang'], errors='coerce').mean())
            
            # Top 10 nhân viên by Doanh số TB
            if 'TenNhanVienGoiY' in df.columns and 'DoanhSoTB' in df.columns:
                try:
                    df_copy = df[['TenNhanVienGoiY', 'DoanhSoTB']].copy()
                    df_copy['DoanhSoTB'] = pd.to_numeric(df_copy['DoanhSoTB'], errors='coerce')
                    nhanvien_ds = df_copy.groupby('TenNhanVienGoiY')['DoanhSoTB'].sum().sort_values(ascending=False).head(10)
                    analytics['top_nhan_vien'] = [
                        {'name': k, 'doanh_so': float(v)} 
                        for k, v in nhanvien_ds.items()
                    ]
                except Exception as e:
                    print(f"Error getting top nhan vien: {e}")
                    analytics['top_nhan_vien'] = []
            
            # Phân loại theo Kênh
            if 'KenhHang' in df.columns:
                analytics['kenh_hang'] = df['KenhHang'].value_counts().to_dict()
            
            # Tổng lộ trình theo ngày (T2-T7 ONLY)
            tan_suat_days = {}
            for i in range(2, 8):
                col = f'T{i}_LoTrinhDMS'
                if col in df.columns:
                    tan_suat_days[f'T{i}'] = int(pd.to_numeric(df[col], errors='coerce').sum())
            analytics['tan_suat_theo_ngay'] = tan_suat_days
            
            # Tần suất DMS vs Tần suất Gợi ý theo tuần (W1-W4)
            tan_suat_dms_weeks = {}
            tan_suat_goi_y_weeks = {}
            for i in range(1, 5):
                dms_col = f'W{i}_TanSuatDMS'
                goi_y_col = f'W{i}_TanSuatGoiY_Mapping'
                
                if dms_col in df.columns:
                    tan_suat_dms_weeks[f'W{i}'] = int(pd.to_numeric(df[dms_col], errors='coerce').sum())
                if goi_y_col in df.columns:
                    tan_suat_goi_y_weeks[f'W{i}'] = int(pd.to_numeric(df[goi_y_col], errors='coerce').sum())
            
            analytics['tan_suat_dms_theo_tuan'] = tan_suat_dms_weeks
            analytics['tan_suat_goi_y_theo_tuan'] = tan_suat_goi_y_weeks
            
            return analytics
        except Exception as e:
            print(f"Error calculating analytics: {e}")
            import traceback
            traceback.print_exc()
            return {}