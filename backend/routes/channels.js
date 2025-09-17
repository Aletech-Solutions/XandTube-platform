const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Função para carregar imagens customizadas dos canais
const loadCustomChannelImages = async () => {
  const { ChannelImage } = require('../models');
  
  try {
    const channelImages = await ChannelImage.findAll();
    const imagesMap = {};
    
    channelImages.forEach(record => {
      imagesMap[record.channelId] = {
        avatar: record.avatarFilename,
        banner: record.bannerFilename,
        updatedAt: record.updatedAt
      };
    });
    
    return imagesMap;
  } catch (error) {
    console.warn('Erro ao carregar imagens de canais do banco:', error.message);
    return {};
  }
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
const extractChannelsFromVideos = async () => {
  const infoFiles = getVideoInfoFiles();
  const channelsMap = new Map();
  const customImages = await loadCustomChannelImages();
  
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
router.get('/', async (req, res) => {
  try {
    const { search, limit = 20, page = 1, sortBy = 'name', sortOrder = 'ASC' } = req.query;
    
    console.log(`🔍 Buscando canais - Página: ${page}, Limite: ${limit}, Busca: "${search || 'N/A'}"`);
    
    let channels = await extractChannelsFromVideos();
    let filteredChannels = [...channels];
    
    console.log(`📊 Total de canais extraídos: ${channels.length}`);
    
    // Filtro por busca
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filteredChannels = filteredChannels.filter(channel => 
        channel.name.toLowerCase().includes(searchLower) ||
        (channel.description && channel.description.toLowerCase().includes(searchLower))
      );
      console.log(`🔍 Canais após filtro de busca: ${filteredChannels.length}`);
    }
    
    // Ordenação
    filteredChannels.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'videoCount':
          aValue = a.videoCount || 0;
          bValue = b.videoCount || 0;
          break;
        case 'subscribers':
          aValue = a.subscribers || 0;
          bValue = b.subscribers || 0;
          break;
        case 'totalViews':
          aValue = a.totalViews || 0;
          bValue = b.totalViews || 0;
          break;
        default: // 'name'
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
      }
      
      if (sortOrder.toLowerCase() === 'desc') {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });
    
    // Remover a propriedade videos para não sobrecarregar a resposta
    const channelsWithoutVideos = filteredChannels.map(({ videos, ...channel }) => channel);
    
    // Paginação
    const currentPage = Math.max(1, parseInt(page));
    const pageSize = Math.max(1, Math.min(100, parseInt(limit))); // Limitar entre 1 e 100
    const offset = (currentPage - 1) * pageSize;
    const paginatedChannels = channelsWithoutVideos.slice(offset, offset + pageSize);
    const totalPages = Math.ceil(channelsWithoutVideos.length / pageSize);
    
    console.log(`📄 Paginação - Página ${currentPage}/${totalPages}, Offset: ${offset}, Retornando: ${paginatedChannels.length} canais`);
    
    const response = {
      success: true,
      channels: paginatedChannels,
      pagination: {
        total: channelsWithoutVideos.length,
        totalPages: totalPages,
        currentPage: currentPage,
        limit: pageSize,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
        startIndex: offset + 1,
        endIndex: Math.min(offset + pageSize, channelsWithoutVideos.length)
      },
      meta: {
        searchTerm: search || null,
        sortBy,
        sortOrder,
        totalChannelsBeforeFilter: channels.length,
        totalChannelsAfterFilter: channelsWithoutVideos.length
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('❌ Erro ao buscar canais:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/channels/:id - Obter canal específico
router.get('/:id', async (req, res) => {
  try {
    const channels = await extractChannelsFromVideos();
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
router.put('/:id', async (req, res) => {
  res.status(405).json({ 
    error: 'Método não permitido',
    message: 'Informações dos canais são extraídas automaticamente dos vídeos baixados'
  });
});

// PUT /api/channels/:id/subscribe - Inscrever-se no canal (simulado)
router.put('/:id/subscribe', async (req, res) => {
  try {
    const channels = await extractChannelsFromVideos();
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
router.put('/:id/unsubscribe', async (req, res) => {
  try {
    const channels = await extractChannelsFromVideos();
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
router.get('/:id/videos', async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const channelId = req.params.id;
    
    console.log(`🔍 DEBUG: Buscando vídeos do canal ${channelId}, página ${page}, limite ${limit}`);
    
    const channels = await extractChannelsFromVideos();
    const channel = channels.find(c => c.id === channelId);
    
    if (!channel) {
      return res.status(404).json({ 
        error: 'Canal não encontrado',
        message: 'O canal solicitado não existe'
      });
    }
    
    // Ordenar vídeos por data de upload (mais recentes primeiro)
    const sortedVideos = [...channel.videos].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    console.log(`📊 DEBUG: Total de vídeos ordenados: ${sortedVideos.length}`);
    
    // Paginação dos vídeos
    const currentPage = parseInt(page);
    const pageSize = parseInt(limit);
    const offset = (currentPage - 1) * pageSize;
    const paginatedVideos = sortedVideos.slice(offset, offset + pageSize);
    const totalPages = Math.ceil(sortedVideos.length / pageSize);
    
    console.log(`📄 DEBUG: Página ${currentPage}, offset ${offset}, pegando vídeos ${offset} a ${offset + pageSize - 1}`);
    console.log(`🎥 DEBUG: Vídeos retornados: ${paginatedVideos.map(v => v.id).join(', ')}`);
    
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
      total: sortedVideos.length, // Compatibilidade com estrutura antiga
      hasMore: currentPage < totalPages, // Compatibilidade com estrutura antiga
      pagination: {
        total: sortedVideos.length,
        totalPages: totalPages,
        currentPage: currentPage,
        limit: pageSize,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
      }
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
router.delete('/:id', async (req, res) => {
  res.status(405).json({ 
    error: 'Método não permitido',
    message: 'Canais são gerenciados automaticamente baseados nos vídeos baixados'
  });
});

module.exports = router;