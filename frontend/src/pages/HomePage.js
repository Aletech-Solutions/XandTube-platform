import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import DownloadCard from '../components/DownloadCard';
import { downloadsAPI } from '../services/api';
import { useSettings } from '../contexts/SettingsContext';

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

const SearchQuery = styled.span`
  color: #ff0000;
  font-weight: 500;
`;

const SectionTitle = styled.h2`
  color: #fff;
  font-size: 28px;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  @media (max-width: 768px) {
    font-size: 22px;
    margin-bottom: 20px;
  }
  
  @media (min-width: 1920px) {
    font-size: 36px;
    margin-bottom: 35px;
  }
`;

const ViewAllLink = styled.a`
  color: #1976d2;
  font-size: 16px;
  text-decoration: none;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
  
  @media (min-width: 1920px) {
    font-size: 20px;
  }
`;

const DownloadsGrid = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(600px, 1fr));
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  @media (max-width: 480px) {
    gap: 10px;
  }
  
  /* TV/Large screens - more columns */
  @media (min-width: 1920px) {
    grid-template-columns: repeat(auto-fill, minmax(700px, 1fr));
    gap: 30px;
  }
  
  @media (min-width: 2560px) {
    grid-template-columns: repeat(auto-fill, minmax(800px, 1fr));
    gap: 40px;
  }
`;

const LoadMoreButton = styled.button`
  display: block;
  margin: 40px auto;
  padding: 15px 30px;
  background-color: transparent;
  border: 2px solid #303030;
  border-radius: 8px;
  color: #aaa;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background-color: #3d3d3d;
    color: #fff;
    border-color: #aaa;
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 768px) {
    padding: 12px 24px;
    font-size: 14px;
  }
  
  @media (min-width: 1920px) {
    padding: 20px 40px;
    font-size: 18px;
    margin: 60px auto;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #aaa;
  
  h3 {
    margin-bottom: 12px;
    font-size: 24px;
    color: #fff;
  }
  
  p {
    margin: 0;
    font-size: 16px;
    line-height: 1.5;
  }
  
  @media (max-width: 768px) {
    padding: 40px 20px;
    
    h3 {
      font-size: 20px;
    }
    
    p {
      font-size: 14px;
    }
  }
  
  @media (min-width: 1920px) {
    padding: 80px 20px;
    
    h3 {
      font-size: 32px;
    }
    
    p {
      font-size: 20px;
    }
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #aaa;
  font-size: 18px;
  
  @media (max-width: 768px) {
    padding: 40px 20px;
    font-size: 16px;
  }
  
  @media (min-width: 1920px) {
    padding: 80px 20px;
    font-size: 24px;
  }
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #ff5722;
  
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
    
    h3 {
      font-size: 20px;
    }
    
    p {
      font-size: 14px;
    }
  }
  
  @media (min-width: 1920px) {
    padding: 80px 20px;
    
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
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const searchQuery = searchParams.get('search');

  const loadDownloads = useCallback(async (page = 1, append = false) => {
    try {
      if (!append) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const response = searchQuery 
        ? await downloadsAPI.search(searchQuery, page, 20)
        : await downloadsAPI.list(page, 20);

      const newDownloads = response.data.downloads || [];

      if (!append) {
        setDownloads(newDownloads);
        setCurrentPage(1);
      } else {
        setDownloads(prev => [...prev, ...newDownloads]);
      }

      setHasMore(response.data.page < response.data.totalPages);
      setCurrentPage(page);
    } catch (err) {
      console.error('Erro ao carregar downloads:', err);
      setError('Erro ao carregar downloads. Verifique se há vídeos baixados.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadDownloads();
  }, [loadDownloads]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadDownloads(currentPage + 1, true);
    }
  };



  return (
    <HomeContainer>
      {searchQuery && (
        <SearchInfo>
          <SearchTitle>
            {t('searchResultsFor')} <SearchQuery>"{searchQuery}"</SearchQuery>
          </SearchTitle>
          {!loading && downloads.length > 0 && (
            <p style={{ color: '#aaa', margin: 0 }}>
              {downloads.length} {downloads.length === 1 ? t('videosFound') : t('videosFoundPlural')}
            </p>
          )}
        </SearchInfo>
      )}

      <SectionTitle>
        {searchQuery ? t('searchResults') : t('yourDownloads')}
        {!searchQuery && (
          <ViewAllLink as={Link} to="/historico">
            {t('seeAll')}
          </ViewAllLink>
        )}
      </SectionTitle>

      {loading && (
        <LoadingState>
          <p>{t('loadingDownloads')}</p>
        </LoadingState>
      )}

      {error && (
        <ErrorState>
          <h3>{t('errorLoadingDownloads')}</h3>
          <p>{error}</p>
        </ErrorState>
      )}

      {!loading && !error && downloads.length === 0 && (
        <EmptyState>
          <h3>
            {searchQuery 
              ? t('noResultsFound')
              : t('noDownloadsFound')
            }
          </h3>
          <p>
            {searchQuery 
              ? t('tryOtherTerms')
              : t('downloadDescription')
            }
          </p>
        </EmptyState>
      )}

      {!loading && !error && downloads.length > 0 && (
        <>
          <DownloadsGrid>
                          {downloads.map(download => (
                <DownloadCard
                  key={download.id}
                  download={download}
                />
              ))}
          </DownloadsGrid>

          {hasMore && (
            <LoadMoreButton 
              onClick={handleLoadMore} 
              disabled={loadingMore}
            >
              {loadingMore ? t('loading') : t('loadMore')}
            </LoadMoreButton>
          )}
        </>
      )}
    </HomeContainer>
  );
}

export default HomePage;