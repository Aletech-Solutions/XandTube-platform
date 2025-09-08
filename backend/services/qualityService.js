const loggingService = require('./loggingService');

/**
 * Serviço para seleção inteligente de qualidade de vídeo
 */
class QualityService {
  constructor() {
    // Prioridades de qualidade (maior número = maior prioridade)
    this.qualityPriorities = {
      // Resoluções 4K+
      '2160p': 1000,
      '2160p60': 1100,
      '4320p': 1200,
      '4320p60': 1300,
      
      // Resoluções 1440p
      '1440p': 900,
      '1440p60': 950,
      
      // Resoluções 1080p
      '1080p': 800,
      '1080p60': 850,
      
      // Resoluções 720p
      '720p': 700,
      '720p60': 750,
      
      // Resoluções menores
      '480p': 600,
      '360p': 500,
      '240p': 400,
      '144p': 300
    };

    // Formatos preferidos (maior número = maior prioridade)
    this.formatPriorities = {
      'mp4': 100,
      'webm': 90,
      'mkv': 80,
      'flv': 70,
      '3gp': 60
    };

    // Codecs preferidos
    this.codecPriorities = {
      'h264': 100,
      'h265': 110,
      'vp9': 95,
      'vp8': 85,
      'av01': 105
    };
  }

  /**
   * Seleciona a melhor qualidade disponível baseada nos formatos disponíveis
   */
  selectBestQuality(formats, preferredQuality = 'best') {
    if (!formats || formats.length === 0) {
      loggingService.warn('QUALITY_SERVICE', 'Nenhum formato disponível para seleção');
      return null;
    }

    loggingService.debug('QUALITY_SERVICE', `Selecionando qualidade de ${formats.length} formatos disponíveis`, {
      preferredQuality,
      availableFormats: formats.length
    });

    // Se preferência específica foi definida, tentar encontrar
    if (preferredQuality !== 'best' && preferredQuality !== 'worst') {
      const specificFormat = this.findSpecificQuality(formats, preferredQuality);
      if (specificFormat) {
        loggingService.success('QUALITY_SERVICE', `Qualidade específica encontrada: ${preferredQuality}`, {
          format: specificFormat.format_id,
          resolution: specificFormat.resolution
        });
        return specificFormat;
      }
    }

    // Filtrar apenas formatos de vídeo com áudio ou formatos combinados
    const videoFormats = formats.filter(format => {
      return (format.vcodec && format.vcodec !== 'none') && 
             (format.acodec && format.acodec !== 'none' || format.format_note?.includes('video+audio'));
    });

    if (videoFormats.length === 0) {
      loggingService.warn('QUALITY_SERVICE', 'Nenhum formato de vídeo+áudio encontrado, usando formatos separados');
      return this.selectBestSeparateFormats(formats);
    }

    // Calcular score para cada formato
    const scoredFormats = videoFormats.map(format => ({
      ...format,
      score: this.calculateQualityScore(format)
    }));

    // Ordenar por score (maior primeiro)
    scoredFormats.sort((a, b) => b.score - a.score);

    const bestFormat = scoredFormats[0];
    
    loggingService.success('QUALITY_SERVICE', 'Melhor qualidade selecionada', {
      format: bestFormat.format_id,
      resolution: bestFormat.resolution || bestFormat.height + 'p',
      filesize: bestFormat.filesize,
      score: bestFormat.score
    });

    return bestFormat;
  }

  /**
   * Calcula score de qualidade para um formato
   */
  calculateQualityScore(format) {
    let score = 0;

    // Score baseado na resolução
    const resolution = this.extractResolution(format);
    score += this.qualityPriorities[resolution] || 0;

    // Score baseado no formato
    const ext = format.ext || 'unknown';
    score += this.formatPriorities[ext] || 0;

    // Score baseado no codec de vídeo
    const vcodec = format.vcodec || '';
    for (const [codec, priority] of Object.entries(this.codecPriorities)) {
      if (vcodec.includes(codec)) {
        score += priority;
        break;
      }
    }

    // Bonus para formatos com áudio integrado
    if (format.acodec && format.acodec !== 'none') {
      score += 50;
    }

    // Penalty para formatos muito grandes (>2GB)
    if (format.filesize && format.filesize > 2 * 1024 * 1024 * 1024) {
      score -= 100;
    }

    // Bonus para bitrate alto (se disponível)
    if (format.tbr) {
      score += Math.min(format.tbr / 10, 100); // Max 100 pontos de bonus
    }

    return score;
  }

