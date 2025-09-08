const path = require('path');
const { ChannelTracking, Download, User } = require('../models');
const ytdlpService = require('./ytdlpService');
const jobSchedulerService = require('./jobSchedulerService');
const loggingService = require('./loggingService');

/**
 * Serviço para gerenciar tracking automático de canais do YouTube
 * Agora usa o jobSchedulerService para operações escaláveis
 */
class ChannelTrackingService {
  constructor() {
    // Delegamos a funcionalidade principal para o jobSchedulerService
    this.jobScheduler = jobSchedulerService;
  }

  /**
   * Inicia o sistema de jobs robusto
   */
  async startScheduledJob() {
    try {
      await this.jobScheduler.start();
      loggingService.success('CHANNEL_TRACKING', 'Sistema de jobs iniciado com sucesso');
    } catch (error) {
      loggingService.error('CHANNEL_TRACKING', 'Erro ao iniciar sistema de jobs', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Para o sistema de jobs
   */
  async stopScheduledJob() {
    try {
      await this.jobScheduler.stop();
      loggingService.success('CHANNEL_TRACKING', 'Sistema de jobs parado com sucesso');
    } catch (error) {
      loggingService.error('CHANNEL_TRACKING', 'Erro ao parar sistema de jobs', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Executa verificação manual de todos os canais
   */
  async runChannelCheck() {
    return await this.jobScheduler.runChannelCheck();
  }

  /**
   * Obtém estatísticas do sistema de jobs
   */
  getJobStats() {
    return this.jobScheduler.getStats();
  }

  /**
   * Executa verificação manual de um canal específico
   */
  async checkSpecificChannel(channelId) {
    return await this.jobScheduler.checkSpecificChannel(channelId);
  }

  /**
   * Configura um novo canal: baixa o vídeo mais recente e inicia o monitoramento
   */
  async setupNewChannel(channelId) {
    const startTime = Date.now();
    
    try {
      loggingService.info('CHANNEL_TRACKING', `Configurando novo canal ID: ${channelId}`);
      
      // Buscar o canal no banco
      const channel = await ChannelTracking.findByPk(channelId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username']
          }
        ]
      });

      if (!channel) {
        throw new Error('Canal não encontrado');
      }

      loggingService.channelTracking('SETUP_START', channel.channelName, {
        channelId: channel.id,
        channelUrl: channel.channelUrl,
        userId: channel.userId
      });

      // Buscar vídeos recentes do canal
      const recentVideos = await ytdlpService.getChannelVideos(channel.channelUrl, 1);
      
      if (!recentVideos || recentVideos.length === 0) {
        loggingService.warn('CHANNEL_TRACKING', `Nenhum vídeo encontrado para ${channel.channelName}`);
        await channel.updateLastCheck();
        return { 
          success: true, 
          message: 'Canal configurado, mas nenhum vídeo encontrado',
          channel: channel
        };
      }

      // Pegar o vídeo mais recente
      const latestVideo = recentVideos[0];
      loggingService.info('CHANNEL_TRACKING', `Vídeo mais recente: ${latestVideo.title}`, {
        videoId: latestVideo.id,
        videoTitle: latestVideo.title,
        channelName: channel.channelName
      });

      // Verificar se já foi baixado
      const existingDownload = await Download.findOne({
        where: { youtubeId: latestVideo.id }
      });

      if (existingDownload) {
        loggingService.info('CHANNEL_TRACKING', `Vídeo ${latestVideo.id} já foi baixado anteriormente`);
        // Apenas registrar o vídeo como conhecido e atualizar última verificação
        await channel.recordVideoFound(latestVideo.id);
        await channel.updateLastCheck();
        
        const duration = Date.now() - startTime;
        loggingService.performance('CHANNEL_SETUP', duration, {
          channelName: channel.channelName,
          result: 'video_already_downloaded'
        });
        
        return { 
          success: true, 
          message: 'Canal configurado. Vídeo mais recente já estava baixado.',
          video: existingDownload,
          channel: channel
        };
      }

      // Baixar o vídeo mais recente
      loggingService.download('INITIAL_DOWNLOAD_START', latestVideo.title, {
        videoId: latestVideo.id,
        channelName: channel.channelName,
        quality: channel.quality
      });

      const download = await this.downloadChannelVideo(channel, latestVideo);
      
      // Registrar que encontrou o vídeo
      await channel.recordVideoFound(latestVideo.id);
      await channel.updateLastCheck();
      
      const duration = Date.now() - startTime;
      loggingService.performance('CHANNEL_SETUP', duration, {
        channelName: channel.channelName,
        result: 'success_with_download'
      });
      
      loggingService.channelTracking('SETUP_COMPLETE', channel.channelName, {
        videoDownloaded: latestVideo.title,
        downloadId: download.id,
        duration: `${duration}ms`
      });
      
      return {
        success: true,
        message: `Canal configurado e vídeo "${latestVideo.title}" baixado com sucesso`,
        video: download,
        channel: channel
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      loggingService.error('CHANNEL_TRACKING', `Erro ao configurar canal ${channelId}`, {
        error: error.message,
        stack: error.stack,
        duration: `${duration}ms`
      });
      throw error;
    }
  }

  /**
   * Baixa um vídeo específico de um canal trackado
   */
  async downloadChannelVideo(channel, videoInfo) {
    const startTime = Date.now();
    
    try {
      loggingService.download('CHANNEL_VIDEO_START', videoInfo.title, {
        videoId: videoInfo.id,
        channelName: channel.channelName,
        quality: channel.quality
      });

      const videoUrl = `https://www.youtube.com/watch?v=${videoInfo.id}`;
      
      // Usar o serviço YT-DLP para baixar
      const downloadResult = await ytdlpService.downloadVideo(videoUrl, {
        quality: channel.quality || 'best'
      });

      console.log(`📊 Resultado do download:`, {
        filePath: downloadResult.filePath ? 'Presente' : 'Ausente',
        thumbnailPath: downloadResult.thumbnailPath ? `Presente: ${path.basename(downloadResult.thumbnailPath)}` : 'Ausente',
        infoPath: downloadResult.infoPath ? 'Presente' : 'Ausente',
        fileSize: downloadResult.fileSize || 'N/A'
      });

      // Criar registro no banco de dados
      const downloadData = {
        youtubeId: videoInfo.id,
        downloadId: `auto_${videoInfo.id}_${Date.now()}`,
        title: videoInfo.title || 'Título não disponível',
        description: videoInfo.description || null,
        duration: videoInfo.duration || null,
        channelName: downloadResult.metadata?.channelName || channel.channelName,
        channelId: downloadResult.metadata?.channelId || channel.youtubeChannelId,
        originalUrl: videoUrl,
        quality: channel.quality || 'best',
        format: 'mp4',
        resolution: downloadResult.metadata?.resolution || null,
        fileSize: downloadResult.fileSize || null,
        videoPath: downloadResult.filePath,
        thumbnailPath: downloadResult.thumbnailPath || null,
        infoPath: downloadResult.infoPath || null,
        status: 'completed',
        progress: 100,
        category: 'news', // Vídeos de canais rastreados são categorizados como 'news'
        source: 'auto_channel', // Fonte é rastreamento automático de canal
        metadata: {
          ...videoInfo,
          ...downloadResult.metadata,
          autoDownload: true,
          channelTracking: true,
          downloadedAt: new Date()
        },
        downloadedAt: new Date(),
        userId: channel.userId
      };

      const download = await Download.create(downloadData);
      
      // Registrar download bem-sucedido
      await channel.recordVideoDownloaded();

      const duration = Date.now() - startTime;
      loggingService.performance('CHANNEL_VIDEO_DOWNLOAD', duration, {
        videoId: videoInfo.id,
        channelName: channel.channelName,
        fileSize: downloadResult.fileSize
      });

      loggingService.download('CHANNEL_VIDEO_COMPLETE', videoInfo.title, {
        downloadId: download.id,
        filePath: downloadResult.filePath,
        duration: `${duration}ms`
      });
      
      return download;

    } catch (error) {
      const duration = Date.now() - startTime;
      loggingService.error('DOWNLOAD', `Erro ao baixar vídeo ${videoInfo.title}`, {
        error: error.message,
        stack: error.stack,
        videoId: videoInfo.id,
        channelName: channel.channelName,
        duration: `${duration}ms`
      });
      throw error;
    }
  }

  /**
   * Obtém estatísticas detalhadas do sistema de tracking
   */
  async getDetailedStats() {
    try {
      const jobStats = this.getJobStats();
      
      // Estatísticas do banco de dados
      const totalChannels = await ChannelTracking.count();
      const activeChannels = await ChannelTracking.count({ where: { isActive: true } });
      const channelsWithErrors = await ChannelTracking.count({ 
        where: { errorCount: { [require('sequelize').Op.gt]: 0 } }
      });
      
      const totalDownloads = await Download.count();
      const autoDownloads = await Download.count({
        where: {
          metadata: {
            [require('sequelize').Op.like]: '%"autoDownload":true%'
          }
        }
      });

      return {
        ...jobStats,
        database: {
          totalChannels,
          activeChannels,
          inactiveChannels: totalChannels - activeChannels,
          channelsWithErrors,
          totalDownloads,
          autoDownloads,
          manualDownloads: totalDownloads - autoDownloads
        }
      };

    } catch (error) {
      loggingService.error('CHANNEL_TRACKING', 'Erro ao obter estatísticas detalhadas', {
        error: error.message
      });
      return this.getJobStats();
    }
  }

  /**
   * Reativa canais com poucos erros
   */
  async reactivateChannelsWithFewErrors(maxErrors = 5) {
    try {
      const channelsToReactivate = await ChannelTracking.findAll({
        where: {
          isActive: false,
          errorCount: { [require('sequelize').Op.lte]: maxErrors }
        }
      });

      let reactivatedCount = 0;
      
      for (const channel of channelsToReactivate) {
        channel.isActive = true;
        channel.errorCount = 0;
        channel.lastError = null;
        await channel.save();
        
        loggingService.channelTracking('REACTIVATED', channel.channelName, {
          previousErrorCount: channel.errorCount
        });
        
        reactivatedCount++;
      }

      loggingService.success('CHANNEL_TRACKING', `${reactivatedCount} canais reativados`);
      
      return {
        success: true,
        reactivatedCount,
        channels: channelsToReactivate.map(c => ({
          id: c.id,
          name: c.channelName,
          previousErrors: c.errorCount
        }))
      };

    } catch (error) {
      loggingService.error('CHANNEL_TRACKING', 'Erro ao reativar canais', {
        error: error.message
      });
      throw error;
    }
  }
}

// Exportar instância singleton
const channelTrackingService = new ChannelTrackingService();
module.exports = channelTrackingService;
