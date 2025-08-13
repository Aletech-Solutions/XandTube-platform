import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import DownloadCard from '../components/DownloadCard';
import Pagination from '../components/Pagination';
import { downloadsAPI } from '../services/api';
import { FaHistory, FaSyncAlt, FaDownload, FaHdd, FaTrash } from 'react-icons/fa';
import { useSettings } from '../contexts/SettingsContext';

const HistoricoPage = () => {
  const { t } = useSettings();
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scanning, setScanning] = useState(false);
  const [flushingCache, setFlushingCache] = useState(false);

  const loadDownloads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Carregando downloads - página:', page);
      const response = await downloadsAPI.list(page, 20);
      console.log('✅ Downloads carregados:', response.data);
      
      setDownloads(response.data.downloads || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('❌ Erro ao carregar downloads:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Erro ao carregar histórico de downloads.';
      setError(`Erro ao carregar downloads: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const loadStats = useCallback(async () => {
    try {
      console.log('🔄 Carregando estatísticas...');
      const response = await downloadsAPI.stats();
      console.log('✅ Estatísticas carregadas:', response.data);
      setStats(response.data);
    } catch (err) {
      console.error('❌ Erro ao carregar estatísticas:', err);
      // Não define erro para stats, apenas logs
    }
  }, []);

  useEffect(() => {
    loadDownloads();
    loadStats();
  }, [loadDownloads, loadStats]);

  const handleScanDownloads = async () => {
    try {
      setScanning(true);
      const response = await downloadsAPI.scan();
      
      console.log('✅ Escaneamento concluído:', response.data);
      await loadDownloads();
      await loadStats();
      
      console.log(`✅ Escaneamento concluído! ${response.data.totalFound || 0} downloads encontrados.`);
    } catch (err) {
      console.error('❌ Erro ao escanear downloads:', err);
      console.error('❌ Erro ao escanear pasta de downloads.');
    } finally {
      setScanning(false);
    }
  };

  const handleFlushCache = async () => {
    try {
      setFlushingCache(true);
      console.log('🗑️ Iniciando flush cache...');
      
      // Usa o método combinado que limpa o cache e recarrega
      const response = await downloadsAPI.flushAndReload();
      
      console.log('✅ Flush cache concluído:', response.data);
      
      // Recarrega a página atual
      await loadDownloads();
      await loadStats();
      
      console.log(`🎉 Cache limpo e recarregado! ${response.data.totalFound || 0} downloads encontrados.`);
    } catch (err) {
      console.error('❌ Erro ao fazer flush do cache:', err);
      console.error('❌ Erro ao limpar cache e recarregar dados.');
    } finally {
      setFlushingCache(false);
    }
  };

  const handleDownloadDelete = (downloadId) => {
    setDownloads(prev => prev.filter(d => d.id !== downloadId));
    loadStats(); // Recarrega estatísticas após deletar
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <HistoricoContainer>
      <Header>
        <HeaderContent>
          <Title>
            <FaHistory /> {t('yourDownloads')}
          </Title>
          
          <ActionButtons>
            <ActionButton 
              onClick={handleScanDownloads}
              disabled={scanning || flushingCache}
            >
              <FaSyncAlt className={scanning ? 'spinning' : ''} />
              {scanning ? t('scanning') : t('scanFolder')}
            </ActionButton>
            
            <ActionButton 
              onClick={handleFlushCache}
              disabled={scanning || flushingCache}
              variant="danger"
            >
              <FaTrash className={flushingCache ? 'spinning' : ''} />
              {flushingCache ? 'Limpando Cache...' : 'Flush Cache'}
            </ActionButton>
          </ActionButtons>
        </HeaderContent>

        <StatsContainer>
          {stats ? (
            <>
              <StatCard>
                <StatIcon><FaDownload /></StatIcon>
                <StatValue>{stats.total || '0'}</StatValue>
                <StatLabel>{t('totalDownloads')}</StatLabel>
              </StatCard>
              
              <StatCard>
                <StatIcon><FaDownload /></StatIcon>
                <StatValue>{stats.completed || '0'}</StatValue>
                <StatLabel>{t('completed')}</StatLabel>
              </StatCard>
              
              <StatCard>
                <StatIcon><FaHdd /></StatIcon>
                <StatValue>{stats.totalSizeFormatted || '0 B'}</StatValue>
                <StatLabel>{t('spaceUsed')}</StatLabel>
              </StatCard>
              
              <StatCard>
                <StatIcon><FaDownload /></StatIcon>
                <StatValue>{downloads.length}</StatValue>
                <StatLabel>{t('showingInList')}</StatLabel>
              </StatCard>
            </>
          ) : (
            <StatCard>
              <StatIcon><FaSyncAlt /></StatIcon>
              <StatValue>-</StatValue>
              <StatLabel>Carregando Estatísticas...</StatLabel>
            </StatCard>
          )}
        </StatsContainer>
      </Header>

      {loading && (
        <LoadingState>
          <p>Carregando downloads...</p>
        </LoadingState>
      )}

      {error && (
        <ErrorState>
          <h3>Erro ao carregar downloads</h3>
          <p>{error}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={loadDownloads}>Tentar novamente</button>
            <button 
              onClick={handleScanDownloads}
              disabled={scanning || flushingCache}
              style={{ background: '#1976d2' }}
            >
              {scanning ? 'Escaneando...' : 'Escanear Pasta'}
            </button>
            <button 
              onClick={handleFlushCache}
              disabled={scanning || flushingCache}
              style={{ background: '#d32f2f' }}
            >
              {flushingCache ? 'Limpando Cache...' : 'Flush Cache'}
            </button>
          </div>
          <p style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
            💡 Dica: Se o erro persistir, tente escanear a pasta para sincronizar os downloads
          </p>
        </ErrorState>
      )}

      {!loading && !error && downloads.length === 0 && (
        <EmptyState>
          <h3>{t('noDownloadsFound')}</h3>
          <p>{t('downloadDescription')}</p>
          {stats && stats.total > 0 && (
            <p style={{ color: '#ff9800', fontSize: '14px', marginBottom: '16px' }}>
              ⚠️ Existem {stats.total} downloads nas estatísticas, mas nenhum foi carregado na lista.
              Tente escanear novamente.
            </p>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={handleScanDownloads} 
              disabled={scanning || flushingCache}
              style={{ background: '#1976d2' }}
            >
              {scanning ? t('scanning') : t('scanDownloadsFolder')}
            </button>
            <button 
              onClick={handleFlushCache}
              disabled={scanning || flushingCache}
              style={{ background: '#d32f2f' }}
            >
              {flushingCache ? 'Limpando Cache...' : 'Flush Cache'}
            </button>
          </div>
        </EmptyState>
      )}

      {!loading && !error && downloads.length > 0 && (
        <>
          <DownloadsGrid>
            {downloads.map(download => (
              <DownloadCard
                key={download.id}
                download={download}
                onDelete={handleDownloadDelete}
              />
            ))}
          </DownloadsGrid>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            showInfo={true}
            showQuickJump={true}
          />
        </>
      )}
    </HistoricoContainer>
  );
};

// Styled Components
const HistoricoContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.div`
  margin-bottom: 30px;
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
`;

const Title = styled.h1`
  color: #fff;
  font-size: 28px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: ${props => props.variant === 'danger' ? '#d32f2f' : '#1976d2'};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${props => props.variant === 'danger' ? '#c62828' : '#1565c0'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
`;

const StatCard = styled.div`
  background: #2d2d2d;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  border-left: 4px solid #1976d2;
`;

const StatIcon = styled.div`
  color: #1976d2;
  font-size: 24px;
  margin-bottom: 8px;
`;

const StatValue = styled.div`
  color: #fff;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  color: #aaa;
  font-size: 14px;
`;

const DownloadsGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(600px, 1fr));
  margin-bottom: 30px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #aaa;
  
  p {
    font-size: 16px;
    margin: 0;
  }
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #ff5722;
  
  h3 {
    margin-bottom: 8px;
    font-size: 20px;
  }
  
  p {
    margin-bottom: 16px;
    font-size: 14px;
    color: #aaa;
  }

  button {
    padding: 10px 20px;
    background: #ff5722;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;

    &:hover {
      background: #d84315;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #aaa;
  
  h3 {
    color: #fff;
    margin-bottom: 8px;
    font-size: 20px;
  }
  
  p {
    margin-bottom: 24px;
    font-size: 14px;
  }

  button {
    padding: 12px 24px;
    background: #1976d2;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;

    &:hover:not(:disabled) {
      background: #1565c0;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
`;



export default HistoricoPage;