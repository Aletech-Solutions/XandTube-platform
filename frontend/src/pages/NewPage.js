import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaClock, FaDownload, FaPlay, FaEye } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api from '../services/api';
import VideoCard from '../components/VideoCard';
import Pagination from '../components/Pagination';
import { useSettings } from '../contexts/SettingsContext';

const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
  
  @media (max-width: 480px) {
    padding: 12px;
  }
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
  
  @media (max-width: 480px) {
    font-size: 20px;
    flex-direction: column;
    text-align: center;
  }
`;

const Subtitle = styled.p`
  color: var(--text-muted);
  font-size: 16px;
  margin: 0;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  align-items: center;
  
  @media (max-width: 768px) {
    justify-content: center;
    gap: 12px;
  }
  
  @media (max-width: 480px) {
    gap: 8px;
  }
`;

const FilterButton = styled.button`
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  background: ${props => props.active ? 'var(--primary-color)' : 'var(--bg-secondary)'};
  color: ${props => props.active ? 'white' : 'var(--text-primary)'};
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.active ? 'var(--primary-color)' : 'var(--bg-hover)'};
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
    margin-bottom: 24px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
`;

const StatCard = styled.div`
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: var(--text-muted);
`;

const VideoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: var(--text-muted);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const StyledButton = styled.button`
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    background: var(--primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    background: var(--text-muted);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  &.secondary {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);

    &:hover {
      background: var(--bg-hover);
      border-color: var(--primary-color);
    }
  }
`;

function NewPage() {
  const { t } = useSettings();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVideos, setTotalVideos] = useState(0);
  const [timeFilter, setTimeFilter] = useState('all'); // all, today, week, month
  const [stats, setStats] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    total: 0
  });

  const videosPerPage = 12;

  useEffect(() => {
    loadVideos();
    loadStats();
  }, [currentPage, timeFilter]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calcular filtro de data
      let dateFilter = null;
      const now = new Date();
      
      switch (timeFilter) {
        case 'today':
          dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          dateFilter = weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          dateFilter = monthAgo;
          break;
        default:
          dateFilter = null;
      }

      const params = {
        page: currentPage,
        limit: videosPerPage,
        sortBy: 'downloadedAt',
        sortOrder: 'DESC',
        category: 'news' // Filtrar apenas vídeos da categoria 'news'
      };

      if (dateFilter) {
        params.dateFrom = dateFilter.toISOString();
      }

      const response = await api.get('/direct-downloads', { params });
      
      if (response.data.success) {
        setVideos(response.data.downloads || []);
        setTotalVideos(response.data.total || 0);
        setTotalPages(Math.ceil((response.data.total || 0) / videosPerPage));
      } else {
        throw new Error(response.data.error || 'Erro ao carregar vídeos');
      }

    } catch (err) {
      console.error('Erro ao carregar vídeos:', err);
      setError(err.message || 'Erro ao carregar vídeos');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/direct-downloads/new-videos-stats');
      if (response.data.success) {
        setStats(response.data.stats || {});
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleFilterChange = (filter) => {
    setTimeFilter(filter);
    setCurrentPage(1);
  };

  const formatVideoForCard = (video) => ({
    id: video.id,
    title: video.title,
    thumbnail: video.thumbnailUrl,
    duration: video.duration,
    views: video.viewCount || 0,
    channelName: video.channelName,
    uploadDate: video.downloadedAt,
    url: `/watch-download/${video.id}`,
    isDownloaded: true
  });

  if (loading && videos.length === 0) {
    return (
      <Container>
        <LoadingContainer>
          <FaClock style={{ marginRight: '8px' }} />
          {t('loadingRecentVideos')}
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <FaClock />
          {t('newVideos')}
        </Title>
        <Subtitle>
          {t('newVideosDescription')}
        </Subtitle>
      </Header>

      <StatsContainer>
        <StatCard>
          <StatValue>{stats.today || 0}</StatValue>
          <StatLabel>{t('today')}</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.thisWeek || 0}</StatValue>
          <StatLabel>{t('thisWeek')}</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.thisMonth || 0}</StatValue>
          <StatLabel>{t('thisMonth')}</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.total || totalVideos}</StatValue>
          <StatLabel>{t('total')}</StatLabel>
        </StatCard>
      </StatsContainer>

      <FilterContainer>
        <FilterButton 
          active={timeFilter === 'all'} 
          onClick={() => handleFilterChange('all')}
        >
          {t('all')}
        </FilterButton>
        <FilterButton 
          active={timeFilter === 'today'} 
          onClick={() => handleFilterChange('today')}
        >
          {t('today')}
        </FilterButton>
        <FilterButton 
          active={timeFilter === 'week'} 
          onClick={() => handleFilterChange('week')}
        >
          {t('thisWeek')}
        </FilterButton>
        <FilterButton 
          active={timeFilter === 'month'} 
          onClick={() => handleFilterChange('month')}
        >
          {t('thisMonth')}
        </FilterButton>
      </FilterContainer>

      {error && (
        <EmptyState>
          <EmptyIcon>⚠️</EmptyIcon>
          <h3>{t('errorLoadingVideos')}</h3>
          <p>{error}</p>
          <StyledButton onClick={loadVideos} style={{ marginTop: '16px' }}>
            {t('tryAgain')}
          </StyledButton>
        </EmptyState>
      )}

      {!error && videos.length === 0 && !loading && (
        <EmptyState>
          <EmptyIcon>
            <FaDownload />
          </EmptyIcon>
          <h3>{t('noVideosFound')}</h3>
          <p>
            {timeFilter === 'all' 
              ? t('noVideosFoundDescription')
              : t('noVideosInPeriod')
            }
          </p>
        </EmptyState>
      )}

      {videos.length > 0 && (
        <>
          <VideoGrid>
            {videos.map(video => (
              <VideoCard 
                key={video.id} 
                video={formatVideoForCard(video)}
              />
            ))}
          </VideoGrid>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </Container>
  );
}

export default NewPage;
