const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Função para carregar imagens customizadas dos canais
const loadCustomChannelImages = () => {
  const channelImagesPath = path.join(__dirname, '../../videos/channel-images.json');
  
  try {
    if (fs.existsSync(channelImagesPath)) {
      return JSON.parse(fs.readFileSync(channelImagesPath, 'utf8'));
    }
  } catch (error) {
    console.warn('Erro ao carregar imagens de canais:', error.message);
  }
  
  return {};
};

// Função para ler arquivos de informação dos vídeos
const getVideoInfoFiles = () => {
  const videosPath = path.join(__dirname, '../../videos');
  const downloadsPath = path.join(videosPath, 'downloads');
  const metadataPath = path.join(videosPath, 'metadata');
  
  let infoFiles = [];
  
  // Buscar em downloads
  if (fs.existsSync(downloadsPath)) {
    const files = fs.readdirSync(downloadsPath);
    const infoFilesInDownloads = files.filter(file => file.endsWith('.info.json'));
    infoFiles = infoFiles.concat(infoFilesInDownloads.map(file => path.join(downloadsPath, file)));
  }
  
  // Buscar em metadata
  if (fs.existsSync(metadataPath)) {
    const files = fs.readdirSync(metadataPath);
    const infoFilesInMetadata = files.filter(file => file.endsWith('.info.json'));
    infoFiles = infoFiles.concat(infoFilesInMetadata.map(file => path.join(metadataPath, file)));
  }
  
  return infoFiles;
};

