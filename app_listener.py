from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from google.cloud import storage
import os
import json
import uuid

app = Flask(__name__)
CORS(app)

# Configuring database connection
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initializing database with Flask app
db = SQLAlchemy(app)

# Database models
class Song(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    song_title = db.Column(db.String(200), nullable=False)
    artist_name = db.Column(db.String(200), nullable=False)
    release_date = db.Column(db.Date, nullable=False)
    genre = db.Column(db.String(100), nullable=True)
    sub_genre = db.Column(db.String(100), nullable=True)
    song_type = db.Column(db.String(50), nullable=True)

class ISRC(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    isrc_code = db.Column(db.String(15), nullable=False)
    song_id = db.Column(db.Integer, db.ForeignKey('song.id'), nullable=False)

class UPC(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    upc_code = db.Column(db.String(15), nullable=False)
    song_id = db.Column(db.Integer, db.ForeignKey('song.id'), nullable=False)

# Get the Google Credentials from the Environment Variable
creds_info = None
if 'GOOGLE_CREDENTIALS' in os.environ:
    creds_info = json.loads(os.environ['GOOGLE_CREDENTIALS'])

# Initialize GCS client
storage_client = None
bucket = None
if creds_info:
    storage_client = storage.Client.from_service_account_info(creds_info)
    bucket = storage_client.bucket("airya_bucket")

def upload_to_gcs(file_obj, folder_name):
    if not bucket:
        print("Error: Google Cloud Storage bucket is not initialized.")
        return
    unique_filename = f"{uuid.uuid4().hex}_{file_obj.filename}"
    blob = bucket.blob(f"{folder_name}/{unique_filename}")
    blob.upload_from_file(file_obj)
    print(f"File {file_obj.filename} uploaded to {unique_filename}.")

@app.route('/api/endpoint', methods=['POST'])
def handle_submission():
    try:
        # Handling files
        if 'audioFile' in request.files:
            audio_file = request.files['audioFile']
            print("Handling Audio...")
            upload_to_gcs(audio_file, "audio")
        if 'labelCopyPDF' in request.files:
            label_copy_pdf = request.files['labelCopyPDF']
            print("Handling PDF...")
            upload_to_gcs(label_copy_pdf, "pdf")
        if 'artwork' in request.files:
            artwork_file = request.files['artwork']
            print("Handling Artwork...")
            upload_to_gcs(artwork_file, "artwork")

        # Store song metadata in the database
        song_title = request.form.get('songTitle')
        artist_name = request.form.get('artistName')
        release_date = request.form.get('releaseDate')
        genre = request.form.get('genre')
        sub_genre = request.form.get('subGenre')
        song_type = request.form.get('songType')

        song = Song(
            song_title=song_title,
            artist_name=artist_name,
            release_date=release_date,
            genre=genre,
            sub_genre=sub_genre,
            song_type=song_type
        )
        db.session.add(song)
        db.session.commit()

        # After processing the data:
        return jsonify({"message": "Data received and stored successfully!"})
    except Exception as e:
        print(str(e))
        return jsonify({"message": f"Error: {str(e)}"}), 400

@app.before_first_request
def create_tables():
    db.create_all()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
