import pandas as pd
from utils import df_to_dict
from analytics import Analytics

class DSKHService:
    """Handle all DSKH operations"""
    
    def __init__(self, df):
        self.df = df
    
    def get_data(self):
        """Get DSKH data with filter options"""
        if self.df is None:
            return {'data': [], 'columns': [], 'filters': {}, 'total_rows': 0}
        
        df = self.df.copy()
        
        filters = {}
        for col in df.columns:
            unique = df[col].dropna().unique()
            if len(unique) <= 100:
                filters[col] = [str(v) for v in unique]
        
        return {
            'data': df_to_dict(df),
            'columns': list(df.columns),
            'filters': filters,
            'total_rows': len(df)
        }
    
    def filter(self, filters_dict):
        """Filter DSKH data"""
        if self.df is None:
            return []
        
        df = self.df.copy()
        
        for key, value in filters_dict.items():
            if value and value != 'all' and key in df.columns:
                df = df[df[key].astype(str).str.contains(str(value), case=False, na=False)]
        
        return df_to_dict(df)
    
    def get_analytics(self):
        """Get analytics for DSKH"""
        if self.df is None:
            return {'channel': {}, 'district': {}, 'total': 0}
        
        return Analytics.get_dskh_analytics(self.df)