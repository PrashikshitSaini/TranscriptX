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

const StatusText = styled.div`
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 2px;
`;

const RecordingLength = styled.div`
  font-size: 13px;
  color: var(--accent-color);
  margin-left: auto;
`;

function AudioRecorder({ isRecording, setIsRecording, onAudioRecorded }) {
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const { listening, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRecording, isPaused]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      setRecordingTime(0);
      setRecordingComplete(false);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        setRecordingComplete(true);

        onAudioRecorded(audioBlob);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert(
        "Could not access microphone. Please check your browser permissions."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const togglePause = () => {
    if (!isRecording) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
    } else {
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
        <RecordingIndicator isRecording={isRecording && !isPaused} />
        {isRecording ? (
          <>
            <StatusText>
              {isPaused ? "Recording paused" : "Recording in progress..."}
            </StatusText>
            <RecordingLength>{formatTime(recordingTime)}</RecordingLength>
          </>
        ) : recordingComplete ? (
          <StatusText>Recording ready for processing</StatusText>
        ) : (
          <StatusText>Ready to record</StatusText>
        )}
      </RecordingStatus>
    </RecorderContainer>
  );
}

export default AudioRecorder;
