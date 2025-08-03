const fs = require('fs-extra');
const path = require('path');

/**
 * Serviço para ler downloads diretamente da pasta (sem banco de dados)
 */
class DirectDownloadService {
  constructor() {
    this.downloadsPath = path.join(__dirname, '../../videos/downloads');
    this.cacheFilePath = path.join(__dirname, '../../videos/downloads-cache.json');
    this.supportedVideoFormats = ['.mp4', '.webm', '.mkv', '.avi', '.mov'];
    this.supportedImageFormats = ['.jpg', '.jpeg', '.png', '.webp'];
  }

  /**
   * Lista todos os downloads disponíveis
   */
  async listDownloads(userId = null, page = 1, limit = 10) {
    try {
      if (!await fs.pathExists(this.downloadsPath)) {
        return {
          downloads: [],
          total: 0,
          page,
          totalPages: 0
        };
      }

      // Tentar usar cache primeiro
      const downloads = await this.getCachedDownloads();
      
      // Filtrar por usuário se necessário
      const filteredDownloads = downloads.filter(download => 
        !userId || download.userId === userId
      );

      // Ordenar por data de download (mais recente primeiro)
      filteredDownloads.sort((a, b) => new Date(b.downloadedAt) - new Date(a.downloadedAt));

      // Paginação
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedDownloads = filteredDownloads.slice(startIndex, endIndex);

      return {
        downloads: paginatedDownloads,
        total: filteredDownloads.length,
        page: parseInt(page),
        totalPages: Math.ceil(filteredDownloads.length / limit)
      };

    } catch (error) {
      console.error('❌ Erro ao listar downloads:', error);
      throw error;
    }
  }

  /**
   * Obter um download específico pelo ID
   */
  async getDownload(downloadId) {
    try {
      // Tentar buscar no cache primeiro
      const downloads = await this.getCachedDownloads();
      const cachedDownload = downloads.find(download => download.id === downloadId);
      
      if (cachedDownload) {
        return cachedDownload;
      }
      
      // Se não encontrou no cache, buscar diretamente no arquivo
      const files = await fs.readdir(this.downloadsPath);
      const infoFile = files.find(file => 
        file.startsWith(downloadId) && file.endsWith('.info.json')
      );

      if (!infoFile) {
        return null;
      }

      return await this.processDownloadFile(infoFile);
    } catch (error) {
      console.error('❌ Erro ao buscar download:', error);
      throw error;
    }
  }

  /**
   * Processa um arquivo .info.json e retorna dados estruturados
   */
  async processDownloadFile(infoFileName) {
    const infoPath = path.join(this.downloadsPath, infoFileName);
    const baseName = infoFileName.replace('.info.json', '');
    
    // Verificar se o arquivo existe antes de tentar lê-lo
    if (!await fs.pathExists(infoPath)) {
      throw new Error(`Arquivo de informações não encontrado para ${baseName}`);
    }
    
    // Lê o arquivo JSON
    const infoData = await fs.readJson(infoPath);
    
    // Encontra arquivos relacionados
    const files = await fs.readdir(this.downloadsPath);
    const videoFile = files.find(file => 
      file.startsWith(baseName) && 
      this.supportedVideoFormats.some(ext => file.endsWith(ext))
    );
    const thumbnailFile = files.find(file => 
      file.startsWith(baseName) && 
      this.supportedImageFormats.some(ext => file.endsWith(ext))
    );

    if (!videoFile) {
      throw new Error(`Arquivo de vídeo não encontrado para ${baseName}`);
    }

    const videoPath = path.join(this.downloadsPath, videoFile);
    const thumbnailPath = thumbnailFile ? path.join(this.downloadsPath, thumbnailFile) : null;

    // Obter informações do arquivo
    const videoStats = await fs.stat(videoPath);
    const downloadedAt = videoStats.birthtime || videoStats.mtime;

    // Extrai informações do yt-dlp
    const download = {
      id: baseName,
      youtubeId: infoData.id,
      title: infoData.title || 'Título não disponível',
      description: infoData.description || '',
      duration: this.formatDuration(infoData.duration),
      durationSeconds: infoData.duration || 0,
      channelName: infoData.uploader || infoData.channel || 'Canal desconhecido',
      channelId: infoData.uploader_id || infoData.channel_id,
      uploadDate: infoData.upload_date,
      viewCount: infoData.view_count || 0,
      likeCount: infoData.like_count || 0,
      
      // Informações do arquivo
      fileSize: videoStats.size,
      fileSizeFormatted: this.formatBytes(videoStats.size),
      format: infoData.ext || path.extname(videoFile).replace('.', ''),
      resolution: infoData.resolution || this.extractResolution(infoData),
      quality: infoData.format_note || 'N/A',
      
      // Caminhos dos arquivos
      videoPath: videoPath,
      thumbnailPath: thumbnailPath,
      infoPath: infoPath,
      
      // URLs para API
      videoUrl: `/api/direct-downloads/${baseName}/stream`,
      thumbnailUrl: thumbnailPath ? `/api/direct-downloads/${baseName}/thumbnail` : null,
      
      // Metadados completos
      originalUrl: infoData.webpage_url || infoData.original_url,
      metadata: infoData,
      
      // Data do download
      downloadedAt: downloadedAt.toISOString(),
      
      // Simula um userId (pode ser extraído do nome do arquivo se necessário)
      userId: this.extractUserIdFromFilename(baseName) || 'unknown'
    };

    return download;
  }

