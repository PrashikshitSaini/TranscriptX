import React from "react";
import styled from "styled-components";

const HeaderContainer = styled.header`
  background-color: var(--bg-secondary);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
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

const LeftSection = styled.div`
  display: flex;
  align-items: center;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const UserAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--accent-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 500;
  font-size: 16px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UserName = styled.span`
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;

  @media (max-width: 576px) {
    display: none;
  }
`;

const LogoutButton = styled.button`
  background-color: transparent;
  border: 1px solid var(--border-color, #3c3c3c);
  padding: 6px 12px;
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

function Header({ currentUser, onLogout }) {
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <HeaderContainer>
      <LeftSection>
        <Logo>TranscriptX</Logo>
        <Tagline>Record, Transcribe, and Generate Smart Notes</Tagline>
      </LeftSection>

      {currentUser && (
        <RightSection>
          <UserInfo>
            <UserAvatar>
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="User" />
              ) : (
                getInitials(currentUser.displayName || currentUser.email)
              )}
            </UserAvatar>
            <UserName>
              {currentUser.displayName || currentUser.email.split("@")[0]}
            </UserName>
          </UserInfo>
          <LogoutButton onClick={onLogout}>Log out</LogoutButton>
        </RightSection>
      )}
    </HeaderContainer>
  );
}

export default Header;
