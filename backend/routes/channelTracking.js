const express = require('express');
const { ChannelTracking, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const ytdlpService = require('../services/ytdlpService');

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
    const channelName = channelInfo.title || channelInfo.channel || channelInfo.uploader || 'Canal Desconhecido';

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

        return res.json({
          success: true,
          message: 'Canal reativado no sistema de tracking',
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

    res.status(201).json({
      success: true,
      message: 'Canal adicionado ao sistema de tracking com sucesso',
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

    // This would trigger the same logic as the scheduled job
    // For now, just update the last check time
    await tracking.updateLastCheck();

    res.json({
      success: true,
      message: `Teste de tracking iniciado para canal "${tracking.channelName}"`,
      data: {
        channelName: tracking.channelName,
        lastCheck: tracking.lastCheck
      }
    });

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

module.exports = router;