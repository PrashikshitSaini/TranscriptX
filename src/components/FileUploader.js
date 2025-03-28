import React, { useState } from "react";
import styled from "styled-components";
import {
  transcribeWithAssemblyAI,
  testApiKey,
} from "../services/transcriptionService";

const UploaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const UploadArea = styled.div`
  border: 2px dashed var(--bg-tertiary);
  border-radius: 6px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: var(--accent-color);
  }
`;

const FileInput = styled.input`
  display: none;
`;

const FileName = styled.div`
  font-size: 14px;
  margin-top: 8px;
  word-break: break-all;
`;

const ProcessingStatus = styled.div`
  font-size: 14px;
  color: var(--accent-color);
  margin-top: 8px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background-color: var(--bg-tertiary);
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;
`;

const Progress = styled.div`
  height: 100%;
  background-color: var(--accent-color);
  width: ${(props) => props.value}%;
  transition: width 0.3s ease;
`;

const ErrorMessage = styled.div`
  color: var(--danger-color);
  background-color: rgba(255, 0, 0, 0.05);
  border: 1px solid rgba(255, 0, 0, 0.1);
  padding: 10px;
  margin-top: 10px;
  border-radius: 4px;
  font-size: 14px;
`;

function FileUploader({ onTranscriptionComplete, setIsProcessing }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = React.createRef();

  React.useEffect(() => {
    const checkApiStatus = async () => {
      const result = await testApiKey();
      if (!result.valid) {
        setError(`API key validation failed: ${result.error}`);
      }
    };

    checkApiStatus();
  }, []);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (
        file.type.startsWith("audio/") ||
        file.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i)
      ) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError("Please select an audio file");
        setSelectedFile(null);
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      if (
        file.type.startsWith("audio/") ||
        file.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i)
      ) {
        setSelectedFile(file);
        setError(null);
        fileInputRef.current.files = event.dataTransfer.files;
      } else {
        setError("Please select an audio file");
        setSelectedFile(null);
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleTranscribe = async () => {
    if (!selectedFile) return;

    setProcessing(true);
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      console.log("Starting transcription for file:", selectedFile.name);

      const transcription = await transcribeWithAssemblyAI(
        selectedFile,
        (progressValue) => {
          setProgress(progressValue);
        }
      );

      if (!transcription || transcription.trim() === "") {
        throw new Error("Received empty transcription from service");
      }

      onTranscriptionComplete(transcription);
    } catch (error) {
      console.error("Transcription error:", error);

      setError(
        `Error: ${error.message || "Failed to transcribe audio"}\n` +
          "Troubleshooting tips:\n" +
          "1. Check your internet connection\n" +
          "2. Make sure file is a supported audio format\n" +
          "3. Try a shorter or different audio file"
      );
    } finally {
      setProcessing(false);
      setIsProcessing(false);
    }
  };

  return (
    <UploaderContainer>
      <h3>Upload Audio File</h3>
      <UploadArea
        onClick={handleUploadClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <p>Click or drag and drop an audio file here</p>
        <small>Supported formats: MP3, WAV, OGG, M4A, FLAC (max 200MB)</small>
        <FileInput
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="audio/*"
        />
        {selectedFile && <FileName>Selected: {selectedFile.name}</FileName>}
      </UploadArea>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {processing && (
        <>
          <ProcessingStatus>
            {progress < 30
              ? "Reading file..."
              : progress < 60
              ? "Uploading audio..."
              : progress < 95
              ? "Transcribing audio..."
              : "Finishing up..."}
            {progress > 0 && ` (${Math.round(progress)}%)`}
          </ProcessingStatus>
          <ProgressBar>
            <Progress value={progress} />
          </ProgressBar>
        </>
      )}

      {selectedFile && !processing && (
        <button
          onClick={handleTranscribe}
          disabled={processing}
          style={{ marginTop: "10px" }}
        >
          Transcribe Audio
        </button>
      )}
    </UploaderContainer>
  );
}

export default FileUploader;
