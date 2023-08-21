import React from 'react';
import { Button, Form } from 'react-bootstrap';
import './UploadForm.css'; // Assuming you have a stylesheet named UploadForm.css in the same directory

const UploadForm = () => {
  return (
    <div className="upload-container d-flex justify-content-center align-items-center">
      <div>
        <h1 className="text-center mb-4">AiRYA Upload Form</h1> 
        <Form>
          <Form.Group controlId="songTitle">
            <Form.Label>Song Title</Form.Label>
            <Form.Control type="text" placeholder="Enter song title" />
          </Form.Group>
        <Form.Group controlId="releaseDate">
            <Form.Label>Release Date</Form.Label>
            <Form.Control type="date" />
        </Form.Group>
        <Form.Group controlId="formFileSm" className="mb-3">
            <Form.Label>Label Copy PDF</Form.Label>
            <Form.Control type="file" size="sm" />
        <Form.Group controlId="labelCopyText" className="mb-3">
            <Form.Label>Or Paste Label Copy Text</Form.Label>
            <Form.Control as="textarea" rows={3} placeholder="Optional label copy paste here..." />
        </Form.Group>
        <Form.Group controlId="formAudioUpload" className="mb-3">
            <Form.Label>Upload Audio File</Form.Label>
            <Form.Control type="file" size="sm" accept="audio/*" />
        </Form.Group>
        <Form.Group controlId="formArtwork" className="mb-3">
            <Form.Label>Artwork Upload</Form.Label>
            <Form.Control type="file" size="sm" placeholder="Upload your artwork here." />
        </Form.Group>
        <Form.Group controlId="formReleaseInstructions" className="mb-3">
            <Form.Label>Release Instructions (optional)</Form.Label>
            <Form.Control as="textarea" rows={3} placeholder="Enter any special release requests or other instructions here." />
        </Form.Group>
        </Form.Group>
          {/* ... Continue defining other form fields ... */}
          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Form>
      </div>
    </div>
  );
}

export default UploadForm;
