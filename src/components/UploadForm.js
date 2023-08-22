import React, { useState } from 'react';
<<<<<<< HEAD
import axios from 'axios';
=======
import { Button, Form } from 'react-bootstrap';
import './UploadForm.css';
>>>>>>> tmp

const UploadForm = () => {
    const [songTitle, setSongTitle] = useState('');
    const [releaseDate, setReleaseDate] = useState('');
    const [labelCopyText, setLabelCopyText] = useState('');
    const [releaseInstructions, setReleaseInstructions] = useState('');
    const [audioFile, setAudioFile] = useState(null);
    const [labelCopyPDF, setLabelCopyPDF] = useState(null);
    const [artwork, setArtwork] = useState(null);

<<<<<<< HEAD
    const handleFormSubmit = async (event) => {
        event.preventDefault();
=======
    const handleSubmit = async (e) => {
        e.preventDefault();
>>>>>>> tmp

        const formData = new FormData();
        formData.append('songTitle', songTitle);
        formData.append('releaseDate', releaseDate);
        formData.append('labelCopyText', labelCopyText);
        formData.append('releaseInstructions', releaseInstructions);
        formData.append('audioFile', audioFile);
        formData.append('labelCopyPDF', labelCopyPDF);
        formData.append('artwork', artwork);

        try {
            const response = await axios.post('/api/endpoint', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log(response.data);
        } catch (error) {
            console.error("Error uploading files:", error);
        }
    };

    return (
<<<<<<< HEAD
        <form onSubmit={handleFormSubmit}>
            <input type="text" placeholder="Song Title" value={songTitle} onChange={e => setSongTitle(e.target.value)} />
            <input type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} />
            <textarea placeholder="Label Copy Text" value={labelCopyText} onChange={e => setLabelCopyText(e.target.value)}></textarea>
            <textarea placeholder="Release Instructions" value={releaseInstructions} onChange={e => setReleaseInstructions(e.target.value)}></textarea>
            <input type="file" onChange={e => setAudioFile(e.target.files[0])} />
            <input type="file" onChange={e => setLabelCopyPDF(e.target.files[0])} />
            <input type="file" onChange={e => setArtwork(e.target.files[0])} />
            <button type="submit">Upload</button>
        </form>
=======
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
>>>>>>> tmp
    );
};

export default UploadForm;
