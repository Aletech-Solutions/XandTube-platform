import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { 
  FaCheckCircle, FaUsers, FaEye, FaVideo, FaPlay, 
  FaCalendarAlt, FaClock, FaBell, FaBellSlash, FaCog 
} from 'react-icons/fa';
import api from '../services/api';
import AppHeader from '../components/Header';
import Sidebar from '../components/Sidebar';

const PageContainer = styled.div`
  display: flex;
  background-color: #181818;
  min-height: 100vh;
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: ${props => props.sidebarOpen ? '240px' : '72px'};
  margin-top: 56px;
  transition: margin-left 0.3s;

  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const ChannelHeader = styled.div`
  padding: 30px;
  background: #202020;
  border-bottom: 1px solid #333;
  
  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const ChannelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
`;

const ChannelAvatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #555;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: bold;
  color: #fff;
  overflow: hidden;
  border: 4px solid #fff;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  @media (max-width: 768px) {
    width: 80px;
    height: 80px;
    font-size: 32px;
  }
`;

const ChannelDetails = styled.div`
  flex: 1;
  
  h1 {
    color: #ffffff;
    font-size: 32px;
    margin: 0 0 8px 0;
    display: flex;
    align-items: center;
    gap: 12px;
    
    .verified {
      color: #FF0000;
      font-size: 24px;
    }
    
    @media (max-width: 768px) {
      font-size: 24px;
      justify-content: center;
      
      .verified {
        font-size: 20px;
      }
    }
  }
  
  .description {
    color: #aaa;
    font-size: 16px;
    margin-bottom: 16px;
    line-height: 1.5;
    
    @media (max-width: 768px) {
      font-size: 14px;
    }
  }
`;

const ChannelStats = styled.div`
  display: flex;
  gap: 32px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    justify-content: center;
    gap: 24px;
  }
`;

const StatItem = styled.div`
  text-align: center;
  
  .icon {
    color: #FF0000;
    margin-bottom: 4px;
    font-size: 20px;
  }
  
  .value {
    color: #ffffff;
    font-weight: bold;
    font-size: 20px;
    margin-bottom: 2px;
  }
  
  .label {
    color: #aaa;
    font-size: 14px;
  }
  
  @media (max-width: 768px) {
    .value {
      font-size: 18px;
    }
    
    .label {
      font-size: 12px;
    }
  }
`;

const SubscribeButton = styled.button`
  background: ${props => props.subscribed ? '#666' : '#FF0000'};
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  
  &:hover {
    background: ${props => props.subscribed ? '#555' : '#cc0000'};
    transform: translateY(-2px);
  }
  
  @media (max-width: 768px) {
    padding: 10px 20px;
    font-size: 14px;
  }
`;

const ManageButton = styled.button`
  background: #333;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  
  &:hover {
    background: #444;
    transform: translateY(-2px);
  }
  
  @media (max-width: 768px) {
    padding: 10px 20px;
    font-size: 14px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
`;

const ContentSection = styled.div`
  padding: 30px;
  
  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const SectionTitle = styled.h2`
  color: #ffffff;
  font-size: 24px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  
  svg {
    color: #FF0000;
  }
  
  @media (max-width: 768px) {
    font-size: 20px;
    margin-bottom: 16px;
  }
`;

const VideosGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const VideoCard = styled.div`
  background: #2d2d2d;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }
