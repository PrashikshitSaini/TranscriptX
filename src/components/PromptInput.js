import React, { useState } from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
`;

const Label = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  display: flex;
  justify-content: space-between;
`;

const InfoButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: help;

  &:hover {
    color: var(--accent-color);
  }
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 10px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;

  &:focus {
    border-color: var(--accent-color);
    outline: none;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const InfoModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: var(--bg-secondary);
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
`;

const ModalTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 16px;
  color: var(--accent-color);
`;

const CloseButton = styled.button`
  margin-top: 16px;
  align-self: flex-end;
`;

const ExamplesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
`;

const ExampleButton = styled.button`
  text-align: left;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    border-color: var(--accent-color);
  }
`;

function PromptInput({ value, onChange, disabled = false }) {
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  const promptExamples = [
    "Create concise and organized study notes with key concepts highlighted and examples included.",
    "Generate detailed meeting minutes with action items, decisions made, and follow-up tasks.",
    "Summarize this lecture into bullet points with definitions of technical terms.",
    "Create notes using the Cornell note-taking system with questions on the left and answers on the right.",
    "Format these notes for a medical consultation with patient history, symptoms, and treatment plan.",
  ];

  const applyExample = (example) => {
    onChange(example);
    setShowInfoModal(false);
  };

  return (
    <Container>
      <Label>
        Customize Your Notes
        <InfoButton onClick={() => setShowInfoModal(true)}>ⓘ Tips</InfoButton>
      </Label>
      <StyledTextarea
        value={value}
        onChange={handleChange}
        placeholder="Describe how you want your notes formatted..."
        disabled={disabled}
      />

      {showInfoModal && (
        <InfoModal onClick={() => setShowInfoModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Prompt Tips</ModalTitle>
            <p>
              Your prompt guides how the AI formats and structures your notes.
              Be specific about:
            </p>
            <ul>
              <li>Format (bullet points, headings, Q&A format)</li>
              <li>Length (concise, detailed, comprehensive)</li>
              <li>Focus areas (key concepts, action items, definitions)</li>
              <li>Purpose (study notes, meeting minutes, research summary)</li>
            </ul>

            <ExamplesContainer>
              <p>
                <strong>Try these examples:</strong>
              </p>
              {promptExamples.map((example, index) => (
                <ExampleButton
                  key={index}
                  onClick={() => applyExample(example)}
                >
                  {example}
                </ExampleButton>
              ))}
            </ExamplesContainer>

            <CloseButton onClick={() => setShowInfoModal(false)}>
              Close
            </CloseButton>
          </ModalContent>
        </InfoModal>
      )}
    </Container>
  );
}

export default PromptInput;
