const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const directDownloadService = require('../services/directDownloadService');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/direct-downloads/debug
 * Lista todos os downloads SEM autenticação (para teste)
 */
router.get('/debug', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    let result;
    if (search) {
      result = await directDownloadService.searchDownloads(search, null, page, limit);
    } else {
      result = await directDownloadService.listDownloads(null, page, limit);
    }

    res.json(result);
  } catch (error) {
    console.error('Erro ao listar downloads (debug):', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/direct-downloads
 * Lista todos os downloads (acesso público)
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    // Downloads são públicos - não filtrar por usuário
    const userId = null;

    let result;
    if (search) {
      result = await directDownloadService.searchDownloads(search, userId, page, limit);
    } else {
      result = await directDownloadService.listDownloads(userId, page, limit);
    }

    res.json(result);
  } catch (error) {
    console.error('Erro ao listar downloads diretos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/direct-downloads/all
 * Lista todos os downloads de todos os usuários (admin)
 */
router.get('/all', authenticateToken, async (req, res) => {
  try {
    // TODO: Verificar se usuário é admin
    const { page = 1, limit = 10, search } = req.query;

    let result;
    if (search) {
      result = await directDownloadService.searchDownloads(search, null, page, limit);
    } else {
      result = await directDownloadService.listDownloads(null, page, limit);
    }

    res.json(result);
  } catch (error) {
    console.error('Erro ao listar todos os downloads:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/direct-downloads/stats
 * Obtém estatísticas dos downloads (acesso público)
 */
router.get('/stats', async (req, res) => {
  try {
    // Stats são públicas - mostrar todos os downloads
    const userId = null;
    const stats = await directDownloadService.getStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/direct-downloads/:id
 * Obtém detalhes de um download específico (acesso público)
 */
router.get('/:id', async (req, res) => {
  try {
    const downloadId = req.params.id;
    const download = await directDownloadService.getDownload(downloadId);

    if (!download) {
      return res.status(404).json({ error: 'Download não encontrado' });
    }

    // Downloads são públicos - não verificar usuário
    res.json(download);
  } catch (error) {
    console.error('Erro ao buscar download:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/direct-downloads/:id/stream
 * Faz stream do arquivo de vídeo
 */
router.get('/:id/stream', async (req, res) => {
  try {
    const downloadId = req.params.id;
    const download = await directDownloadService.getDownload(downloadId);

    if (!download) {
      return res.status(404).json({ error: 'Download não encontrado' });
    }

    const videoPath = download.videoPath;
    
    if (!await fs.pathExists(videoPath)) {
      return res.status(404).json({ error: 'Arquivo de vídeo não encontrado' });
    }

    const stat = await fs.stat(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Support para range requests (streaming)
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      const stream = fs.createReadStream(videoPath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4'
      });
      
      stream.pipe(res);
    } else {
      // Stream completo
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes'
      });
      
      fs.createReadStream(videoPath).pipe(res);
    }

  } catch (error) {
    console.error('Erro ao fazer stream do vídeo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/direct-downloads/:id/thumbnail
 * Serve a thumbnail do download
 */
router.get('/:id/thumbnail', async (req, res) => {
  try {
    const downloadId = req.params.id;
    const download = await directDownloadService.getDownload(downloadId);

    if (!download || !download.thumbnailPath) {
      return res.status(404).json({ error: 'Thumbnail não encontrada' });
    }

    const thumbnailPath = download.thumbnailPath;

    if (!await fs.pathExists(thumbnailPath)) {
      return res.status(404).json({ error: 'Arquivo de thumbnail não encontrado' });
    }

    // Determina o tipo de conteúdo baseado na extensão
    const ext = path.extname(thumbnailPath).toLowerCase();
    let contentType = 'image/jpeg';
    
    switch (ext) {
      case '.png':
        contentType = 'image/png';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.jpg':
      case '.jpeg':
      default:
        contentType = 'image/jpeg';
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=1800'); // Cache por 30 minutos
    
    fs.createReadStream(thumbnailPath).pipe(res);

  } catch (error) {
    console.error('Erro ao servir thumbnail:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/direct-downloads/:id/files
 * Deleta os arquivos físicos do download (acesso público)
 */
router.delete('/:id/files', async (req, res) => {
  try {
    const downloadId = req.params.id;
    
    // Verifica se o download existe
    const download = await directDownloadService.getDownload(downloadId);
    if (!download) {
      return res.status(404).json({ error: 'Download não encontrado' });
    }

    // Downloads são públicos - qualquer um pode deletar
    const result = await directDownloadService.deleteDownloadFiles(downloadId);
    
    res.json({
      message: 'Arquivos deletados com sucesso',
      deletedFiles: result.deletedFiles,
      files: result.files
    });

  } catch (error) {
    console.error('Erro ao deletar arquivos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/direct-downloads/scan/folder
 * Re-escaneia a pasta de downloads (acesso público para debug)
 */
router.get('/scan/folder', async (req, res) => {
  try {
    const { downloads, total } = await directDownloadService.listDownloads(null, 1, 999999);
    
    res.json({
      message: 'Pasta escaneada com sucesso',
      totalFound: total,
      downloads: downloads.map(d => ({
        id: d.id,
        title: d.title,
        channelName: d.channelName,
        fileSize: d.fileSizeFormatted,
        downloadedAt: d.downloadedAt
      }))
    });
  } catch (error) {
    console.error('Erro ao escanear pasta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/direct-downloads/cache/clear
 * Limpa o cache de downloads (força reconstrução)
 */
router.post('/cache/clear', async (req, res) => {
  try {
    await directDownloadService.clearCache();
    
    res.json({
      message: 'Cache limpo com sucesso',
      note: 'O cache será reconstruído na próxima consulta'
    });
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/direct-downloads/cache/status
 * Verifica o status do cache
 */
router.get('/cache/status', async (req, res) => {
  try {
    const fs = require('fs-extra');
    const path = require('path');
    const cacheFilePath = path.join(__dirname, '../../videos/downloads-cache.json');
    
    let cacheInfo = {
      exists: false,
      size: 0,
      lastModified: null,
      totalDownloads: 0
    };
    
    if (await fs.pathExists(cacheFilePath)) {
      const stats = await fs.stat(cacheFilePath);
      const cacheData = await fs.readJson(cacheFilePath);
      
      cacheInfo = {
        exists: true,
        size: stats.size,
        sizeFormatted: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        lastModified: stats.mtime.toISOString(),
        lastUpdated: cacheData.lastUpdated,
        totalDownloads: cacheData.totalDownloads || 0
      };
    }
    
    res.json(cacheInfo);
  } catch (error) {
    console.error('Erro ao verificar status do cache:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;