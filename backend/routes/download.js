const express = require('express');
const router = express.Router();
const ytdlpService = require('../services/ytdlpService');
const { authenticateToken } = require('../middleware/auth');
const { Video, Channel } = require('../models');
const path = require('path');
const fs = require('fs-extra');
const { testYtdlpWithUrl } = require('../utils/checkYtdlp');

// Armazena progresso de downloads em andamento
const downloadProgress = new Map();

// GET /api/download/test - Testar YT-DLP (endpoint de debug)
router.get('/test', authenticateToken, async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL é obrigatória para teste' });
    }

    console.log('🧪 Testando YT-DLP diretamente...');
    
    // Testa com comando direto
    const directTest = await testYtdlpWithUrl(url);
    
    if (directTest) {
      res.json({
        success: true,
        message: 'YT-DLP funcionando corretamente',
        directTest: {
          type: directTest._type || 'video',
          title: directTest.title,
          hasEntries: !!directTest.entries,
          entriesCount: directTest.entries ? directTest.entries.length : 0
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'YT-DLP não está funcionando corretamente'
      });
    }

  } catch (error) {
    console.error('Erro no teste YT-DLP:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao testar YT-DLP: ' + error.message 
    });
  }
});

// GET /api/download/info - Obter informações de vídeo/playlist
router.get('/info', authenticateToken, async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL é obrigatória' });
    }

    console.log('📥 Processando solicitação de info para:', url);

    let info;
    try {
      // Primeira tentativa com nosso serviço
      info = await ytdlpService.getInfo(url);
    } catch (serviceError) {
      console.log('⚠️ Serviço falhou, tentando método direto...');
      
      // Fallback: tenta método direto
      info = await testYtdlpWithUrl(url);
      
      if (!info) {
        throw new Error('Ambos os métodos falharam');
      }
    }
    
    // Verifica se o objeto info foi retornado corretamente
    if (!info) {
      return res.status(500).json({ 
        error: 'Não foi possível obter informações do vídeo/playlist',
        details: 'YT-DLP retornou dados vazios'
      });
    }
    
    console.log('📊 Info obtida:', {
      type: info._type,
      title: info.title,
      hasEntries: !!info.entries
    });
    
    // Verifica se é playlist - info._type === 'playlist' é mais confiável
    const isPlaylist = info._type === 'playlist' || (info.entries && Array.isArray(info.entries) && info.entries.length > 0);

    if (isPlaylist) {
      // Garante que entries existe e é um array
      const entries = info.entries || [];
      
      console.log(`📁 Processando playlist com ${entries.length} vídeos`);
      
      res.json({
        type: 'playlist',
        title: info.title || 'Playlist sem título',
        playlistId: info.id || info.playlist_id,
        totalVideos: entries.length,
        videos: entries.map((video, index) => ({
          id: video.id || video.url || `video_${index}`,
          title: video.title || `Vídeo ${index + 1}`,
          duration: video.duration || 0,
          thumbnail: video.thumbnail || video.thumbnails?.[0]?.url || ''
        }))
      });
    } else {
      console.log('🎥 Processando vídeo único');
      const metadata = ytdlpService.formatVideoMetadata(info);
      
      if (!metadata) {
        return res.status(500).json({ 
          error: 'Erro ao formatar metadados do vídeo' 
        });
      }
      
      res.json({
        type: 'video',
        ...metadata
      });
    }

  } catch (error) {
    console.error('❌ Erro ao obter informações:', error.message);
    res.status(500).json({ 
      error: 'Erro ao obter informações do vídeo/playlist',
      details: error.message
    });
  }
});

// GET /api/download/formats - Obter formatos disponíveis
router.get('/formats', authenticateToken, async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL é obrigatória' });
    }

    console.log('🔍 Buscando formatos disponíveis para:', url);
    
    const formats = await ytdlpService.getAvailableFormats(url);
    
    // Agrupa por qualidade
    const videoFormats = formats.filter(f => f.vcodec !== 'none');
    const audioFormats = formats.filter(f => f.vcodec === 'none');

    res.json({
      url,
      formats,
      video: videoFormats,
      audio: audioFormats,
      message: 'Formatos obtidos com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao obter formatos:', error.message);
    res.status(500).json({ 
      error: 'Erro ao obter formatos disponíveis',
      details: error.message 
    });
  }
});

