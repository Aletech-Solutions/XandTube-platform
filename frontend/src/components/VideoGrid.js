import React from 'react';
import styled from 'styled-components';
import VideoCard from './VideoCard';

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  padding: 20px 0;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px 0;
  }
`;

const NoVideosMessage = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: #aaa;
`;

const NoVideosTitle = styled.h2`
  font-size: 24px;
  margin-bottom: 12px;
  color: #fff;
`;

const NoVideosDescription = styled.p`
  font-size: 16px;
  line-height: 1.5;
  max-width: 400px;
  margin: 0 auto;
`;

function VideoGrid({ videos, loading, error }) {
  if (loading) {
    return (
      <div className="loading">
        Carregando vídeos...
      </div>
    );
  }

  if (error) {
    console.error('Erro ao carregar vídeos:', error);
    return (
      <div className="error-message">
        Erro ao carregar vídeos. Tente novamente mais tarde.
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <NoVideosMessage>
        <NoVideosTitle>Nenhum vídeo encontrado</NoVideosTitle>
        <NoVideosDescription>
          Não há vídeos disponíveis no momento. 
          Que tal fazer o upload do primeiro vídeo?
        </NoVideosDescription>
      </NoVideosMessage>
    );
  }

  return (
    <GridContainer>
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </GridContainer>
  );
}

export default VideoGrid;