import React, { useState } from 'react';
import { Form, Button, Alert, Spinner, Container } from 'react-bootstrap';

const UploadForm = () => {
    const [audioFileKey, setAudioFileKey] = useState(Math.random().toString(36).substr(2, 9));
    const [artworkFileKey, setArtworkFileKey] = useState(Math.random().toString(36).substr(2, 9));
    const [pdfFileKey, setPdfFileKey] = useState(Math.random().toString(36).substr(2, 9));

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
    const [dolbyFileKey, setDolbyFileKey] = useState(0);
    const [algorithmSupportAcknowledged, setAlgorithmSupportAcknowledged] = useState(false);

    const getSignedUrl = async (fileName, contentType) => {
        const response = await fetch(`/api/get-signed-url?filename=${fileName}&contentType=${contentType}`);
        const data = await response.json();
        return data.signedUrl;
    }

    const uploadToGCS = async (signedUrl, file) => {
        const response = await fetch(signedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type
            }
        });
        return response.ok;
    }

    // New state declarations for album functionality
    const [isAlbum, setIsAlbum] = useState(false);

    const removeFile = (setterFunction, resetKeyFunction) => {
        setterFunction(null);
        resetKeyFunction(Math.random().toString(36).substr(2, 9));
    };

    // Enhanced handler for file selection
    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 1) {
            setIsAlbum(true);
        } else {
            setIsAlbum(false);
            setShowDolbyOption(true);
        }
        setAudioFile(files);
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

    try {
        // Fetch signed URL and Upload audio files directly to GCS
        const audioUrls = [];
        for (const file of audioFile) {
            const signedUrl = await getSignedUrl(file.name, file.type);
            const uploaded = await uploadToGCS(signedUrl, file);
            if (!uploaded) {
                throw new Error("Failed to upload audio to GCS");
            }
            audioUrls.push(signedUrl.split('?')[0]);
        }

        const artworkSignedUrl = await getSignedUrl(artwork.name, artwork.type);
        const artworkUploaded = await uploadToGCS(artworkSignedUrl, artwork);
        if (!artworkUploaded) {
            throw new Error("Failed to upload artwork to GCS");
        }

        const labelCopyPDFSignedUrl = await getSignedUrl(labelCopyPDF.name, labelCopyPDF.type);
        const labelCopyPDFUploaded = await uploadToGCS(labelCopyPDFSignedUrl, labelCopyPDF);
        if (!labelCopyPDFUploaded) {
            throw new Error("Failed to upload label copy PDF to GCS");
        }

        let dolbyAudioUrls = [];
        if (dolbyAudio && Array.isArray(dolbyAudio)) {
            for (const file of dolbyAudio) {
                const signedUrl = await getSignedUrl(file.name, file.type);
                const uploaded = await uploadToGCS(signedUrl, file);
                if (!uploaded) {
                    throw new Error("Failed to upload Dolby audio to GCS");
                }
                dolbyAudioUrls.push(signedUrl.split('?')[0]);
            }
        }

        // Construct formData with GCS URLs and metadata, not the file blobs
        const formData = new FormData();
        audioUrls.forEach((url, index) => {
            formData.append(`audioUrl_${index}`, url);
        });
        formData.append('artworkUrl', artworkSignedUrl.split('?')[0]);
        formData.append('labelCopyPDFUrl', labelCopyPDFSignedUrl.split('?')[0]);
        dolbyAudioUrls.forEach((url, index) => {
            formData.append(`dolbyAudioUrl_${index}`, url);
        });
        
        // Append the remaining metadata to the formData
        formData.append('songTitle', songTitle);
        formData.append('releaseDate', releaseDate);
        formData.append('labelCopyText', labelCopyText);
        formData.append('releaseInstructions', releaseInstructions);
        formData.append('artistName', artistName);

        const response = await fetch('/api/endpoint', {
            method: 'POST',
            body: formData,
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message);
        }

        console.log(responseData.message);
        setLoading(false);
        setSuccess(true);
    } catch (error) {
        console.error("There was an error uploading the data:", error);
        setLoading(false);
        setSuccess(false);
        alert("There was an error uploading the data.");
    }
};


    return (
        <Container className="mt-5 d-flex flex-column align-items-center">
            <Form noValidate validated={validated} onSubmit={handleFormSubmit}>
                <Form.Group>
                    <Form.Control type="text" placeholder="Project Title" value={songTitle} onChange={e => setSongTitle(e.target.value)} required />
                </Form.Group>
                <Form.Group>
                    <Form.Control type="text" placeholder="Artist Name" value={artistName} onChange={e => setartistName(e.target.value)} required />
                </Form.Group>
                <Form.Group>
                    <Form.Label>Release Date</Form.Label>
                    <Form.Control type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} required />
                </Form.Group>
                {new Date(releaseDate) - new Date() <= 10 * 24 * 60 * 60 * 1000 && (
    <Form.Group>
        <Form.Check 
            type="checkbox" 
            label="I understand I will lose algorithm support because my release is under 10 days." 
            onChange={e => setAlgorithmSupportAcknowledged(e.target.checked)} 
            required />
    </Form.Group>
)}
                <Form.Group>
                    <Form.Control as="textarea" placeholder="Label Copy Text" value={labelCopyText} onChange={e => setLabelCopyText(e.target.value)} />
                </Form.Group>

                <Form.Group>
                <Form.Label>{isAlbum ? 'Album (WAVs)' : 'Audio File (WAV)'}</Form.Label>
                <Form.Control type="file" accept=".wav" key={audioFileKey} onChange={handleFileSelect} multiple required />
                {Array.isArray(audioFile) && audioFile.map((file, index) => (
                    <div key={index}>
                        <span>{file.name}</span>
                        <Button variant="danger" size="sm" onClick={() => {
                            const newFiles = audioFile.filter((_, idx) => idx !== index);
                            setAudioFile(newFiles.length ? newFiles : null);
                            setFileKey(prevKey => prevKey + 1); // Increment the key to "reset" the input
                        }}>Remove</Button>
                    </div>
                ))}
                </Form.Group>

                {showDolbyOption && (
                    <Form.Group>
                        <Form.Label>Dolby Audio Upload</Form.Label>
                        <Form.Control type="file" accept=".wav" key={dolbyFileKey} multiple={isAlbum} onChange={e => setDolbyAudio(Array.from(e.target.files))} />
                        {Array.isArray(dolbyAudio) && dolbyAudio.map((file, index) => (
                            <div key={index}>
                                <span>{file.name}</span>
                                <Button variant="danger" size="sm" onClick={() => {
                                    const newFiles = dolbyAudio.filter((_, idx) => idx !== index);
                                    setDolbyAudio(newFiles.length ? newFiles : null);
                                    setDolbyFileKey(prevKey => prevKey + 1); // Increment the key to "reset" the input
                                }}>Remove</Button>
                            </div>
                        ))}
                    </Form.Group>
                )}


                <Form.Group>
                    <Form.Label>Artwork (TIFF)</Form.Label>
                    <Form.Control type="file" accept=".tif, .tiff" key={artworkFileKey} onChange={e => setArtwork(e.target.files[0])} required />
                    {artwork && <Button variant="danger" size="sm" onClick={() => removeFile(setArtwork, setArtworkFileKey)}>Remove</Button>}
                </Form.Group>

                <Form.Group>
                    <Form.Label>Label Copy PDF</Form.Label>
                    <Form.Control type="file" accept=".pdf" key={pdfFileKey} onChange={e => setLabelCopyPDF(e.target.files[0])} required={!labelCopyText} />
                    {labelCopyPDF && <Button variant="danger" size="sm" onClick={() => removeFile(setLabelCopyPDF, setPdfFileKey)}>Remove</Button>}
                </Form.Group>

                <Form.Group>
                    <Form.Control as="textarea" placeholder="Release Instructions" value={releaseInstructions} onChange={e => setReleaseInstructions(e.target.value)} />
                </Form.Group>

                {new Date(releaseDate) - new Date() <= 5 * 24 * 60 * 60 * 1000 && (
                    <Form.Group>
                        <Form.Check type="checkbox" label="I approve the RUSH FEE as my release date is less than 5 days away." onChange={e => setRushFeeApproved(e.target.checked)} required />
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