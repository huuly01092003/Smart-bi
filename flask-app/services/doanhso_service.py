import pandas as pd
from utils import calculate_metrics, df_to_dict
from analytics import Analytics

class DoanhsoService:
    """Handle all Doanh số khách hàng operations"""
    
    def __init__(self, df):
        self.df = df
    
    def get_data(self):
        """Get processed Doanh số data with stats"""
        if self.df is None:
            return {'data': [], 'stats': {}}
        
        df = self.df.copy()
        
        metrics = df.apply(calculate_metrics, axis=1, result_type='expand')
        df['TB Doanh số'] = metrics['TB']
        df['Dự báo tháng tới'] = metrics['Forecast']
        df['Phân loại'] = metrics['Class']
        
        cols = ['CustCode', 'T-3', 'T-2', 'T-1', 'T', 'TB Doanh số', 'Dự báo tháng tới', 'Phân loại']
        df = df[[col for col in cols if col in df.columns]]
        
        stats = {
            'total_rows': len(df),
            'total_t': float(df['T'].sum()) if 'T' in df.columns else 0,
            'total_tb': float(df['TB Doanh số'].sum()),
            'vip': len(df[df['Phân loại'] == 'VIP']),
            'high': len(df[df['Phân loại'] == 'High']),
            'medium': len(df[df['Phân loại'] == 'Medium']),
            'low': len(df[df['Phân loại'] == 'Low']),
        }
        
        return {'data': df_to_dict(df), 'stats': stats}
    
    def filter(self, custcode='', classification=''):
        """Filter Doanh số data"""
        if self.df is None:
            return []
        
        df = self.df.copy()
        
        metrics = df.apply(calculate_metrics, axis=1, result_type='expand')
        df['TB Doanh số'] = metrics['TB']
        df['Dự báo tháng tới'] = metrics['Forecast']
        df['Phân loại'] = metrics['Class']
        
        if custcode:
            df = df[df['CustCode'].astype(str).str.contains(custcode, case=False, na=False)]
        
        if classification and classification != 'all':
            df = df[df['Phân loại'] == classification]
        
        cols = ['CustCode', 'T-3', 'T-2', 'T-1', 'T', 'TB Doanh số', 'Dự báo tháng tới', 'Phân loại']
        df = df[[col for col in cols if col in df.columns]]
        
        return df_to_dict(df)
    
    def get_analytics(self):
        """Get analytics for Doanh số"""
        if self.df is None:
            return {'forecast': [], 'top10': []}
        
        return Analytics.get_doanhso_analytics(self.df)