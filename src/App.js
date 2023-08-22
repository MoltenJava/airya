import React from 'react';
import './App.css';
import UploadForm from './components/UploadForm';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <>
      <header className="App-header">
        <h1>AiRYA Music Submission</h1>
      </header>
      <UploadForm />
    </>
  );
}

export default App;
