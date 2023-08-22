import React, { useState } from 'react';
import axios from 'axios';

const UploadForm = () => {
    const [songTitle, setSongTitle] = useState('');
    const [releaseDate, setReleaseDate] = useState('');
    const [labelCopyText, setLabelCopyText] = useState('');
    const [releaseInstructions, setReleaseInstructions] = useState('');
    const [audioFile, setAudioFile] = useState(null);
    const [labelCopyPDF, setLabelCopyPDF] = useState(null);
    const [artwork, setArtwork] = useState(null);

    const handleFormSubmit = async (event) => {
        event.preventDefault();

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
    );
};

export default UploadForm;
