import React from "react";
import styled from "styled-components";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: ${(props) => (props.isOpen ? 1 : 0)};
  visibility: ${(props) => (props.isOpen ? "visible" : "hidden")};
  transition: opacity 0.3s ease, visibility 0.3s ease;
`;

const ModalContent = styled.div`
  background-color: var(--bg-secondary);
  padding: 25px 30px;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 600px;
  position: relative;
  transform: ${(props) =>
    props.isOpen ? "translateY(0)" : "translateY(-20px)"};
  transition: transform 0.3s ease;
`;

const ModalHeader = styled.div`
  text-align: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
  color: var(--accent-color);
  margin: 0 0 10px 0;
  font-size: 1.8em;
`;

const ModalSubtitle = styled.p`
  color: var(--text-secondary);
  font-size: 1em;
  margin: 0;
`;

const PlansContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
`;

const PlanCard = styled.div`
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  }

  h3 {
    color: var(--text-primary);
    margin-top: 0;
    margin-bottom: 10px;
    font-size: 1.2em;
  }

  p {
    color: var(--text-secondary);
    font-size: 0.9em;
    margin-bottom: 15px;
  }

  .price {
    font-size: 1.4em;
    font-weight: bold;
    color: var(--accent-color);
    margin-bottom: 5px;
  }

  .billing {
    font-size: 0.8em;
    color: var(--text-secondary);
    margin-bottom: 15px;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 0.9em;
    text-align: left;
    color: var(--text-primary);

    li {
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      &::before {
        content: "✓";
        color: var(--accent-color);
        margin-right: 8px;
        font-weight: bold;
      }
    }
  }
`;

const BestValueBadge = styled.span`
  background-color: var(--warning-color);
  color: var(--bg-primary);
  font-size: 0.7em;
  padding: 3px 6px;
  border-radius: 4px;
  font-weight: bold;
  display: inline-block;
  margin-bottom: 10px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 1.8em;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  line-height: 1;

  &:hover {
    color: var(--text-primary);
  }
`;

const ComingSoonText = styled.p`
  text-align: center;
  font-style: italic;
  color: var(--text-secondary);
  font-size: 0.9em;
  margin-top: 15px;
`;

function UpgradeModal({ isOpen, onClose }) {
  return (
    <ModalOverlay isOpen={isOpen} onClick={onClose}>
      <ModalContent isOpen={isOpen} onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <ModalHeader>
          <ModalTitle>🚀 Upgrade to TranscriptX Pro! 🚀</ModalTitle>
          <ModalSubtitle>
            Unlock your full potential and supercharge your productivity.
          </ModalSubtitle>
        </ModalHeader>

        <PlansContainer>
          <PlanCard>
            <h3>Free</h3>
            <p>Get started</p>
            <div className="price">Free</div>
            <div className="billing">Forever</div>
            <ul>
              <li>20 Generations</li>
              <li>Basic Features</li>
            </ul>
          </PlanCard>

          <PlanCard>
            <h3>Monthly Pro</h3>
            <p>Ideal for regular use</p>
            <div className="price">$4.99</div>
            <div className="billing">per month</div>
            <ul>
              <li>50 Generations</li>
              <li>Speaker Identification</li>
              <li>Priority Support</li>
              <li>Early Access Features</li>
            </ul>
          </PlanCard>

          <PlanCard style={{ borderColor: "var(--warning-color)" }}>
            <BestValueBadge>BEST VALUE</BestValueBadge>
            <h3>Yearly Pro</h3>
            <p>For power users</p>
            <div className="price">$50</div>
            <div className="billing">per year (~17% off)</div>
            <ul>
              <li>800 Generations</li>
              <li>Speaker Identification</li>
              <li>Priority Support</li>
              <li>Early Access Features</li>
              <li>Save Big!</li>
            </ul>
          </PlanCard>
        </PlansContainer>

        <ComingSoonText>(Payment processing coming soon!)</ComingSoonText>
      </ModalContent>
    </ModalOverlay>
  );
}

export default UpgradeModal;
