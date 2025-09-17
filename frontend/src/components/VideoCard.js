import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useSettings } from '../contexts/SettingsContext';
import { fixThumbnailUrl } from '../utils/urlUtils';
import Avatar from './Avatar';

const CardContainer = styled.div`
  width: 100%;
  margin-bottom: 24px;
  cursor: pointer;
`;

const ThumbnailContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background-color: #333;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
`;

const Thumbnail = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
  
  ${CardContainer}:hover & {
    transform: scale(1.05);
  }
`;

const Duration = styled.span`
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 12px;
  font-weight: 500;
`;

const VideoInfo = styled.div`
  display: flex;
  gap: 12px;
`;

const ChannelAvatarContainer = styled.div`
  flex-shrink: 0;
`;

const VideoDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const VideoTitle = styled.h3`
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.3;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-decoration: none;
  
  &:hover {
    color: #aaa;
  }
`;

const ChannelName = styled.p`
  color: #aaa;
  font-size: 14px;
  margin-bottom: 2px;
  
  &:hover {
    color: #fff;
  }
`;

const VideoStats = styled.p`
  color: #aaa;
  font-size: 14px;
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;

function VideoCard({ video }) {
  const { t } = useSettings();
  
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

  const formatViews = (views) => {
    if (!views || typeof views !== 'number') return '0';
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

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
    
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'há 1 dia';
    } else if (diffDays < 7) {
      return `há ${diffDays} dias`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `há ${weeks} semana${weeks > 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `há ${months} mês${months > 1 ? 'es' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `há ${years} ano${years > 1 ? 's' : ''}`;
    }
  };

  return (
    <CardContainer>
      <StyledLink to={`/watch-download/${video.id}`}>
        <ThumbnailContainer>
          <Thumbnail 
            src={fixThumbnailUrl(video.thumbnail, video.id)} 
            alt={video.title}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/320x180/333333/ffffff?text=XandTube';
            }}
          />
          <Duration>{formatDuration(video.duration)}</Duration>
        </ThumbnailContainer>
      </StyledLink>
      
      <VideoInfo>
        <ChannelAvatarContainer>
          <StyledLink to={`/channel/${video.channelId}`}>
            <Avatar
              src={`/api/channels/${video.channelId}/avatar`}
              name={video.channelName}
              size={36}
              hover={true}
            />
          </StyledLink>
        </ChannelAvatarContainer>
        
        <VideoDetails>
          <StyledLink to={`/watch-download/${video.id}`}>
            <VideoTitle>{video.title}</VideoTitle>
          </StyledLink>
          
          <StyledLink to={`/channel/${video.channelId}`}>
            <ChannelName>{video.channelName}</ChannelName>
          </StyledLink>
          
          <VideoStats>
            {formatViews(video.views)} {t('views')} • {formatDate(video.uploadDate)}
          </VideoStats>
        </VideoDetails>
      </VideoInfo>
    </CardContainer>
  );
}

export default VideoCard;