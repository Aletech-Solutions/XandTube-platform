const express = require('express');
const { ChannelTracking, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const ytdlpService = require('../services/ytdlpService');
const channelTrackingService = require('../services/channelTrackingService');

const router = express.Router();

/**
 * @route GET /api/channel-tracking
 * @desc Get all tracked channels for the authenticated user
 * @access Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const trackedChannels = await ChannelTracking.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }
      ]
    });

    // Add computed fields
    const channelsWithStats = trackedChannels.map(channel => {
      const channelData = channel.toJSON();
      return {
        ...channelData,
        status: channel.isActive ? 'active' : 'inactive',
        hasErrors: channel.errorCount > 0,
        lastCheckFormatted: channel.lastCheck ? 
          new Date(channel.lastCheck).toLocaleString('pt-BR') : 'Nunca',
        successRate: channel.totalVideosFound > 0 ? 
          ((channel.totalVideosDownloaded / channel.totalVideosFound) * 100).toFixed(1) + '%' : 'N/A'
      };
    });

    res.json({
      success: true,
      data: channelsWithStats,
      total: trackedChannels.length
    });

  } catch (error) {
    console.error('❌ Erro ao buscar canais trackados:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /api/channel-tracking
 * @desc Add a new channel to tracking list
 * @access Private
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      channelUrl, 
      quality = 'best', 
      saveToLibrary = true,
      scheduledHour = 2 
    } = req.body;

    // Validate required fields
    if (!channelUrl) {
      return res.status(400).json({
        success: false,
        error: 'URL do canal é obrigatória'
      });
    }

    // Validate scheduled hour
    if (scheduledHour < 0 || scheduledHour > 23) {
      return res.status(400).json({
        success: false,
        error: 'Hora agendada deve estar entre 0 e 23'
      });
    }

    console.log('🔍 Obtendo informações do canal:', channelUrl);

    // Get channel information using YT-DLP
    let channelInfo;
    try {
      channelInfo = await ytdlpService.getChannelInfo(channelUrl);
    } catch (ytdlpError) {
      console.error('❌ Erro ao obter informações do canal:', ytdlpError);
      return res.status(400).json({
        success: false,
        error: 'Não foi possível obter informações do canal. Verifique se a URL está correta.'
      });
    }

    // Extract channel ID and name
    const youtubeChannelId = channelInfo.id || channelInfo.channel_id || channelInfo.uploader_id;
    const channelName = channelInfo.channel || channelInfo.uploader || channelInfo.title || 'Canal Desconhecido';

    if (!youtubeChannelId) {
      return res.status(400).json({
        success: false,
        error: 'Não foi possível extrair o ID do canal'
      });
    }

    // Check if channel is already being tracked
    const existingTracking = await ChannelTracking.findOne({
      where: { youtubeChannelId }
    });

    if (existingTracking) {
      // If it exists but is inactive, reactivate it
      if (!existingTracking.isActive) {
        existingTracking.isActive = true;
        existingTracking.quality = quality;
        existingTracking.saveToLibrary = saveToLibrary;
        existingTracking.scheduledHour = scheduledHour;
        existingTracking.errorCount = 0;
        existingTracking.lastError = null;
        await existingTracking.save();

        // Configurar canal reativado (baixar vídeo mais recente)
        try {
          console.log('🔧 Reconfigurando canal reativado:', existingTracking.channelName);
          const channelTrackingService = require('../services/channelTrackingService');
          
          setImmediate(async () => {
            try {
              const setupResult = await channelTrackingService.setupNewChannel(existingTracking.id);
              console.log('✅ Reconfiguração concluída para:', existingTracking.channelName);
            } catch (setupError) {
              console.error('❌ Erro na reconfiguração:', setupError.message);
            }
          });
        } catch (serviceError) {
          console.warn('⚠️ Erro ao reconfigurar canal:', serviceError.message);
        }

        return res.json({
          success: true,
          message: 'Canal reativado no sistema de tracking. Download do vídeo mais recente iniciado.',
          data: existingTracking
        });
      } else {
        return res.status(409).json({
          success: false,
          error: 'Este canal já está sendo trackado'
        });
      }
    }

    // Create new tracking entry
    const newTracking = await ChannelTracking.create({
      youtubeChannelId,
      channelUrl,
      channelName,
      userId,
      quality,
      saveToLibrary,
      scheduledHour,
      metadata: {
        description: channelInfo.description,
        subscriber_count: channelInfo.subscriber_count,
        video_count: channelInfo.video_count,
        thumbnail: channelInfo.thumbnail
      }
    });

    console.log('✅ Canal adicionado ao tracking:', channelName);

    // Configurar canal: baixar vídeo mais recente e iniciar monitoramento
    try {
      console.log('🔧 Configurando canal e baixando vídeo mais recente:', channelName);
      const channelTrackingService = require('../services/channelTrackingService');
      
      // Executar configuração em background (não aguardar para não bloquear resposta)
      setImmediate(async () => {
        try {
          const setupResult = await channelTrackingService.setupNewChannel(newTracking.id);
          console.log('✅ Configuração concluída para:', channelName);
          console.log('📊 Resultado:', setupResult.message);
        } catch (setupError) {
          console.error('❌ Erro na configuração inicial:', setupError.message);
          // Marcar erro no canal
          try {
            await newTracking.incrementError(setupError.message);
          } catch (updateError) {
            console.error('❌ Erro ao atualizar status de erro:', updateError.message);
          }
        }
      });
      
    } catch (serviceError) {
      console.warn('⚠️ Erro ao iniciar configuração do canal:', serviceError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Canal adicionado ao sistema de tracking. Configuração e download do vídeo mais recente iniciados.',
      data: newTracking
    });

  } catch (error) {
    console.error('❌ Erro ao adicionar canal ao tracking:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route PUT /api/channel-tracking/:id
 * @desc Update tracking settings for a channel
 * @access Private
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const trackingId = req.params.id;
    const { quality, saveToLibrary, scheduledHour, isActive } = req.body;

    const tracking = await ChannelTracking.findOne({
      where: { 
        id: trackingId,
        userId // Ensure user owns this tracking
      }
    });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        error: 'Canal não encontrado ou você não tem permissão para editá-lo'
      });
    }

    // Update fields if provided
    if (quality !== undefined) tracking.quality = quality;
    if (saveToLibrary !== undefined) tracking.saveToLibrary = saveToLibrary;
    if (scheduledHour !== undefined) {
      if (scheduledHour < 0 || scheduledHour > 23) {
        return res.status(400).json({
          success: false,
          error: 'Hora agendada deve estar entre 0 e 23'
        });
      }
      tracking.scheduledHour = scheduledHour;
    }
    if (isActive !== undefined) {
      tracking.isActive = isActive;
      // Reset errors when reactivating
      if (isActive) {
        tracking.errorCount = 0;
        tracking.lastError = null;
      }
    }

    await tracking.save();

    res.json({
      success: true,
      message: 'Configurações do canal atualizadas com sucesso',
      data: tracking
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar tracking do canal:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route DELETE /api/channel-tracking/:id
 * @desc Remove a channel from tracking list
 * @access Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const trackingId = req.params.id;

    const tracking = await ChannelTracking.findOne({
      where: { 
        id: trackingId,
        userId // Ensure user owns this tracking
      }
    });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        error: 'Canal não encontrado ou você não tem permissão para removê-lo'
      });
    }

    const channelName = tracking.channelName;
    await tracking.destroy();

    console.log(`🗑️ Canal removido do tracking: ${channelName}`);

    res.json({
      success: true,
      message: `Canal "${channelName}" removido do sistema de tracking`
    });

  } catch (error) {
    console.error('❌ Erro ao remover canal do tracking:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /api/channel-tracking/:id/setup
 * @desc Setup channel manually (download latest video and configure)
 * @access Private
 */
router.post('/:id/setup', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const trackingId = req.params.id;

    const tracking = await ChannelTracking.findOne({
      where: { 
        id: trackingId,
        userId
      }
    });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        error: 'Canal não encontrado'
      });
    }

    // Executar configuração manual
    try {
      const channelTrackingService = require('../services/channelTrackingService');
      const setupResult = await channelTrackingService.setupNewChannel(trackingId);
      
      res.json({
        success: true,
        message: setupResult.message,
        data: {
          channelName: tracking.channelName,
          video: setupResult.video,
          setupTime: new Date()
        }
      });
    } catch (setupError) {
      res.status(400).json({
        success: false,
        error: `Erro na configuração: ${setupError.message}`
      });
    }

  } catch (error) {
    console.error('❌ Erro ao configurar canal:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /api/channel-tracking/:id/test
 * @desc Test channel tracking manually (check for new videos now)
 * @access Private
 */
router.post('/:id/test', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const trackingId = req.params.id;

    const tracking = await ChannelTracking.findOne({
      where: { 
        id: trackingId,
        userId
      }
    });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        error: 'Canal não encontrado'
      });
    }

    // Executar verificação manual usando o serviço
    try {
      await channelTrackingService.checkSpecificChannel(trackingId);
      
      res.json({
        success: true,
        message: `Verificação manual concluída para canal "${tracking.channelName}"`,
        data: {
          channelName: tracking.channelName,
          lastCheck: new Date()
        }
      });
    } catch (checkError) {
      res.status(400).json({
        success: false,
        error: `Erro na verificação: ${checkError.message}`
      });
    }

  } catch (error) {
    console.error('❌ Erro ao testar tracking do canal:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /api/channel-tracking/stats
 * @desc Get tracking statistics for the user
 * @access Private
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await ChannelTracking.findAll({
      where: { userId },
      attributes: [
        'isActive',
        'totalVideosFound',
        'totalVideosDownloaded',
        'errorCount'
      ]
    });

    const summary = stats.reduce((acc, tracking) => {
      acc.totalChannels++;
      if (tracking.isActive) acc.activeChannels++;
      if (tracking.errorCount > 0) acc.channelsWithErrors++;
      acc.totalVideosFound += tracking.totalVideosFound || 0;
      acc.totalVideosDownloaded += tracking.totalVideosDownloaded || 0;
      return acc;
    }, {
      totalChannels: 0,
      activeChannels: 0,
      channelsWithErrors: 0,
      totalVideosFound: 0,
      totalVideosDownloaded: 0
    });

    summary.successRate = summary.totalVideosFound > 0 ? 
      ((summary.totalVideosDownloaded / summary.totalVideosFound) * 100).toFixed(1) + '%' : '0%';

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('❌ Erro ao obter estatísticas de tracking:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /api/channel-tracking/job/status
 * @desc Get tracking job status and statistics
 * @access Private
 */
router.get('/job/status', authenticateToken, async (req, res) => {
  try {
    const jobStats = channelTrackingService.getJobStats();
    
    res.json({
      success: true,
      data: jobStats
    });

  } catch (error) {
    console.error('❌ Erro ao obter status do job:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /api/channel-tracking/job/run
 * @desc Manually trigger the tracking job
 * @access Private (Admin only)
 */
router.post('/job/run', authenticateToken, async (req, res) => {
  try {
    // Verificar se é admin (opcional - pode remover se quiser permitir para todos)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem executar o job manualmente'
      });
    }

    const jobSchedulerService = require('../services/jobSchedulerService');
    await jobSchedulerService.runManually();

    res.json({
      success: true,
      message: 'Job de tracking executado manualmente com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao executar job manual:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /api/channel-tracking/system/metrics
 * @desc Get system performance metrics
 * @access Private
 */
router.get('/system/metrics', authenticateToken, async (req, res) => {
  try {
    const loggingService = require('../services/loggingService');
    const jobSchedulerService = require('../services/jobSchedulerService');
    
    const metrics = {
      logging: loggingService.getMetrics(),
      scheduler: jobSchedulerService.getStats(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    };

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('❌ Erro ao obter métricas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /api/channel-tracking/system/toggle-pause
 * @desc Toggle system pause state
 * @access Private (Admin only)
 */
router.post('/system/toggle-pause', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem pausar/retomar o sistema'
      });
    }

    const jobSchedulerService = require('../services/jobSchedulerService');
    jobSchedulerService.togglePause();
    
    const stats = jobSchedulerService.getStats();

    res.json({
      success: true,
      message: `Sistema ${stats.isPaused ? 'pausado' : 'retomado'} com sucesso`,
      data: { isPaused: stats.isPaused }
    });

  } catch (error) {
    console.error('❌ Erro ao alterar estado do sistema:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;