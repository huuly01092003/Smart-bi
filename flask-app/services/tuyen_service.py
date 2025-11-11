import pandas as pd
from utils import df_to_dict

class TuyenService:
    """Handle all Tuyen va Nhan vien operations"""
    
    def __init__(self, df):
        self.df = df
        print(f"TuyenService initialized with {len(df) if df is not None else 0} rows")
        if df is not None:
            print(f"Columns: {list(df.columns)}")
    
    def get_data(self):
        """Get Tuyen data with filter options"""
        if self.df is None or len(self.df) == 0:
            return {
                'data': [], 
                'columns': [], 
                'filters': {}, 
                'total_rows': 0
            }
        
        df = self.df.copy()
        
        # Get unique values for filters
        filters = {}
        try:
            for col in df.columns:
                if df[col].dtype == 'object':  # Only text columns
                    unique = df[col].dropna().unique()
                    if len(unique) <= 200:
                        filters[col] = sorted([str(v) for v in unique if v])  # Filter out empty strings
        except Exception as e:
            print(f"Error building filters: {e}")
        
        return {
            'data': df_to_dict(df),
            'columns': list(df.columns),
            'filters': filters,
            'total_rows': len(df)
        }
    
    def filter(self, filters_dict):
        """Filter Tuyen data"""
        if self.df is None or len(self.df) == 0:
            return []
        
        df = self.df.copy()
        
        # Apply filters
        for key, value in filters_dict.items():
            # Skip if value is empty, 'all', or key doesn't exist
            if not value or value == 'all' or key not in df.columns:
                continue
            
            try:
                # Convert column to string and filter
                mask = df[key].astype(str).str.lower().str.contains(str(value).lower(), case=False, na=False)
                df = df[mask]
                print(f"✓ Filtered {key}={value}, remaining rows: {len(df)}")
            except Exception as e:
                print(f"✗ Error filtering column {key}: {e}")
        
        return df_to_dict(df)
    
    def get_analytics(self):
        """Get Tuyen analytics"""
        if self.df is None or len(self.df) == 0:
            return {}
        
        try:
            df = self.df.copy()
            analytics = {
                'total_rows': len(df),
                'total_columns': len(df.columns)
            }
            
            # Count by status if column exists
            status_cols = [col for col in df.columns if 'trang thai' in col.lower() or 'status' in col.lower()]
            if status_cols:
                status_col = status_cols[0]
                analytics['trang_thai'] = df[status_col].value_counts().to_dict()
            
            # Count by unit/department if column exists
            unit_cols = [col for col in df.columns if 'don vi' in col.lower() or 'department' in col.lower()]
            if unit_cols:
                unit_col = unit_cols[0]
                top_units = df[unit_col].value_counts().head(10).to_dict()
                analytics['top_units'] = [{'name': k, 'count': v} for k, v in top_units.items()]
            
            # Count unique staff if column exists
            staff_cols = [col for col in df.columns if 'nhan vien' in col.lower() and 'ma' in col.lower()]
            if staff_cols:
                analytics['unique_staff'] = df[staff_cols[0]].nunique()
            
            # Count unique routes/tuyen if column exists
            tuyen_cols = [col for col in df.columns if 'tuyen' in col.lower() and 'ma' in col.lower()]
            if tuyen_cols:
                analytics['unique_tuyen'] = df[tuyen_cols[0]].nunique()
            
            return analytics
        except Exception as e:
            print(f"Error calculating analytics: {e}")
            return {}