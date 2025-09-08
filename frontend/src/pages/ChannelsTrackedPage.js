import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FaPlus, FaTrash, FaEdit, FaPlay, FaPause, FaClock, 
  FaCheckCircle, FaExclamationTriangle, FaYoutube, 
  FaEye, FaDownload, FaCog, FaSync 
} from 'react-icons/fa';
import api from '../services/api';
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
  
  @media (max-width: 768px) {
    margin-bottom: 24px;
    flex-direction: column;
    align-items: stretch;
  }
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  
  @media (max-width: 768px) {
    font-size: 24px;
    justify-content: center;
  }
  
  @media (max-width: 480px) {
    font-size: 20px;
  }
`;

const AddButton = styled.button`
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;

  &:hover {
    background: var(--primary-hover);
    transform: translateY(-1px);
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

const ChannelsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ChannelCard = styled.div`
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  transition: all 0.2s;

  &:hover {
    border-color: var(--primary-color);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const ChannelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
`;

const ChannelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
`;

const ChannelAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 18px;
  flex-shrink: 0;
`;

const ChannelDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const ChannelName = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ChannelUrl = styled.a`
  font-size: 14px;
  color: var(--text-muted);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;

  &:hover {
    color: var(--primary-color);
  }
`;

const StatusBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => {
    switch (props.status) {
      case 'active': return 'rgba(34, 197, 94, 0.1)';
      case 'inactive': return 'rgba(156, 163, 175, 0.1)';
      case 'error': return 'rgba(239, 68, 68, 0.1)';
      default: return 'rgba(156, 163, 175, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'active': return '#22c55e';
      case 'inactive': return '#9ca3af';
      case 'error': return '#ef4444';
      default: return '#9ca3af';
    }
  }};
`;

const ChannelActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    justify-content: center;
  }
  
  @media (max-width: 480px) {
    flex-direction: column;
    gap: 12px;
  }
`;

const ActionButton = styled.button`
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-primary);
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover {
    background: var(--bg-hover);
    border-color: var(--primary-color);
  }

  &.danger {
    color: #ef4444;
    border-color: #ef4444;
    
    &:hover {
      background: rgba(239, 68, 68, 0.1);
    }
  }

  &.primary {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
    
    &:hover {
      background: var(--primary-hover);
    }
  }
`;

const ChannelStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
`;

const ChannelStat = styled.div`
  text-align: center;
`;

const ChannelStatValue = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
`;

const ChannelStatLabel = styled.div`
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 32px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    padding: 24px;
    max-width: 90vw;
    border-radius: 8px;
  }
  
  @media (max-width: 480px) {
    padding: 20px;
    max-width: 95vw;
    max-height: 95vh;
  }
`;

