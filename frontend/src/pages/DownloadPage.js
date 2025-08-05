import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { 
  FaYoutube, FaDownload, FaSpinner, FaCheck, FaTimes, 
  FaVideo, FaList, FaClock, FaEye, FaFolder, FaInfoCircle 
} from 'react-icons/fa';
import api from '../services/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useSettings } from '../contexts/SettingsContext';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const GlobalStyle = styled.div`
  .spin {
    animation: ${spin} 1s linear infinite;
  }
`;

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

  @media (max-width: 480px) {
    padding: 5px;
  }
`;

const DownloadContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const Title = styled.h1`
  color: #ffffff;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  
  svg {
    color: #FF0000;
  }

  @media (max-width: 768px) {
    margin-bottom: 15px;
    font-size: 20px;
    gap: 8px;
  }

  @media (max-width: 480px) {
    margin-bottom: 10px;
    font-size: 18px;
    gap: 6px;
  }
`;

const UrlInputSection = styled.div`
  background: #2d2d2d;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;

  @media (max-width: 768px) {
    padding: 15px;
    margin-bottom: 15px;
    border-radius: 6px;
  }

  @media (max-width: 480px) {
    padding: 12px;
    margin-bottom: 12px;
  }
`;

const InputGroup = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
    margin-bottom: 15px;
  }

  @media (max-width: 480px) {
    gap: 8px;
    margin-bottom: 10px;
  }
`;

const UrlInput = styled.input`
  flex: 1;
  padding: 12px 20px;
  border: 2px solid #555;
  border-radius: 25px;
  font-size: 16px;
  background-color: #2d2d2d;
  color: #ffffff;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #FF0000;
  }
  
  &::placeholder {
    color: #999;
  }

  @media (max-width: 768px) {
    padding: 10px 16px;
    font-size: 14px;
    border-radius: 20px;
  }

  @media (max-width: 480px) {
    padding: 8px 12px;
    font-size: 14px;
    border-radius: 18px;
  }
`;

const AnalyzeButton = styled.button`
  background: #FF0000;
  color: white;
  padding: 12px 30px;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background-color 0.3s;
  
  &:hover {
    background: #cc0000;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 10px 20px;
    font-size: 14px;
    border-radius: 20px;
    gap: 8px;
  }

  @media (max-width: 480px) {
    padding: 8px 16px;
    font-size: 13px;
    border-radius: 18px;
    gap: 6px;
  }
`;

const VideoInfo = styled.div`
  background: #2d2d2d;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;

  @media (max-width: 768px) {
    padding: 15px;
    margin-bottom: 15px;
    border-radius: 6px;
  }

  @media (max-width: 480px) {
    padding: 12px;
    margin-bottom: 12px;
  }
`;

const VideoHeader = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
    margin-bottom: 15px;
  }

  @media (max-width: 480px) {
    gap: 12px;
    margin-bottom: 12px;
  }
`;

const Thumbnail = styled.img`
  width: 320px;
  height: 180px;
  object-fit: cover;
  border-radius: 8px;
  
  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    max-height: 200px;
    border-radius: 6px;
  }

  @media (max-width: 480px) {
    max-height: 150px;
    border-radius: 4px;
  }
`;

const VideoDetails = styled.div`
  flex: 1;
  
  h2 {
    color: #ffffff;
    margin: 0 0 10px 0;
    font-size: 20px;
    line-height: 1.2;
  }
  
  p {
    color: #aaa;
    margin: 5px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    
    svg {
      color: #ccc;
    }
  }

  @media (max-width: 768px) {
    h2 {
      font-size: 16px;
      margin: 0 0 8px 0;
    }
    
    p {
      font-size: 12px;
      gap: 6px;
      margin: 3px 0;
    }
  }

  @media (max-width: 480px) {
    h2 {
      font-size: 14px;
      margin: 0 0 6px 0;
    }
    
    p {
      font-size: 11px;
      gap: 4px;
      margin: 2px 0;
    }
  }
`;

