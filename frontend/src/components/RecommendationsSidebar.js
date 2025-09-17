import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useSettings } from '../contexts/SettingsContext';
import { FaPlay, FaEye, FaClock, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import { recommendationsAPI } from '../services/api';
import { fixThumbnailUrl } from '../utils/urlUtils';

const SidebarContainer = styled.div`
  width: 100%;
  background: #212121;
  border-radius: 8px;
  overflow: hidden;
  
  @media (max-width: 768px) {
    margin-top: 20px;
  }
`;

const SidebarHeader = styled.div`
  padding: 16px 20px;
  background: #2a2a2a;
  border-bottom: 1px solid #333;
  
  h3 {
    color: #ffffff;
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const RecommendationsList = styled.div`
  max-height: 600px;
  overflow-y: auto;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #333;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #666;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #777;
  }
`;

const RecommendationItem = styled.div`
  display: flex;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #333;
  
  &:hover {
    background: #2a2a2a;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const VideoThumbnail = styled.div`
  position: relative;
  width: 120px;
  height: 68px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  background: #333;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .play-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
    
    svg {
      color: #fff;
      font-size: 10px;
      margin-left: 2px;
    }
  }
  
  &:hover .play-overlay {
    opacity: 1;
  }
  
  .duration {
    position: absolute;
    bottom: 4px;
    right: 4px;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 2px 4px;
    border-radius: 2px;
    font-size: 10px;
    font-weight: 500;
  }
`;

const VideoInfo = styled.div`
  flex: 1;
  margin-left: 12px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-width: 0;
`;

const VideoTitle = styled.h4`
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 4px 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ChannelName = styled.p`
  color: #aaa;
  font-size: 12px;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const VideoStats = styled.div`
  color: #aaa;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  span {
    display: flex;
    align-items: center;
    gap: 3px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #aaa;
  
  svg {
    font-size: 24px;
    margin-bottom: 12px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #ff6b6b;
  text-align: center;
  
  svg {
    font-size: 24px;
    margin-bottom: 12px;
  }
  
  p {
    margin: 0;
    font-size: 14px;
  }
`;

function RecommendationsSidebar({ currentVideoId }) {
  const navigate = useNavigate();
  const { t } = useSettings();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRecommendations();
  }, [currentVideoId]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (currentVideoId) {
        // Buscar recomendações baseadas no vídeo atual
        response = await recommendationsAPI.getForVideo(currentVideoId, 15);
      } else {
        // Buscar vídeos populares
        response = await recommendationsAPI.getPopular(15);
      }
      
      setRecommendations(response.data.recommendations || []);
    } catch (err) {
      console.error('Erro ao carregar recomendações:', err);
              setError(t('loadingRecommendations'));
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (video) => {
    navigate(`/watch-download/${video.id}`);
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

  const formatDuration = (duration) => {
    if (!duration) return '';
    
    if (typeof duration === 'number') {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return duration;
  };

  const getVideoThumbnail = (video) => {
    if (video.thumbnail) {
      return fixThumbnailUrl(video.thumbnail, video.id);
    }
    return 'https://via.placeholder.com/120x68/333333/ffffff?text=Video';
  };

  if (loading) {
    return (
      <SidebarContainer>
        <SidebarHeader>
          <h3>{t('recommendations')}</h3>
        </SidebarHeader>
        <LoadingContainer>
          <FaSpinner />
          <p>{t('loadingRecommendations')}</p>
        </LoadingContainer>
      </SidebarContainer>
    );
  }

  if (error) {
    return (
      <SidebarContainer>
        <SidebarHeader>
          <h3>{t('recommendations')}</h3>
        </SidebarHeader>
        <ErrorContainer>
          <FaExclamationTriangle />
          <p>{error}</p>
        </ErrorContainer>
      </SidebarContainer>
    );
  }

  return (
    <SidebarContainer>
      <SidebarHeader>
        <h3>
          <FaPlay style={{ fontSize: '12px' }} />
          {currentVideoId ? t('recommendations') : t('popularVideos')}
        </h3>
      </SidebarHeader>
      
      <RecommendationsList>
        {recommendations.map((video) => (
          <RecommendationItem
            key={video.id}
            onClick={() => handleVideoClick(video)}
          >
            <VideoThumbnail>
              <img 
                src={getVideoThumbnail(video)} 
                alt={video.title}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/120x68/333333/ffffff?text=Video';
                }}
              />
              <div className="play-overlay">
                <FaPlay />
              </div>
              {video.duration && (
                <div className="duration">
                  {formatDuration(video.duration)}
                </div>
              )}
            </VideoThumbnail>
            
            <VideoInfo>
              <VideoTitle>{video.title}</VideoTitle>
              <ChannelName>{video.channelName}</ChannelName>
              <VideoStats>
                <span>
                  <FaEye />
                  {formatViews(video.views)}
                </span>
                {video.duration && (
                  <span>
                    <FaClock />
                    {formatDuration(video.duration)}
                  </span>
                )}
              </VideoStats>
            </VideoInfo>
          </RecommendationItem>
        ))}
      </RecommendationsList>
    </SidebarContainer>
  );
}

export default RecommendationsSidebar;