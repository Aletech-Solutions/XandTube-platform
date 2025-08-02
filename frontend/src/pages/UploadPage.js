import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaUpload, FaVideo } from 'react-icons/fa';
import { videosAPI, channelsAPI } from '../services/api';

const UploadContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const UploadTitle = styled.h1`
  color: #fff;
  font-size: 28px;
  font-weight: 400;
  margin-bottom: 32px;
  text-align: center;
`;

const UploadForm = styled.form`
  background-color: #272727;
  border-radius: 8px;
  padding: 32px;
`;

const FormSection = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  background-color: #181818;
  border: 1px solid #303030;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #065fd4;
  }
  
  &::placeholder {
    color: #aaa;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 12px;
  background-color: #181818;
  border: 1px solid #303030;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #065fd4;
  }
  
  &::placeholder {
    color: #aaa;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  background-color: #181818;
  border: 1px solid #303030;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #065fd4;
  }
  
  option {
    background-color: #181818;
    color: #fff;
  }
`;

const FileUploadArea = styled.div`
  border: 2px dashed #303030;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  background-color: #181818;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #065fd4;
    background-color: #1a1a1a;
  }
  
  &.dragover {
    border-color: #065fd4;
    background-color: #1a1a1a;
  }
`;

const FileUploadIcon = styled.div`
  font-size: 48px;
  color: #aaa;
  margin-bottom: 16px;
`;

const FileUploadText = styled.p`
  color: #aaa;
  font-size: 16px;
  margin-bottom: 8px;
`;

const FileUploadSubtext = styled.p`
  color: #666;
  font-size: 14px;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const SelectedFile = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: #2d2d2d;
  border-radius: 4px;
  margin-top: 16px;
`;

const FileIcon = styled.div`
  font-size: 24px;
  color: #065fd4;
`;

const FileInfo = styled.div`
  flex: 1;
`;

const FileName = styled.p`
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
`;

const FileSize = styled.p`
  color: #aaa;
  font-size: 12px;
`;

const RemoveFileButton = styled.button`
  background: none;
  border: none;
  color: #ff4444;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    color: #ff6666;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 14px;
  background-color: #065fd4;
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 24px;
  
  &:hover:not(:disabled) {
    background-color: #0751ba;
  }
  
  &:disabled {
    background-color: #666;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background-color: #cc0000;
  color: white;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
`;

const SuccessMessage = styled.div`
  background-color: #00aa00;
  color: white;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
`;

function UploadPage() {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    channelId: '',
    tags: ''
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const response = await channelsAPI.getAll();
      setChannels(response.data.channels || []);
    } catch (err) {
      console.error('Erro ao carregar canais:', err);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    // Verificar tipo de arquivo
    const allowedTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      setError('Formato de arquivo não suportado. Use MP4, AVI ou MOV.');
      return;
    }

    // Verificar tamanho (100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError('Arquivo muito grande. O limite é 100MB.');
      return;
    }

    setSelectedFile(file);
    setError('');
    
    // Auto-preencher título se estiver vazio
    if (!formData.title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setFormData(prev => ({ ...prev, title: nameWithoutExt }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Por favor, selecione um arquivo de vídeo.');
      return;
    }
    
    if (!formData.title.trim()) {
      setError('Por favor, adicione um título para o vídeo.');
      return;
    }
    
    if (!formData.channelId) {
      setError('Por favor, selecione um canal.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      
      const uploadData = new FormData();
      uploadData.append('video', selectedFile);
      uploadData.append('title', formData.title.trim());
      uploadData.append('description', formData.description.trim());
      uploadData.append('channelId', formData.channelId);
      uploadData.append('tags', formData.tags.trim());
      
      // Adicionar nome do canal
      const selectedChannel = channels.find(c => c.id === formData.channelId);
      if (selectedChannel) {
        uploadData.append('channelName', selectedChannel.name);
      }

      const response = await videosAPI.upload(uploadData);
      
      setSuccess('Vídeo enviado com sucesso!');
      console.log('Upload realizado:', response.data);
      
      // Redirecionar para o vídeo após 2 segundos
      setTimeout(() => {
        navigate(`/watch/${response.data.video.id}`);
      }, 2000);
      
    } catch (err) {
      console.error('Erro no upload:', err);
      setError('Erro ao enviar vídeo. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <UploadContainer>
      <UploadTitle>Enviar vídeo</UploadTitle>
      
      <UploadForm onSubmit={handleSubmit}>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
        
        <FormSection>
          <Label>Arquivo de vídeo</Label>
          
          {!selectedFile ? (
            <FileUploadArea
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <FileUploadIcon>
                <FaUpload />
              </FileUploadIcon>
              <FileUploadText>
                Arraste um vídeo aqui ou clique para selecionar
              </FileUploadText>
              <FileUploadSubtext>
                Formatos suportados: MP4, AVI, MOV • Máximo: 100MB
              </FileUploadSubtext>
              
              <HiddenFileInput
                id="fileInput"
                type="file"
                accept="video/*"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
            </FileUploadArea>
          ) : (
            <SelectedFile>
              <FileIcon>
                <FaVideo />
              </FileIcon>
              <FileInfo>
                <FileName>{selectedFile.name}</FileName>
                <FileSize>{formatFileSize(selectedFile.size)}</FileSize>
              </FileInfo>
              <RemoveFileButton
                type="button"
                onClick={() => setSelectedFile(null)}
              >
                Remover
              </RemoveFileButton>
            </SelectedFile>
          )}
        </FormSection>

        <FormSection>
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            name="title"
            type="text"
            placeholder="Adicione um título que descreva seu vídeo"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </FormSection>

        <FormSection>
          <Label htmlFor="description">Descrição</Label>
          <TextArea
            id="description"
            name="description"
            placeholder="Conte aos espectadores sobre seu vídeo"
            value={formData.description}
            onChange={handleInputChange}
          />
        </FormSection>

        <FormSection>
          <Label htmlFor="channelId">Canal *</Label>
          <Select
            id="channelId"
            name="channelId"
            value={formData.channelId}
            onChange={handleInputChange}
            required
          >
            <option value="">Selecione um canal</option>
            {channels.map(channel => (
              <option key={channel.id} value={channel.id}>
                {channel.name}
              </option>
            ))}
          </Select>
        </FormSection>

        <FormSection>
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            name="tags"
            type="text"
            placeholder="Adicione tags separadas por vírgula"
            value={formData.tags}
            onChange={handleInputChange}
          />
        </FormSection>

        <SubmitButton 
          type="submit" 
          disabled={uploading || !selectedFile}
        >
          {uploading ? 'Enviando...' : 'Publicar vídeo'}
        </SubmitButton>
      </UploadForm>
    </UploadContainer>
  );
}

export default UploadPage;