const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 24px 0;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const Button = styled.button`
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    opacity: 0.6;
  }

  &.primary {
    background: var(--primary-color);
    color: white;
    
    &:hover {
      background: var(--primary-hover);
    }
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

function ChannelsTrackedPage() {
  const { t } = useSettings();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [stats, setStats] = useState({});
  const [jobStats, setJobStats] = useState({});
  const [formData, setFormData] = useState({
    channelUrl: '',
    quality: 'best',
    scheduledHour: 2,
    saveToLibrary: true
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadChannels();
    loadStats();
    loadJobStats();
  }, []);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const response = await api.get('/channel-tracking');
      
      if (response.data.success) {
        setChannels(response.data.data || []);
      } else {
        throw new Error(response.data.error || 'Erro ao carregar canais');
      }
    } catch (err) {
      console.error('Erro ao carregar canais:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/channel-tracking/stats');
      if (response.data.success) {
        setStats(response.data.data || {});
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  const loadJobStats = async () => {
    try {
      const response = await api.get('/channel-tracking/job/status');
      if (response.data.success) {
        setJobStats(response.data.data || {});
      }
    } catch (err) {
      console.error('Erro ao carregar status do job:', err);
    }
  };

  const handleAddChannel = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      const response = await api.post('/channel-tracking', formData);
      
      if (response.data.success) {
        setShowAddModal(false);
        setFormData({
          channelUrl: '',
          quality: 'best',
          scheduledHour: 2,
          saveToLibrary: true
        });
        
        // Mostrar mensagem de sucesso mais informativa
        alert(response.data.message || 'Canal adicionado com sucesso! O vídeo mais recente será baixado automaticamente.');
        
        await loadChannels();
        await loadStats();
      } else {
        throw new Error(response.data.error || 'Erro ao adicionar canal');
      }
    } catch (err) {
      console.error('Erro ao adicionar canal:', err);
      alert(err.message || 'Erro ao adicionar canal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleChannel = async (channelId, currentStatus) => {
    try {
      await api.put(`/channel-tracking/${channelId}`, {
        isActive: !currentStatus
      });
      await loadChannels();
    } catch (err) {
      console.error('Erro ao alterar status do canal:', err);
      alert('Erro ao alterar status do canal');
    }
  };

  const handleDeleteChannel = async (channelId, channelName) => {
    if (!channelId) {
      alert('Erro: ID do canal não encontrado');
      return;
    }
    
    if (!window.confirm(`Tem certeza que deseja remover o canal "${channelName}" do tracking?`)) {
      return;
    }

    try {
      await api.delete(`/channel-tracking/${channelId}`);
      await loadChannels();
      await loadStats();
    } catch (err) {
      console.error('Erro ao remover canal:', err);
      alert('Erro ao remover canal');
    }
  };

  const handleTestChannel = async (channelId, channelName) => {
    try {
      const response = await api.post(`/channel-tracking/${channelId}/test`);
      if (response.data.success) {
        alert(`Teste iniciado para o canal "${channelName}"`);
        await loadChannels();
      }
    } catch (err) {
      console.error('Erro ao testar canal:', err);
      alert('Erro ao testar canal');
    }
  };

  const handleSetupChannel = async (channelId, channelName) => {
    if (!window.confirm(`Configurar canal "${channelName}"? Isso baixará o vídeo mais recente se ainda não foi baixado.`)) {
      return;
    }

    try {
      const response = await api.post(`/channel-tracking/${channelId}/setup`);
      if (response.data.success) {
        alert(response.data.message || `Canal "${channelName}" configurado com sucesso!`);
        await loadChannels();
        await loadStats();
      }
    } catch (err) {
      console.error('Erro ao configurar canal:', err);
      const errorMessage = err.response?.data?.error || 'Erro ao configurar canal';
      alert(errorMessage);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <FaCheckCircle />;
      case 'error': return <FaExclamationTriangle />;
      default: return <FaPause />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return t('active');
      case 'error': return t('errorStatus');
      default: return t('inactive');
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <FaClock style={{ marginRight: '8px' }} />
          {t('loading')}...
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <FaYoutube />
          {t('channelsTracked')}
        </Title>
        <AddButton onClick={() => setShowAddModal(true)}>
          <FaPlus />
          {t('addChannel')}
        </AddButton>
      </Header>

      <StatsContainer>
        <StatCard>
          <StatValue>{stats.totalChannels || 0}</StatValue>
          <StatLabel>{t('totalChannels')}</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.activeChannels || 0}</StatValue>
          <StatLabel>{t('activeChannels')}</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.totalVideosDownloaded || 0}</StatValue>
          <StatLabel>{t('videosDownloaded')}</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.successRate || '0%'}</StatValue>
          <StatLabel>{t('successRate')}</StatLabel>
        </StatCard>
      </StatsContainer>

      {error && (
        <EmptyState>
          <h3>Erro ao carregar canais</h3>
          <p>{error}</p>
          <Button className="primary" onClick={loadChannels}>
            Tentar Novamente
          </Button>
        </EmptyState>
      )}

      {!error && channels.length === 0 && (
        <EmptyState>
          <FaYoutube style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
          <h3>Nenhum canal monitorado</h3>
          <p>Adicione canais do YouTube para baixar automaticamente os vídeos mais recentes.</p>
          <Button className="primary" onClick={() => setShowAddModal(true)}>
            <FaPlus style={{ marginRight: '8px' }} />
            Adicionar Primeiro Canal
          </Button>
        </EmptyState>
      )}

      {channels.length > 0 && (
        <ChannelsList>
          {channels.map((channel, index) => (
            <ChannelCard key={channel.id || index}>
              <ChannelHeader>
                <ChannelInfo>
                  <ChannelAvatar>
                    {channel.channelName.charAt(0).toUpperCase()}
                  </ChannelAvatar>
                  <ChannelDetails>
                    <ChannelName>{channel.channelName}</ChannelName>
                    <ChannelUrl 
                      href={channel.channelUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {channel.channelUrl}
                    </ChannelUrl>
                  </ChannelDetails>
                </ChannelInfo>
                
                <StatusBadge status={channel.status}>
                  {getStatusIcon(channel.status)}
                  {getStatusText(channel.status)}
                </StatusBadge>
              </ChannelHeader>

              <ChannelActions>
                <ActionButton 
                  onClick={() => handleToggleChannel(channel.id, channel.isActive)}
                  className={channel.isActive ? '' : 'primary'}
                >
                  {channel.isActive ? <FaPause /> : <FaPlay />}
                  {channel.isActive ? t('pause') : t('activate')}
                </ActionButton>
                
                <ActionButton onClick={() => handleTestChannel(channel.id, channel.channelName)}>
                  <FaSync />
                  {t('test')}
                </ActionButton>
                
                <ActionButton onClick={() => handleSetupChannel(channel.id, channel.channelName)}>
                  <FaCog />
                  {t('setup')}
                </ActionButton>
                
                <ActionButton 
                  className="danger"
                  onClick={() => handleDeleteChannel(channel.id, channel.channelName)}
                >
                  <FaTrash />
                  {t('remove')}
                </ActionButton>
              </ChannelActions>

              <ChannelStats>
                <ChannelStat>
                  <ChannelStatValue>{channel.totalVideosFound || 0}</ChannelStatValue>
                  <ChannelStatLabel>{t('videosFound')}</ChannelStatLabel>
                </ChannelStat>
                <ChannelStat>
                  <ChannelStatValue>{channel.totalVideosDownloaded || 0}</ChannelStatValue>
                  <ChannelStatLabel>{t('videosDownloaded')}</ChannelStatLabel>
                </ChannelStat>
                <ChannelStat>
                  <ChannelStatValue>{channel.lastCheckFormatted || t('never')}</ChannelStatValue>
                  <ChannelStatLabel>{t('lastCheck')}</ChannelStatLabel>
                </ChannelStat>
                <ChannelStat>
                  <ChannelStatValue>{channel.successRate || 'N/A'}</ChannelStatValue>
                  <ChannelStatLabel>{t('successRate')}</ChannelStatLabel>
                </ChannelStat>
              </ChannelStats>
            </ChannelCard>
          ))}
        </ChannelsList>
      )}

      {showAddModal && (
        <Modal onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
          <ModalContent>
            <ModalTitle>{t('addChannelToTracking')}</ModalTitle>
            
            <form onSubmit={handleAddChannel}>
              <FormGroup>
                <Label>{t('channelUrl')}</Label>
                <Input
                  type="url"
                  value={formData.channelUrl}
                  onChange={(e) => setFormData({...formData, channelUrl: e.target.value})}
                  placeholder={t('channelUrlPlaceholder')}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>{t('downloadQuality')}</Label>
                <Select
                  value={formData.quality}
                  onChange={(e) => setFormData({...formData, quality: e.target.value})}
                >
                  <option value="best">{t('bestQuality')}</option>
                  <option value="worst">{t('lowestQuality')}</option>
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>{t('verificationHour')}</Label>
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={formData.scheduledHour}
                  onChange={(e) => setFormData({...formData, scheduledHour: parseInt(e.target.value)})}
                />
              </FormGroup>

              <ModalActions>
                <Button 
                  type="button" 
                  className="secondary" 
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                >
                  {t('cancel')}
                </Button>
                <Button 
                  type="submit" 
                  className="primary"
                  disabled={submitting}
                >
                  {submitting ? t('addingChannel') : t('addChannel')}
                </Button>
              </ModalActions>
            </form>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}

export default ChannelsTrackedPage;
