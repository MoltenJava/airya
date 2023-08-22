import React, { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import './UploadForm.css';

function UploadForm() {
    const [songTitle, setSongTitle] = useState('');
    const [releaseDate, setReleaseDate] = useState('');
    const [labelCopyText, setLabelCopyText] = useState('');
    const [releaseInstructions, setReleaseInstructions] = useState('');
    const [audioFile, setAudioFile] = useState(null);
    const [labelCopyPDF, setLabelCopyPDF] = useState(null);
    const [artwork, setArtwork] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('songTitle', songTitle);
        formData.append('releaseDate', releaseDate);
        formData.append('labelCopyText', labelCopyText);
        formData.append('releaseInstructions', releaseInstructions);
        formData.append('audioFile', audioFile);
        formData.append('labelCopyPDF', labelCopyPDF);
        formData.append('artwork', artwork);

        try {
            const response = await fetch('http://localhost:5001/api/endpoint', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            alert(result.message);
        } catch (error) {
            alert('There was an error uploading your data.');
        }
    };

    return (
        <div className="upload-form">
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>Song Title:</Form.Label>
                    <Form.Control type="text" value={songTitle} onChange={(e) => setSongTitle(e.target.value)} />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Release Date:</Form.Label>
                    <Form.Control type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Label Copy Text:</Form.Label>
                    <Form.Control as="textarea" value={labelCopyText} onChange={(e) => setLabelCopyText(e.target.value)} />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Release Instructions:</Form.Label>
                    <Form.Control as="textarea" value={releaseInstructions} onChange={(e) => setReleaseInstructions(e.target.value)} />
                </Form.Group>

                <Form.Group controlId="audioFile" className="mb-3">
                    <Form.Label>Audio File:</Form.Label>
                    <Form.Control type="file" accept=".mp3,.wav,.mpeg" onChange={(e) => setAudioFile(e.target.files[0])} />
                </Form.Group>

                <Form.Group controlId="labelCopyPDF" className="mb-3">
                    <Form.Label>Label Copy PDF:</Form.Label>
                    <Form.Control type="file" accept=".pdf" onChange={(e) => setLabelCopyPDF(e.target.files[0])} />
                </Form.Group>

                <Form.Group controlId="artwork" className="mb-3">
                    <Form.Label>Artwork:</Form.Label>
                    <Form.Control type="file" accept="image/*" onChange={(e) => setArtwork(e.target.files[0])} />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Button variant="primary" type="submit">Submit</Button>
                </Form.Group>
            </Form>
        </div>
    );
}

export default UploadForm;
