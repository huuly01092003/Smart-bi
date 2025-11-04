from flask import Flask, request, jsonify, session
from flask_cors import CORS
from dotenv import load_dotenv
import os
from io import BytesIO

from logic.excel_handler import read_data_files
from logic.recalc_engine import recalculate_logic

load_dotenv() 

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'default_secret_key')
# Cho phép CORS từ Frontend (mặc định là http://localhost:3000)
CORS(app, supports_credentials=True, origins=["http://localhost:3000"]) 

# --- API ROUTES ---

@app.route('/api/upload', methods=['POST'])
def handle_upload():
    """API xử lý tải file lên và khởi tạo Session DataFrames."""
    
    required_keys = {'master', 'chitiet', 'doanhso', 'tuyenvn'}
    if not required_keys.issubset(request.files.keys()):
        return jsonify({'status': 'error', 'message': 'Thiếu file đầu vào (Master, Chi tiết tuyến, Doanh số, Tuyến NV).'}), 400

    # LỖI ĐÃ KHẮC PHỤC: Thay thế `required_files` bằng `required_keys`
    # Đồng thời đơn giản hóa logic ánh xạ vì key và tên DataFrame là giống nhau.
    data_files = {name: BytesIO(request.files[name].read()) for name in required_keys}
    
    try:
        dfs = read_data_files(data_files)
        results = recalculate_logic(dfs)
        
        # Lưu trữ DataFrames vào session
        session['data_frames'] = dfs
        
        return jsonify({'status': 'success', 'data': results})
        
    except Exception as e:
        print(f"Lỗi: {e}")
        return jsonify({'status': 'error', 'message': f"Lỗi xử lý dữ liệu: {str(e)}"}), 500


@app.route('/api/recalculate', methods=['POST'])
def handle_recalculate():
    """API xử lý thay đổi từ UI và chạy lại logic tính toán."""
    if 'data_frames' not in session:
        return jsonify({'status': 'error', 'message': 'Phiên làm việc đã hết hạn. Vui lòng tải lại dữ liệu.'}), 400

    user_changes = request.get_json() 
    dfs = session['data_frames']

    # 1. Cập nhật Master Parameters
    if 'master_params' in user_changes:
        dfs['master_params'].update(user_changes['master_params'])

    # 2. Cập nhật Chi tiết tuyến
    if 'chi_tiet_changes' in user_changes:
        chi_tiet_df = dfs['chi_tiet']
        for change in user_changes['chi_tiet_changes']:
            # Cập nhật cột Freq_Chia (Tần suất GSBH chia lại)
            # Dùng .loc để đảm bảo cập nhật đúng
            chi_tiet_df.loc[
                chi_tiet_df['Mã khách hàng'] == change['Mã khách hàng'], 
                'Freq_Chia'
            ] = change['new_value']
            
    try:
        # 3. Chạy lại Logic Tính toán
        results = recalculate_logic(dfs)
        
        # 4. Lưu lại Session và trả về
        session['data_frames'] = dfs
        return jsonify({'status': 'success', 'data': results})
    
    except Exception as e:
        print(f"Lỗi tính toán: {e}")
        return jsonify({'status': 'error', 'message': f"Lỗi tính toán: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)