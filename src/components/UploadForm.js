import React, { useState } from 'react';
import { Form, Button, Alert, Spinner, Container } from 'react-bootstrap';

const UploadForm = () => {
    const [fileKey, setFileKey] = useState(Math.random().toString(36).substr(2, 9));
    const [songTitle, setSongTitle] = useState('');
    const [releaseDate, setReleaseDate] = useState('');
    const [labelCopyText, setLabelCopyText] = useState('');
    const [audioFile, setAudioFile] = useState(null);
    const [labelCopyPDF, setLabelCopyPDF] = useState(null);
    const [artwork, setArtwork] = useState(null);
    const [dolbyAudio, setDolbyAudio] = useState(null);
    const [showDolbyOption, setShowDolbyOption] = useState(false);
    const [rushFeeApproved, setRushFeeApproved] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [validated, setValidated] = useState(false);
    const [releaseInstructions, setReleaseInstructions] = useState('');
    const [artistName, setartistName] = useState('');

    const removeFile = (setterFunction) => {
        setterFunction(null);
        setFileKey(Math.random().toString(36).substr(2, 9)); // Refresh key to reset the input field
    };

    const handleFormSubmit = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;

        const dateDiff = new Date(releaseDate) - new Date();
        if (dateDiff <= 5 * 24 * 60 * 60 * 1000 && !rushFeeApproved) {
            alert("Please approve the RUSH FEE as the release date is less than 5 days away!");
            return;
        }

        if (!form.checkValidity()) {
            event.stopPropagation();
            setValidated(true);
            return;
        }

        setLoading(true);
        
        const formData = new FormData();
        formData.append('audioFile', audioFile);
        formData.append('artwork', artwork);
        formData.append('labelCopyPDF', labelCopyPDF);
        if (dolbyAudio) {
            formData.append('dolbyAudio', dolbyAudio);
        }
        formData.append('songTitle', songTitle);
        formData.append('releaseDate', releaseDate);
        formData.append('labelCopyText', labelCopyText);
        formData.append('releaseInstructions', releaseInstructions);
        formData.append('artistName', artistName);

        try {
            // Send data to backend
            const response = await fetch('/api/endpoint', {
                method: 'POST',
                body: formData,
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message);
            }

            // Handle the success case
            console.log(responseData.message);
            setLoading(false);
            setSuccess(true);
        } catch (error) {
            console.error("There was an error uploading the data:", error);
            setLoading(false);
            setSuccess(false);
            alert("There was an error uploading the data.");
        }

        setLoading(false);
        setSuccess(true);
    };

    return (
        <Container className="mt-5 d-flex flex-column align-items-center">
            <Form noValidate validated={validated} onSubmit={handleFormSubmit}>
                <Form.Group>
                    <Form.Control type="text" placeholder="Song Title" value={songTitle} onChange={e => setSongTitle(e.target.value)} required />
                </Form.Group>
                <Form.Group>
                    <Form.Control type="text" placeholder="Artist Name" value={songTitle} onChange={e => setartistName(e.target.value)} required />
                </Form.Group>
                <Form.Group>
                    <Form.Label>Release Date</Form.Label>
                    <Form.Control type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} required />
                </Form.Group>
                <Form.Group>
                    <Form.Control as="textarea" placeholder="Label Copy Text" value={labelCopyText} onChange={e => setLabelCopyText(e.target.value)} />
                </Form.Group>

                {/* Audio File Upload */}
                <Form.Group>
                    <Form.Label>Audio File (WAV)</Form.Label>
                    <Form.Control type="file" accept=".wav" key={fileKey} onChange={e => { setAudioFile(e.target.files[0]); setShowDolbyOption(true); }} required />
                    {audioFile && <Button variant="danger" size="sm" onClick={() => removeFile(setAudioFile)}>Remove</Button>}
                </Form.Group>
                
                {showDolbyOption && (
                    <Form.Group>
                        <Form.Label>Dolby Audio Upload</Form.Label>
                        <Form.Control type="file" accept=".wav" key={fileKey} onChange={e => setDolbyAudio(e.target.files[0])} />
                        {dolbyAudio && <Button variant="danger" size="sm" onClick={() => removeFile(setDolbyAudio)}>Remove</Button>}
                    </Form.Group>
                )}

                {/* Artwork Upload */}
                <Form.Group>
                    <Form.Label>Artwork (TIFF)</Form.Label>
                    <Form.Control type="file" accept=".tif, .tiff" key={fileKey} onChange={e => setArtwork(e.target.files[0])} required />
                    {artwork && <Button variant="danger" size="sm" onClick={() => removeFile(setArtwork)}>Remove</Button>}
                </Form.Group>

                {/* Label Copy PDF Upload */}
                <Form.Group>
                    <Form.Label>Label Copy PDF</Form.Label>
                    <Form.Control type="file" accept=".pdf" key={fileKey} onChange={e => setLabelCopyPDF(e.target.files[0])} required={!labelCopyText} />
                    {labelCopyPDF && <Button variant="danger" size="sm" onClick={() => removeFile(setLabelCopyPDF)}>Remove</Button>}
                </Form.Group>

                <Form.Group>
                    <Form.Control as="textarea" placeholder="Release Instructions" value={releaseInstructions} onChange={e => setReleaseInstructions(e.target.value)} />
                </Form.Group>

                {new Date(releaseDate) - new Date() <= 5 * 24 * 60 * 60 * 1000 && (
                    <Form.Group controlId="rushFeeCheckbox">
                        <Form.Check 
                            type="checkbox"
                            label="<- check here to approve RUSH FEE!"
                            onChange={() => setRushFeeApproved(!rushFeeApproved)}
                            required
                        />
                    </Form.Group>
                )}

                <Button type="submit" disabled={loading}>
                    {loading ? <Spinner animation="border" size="sm" /> : 'Upload'}
                </Button>

                {success && <Alert variant="success" className="mt-3">Files successfully uploaded!</Alert>}
            </Form>
        </Container>
    );
};

export default UploadForm;
