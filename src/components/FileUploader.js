import React, { useState } from "react";
import styled from "styled-components";
import { testApiKey } from "../services/transcriptionService";

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

const ErrorMessage = styled.div`
  color: var(--danger-color);
  background-color: rgba(255, 0, 0, 0.05);
  border: 1px solid rgba(255, 0, 0, 0.1);
  padding: 10px;
  margin-top: 10px;
  border-radius: 4px;
  font-size: 14px;
`;

const StatusBadge = styled.div`
  display: inline-block;
  background-color: var(--bg-tertiary);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  margin-top: 8px;
  color: ${(props) =>
    props.isError ? "var(--danger-color)" : "var(--success-color)"};
  border: 1px solid
    ${(props) =>
      props.isError ? "var(--danger-color)" : "var(--success-color)"};
`;

function FileUploader({ onFileSelected, setIsProcessing }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const [fileReady, setFileReady] = useState(false);
  const fileInputRef = React.useRef();

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
        if (file.size > 200 * 1024 * 1024) {
          setError("File is too large. Maximum size is 200MB.");
          setSelectedFile(null);
          setFileReady(false);
          return;
        }

        setSelectedFile(file);
        setFileReady(true);
        setError(null);

        // Send the file to the parent component for processing later
        onFileSelected(file);
      } else {
        setError("Please select an audio file");
        setSelectedFile(null);
        setFileReady(false);
        onFileSelected(null);
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (
        file.type.startsWith("audio/") ||
        file.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i)
      ) {
        if (file.size > 200 * 1024 * 1024) {
          setError("File is too large. Maximum size is 200MB.");
          return;
        }

        setSelectedFile(file);
        setFileReady(true);
        setError(null);

        // Send the file to the parent component for processing later
        onFileSelected(file);
      } else {
        setError("Please drop an audio file");
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFileReady(false);
    onFileSelected(null);
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
        {selectedFile && (
          <>
            <FileName>Selected: {selectedFile.name}</FileName>
            <div>
              <StatusBadge isError={false}>Ready for processing</StatusBadge>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                style={{ marginLeft: "8px", fontSize: "12px" }}
              >
                Remove
              </button>
            </div>
          </>
        )}
      </UploadArea>

      {error && <ErrorMessage>{error}</ErrorMessage>}
    </UploaderContainer>
  );
}

export default FileUploader;
