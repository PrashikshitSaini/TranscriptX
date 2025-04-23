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

const ErrorMessage = styled.div`
  margin-top: 8px;
  padding: 8px;
  background-color: rgba(234, 67, 53, 0.1);
  color: var(--danger-color);
  border-radius: 4px;
  font-size: 13px;
`;

const PermissionButton = styled.button`
  background-color: var(--accent-color);
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  margin-top: 8px;
  cursor: pointer;
`;

function AudioRecorder({ isRecording, setIsRecording, onAudioRecorded }) {
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState("prompt"); // 'prompt', 'granted', 'denied'
  const [errorMessage, setErrorMessage] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const { listening, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  useEffect(() => {
    // Check for microphone permission on mount
    checkMicrophonePermission();

    return () => {
      // Cleanup on unmount
      if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
      }
      clearInterval(timerRef.current);
    };
  }, []);

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

  const checkMicrophonePermission = async () => {
    try {
      // Use navigator.permissions if available (not supported in all browsers)
      if (navigator.permissions && navigator.permissions.query) {
        const permissionResult = await navigator.permissions.query({
          name: "microphone",
        });
        setPermissionStatus(permissionResult.state);

        // Listen for permission changes
        permissionResult.onchange = () => {
          setPermissionStatus(permissionResult.state);
        };
      }
    } catch (error) {
      console.log(
        "Permissions API not supported, will check on record attempt"
      );
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      setErrorMessage("");
      // Attempt to get user media to prompt for permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Got permission, clean up the test stream
      stream.getTracks().forEach((track) => track.stop());
      setPermissionStatus("granted");
      return true;
    } catch (error) {
      console.error("Microphone permission error:", error);
      setPermissionStatus("denied");
      setErrorMessage(getMicrophoneErrorMessage(error));
      return false;
    }
  };

  const getMicrophoneErrorMessage = (error) => {
    if (
      error.name === "NotAllowedError" ||
      error.name === "PermissionDeniedError"
    ) {
      return "Microphone access was denied. Please enable microphone access in your browser settings and try again.";
    } else if (
      error.name === "NotFoundError" ||
      error.name === "DevicesNotFoundError"
    ) {
      return "No microphone detected. Please connect a microphone and try again.";
    } else if (
      error.name === "NotReadableError" ||
      error.name === "TrackStartError"
    ) {
      return "Your microphone is busy or unavailable. Please close other applications using the microphone.";
    } else if (error.name === "OverconstrainedError") {
      return "The requested microphone settings are not available on your device.";
    } else if (error.name === "TypeError" && error.message.includes("SSL")) {
      return "Microphone access requires a secure connection (HTTPS).";
    }
    return `Microphone error: ${error.message || "Unknown error"}`;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      // First check/request permission
      setErrorMessage("");

      if (permissionStatus === "denied") {
        const permissionGranted = await requestMicrophonePermission();
        if (!permissionGranted) {
          return;
        }
      }

      audioChunksRef.current = [];
      setRecordingTime(0);
      setRecordingComplete(false);

      // Use more specific audio constraints for better mobile compatibility
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: { ideal: 44100 },
          channelCount: { ideal: 1 },
        },
      });

      // Create an audio context for mobile compatibility
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          audioContextRef.current = new AudioContext();
          // On iOS, we need to resume the audio context after user interaction
          if (audioContextRef.current.state === "suspended") {
            await audioContextRef.current.resume();
          }
        }
      }

      // Initialize MediaRecorder with options for better mobile support
      // Let the browser decide the MIME type rather than forcing wav
      let options = {};

      // Only specify MIME types if we know they're supported
      if (MediaRecorder.isTypeSupported("audio/webm")) {
        options = { mimeType: "audio/webm" };
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        options = { mimeType: "audio/mp4" };
      } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
        options = { mimeType: "audio/ogg" };
      }

      mediaRecorderRef.current = new MediaRecorder(stream, options);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        // Determine the MIME type from the recorder
        const mimeType = mediaRecorderRef.current.mimeType || "audio/webm";

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType,
        });
        setRecordingComplete(true);
        onAudioRecorded(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      // Use smaller time slices for more frequent ondataavailable events
      // This helps with progressive capture, especially on mobile
      mediaRecorderRef.current.start(1000); // 1-second chunks
      setPermissionStatus("granted");
      setIsRecording(true);
      setIsPaused(false);
    } catch (error) {
      console.error("Error starting recording:", error);
      setErrorMessage(getMicrophoneErrorMessage(error));
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

      {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

      {permissionStatus === "denied" ? (
        <div>
          <p style={{ color: "var(--text-secondary)" }}>
            Microphone access is required to record audio.
          </p>
          <PermissionButton onClick={requestMicrophonePermission}>
            Allow Microphone Access
          </PermissionButton>
        </div>
      ) : (
        <>
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
        </>
      )}
    </RecorderContainer>
  );
}

export default AudioRecorder;
