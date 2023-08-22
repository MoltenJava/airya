from flask import Flask, request, jsonify
from flask_cors import CORS
from google.cloud import storage
import os
import json
import uuid

app = Flask(__name__)
CORS(app)

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
        # After processing the data:
        return jsonify({"message": "Data received successfully!"})
    except Exception as e:
        print(str(e))
        return jsonify({"message": f"Error: {str(e)}"}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
