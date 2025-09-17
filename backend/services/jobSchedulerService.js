const cron = require('node-cron');
const path = require('path');
const { ChannelTracking, User, Download } = require('../models');
const ytdlpService = require('./ytdlpService');
const cookieService = require('./cookieService');

/**
 * Serviço de agendamento de jobs robusto e escalável
 */
class JobSchedulerService {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
    this.stats = {
      lastRun: null,
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      channelsProcessed: 0,
      videosFound: 0,
      videosDownloaded: 0,
      errors: 0,
      averageRunTime: 0
    };
    this.maxConcurrentJobs = 5; // Máximo de canais processados simultaneamente
    this.retryAttempts = 3;
    this.retryDelay = 5000; // 5 segundos
  }

  /**
   * Inicia todos os jobs agendados
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️ Sistema de jobs já está rodando');
      return;
    }

    try {
      // Job principal: verificação de canais a cada hora
      this.scheduleChannelCheckJob();

      // Job de limpeza: executa diariamente às 3:00
    this.scheduleCleanupJob();
    
      // Job de manutenção: executa semanalmente aos domingos às 2:00
      this.scheduleMaintenanceJob();

      // Verificação inicial após 2 minutos
      setTimeout(() => {
        this.runChannelCheck().catch(error => {
          console.error('❌ Erro na verificação inicial:', error);
        });
      }, 2 * 60 * 1000);

      this.isRunning = true;
      console.log('✅ Sistema de jobs iniciado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao iniciar sistema de jobs:', error);
      throw error;
    }
  }

  /**
   * Para todos os jobs
   */
  async stop() {
    try {
      // Parar todos os jobs
    for (const [name, job] of this.jobs) {
        if (job && job.destroy) {
      job.destroy();
          console.log(`🛑 Job ${name} parado`);
        }
    }
    
    this.jobs.clear();
    this.isRunning = false;
      console.log('🛑 Sistema de jobs parado');
      
    } catch (error) {
      console.error('❌ Erro ao parar sistema de jobs:', error);
      throw error;
    }
  }

  /**
   * Agenda job de verificação de canais
   */
  scheduleChannelCheckJob() {
    const job = cron.schedule('*/15 * * * *', async () => {
      await this.runChannelCheck();
    }, {
      scheduled: true,
      timezone: "America/Sao_Paulo"
    });

    this.jobs.set('channelCheck', job);
    console.log('📅 Job de verificação de canais agendado (a cada 15 minutos)');
  }

  /**
   * Agenda job de limpeza
   */
  scheduleCleanupJob() {
    const job = cron.schedule('0 3 * * *', async () => {
      await this.runCleanupTasks();
    }, {
      scheduled: true,
      timezone: "America/Sao_Paulo"
    });

    this.jobs.set('cleanup', job);
    console.log('📅 Job de limpeza agendado (diariamente às 3:00)');
  }

  /**
   * Agenda job de manutenção
   */
  scheduleMaintenanceJob() {
    const job = cron.schedule('0 2 * * 0', async () => {
      await this.runMaintenanceTasks();
    }, {
      scheduled: true,
      timezone: "America/Sao_Paulo"
    });

    this.jobs.set('maintenance', job);
    console.log('📅 Job de manutenção agendado (domingos às 2:00)');
  }

  /**
   * Executa verificação de canais de forma escalável
   */
  async runChannelCheck() {
    if (this.isRunning && this.jobs.has('channelCheckRunning')) {
      console.log('⚠️ Verificação de canais já está em execução, pulando...');
      return;
    }

    const startTime = Date.now();
    this.jobs.set('channelCheckRunning', true);
    
    console.log('🔍 Iniciando verificação escalável de canais...');
    
    // Reset stats para esta execução
    const runStats = {
      channelsProcessed: 0,
      videosFound: 0,
      videosDownloaded: 0,
      errors: 0,
      startTime
    };

    try {
      // Buscar todos os canais ativos
      const activeChannels = await ChannelTracking.findAll({
        where: { isActive: true },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email']
          }
        ],
        order: [
          ['lastCheck', 'ASC'], // Priorizar canais não verificados há mais tempo
          ['errorCount', 'ASC'], // Priorizar canais com menos erros
          ['createdAt', 'ASC']
        ]
      });

      console.log(`📊 Encontrados ${activeChannels.length} canais ativos para verificar`);

      if (activeChannels.length === 0) {
        console.log('ℹ️ Nenhum canal ativo encontrado');
        return;
      }

      // Processar canais em lotes para evitar sobrecarga
      const batchSize = this.maxConcurrentJobs;
      const batches = this.chunkArray(activeChannels, batchSize);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`📦 Processando lote ${i + 1}/${batches.length} (${batch.length} canais)`);

        // Processar lote em paralelo
        const batchPromises = batch.map(channel => 
          this.processChannelWithRetry(channel, runStats)
        );

        await Promise.allSettled(batchPromises);

        // Pausa entre lotes para não sobrecarregar o sistema
        if (i < batches.length - 1) {
          console.log('⏳ Pausando 10 segundos entre lotes...');
          await this.sleep(10000);
        }
      }

      // Atualizar estatísticas globais
      this.updateGlobalStats(runStats);

      const duration = (Date.now() - startTime) / 1000;
      console.log(`✅ Verificação concluída em ${duration}s`);
      console.log(`📊 Estatísticas: ${runStats.channelsProcessed} canais, ${runStats.videosFound} vídeos encontrados, ${runStats.videosDownloaded} baixados, ${runStats.errors} erros`);

    } catch (error) {
      console.error('❌ Erro geral na verificação de canais:', error);
      this.stats.failedRuns++;
    } finally {
      this.jobs.delete('channelCheckRunning');
    }
  }

  /**
   * Processa um canal com retry automático
   */
  async processChannelWithRetry(channel, runStats) {
    let attempts = 0;
    let lastError = null;

    while (attempts < this.retryAttempts) {
      try {
        await this.processChannel(channel, runStats);
        
        // Sucesso - resetar erros se havia algum
        if (channel.errorCount > 0) {
          await channel.resetErrors();
        }
        
        return;

      } catch (error) {
        attempts++;
        lastError = error;
        
        console.error(`❌ Erro na tentativa ${attempts}/${this.retryAttempts} para canal ${channel.channelName}:`, error.message);
        
        if (attempts < this.retryAttempts) {
          console.log(`⏳ Aguardando ${this.retryDelay / 1000}s antes da próxima tentativa...`);
          await this.sleep(this.retryDelay);
        }
      }
    }

    // Todas as tentativas falharam
    console.error(`❌ Todas as tentativas falharam para canal ${channel.channelName}`);
    await channel.incrementError(lastError.message);
    runStats.errors++;
  }

  /**
   * Processa um canal individual
   */
  async processChannel(channel, runStats) {
    console.log(`🔍 Verificando canal: ${channel.channelName}`);

    try {
      // Obter vídeos recentes do canal
      const recentVideos = await ytdlpService.getChannelVideos(channel.channelUrl, 3);
      
      if (!recentVideos || recentVideos.length === 0) {
        console.log(`ℹ️ Nenhum vídeo encontrado para ${channel.channelName}`);
        await channel.updateLastCheck();
        runStats.channelsProcessed++;
        return;
      }

      // Verificar cada vídeo (começando pelo mais recente)
      let newVideosFound = 0;
      
      for (const video of recentVideos) {
        // Parar se já processamos o último vídeo conhecido
        if (channel.lastVideoId === video.id) {
          break;
        }

        // Verificar se já foi baixado
        const existingDownload = await Download.findOne({
          where: { youtubeId: video.id }
        });

        if (existingDownload) {
          console.log(`ℹ️ Vídeo ${video.id} já foi baixado anteriormente`);
          continue;
        }

        console.log(`🆕 Novo vídeo encontrado: ${video.title}`);
        
        // Registrar que encontrou um vídeo
        await channel.recordVideoFound(video.id);
        runStats.videosFound++;
        newVideosFound++;

        // Baixar o vídeo
        try {
          await this.downloadChannelVideo(channel, video);
          runStats.videosDownloaded++;
        } catch (downloadError) {
          console.error(`❌ Erro ao baixar vídeo ${video.title}:`, downloadError.message);
          // Não falhar o canal inteiro por um erro de download
        }

        // Pausa pequena entre downloads
        await this.sleep(2000);
      }

      // Atualizar último vídeo conhecido se encontrou vídeos novos
      if (newVideosFound > 0 && recentVideos.length > 0) {
        await channel.recordVideoFound(recentVideos[0].id);
      }

      await channel.updateLastCheck();
      runStats.channelsProcessed++;

      console.log(`✅ Canal ${channel.channelName} processado: ${newVideosFound} novos vídeos`);

    } catch (error) {
      console.error(`❌ Erro ao processar canal ${channel.channelName}:`, error);
      throw error;
    }
  }

  /**
   * Baixa um vídeo específico de um canal trackado
   */
  async downloadChannelVideo(channel, videoInfo) {
    try {
      console.log(`📥 Baixando vídeo: ${videoInfo.title}`);

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

      console.log(`✅ Vídeo baixado com sucesso: ${videoInfo.title}`);
      
      return download;

    } catch (error) {
      console.error(`❌ Erro ao baixar vídeo ${videoInfo.title}:`, error);
      throw error;
    }
  }

  /**
   * Executa tarefas de limpeza
   */
  async runCleanupTasks() {
    console.log('🧹 Iniciando tarefas de limpeza...');

    try {
      // Limpar cookies expirados
      const expiredCookies = await cookieService.cleanupExpiredCookies();
      console.log(`🍪 ${expiredCookies} cookies expirados removidos`);

      // Limpar arquivos temporários de cookies
      const tempFiles = await cookieService.cleanupTempCookieFiles();
      console.log(`📁 ${tempFiles} arquivos temporários removidos`);

      // Limpar arquivos temporários do YT-DLP
      await ytdlpService.cleanupTempFiles(7); // Arquivos mais antigos que 7 dias
      
      console.log('✅ Tarefas de limpeza concluídas');

    } catch (error) {
      console.error('❌ Erro nas tarefas de limpeza:', error);
    }
  }

  /**
   * Executa tarefas de manutenção
   */
  async runMaintenanceTasks() {
    console.log('🔧 Iniciando tarefas de manutenção...');

    try {
      // Validar cookies ativos
      const activeCookies = await cookieService.getUserCookies();
      for (const cookie of activeCookies.filter(c => c.status === 'active')) {
        try {
          await cookieService.validateCookies(cookie.id);
        } catch (validationError) {
          console.warn(`⚠️ Cookie ${cookie.name} falhou na validação:`, validationError.message);
        }
      }

      // Reativar canais com poucos erros
      const channelsWithErrors = await ChannelTracking.findAll({
        where: {
          isActive: false,
          errorCount: { [require('sequelize').Op.lt]: 10 }
        }
      });

      for (const channel of channelsWithErrors) {
        channel.isActive = true;
        channel.errorCount = 0;
        channel.lastError = null;
        await channel.save();
        console.log(`🔄 Canal ${channel.channelName} reativado`);
      }

      console.log('✅ Tarefas de manutenção concluídas');

    } catch (error) {
      console.error('❌ Erro nas tarefas de manutenção:', error);
    }
  }

  /**
   * Obtém estatísticas dos jobs
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      activeJobs: Array.from(this.jobs.keys()),
      maxConcurrentJobs: this.maxConcurrentJobs
    };
  }

  /**
   * Atualiza estatísticas globais
   */
  updateGlobalStats(runStats) {
    this.stats.lastRun = new Date();
    this.stats.totalRuns++;
    
    if (runStats.errors === 0) {
      this.stats.successfulRuns++;
    } else {
      this.stats.failedRuns++;
    }

    this.stats.channelsProcessed += runStats.channelsProcessed;
    this.stats.videosFound += runStats.videosFound;
    this.stats.videosDownloaded += runStats.videosDownloaded;
    this.stats.errors += runStats.errors;

    // Calcular tempo médio de execução
    const runTime = (Date.now() - runStats.startTime) / 1000;
    this.stats.averageRunTime = ((this.stats.averageRunTime * (this.stats.totalRuns - 1)) + runTime) / this.stats.totalRuns;
  }

  /**
   * Divide array em chunks
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Utilitário para pausar execução
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Executa verificação manual de um canal específico
   */
  async checkSpecificChannel(channelId) {
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

    if (!channel.isActive) {
      throw new Error('Canal não está ativo');
    }

    const runStats = {
      channelsProcessed: 0,
      videosFound: 0,
      videosDownloaded: 0,
      errors: 0,
      startTime: Date.now()
    };

    await this.processChannel(channel, runStats);
    
    return {
      success: true,
      stats: runStats,
      message: `Canal ${channel.channelName} verificado com sucesso`
    };
  }
}

// Exportar instância singleton
const jobSchedulerService = new JobSchedulerService();
module.exports = jobSchedulerService;