// POST /api/download/video - Baixar vídeo único
router.post('/video', authenticateToken, async (req, res) => {
  try {
    const { url, quality = 'best', saveToLibrary = true } = req.body;
    const userId = req.user.id;

    if (!url) {
      return res.status(400).json({ error: 'URL é obrigatória' });
    }

    const downloadId = `${userId}_${Date.now()}`;
    
    // Obtém metadados primeiro
    let metadata = null;
    try {
      const videoInfo = await ytdlpService.getInfo(url);
      metadata = ytdlpService.formatVideoMetadata(videoInfo);
    } catch (infoError) {
      console.error('Erro ao obter metadados:', infoError);
      downloadProgress.set(downloadId, { 
        progress: 0, 
        status: 'error',
        error: 'Erro ao obter informações do vídeo' 
      });
      return res.json({ 
        downloadId,
        message: 'Erro ao obter informações do vídeo',
        progressUrl: `/api/download/progress/${downloadId}`
      });
    }
    
    downloadProgress.set(downloadId, { 
      progress: 0, 
      status: 'starting',
      metadata: metadata 
    });

    // Retorna o ID do download imediatamente
    res.json({ 
      downloadId,
      message: 'Download iniciado',
      progressUrl: `/api/download/progress/${downloadId}`,
      metadata: metadata
    });

    // Processa download em background
    try {
      const result = await ytdlpService.downloadVideo(url, { quality }, (progress) => {
        downloadProgress.set(downloadId, { 
          progress, 
          status: 'downloading',
          metadata: metadata 
        });
      });

      if (saveToLibrary) {
        // Verifica se o canal existe ou cria um novo
        let channel = await Channel.findOne({
          where: { youtubeChannelId: result.metadata.channelId }
        });

        if (!channel && result.metadata.channelId) {
          channel = await Channel.create({
            youtubeChannelId: result.metadata.channelId,
            name: result.metadata.channelName || 'Canal Desconhecido',
            userId: userId
          });
        }

        // Verifica se já existe um vídeo com o mesmo youtubeId
        const existingVideo = await Video.findOne({
          where: { 
            youtubeId: result.metadata.youtubeId,
            userId: userId
          }
        });

        let video;
        if (existingVideo) {
          console.log('📹 Vídeo já existe na biblioteca, atualizando...');
          video = await existingVideo.update({
            title: result.metadata.title,
            description: result.metadata.description,
            duration: result.metadata.duration,
            thumbnail: result.metadata.thumbnail,
            videoUrl: `/videos/downloads/${result.filename}`,
            originalUrl: result.metadata.originalUrl,
            channelId: channel?.id,
            tags: result.metadata.tags,
            metadata: result.metadata,
            downloadStatus: 'completed',
            downloadProgress: 100,
            format: result.metadata.format,
            resolution: result.metadata.resolution,
            fileSize: (await fs.stat(result.filePath)).size
          });
        } else {
          // Salva vídeo no banco apenas se não existir
          video = await Video.create({
            youtubeId: result.metadata.youtubeId || `temp_${Date.now()}`,
            title: result.metadata.title,
            description: result.metadata.description,
            duration: result.metadata.duration,
            thumbnail: result.metadata.thumbnail,
            videoUrl: `/videos/downloads/${result.filename}`,
            originalUrl: result.metadata.originalUrl,
            channelId: channel?.id,
            userId: userId,
            tags: result.metadata.tags,
            metadata: result.metadata,
            downloadStatus: 'completed',
            downloadProgress: 100,
            format: result.metadata.format,
            resolution: result.metadata.resolution,
            fileSize: (await fs.stat(result.filePath)).size
          });
        }

        downloadProgress.set(downloadId, { 
          progress: 100, 
          status: 'completed',
          videoId: video.id,
          metadata: metadata
        });
      } else {
        downloadProgress.set(downloadId, { 
          progress: 100, 
          status: 'completed',
          tempFile: result.filename,
          metadata: metadata
        });
      }

    } catch (error) {
      console.error('Erro no download:', error);
      downloadProgress.set(downloadId, { 
        progress: 0, 
        status: 'error',
        error: error.message,
        metadata: metadata
      });
    }

  } catch (error) {
    console.error('Erro ao iniciar download:', error);
    res.status(500).json({ error: 'Erro ao iniciar download' });
  }
});

