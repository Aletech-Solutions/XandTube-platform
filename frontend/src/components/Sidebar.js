import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { 
  FaHome, 
  FaFire, 
  FaHistory, 
  FaThumbsUp,
  FaDownload,
  FaFilm,
  FaYoutube,
  FaUsers
} from 'react-icons/fa';

const SidebarContainer = styled.aside`
  position: fixed;
  top: 56px;
  left: 0;
  width: 240px;
  height: calc(100vh - 56px);
  background-color: #212121;
  overflow-y: auto;
  z-index: 999;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const SidebarSection = styled.div`
  border-bottom: 1px solid #303030;
  padding: 12px 0;
`;

const SidebarItem = styled(Link)`
  display: flex;
  align-items: center;
  padding: 10px 24px;
  color: #aaa;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover {
    background-color: #3d3d3d;
    color: #fff;
  }
  
  &.active {
    background-color: #3d3d3d;
    color: #fff;
  }
  
  svg {
    margin-right: 24px;
    font-size: 16px;
  }
`;

const SidebarTitle = styled.div`
  padding: 8px 24px;
  color: #aaa;
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

function Sidebar() {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <SidebarContainer>
      <SidebarSection>
        <SidebarItem 
          to="/" 
          className={isActive('/') ? 'active' : ''}
        >
          <FaHome />
          Início
        </SidebarItem>
        
        <SidebarItem 
          to="/trending" 
          className={isActive('/trending') ? 'active' : ''}
        >
          <FaFire />
          Em alta
        </SidebarItem>
        
        <SidebarItem 
          to="/channels" 
          className={isActive('/channels') ? 'active' : ''}
        >
          <FaUsers />
          Canais
        </SidebarItem>
      </SidebarSection>
      
      <SidebarSection>
        <SidebarTitle>Biblioteca</SidebarTitle>
        
        <SidebarItem 
          to="/liked" 
          className={isActive('/liked') ? 'active' : ''}
        >
          <FaThumbsUp />
          Vídeos curtidos
        </SidebarItem>
        
        <SidebarItem 
          to="/historico" 
          className={isActive('/historico') ? 'active' : ''}
        >
          <FaHistory />
          Histórico
        </SidebarItem>
        
        <SidebarItem 
          to="/download" 
          className={isActive('/download') ? 'active' : ''}
        >
          <FaYoutube />
          Baixar Vídeos
        </SidebarItem>
      </SidebarSection>
      
      <SidebarSection>
        <SidebarTitle>Mais do XandTube</SidebarTitle>
        
        <SidebarItem 
          to="/movies" 
          className={isActive('/movies') ? 'active' : ''}
        >
          <FaFilm />
          Filmes e programas
        </SidebarItem>
      </SidebarSection>
    </SidebarContainer>
  );
}

export default Sidebar;