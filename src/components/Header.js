import React from "react";
import styled from "styled-components";

const HeaderContainer = styled.header`
  background-color: var(--bg-secondary);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const Logo = styled.h1`
  margin: 0;
  font-size: 24px;
  color: var(--accent-color);
`;

const Tagline = styled.p`
  margin: 0 0 0 20px;
  font-size: 14px;
  color: var(--text-secondary);
`;

function Header() {
  return (
    <HeaderContainer>
      <Logo>TranscriptX</Logo>
      <Tagline>Record, Transcribe, and Generate Smart Notes</Tagline>
    </HeaderContainer>
  );
}

export default Header;
