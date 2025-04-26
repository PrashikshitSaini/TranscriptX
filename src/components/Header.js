import React from "react";
import styled from "styled-components";
import { FaSignOutAlt, FaBars } from "react-icons/fa"; // Import FaBars

const HeaderContainer = styled.header`
  background-color: var(--bg-secondary);
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between; /* Adjust alignment */
  position: sticky; /* Make header sticky */
  top: 0;
  z-index: 1002; /* Ensure header is above sidebar */
`;

const Logo = styled.h1`
  margin: 0;
  font-size: 24px;
  color: var(--accent-color);
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
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

// New style for the menu button
const MenuButton = styled.button`
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
  margin-right: 15px; /* Add some space between button and logo */

  &:hover {
    color: var(--accent-color);
  }
`;

// Add onToggleSidebar prop
function Header({ currentUser, onLogout, onToggleSidebar }) {
  return (
    <HeaderContainer>
      <div style={{ display: "flex", alignItems: "center" }}>
        {/* Add Menu Button */}
        {currentUser && (
          <MenuButton onClick={onToggleSidebar} title="Toggle Notes Menu">
            <FaBars />
          </MenuButton>
        )}
        <Logo>TranscriptX</Logo>
      </div>
      {currentUser && (
        <UserInfo>
          <span>{currentUser.email}</span>
          <LogoutButton onClick={onLogout} title="Logout">
            <FaSignOutAlt /> Logout
          </LogoutButton>
        </UserInfo>
      )}
    </HeaderContainer>
  );
}

export default Header;
