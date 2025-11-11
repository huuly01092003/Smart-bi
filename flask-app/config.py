import os

# Folder config
UPLOAD_FOLDER = 'uploads'
DATA_FOLDER = 'data'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)

# File config
ALLOWED_EXTENSIONS = {'xlsx'}
MAX_FILE_SIZE = 50 * 1024 * 1024

# Sheet names - Sửa đúng tên sheet trong file Excel
SHEET_DOANHSO = 'Doanh số khách hàng'
SHEET_DSKH = 'DSKH'
SHEET_TUYEN = 'Tuyến và nhân viên'
SHEET_CHITIETTUYEN = 'Chi tiết tuyến'

# API config
API_DEBUG = True
API_HOST = '0.0.0.0'
API_PORT = 5000

# Classification thresholds
CLASSIFICATION_THRESHOLDS = {
    'VIP': 5000000,
    'High': 2000000,
    'Medium': 500000,
    'Low': 0
}