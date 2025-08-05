import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { 
  FaHome, 
  FaFire, 
  FaHistory, 
  FaThumbsUp,
  FaFilm,
  FaYoutube,
  FaUsers,
  FaCog
} from 'react-icons/fa';
import { useSettings } from '../contexts/SettingsContext';

const SidebarContainer = styled.aside`
  position: fixed;
  top: 56px;
  left: 0;
  width: 240px;
  height: calc(100vh - 56px);
  background-color: var(--bg-secondary);
  overflow-y: auto;
  z-index: 999;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const SidebarSection = styled.div`
  border-bottom: 1px solid var(--border-color);
  padding: 12px 0;
`;

const SidebarItem = styled(Link)`
  display: flex;
  align-items: center;
  padding: 10px 24px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
  }
  
  &.active {
    background-color: var(--bg-hover);
    color: var(--text-primary);
  }
  
  svg {
    margin-right: 24px;
    font-size: 16px;
  }
`;

const SidebarTitle = styled.div`
  padding: 8px 24px;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

function Sidebar() {
  const location = useLocation();
  const { t } = useSettings();

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
          {t('home')}
        </SidebarItem>
        
        <SidebarItem 
          to="/trending" 
          className={isActive('/trending') ? 'active' : ''}
        >
          <FaFire />
          {t('trending')}
        </SidebarItem>
        
        <SidebarItem 
          to="/channels" 
          className={isActive('/channels') ? 'active' : ''}
        >
          <FaUsers />
          {t('channels')}
        </SidebarItem>
      </SidebarSection>
      
      <SidebarSection>
        <SidebarTitle>{t('library')}</SidebarTitle>
        
        <SidebarItem 
          to="/liked" 
          className={isActive('/liked') ? 'active' : ''}
        >
          <FaThumbsUp />
          {t('likedVideos')}
        </SidebarItem>
        
        <SidebarItem 
          to="/historico" 
          className={isActive('/historico') ? 'active' : ''}
        >
          <FaHistory />
          {t('history')}
        </SidebarItem>
        
        <SidebarItem 
          to="/download" 
          className={isActive('/download') ? 'active' : ''}
        >
          <FaYoutube />
          {t('downloads')}
        </SidebarItem>
      </SidebarSection>
      
      <SidebarSection>
        <SidebarTitle>{t('moreFromXandTube')}</SidebarTitle>
        
        <SidebarItem 
          to="/movies" 
          className={isActive('/movies') ? 'active' : ''}
        >
          <FaFilm />
          {t('movies')}
        </SidebarItem>
        
        <SidebarItem 
          to="/settings" 
          className={isActive('/settings') ? 'active' : ''}
        >
          <FaCog />
          {t('settings')}
        </SidebarItem>
      </SidebarSection>
    </SidebarContainer>
  );
}

export default Sidebar;