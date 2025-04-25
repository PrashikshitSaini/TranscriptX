import React, { useState } from "react"; // Import useState
import styled from "styled-components";
import { useUsage } from "../contexts/UsageContext";
import UpgradeModal from "./UpgradeModal"; // Import the new modal

const Container = styled.div`
  margin: 12px 0;
  padding: 10px;
  background-color: var(--bg-tertiary);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
  display: flex;
  justify-content: space-between;
`;

const UsageLabel = styled.span`
  color: var(--text-primary);
`;

const CountBadge = styled.span`
  color: ${(props) =>
    props.isNearLimit ? "var(--danger-color)" : "var(--accent-color)"};
  font-weight: ${(props) => (props.isNearLimit ? "bold" : "normal")};
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 6px;
  background-color: var(--bg-primary);
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressBar = styled.div`
  height: 100%;
  width: ${(props) => props.percentage}%;
  background-color: ${(props) =>
    props.percentage > 90
      ? "var(--danger-color)"
      : props.percentage > 70
      ? "var(--warning-color)"
      : "var(--accent-color)"};
  border-radius: 4px;
  transition: width 0.5s ease-in-out;
`;

const Hint = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
  margin-top: 4px;
`;

const LocalStorageIcon = styled.span`
  display: inline-block;
  margin-left: 6px;
  font-size: 12px;
  color: var(--warning-color);
  cursor: help;
`;

const UpgradeButton = styled.button`
  display: block;
  width: 100%;
  margin-top: 10px;
  padding: 6px 12px;
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #3a76d8; /* Darker accent color */
  }

  &:disabled {
    background-color: #5c93e5;
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

function UsageIndicator() {
  const { usageCount, loadingUsage, usingLocalStorage } = useUsage();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false); // Add state for modal

  if (loadingUsage) {
    return (
      <Container>
        <Title>
          <UsageLabel>Loading usage data...</UsageLabel>
        </Title>
      </Container>
    );
  }

  const MAX_USAGE = 20;
  const remaining = MAX_USAGE - usageCount;
  const usagePercentage = (usageCount / MAX_USAGE) * 100;
  const isNearLimit = remaining <= 5; // Keep for potential styling/hint text
  const limitReached = remaining <= 0; // Keep for potential styling/hint text

  const handleUpgradeClick = () => {
    setIsUpgradeModalOpen(true); // Open the modal
  };

  return (
    <>
      {" "}
      {/* Use Fragment to render modal alongside */}
      <Container>
        <Title>
          <UsageLabel>Generations Used:</UsageLabel>
          <CountBadge isNearLimit={isNearLimit || limitReached}>
            {usageCount} / {MAX_USAGE}
          </CountBadge>
        </Title>
        {loadingUsage ? (
          <div style={{ textAlign: "center", fontSize: "12px" }}>
            Loading...
          </div>
        ) : (
          <ProgressBarContainer>
            <ProgressBar percentage={usagePercentage} />
          </ProgressBarContainer>
        )}

        {/* Hint can still be conditional */}
        {isNearLimit && (
          <Hint>
            {limitReached
              ? "Free limit reached! Upgrade to Pro for more generations."
              : `🚀 Only ${remaining} free generations left! Consider upgrading for uninterrupted productivity.`}
          </Hint>
        )}

        {/* Always render the Upgrade Button */}
        <UpgradeButton onClick={handleUpgradeClick}>Upgrade Now</UpgradeButton>

        {usingLocalStorage && (
          <Hint>
            <LocalStorageIcon title="Usage is tracked locally as Firebase connection failed. Ensure Firestore rules allow writes to the 'usage' collection.">
              ⚠️
            </LocalStorageIcon>{" "}
            Local tracking only
          </Hint>
        )}
      </Container>
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </>
  );
}

export default UsageIndicator;