  /**
   * Obter estatísticas dos downloads
   */
  async getStats(userId = null) {
    try {
      const downloads = await this.getCachedDownloads();
      
      // Filtrar por usuário se necessário
      const userDownloads = downloads.filter(download => 
        !userId || download.userId === userId
      );
      
      const totalSize = userDownloads.reduce((sum, download) => sum + download.fileSize, 0);
      const totalDuration = userDownloads.reduce((sum, download) => sum + download.durationSeconds, 0);
      
      return {
        totalDownloads: userDownloads.length,
        totalSize: totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
        totalDuration: totalDuration,
        totalDurationFormatted: this.formatDuration(totalDuration),
        averageFileSize: userDownloads.length > 0 ? totalSize / userDownloads.length : 0,
        formats: this.getFormatStats(userDownloads),
        channels: this.getChannelStats(userDownloads)
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  /**
   * Deletar arquivos de download
   */
  async deleteDownloadFiles(downloadId) {
    try {
      const files = await fs.readdir(this.downloadsPath);
      const relatedFiles = files.filter(file => file.startsWith(downloadId));
      
      let deletedCount = 0;
      for (const file of relatedFiles) {
        const filePath = path.join(this.downloadsPath, file);
        await fs.remove(filePath);
        deletedCount++;
      }

      // Invalidar cache após deletar arquivos
      await this.clearCache();

      return { 
        success: true, 
        deletedFiles: deletedCount,
        files: relatedFiles 
      };
    } catch (error) {
      console.error('❌ Erro ao deletar arquivos:', error);
      throw error;
    }
  }

  /**
   * Buscar downloads por termo
   */
  async searchDownloads(query, userId = null, page = 1, limit = 10) {
    try {
      const downloads = await this.getCachedDownloads();
      
      // Filtrar por usuário se necessário
      const userDownloads = downloads.filter(download => 
        !userId || download.userId === userId
      );
      
      const searchTerm = query.toLowerCase();
      const filtered = userDownloads.filter(download => 
        download.title.toLowerCase().includes(searchTerm) ||
        download.channelName.toLowerCase().includes(searchTerm) ||
        download.description.toLowerCase().includes(searchTerm)
      );

      // Paginação
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = filtered.slice(startIndex, endIndex);

      return {
        downloads: paginatedResults,
        total: filtered.length,
        page: parseInt(page),
        totalPages: Math.ceil(filtered.length / limit),
        query: query
      };
    } catch (error) {
      console.error('❌ Erro ao buscar downloads:', error);
      throw error;
    }
  }

  /**
   * Obtém downloads do cache ou reconstrói se necessário
   */
  async getCachedDownloads() {
    try {
      const cacheValid = await this.isCacheValid();
      
      if (cacheValid && await fs.pathExists(this.cacheFilePath)) {
        console.log('📦 Usando cache de downloads');
        const cacheData = await fs.readJson(this.cacheFilePath);
        return cacheData.downloads || [];
      }
      
      console.log('🔄 Cache inválido ou inexistente, reconstruindo...');
      return await this.buildCache();
      
    } catch (error) {
      console.warn('⚠️ Erro ao ler cache, reconstruindo:', error.message);
      return await this.buildCache();
    }
  }

  /**
   * Verifica se o cache está válido
   */
  async isCacheValid() {
    try {
      if (!await fs.pathExists(this.cacheFilePath)) {
        return false;
      }
      
      const cacheStats = await fs.stat(this.cacheFilePath);
      const downloadsStats = await fs.stat(this.downloadsPath);
      
      // Cache é válido se for mais recente que a última modificação da pasta
      return cacheStats.mtime >= downloadsStats.mtime;
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Reconstrói o cache processando todos os arquivos
   */
  async buildCache() {
    try {
      console.log('🏗️ Construindo cache de downloads...');
      const files = await fs.readdir(this.downloadsPath);
      const infoFiles = files.filter(file => file.endsWith('.info.json'));
      
      const downloads = [];
      let processed = 0;
      
      for (const infoFile of infoFiles) {
        try {
          // Verificar se o arquivo ainda existe antes de processar
          const infoPath = path.join(this.downloadsPath, infoFile);
          if (!await fs.pathExists(infoPath)) {
            console.warn(`⚠️ Arquivo não encontrado, ignorando: ${infoFile}`);
            continue;
          }
          
          const download = await this.processDownloadFile(infoFile);
          if (download) {
            downloads.push(download);
            processed++;
            
            // Log de progresso a cada 10 arquivos
            if (processed % 10 === 0) {
              console.log(`📊 Processados ${processed}/${infoFiles.length} downloads...`);
            }
          }
        } catch (error) {
          console.warn(`⚠️ Erro ao processar ${infoFile}:`, error.message);
        }
      }

      // Ordenar por data de download (mais recente primeiro) e limitar aos 50 mais recentes
      downloads.sort((a, b) => new Date(b.downloadedAt) - new Date(a.downloadedAt));
      const limitedDownloads = downloads.slice(0, 50);

      // Salvar cache
      await this.saveCache(limitedDownloads);
      
      console.log(`✅ Cache construído com ${limitedDownloads.length} downloads (limitado aos 50 mais recentes de ${downloads.length} totais)`);
      return limitedDownloads;
      
    } catch (error) {
      console.error('❌ Erro ao construir cache:', error);
      throw error;
    }
  }

  /**
   * Salva o cache em arquivo (limitado aos 50 vídeos mais recentes)
   */
  async saveCache(downloads) {
    try {
      // Garantir que temos no máximo 50 downloads, ordenados por data
      const sortedDownloads = downloads
        .sort((a, b) => new Date(b.downloadedAt) - new Date(a.downloadedAt))
        .slice(0, 50);

      const cacheData = {
        lastUpdated: new Date().toISOString(),
        totalDownloads: sortedDownloads.length,
        downloads: sortedDownloads,
        isLimited: true,
        maxCacheSize: 50
      };
      
      await fs.writeJson(this.cacheFilePath, cacheData, { spaces: 2 });
      console.log(`💾 Cache salvo com ${sortedDownloads.length} downloads (limitado aos 50 mais recentes)`);
      
    } catch (error) {
      console.error('❌ Erro ao salvar cache:', error);
      throw error;
    }
  }

  /**
   * Limpa o cache (força reconstrução na próxima consulta)
   */
  async clearCache() {
    try {
      if (await fs.pathExists(this.cacheFilePath)) {
        await fs.remove(this.cacheFilePath);
        console.log('🗑️ Cache limpo');
      }
    } catch (error) {
      console.warn('⚠️ Erro ao limpar cache:', error);
    }
  }

  // Métodos utilitários
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDuration(seconds) {
    if (!seconds) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  extractResolution(infoData) {
    if (infoData.resolution) return infoData.resolution;
    if (infoData.height) return `${infoData.width || '?'}x${infoData.height}`;
    if (infoData.format_note) return infoData.format_note;
    return 'N/A';
  }

  extractUserIdFromFilename(filename) {
    // Se o nome do arquivo contém um padrão como userId_timestamp
    const match = filename.match(/^(.+?)_\d+$/);
    return match ? match[1] : null;
  }

  getFormatStats(downloads) {
    const formats = {};
    downloads.forEach(download => {
      const format = download.format || 'unknown';
      formats[format] = (formats[format] || 0) + 1;
    });
    return formats;
  }

  getChannelStats(downloads) {
    const channels = {};
    downloads.forEach(download => {
      const channel = download.channelName || 'unknown';
      channels[channel] = (channels[channel] || 0) + 1;
    });
    return Object.entries(channels)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 canais
  }
}

module.exports = new DirectDownloadService();