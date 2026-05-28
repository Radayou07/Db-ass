import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required

upload_bp = Blueprint("upload", __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@upload_bp.route("", methods=["POST"])
@jwt_required()
def upload_files():
    print("Upload request received") # Basic server-side logging
    if 'images' not in request.files:
        print("Error: No images part in request.files")
        return jsonify({"error": "No image parts in the request"}), 400
    
    files = request.files.getlist('images')
    if not files or files[0].filename == '':
        print("Error: No files selected")
        return jsonify({"error": "No files selected for upload"}), 400

    urls = []
    upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
    
    try:
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder, exist_ok=True)
            print(f"Created directory: {upload_folder}")
    except Exception as e:
        print(f"Directory creation error: {str(e)}")
        return jsonify({"error": f"Server storage error: {str(e)}"}), 500

    for file in files:
        if file and allowed_file(file.filename):
            try:
                # Generate a unique secure filename
                ext = file.filename.rsplit('.', 1)[1].lower()
                filename = secure_filename(f"{uuid.uuid4().hex}.{ext}")
                
                file_path = os.path.join(upload_folder, filename)
                file.save(file_path)
                print(f"File saved to: {file_path}")
                
                # Create a URL that can be reached via the static server
                url = f"http://localhost:5001/static/uploads/{filename}"
                urls.append(url)
            except Exception as e:
                print(f"File save error: {str(e)}")
                return jsonify({"error": f"Failed to save {file.filename}: {str(e)}"}), 500
        else:
            print(f"Error: Invalid file type for {file.filename}")
            return jsonify({"error": f"Invalid file type for {file.filename}. Supported: png, jpg, jpeg, gif, webp"}), 400

    print(f"Successfully uploaded {len(urls)} files")
    return jsonify({"urls": urls}), 201
