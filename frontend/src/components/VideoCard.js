import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

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

const ChannelAvatar = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #333;
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
    const date = new Date(dateString);
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
            src={video.thumbnail} 
            alt={video.title}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/320x180/333333/ffffff?text=XandTube';
            }}
          />
          <Duration>{video.duration}</Duration>
        </ThumbnailContainer>
      </StyledLink>
      
      <VideoInfo>
        <StyledLink to={`/channel/${video.channelId}`}>
          <ChannelAvatar 
            src={`/api/channels/${video.channelId}/avatar`}
            alt={video.channelName}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/36x36/333333/ffffff?text=CH';
            }}
          />
        </StyledLink>
        
        <VideoDetails>
          <StyledLink to={`/watch-download/${video.id}`}>
            <VideoTitle>{video.title}</VideoTitle>
          </StyledLink>
          
          <StyledLink to={`/channel/${video.channelId}`}>
            <ChannelName>{video.channelName}</ChannelName>
          </StyledLink>
          
          <VideoStats>
            {formatViews(video.views)} visualizações • {formatDate(video.uploadDate)}
          </VideoStats>
        </VideoDetails>
      </VideoInfo>
    </CardContainer>
  );
}

export default VideoCard;