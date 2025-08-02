import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaSearch, FaUpload, FaUserPlus } from 'react-icons/fa';

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background-color: #202020;
  border-bottom: 1px solid #303030;
  display: flex;
  align-items: center;
  padding: 0 16px;
  z-index: 1000;

  /* Mobile */
  @media (max-width: 768px) {
    height: 48px;
    padding: 0 12px;
  }

  /* TV/Large screens */
  @media (min-width: 1920px) {
    height: 72px;
    padding: 0 40px;
    border-bottom: 2px solid #303030;
  }
  
  @media (min-width: 2560px) {
    height: 88px;
    padding: 0 60px;
    border-bottom: 3px solid #303030;
  }
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  margin-right: 40px;
  transition: all 0.2s ease;
  
  &:hover, &:focus {
    color: #ff0000;
    border-radius: 4px;
  }

  /* Mobile */
  @media (max-width: 768px) {
    font-size: 18px;
    margin-right: 20px;
  }

  /* TV/Large screens */
  @media (min-width: 1920px) {
    font-size: 28px;
    margin-right: 60px;
  }
  
  @media (min-width: 2560px) {
    font-size: 36px;
    margin-right: 80px;
  }
`;

const SearchContainer = styled.div`
  flex: 1;
  max-width: 640px;
  display: flex;
  margin: 0 40px;

  @media (max-width: 768px) {
    margin: 0 10px;
    max-width: none;
  }
  
  @media (max-width: 480px) {
    margin: 0 5px;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  height: 32px;
  padding: 0 12px;
  background-color: #121212;
  border: 1px solid #303030;
  border-radius: 2px 0 0 2px;
  color: #fff;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: 2px solid #065fd4;
    outline-offset: 2px;
    border-color: #065fd4;
  }
  
  &::placeholder {
    color: #aaa;
  }

  /* Mobile */
  @media (max-width: 768px) {
    height: 36px;
    font-size: 16px;
    padding: 0 16px;
  }

  /* TV/Large screens */
  @media (min-width: 1920px) {
    height: 44px;
    font-size: 18px;
    padding: 0 20px;
    border-radius: 4px 0 0 4px;
    
    &:focus {
      outline: 3px solid #065fd4;
      outline-offset: 3px;
    }
  }
  
  @media (min-width: 2560px) {
    height: 52px;
    font-size: 22px;
    padding: 0 24px;
    border-radius: 6px 0 0 6px;
    
    &:focus {
      outline: 4px solid #065fd4;
      outline-offset: 4px;
    }
  }
`;

const SearchButton = styled.button`
  width: 64px;
  height: 32px;
  background-color: #303030;
  border: 1px solid #303030;
  border-left: none;
  border-radius: 0 2px 2px 0;
  color: #aaa;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover, &:focus {
    background-color: #3d3d3d;
    color: #fff;
    outline: 2px solid #065fd4;
    outline-offset: 2px;
  }

  /* Mobile */
  @media (max-width: 768px) {
    width: 48px;
    height: 36px;
    
    svg {
      font-size: 16px;
    }
  }

  /* TV/Large screens */
  @media (min-width: 1920px) {
    width: 80px;
    height: 44px;
    border-radius: 0 4px 4px 0;
    
    svg {
      font-size: 20px;
    }
    
    &:hover, &:focus {
      outline: 3px solid #065fd4;
      outline-offset: 3px;
    }
  }
  
  @media (min-width: 2560px) {
    width: 96px;
    height: 52px;
    border-radius: 0 6px 6px 0;
    
    svg {
      font-size: 24px;
    }
    
    &:hover, &:focus {
      outline: 4px solid #065fd4;
      outline-offset: 4px;
    }
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  @media (max-width: 768px) {
    gap: 8px;
  }
  
  @media (max-width: 480px) {
    display: none; /* Hide action buttons on very small screens */
  }
`;

const ActionButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: transparent;
  border: 1px solid #303030;
  border-radius: 2px;
  color: #aaa;
  text-decoration: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover, &:focus {
    background-color: #3d3d3d;
    color: #fff;
    border-color: #aaa;
    outline: 2px solid #065fd4;
    outline-offset: 2px;
  }

  /* Mobile */
  @media (max-width: 768px) {
    padding: 6px 8px;
    font-size: 12px;
    border-radius: 4px;
    gap: 4px;
    
    svg {
      font-size: 14px;
    }
  }
  
  @media (max-width: 600px) {
    /* Show only icons on smaller tablets */
    span {
      display: none;
    }
    padding: 8px;
  }

  /* TV/Large screens */
  @media (min-width: 1920px) {
    padding: 12px 24px;
    font-size: 18px;
    border-radius: 4px;
    gap: 12px;
    
    svg {
      font-size: 20px;
    }
    
    &:hover, &:focus {
      outline: 3px solid #065fd4;
      outline-offset: 3px;
      border-color: #fff;
    }
  }
  
  @media (min-width: 2560px) {
    padding: 16px 32px;
    font-size: 22px;
    border-radius: 6px;
    gap: 16px;
    
    svg {
      font-size: 24px;
    }
    
    &:hover, &:focus {
      outline: 4px solid #065fd4;
      outline-offset: 4px;
      border-color: #fff;
    }
  }
`;

function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <HeaderContainer>
      <Logo to="/">
        XandTube
      </Logo>
      
      <SearchContainer>
        <form onSubmit={handleSearch} style={{ display: 'flex', flex: 1 }}>
          <SearchInput
            type="text"
            placeholder="Pesquisar"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SearchButton type="submit">
            <FaSearch />
          </SearchButton>
        </form>
      </SearchContainer>
      
      <HeaderActions>
        <ActionButton to="/upload">
          <FaUpload />
          <span>Upload</span>
        </ActionButton>
        <ActionButton to="/create-channel">
          <FaUserPlus />
          <span>Criar Canal</span>
        </ActionButton>
      </HeaderActions>
    </HeaderContainer>
  );
}

export default Header;