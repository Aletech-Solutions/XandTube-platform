const { Download, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Serviço para gerenciar downloads usando SQLite
 */
class DownloadService {
  
  /**
   * Lista downloads com paginação e filtros
   */
  async listDownloads(userId = null, page = 1, limit = 10, search = null, filters = {}, sortBy = 'downloadedAt', sortOrder = 'DESC') {
    try {
      const offset = (page - 1) * limit;
      const whereClause = {};
      
      // Filtrar por usuário se especificado
      if (userId) {
        whereClause.userId = userId;
      }
      
      // Aplicar filtros adicionais
      if (filters.category) {
        whereClause.category = filters.category;
      }
      
      if (filters.source) {
        whereClause.source = filters.source;
      }
      
      if (filters.dateFrom || filters.dateTo) {
        whereClause.downloadedAt = {};
        if (filters.dateFrom) {
          whereClause.downloadedAt[Op.gte] = filters.dateFrom;
        }
        if (filters.dateTo) {
          whereClause.downloadedAt[Op.lte] = filters.dateTo;
        }
      }
      
      // Filtrar por busca se especificado
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { channelName: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      // Validar campo de ordenação
      const validSortFields = ['downloadedAt', 'title', 'channelName', 'fileSize', 'duration'];
      const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'downloadedAt';
      const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
      
      const { count, rows } = await Download.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'fullName']
          }
        ],
        order: [[validSortBy, validSortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return {
        success: true,
        downloads: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
        filters: {
          category: filters.category,
          source: filters.source,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          search,
          sortBy: validSortBy,
          sortOrder: validSortOrder
        }
      };
      
    } catch (error) {
      console.error('❌ Erro ao listar downloads:', error);
      throw error;
    }
  }
  
  /**
   * Busca downloads por termo
   */
  async searchDownloads(query, userId = null, page = 1, limit = 10, filters = {}, sortBy = 'downloadedAt', sortOrder = 'DESC') {
    return this.listDownloads(userId, page, limit, query, filters, sortBy, sortOrder);
  }
  
  /**
   * Obtém um download específico por ID
   */
  async getDownloadById(id) {
    try {
      const download = await Download.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'fullName']
          }
        ]
      });
      
      return download;
      
    } catch (error) {
      console.error('❌ Erro ao obter download:', error);
      throw error;
    }
  }
  
  /**
   * Obtém um download por YouTube ID
   */
  async getDownloadByYoutubeId(youtubeId) {
    try {
      const download = await Download.findOne({
        where: { youtubeId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'fullName']
          }
        ]
      });
      
      return download;
      
    } catch (error) {
      console.error('❌ Erro ao obter download por YouTube ID:', error);
      throw error;
    }
  }
  
  /**
   * Cria um novo registro de download
   */
  async createDownload(downloadData) {
    try {
      const download = await Download.create(downloadData);
      return download;
      
    } catch (error) {
      console.error('❌ Erro ao criar download:', error);
      throw error;
    }
  }
  
  /**
   * Atualiza um download existente
   */
  async updateDownload(id, updateData) {
    try {
      const download = await Download.findByPk(id);
      
      if (!download) {
        throw new Error('Download não encontrado');
      }
      
      await download.update(updateData);
      return download;
      
    } catch (error) {
      console.error('❌ Erro ao atualizar download:', error);
      throw error;
    }
  }
  
  /**
   * Remove um download
   */
  async deleteDownload(id) {
    try {
      const download = await Download.findByPk(id);
      
      if (!download) {
        throw new Error('Download não encontrado');
      }
      
      await download.destroy();
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao remover download:', error);
      throw error;
    }
  }
  
  /**
   * Obtém estatísticas de downloads
   */
  async getDownloadStats(userId = null) {
    try {
      const whereClause = userId ? { userId } : {};
      
      const [totalDownloads, totalSize, avgDuration] = await Promise.all([
        Download.count({ where: whereClause }),
        Download.sum('fileSize', { where: whereClause }),
        Download.findOne({
          where: whereClause,
          attributes: [
            [Download.sequelize.fn('AVG', Download.sequelize.col('duration')), 'avgDuration']
          ]
        })
      ]);
      
      return {
        totalDownloads,
        totalSize: totalSize || 0,
        avgDuration: avgDuration?.dataValues?.avgDuration || 0,
        totalSizeFormatted: this.formatFileSize(totalSize || 0)
      };
      
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      throw error;
    }
  }
  
  /**
   * Formata tamanho de arquivo
   */
  formatFileSize(bytes) {
    if (!bytes) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }
  
  /**
   * Obtém downloads recentes
   */
  async getRecentDownloads(limit = 5, userId = null) {
    try {
      const whereClause = userId ? { userId } : {};
      
      const downloads = await Download.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'fullName']
          }
        ],
        order: [['downloadedAt', 'DESC']],
        limit: parseInt(limit)
      });
      
      return downloads;
      
    } catch (error) {
      console.error('❌ Erro ao obter downloads recentes:', error);
      throw error;
    }
  }
  
  /**
   * Remove arquivos de download do sistema de arquivos
   */
  async deleteDownloadFiles(downloadId) {
    try {
      const download = await this.getDownloadById(downloadId);
      
      if (!download) {
        throw new Error('Download não encontrado');
      }
      
      const fs = require('fs-extra');
      const filesToDelete = [
        download.videoPath,
        download.thumbnailPath,
        download.infoPath
      ].filter(Boolean);
      
      let deletedFiles = 0;
      
      for (const filePath of filesToDelete) {
        try {
          if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
            deletedFiles++;
          }
        } catch (fileError) {
          console.warn(`⚠️ Erro ao remover arquivo ${filePath}:`, fileError.message);
        }
      }
      
      // Remover registro do banco
      await this.deleteDownload(downloadId);
      
      return {
        success: true,
        deletedFiles,
        totalFiles: filesToDelete.length
      };
      
    } catch (error) {
      console.error('❌ Erro ao remover arquivos de download:', error);
      throw error;
    }
  }
  
  /**
   * Limpa cache (no SQLite não há cache de arquivo, mas mantemos compatibilidade)
   */
  async clearCache() {
    // No SQLite não há cache de arquivo para limpar
    console.log('ℹ️ Cache SQLite não precisa ser limpo manualmente');
    return { success: true, message: 'Cache SQLite não precisa ser limpo' };
  }
}

module.exports = new DownloadService();
