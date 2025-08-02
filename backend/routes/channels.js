const express = require('express');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Mock data - Em produção seria um banco de dados
let channels = [
  {
    id: 'channel-1',
    name: 'Canal Tecnologia',
    description: 'Canal dedicado a tecnologia e inovação',
    avatar: '/api/channels/channel-1/avatar',
    banner: '/api/channels/channel-1/banner',
    subscribers: 15420,
    totalViews: 234567,
    videoCount: 45,
    createdAt: '2023-06-15T10:30:00Z',
    verified: true
  },
  {
    id: 'channel-2',
    name: 'XandTube Oficial',
    description: 'Canal oficial do XandTube com tutoriais e novidades',
    avatar: '/api/channels/channel-2/avatar',
    banner: '/api/channels/channel-2/banner',
    subscribers: 8930,
    totalViews: 145238,
    videoCount: 23,
    createdAt: '2023-08-20T14:20:00Z',
    verified: true
  }
];

// GET /api/channels - Listar todos os canais
router.get('/', (req, res) => {
  try {
    const { search, limit = 20, offset = 0 } = req.query;
    
    let filteredChannels = [...channels];
    
    // Filtro por busca
    if (search) {
      const searchLower = search.toLowerCase();
      filteredChannels = filteredChannels.filter(channel => 
        channel.name.toLowerCase().includes(searchLower) ||
        channel.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Paginação
    const start = parseInt(offset);
    const end = start + parseInt(limit);
    const paginatedChannels = filteredChannels.slice(start, end);
    
    res.json({
      channels: paginatedChannels,
      total: filteredChannels.length,
      hasMore: end < filteredChannels.length
    });
  } catch (error) {
    console.error('Erro ao buscar canais:', error);
    res.status(500).json({ error: 'Erro ao buscar canais' });
  }
});

// GET /api/channels/:id - Obter canal específico
router.get('/:id', (req, res) => {
  try {
    const channel = channels.find(c => c.id === req.params.id);
    
    if (!channel) {
      return res.status(404).json({ 
        error: 'Canal não encontrado',
        message: 'O canal solicitado não existe'
      });
    }
    
    res.json(channel);
  } catch (error) {
    console.error('Erro ao buscar canal:', error);
    res.status(500).json({ error: 'Erro ao buscar canal' });
  }
});

// POST /api/channels - Criar novo canal
router.post('/', (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        error: 'Nome do canal é obrigatório'
      });
    }
    
    // Verificar se já existe um canal com esse nome
    const existingChannel = channels.find(c => 
      c.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingChannel) {
      return res.status(409).json({ 
        error: 'Já existe um canal com esse nome'
      });
    }
    
    const newChannel = {
      id: uuidv4(),
      name,
      description: description || '',
      avatar: `/api/channels/${uuidv4()}/avatar`,
      banner: `/api/channels/${uuidv4()}/banner`,
      subscribers: 0,
      totalViews: 0,
      videoCount: 0,
      createdAt: new Date().toISOString(),
      verified: false
    };
    
    channels.push(newChannel);
    
    res.status(201).json({
      message: 'Canal criado com sucesso!',
      channel: newChannel
    });
  } catch (error) {
    console.error('Erro ao criar canal:', error);
    res.status(500).json({ error: 'Erro ao criar canal' });
  }
});

// PUT /api/channels/:id - Atualizar canal
router.put('/:id', (req, res) => {
  try {
    const channel = channels.find(c => c.id === req.params.id);
    
    if (!channel) {
      return res.status(404).json({ error: 'Canal não encontrado' });
    }
    
    const { name, description } = req.body;
    
    // Verificar se o novo nome já existe em outro canal
    if (name && name !== channel.name) {
      const existingChannel = channels.find(c => 
        c.id !== req.params.id && 
        c.name.toLowerCase() === name.toLowerCase()
      );
      
      if (existingChannel) {
        return res.status(409).json({ 
          error: 'Já existe um canal com esse nome'
        });
      }
      
      channel.name = name;
    }
    
    if (description !== undefined) {
      channel.description = description;
    }
    
    res.json({
      message: 'Canal atualizado com sucesso!',
      channel
    });
  } catch (error) {
    console.error('Erro ao atualizar canal:', error);
    res.status(500).json({ error: 'Erro ao atualizar canal' });
  }
});

// PUT /api/channels/:id/subscribe - Inscrever-se no canal
router.put('/:id/subscribe', (req, res) => {
  try {
    const channel = channels.find(c => c.id === req.params.id);
    
    if (!channel) {
      return res.status(404).json({ error: 'Canal não encontrado' });
    }
    
    channel.subscribers += 1;
    
    res.json({ 
      message: 'Inscrito no canal!',
      subscribers: channel.subscribers 
    });
  } catch (error) {
    console.error('Erro ao se inscrever:', error);
    res.status(500).json({ error: 'Erro ao se inscrever no canal' });
  }
});

// PUT /api/channels/:id/unsubscribe - Cancelar inscrição
router.put('/:id/unsubscribe', (req, res) => {
  try {
    const channel = channels.find(c => c.id === req.params.id);
    
    if (!channel) {
      return res.status(404).json({ error: 'Canal não encontrado' });
    }
    
    channel.subscribers = Math.max(0, channel.subscribers - 1);
    
    res.json({ 
      message: 'Inscrição cancelada!',
      subscribers: channel.subscribers 
    });
  } catch (error) {
    console.error('Erro ao cancelar inscrição:', error);
    res.status(500).json({ error: 'Erro ao cancelar inscrição' });
  }
});

// GET /api/channels/:id/avatar - Obter avatar (mock)
router.get('/:id/avatar', (req, res) => {
  // Em produção, serviria imagens reais
  res.redirect('https://via.placeholder.com/150x150/333333/ffffff?text=CH');
});

// GET /api/channels/:id/banner - Obter banner (mock)
router.get('/:id/banner', (req, res) => {
  // Em produção, serviria imagens reais
  res.redirect('https://via.placeholder.com/1920x480/666666/ffffff?text=Channel+Banner');
});

// DELETE /api/channels/:id - Deletar canal
router.delete('/:id', (req, res) => {
  try {
    const channelIndex = channels.findIndex(c => c.id === req.params.id);
    
    if (channelIndex === -1) {
      return res.status(404).json({ error: 'Canal não encontrado' });
    }
    
    // Remover do array
    channels.splice(channelIndex, 1);
    
    res.json({ message: 'Canal removido com sucesso!' });
  } catch (error) {
    console.error('Erro ao deletar canal:', error);
    res.status(500).json({ error: 'Erro ao deletar canal' });
  }
});

module.exports = router;