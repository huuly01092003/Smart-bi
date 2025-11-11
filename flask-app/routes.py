# File: routes.py - ALL ROUTES MERGED
import os
import pandas as pd
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
from config import UPLOAD_FOLDER, SHEET_DOANHSO, SHEET_DSKH, SHEET_TUYEN, SHEET_CHITIETTUYEN
from utils import validate_file
from services.doanhso_service import DoanhsoService
from services.dskh_service import DSKHService
from services.tuyen_service import TuyenService
from services.chitiet_tuyen_service import ChitietTuyenService

api = Blueprint('api', __name__, url_prefix='/api')

# Global service instances
doanhso_service = None
dskh_service = None
tuyen_service = None
chitiet_service = None
current_file = None

# ============ Health Check ============
@api.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'loaded': any([doanhso_service, dskh_service, tuyen_service, chitiet_service])
    }), 200

# ============ Upload ============
@api.route('/upload', methods=['POST'])
def upload_file():
    global doanhso_service, dskh_service, tuyen_service, chitiet_service, current_file
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400
    
    file = request.files['file']
    if not validate_file(file.filename):
        return jsonify({'error': 'Only .xlsx files'}), 400
    
    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        excel = pd.ExcelFile(filepath)
        sheets = excel.sheet_names
        print(f"✓ Excel sheets: {sheets}")
        
        sheets_loaded = []
        
        # Load Doanh số
        if SHEET_DOANHSO in sheets:
            try:
                df_doanhso = pd.read_excel(filepath, sheet_name=SHEET_DOANHSO).fillna(0)
                doanhso_service = DoanhsoService(df_doanhso)
                sheets_loaded.append(SHEET_DOANHSO)
                print(f"✓ {SHEET_DOANHSO}: {len(df_doanhso)} rows")
            except Exception as e:
                print(f"✗ Error loading {SHEET_DOANHSO}: {e}")
                doanhso_service = None
        
        # Load DSKH
        if SHEET_DSKH in sheets:
            try:
                df_dskh = pd.read_excel(filepath, sheet_name=SHEET_DSKH, header=1).fillna('')
                dskh_service = DSKHService(df_dskh)
                sheets_loaded.append(SHEET_DSKH)
                print(f"✓ {SHEET_DSKH}: {len(df_dskh)} rows")
            except Exception as e:
                print(f"✗ Error loading {SHEET_DSKH}: {e}")
                dskh_service = None
        
        # Load Tuyến
        if SHEET_TUYEN in sheets:
            try:
                df_tuyen = pd.read_excel(filepath, sheet_name=SHEET_TUYEN, header=1).fillna('')
                tuyen_service = TuyenService(df_tuyen)
                sheets_loaded.append(SHEET_TUYEN)
                print(f"✓ {SHEET_TUYEN}: {len(df_tuyen)} rows")
            except Exception as e:
                print(f"✗ Error loading {SHEET_TUYEN}: {e}")
                tuyen_service = None
        
        # Load Chi tiết tuyến
        if SHEET_CHITIETTUYEN in sheets:
            try:
                df_chitiet = pd.read_excel(
                    filepath, 
                    sheet_name=SHEET_CHITIETTUYEN,
                    header=[2, 3],
                    skiprows=0
                ).fillna('')
                
                # Flatten columns nếu MultiIndex
                if isinstance(df_chitiet.columns, pd.MultiIndex):
                    df_chitiet.columns = [
                        ' '.join(col).strip() 
                        for col in df_chitiet.columns.values
                    ]
                
                print(f"✓ Shape after read: {df_chitiet.shape}")
                print(f"✓ Columns: {df_chitiet.columns[:20].tolist()}")
                
                chitiet_service = ChitietTuyenService(df_chitiet)
                sheets_loaded.append(SHEET_CHITIETTUYEN)
                print(f"✓ {SHEET_CHITIETTUYEN}: {len(df_chitiet)} rows")
            except Exception as e:
                print(f"✗ Error loading {SHEET_CHITIETTUYEN}: {e}")
                import traceback
                traceback.print_exc()
                chitiet_service = None
        
        current_file = filepath
        
        return jsonify({
            'success': True,
            'sheets': sheets_loaded,
            'message': f'Upload thành công {len(sheets_loaded)} sheet(s)'
        }), 200
    
    except Exception as e:
        print(f"✗ Upload error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ============ Download ============
@api.route('/download', methods=['GET'])
def download():
    global current_file
    if not current_file or not os.path.exists(current_file):
        return jsonify({'error': 'No file'}), 400
    try:
        return send_file(current_file, as_attachment=True, download_name='export.xlsx')
    except Exception as e:
        print(f"✗ Download error: {e}")
        return jsonify({'error': str(e)}), 500

# ============ Doanh số Routes ============
@api.route('/data/doanhso', methods=['GET'])
def get_doanhso_data():
    try:
        if doanhso_service is None:
            return jsonify({'data': [], 'stats': {}}), 200
        result = doanhso_service.get_data()
        return jsonify(result), 200
    except Exception as e:
        print(f"✗ Error: {e}")
        return jsonify({'error': str(e)}), 500

@api.route('/filter/doanhso', methods=['GET'])
def filter_doanhso():
    try:
        if doanhso_service is None:
            return jsonify([]), 200
        custcode = request.args.get('custcode', '')
        classification = request.args.get('classification', '')
        result = doanhso_service.filter(custcode, classification)
        return jsonify(result), 200
    except Exception as e:
        print(f"✗ Error: {e}")
        return jsonify({'error': str(e)}), 500

@api.route('/analytics/doanhso', methods=['GET'])
def get_doanhso_analytics():
    try:
        if doanhso_service is None:
            return jsonify({}), 200
        result = doanhso_service.get_analytics()
        return jsonify(result), 200
    except Exception as e:
        print(f"✗ Error: {e}")
        return jsonify({'error': str(e)}), 500

# ============ DSKH Routes ============
@api.route('/data/dskh', methods=['GET'])
def get_dskh_data():
    try:
        if dskh_service is None:
            return jsonify({'data': [], 'columns': [], 'filters': {}}), 200
        result = dskh_service.get_data()
        return jsonify(result), 200
    except Exception as e:
        print(f"✗ Error: {e}")
        return jsonify({'error': str(e)}), 500

@api.route('/filter/dskh', methods=['GET'])
def filter_dskh():
    try:
        if dskh_service is None:
            return jsonify([]), 200
        filters_dict = {}
        for key in request.args:
            filters_dict[key] = request.args.get(key)
        result = dskh_service.filter(filters_dict)
        return jsonify(result), 200
    except Exception as e:
        print(f"✗ Error: {e}")
        return jsonify({'error': str(e)}), 500

@api.route('/analytics/dskh', methods=['GET'])
def get_dskh_analytics():
    try:
        if dskh_service is None:
            return jsonify({}), 200
        result = dskh_service.get_analytics()
        return jsonify(result), 200
    except Exception as e:
        print(f"✗ Error: {e}")
        return jsonify({'error': str(e)}), 500

# ============ Tuyến Routes ============
@api.route('/data/tuyen', methods=['GET'])
def get_tuyen_data():
    try:
        if tuyen_service is None:
            return jsonify({'data': [], 'columns': [], 'filters': {}, 'total_rows': 0}), 200
        result = tuyen_service.get_data()
        return jsonify(result), 200
    except Exception as e:
        print(f"✗ Error: {e}")
        return jsonify({'error': str(e)}), 500

@api.route('/filter/tuyen', methods=['GET'])
def filter_tuyen():
    try:
        if tuyen_service is None:
            return jsonify([]), 200
        filters_dict = {}
        for key in request.args:
            filters_dict[key] = request.args.get(key)
        result = tuyen_service.filter(filters_dict)
        return jsonify(result), 200
    except Exception as e:
        print(f"✗ Error: {e}")
        return jsonify({'error': str(e)}), 500

# ============ Chi tiết tuyến Routes ============
@api.route('/data/chitiet', methods=['GET'])
def get_chitiet_data():
    try:
        if chitiet_service is None:
            return jsonify({
                'data': [], 
                'columns': [], 
                'filters': {}, 
                'total_rows': 0,
                'grouped_columns': {}
            }), 200
        result = chitiet_service.get_data()
        return jsonify(result), 200
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@api.route('/filter/chitiet', methods=['GET'])
def filter_chitiet():
    try:
        if chitiet_service is None:
            return jsonify([]), 200
        filters_dict = {}
        for key in request.args:
            filters_dict[key] = request.args.get(key)
        result = chitiet_service.filter(filters_dict)
        return jsonify(result), 200
    except Exception as e:
        print(f"✗ Error: {e}")
        return jsonify({'error': str(e)}), 500

@api.route('/analytics/chitiet', methods=['GET'])
def get_chitiet_analytics():
    try:
        if chitiet_service is None:
            return jsonify({}), 200
        result = chitiet_service.get_analytics()
        return jsonify(result), 200
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ============ Error Handlers ============
@api.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Endpoint not found'}), 404

@api.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Server error'}), 500