import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useSettings } from '../contexts/SettingsContext';
import { 
  FaUpload, FaUser, FaImage, FaSave, FaArrowLeft, 
  FaSpinner, FaCheckCircle, FaExclamationTriangle 
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
  padding: 20px;
  transition: margin-left 0.3s;

  @media (max-width: 768px) {
    margin-left: 0;
    padding: 16px;
  }
`;

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 30px;
  
  h1 {
    color: #ffffff;
    font-size: 28px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  p {
    color: #aaaaaa;
    font-size: 16px;
  }
`;

const BackButton = styled.button`
  background: transparent;
  border: 1px solid #444444;
  color: #ffffff;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  transition: all 0.2s;

  &:hover {
    background-color: #333333;
    border-color: #666666;
  }
`;

const Card = styled.div`
  background-color: #262626;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid #333333;
`;

const CardTitle = styled.h2`
  color: #ffffff;
  font-size: 20px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ImagePreview = styled.div`
  width: 100%;
  margin-bottom: 16px;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background-color: #333333;
  
  img {
    width: 100%;
    height: ${props => props.isAvatar ? '150px' : '200px'};
    object-fit: cover;
    display: block;
  }
  
  ${props => props.isAvatar && `
    width: 150px;
    height: 150px;
    border-radius: 50%;
    
    img {
      height: 150px;
    }
  `}
`;

const UploadArea = styled.div`
  border: 2px dashed #444444;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 16px;
  
  &:hover {
    border-color: #666666;
    background-color: #2a2a2a;
  }
  
  &.dragover {
    border-color: #ff0000;
    background-color: #330000;
  }
`;

const UploadText = styled.div`
  color: #aaaaaa;
  
  .upload-icon {
    font-size: 32px;
    margin-bottom: 12px;
    color: #666666;
  }
  
  p {
    margin: 8px 0;
    
    &:first-of-type {
      font-size: 16px;
      font-weight: 500;
    }
    
    &:last-of-type {
      font-size: 14px;
      color: #888888;
    }
  }
`;

const FileInput = styled.input`
  display: none;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
`;

const Button = styled.button`
  background-color: ${props => props.variant === 'primary' ? '#ff0000' : '#333333'};
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.variant === 'primary' ? '#cc0000' : '#444444'};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StatusMessage = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &.success {
    background-color: rgba(0, 255, 0, 0.1);
    border: 1px solid rgba(0, 255, 0, 0.3);
    color: #00ff00;
  }
  
  &.error {
    background-color: rgba(255, 0, 0, 0.1);
    border: 1px solid rgba(255, 0, 0, 0.3);
    color: #ff6b6b;
  }
`;

const ChannelManagePage = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const { t } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Estados para imagens
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  // Estados para upload
  const [uploading, setUploading] = useState({
    avatar: false
  });
  
  const [status, setStatus] = useState({
    avatar: null
  });
  
  // Carregar imagens atuais do canal
  useEffect(() => {
    loadChannelImages();
  }, [channelId]);

  const loadChannelImages = async () => {
    try {
      const response = await api.get(`/images/channel/${channelId}/info`);
      const { avatar } = response.data;
      
      if (avatar) setAvatarPreview(avatar);
      
    } catch (error) {
      console.error('Erro ao carregar imagens do canal:', error);
    }
  };

  const handleFileSelect = (type, file) => {
    if (!file) return;
    
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setStatus(prev => ({
        ...prev,
        [type]: { type: 'error', message: 'Apenas arquivos de imagem são permitidos' }
      }));
      return;
    }
    
    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setStatus(prev => ({
        ...prev,
        [type]: { type: 'error', message: 'Arquivo muito grande. Máximo 5MB.' }
      }));
      return;
    }
    
    // Criar preview (apenas avatar)
    if (type === 'avatar') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarFile(file);
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
    
    // Limpar status anterior
    setStatus(prev => ({ ...prev, [type]: null }));
  };

  const handleUpload = async (type) => {
    const file = avatarFile;
    
    if (!file) {
      setStatus(prev => ({
        ...prev,
        [type]: { type: 'error', message: 'Nenhum arquivo selecionado' }
      }));
      return;
    }
    
    setUploading(prev => ({ ...prev, [type]: true }));
    
    try {
      const formData = new FormData();
      formData.append(type, file);
      
      const response = await api.post(`/images/channel/${channelId}/${type}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setStatus(prev => ({
        ...prev,
        [type]: { type: 'success', message: response.data.message }
      }));
      
      // Limpar arquivo selecionado
      setAvatarFile(null);
      
    } catch (error) {
      console.error(`Erro ao fazer upload do ${type}:`, error);
      setStatus(prev => ({
        ...prev,
        [type]: { 
          type: 'error', 
          message: error.response?.data?.error || `Erro ao fazer upload do ${type}` 
        }
      }));
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const renderUploadArea = (type, title, isAvatar = false) => {
    const preview = avatarPreview;
    const file = avatarFile;
    const isUploading = uploading[type];
    const statusMsg = status[type];
    
    return (
      <Card>
        <CardTitle>
          {isAvatar ? <FaUser /> : <FaImage />}
          {title}
        </CardTitle>
        
        {preview && (
          <ImagePreview isAvatar={isAvatar}>
            <img src={preview} alt={`${title} preview`} />
          </ImagePreview>
        )}
        
        <UploadArea
          onClick={() => document.getElementById(`${type}-input`).click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('dragover');
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('dragover');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
              handleFileSelect(type, files[0]);
            }
          }}
        >
          <UploadText>
            <FaUpload className="upload-icon" />
            <p>Clique ou arraste uma imagem aqui</p>
            <p>
              {isAvatar 
                ? 'Recomendado: 150x150px, formato quadrado' 
                : 'Recomendado: 1920x480px, formato retangular'
              }
            </p>
          </UploadText>
        </UploadArea>
        
        <FileInput
          id={`${type}-input`}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(type, e.target.files[0])}
        />
        
        <ButtonGroup>
          <Button
            variant="primary"
            onClick={() => handleUpload(type)}
            disabled={!file || isUploading}
          >
            {isUploading ? <FaSpinner className="spin" /> : <FaSave />}
            {isUploading ? 'Enviando...' : 'Salvar'}
          </Button>
        </ButtonGroup>
        
        {statusMsg && (
          <StatusMessage className={statusMsg.type}>
            {statusMsg.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
            {statusMsg.message}
          </StatusMessage>
        )}
      </Card>
    );
  };

  return (
    <PageContainer>
      <AppHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Sidebar sidebarOpen={sidebarOpen} />
      
      <MainContent sidebarOpen={sidebarOpen}>
        <Container>
          <BackButton onClick={() => navigate('/channels')}>
            <FaArrowLeft />
            {t('backToChannels')}
          </BackButton>
          
          <Header>
            <h1>
              <FaImage />
              Gerenciar Imagens do Canal
            </h1>
            <p>Personalize o avatar do canal {channelId}</p>
          </Header>
          
          {renderUploadArea('avatar', 'Avatar do Canal', true)}
        </Container>
      </MainContent>
    </PageContainer>
  );
};

export default ChannelManagePage;