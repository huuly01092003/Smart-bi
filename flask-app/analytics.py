import pandas as pd
from utils import calculate_metrics

class Analytics:
    """Handles analytics calculations"""
    
    @staticmethod
    def get_doanhso_analytics(df):
        """Get analytics for Doanh số sheet"""
        try:
            df = df.copy()
            
            metrics = df.apply(calculate_metrics, axis=1, result_type='expand')
            df['Phân loại'] = metrics['Class']
            df['TB Doanh số'] = metrics['TB']
            
            forecast_data = []
            for cls in ['VIP', 'High', 'Medium', 'Low']:
                subset = df[df['Phân loại'] == cls]
                if len(subset) > 0:
                    t_sum = float(subset['T'].sum()) if 'T' in df.columns else 0
                    forecast_data.append({
                        'class': cls,
                        'count': len(subset),
                        'current': t_sum,
                        'avg': float(subset['TB Doanh số'].mean())
                    })
            
            top10_df = df.nlargest(10, 'TB Doanh số')[['CustCode', 'TB Doanh số', 'Phân loại']]
            top10 = top10_df.to_dict('records')
            
            return {
                'forecast': forecast_data,
                'top10': top10
            }
        except Exception as e:
            print(f"Error in analytics: {e}")
            return {'forecast': [], 'top10': []}
    
    @staticmethod
    def get_dskh_analytics(df):
        """Get analytics for DSKH sheet"""
        try:
            df = df.copy()
            
            channel_counts = {}
            for col in df.columns:
                if 'channel' in col.lower() or 'kênh' in col.lower():
                    channel_counts = df[col].value_counts().head(10).to_dict()
                    break
            
            district_counts = {}
            for col in df.columns:
                if 'quận' in col.lower() or 'huyện' in col.lower() or 'district' in col.lower():
                    district_counts = df[col].value_counts().head(10).to_dict()
                    break
            
            return {
                'channel': channel_counts,
                'district': district_counts,
                'total': len(df)
            }
        except Exception as e:
            print(f"Error in DSKH analytics: {e}")
            return {'channel': {}, 'district': {}, 'total': 0}