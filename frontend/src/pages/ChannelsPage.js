import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaUsers, FaSearch, FaCheckCircle, FaEye, FaVideo } from 'react-icons/fa';
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
  padding: 20px;
  transition: margin-left 0.3s;

  @media (max-width: 768px) {
    margin-left: 0;
    padding: 8px;
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: 30px;
  
  h1 {
    color: #ffffff;
    font-size: 28px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 12px;
    
    svg {
      color: #FF0000;
    }
  }
  
  p {
    color: #aaa;
    font-size: 16px;
  }
`;

const SearchSection = styled.div`
  margin-bottom: 30px;
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 500px;
  padding: 12px 20px 12px 50px;
  border: 2px solid #555;
  border-radius: 25px;
  background-color: #2d2d2d;
  color: #ffffff;
  font-size: 16px;
  position: relative;
  
  &:focus {
    outline: none;
    border-color: #FF0000;
  }
  
  &::placeholder {
    color: #999;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  display: inline-block;
  width: 100%;
  max-width: 500px;
  
  svg {
    position: absolute;
    left: 18px;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
    font-size: 18px;
  }
`;

const ChannelsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const ChannelCard = styled(Link)`
  background: #2d2d2d;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  text-decoration: none;
  color: inherit;
  border: 2px solid transparent;
  
  &:hover {
    transform: translateY(-4px);
    border-color: #FF0000;
    box-shadow: 0 8px 25px rgba(255, 0, 0, 0.2);
  }
`;

const ChannelContent = styled.div`
  padding: 20px;
`;

const ChannelHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
`;

const ChannelAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #555;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ChannelInfo = styled.div`
  flex: 1;
  
  h3 {
    color: #ffffff;
    font-size: 18px;
    margin: 0 0 4px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    
    .verified {
      color: #FF0000;
      font-size: 16px;
    }
  }
  
  p {
    color: #aaa;
    font-size: 14px;
    margin: 0;
    line-height: 1.4;
  }
`;

const ChannelStats = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #444;
`;

const StatItem = styled.div`
  text-align: center;
  flex: 1;
  
  .icon {
    color: #FF0000;
    margin-bottom: 4px;
    font-size: 16px;
  }
  
  .value {
    color: #ffffff;
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 2px;
  }
  
  .label {
    color: #aaa;
    font-size: 12px;
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

function ChannelsPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredChannels, setFilteredChannels] = useState([]);

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = channels.filter(channel =>
        channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        channel.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredChannels(filtered);
    } else {
      setFilteredChannels(channels);
    }
  }, [searchTerm, channels]);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const response = await api.get('/channels');
      setChannels(response.data.channels || []);
    } catch (error) {
      console.error('Erro ao carregar canais:', error);
    } finally {
      setLoading(false);
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

  const getInitials = (name) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <PageContainer>
      <AppHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Sidebar isOpen={sidebarOpen} />
      
      <MainContent sidebarOpen={sidebarOpen}>
        <Container>
          <PageHeader>
            <h1>
              <FaUsers />
              Canais
            </h1>
            <p>Descubra canais incríveis e suas melhores criações</p>
          </PageHeader>

          <SearchSection>
            <SearchContainer>
              <FaSearch />
              <SearchInput
                type="text"
                placeholder="Buscar canais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchContainer>
          </SearchSection>

          {loading ? (
            <LoadingState>
              Carregando canais...
            </LoadingState>
          ) : filteredChannels.length === 0 ? (
            <EmptyState>
              <h3>
                {searchTerm ? 'Nenhum canal encontrado' : 'Nenhum canal disponível'}
              </h3>
              <p>
                {searchTerm 
                  ? 'Tente ajustar sua busca ou explore outros termos.'
                  : 'Ainda não há canais cadastrados no sistema.'
                }
              </p>
            </EmptyState>
          ) : (
            <ChannelsGrid>
              {filteredChannels.map(channel => (
                <ChannelCard key={channel.id} to={`/channels/${channel.id}`}>
                  <ChannelContent>
                    <ChannelHeader>
                      <ChannelAvatar>
                        {channel.avatar ? (
                          <img src={channel.avatar} alt={channel.name} />
                        ) : (
                          getInitials(channel.name)
                        )}
                      </ChannelAvatar>
                      
                      <ChannelInfo>
                        <h3>
                          {channel.name}
                          {channel.verified && (
                            <FaCheckCircle className="verified" title="Canal verificado" />
                          )}
                        </h3>
                        <p>{channel.description || 'Sem descrição'}</p>
                      </ChannelInfo>
                    </ChannelHeader>
                    
                    <ChannelStats>
                      <StatItem>
                        <div className="icon"><FaUsers /></div>
                        <div className="value">{formatNumber(channel.subscribers)}</div>
                        <div className="label">Inscritos</div>
                      </StatItem>
                      
                      <StatItem>
                        <div className="icon"><FaVideo /></div>
                        <div className="value">{channel.videoCount || 0}</div>
                        <div className="label">Vídeos</div>
                      </StatItem>
                      
                      <StatItem>
                        <div className="icon"><FaEye /></div>
                        <div className="value">{formatNumber(channel.totalViews)}</div>
                        <div className="label">Visualizações</div>
                      </StatItem>
                    </ChannelStats>
                  </ChannelContent>
                </ChannelCard>
              ))}
            </ChannelsGrid>
          )}
        </Container>
      </MainContent>
    </PageContainer>
  );
}

export default ChannelsPage;