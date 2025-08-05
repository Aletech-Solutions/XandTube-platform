import React, { useState } from 'react';
import styled from 'styled-components';
import { FaCog, FaPalette, FaGlobe, FaMoon, FaSun, FaCheck } from 'react-icons/fa';
import { useSettings } from '../contexts/SettingsContext';

const PageContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  color: var(--text-primary);
`;

const PageTitle = styled.h1`
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 2rem;
  margin-bottom: 32px;
  color: var(--text-primary);
  
  svg {
    color: var(--accent-color);
  }
`;

const SettingsSection = styled.div`
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: var(--text-primary);
  
  svg {
    color: var(--accent-color);
  }
`;

const SettingItem = styled.div`
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SettingLabel = styled.label`
  display: block;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 12px;
`;

const SettingDescription = styled.p`
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 16px;
  line-height: 1.4;
`;

const OptionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const OptionCard = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-tertiary);
  border: 2px solid ${props => props.selected ? 'var(--accent-color)' : 'var(--border-color)'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-primary);
  font-size: 1rem;
  width: 100%;
  text-align: left;
  position: relative;
  
  &:hover {
    border-color: var(--accent-color);
    background: var(--bg-hover);
  }
  
  &:focus {
    outline: 2px solid var(--accent-color);
    outline-offset: 2px;
  }
  
  svg {
    font-size: 1.2rem;
    color: ${props => props.selected ? 'var(--accent-color)' : 'var(--text-muted)'};
  }
`;

const CheckIcon = styled(FaCheck)`
  position: absolute;
  top: 8px;
  right: 8px;
  color: var(--accent-color);
  font-size: 1rem;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const SaveNotification = styled.div`
  position: fixed;
  top: 80px;
  right: 24px;
  background: var(--success-color);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transform: translateX(${props => props.$show ? '0' : '400px'});
  transition: transform 0.3s ease;
  z-index: 9999;
  
  @media (max-width: 768px) {
    right: 12px;
    left: 12px;
    top: 70px;
  }
`;

function SettingsPage() {
  const { settings, setTheme, setLanguage, t } = useSettings();
  const [showNotification, setShowNotification] = useState(false);

  const handleThemeChange = (theme) => {
    setTheme(theme);
    showSaveNotification();
  };

  const handleLanguageChange = (language) => {
    setLanguage(language);
    showSaveNotification();
  };

  const showSaveNotification = () => {
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  const themeOptions = [
    {
      value: 'dark',
      label: t('darkMode'),
      icon: <FaMoon />,
      description: 'Tema escuro ideal para uso noturno e economia de bateria'
    },
    {
      value: 'light',
      label: t('lightMode'),
      icon: <FaSun />,
      description: 'Tema claro ideal para uso durante o dia'
    }
  ];

  const languageOptions = [
    {
      value: 'pt',
      label: t('portuguese'),
      icon: <FaGlobe />,
      description: 'Português (Brasil)'
    },
    {
      value: 'en',
      label: t('english'),
      icon: <FaGlobe />,
      description: 'English (United States)'
    }
  ];

  return (
    <PageContainer>
      <PageTitle>
        <FaCog />
        {t('settingsTitle')}
      </PageTitle>

      <SettingsSection>
        <SectionTitle>
          <FaPalette />
          {t('appearance')}
        </SectionTitle>

        <SettingItem>
          <SettingLabel>{t('theme')}</SettingLabel>
          <SettingDescription>
            Escolha entre modo claro ou escuro para personalizar a aparência do XandTube
          </SettingDescription>
          
          <OptionGrid>
            {themeOptions.map((option) => (
              <OptionCard
                key={option.value}
                selected={settings.theme === option.value}
                onClick={() => handleThemeChange(option.value)}
              >
                {option.icon}
                <div>
                  <div style={{ fontWeight: '500' }}>{option.label}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {option.description}
                  </div>
                </div>
                                  <CheckIcon $visible={settings.theme === option.value} />
              </OptionCard>
            ))}
          </OptionGrid>
        </SettingItem>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>
          <FaGlobe />
          {t('language')}
        </SectionTitle>

        <SettingItem>
          <SettingLabel>{t('language')}</SettingLabel>
          <SettingDescription>
            Selecione o idioma de preferência para a interface do XandTube
          </SettingDescription>
          
          <OptionGrid>
            {languageOptions.map((option) => (
              <OptionCard
                key={option.value}
                selected={settings.language === option.value}
                onClick={() => handleLanguageChange(option.value)}
              >
                {option.icon}
                <div>
                  <div style={{ fontWeight: '500' }}>{option.label}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {option.description}
                  </div>
                </div>
                                  <CheckIcon $visible={settings.language === option.value} />
              </OptionCard>
            ))}
          </OptionGrid>
        </SettingItem>
      </SettingsSection>

      <SaveNotification $show={showNotification}>
        {t('settingsSaved')}
      </SaveNotification>
    </PageContainer>
  );
}

export default SettingsPage;