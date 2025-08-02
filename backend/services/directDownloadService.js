const fs = require('fs-extra');
const path = require('path');

/**
 * Serviço para ler downloads diretamente da pasta (sem banco de dados)
 */
class DirectDownloadService {
  constructor() {
    this.downloadsPath = path.join(__dirname, '../../videos/downloads');
    this.supportedVideoFormats = ['.mp4', '.webm', '.mkv', '.avi', '.mov'];
    this.supportedImageFormats = ['.jpg', '.jpeg', '.png', '.webp'];
  }

  /**
   * Lista todos os downloads disponíveis
   */
  async listDownloads(userId = null, page = 1, limit = 20) {
    try {
      if (!await fs.pathExists(this.downloadsPath)) {
        return {
          downloads: [],
          total: 0,
          page,
          totalPages: 0
        };
      }

      const files = await fs.readdir(this.downloadsPath);
      const infoFiles = files.filter(file => file.endsWith('.info.json'));
      
      const downloads = [];
      
      for (const infoFile of infoFiles) {
        try {
          const download = await this.processDownloadFile(infoFile);
          if (download && (!userId || download.userId === userId)) {
            downloads.push(download);
          }
        } catch (error) {
          console.warn(`⚠️ Erro ao processar ${infoFile}:`, error.message);
        }
      }

      // Ordena por data de download (mais recente primeiro)
      downloads.sort((a, b) => new Date(b.downloadedAt) - new Date(a.downloadedAt));

      // Paginação
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedDownloads = downloads.slice(startIndex, endIndex);

      return {
        downloads: paginatedDownloads,
        total: downloads.length,
        page: parseInt(page),
        totalPages: Math.ceil(downloads.length / limit)
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
      const { downloads } = await this.listDownloads(userId, 1, 999999);
      
      const totalSize = downloads.reduce((sum, download) => sum + download.fileSize, 0);
      const totalDuration = downloads.reduce((sum, download) => sum + download.durationSeconds, 0);
      
      return {
        totalDownloads: downloads.length,
        totalSize: totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
        totalDuration: totalDuration,
        totalDurationFormatted: this.formatDuration(totalDuration),
        averageFileSize: downloads.length > 0 ? totalSize / downloads.length : 0,
        formats: this.getFormatStats(downloads),
        channels: this.getChannelStats(downloads)
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
  async searchDownloads(query, userId = null, page = 1, limit = 20) {
    try {
      const { downloads } = await this.listDownloads(userId, 1, 999999);
      
      const searchTerm = query.toLowerCase();
      const filtered = downloads.filter(download => 
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