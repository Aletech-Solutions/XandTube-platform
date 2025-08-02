import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaUserPlus } from 'react-icons/fa';
import { channelsAPI } from '../services/api';

const CreateChannelContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
`;

const CreateChannelTitle = styled.h1`
  color: #fff;
  font-size: 28px;
  font-weight: 400;
  margin-bottom: 16px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

const CreateChannelSubtitle = styled.p`
  color: #aaa;
  font-size: 16px;
  text-align: center;
  margin-bottom: 32px;
  line-height: 1.5;
`;

const CreateChannelForm = styled.form`
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

const CharacterCount = styled.div`
  text-align: right;
  color: #aaa;
  font-size: 12px;
  margin-top: 4px;
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
  margin-top: 8px;
  
  &:hover:not(:disabled) {
    background-color: #0751ba;
  }
  
  &:disabled {
    background-color: #666;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  width: 100%;
  padding: 14px;
  background-color: transparent;
  border: 1px solid #303030;
  border-radius: 4px;
  color: #aaa;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
  
  &:hover {
    background-color: #3d3d3d;
    color: #fff;
    border-color: #aaa;
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

const GuidelinesBox = styled.div`
  background-color: #2d2d2d;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
`;

const GuidelinesTitle = styled.h3`
  color: #fff;
  font-size: 16px;
  margin-bottom: 12px;
`;

const GuidelinesList = styled.ul`
  color: #aaa;
  font-size: 14px;
  line-height: 1.5;
  padding-left: 20px;
`;

const GuidelinesItem = styled.li`
  margin-bottom: 8px;
`;

function CreateChannelPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Limitar caracteres
    if (name === 'name' && value.length > 50) return;
    if (name === 'description' && value.length > 1000) return;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Por favor, adicione um nome para o canal.');
      return;
    }
    
    if (formData.name.trim().length < 3) {
      setError('O nome do canal deve ter pelo menos 3 caracteres.');
      return;
    }

    try {
      setCreating(true);
      setError('');
      
      const response = await channelsAPI.create({
        name: formData.name.trim(),
        description: formData.description.trim()
      });
      
      setSuccess('Canal criado com sucesso!');
      console.log('Canal criado:', response.data);
      
      // Redirecionar para o canal após 2 segundos
      setTimeout(() => {
        navigate(`/channel/${response.data.channel.id}`);
      }, 2000);
      
    } catch (err) {
      console.error('Erro ao criar canal:', err);
      if (err.response?.status === 409) {
        setError('Já existe um canal com esse nome. Escolha outro nome.');
      } else {
        setError('Erro ao criar canal. Tente novamente.');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Voltar para a página anterior
  };

  return (
    <CreateChannelContainer>
      <CreateChannelTitle>
        <FaUserPlus />
        Criar Canal
      </CreateChannelTitle>
      
      <CreateChannelSubtitle>
        Crie seu canal no XandTube e comece a compartilhar seus vídeos com o mundo!
      </CreateChannelSubtitle>

      <GuidelinesBox>
        <GuidelinesTitle>Diretrizes para criação de canal</GuidelinesTitle>
        <GuidelinesList>
          <GuidelinesItem>
            Escolha um nome único e memorável para seu canal
          </GuidelinesItem>
          <GuidelinesItem>
            O nome deve ter entre 3 e 50 caracteres
          </GuidelinesItem>
          <GuidelinesItem>
            Adicione uma descrição que explique o conteúdo do seu canal
          </GuidelinesItem>
          <GuidelinesItem>
            Respeite as diretrizes da comunidade do XandTube
          </GuidelinesItem>
          <GuidelinesItem>
            Você poderá editar estas informações depois
          </GuidelinesItem>
        </GuidelinesList>
      </GuidelinesBox>
      
      <CreateChannelForm onSubmit={handleSubmit}>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
        
        <FormSection>
          <Label htmlFor="name">Nome do Canal *</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Digite o nome do seu canal"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          <CharacterCount>
            {formData.name.length}/50 caracteres
          </CharacterCount>
        </FormSection>

        <FormSection>
          <Label htmlFor="description">Descrição do Canal</Label>
          <TextArea
            id="description"
            name="description"
            placeholder="Descreva o tipo de conteúdo que você planeja criar..."
            value={formData.description}
            onChange={handleInputChange}
          />
          <CharacterCount>
            {formData.description.length}/1000 caracteres
          </CharacterCount>
        </FormSection>

        <CancelButton 
          type="button" 
          onClick={handleCancel}
        >
          Cancelar
        </CancelButton>
        
        <SubmitButton 
          type="submit" 
          disabled={creating || !formData.name.trim()}
        >
          {creating ? 'Criando canal...' : 'Criar canal'}
        </SubmitButton>
      </CreateChannelForm>
    </CreateChannelContainer>
  );
}

export default CreateChannelPage;