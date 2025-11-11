from flask import Flask
from flask_cors import CORS
from routes import api
from config import API_DEBUG, API_HOST, API_PORT

def create_app():
    """Factory function to create Flask app"""
    app = Flask(__name__)
    CORS(app)
    app.register_blueprint(api)
    return app

if __name__ == '__main__':
    app = create_app()
    
    print("\n" + "="*60)
    print("🚀 Flask Backend Starting")
    print("="*60)
    print(f"🌐 Server: http://{API_HOST}:{API_PORT}")
    print(f"📡 API: http://{API_HOST}:{API_PORT}/api")
    print(f"💾 Debug: {API_DEBUG}")
    print("="*60 + "\n")
    
    app.run(debug=API_DEBUG, host=API_HOST, port=API_PORT)