import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { 
  FaHome, 
  FaHistory, 
  FaDownload,
  FaYoutube,
  FaUsers
} from 'react-icons/fa';

const MobileNavContainer = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #212121;
  border-top: 1px solid #303030;
  display: none;
  z-index: 1000;
  
  @media (max-width: 768px) {
    display: flex;
  }
`;

const MobileNavGrid = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
`;

const MobileNavItem = styled(Link)`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${props => props.active ? '#fff' : '#aaa'};
  text-decoration: none;
  font-size: 10px;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
  
  &:active {
    background-color: #3d3d3d;
  }
  
  svg {
    font-size: 20px;
    margin-bottom: 4px;
  }
  
  ${props => props.active && `
    color: #ff0000;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 2px;
      background-color: #ff0000;
    }
  `}
`;

function MobileNavigation() {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <MobileNavContainer>
      <MobileNavGrid>
        <MobileNavItem 
          to="/" 
          active={isActive('/')}
        >
          <FaHome />
          Início
        </MobileNavItem>
        
        <MobileNavItem 
          to="/download" 
          active={isActive('/download')}
        >
          <FaYoutube />
          Baixar
        </MobileNavItem>
        
        <MobileNavItem 
          to="/historico" 
          active={isActive('/historico')}
        >
          <FaHistory />
          Histórico
        </MobileNavItem>
        
        <MobileNavItem 
          to="/channels" 
          active={isActive('/channels')}
        >
          <FaUsers />
          Canais
        </MobileNavItem>
      </MobileNavGrid>
    </MobileNavContainer>
  );
}

export default MobileNavigation;