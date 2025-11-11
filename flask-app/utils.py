import pandas as pd
from config import CLASSIFICATION_THRESHOLDS

def calculate_metrics(row):
    """Calculate TB Doanh số, Dự báo, Phân loại"""
    try:
        t3 = float(row.get('T-3', 0)) or 0
        t2 = float(row.get('T-2', 0)) or 0
        t1 = float(row.get('T-1', 0)) or 0
        
        tb = (t3 + t2 + t1) / 3 if (t3 + t2 + t1) > 0 else 0
        
        t = float(row.get('T', 0)) or 0
        trend = (t - t3) / 3 if t3 > 0 else 0
        forecast = max(0, t + trend)
        
        classification = 'Low'
        for cls, threshold in sorted(CLASSIFICATION_THRESHOLDS.items(), key=lambda x: x[1], reverse=True):
            if tb >= threshold:
                classification = cls
                break
        
        return {
            'TB': round(tb, 0),
            'Forecast': round(forecast, 0),
            'Class': classification
        }
    except Exception as e:
        print(f"Error calculating metrics: {e}")
        return {'TB': 0, 'Forecast': 0, 'Class': 'Low'}

def df_to_dict(df):
    """Convert DataFrame to dict with filled NaN"""
    df = df.where(pd.notna(df), None)
    return df.to_dict('records')

def get_column_unique_values(df, column, limit=100):
    """Get unique values from column"""
    try:
        unique = df[column].dropna().unique()
        return [str(v) for v in unique[:limit]]
    except:
        return []

def validate_file(filename):
    """Validate uploaded file"""
    return filename.endswith('.xlsx')

