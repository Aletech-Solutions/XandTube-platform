import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaHome, FaSearch, FaUpload } from 'react-icons/fa';
import { useSettings } from '../contexts/SettingsContext';

const NotFoundContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 40px 20px;
`;

const ErrorCode = styled.h1`
  font-size: 120px;
  font-weight: 700;
  color: #ff0000;
  margin: 0;
  line-height: 1;
  
  @media (max-width: 768px) {
    font-size: 80px;
  }
`;

const ErrorTitle = styled.h2`
  font-size: 32px;
  font-weight: 400;
  color: #fff;
  margin: 20px 0 16px 0;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const ErrorDescription = styled.p`
  font-size: 18px;
  color: #aaa;
  line-height: 1.5;
  margin-bottom: 40px;
  max-width: 500px;
  
  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 32px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
    max-width: 300px;
  }
`;

const ActionButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  background-color: #065fd4;
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #0751ba;
  }
  
  &.secondary {
    background-color: transparent;
    border: 1px solid #303030;
    color: #aaa;
    
    &:hover {
      background-color: #3d3d3d;
      color: #fff;
      border-color: #aaa;
    }
  }
`;

const Suggestions = styled.div`
  margin-top: 60px;
  background-color: #272727;
  border-radius: 8px;
  padding: 32px;
  max-width: 600px;
  width: 100%;
`;

const SuggestionsTitle = styled.h3`
  color: #fff;
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 20px;
  text-align: center;
`;

const SuggestionsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const SuggestionItem = styled.li`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #303030;
  
  &:last-child {
    border-bottom: none;
  }
`;

const SuggestionIcon = styled.div`
  color: #065fd4;
  font-size: 16px;
  width: 20px;
  display: flex;
  justify-content: center;
`;

const SuggestionText = styled.span`
  color: #aaa;
  font-size: 14px;
  line-height: 1.4;
`;

const SuggestionLink = styled(Link)`
  color: #065fd4;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

function NotFoundPage() {
  const { t } = useSettings();

  const suggestions = [
    {
      icon: <FaHome />,
      text: t('goBackHome'),
      link: '/',
    },
    {
      icon: <FaSearch />,
      text: t('useSearch'),
      link: '/?search=',
    },
    {
      icon: <FaUpload />,
      text: t('uploadAndShare'),
      link: '/upload',
    }
  ];

  return (
    <NotFoundContainer>
      <ErrorCode>404</ErrorCode>
      <ErrorTitle>{t('pageNotFound')}</ErrorTitle>
      <ErrorDescription>
        {t('pageNotFoundDescription')}
      </ErrorDescription>
      
      <ActionButtons>
        <ActionButton to="/">
          <FaHome />
          {t('goToHome')}
        </ActionButton>
        <ActionButton to="/upload" className="secondary">
          <FaUpload />
          {t('uploadVideo')}
        </ActionButton>
      </ActionButtons>

      <Suggestions>
        <SuggestionsTitle>{t('whatCanYouDo')}</SuggestionsTitle>
        <SuggestionsList>
          {suggestions.map((suggestion, index) => (
            <SuggestionItem key={index}>
              <SuggestionIcon>
                {suggestion.icon}
              </SuggestionIcon>
              <SuggestionText>
                <SuggestionLink to={suggestion.link}>
                  {suggestion.text}
                </SuggestionLink>
              </SuggestionText>
            </SuggestionItem>
          ))}
        </SuggestionsList>
      </Suggestions>
    </NotFoundContainer>
  );
}

export default NotFoundPage;