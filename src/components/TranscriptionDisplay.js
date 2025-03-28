import React from "react";
import styled from "styled-components";

const TranscriptionContainer = styled.div`
  background-color: var(--bg-secondary);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  flex: 1;
  min-height: 200px;
  max-height: 300px;
  overflow-y: auto;
  position: relative;
`;

const TranscriptionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const TranscriptionTitle = styled.h3`
  margin: 0;
  color: var(--text-primary);
`;

const LiveIndicator = styled.div`
  display: flex;
  align-items: center;
  font-size: 14px;
  color: ${(props) =>
    props.isActive ? "var(--success-color)" : "var(--text-secondary)"};

  &::before {
    content: "";
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${(props) =>
      props.isActive ? "var(--success-color)" : "var(--text-secondary)"};
    margin-right: 8px;
    ${(props) => (props.isActive ? "animation: pulse 1.5s infinite;" : "")}
  }

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

const TranscriptionText = styled.div`
  white-space: pre-wrap;
  line-height: 1.5;
  color: var(--text-primary);
`;

const Placeholder = styled.div`
  color: var(--text-secondary);
  font-style: italic;
  text-align: center;
  margin-top: 60px;
`;

const GenerateIndicator = styled.div`
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: rgba(45, 45, 45, 0.8);
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--accent-color);
  display: ${(props) => (props.show ? "block" : "none")};
`;

const ScrollToBottomButton = styled.button`
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: var(--bg-tertiary);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.3s;

  &:hover {
    opacity: 1;
  }

  &::after {
    content: "↓";
    font-size: 18px;
  }
`;

const MockIndicator = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: var(--bg-tertiary);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  display: ${(props) => (props.show ? "block" : "none")};
`;

function TranscriptionDisplay({ transcription, isRecording, isMock }) {
  const transcriptionRef = React.useRef(null);
  const hasContent = transcription && transcription.trim().length > 0;

  const scrollToBottom = () => {
    if (transcriptionRef.current) {
      transcriptionRef.current.scrollTop =
        transcriptionRef.current.scrollHeight;
    }
  };

  // Auto-scroll to bottom when new content is added during recording
  React.useEffect(() => {
    if (isRecording && transcriptionRef.current) {
      scrollToBottom();
    }
  }, [transcription, isRecording]);

  return (
    <TranscriptionContainer ref={transcriptionRef}>
      <TranscriptionHeader>
        <TranscriptionTitle>Transcription</TranscriptionTitle>
        {isRecording && (
          <LiveIndicator isActive={isRecording}>Live</LiveIndicator>
        )}
        {isMock && <MockIndicator show={true}>Demo Mode</MockIndicator>}
      </TranscriptionHeader>

      {hasContent ? (
        <>
          <TranscriptionText>{transcription}</TranscriptionText>
          <ScrollToBottomButton onClick={scrollToBottom} />
          <GenerateIndicator show={hasContent && !isRecording}>
            Transcription ready! Click "Generate Notes" to proceed
          </GenerateIndicator>
        </>
      ) : (
        <Placeholder>
          {isRecording
            ? "Speak to see the transcription here..."
            : "Record audio or upload a file to see transcription here"}
        </Placeholder>
      )}
    </TranscriptionContainer>
  );
}

export default TranscriptionDisplay;