const Description = styled.div`
  color: #ccc;
  line-height: 1.6;
  max-height: 100px;
  overflow-y: auto;
  padding: 15px;
  background: #2d2d2d;
  border-radius: 8px;
  margin-top: 15px;
  font-size: 14px;

  @media (max-width: 768px) {
    padding: 12px;
    margin-top: 12px;
    border-radius: 6px;
    font-size: 12px;
    max-height: 80px;
  }

  @media (max-width: 480px) {
    padding: 10px;
    margin-top: 10px;
    border-radius: 4px;
    font-size: 11px;
    max-height: 60px;
  }
`;

const QualitySection = styled.div`
  margin-top: 20px;
  
  h3 {
    color: #ffffff;
    margin-bottom: 15px;
    font-size: 16px;
  }

  @media (max-width: 768px) {
    margin-top: 15px;
    
    h3 {
      margin-bottom: 12px;
      font-size: 14px;
    }
  }

  @media (max-width: 480px) {
    margin-top: 12px;
    
    h3 {
      margin-bottom: 10px;
      font-size: 13px;
    }
  }
`;

const QualityOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 6px;
  }
`;

const QualityOption = styled.label`
  display: flex;
  align-items: center;
  padding: 10px 15px;
  border: 2px solid ${props => props.selected ? '#FF0000' : '#555'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: ${props => props.selected ? '#3d3d3d' : '#2d2d2d'};
  
  &:hover {
    border-color: #FF0000;
  }
  
  input {
    margin-right: 8px;
  }
  
  span {
    color: #ffffff;
    font-weight: ${props => props.selected ? 'bold' : 'normal'};
    font-size: 14px;
  }

  @media (max-width: 768px) {
    padding: 8px 12px;
    border-radius: 6px;
    
    input {
      margin-right: 6px;
    }
    
    span {
      font-size: 12px;
    }
  }

  @media (max-width: 480px) {
    padding: 6px 10px;
    border-radius: 4px;
    
    input {
      margin-right: 4px;
    }
    
    span {
      font-size: 11px;
    }
  }
`;

const DownloadOptions = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
    margin-top: 15px;
  }

  @media (max-width: 480px) {
    gap: 8px;
    margin-top: 12px;
  }
`;

const DownloadButton = styled.button`
  flex: 1;
  background: ${props => props.primary ? '#FF0000' : '#2d2d2d'};
  color: ${props => props.primary ? 'white' : '#FF0000'};
  padding: 12px 30px;
  border: 2px solid #FF0000;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s;
  
  &:hover {
    background: ${props => props.primary ? '#cc0000' : '#3d3d3d'};
  }
  
  &:disabled {
    background: #ccc;
    border-color: #555;
    color: white;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 10px 20px;
    font-size: 14px;
    border-radius: 20px;
    gap: 8px;
  }

  @media (max-width: 480px) {
    padding: 8px 16px;
    font-size: 12px;
    border-radius: 18px;
    gap: 6px;
  }
`;

const ProgressSection = styled.div`
  background: #2d2d2d;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;

  h3 {
    color: #ffffff;
    margin: 0 0 20px 0;
    font-size: 18px;
  }

  @media (max-width: 768px) {
    padding: 15px;
    margin-bottom: 15px;
    border-radius: 6px;
    
    h3 {
      font-size: 14px;
      margin-bottom: 12px;
    }
  }

  @media (max-width: 480px) {
    padding: 12px;
    margin-bottom: 12px;
    
    h3 {
      font-size: 13px;
      margin-bottom: 10px;
    }
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 30px;
  background: #2d2d2d;
  border-radius: 15px;
  overflow: hidden;
  margin: 20px 0;

  @media (max-width: 768px) {
    height: 25px;
    border-radius: 12px;
    margin: 15px 0;
  }

  @media (max-width: 480px) {
    height: 20px;
    border-radius: 10px;
    margin: 10px 0;
  }
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #FF0000 0%, #ff4444 100%);
  width: ${props => props.progress}%;
  transition: width 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;

  @media (max-width: 768px) {
    font-size: 12px;
  }

  @media (max-width: 480px) {
    font-size: 10px;
  }
`;

const ProgressInfo = styled.div`
  display: flex;
  justify-content: space-between;
  color: #aaa;
  
  span {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 8px;
    text-align: center;
    font-size: 12px;
    
    span {
      justify-content: center;
      font-size: 12px;
    }
  }
`;

const PlaylistProgressSection = styled.div`
  background: #2d2d2d;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;

  h3 {
    color: #ffffff;
    margin: 0 0 20px 0;
    font-size: 18px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  @media (max-width: 768px) {
    padding: 15px;
    margin-bottom: 15px;
    border-radius: 6px;
    
    h3 {
      font-size: 14px;
      margin-bottom: 12px;
    }
  }

  @media (max-width: 480px) {
    padding: 12px;
    margin-bottom: 12px;
    
    h3 {
      font-size: 13px;
      margin-bottom: 10px;
    }
  }
`;

const VideoProgressList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #555;
  border-radius: 8px;
  background: #1e1e1e;

  @media (max-width: 768px) {
    max-height: 300px;
  }

  @media (max-width: 480px) {
    max-height: 250px;
  }
`;

const VideoProgressItem = styled.div`
  padding: 15px;
  border-bottom: 1px solid #333;
  
  &:last-child {
    border-bottom: none;
  }
  
  h4 {
    color: #ffffff;
    font-size: 14px;
    margin: 0 0 8px 0;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  
  .status {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 12px;
    
    .status-icon {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .status-pending { color: #999; }
    .status-starting { color: #ffa500; }
    .status-downloading { color: #2196f3; }
    .status-completed { color: #4caf50; }
    .status-error { color: #f44336; }
    .status-skipped { color: #777; }
  }

  @media (max-width: 768px) {
    padding: 12px;
    
    h4 {
      font-size: 13px;
    }
    
    .status {
      font-size: 11px;
      gap: 6px;
    }
  }

  @media (max-width: 480px) {
    padding: 10px;
    
    h4 {
      font-size: 12px;
    }
    
    .status {
      font-size: 10px;
      gap: 4px;
    }
  }
`;

const VideoProgressBar = styled.div`
  width: 100%;
  height: 20px;
  background: #333;
  border-radius: 10px;
  overflow: hidden;

  @media (max-width: 768px) {
    height: 18px;
    border-radius: 9px;
  }

  @media (max-width: 480px) {
    height: 16px;
    border-radius: 8px;
  }
`;

const VideoProgressFill = styled.div`
  height: 100%;
  background: ${props => {
    switch (props.status) {
      case 'completed': return 'linear-gradient(90deg, #4caf50 0%, #66bb6a 100%)';
      case 'downloading': return 'linear-gradient(90deg, #2196f3 0%, #42a5f5 100%)';
      case 'error': return 'linear-gradient(90deg, #f44336 0%, #ef5350 100%)';
      case 'starting': return 'linear-gradient(90deg, #ffa500 0%, #ffb74d 100%)';
      default: return '#555';
    }
  }};
  width: ${props => Math.max(props.progress || 0, props.status === 'starting' ? 5 : 0)}%;
  transition: width 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 12px;

  @media (max-width: 768px) {
    font-size: 11px;
  }

  @media (max-width: 480px) {
    font-size: 10px;
  }
`;

const PlaylistInfo = styled.div`
  background: #3d3d3d;
  border: 2px solid #FF0000;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  
  h3 {
    color: #FF0000;
    margin: 0 0 10px 0;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
  }
  
  p {
    color: #aaa;
    margin: 5px 0;
  }

  @media (max-width: 768px) {
    padding: 15px;
    
    h3 {
      font-size: 16px;
      gap: 8px;
    }
  }
`;

const VideoList = styled.div`
  max-height: 300px;
  overflow-y: auto;
  margin-top: 15px;
  padding: 10px;
  background: #2d2d2d;
  border-radius: 8px;

  @media (max-width: 768px) {
    max-height: 250px;
    padding: 8px;
  }
`;

const VideoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-bottom: 1px solid #2d2d2d;
  
  &:last-child {
    border-bottom: none;
  }
  
  img {
    width: 80px;
    height: 45px;
    object-fit: cover;
    border-radius: 4px;
  }
  
  div {
    flex: 1;
    min-width: 0; /* Permite que o texto seja quebrado */
    
    h4 {
      color: #ffffff;
      font-size: 14px;
      margin: 0;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    p {
      color: #aaa;
      font-size: 12px;
      margin: 2px 0;
    }
  }

  @media (max-width: 768px) {
    gap: 8px;
    padding: 8px;
    
    img {
      width: 60px;
      height: 34px;
    }
    
    div {
      h4 {
        font-size: 13px;
        line-height: 1.3;
      }
      
      p {
        font-size: 11px;
      }
    }
  }
`;

const ErrorMessage = styled.div`
  background: #3d3d3d;
  color: #c62828;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  overflow-wrap: break-word;
  word-break: break-word;
  
  svg {
    font-size: 20px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  @media (max-width: 768px) {
    padding: 12px;
    font-size: 14px;
    
    svg {
      font-size: 18px;
    }
  }
`;

const InfoMessage = styled.div`
  background: #e3f2fd;
  color: #1565c0;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  overflow-wrap: break-word;
  word-break: break-word;
  
  svg {
    font-size: 20px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  @media (max-width: 768px) {
    padding: 12px;
    font-size: 14px;
    
    svg {
      font-size: 18px;
    }
  }
`;

function DownloadPage() {
  const navigate = useNavigate();
  const { t } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [selectedQuality, setSelectedQuality] = useState('best');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState('');
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [playlistProgress, setPlaylistProgress] = useState(null);
  const [videosProgress, setVideosProgress] = useState({});
  const wsRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Verifica autenticação
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // Limpa ao desmontar
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Conecta WebSocket para progresso em tempo real
  const connectWebSocket = (downloadId) => {
    const wsUrl = `ws://localhost:3001`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket conectado');
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        downloadId: downloadId
      }));
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.downloadId === downloadId) {
        console.log('📨 WebSocket recebido:', data);
        
        // Atualiza progresso baseado no tipo
        switch (data.type) {
          case 'playlist_init':
            setPlaylistProgress({
              totalVideos: data.totalVideos,
              playlistTitle: data.playlistTitle
            });
            setVideosProgress(data.videos || {});
            break;
            
          case 'video_update':
            setVideosProgress(data.videos || {});
            // Calcula progresso geral da playlist
            const videos = data.videos || {};
            const totalVideos = Object.keys(videos).length;
            const completedVideos = Object.values(videos).filter(v => v.status === 'completed').length;
            const overallProgress = totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0;
            setDownloadProgress(overallProgress);
            break;
            
          case 'playlist_complete':
            setVideosProgress(data.videos || {});
            setDownloadProgress(100);
            setDownloading(false);
            console.log('🎉 Download da playlist completo!');
            break;
            
          default:
            // Fallback para vídeo único
            setDownloadProgress(data.progress || data.videoProgress || 0);
            break;
        }
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('Erro WebSocket:', error);
    };
  };

  // Polling alternativo para progresso
  const startProgressPolling = (downloadId) => {
    progressIntervalRef.current = setInterval(async () => {
      try {
        const response = await api.get(`/download/progress/${downloadId}`);
        const data = response.data;
        
        console.log('📊 Polling recebido:', data);
        
        // Processa dados de progresso similar ao WebSocket
        if (data.type) {
          switch (data.type) {
            case 'playlist_init':
              setPlaylistProgress({
                totalVideos: data.totalVideos,
                playlistTitle: data.playlistTitle
              });
              setVideosProgress(data.videos || {});
              break;
              
            case 'video_update':
              setVideosProgress(data.videos || {});
              const videos = data.videos || {};
              const totalVideos = Object.keys(videos).length;
              const completedVideos = Object.values(videos).filter(v => v.status === 'completed').length;
              const overallProgress = totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0;
              setDownloadProgress(overallProgress);
              break;
              
            case 'playlist_complete':
              setVideosProgress(data.videos || {});
              setDownloadProgress(100);
              clearInterval(progressIntervalRef.current);
              setDownloading(false);
              console.log('🎉 Download da playlist completo via polling!');
              break;
              
            default:
              setDownloadProgress(data.progress || 0);
              break;
          }
        } else {
          // Fallback para formato antigo
          setDownloadProgress(data.progress || 0);
        }
        
        if (data.status === 'completed') {
          clearInterval(progressIntervalRef.current);
          setDownloading(false);
          console.log('Download completo!');
          setError('');
        } else if (data.status === 'error') {
          clearInterval(progressIntervalRef.current);
          setDownloading(false);
          setError(data.error || 'Erro no download');
        }
      } catch (error) {
        console.error('Erro ao verificar progresso:', error);
      }
    }, 1000);
  };

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Por favor, insira uma URL do YouTube');
      return;
    }

    setLoading(true);
    setError('');
    setVideoInfo(null);

    try {
      const response = await api.get('/download/info', {
        params: { url }
      });

      setVideoInfo(response.data);
      console.log('Informações do vídeo obtidas com sucesso');
    } catch (error) {
      console.error('Erro ao analisar URL:', error);
      setError(error.response?.data?.error || 'Erro ao analisar URL');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (downloadPlaylist = false) => {
    setDownloading(true);
    setError('');
    setDownloadProgress(0);
    setPlaylistProgress(null);
    setVideosProgress({});

    try {
      const endpoint = downloadPlaylist ? '/download/playlist' : '/download/video';
      const response = await api.post(endpoint, {
        url,
        quality: selectedQuality,
        saveToLibrary
      });

      const { downloadId } = response.data;

      // Tenta conectar WebSocket primeiro
      try {
        connectWebSocket(downloadId);
      } catch (wsError) {
        console.error('WebSocket não disponível, usando polling:', wsError);
      }

      // Sempre usa polling como backup
      startProgressPolling(downloadId);

      console.log('Download iniciado');
    } catch (error) {
      console.error('Erro ao iniciar download:', error);
      setError(error.response?.data?.error || 'Erro ao iniciar download');
      setDownloading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || typeof seconds !== 'number') return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views) => {
    if (!views || typeof views !== 'number') return 'N/A';
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M ${t('views')}`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K ${t('views')}`;
    }
    return `${views} ${t('views')}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FaClock />;
      case 'starting': return <FaSpinner className="spin" />;
      case 'downloading': return <FaSpinner className="spin" />;
      case 'completed': return <FaCheck />;
      case 'error': return <FaTimes />;
      case 'skipped': return <FaTimes />;
      default: return <FaClock />;
    }
  };

  const getStatusText = (status, error = null) => {
    switch (status) {
      case 'pending': return 'Aguardando...';
      case 'starting': return 'Iniciando...';
      case 'downloading': return t('downloading');
      case 'completed': return 'Concluído';
      case 'error': return `Erro: ${error || 'Desconhecido'}`;
      case 'skipped': return 'Ignorado';
      default: return 'Aguardando...';
    }
  };

  return (
    <GlobalStyle>
      <PageContainer>
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <Sidebar isOpen={sidebarOpen} />
      
      <MainContent sidebarOpen={sidebarOpen}>
        <DownloadContainer>
          <Title>
            <FaDownload />
            {t('downloadYouTubeVideos')}
          </Title>

          <InfoMessage>
            <FaInfoCircle />
            {t('downloadToolDescription')}
          </InfoMessage>

          <UrlInputSection>
            <InputGroup>
              <UrlInput
                type="text"
                placeholder={t('pasteVideoUrl')}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                disabled={loading || downloading}
              />
              <AnalyzeButton 
                onClick={handleAnalyze} 
                disabled={loading || downloading || !url.trim()}
              >
                {loading ? <FaSpinner className="spin" /> : <FaYoutube />}
                {loading ? t('analyzing') : t('analyze')}
              </AnalyzeButton>
            </InputGroup>
          </UrlInputSection>

          {error && (
            <ErrorMessage>
              <FaTimes />
              {error}
            </ErrorMessage>
          )}

          {videoInfo && videoInfo.type === 'video' && (
            <VideoInfo>
              <VideoHeader>
                <Thumbnail src={videoInfo.thumbnail} alt={videoInfo.title} />
                <VideoDetails>
                  <h2>{videoInfo.title}</h2>
                  <p>
                    <FaVideo />
                    {t('channel')}: {videoInfo.channelName}
                  </p>
                  <p>
                    <FaClock />
                    {t('duration')}: {formatDuration(videoInfo.duration)}
                  </p>
                  <p>
                    <FaEye />
                    {formatViews(videoInfo.viewCount)}
                  </p>
                </VideoDetails>
              </VideoHeader>

              {videoInfo.description && (
                <Description>{videoInfo.description}</Description>
              )}

              <QualitySection>
                <h3>{t('downloadQuality')}</h3>
                <QualityOptions>
                  <QualityOption selected={selectedQuality === 'best'}>
                    <input
                      type="radio"
                      name="quality"
                      value="best"
                      checked={selectedQuality === 'best'}
                      onChange={(e) => setSelectedQuality(e.target.value)}
                    />
                    <span>{t('bestQuality')}</span>
                  </QualityOption>
                  <QualityOption selected={selectedQuality === '1080p'}>
                    <input
                      type="radio"
                      name="quality"
                      value="1080p"
                      checked={selectedQuality === '1080p'}
                      onChange={(e) => setSelectedQuality(e.target.value)}
                    />
                    <span>1080p (Full HD)</span>
                  </QualityOption>
                  <QualityOption selected={selectedQuality === '720p'}>
                    <input
                      type="radio"
                      name="quality"
                      value="720p"
                      checked={selectedQuality === '720p'}
                      onChange={(e) => setSelectedQuality(e.target.value)}
                    />
                    <span>720p (HD)</span>
                  </QualityOption>
                  <QualityOption selected={selectedQuality === '480p'}>
                    <input
                      type="radio"
                      name="quality"
                      value="480p"
                      checked={selectedQuality === '480p'}
                      onChange={(e) => setSelectedQuality(e.target.value)}
                    />
                    <span>480p</span>
                  </QualityOption>
                </QualityOptions>
              </QualitySection>

              <DownloadOptions>
                <DownloadButton
                  primary
                  onClick={() => handleDownload(false)}
                  disabled={downloading}
                >
                  <FaDownload />
                  {downloading ? t('downloading') : t('downloadVideo')}
                </DownloadButton>
                <DownloadButton
                  onClick={() => setSaveToLibrary(!saveToLibrary)}
                  disabled={downloading}
                >
                  <FaFolder />
                  {saveToLibrary ? t('saveToLibrary') : t('onlyDownload')}
                </DownloadButton>
              </DownloadOptions>
            </VideoInfo>
          )}

          {videoInfo && videoInfo.type === 'playlist' && (
            <VideoInfo>
              <PlaylistInfo>
                <h3>
                  <FaList />
                  Playlist: {videoInfo.title}
                </h3>
                <p>Total de vídeos: {videoInfo.totalVideos}</p>
              </PlaylistInfo>

              <VideoList>
                {videoInfo.videos.map((video, index) => (
                  <VideoItem key={video.id}>
                    <img src={video.thumbnail} alt={video.title} />
                    <div>
                      <h4>{index + 1}. {video.title}</h4>
                      <p>{t('duration')}: {formatDuration(video.duration)}</p>
                    </div>
                  </VideoItem>
                ))}
              </VideoList>

              <QualitySection>
                <h3>{t('downloadQuality')}</h3>
                <QualityOptions>
                  <QualityOption selected={selectedQuality === 'best'}>
                    <input
                      type="radio"
                      name="quality"
                      value="best"
                      checked={selectedQuality === 'best'}
                      onChange={(e) => setSelectedQuality(e.target.value)}
                    />
                    <span>{t('bestQuality')}</span>
                  </QualityOption>
                  <QualityOption selected={selectedQuality === '720p'}>
                    <input
                      type="radio"
                      name="quality"
                      value="720p"
                      checked={selectedQuality === '720p'}
                      onChange={(e) => setSelectedQuality(e.target.value)}
                    />
                    <span>720p (HD)</span>
                  </QualityOption>
                  <QualityOption selected={selectedQuality === '480p'}>
                    <input
                      type="radio"
                      name="quality"
                      value="480p"
                      checked={selectedQuality === '480p'}
                      onChange={(e) => setSelectedQuality(e.target.value)}
                    />
                    <span>480p</span>
                  </QualityOption>
                </QualityOptions>
              </QualitySection>

              <DownloadOptions>
                <DownloadButton
                  primary
                  onClick={() => handleDownload(true)}
                  disabled={downloading}
                >
                  <FaDownload />
                  {downloading ? 'Baixando Playlist...' : 'Baixar Toda a Playlist'}
                </DownloadButton>
                <DownloadButton
                  onClick={() => setSaveToLibrary(!saveToLibrary)}
                  disabled={downloading}
                >
                  <FaFolder />
                  {saveToLibrary ? t('saveToLibrary') : t('onlyDownload')}
                </DownloadButton>
              </DownloadOptions>
            </VideoInfo>
          )}

          {downloading && !playlistProgress && (
            <ProgressSection>
                              <h3>{t('downloadProgress')}</h3>
              <ProgressBar>
                <ProgressFill progress={downloadProgress || 0}>
                  {(downloadProgress || 0).toFixed(0)}%
                </ProgressFill>
              </ProgressBar>
              <ProgressInfo>
                <span>
                  <FaSpinner className="spin" />
                  {t('downloading')}
                </span>
                <span>{(downloadProgress || 0).toFixed(0)}% {t('complete')}</span>
              </ProgressInfo>
            </ProgressSection>
          )}

          {downloading && playlistProgress && (
            <PlaylistProgressSection>
              <h3>
                <FaList />
                Progresso da Playlist: {playlistProgress.playlistTitle}
              </h3>
              
              <ProgressBar>
                <ProgressFill progress={downloadProgress || 0}>
                  {(downloadProgress || 0).toFixed(0)}%
                </ProgressFill>
              </ProgressBar>
              
              <ProgressInfo>
                <span>
                  <FaSpinner className="spin" />
                  Baixando playlist...
                </span>
                <span>
                  {Object.values(videosProgress).filter(v => v.status === 'completed').length} de {playlistProgress.totalVideos} vídeos baixados
                </span>
              </ProgressInfo>

              <VideoProgressList>
                {Object.entries(videosProgress).map(([videoId, video]) => (
                  <VideoProgressItem key={videoId}>
                    <h4>{video.index}. {video.title}</h4>
                    <div className={`status status-${video.status}`}>
                      <div className="status-icon">
                        {getStatusIcon(video.status)}
                      </div>
                      {getStatusText(video.status, video.error)}
                    </div>
                    <VideoProgressBar>
                      <VideoProgressFill 
                        progress={video.progress} 
                        status={video.status}
                      >
                        {video.status === 'downloading' && video.progress > 0 ? `${video.progress.toFixed(0)}%` : ''}
                      </VideoProgressFill>
                    </VideoProgressBar>
                  </VideoProgressItem>
                ))}
              </VideoProgressList>
            </PlaylistProgressSection>
          )}
        </DownloadContainer>
      </MainContent>
      </PageContainer>
    </GlobalStyle>
  );
}

export default DownloadPage;