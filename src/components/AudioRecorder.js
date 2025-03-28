import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

const RecorderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const RecordButton = styled.button`
  background-color: ${(props) =>
    props.isRecording ? "var(--danger-color)" : "var(--success-color)"};
  flex: 1;
`;

const PauseButton = styled.button`
  background-color: var(--bg-tertiary);
  flex: 1;
  opacity: ${(props) => (!props.isRecording ? 0.5 : 1)};
`;

const RecordingStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  margin-top: 8px;
`;

const RecordingIndicator = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.isRecording ? "var(--danger-color)" : "var(--bg-tertiary)"};
  animation: ${(props) => (props.isRecording ? "pulse 1.5s infinite" : "none")};

  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }
`;

function AudioRecorder({ isRecording, setIsRecording, onTranscriptionUpdate }) {
  const [isPaused, setIsPaused] = useState(false);
  const {
    transcript,
    resetTranscript,
    listening,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition({
    commands: [],
  });
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    if (transcript) {
      onTranscriptionUpdate(transcript);
    }
  }, [transcript, onTranscriptionUpdate]);

  const startRecording = async () => {
    resetTranscript();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start();

      try {
        await SpeechRecognition.startListening({ continuous: true });
      } catch (err) {
        console.error("Speech recognition error:", err);
        // Continue with recording even if speech recognition fails
      }

      setIsRecording(true);
      setIsPaused(false);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert(
        "Unable to access your microphone. Please check permissions and try again."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      SpeechRecognition.stopListening();

      mediaRecorderRef.current.onstop = () => {
        // We can save the audio if needed
        audioChunksRef.current = [];
      };

      // Stop all tracks on the stream
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const togglePause = () => {
    if (!isRecording) return;

    if (isPaused) {
      // Resume recording
      SpeechRecognition.startListening({ continuous: true });
      mediaRecorderRef.current.resume();
    } else {
      // Pause recording
      SpeechRecognition.stopListening();
      mediaRecorderRef.current.pause();
    }

    setIsPaused(!isPaused);
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <RecorderContainer>
        <h3>Record Audio</h3>
        <div style={{ color: "var(--text-secondary)" }}>
          Your browser doesn't support speech recognition. Try using Chrome.
        </div>
        <ButtonsContainer>
          <RecordButton
            isRecording={isRecording}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? "Stop" : "Record"}
          </RecordButton>
          <PauseButton
            isRecording={isRecording}
            onClick={togglePause}
            disabled={!isRecording}
          >
            {isPaused ? "Resume" : "Pause"}
          </PauseButton>
        </ButtonsContainer>
      </RecorderContainer>
    );
  }

  return (
    <RecorderContainer>
      <h3>Record Audio</h3>
      <ButtonsContainer>
        <RecordButton
          isRecording={isRecording}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? "Stop" : "Record"}
        </RecordButton>
        <PauseButton
          isRecording={isRecording}
          onClick={togglePause}
          disabled={!isRecording}
        >
          {isPaused ? "Resume" : "Pause"}
        </PauseButton>
      </ButtonsContainer>

      <RecordingStatus>
        <RecordingIndicator isRecording={listening} />
        {isRecording
          ? isPaused
            ? "Recording paused"
            : "Recording in progress..."
          : "Ready to record"}
      </RecordingStatus>
    </RecorderContainer>
  );
}

export default AudioRecorder;
