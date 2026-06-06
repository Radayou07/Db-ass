import os
import base64
import requests
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

upload_bp = Blueprint("upload", __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@upload_bp.route("", methods=["POST"])
@jwt_required()
def upload_files():
    api_key = os.getenv("IMGBB_API_KEY")
    if not api_key:
        return jsonify({"error": "ImgBB API key not configured on server"}), 500

    if 'images' not in request.files:
        return jsonify({"error": "No image parts in the request"}), 400
    
    files = request.files.getlist('images')
    if not files or files[0].filename == '':
        return jsonify({"error": "No files selected for upload"}), 400

    urls = []
    
    for file in files:
        if file and allowed_file(file.filename):
            try:
                # Read file and encode to base64
                file_content = file.read()
                base64_image = base64.b64encode(file_content).decode('utf-8')
                
                # Upload to ImgBB
                response = requests.post(
                    "https://api.imgbb.com/1/upload",
                    data={
                        "key": api_key,
                        "image": base64_image,
                    },
                    timeout=30
                )
                
                res_data = response.json()
                
                if response.status_code == 200 and res_data.get("success"):
                    # Get the direct display URL
                    url = res_data["data"]["url"]
                    urls.append(url)
                else:
                    error_msg = res_data.get("error", {}).get("message", "Unknown ImgBB error")
                    return jsonify({"error": f"ImgBB Error: {error_msg}"}), response.status_code
                    
            except Exception as e:
                print(f"ImgBB upload error: {str(e)}")
                return jsonify({"error": f"Failed to upload {file.filename} to cloud storage"}), 500
        else:
            return jsonify({"error": f"Invalid file type for {file.filename}. Supported: png, jpg, jpeg, gif, webp"}), 400

    return jsonify({"urls": urls}), 201
