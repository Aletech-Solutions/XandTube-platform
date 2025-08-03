import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import VideoGrid from '../components/VideoGrid';
import { channelsAPI, videosAPI } from '../services/api';

const ChannelContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const ChannelHeader = styled.div`
  position: relative;
  margin-bottom: 24px;
`;

const ChannelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
`;

const ChannelAvatar = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #333;
  border: 4px solid #181818;
  
  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
  }
`;

const ChannelDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const ChannelName = styled.h1`
  color: #fff;
  font-size: 24px;
  font-weight: 400;
  margin-bottom: 8px;
  
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const ChannelStats = styled.div`
  color: #aaa;
  font-size: 14px;
  margin-bottom: 8px;
`;

const ChannelDescription = styled.p`
  color: #aaa;
  font-size: 14px;
  line-height: 1.4;
  max-width: 600px;
`;

const SubscribeButton = styled.button`
  padding: 10px 16px;
  background-color: #ff0000;
  border: none;
  border-radius: 2px;
  color: #fff;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  height: fit-content;
  
  &:hover {
    background-color: #cc0000;
  }
  
  &.subscribed {
    background-color: #606060;
    
    &:hover {
      background-color: #767676;
    }
  }
`;

const ChannelTabs = styled.div`
  display: flex;
  border-bottom: 1px solid #303030;
  margin-bottom: 24px;
`;

const ChannelTab = styled.button`
  padding: 12px 24px;
  background: none;
  border: none;
  color: #aaa;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  
  &:hover {
    color: #fff;
  }
  
  &.active {
    color: #fff;
    border-bottom-color: #fff;
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 60px 20px;
`;

const ErrorTitle = styled.h2`
  color: #fff;
  font-size: 24px;
  margin-bottom: 12px;
`;

const ErrorDescription = styled.p`
  color: #aaa;
  font-size: 16px;
  line-height: 1.5;
`;

function ChannelPage() {
  const { id } = useParams();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subscribed, setSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState('videos');

  useEffect(() => {
    loadChannel();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'videos') {
      loadChannelVideos();
    }
  }, [activeTab, id]);

  const loadChannel = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await channelsAPI.getById(id);
      setChannel(response.data);
    } catch (err) {
      console.error('Erro ao carregar canal:', err);
      if (err.response?.status === 404) {
        setError({
          title: 'Canal não encontrado',
          message: 'O canal que você está procurando não existe.'
        });
      } else {
        setError({
          title: 'Erro ao carregar canal',
          message: 'Ocorreu um erro ao tentar carregar o canal. Tente novamente mais tarde.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadChannelVideos = async () => {
    try {
      setVideosLoading(true);
      
      const response = await videosAPI.getAll({ 
        channel: id,
        limit: 50 
      });
      setVideos(response.data.videos || []);
    } catch (err) {
      console.error('Erro ao carregar vídeos do canal:', err);
      setVideos([]);
    } finally {
      setVideosLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!channel) return;
    
    try {
      if (subscribed) {
        await channelsAPI.unsubscribe(channel.id);
      } else {
        await channelsAPI.subscribe(channel.id);
      }
      setSubscribed(!subscribed);
      
      // Atualizar contador local
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

  if (loading) {
    return (
      <div className="loading">
        Carregando canal...
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage>
        <ErrorTitle>{error.title}</ErrorTitle>
        <ErrorDescription>{error.message}</ErrorDescription>
      </ErrorMessage>
    );
  }

  if (!channel) {
    return (
      <ErrorMessage>
        <ErrorTitle>Canal não encontrado</ErrorTitle>
        <ErrorDescription>
          O canal que você está procurando não existe.
        </ErrorDescription>
      </ErrorMessage>
    );
  }

  return (
    <ChannelContainer>
      <ChannelHeader>
        <ChannelInfo>
          <ChannelAvatar 
            src={`/api/channels/${channel.id}/avatar`}
            alt={channel.name}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/80x80/333333/ffffff?text=CH';
            }}
          />
          
          <ChannelDetails>
            <ChannelName>{channel.name}</ChannelName>
            <ChannelStats>
              {formatNumber(channel.subscribers)} inscritos • {formatNumber(channel.totalViews)} visualizações
            </ChannelStats>
            {channel.description && (
              <ChannelDescription>{channel.description}</ChannelDescription>
            )}
          </ChannelDetails>
          
          <SubscribeButton 
            onClick={handleSubscribe}
            className={subscribed ? 'subscribed' : ''}
          >
            {subscribed ? 'Inscrito' : 'Inscrever-se'}
          </SubscribeButton>
        </ChannelInfo>
      </ChannelHeader>

      <ChannelTabs>
        <ChannelTab 
          className={activeTab === 'videos' ? 'active' : ''}
          onClick={() => setActiveTab('videos')}
        >
          VÍDEOS
        </ChannelTab>
        <ChannelTab 
          className={activeTab === 'playlists' ? 'active' : ''}
          onClick={() => setActiveTab('playlists')}
        >
          PLAYLISTS
        </ChannelTab>
        <ChannelTab 
          className={activeTab === 'about' ? 'active' : ''}
          onClick={() => setActiveTab('about')}
        >
          SOBRE
        </ChannelTab>
      </ChannelTabs>

      {activeTab === 'videos' && (
        <VideoGrid 
          videos={videos} 
          loading={videosLoading} 
          error={null}
        />
      )}

      {activeTab === 'playlists' && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px', 
          color: '#aaa' 
        }}>
          Playlists em breve...
        </div>
      )}

      {activeTab === 'about' && (
        <div style={{ 
          background: '#272727', 
          borderRadius: '8px', 
          padding: '24px',
          color: '#fff'
        }}>
          <h3 style={{ marginBottom: '16px' }}>Sobre {channel.name}</h3>
          <p style={{ color: '#aaa', lineHeight: '1.5', marginBottom: '16px' }}>
            {channel.description || 'Nenhuma descrição disponível.'}
          </p>
          <div style={{ fontSize: '14px', color: '#aaa' }}>
            <p>📅 Criado em: {new Date(channel.createdAt).toLocaleDateString('pt-BR')}</p>
            <p>📊 {formatNumber(channel.videoCount)} vídeo{channel.videoCount !== 1 ? 's' : ''}</p>
            <p>👥 {formatNumber(channel.subscribers)} inscrito{channel.subscribers !== 1 ? 's' : ''}</p>
            <p>👁️ {formatNumber(channel.totalViews)} visualizaç{channel.totalViews !== 1 ? 'ões' : 'ão'}</p>
          </div>
        </div>
      )}
    </ChannelContainer>
  );
}

export default ChannelPage;