import React from "react";
import styled from "styled-components";
import { useUsage } from "../contexts/UsageContext";

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
  color: var(--text-secondary);
  font-size: 12px;
  margin-top: 5px;
  font-style: italic;
  text-align: right;
`;

const LocalStorageIcon = styled.span`
  display: inline-block;
  margin-left: 6px;
  font-size: 12px;
  color: var(--warning-color);
  cursor: help;
`;

function UsageIndicator() {
  const { usageCount, loadingUsage, usingLocalStorage } = useUsage();

  if (loadingUsage) {
    return (
      <Container>
        <Title>
          <UsageLabel>Loading usage data...</UsageLabel>
        </Title>
      </Container>
    );
  }

  const MAX_USAGE = 20; // Changed back from 2 to 20
  const remaining = MAX_USAGE - usageCount;
  const usagePercentage = (usageCount / MAX_USAGE) * 100;
  const isNearLimit = remaining <= 5; // Changed threshold back to 5 since limit is now 20

  return (
    <Container>
      <Title>
        <UsageLabel>
          Usage Limit
          {usingLocalStorage && (
            <LocalStorageIcon title="Using local storage for tracking. Update Firebase permissions for cloud sync.">
              📱
            </LocalStorageIcon>
          )}
        </UsageLabel>
        <CountBadge isNearLimit={isNearLimit}>
          {usageCount} / {MAX_USAGE}
        </CountBadge>
      </Title>

      <ProgressBarContainer>
        <ProgressBar percentage={usagePercentage} />
      </ProgressBarContainer>

      {isNearLimit && (
        <Hint>
          {remaining <= 0
            ? "Limit reached! Please upgrade for more."
            : `Only ${remaining} generations remaining`}
        </Hint>
      )}

      {usingLocalStorage && (
        <Hint>Local tracking only - update Firebase rules</Hint>
      )}
    </Container>
  );
}

export default UsageIndicator;