// POST /api/download/playlist - Baixar playlist
router.post('/playlist', authenticateToken, async (req, res) => {
  try {
    const { url, quality = 'best', saveToLibrary = true } = req.body;
    const userId = req.user.id;

    if (!url) {
      return res.status(400).json({ error: 'URL é obrigatória' });
    }

    const downloadId = `playlist_${userId}_${Date.now()}`;
    downloadProgress.set(downloadId, { 
      progress: 0, 
      status: 'starting',
      type: 'playlist' 
    });

    // Retorna o ID do download imediatamente
    res.json({ 
      downloadId,
      message: 'Download da playlist iniciado',
      progressUrl: `/api/download/progress/${downloadId}`
    });

    // Processa download em background
    try {
      const result = await ytdlpService.downloadPlaylist(url, { quality }, (progress) => {
        // Atualiza progresso no Map
        downloadProgress.set(downloadId, { 
          ...progress,
          status: 'downloading',
          downloadId
        });

        // Transmite progresso via WebSocket para todos os clientes conectados
        const wss = req.app.locals.wss;
        if (wss) {
          wss.clients.forEach(client => {
            if (client.readyState === 1 && client.downloadId === downloadId) { // WebSocket.OPEN = 1
              try {
                client.send(JSON.stringify({
                  downloadId,
                  ...progress
                }));
              } catch (wsError) {
                console.error('Erro ao enviar via WebSocket:', wsError);
              }
            }
          });
        }
      });

      if (saveToLibrary) {
        // Salva vídeos no banco
        for (const videoResult of result.results) {
          if (!videoResult.error) {
            // Processo similar ao vídeo único
            // ... (código de salvamento)
          }
        }
      }

      downloadProgress.set(downloadId, { 
        progress: 100, 
        status: 'completed',
        type: 'playlist',
        result: result
      });

    } catch (error) {
      console.error('Erro no download da playlist:', error);
      downloadProgress.set(downloadId, { 
        progress: 0, 
        status: 'error',
        type: 'playlist',
        error: error.message 
      });
    }

  } catch (error) {
    console.error('Erro ao iniciar download da playlist:', error);
    res.status(500).json({ error: 'Erro ao iniciar download da playlist' });
  }
});

// GET /api/download/progress/:downloadId - Obter progresso do download
router.get('/progress/:downloadId', authenticateToken, (req, res) => {
  const { downloadId } = req.params;
  const progress = downloadProgress.get(downloadId);

  if (!progress) {
    return res.status(404).json({ error: 'Download não encontrado' });
  }

  res.json(progress);

  // Remove da memória se completado ou com erro após 5 minutos
  if (progress.status === 'completed' || progress.status === 'error') {
    setTimeout(() => {
      downloadProgress.delete(downloadId);
    }, 5 * 60 * 1000);
  }
});

// DELETE /api/download/cancel/:downloadId - Cancelar download
router.delete('/cancel/:downloadId', authenticateToken, (req, res) => {
  const { downloadId } = req.params;
  
  // TODO: Implementar cancelamento real do processo ytdl
  downloadProgress.delete(downloadId);
  
  res.json({ message: 'Download cancelado' });
});

// GET /api/download/history - Histórico de downloads
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const videos = await Video.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Channel,
        as: 'channel'
      }],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json(videos);

  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico de downloads' });
  }
});

module.exports = router;