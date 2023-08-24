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
    album_order = db.Column(db.Integer, nullable=True)  # Album Order
    algo_support_acknowledged = db.Column(db.Boolean, default=False)  # Algorithm Support Acknowledged
    rush_fee_approved = db.Column(db.Boolean, default=False)  # Rush Fee Approved

class File(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    release_id = db.Column(db.Integer, db.ForeignKey('release.id'), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)
    file_reference = db.Column(db.String(500), nullable=False)

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
    if not bucket:
        logging.error("Google Cloud Storage bucket is not initialized.")
        return None  # Return None if the bucket is not initialized
    safe_filename = secure_filename(file_obj.filename)
    unique_filename = f"{uuid.uuid4().hex}_{safe_filename}"
    blob = bucket.blob(f"{folder_name}/{unique_filename}")
    blob.upload_from_file(file_obj)
    logging.info(f"File {safe_filename} uploaded to {unique_filename}.")
    return unique_filename  # Return the URL to the uploaded file

@app.route('/api/endpoint', methods=['POST'])
def handle_submission():
    logging.info("Handling submission endpoint.")
    file_urls = {}  # Initialize a dictionary to store URLs of the uploaded files
    
    try:
        file_mappings = {
            'audioFile': 'audio',
            'labelCopyPDF': 'pdf',
            'artwork': 'artwork',
            'dolbyAudio': 'dolby'
        }

        for field, folder in file_mappings.items():
            if field in request.files:
                for uploaded_file in request.files.getlist(field):
                    logging.debug(f"Handling {field}...")
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

        album_order = int(request.form.get('albumOrder')) if request.form.get('albumOrder') else None


        release = Release(
            song_title=song_title,
            artist_name=artist_name,
            release_date=release_date,
            label_copy_text=label_copy_text,
            release_instructions=release_instructions,
            is_album=is_album,
            album_order=album_order,
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
        logging.error(str(e))
        return jsonify({"message": f"Error: {str(e)}"}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)