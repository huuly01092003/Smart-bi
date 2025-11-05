from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import os
import numpy as np  # Để fix int64
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Path đến file mẫu
DEFAULT_EXCEL_PATH = '../data/Hoạch định tuyến _template _11.2025.xlsx'
uploaded_file = None

def load_excel(file_path):
    if not os.path.exists(file_path):
        return {}
    excel_data = {}
    try:
        xl = pd.ExcelFile(file_path, engine='openpyxl')
        for sheet_name in xl.sheet_names:
            df = pd.read_excel(file_path, sheet_name=sheet_name, engine='openpyxl')
            excel_data[sheet_name] = df.to_dict('records')
    except Exception as e:
        print(f"Lỗi load Excel: {e}")
        return {}
    return excel_data

# Load file mặc định
uploaded_file = load_excel(DEFAULT_EXCEL_PATH)

@app.route('/upload', methods=['POST'])
def upload_file():
    global uploaded_file
    if 'file' not in request.files:
        return jsonify({'error': 'Không có file'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Chưa chọn file'}), 400
    if file:
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        uploaded_file = load_excel(file_path)
        return jsonify({'sheets': list(uploaded_file.keys())})
    return jsonify({'error': 'Upload thất bại'}), 500

@app.route('/api/sheets')
def get_sheets():
    if not uploaded_file:
        return jsonify([])
    return jsonify(list(uploaded_file.keys()))

@app.route('/api/sheet/<sheet_name>')
def get_sheet(sheet_name):
    if not uploaded_file or sheet_name not in uploaded_file:
        return jsonify([])
    df_data = uploaded_file[sheet_name]
    df = pd.DataFrame(df_data)
    filters = request.args
    for key, value in filters.items():
        if key in df.columns:
            df = df[df[key].astype(str).str.contains(value, na=False)]
    return jsonify(df.to_dict('records'))

@app.route('/api/map_data')
def get_map_data():
    if not uploaded_file or 'DSKH' not in uploaded_file or 'Doanh số khách hàng' not in uploaded_file:
        return jsonify([])
    try:
        df_dskh = pd.DataFrame(uploaded_file['DSKH'])
        df_doanhso = pd.DataFrame(uploaded_file['Doanh số khách hàng'])
        # Merge dựa trên 'Mã khách hàng' == 'CustCode'
        df_merged = pd.merge(df_dskh, df_doanhso, left_on='Mã khách hàng', right_on='CustCode', how='left')
        filters = request.args
        for key, value in filters.items():
            if key in df_merged.columns:
                df_merged = df_merged[df_merged[key].astype(str).str.contains(value, na=False)]
        # Chọn cột cần, dùng 'TB Doanh số' cho color/size
        map_data = df_merged[['Tên khách hàng', 'Lat', 'Lng', 'TB Doanh số', 'Tên Quận/huyện']].dropna(subset=['Lat', 'Lng']).to_dict('records')
        for item in map_data:
            ds = float(item['TB Doanh số'] or 0)
            item['color'] = 'red' if ds > 1000000 else 'orange' if ds > 500000 else 'green'
            item['size'] = min(20, max(5, ds / 50000))
            # Convert Lat/Lng sang float nếu cần
            item['Lat'] = float(item['Lat'])
            item['Lng'] = float(item['Lng'])
        return jsonify(map_data)
    except Exception as e:
        print(f"Lỗi map_data: {e}")
        return jsonify([])

@app.route('/api/chart_data/<sheet_name>')
def get_chart_data(sheet_name):
    if not uploaded_file or sheet_name not in uploaded_file:
        return jsonify({})
    try:
        df_data = uploaded_file[sheet_name]
        df = pd.DataFrame(df_data)
        filters = request.args
        for key, value in filters.items():
            if key in df.columns:
                df = df[df[key].astype(str).str.contains(value, na=False)]
        
        if sheet_name == 'Tuyến và nhân viên':
            days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7']
            sums = [int(df[day].sum()) if day in df.columns else 0 for day in days]  # Convert int64 -> int
            chart_data = {'labels': days, 'data': sums}
            return jsonify(chart_data)
        elif sheet_name == 'Doanh số khách hàng':
            periods = ['T-3', 'T-2', 'T-1', 'T']
            sums = [int(df[p].sum()) if p in df.columns else 0 for p in periods]  # Convert int64 -> int
            chart_data = {'labels': periods, 'data': sums}
            return jsonify(chart_data)
        elif sheet_name == 'DSKH':
            if 'KÊNH (bắt buộc nhập)' in df.columns:
                channel_counts = df['KÊNH (bắt buộc nhập)'].value_counts().to_dict()
                # Convert values to int nếu cần
                chart_data = {'labels': list(channel_counts.keys()), 'data': [int(v) for v in channel_counts.values()]}
                return jsonify(chart_data)
        return jsonify({})
    except Exception as e:
        print(f"Lỗi chart_data: {e}")
        return jsonify({})

@app.route('/download')
def download():
    if os.path.exists(DEFAULT_EXCEL_PATH):
        return send_file(DEFAULT_EXCEL_PATH, as_attachment=True)
    if not os.listdir(app.config['UPLOAD_FOLDER']):
        return jsonify({'error': 'Chưa upload file'}), 400
    filename = os.listdir(app.config['UPLOAD_FOLDER'])[0]
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    return send_file(file_path, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)