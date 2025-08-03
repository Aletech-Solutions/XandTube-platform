const express = require('express');
const router = express.Router();
const { Download } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const downloadScanService = require('../services/downloadScanService');
const fs = require('fs-extra');
const path = require('path');

/**
 * GET /api/downloads
 * Lista downloads do usuário
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { rows: downloads, count: total } = await downloadScanService.listDownloads(
      userId, 
      limit, 
      offset
    );

    res.json({
      downloads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao listar downloads:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/downloads/all
 * Lista todos os downloads (admin)
 */
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { rows: downloads, count: total } = await downloadScanService.listDownloads(
      null, // Sem filtro de usuário
      limit, 
      offset
    );

    res.json({
      downloads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao listar todos os downloads:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/downloads/stats
 * Estatísticas dos downloads
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await downloadScanService.getDownloadStats(userId);
    
    res.json(stats);

  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/downloads/scan
 * Escaneia pasta e registra downloads não catalogados
 */
router.get('/scan', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Iniciando escaneamento de downloads...');
    const processedDownloads = await downloadScanService.scanAndRegisterDownloads();
    
    res.json({
      message: 'Escaneamento concluído',
      processed: processedDownloads.length,
      downloads: processedDownloads
    });

  } catch (error) {
    console.error('Erro ao escanear downloads:', error);
    res.status(500).json({ error: 'Erro ao escanear downloads' });
  }
});

/**
 * GET /api/downloads/:id
 * Obtém detalhes de um download específico
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const downloadId = req.params.id;
    const userId = req.user.id;

    const download = await Download.findOne({
      where: { 
        id: downloadId,
        userId: userId
      },
      include: [
        {
          association: 'user',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    if (!download) {
      return res.status(404).json({ error: 'Download não encontrado' });
    }

    res.json(download);

  } catch (error) {
    console.error('Erro ao obter download:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/downloads/:id
 * Remove um download (apenas do banco, arquivos ficam)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const downloadId = req.params.id;
    const userId = req.user.id;

    const download = await Download.findOne({
      where: { 
        id: downloadId,
        userId: userId
      }
    });

    if (!download) {
      return res.status(404).json({ error: 'Download não encontrado' });
    }

    await download.destroy();
    
    res.json({ message: 'Download removido do histórico' });

  } catch (error) {
    console.error('Erro ao remover download:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/downloads/:id/files
 * Remove download e seus arquivos físicos
 */
router.delete('/:id/files', authenticateToken, async (req, res) => {
  try {
    const downloadId = req.params.id;
    const userId = req.user.id;

    const download = await Download.findOne({
      where: { 
        id: downloadId,
        userId: userId
      }
    });

    if (!download) {
      return res.status(404).json({ error: 'Download não encontrado' });
    }

    // Remove arquivos físicos
    const filesToRemove = [
      download.videoPath,
      download.thumbnailPath,
      download.infoPath
    ].filter(Boolean);

    for (const filePath of filesToRemove) {
      try {
        if (await fs.pathExists(filePath)) {
          await fs.remove(filePath);
          console.log(`🗑️ Arquivo removido: ${filePath}`);
        }
      } catch (fileError) {
        console.error(`❌ Erro ao remover arquivo ${filePath}:`, fileError);
      }
    }

    // Remove do banco
    await download.destroy();
    
    res.json({ message: 'Download e arquivos removidos' });

  } catch (error) {
    console.error('Erro ao remover download e arquivos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/downloads/:id/stream
 * Stream do arquivo de vídeo
 */
router.get('/:id/stream', authenticateToken, async (req, res) => {
  try {
    const downloadId = req.params.id;
    const userId = req.user.id;

    const download = await Download.findOne({
      where: { 
        id: downloadId,
        userId: userId
      }
    });

    if (!download) {
      return res.status(404).json({ error: 'Download não encontrado' });
    }

    if (!await fs.pathExists(download.videoPath)) {
      return res.status(404).json({ error: 'Arquivo de vídeo não encontrado' });
    }

    const stat = await fs.stat(download.videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Streaming com suporte a range
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(download.videoPath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      });
      
      file.pipe(res);
    } else {
      // Streaming completo
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });
      fs.createReadStream(download.videoPath).pipe(res);
    }

  } catch (error) {
    console.error('Erro ao fazer stream do vídeo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/downloads/:id/convert-to-video
 * Converte download em vídeo do sistema
 */
router.post('/:id/convert-to-video', authenticateToken, async (req, res) => {
  try {
    const downloadId = req.params.id;
    const userId = req.user.id;

    const download = await Download.findOne({
      where: { 
        id: downloadId,
        userId: userId
      }
    });

    if (!download) {
      return res.status(404).json({ error: 'Download não encontrado' });
    }

    const video = await downloadScanService.convertDownloadToVideo(downloadId, userId);
    
    res.json({
      message: 'Download convertido em vídeo com sucesso',
      video: video
    });

  } catch (error) {
    console.error('Erro ao converter download em vídeo:', error);
    
    if (error.message.includes('já possui vídeo associado')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/downloads/convert-multiple
 * Converte múltiplos downloads em vídeos
 */
router.post('/convert-multiple', authenticateToken, async (req, res) => {
  try {
    const { downloadIds } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(downloadIds) || downloadIds.length === 0) {
      return res.status(400).json({ error: 'Lista de IDs de download é obrigatória' });
    }

    // Verifica se todos os downloads pertencem ao usuário
    const downloads = await Download.findAll({
      where: {
        id: downloadIds,
        userId: userId
      }
    });

    if (downloads.length !== downloadIds.length) {
      return res.status(400).json({ error: 'Alguns downloads não foram encontrados' });
    }

    const results = await downloadScanService.convertMultipleDownloadsToVideos(downloadIds, userId);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.json({
      message: `Conversão concluída: ${successful} sucessos, ${failed} falhas`,
      results: results
    });

  } catch (error) {
    console.error('Erro ao converter múltiplos downloads:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/downloads/:id/thumbnail
 * Serve a thumbnail do download
 */
router.get('/:id/thumbnail', async (req, res) => {
  try {
    const downloadId = req.params.id;

    const download = await Download.findOne({
      where: { id: downloadId }
    });

    if (!download || !download.thumbnailPath) {
      return res.status(404).json({ error: 'Thumbnail não encontrada' });
    }

    if (!await fs.pathExists(download.thumbnailPath)) {
      return res.status(404).json({ error: 'Arquivo de thumbnail não encontrado' });
    }

    const ext = path.extname(download.thumbnailPath).toLowerCase();
    const contentType = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp'
    }[ext] || 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=1800'); // Cache por 30 minutos
    
    fs.createReadStream(download.thumbnailPath).pipe(res);

  } catch (error) {
    console.error('Erro ao servir thumbnail:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;