from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
from google.cloud import storage
import os
import json
import uuid
from sqlalchemy import MetaData
from datetime import datetime
from flask_migrate import Migrate
import logging
import io
from google.cloud.storage.blob import Blob
import time


# Setup logging
logging.basicConfig(level=logging.DEBUG)
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

app = Flask(__name__)
CORS(app)

# Configuring database connection
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgres://iimrnohstkeenh:e01ff5f9a67eed42688496cf906a09a67d5a38ea1de9a94e8ea6e8f2b4e58b5f@ec2-3-217-146-37.compute-1.amazonaws.com:5432/df0s4u8p1qn2s4')
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initializing database with Flask app
db = SQLAlchemy(app)
migrate = Migrate(app, db)


# Database models
class Release(db.Model):
    id = db.Column(db.Integer, primary_key=True)   # Release ID
    song_title = db.Column(db.String(200), nullable=False)  # Song Title
    artist_name = db.Column(db.String(200), nullable=False)  # Artist Name
    release_date = db.Column(db.Date, nullable=False)  # Release Date
    label_copy_text = db.Column(db.Text, nullable=True)  # Label Copy Text
    release_instructions = db.Column(db.Text, nullable=True)  # Release Instructions
    is_album = db.Column(db.Boolean, default=False)  # Is Album
    algo_support_acknowledged = db.Column(db.Boolean, default=False)  # Algorithm Support Acknowledged
    rush_fee_approved = db.Column(db.Boolean, default=False)  # Rush Fee Approved

class File(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    release_id = db.Column(db.Integer, db.ForeignKey('release.id'), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)
    file_reference = db.Column(db.String(500), nullable=False)
    gcs_path = db.Column(db.String(500), nullable=False) 

# Get the Google Credentials from the Environment Variable
creds_info = None
if 'GOOGLE_CREDENTIALS' in os.environ:
    creds_info = json.loads(os.environ['GOOGLE_CREDENTIALS'])

storage_client = None
bucket = None
if creds_info:
    storage_client = storage.Client.from_service_account_info(creds_info)
    bucket = storage_client.bucket("airya_bucket")

def upload_to_gcs(file_obj, folder_name):
    logging.debug("Entering upload_to_gcs function.")
    if not bucket:
        logging.error("Google Cloud Storage bucket is not initialized.")
        return None  # Return None if the bucket is not initialized
    
    # Check if file_obj is the correct type
    if not isinstance(file_obj, io.IOBase):
        logging.error(f"Provided file object is not a file: {type(file_obj)}")
        return None

    safe_filename = secure_filename(file_obj.filename)
    
    # Check if the secured filename is not empty or None
    if not safe_filename:
        logging.error(f"Secured filename is empty or None for original filename: {file_obj.filename}")
        return None

    unique_filename = f"{uuid.uuid4().hex}_{safe_filename}"
    blob_path = f"{folder_name}/{unique_filename}"
    logging.debug(f"Constructed blob path: {blob_path}")

    blob = bucket.blob(blob_path)
    blob.upload_from_file(file_obj)

    logging.info(f"File {safe_filename} uploaded to {blob_path}.")
    return blob_path

def generate_gcs_signed_url(file_reference, expiry_time=3600):
    logging.debug(f"Generating signed URL for: {file_reference}")
    
    if not bucket:
        logging.error("Google Cloud Storage bucket is not initialized.")
        return None
    
    blob = Blob(file_reference, bucket)

    try:
        signed_url = blob.generate_signed_url(version="v4", expiration=expiry_time, method="PUT")
        logging.debug(f"Generated signed URL: {signed_url}")
        return signed_url
    except Exception as e:
        logging.error(f"Error generating signed URL for {file_reference}: {str(e)}")
        return None


    
    

@app.route('/api/projects', methods=['GET'])
def get_all_projects():
    projects = Release.query.all()
    response = [
        {
            "id": project.id,
            "title": project.song_title,
            "artist_name": project.artist_name
        }
        for project in projects
    ]
    return jsonify(response)

@app.route('/api/projects/<int:project_id>', methods=['GET'])
def get_project_details(project_id):
    project = Release.query.get(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    files = File.query.filter_by(release_id=project.id).all()
    file_data = {file.file_type: generate_gcs_signed_url(file.file_reference) for file in files}
    
    response = {
        "title": project.song_title,
        "artist_name": project.artist_name,
        "release_date": project.release_date.strftime('%Y-%m-%d'),
        "label_copy_text": project.label_copy_text,
        "release_instructions": project.release_instructions,
        "files": file_data
    }
    return jsonify(response)

@app.route('/api/get-signed-url', methods=['GET'])
def get_signed_url():
    try:
        # Get the file_reference from the request's query parameters
        file_reference = request.args.get('file_reference')
        if not file_reference:
            return jsonify({"error": "file_reference parameter is required"}), 400
        
        url = generate_gcs_signed_url(file_reference)
        if not url:
            return jsonify({"error": "Unable to generate signed URL"}), 500
        
        return jsonify({"signed_url": url})
    
    except Exception as e:
        logging.error(f"Error generating signed URL: {str(e)}")
        return jsonify({"error": "Unexpected error occurred"}), 500


@app.route('/api/endpoint', methods=['POST'])
def handle_submission():
    logging.info("Handling submission endpoint.")
    file_urls = {}  # Initialize a dictionary to store URLs of the uploaded files
    
    try:
        file_mappings = {
            'audioFile': 'audio/',
            'labelCopyPDF': 'pdf/',
            'artwork': 'artwork/',
            'dolbyAudio': 'dolby/'
        }

        for field, folder in file_mappings.items():
            if field in request.files:
                for uploaded_file in request.files.getlist(field):
                    logging.debug(f"Handling {field}...")
                    file_info = f"Filename: {uploaded_file.filename}, Content-Type: {uploaded_file.content_type}"
                    logging.debug(file_info)
                    url = upload_to_gcs(uploaded_file, folder)
                    if url:
                        file_urls[field] = url


        # Store song metadata in the database
        song_title = request.form.get('songTitle')
        artist_name = request.form.get('artistName')
        release_date = datetime.strptime(request.form.get('releaseDate'), '%Y-%m-%d').date()
        label_copy_text = request.form.get('labelCopyText')
        release_instructions = request.form.get('releaseInstructions')
        is_album_raw = request.form.get('isAlbum')
        is_album = is_album_raw.lower() == 'true' if is_album_raw else False

        algo_support_acknowledged_raw = request.form.get('algoSupportAcknowledged')
        algo_support_acknowledged = algo_support_acknowledged_raw.lower() == 'true' if algo_support_acknowledged_raw else False

        rush_fee_approved_raw = request.form.get('rushFeeApproved')
        rush_fee_approved = rush_fee_approved_raw.lower() == 'true' if rush_fee_approved_raw else False


        release = Release(
            song_title=song_title,
            artist_name=artist_name,
            release_date=release_date,
            label_copy_text=label_copy_text,
            release_instructions=release_instructions,
            is_album=is_album,
            algo_support_acknowledged=algo_support_acknowledged,
            rush_fee_approved=rush_fee_approved
        )
        db.session.add(release)
        db.session.commit()

        for field_type, url in file_urls.items():
            file_entry = File(release_id=release.id, file_type=field_type, file_reference=url)
            db.session.add(file_entry)
        db.session.commit()

        logging.info("Submission endpoint processed successfully.")
        return jsonify({"message": "Data received and stored successfully!"})
    
    except Exception as e:
        logging.error(f"Unexpected error in handle_submission: {str(e)}")
        return jsonify({"message": f"Error: {str(e)}"}), 400
    

    
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)