`;

const VideoThumbnail = styled.div`
  width: 100%;
  height: 180px;
  background: #555;
  position: relative;
  overflow: hidden;
  
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
    width: 60px;
    height: 60px;
    background: rgba(255, 0, 0, 0.9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  &:hover .play-overlay {
    opacity: 1;
  }
`;

const VideoInfo = styled.div`
  padding: 16px;
  
  h3 {
    color: #ffffff;
    font-size: 16px;
    margin: 0 0 8px 0;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .meta {
    color: #aaa;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    
    svg {
      font-size: 12px;
    }
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #aaa;
  font-size: 18px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #aaa;
  
  h3 {
    color: #fff;
    margin-bottom: 12px;
    font-size: 20px;
  }
  
  p {
    font-size: 16px;
    line-height: 1.6;
  }
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #ff6b6b;
  
  h3 {
    margin-bottom: 12px;
    font-size: 20px;
  }
  
  p {
    font-size: 16px;
    line-height: 1.6;
  }
`;

function ChannelDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    loadChannelData();
  }, [id]);

  const loadChannelData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Carrega dados do canal e vídeos
      const [channelResponse, videosResponse] = await Promise.all([
        api.get(`/channels/${id}`),
        api.get(`/channels/${id}/videos`)
      ]);
      
      setChannel(channelResponse.data);
      setVideos(videosResponse.data.videos || []);
    } catch (err) {
      console.error('Erro ao carregar canal:', err);
      if (err.response?.status === 404) {
        setError('Canal não encontrado');
      } else {
        setError('Erro ao carregar dados do canal');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      const endpoint = subscribed ? 'unsubscribe' : 'subscribe';
      await api.put(`/channels/${id}/${endpoint}`);
      setSubscribed(!subscribed);
      
      // Atualiza contador local
      setChannel(prev => ({
        ...prev,
        subscribers: subscribed ? prev.subscribers - 1 : prev.subscribers + 1
      }));
    } catch (err) {
      console.error('Erro ao gerenciar inscrição:', err);
    }
  };

  const formatNumber = (num) => {
    if (!num || typeof num !== 'number') return '0';
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatDuration = (seconds) => {
    if (!seconds || typeof seconds !== 'number') return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleVideoClick = (video) => {
    navigate(`/watch-download/${video.id}`);
  };

  if (loading) {
    return (
      <PageContainer>
        <AppHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <Sidebar isOpen={sidebarOpen} />
        <MainContent sidebarOpen={sidebarOpen}>
          <LoadingState>
            Carregando canal...
          </LoadingState>
        </MainContent>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <AppHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <Sidebar isOpen={sidebarOpen} />
        <MainContent sidebarOpen={sidebarOpen}>
          <ErrorState>
            <h3>Ops! Algo deu errado</h3>
            <p>{error}</p>
          </ErrorState>
        </MainContent>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <AppHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Sidebar isOpen={sidebarOpen} />
      
      <MainContent sidebarOpen={sidebarOpen}>
        {channel && (
          <>
            <ChannelHeader>
              <ChannelInfo>
                <ChannelAvatar>
                  {channel.avatar ? (
                    <img src={channel.avatar} alt={channel.name} />
                  ) : (
                    getInitials(channel.name)
                  )}
                </ChannelAvatar>
                
                <ChannelDetails>
                  <h1>
                    {channel.name}
                    {channel.verified && (
                      <FaCheckCircle className="verified" title="Canal verificado" />
                    )}
                  </h1>
                  
                  {channel.description && (
                    <div className="description">{channel.description}</div>
                  )}
                  
                  <ChannelStats>
                    <StatItem>
                      <div className="icon"><FaUsers /></div>
                      <div className="value">{formatNumber(channel.subscribers)}</div>
                      <div className="label">Inscritos</div>
                    </StatItem>
                    
                    <StatItem>
                      <div className="icon"><FaVideo /></div>
                      <div className="value">{videos.length}</div>
                      <div className="label">Vídeos</div>
                    </StatItem>
                    
                    <StatItem>
                      <div className="icon"><FaEye /></div>
                      <div className="value">{formatNumber(channel.totalViews)}</div>
                      <div className="label">Visualizações</div>
                    </StatItem>
                  </ChannelStats>
                  
                  <ButtonGroup>
                    <SubscribeButton 
                      subscribed={subscribed}
                      onClick={handleSubscribe}
                    >
                      {subscribed ? <FaBellSlash /> : <FaBell />}
                      {subscribed ? 'Cancelar Inscrição' : 'Se Inscrever'}
                    </SubscribeButton>
                    
                    <ManageButton 
                      onClick={() => navigate(`/channels/${id}/manage`)}
                    >
                      <FaCog />
                      Gerenciar Imagens
                    </ManageButton>
                  </ButtonGroup>
                </ChannelDetails>
              </ChannelInfo>
            </ChannelHeader>
            
            <ContentSection>
              <SectionTitle>
                <FaVideo />
                Vídeos ({videos.length})
              </SectionTitle>
              
              {videos.length === 0 ? (
                <EmptyState>
                  <h3>Nenhum vídeo encontrado</h3>
                  <p>Este canal ainda não possui vídeos publicados.</p>
                </EmptyState>
              ) : (
                <VideosGrid>
                  {videos.map(video => (
                    <VideoCard 
                      key={video.id}
                      onClick={() => handleVideoClick(video)}
                    >
                      <VideoThumbnail>
                        <img 
                          src={video.thumbnail || '/placeholder-video.jpg'} 
                          alt={video.title}
                        />
                        <div className="play-overlay">
                          <FaPlay />
                        </div>
                      </VideoThumbnail>
                      
                      <VideoInfo>
                        <h3>{video.title}</h3>
                        <div className="meta">
                          <span>
                            <FaEye /> {formatNumber(video.views)} visualizações
                          </span>
                          <span>
                            <FaCalendarAlt /> {formatDate(video.createdAt)}
                          </span>
                          {video.duration && (
                            <span>
                              <FaClock /> {formatDuration(video.duration)}
                            </span>
                          )}
                        </div>
                      </VideoInfo>
                    </VideoCard>
                  ))}
                </VideosGrid>
              )}
            </ContentSection>
          </>
        )}
      </MainContent>
    </PageContainer>
  );
}

export default ChannelDetailsPage;