  /**
   * Extrai resolução do formato
   */
  extractResolution(format) {
    if (format.resolution) {
      return format.resolution;
    }
    
    if (format.height) {
      const fps = format.fps || 30;
      const resolution = `${format.height}p`;
      return fps > 50 ? `${resolution}60` : resolution;
    }

    return 'unknown';
  }

  /**
   * Encontra qualidade específica solicitada
   */
  findSpecificQuality(formats, targetQuality) {
    // Tentar match exato primeiro
    let match = formats.find(format => {
      const resolution = this.extractResolution(format);
      return resolution === targetQuality;
    });

    if (match) return match;

    // Tentar match por altura
    const targetHeight = parseInt(targetQuality.replace(/[^\d]/g, ''));
    if (targetHeight) {
      match = formats.find(format => format.height === targetHeight);
      if (match) return match;
    }

    return null;
  }

  /**
   * Seleciona melhor combinação de formatos separados (vídeo + áudio)
   */
  selectBestSeparateFormats(formats) {
    const videoFormats = formats.filter(f => f.vcodec && f.vcodec !== 'none' && (!f.acodec || f.acodec === 'none'));
    const audioFormats = formats.filter(f => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'));

    if (videoFormats.length === 0 || audioFormats.length === 0) {
      loggingService.warn('QUALITY_SERVICE', 'Formatos separados insuficientes', {
        videoFormats: videoFormats.length,
        audioFormats: audioFormats.length
      });
      return formats[0]; // Fallback para primeiro formato disponível
    }

    const bestVideo = videoFormats.reduce((best, current) => 
      this.calculateQualityScore(current) > this.calculateQualityScore(best) ? current : best
    );

    const bestAudio = audioFormats.reduce((best, current) => 
      (current.abr || 0) > (best.abr || 0) ? current : best
    );

    loggingService.info('QUALITY_SERVICE', 'Selecionados formatos separados', {
      video: bestVideo.format_id,
      audio: bestAudio.format_id
    });

    return {
      ...bestVideo,
      audioFormat: bestAudio,
      requiresMerge: true
    };
  }

  /**
   * Gera comando YT-DLP otimizado para qualidade
   */
  generateQualityCommand(selectedFormat, options = {}) {
    const commands = [];

    if (selectedFormat.requiresMerge) {
      // Formatos separados que precisam ser mesclados
      commands.push(`-f "${selectedFormat.format_id}+${selectedFormat.audioFormat.format_id}"`);
    } else {
      // Formato combinado
      commands.push(`-f "${selectedFormat.format_id}"`);
    }

    // Opções de qualidade adiccionais
    if (options.preferMp4) {
      commands.push('--merge-output-format mp4');
    }

    if (options.embedSubs) {
      commands.push('--embed-subs');
    }

    if (options.embedThumbnail) {
      commands.push('--embed-thumbnail');
    }

    return commands.join(' ');
  }

  /**
   * Valida se um formato é adequado para download
   */
  validateFormat(format) {
    const issues = [];

    if (!format.url) {
      issues.push('URL não disponível');
    }

    if (format.filesize && format.filesize > 5 * 1024 * 1024 * 1024) { // >5GB
      issues.push('Arquivo muito grande (>5GB)');
    }

    if (format.protocol && !['https', 'http'].includes(format.protocol)) {
      issues.push(`Protocolo não suportado: ${format.protocol}`);
    }

    if (issues.length > 0) {
      loggingService.warn('QUALITY_SERVICE', 'Formato com problemas detectados', {
        format: format.format_id,
        issues
      });
      return false;
    }

    return true;
  }
}

module.exports = new QualityService();
