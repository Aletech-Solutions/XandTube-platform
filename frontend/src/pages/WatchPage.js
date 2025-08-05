import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useSettings } from '../contexts/SettingsContext';
import VideoPlayer from '../components/VideoPlayer';
import RecommendationsSidebar from '../components/RecommendationsSidebar';
import { downloadsAPI } from '../services/api';
import { FaSpinner, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';

const WatchContainer = styled.div`
  display: flex;
  max-width: 100%;
  margin: 0 auto;
  padding: 20px;
  background: #181818;
  min-height: calc(100vh - 56px);
  gap: 24px;

  /* Mobile */
  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 20px;
  }

  @media (max-width: 768px) {
    padding: 10px;
    /* Remove top padding to maximize video space */
    padding-top: 0;
    /* Add bottom padding for mobile navigation */
    padding-bottom: 80px;
    gap: 16px;
  }

  @media (max-width: 480px) {
    padding: 8px;
    padding-top: 0;
    padding-bottom: 80px;
    gap: 12px;
  }

  /* TV/Large screens */
  @media (min-width: 1920px) {
    padding: 40px;
    max-width: 1800px;
    gap: 32px;
  }
  
  @media (min-width: 2560px) {
    padding: 60px;
    max-width: 2400px;
    gap: 40px;
  }
`;

const MainContent = styled.div`
  flex: 1;
  min-width: 0; /* Para permitir flexbox shrink */
  
  @media (max-width: 1024px) {
    flex: none;
  }
`;

const SidebarContent = styled.div`
  width: 350px;
  flex-shrink: 0;
  
  @media (max-width: 1024px) {
    width: 100%;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 50vh;
  color: #ffffff;
  
  svg {
    font-size: 48px;
    margin-bottom: 20px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Mobile */
  @media (max-width: 768px) {
    height: 40vh;
    font-size: 18px;
    
    svg {
      font-size: 40px;
      margin-bottom: 16px;
    }
  }

  @media (max-width: 480px) {
    height: 35vh;
    font-size: 16px;
    
    svg {
      font-size: 36px;
      margin-bottom: 12px;
    }
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 50vh;
  color: #ffffff;
  text-align: center;
  
  svg {
    font-size: 48px;
    margin-bottom: 20px;
    color: #ff4444;
  }
  
  h2 {
    margin-bottom: 10px;
    font-size: 24px;
  }
  
  p {
    color: #aaa;
    margin-bottom: 20px;
  }

  /* Mobile */
  @media (max-width: 768px) {
    height: 40vh;
    padding: 0 20px;
    
    svg {
      font-size: 40px;
      margin-bottom: 16px;
    }
    
    h2 {
      font-size: 20px;
      margin-bottom: 8px;
    }
    
    p {
      font-size: 16px;
      margin-bottom: 16px;
    }
  }

  @media (max-width: 480px) {
    height: 35vh;
    padding: 0 16px;
    
    svg {
      font-size: 36px;
      margin-bottom: 12px;
    }
    
    h2 {
      font-size: 18px;
      margin-bottom: 6px;
    }
    
    p {
      font-size: 15px;
      margin-bottom: 12px;
    }
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #3d3d3d;
  border: none;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 20px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #555;
  }
  
  svg {
    font-size: 16px;
  }

  /* Mobile */
  @media (max-width: 768px) {
    padding: 10px 16px;
    font-size: 14px;
    margin-bottom: 10px;
    border-radius: 6px;
    gap: 6px;
    
    svg {
      font-size: 16px;
    }
  }

  @media (max-width: 480px) {
    padding: 8px 12px;
    font-size: 13px;
    margin-bottom: 8px;
    
    svg {
      font-size: 14px;
    }
  }
`;

const VideoSection = styled.div`
  margin-bottom: 30px;

  /* Mobile */
  @media (max-width: 768px) {
    margin-bottom: 10px;
  }

  @media (max-width: 480px) {
    margin-bottom: 5px;
  }
`;

const VideoDetails = styled.div`
  background: #2d2d2d;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;

  /* Mobile */
  @media (max-width: 768px) {
    padding: 8px;
    margin-top: 5px;
    border-radius: 4px;
  }

  @media (max-width: 480px) {
    padding: 6px;
    margin-top: 3px;
    border-radius: 3px;
  }
`;

const VideoTitle = styled.h1`
  color: #ffffff;
  font-size: 24px;
  margin-bottom: 15px;
  line-height: 1.3;

  /* Mobile */
  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 4px;
    line-height: 1.1;
  }

  @media (max-width: 480px) {
    font-size: 15px;
    margin-bottom: 3px;
  }
`;

const VideoInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 15px;
  color: #aaa;
  font-size: 14px;

  /* Mobile */
  @media (max-width: 768px) {
    gap: 4px;
    margin-bottom: 4px;
    font-size: 11px;
  }

  @media (max-width: 480px) {
    gap: 3px;
    margin-bottom: 3px;
    font-size: 10px;
    flex-direction: column;
  }
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  
  svg {
    color: #ff0000;
  }

  /* Mobile */
  @media (max-width: 768px) {
    gap: 4px;
    font-weight: 400;
    
    svg {
      font-size: 14px;
    }
  }

  @media (max-width: 480px) {
    gap: 3px;
    
    svg {
      font-size: 13px;
    }
  }
`;

const ChannelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 0;
  border-top: 1px solid #404040;
  border-bottom: 1px solid #404040;

  /* Mobile */
  @media (max-width: 768px) {
    padding: 8px 0;
    gap: 6px;
  }

  @media (max-width: 480px) {
    padding: 6px 0;
    gap: 4px;
  }
`;

const ChannelName = styled.h3`
  color: #ffffff;
  font-size: 16px;
  margin: 0;

  /* Mobile */
  @media (max-width: 768px) {
    font-size: 15px;
    font-weight: 500;
  }

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const Description = styled.div`
  margin-top: 15px;
  color: #ccc;
  line-height: 1.6;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;

  /* Mobile */
  @media (max-width: 768px) {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.3;
    max-height: 150px;
  }

  @media (max-width: 480px) {
    margin-top: 3px;
    font-size: 11px;
    line-height: 1.2;
    max-height: 130px;
  }
`;

const WatchPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useSettings();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadVideo = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await downloadsAPI.get(id);
        setVideo(response.data);
      } catch (err) {
        console.error('Erro ao carregar vídeo:', err);
        setError('Erro ao carregar o vídeo. Verifique se o arquivo ainda existe.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadVideo();
    }
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <WatchContainer>
        <LoadingContainer>
          <FaSpinner />
          <h2>Carregando vídeo...</h2>
          <p>Aguarde enquanto preparamos o player</p>
        </LoadingContainer>
      </WatchContainer>
    );
  }

  if (error || !video) {
    return (
      <WatchContainer>
        <ErrorContainer>
          <FaExclamationTriangle />
          <h2>Vídeo não encontrado</h2>
          <p>{error || 'O vídeo solicitado não foi encontrado ou foi removido.'}</p>
          <BackButton onClick={handleBack}>
            <FaArrowLeft />
                          {t('goBack')}
          </BackButton>
        </ErrorContainer>
      </WatchContainer>
    );
  }

  return (
    <WatchContainer>
      <MainContent>
        <BackButton onClick={handleBack}>
          <FaArrowLeft />
                        {t('goBack')}
        </BackButton>
        
        <VideoSection>
          <VideoPlayer video={video} />
        </VideoSection>
        
        <VideoDetails>
          <VideoTitle>{video.title}</VideoTitle>
          
          <VideoInfo>
            <InfoItem>
              <span>{video.viewCount?.toLocaleString() || 'N/A'} {t('views')}</span>
            </InfoItem>
            <InfoItem>
              <span>{t('downloadedOn')} {formatDate(video.downloadedAt)}</span>
            </InfoItem>
            <InfoItem>
              <span>{video.resolution || 'N/A'}</span>
            </InfoItem>
            <InfoItem>
              <span>{formatFileSize(video.fileSize)}</span>
            </InfoItem>
            <InfoItem>
              <span>{video.duration || 'N/A'}</span>
            </InfoItem>
          </VideoInfo>
          
          <ChannelInfo>
            <ChannelName>{video.channelName || 'Canal Desconhecido'}</ChannelName>
          </ChannelInfo>
          
          {video.description && (
            <Description>
              {video.description}
            </Description>
          )}
        </VideoDetails>
      </MainContent>
      
      <SidebarContent>
        <RecommendationsSidebar currentVideoId={id} />
      </SidebarContent>
    </WatchContainer>
  );
};

export default WatchPage;