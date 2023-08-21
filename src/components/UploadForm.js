import React, { useState } from 'react';

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
        <div>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Song Title:</label>
                    <input type="text" value={songTitle} onChange={(e) => setSongTitle(e.target.value)} />
                </div>
                <div>
                    <label>Release Date:</label>
                    <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
                </div>
                <div>
                    <label>Label Copy Text:</label>
                    <textarea value={labelCopyText} onChange={(e) => setLabelCopyText(e.target.value)}></textarea>
                </div>
                <div>
                    <label>Release Instructions:</label>
                    <textarea value={releaseInstructions} onChange={(e) => setReleaseInstructions(e.target.value)}></textarea>
                </div>
                <div>
                    <label>Audio File:</label>
                    <input type="file" onChange={(e) => setAudioFile(e.target.files[0])} />
                </div>
                <div>
                    <label>Label Copy PDF:</label>
                    <input type="file" onChange={(e) => setLabelCopyPDF(e.target.files[0])} />
                </div>
                <div>
                    <label>Artwork:</label>
                    <input type="file" onChange={(e) => setArtwork(e.target.files[0])} />
                </div>
                <div>
                    <button type="submit">Submit</button>
                </div>
            </form>
        </div>
    );
}

export default UploadForm;
