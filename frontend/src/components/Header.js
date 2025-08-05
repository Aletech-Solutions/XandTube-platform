import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaSearch } from 'react-icons/fa';
import { useSettings } from '../contexts/SettingsContext';

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background-color: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
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
  color: var(--text-primary);
  font-size: 20px;
  font-weight: bold;
  margin-right: 40px;
  transition: all 0.2s ease;
  
  img {
    height: 32px;
    width: auto;
    transition: all 0.2s ease;
  }
  
  &:hover, &:focus {
    color: var(--accent-color);
    border-radius: 4px;
    
    img {
      filter: brightness(1.2);
    }
  }

  /* Mobile */
  @media (max-width: 768px) {
    font-size: 18px;
    margin-right: 20px;
    
    img {
      height: 28px;
    }
  }

  /* TV/Large screens */
  @media (min-width: 1920px) {
    font-size: 28px;
    margin-right: 60px;
    
    img {
      height: 40px;
    }
  }
  
  @media (min-width: 2560px) {
    font-size: 36px;
    margin-right: 80px;
    
    img {
      height: 48px;
    }
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
  background-color: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 2px 0 0 2px;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: 2px solid var(--accent-color);
    outline-offset: 2px;
    border-color: var(--accent-color);
  }
  
  &::placeholder {
    color: var(--text-muted);
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
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-left: none;
  border-radius: 0 2px 2px 0;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover, &:focus {
    background-color: var(--bg-hover);
    color: var(--text-primary);
    outline: 2px solid var(--accent-color);
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



function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [logoTheme, setLogoTheme] = useState('dark');
  const navigate = useNavigate();
  const { t } = useSettings();
  
  // Função para obter o tema do localStorage
  const getThemeFromLocalStorage = () => {
    try {
      const savedSettings = localStorage.getItem('xandtube-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        const theme = parsed.theme || 'dark';
        return theme;
      }
    } catch (error) {
      console.error('Erro ao ler tema do localStorage:', error);
    }
    return 'dark';
  };
  
  // Carregar tema inicial do localStorage
  useEffect(() => {
    const initialTheme = getThemeFromLocalStorage();
    setLogoTheme(initialTheme);
  }, []);
  
  // Listener para mudanças no localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'xandtube-settings') {
        const newTheme = getThemeFromLocalStorage();
        setLogoTheme(newTheme);
      }
    };
    
    // Listener para mudanças no mesmo window
    const handleLocalStorageChange = () => {
      const newTheme = getThemeFromLocalStorage();
      setLogoTheme(newTheme);
    };
    
    // Fallback: verificar mudanças a cada 500ms
    const interval = setInterval(() => {
      const currentTheme = getThemeFromLocalStorage();
      setLogoTheme(prevTheme => {
        if (prevTheme !== currentTheme) {
          return currentTheme;
        }
        return prevTheme;
      });
    }, 500);
    
    window.addEventListener('storage', handleStorageChange);
    // Criar um evento customizado para mudanças locais
    window.addEventListener('localStorageChange', handleLocalStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleLocalStorageChange);
    };
  }, []);
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <HeaderContainer>
      <Logo to="/">
        <img 
          src={logoTheme === 'light' ? "/logo-white-mode.png" : "/logo.png"} 
          alt="XandTube"
          key={logoTheme} // Força re-render quando o tema muda
        />
      </Logo>
      
      <SearchContainer>
        <form onSubmit={handleSearch} style={{ display: 'flex', flex: 1 }}>
          <SearchInput
            type="text"
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SearchButton type="submit">
            <FaSearch />
          </SearchButton>
        </form>
      </SearchContainer>
      

    </HeaderContainer>
  );
}

export default Header;