// Função para extrair informações de canais dos vídeos
const extractChannelsFromVideos = () => {
  const infoFiles = getVideoInfoFiles();
  const channelsMap = new Map();
  const customImages = loadCustomChannelImages();
  
  infoFiles.forEach(filePath => {
    try {
      // Verificar se o arquivo existe antes de tentar lê-lo
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ Arquivo não encontrado: ${filePath}`);
        return;
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      const videoInfo = JSON.parse(content);
      
      const channelId = videoInfo.channel_id || videoInfo.uploader_id;
      const channelName = videoInfo.channel || videoInfo.uploader;
      
      if (channelId && channelName) {
        if (!channelsMap.has(channelId)) {
          // Usar imagens customizadas se disponíveis, senão usar graceful fallback
          const channelImages = customImages[channelId] || {};
          const avatar = channelImages.avatar ? 
            `/api/images/avatar/${channelImages.avatar}` : 
            `/api/images/avatar/placeholder-${channelId}.png`;
            
          channelsMap.set(channelId, {
            id: channelId,
            name: channelName,
            description: videoInfo.channel_description || `Canal de ${channelName}`,
            avatar: avatar,
            subscribers: videoInfo.channel_follower_count || 0,
            totalViews: 0,
            videoCount: 0,
            createdAt: new Date().toISOString(),
            verified: false,
            videos: []
          });
        }
        
        const channel = channelsMap.get(channelId);
        channel.videoCount++;
        channel.totalViews += (videoInfo.view_count || 0);
        
        // Extrair ID completo do nome do arquivo (inclui timestamp)
        const fileName = path.basename(filePath, '.info.json');
        
        // Adicionar informações do vídeo
        channel.videos.push({
          id: fileName, // ID completo com timestamp (ex: Htm6wnKPqKw_1754242008929)
          youtubeId: videoInfo.id, // ID original do YouTube (ex: Htm6wnKPqKw)
          title: videoInfo.title,
          thumbnail: videoInfo.thumbnail,
          duration: videoInfo.duration,
          views: videoInfo.view_count || 0,
          uploadDate: videoInfo.upload_date,
          createdAt: videoInfo.upload_date ? new Date(videoInfo.upload_date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')).toISOString() : new Date().toISOString()
        });
      }
    } catch (error) {
      console.error(`Erro ao processar ${filePath}:`, error.message);
    }
  });
  
  return Array.from(channelsMap.values());
};

// GET /api/channels - Listar todos os canais
router.get('/', (req, res) => {
  try {
    const { search, limit = 20, offset = 0 } = req.query;
    
    let channels = extractChannelsFromVideos();
    let filteredChannels = [...channels];
    
    // Filtro por busca
    if (search) {
      const searchLower = search.toLowerCase();
      filteredChannels = filteredChannels.filter(channel => 
        channel.name.toLowerCase().includes(searchLower) ||
        channel.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Remover a propriedade videos para não sobrecarregar a resposta
    filteredChannels = filteredChannels.map(({ videos, ...channel }) => channel);
    
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
    const channels = extractChannelsFromVideos();
    const channel = channels.find(c => c.id === req.params.id);
    
    if (!channel) {
      return res.status(404).json({ 
        error: 'Canal não encontrado',
        message: 'O canal solicitado não existe'
      });
    }
    
    // Remover a propriedade videos para não duplicar dados
    const { videos, ...channelData } = channel;
    res.json(channelData);
  } catch (error) {
    console.error('Erro ao buscar canal:', error);
    res.status(500).json({ error: 'Erro ao buscar canal' });
  }
});

// POST /api/channels - Criar novo canal (desabilitado - canais são criados automaticamente)
router.post('/', (req, res) => {
  res.status(405).json({ 
    error: 'Método não permitido',
    message: 'Canais são criados automaticamente a partir dos vídeos baixados'
  });
});

// PUT /api/channels/:id - Atualizar canal (desabilitado - canais são baseados nos vídeos)
router.put('/:id', (req, res) => {
  res.status(405).json({ 
    error: 'Método não permitido',
    message: 'Informações dos canais são extraídas automaticamente dos vídeos baixados'
  });
});

// PUT /api/channels/:id/subscribe - Inscrever-se no canal (simulado)
router.put('/:id/subscribe', (req, res) => {
  try {
    const channels = extractChannelsFromVideos();
    const channel = channels.find(c => c.id === req.params.id);
    
    if (!channel) {
      return res.status(404).json({ error: 'Canal não encontrado' });
    }
    
    // Simular inscrição (em uma implementação real, seria salvo no banco)
    res.json({ 
      message: 'Inscrito no canal!',
      subscribers: channel.subscribers + 1
    });
  } catch (error) {
    console.error('Erro ao se inscrever:', error);
    res.status(500).json({ error: 'Erro ao se inscrever no canal' });
  }
});

// PUT /api/channels/:id/unsubscribe - Cancelar inscrição (simulado)
router.put('/:id/unsubscribe', (req, res) => {
  try {
    const channels = extractChannelsFromVideos();
    const channel = channels.find(c => c.id === req.params.id);
    
    if (!channel) {
      return res.status(404).json({ error: 'Canal não encontrado' });
    }
    
    // Simular cancelamento de inscrição (em uma implementação real, seria salvo no banco)
    res.json({ 
      message: 'Inscrição cancelada!',
      subscribers: Math.max(0, channel.subscribers - 1)
    });
  } catch (error) {
    console.error('Erro ao cancelar inscrição:', error);
    res.status(500).json({ error: 'Erro ao cancelar inscrição' });
  }
});

// GET /api/channels/:id/videos - Obter vídeos do canal
router.get('/:id/videos', (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const channelId = req.params.id;
    
    const channels = extractChannelsFromVideos();
    const channel = channels.find(c => c.id === channelId);
    
    if (!channel) {
      return res.status(404).json({ 
        error: 'Canal não encontrado',
        message: 'O canal solicitado não existe'
      });
    }
    
    // Paginação dos vídeos
    const start = parseInt(offset);
    const end = start + parseInt(limit);
    const paginatedVideos = channel.videos.slice(start, end);
    
    res.json({
      channel: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        avatar: channel.avatar,
        subscribers: channel.subscribers,
        totalViews: channel.totalViews,
        verified: channel.verified
      },
      videos: paginatedVideos,
      total: channel.videos.length,
      hasMore: end < channel.videos.length
    });
  } catch (error) {
    console.error('Erro ao buscar vídeos do canal:', error);
    res.status(500).json({ error: 'Erro ao buscar vídeos do canal' });
  }
});

// GET /api/channels/:id/avatar - Obter avatar (mock)
router.get('/:id/avatar', (req, res) => {
  // Em produção, serviria imagens reais
  res.redirect('https://via.placeholder.com/150x150/333333/ffffff?text=CH');
});



// DELETE /api/channels/:id - Deletar canal (desabilitado)
router.delete('/:id', (req, res) => {
  res.status(405).json({ 
    error: 'Método não permitido',
    message: 'Canais são gerenciados automaticamente baseados nos vídeos baixados'
  });
});

module.exports = router;