import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import DownloadCard from '../components/DownloadCard';
import Pagination from '../components/Pagination';
import api, { recommendationsAPI } from '../services/api';
import { useSettings } from '../contexts/SettingsContext';
import { FaClock, FaThumbsUp, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

const HomeContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  
  @media (max-width: 768px) {
    padding: 10px;
    padding-bottom: 20px; /* Extra space for mobile nav */
  }
  
  /* TV/Large screens */
  @media (min-width: 1920px) {
    max-width: 1800px;
    padding: 40px;
  }
`;

const TabsContainer = styled.div`
  margin-bottom: 30px;
  
  @media (max-width: 768px) {
    margin-bottom: 20px;
  }
`;

const TabsList = styled.div`
  display: flex;
  background: #2a2a2a;
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
  overflow-x: auto;
  
  @media (max-width: 768px) {
    border-radius: 8px;
    padding: 3px;
    gap: 3px;
  }
  
  /* Hide scrollbar but keep functionality */
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
`;

const Tab = styled.button`
  flex: 1;
  min-width: 140px;
  padding: 12px 20px;
  background: ${props => props.active ? '#ff0000' : 'transparent'};
  color: ${props => props.active ? '#ffffff' : '#aaaaaa'};
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
  
  &:hover {
    background: ${props => props.active ? '#cc0000' : '#333333'};
    color: #ffffff;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    font-size: 12px;
  }
  
  @media (max-width: 768px) {
    min-width: 120px;
    padding: 10px 16px;
    font-size: 13px;
    gap: 6px;
  }
  
  @media (min-width: 1920px) {
    padding: 16px 24px;
    font-size: 16px;
    gap: 10px;
  }
`;

const ContentContainer = styled.div`
  min-height: 400px;
`;

const StatsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: #2a2a2a;
  border-radius: 8px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
    padding: 12px 16px;
    text-align: center;
  }
`;

const StatsInfo = styled.div`
  color: #aaaaaa;
  font-size: 14px;
  
  strong {
    color: #ffffff;
    font-weight: 600;
  }
  
  @media (min-width: 1920px) {
    font-size: 16px;
  }
`;

const PaginationInfo = styled.div`
  color: #aaaaaa;
  font-size: 13px;
  
  @media (max-width: 768px) {
    font-size: 12px;
  }
  
  @media (min-width: 1920px) {
    font-size: 15px;
  }
`;

const SearchInfo = styled.div`
  margin-bottom: 30px;
  padding: 20px;
  background-color: #2d2d2d;
  border-radius: 12px;
  border-left: 4px solid #ff0000;
  
  @media (max-width: 768px) {
    padding: 15px;
    margin-bottom: 20px;
  }
  
  @media (min-width: 1920px) {
    padding: 30px;
    margin-bottom: 40px;
  }
`;

const SearchTitle = styled.h2`
  color: #fff;
  font-size: 24px;
  margin-bottom: 8px;
  
  @media (max-width: 768px) {
    font-size: 20px;
  }
  
  @media (min-width: 1920px) {
    font-size: 32px;
  }
`;

const SearchDescription = styled.p`
  color: #aaa;
  font-size: 16px;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
  
  @media (min-width: 1920px) {
    font-size: 20px;
  }
`;

const VideosGrid = styled.div`
  display: grid;
  gap: 20px;
  margin-bottom: 30px;
  
  @media (max-width: 768px) {
    gap: 15px;
    margin-bottom: 20px;
  }
  
  @media (min-width: 1920px) {
    gap: 30px;
    margin-bottom: 40px;
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #aaa;
  
  svg {
    font-size: 32px;
    margin-bottom: 16px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @media (max-width: 768px) {
    padding: 40px 20px;
    
    svg {
      font-size: 24px;
      margin-bottom: 12px;
    }
  }
  
  @media (min-width: 1920px) {
    padding: 80px 20px;
    
    svg {
      font-size: 48px;
      margin-bottom: 24px;
    }
  }
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #ff5722;
  
  svg {
    font-size: 32px;
    margin-bottom: 16px;
  }
  
  h3 {
    margin-bottom: 12px;
    font-size: 24px;
  }
  
  p {
    margin: 0;
    font-size: 16px;
  }
  
  @media (max-width: 768px) {
    padding: 40px 20px;
    
    svg {
      font-size: 24px;
      margin-bottom: 12px;
    }
    
    h3 {
      font-size: 20px;
    }
    
    p {
      font-size: 14px;
    }
  }
  
  @media (min-width: 1920px) {
    padding: 80px 20px;
    
    svg {
      font-size: 48px;
      margin-bottom: 24px;
    }
    
    h3 {
      font-size: 32px;
    }
    
    p {
      font-size: 20px;
    }
  }
`;

function HomePage() {
  const [searchParams] = useSearchParams();
  const { t } = useSettings();
  
  // Tab system state
  const [activeTab, setActiveTab] = useState('newest');
  
  // Newest videos state
  const [newestVideos, setNewestVideos] = useState([]);
  const [newestLoading, setNewestLoading] = useState(true);
  const [newestError, setNewestError] = useState(null);
  const [newestCurrentPage, setNewestCurrentPage] = useState(1);
  const [newestTotalPages, setNewestTotalPages] = useState(1);
  const [newestTotal, setNewestTotal] = useState(0);
  
  // Recommended videos state
  const [recommendedVideos, setRecommendedVideos] = useState([]);
  const [recommendedLoading, setRecommendedLoading] = useState(false);
  const [recommendedError, setRecommendedError] = useState(null);
  const [recommendedCurrentPage, setRecommendedCurrentPage] = useState(1);
  const [recommendedTotalPages, setRecommendedTotalPages] = useState(1);
  const [recommendedTotal, setRecommendedTotal] = useState(0);
  
  const videosPerPage = 12; // Increased for better UX
  const searchQuery = searchParams.get('search');

  // Load newest videos
  const loadNewestVideos = useCallback(async (page = 1) => {
    try {
      setNewestLoading(true);
      setNewestError(null);

      const params = {
        page,
        limit: videosPerPage,
        sortBy: 'downloadedAt',
        sortOrder: 'DESC'
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await api.get('/direct-downloads', { params });

      if (response.data.success !== false) {
        setNewestVideos(response.data.downloads || []);
        setNewestTotalPages(response.data.totalPages || Math.ceil((response.data.total || 0) / videosPerPage));
        setNewestTotal(response.data.total || 0);
        setNewestCurrentPage(page);
      } else {
        throw new Error(response.data.error || 'Error loading videos');
      }
    } catch (err) {
      console.error('Error loading newest videos:', err);
      setNewestError('Error loading videos. Please check if there are downloaded videos.');
      setNewestVideos([]);
    } finally {
      setNewestLoading(false);
    }
  }, [searchQuery, videosPerPage]);

  // Load recommended videos based on watch history
  const loadRecommendedVideos = useCallback(async (page = 1) => {
    try {
      setRecommendedLoading(true);
      setRecommendedError(null);

      // Get user's watch history from localStorage
      const watchHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
      
      if (watchHistory.length === 0) {
        // If no watch history, show popular videos
        const response = await recommendationsAPI.getPopular(videosPerPage * 5); // Get more for pagination
        const allRecommended = response.data.recommendations || [];
        
        // Simulate pagination for popular videos
        const startIndex = (page - 1) * videosPerPage;
        const endIndex = startIndex + videosPerPage;
        const pageVideos = allRecommended.slice(startIndex, endIndex);
        
        setRecommendedVideos(pageVideos);
        setRecommendedTotal(allRecommended.length);
        setRecommendedTotalPages(Math.ceil(allRecommended.length / videosPerPage));
        setRecommendedCurrentPage(page);
      } else {
        // Get recommendations based on most recent watched video
        const lastWatchedId = watchHistory[watchHistory.length - 1];
        const response = await recommendationsAPI.getForVideo(lastWatchedId, videosPerPage * 3);
        const allRecommended = response.data.recommendations || [];
        
        // Mix with popular videos for variety if we don't have enough
        if (allRecommended.length < videosPerPage * 2) {
          const popularResponse = await recommendationsAPI.getPopular(videosPerPage * 2);
          const popularVideos = popularResponse.data.recommendations || [];
          
          // Combine and deduplicate
          const combined = [...allRecommended, ...popularVideos];
          const unique = combined.filter((video, index, self) => 
            index === self.findIndex(v => v.id === video.id)
          );
          
          // Simulate pagination
          const startIndex = (page - 1) * videosPerPage;
          const endIndex = startIndex + videosPerPage;
          const pageVideos = unique.slice(startIndex, endIndex);
          
          setRecommendedVideos(pageVideos);
          setRecommendedTotal(unique.length);
          setRecommendedTotalPages(Math.ceil(unique.length / videosPerPage));
        } else {
          // Use only recommendations
          const startIndex = (page - 1) * videosPerPage;
          const endIndex = startIndex + videosPerPage;
          const pageVideos = allRecommended.slice(startIndex, endIndex);
          
          setRecommendedVideos(pageVideos);
          setRecommendedTotal(allRecommended.length);
          setRecommendedTotalPages(Math.ceil(allRecommended.length / videosPerPage));
        }
        
        setRecommendedCurrentPage(page);
      }
    } catch (err) {
      console.error('Error loading recommended videos:', err);
      setRecommendedError('Error loading recommendations.');
      setRecommendedVideos([]);
    } finally {
      setRecommendedLoading(false);
    }
  }, [videosPerPage]);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'newest') {
      loadNewestVideos(newestCurrentPage);
    } else if (activeTab === 'recommended') {
      loadRecommendedVideos(recommendedCurrentPage);
    }
  }, [activeTab, loadNewestVideos, loadRecommendedVideos, newestCurrentPage, recommendedCurrentPage]);

  // Reset to first page when search query changes
  useEffect(() => {
    if (searchQuery) {
      setNewestCurrentPage(1);
      setRecommendedCurrentPage(1);
    }
  }, [searchQuery]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.scrollTo(0, 0);
  };

  // Handle page changes
  const handleNewestPageChange = (page) => {
    setNewestCurrentPage(page);
    loadNewestVideos(page);
    window.scrollTo(0, 0);
  };

  const handleRecommendedPageChange = (page) => {
    setRecommendedCurrentPage(page);
    loadRecommendedVideos(page);
    window.scrollTo(0, 0);
  };

  // Track video watches for recommendations
  const trackVideoWatch = (videoId) => {
    const watchHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
    const updatedHistory = [videoId, ...watchHistory.filter(id => id !== videoId)].slice(0, 50); // Keep last 50 watches
    localStorage.setItem('watchHistory', JSON.stringify(updatedHistory));
  };

  // Get current tab data
  const getCurrentTabData = () => {
    if (activeTab === 'newest') {
      return {
        videos: newestVideos,
        loading: newestLoading,
        error: newestError,
        currentPage: newestCurrentPage,
        totalPages: newestTotalPages,
        total: newestTotal,
        onPageChange: handleNewestPageChange
      };
    } else {
      return {
        videos: recommendedVideos,
        loading: recommendedLoading,
        error: recommendedError,
        currentPage: recommendedCurrentPage,
        totalPages: recommendedTotalPages,
        total: recommendedTotal,
        onPageChange: handleRecommendedPageChange
      };
    }
  };

  const currentData = getCurrentTabData();

  return (
    <HomeContainer>
      {searchQuery && (
        <SearchInfo>
          <SearchTitle>Search Results for "{searchQuery}"</SearchTitle>
          <SearchDescription>
            Showing results from your downloaded videos
          </SearchDescription>
        </SearchInfo>
      )}

      <TabsContainer>
        <TabsList>
          <Tab
            active={activeTab === 'newest'}
            onClick={() => handleTabChange('newest')}
          >
            <FaClock />
            Newest Videos
          </Tab>
          <Tab
            active={activeTab === 'recommended'}
            onClick={() => handleTabChange('recommended')}
          >
            <FaThumbsUp />
            Recommended
          </Tab>
        </TabsList>
      </TabsContainer>

      <ContentContainer>
        {!currentData.loading && !currentData.error && currentData.videos.length > 0 && (
          <StatsBar>
            <StatsInfo>
              Showing <strong>{currentData.videos.length}</strong> of <strong>{currentData.total}</strong> videos
              {activeTab === 'recommended' && (
                <span> • Based on your watch history</span>
              )}
            </StatsInfo>
            <PaginationInfo>
              Page {currentData.currentPage} of {currentData.totalPages}
            </PaginationInfo>
          </StatsBar>
        )}

        {currentData.loading && (
          <LoadingState>
            <FaSpinner />
            <p>Loading {activeTab === 'newest' ? 'newest' : 'recommended'} videos...</p>
          </LoadingState>
        )}

        {currentData.error && (
          <ErrorState>
            <FaExclamationTriangle />
            <h3>Error Loading Videos</h3>
            <p>{currentData.error}</p>
          </ErrorState>
        )}

        {!currentData.loading && !currentData.error && currentData.videos.length === 0 && (
          <ErrorState>
            <FaExclamationTriangle />
            <h3>No Videos Found</h3>
            <p>
              {searchQuery 
                ? `No videos found matching "${searchQuery}"`
                : activeTab === 'newest' 
                  ? 'No videos have been downloaded yet'
                  : 'No recommendations available. Watch some videos to get personalized recommendations!'
              }
            </p>
          </ErrorState>
        )}

        {!currentData.loading && !currentData.error && currentData.videos.length > 0 && (
          <>
            <VideosGrid>
              {currentData.videos.map(video => (
                <DownloadCard 
                  key={video.id} 
                  download={video}
                  onClick={() => trackVideoWatch(video.id)}
                />
              ))}
            </VideosGrid>

            {currentData.totalPages > 1 && (
              <Pagination
                currentPage={currentData.currentPage}
                totalPages={currentData.totalPages}
                onPageChange={currentData.onPageChange}
              />
            )}
          </>
        )}
      </ContentContainer>
    </HomeContainer>
  );
}

export default HomePage;