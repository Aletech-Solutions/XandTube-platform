import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaPlay, FaClock, FaFileVideo } from 'react-icons/fa';
import { downloadsAPI } from '../services/api';
import { fixThumbnailUrl } from '../utils/urlUtils';
import { createGradientStyle, getInitials } from '../utils/avatarUtils';

const DownloadCard = ({ download }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);



  // Formatar duração de segundos para hh:mm:ss
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    
    const totalSeconds = parseInt(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes) => {
    if (!bytes || typeof bytes !== 'number') return 'N/A';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  // Formatar data
  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível';
    
    const date = new Date(dateString);
    
    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    
    // Verifica se é uma data muito antiga (provavelmente timestamp 0 ou erro)
    const minValidDate = new Date('1990-01-01');
    if (date < minValidDate) {
      return 'Data não disponível';
    }
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Assistir vídeo - via clique na imagem
  const handleImageClick = () => {
    navigate(`/watch-download/${download.id}`);
  };

  // Função para lidar com erro de imagem
  const handleImageError = () => {
    setImageError(true);
  };

  // Gera estilo de gradiente baseado no título
  const gradientStyle = createGradientStyle(download.title);
  const titleInitials = getInitials(download.title);

  return (
    <CardContainer>
      <ThumbnailContainer onClick={handleImageClick} style={imageError ? gradientStyle : {}}>
        {!imageError ? (
          <Thumbnail 
            src={fixThumbnailUrl(download.thumbnailUrl, download.id) || downloadsAPI.thumbnail(download.id)}
            alt={download.title}
            onError={handleImageError}
          />
        ) : (
          <FallbackContent>
            <FallbackInitials>{titleInitials}</FallbackInitials>
            <FallbackTitle>{download.title}</FallbackTitle>
          </FallbackContent>
        )}
        <DurationBadge>{formatDuration(download.duration)}</DurationBadge>
        <PlayOverlay>
          <FaPlay />
        </PlayOverlay>
      </ThumbnailContainer>

      <ContentContainer>
        <Title title={download.title}>{download.title}</Title>
        
        <ChannelInfo>
          <ChannelName>{download.channelName || 'Canal Desconhecido'}</ChannelName>
        </ChannelInfo>

        <VideoInfo>
          <InfoItem>
            <FaFileVideo /> {download.format?.toUpperCase() || 'MP4'}
          </InfoItem>
          <InfoItem>
            {download.resolution || 'N/A'}
          </InfoItem>
          <InfoItem>
            {formatFileSize(download.fileSize)}
          </InfoItem>
        </VideoInfo>

        <DownloadInfo>
          <InfoItem>
            <FaClock /> {formatDate(download.downloadedAt)}
          </InfoItem>
          <StatusBadge status={download.status}>
            {download.status === 'completed' ? 'Concluído' : download.status}
          </StatusBadge>
        </DownloadInfo>

      </ContentContainer>
    </CardContainer>
  );
};

// Styled Components
const CardContainer = styled.div`
  display: flex;
  background: linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;
  margin-bottom: 20px;
  position: relative;
  cursor: pointer;

  &:hover, &:focus-within {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
    border-color: rgba(255, 255, 255, 0.1);
    outline: 2px solid #ff0000;
  }

  /* Mobile */
  @media (max-width: 768px) {
    flex-direction: column;
    margin-bottom: 15px;
    border-radius: 12px;
    
    &:hover, &:focus-within {
      transform: translateY(-2px);
    }
  }
  
  @media (max-width: 480px) {
    margin-bottom: 12px;
    border-radius: 8px;
    
    &:hover, &:focus-within {
      transform: translateY(-1px);
    }
  }

  /* TV/Large screens */
  @media (min-width: 1920px) {
    border-radius: 20px;
    margin-bottom: 30px;
    
    &:hover, &:focus-within {
      transform: translateY(-6px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
      outline: 3px solid #ff0000;
    }
  }
  
  @media (min-width: 2560px) {
    border-radius: 24px;
    margin-bottom: 40px;
    
    &:hover, &:focus-within {
      transform: translateY(-8px);
      box-shadow: 0 16px 50px rgba(0, 0, 0, 0.7);
      outline: 4px solid #ff0000;
    }
  }
`;

const ThumbnailContainer = styled.div`
  position: relative;
  width: 280px;
  height: 160px;
  flex-shrink: 0;
  background: #404040;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;

  /* Mobile */
  @media (max-width: 768px) {
    width: 100%;
    height: 200px;
  }
  
  @media (max-width: 480px) {
    height: 180px;
  }

  /* TV/Large screens */
  @media (min-width: 1920px) {
    width: 350px;
    height: 200px;
  }
  
  @media (min-width: 2560px) {
    width: 420px;
    height: 240px;
  }
`;

const Thumbnail = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const FallbackContent = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
  color: white;
`;

const FallbackInitials = styled.div`
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    font-size: 28px;
  }
  
  @media (min-width: 1920px) {
    font-size: 40px;
  }
`;

const FallbackTitle = styled.div`
  font-size: 12px;
  font-weight: 500;
  line-height: 1.3;
  opacity: 0.9;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  
  @media (max-width: 768px) {
    font-size: 11px;
    -webkit-line-clamp: 2;
  }
  
  @media (min-width: 1920px) {
    font-size: 14px;
  }
`;

const DurationBadge = styled.div`
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const PlayOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border: 2px solid white;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
  font-size: 20px;
  backdrop-filter: blur(4px);

  ${ThumbnailContainer}:hover & {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }

  /* Mobile - always visible */
  @media (max-width: 768px) {
    opacity: 0.9;
    width: 50px;
    height: 50px;
    font-size: 18px;
  }
`;

const ContentContainer = styled.div`
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.3px;

  /* Mobile */
  @media (max-width: 768px) {
    font-size: 16px;
    -webkit-line-clamp: 3;
    line-height: 1.3;
  }
  
  @media (max-width: 480px) {
    font-size: 15px;
    letter-spacing: 0.2px;
  }

  /* TV/Large screens */
  @media (min-width: 1920px) {
    font-size: 22px;
    letter-spacing: 0.4px;
    line-height: 1.4;
  }
  
  @media (min-width: 2560px) {
    font-size: 26px;
    letter-spacing: 0.5px;
    line-height: 1.4;
  }
`;

const ChannelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ChannelName = styled.span`
  color: #aaaaaa;
  font-size: 14px;
  font-weight: 500;
  opacity: 0.9;
`;

const VideoInfo = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
`;

const DownloadInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
`;

const InfoItem = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #cccccc;
  font-weight: 500;

  svg {
    font-size: 12px;
    opacity: 0.8;
  }
`;

const StatusBadge = styled.span`
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => {
    switch (props.status) {
      case 'completed': return 'linear-gradient(135deg, #4caf50, #2e7d32)';
      case 'downloading': return 'linear-gradient(135deg, #2196f3, #1565c0)';
      case 'error': return 'linear-gradient(135deg, #f44336, #c62828)';
      default: return 'linear-gradient(135deg, #666, #444)';
    }
  }};
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;



export default DownloadCard;