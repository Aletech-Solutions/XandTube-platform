const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { Download } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Função para obter arquivos de informação de vídeos
const getVideoInfoFiles = () => {
  const downloadsPath = path.join(__dirname, '../../videos/downloads');
  const metadataPath = path.join(__dirname, '../../videos/metadata');
  
  let infoFiles = [];
  
  // Verificar pasta downloads
  if (fs.existsSync(downloadsPath)) {
    const files = fs.readdirSync(downloadsPath);
    const infoFilesInDownloads = files.filter(file => file.endsWith('.info.json'));
    infoFiles = infoFiles.concat(infoFilesInDownloads.map(file => path.join(downloadsPath, file)));
  }
  
  // Verificar pasta metadata
  if (fs.existsSync(metadataPath)) {
    const files = fs.readdirSync(metadataPath);
    const infoFilesInMetadata = files.filter(file => file.endsWith('.info.json'));
    infoFiles = infoFiles.concat(infoFilesInMetadata.map(file => path.join(metadataPath, file)));
  }
  
  return infoFiles;
};

// Função para extrair informações de todos os vídeos
const getAllVideos = () => {
  const infoFiles = getVideoInfoFiles();
  const videos = [];
  
  infoFiles.forEach(filePath => {
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ Arquivo não encontrado: ${filePath}`);
        return;
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      const videoInfo = JSON.parse(content);
      
      // Extrair ID completo do nome do arquivo
      const fileName = path.basename(filePath, '.info.json');
      
      const video = {
        id: fileName, // ID completo com timestamp
        youtubeId: videoInfo.id, // ID original do YouTube
        title: videoInfo.title,
        description: videoInfo.description,
        thumbnail: videoInfo.thumbnail || (videoInfo.thumbnails && videoInfo.thumbnails[0] && videoInfo.thumbnails[0].url) || '',
        duration: videoInfo.duration,
        views: videoInfo.view_count || 0,
        likes: videoInfo.like_count || 0,
        channelId: videoInfo.channel_id || videoInfo.uploader_id,
        channelName: videoInfo.channel || videoInfo.uploader,
        tags: videoInfo.tags || [],
        categories: videoInfo.categories || [],
        uploadDate: videoInfo.upload_date,
        createdAt: videoInfo.upload_date ? 
          new Date(videoInfo.upload_date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')).toISOString() : 
          new Date().toISOString()
      };
      
      videos.push(video);
    } catch (error) {
      console.error(`Erro ao processar ${filePath}:`, error.message);
    }
  });
  
  return videos;
};

// Função para calcular similaridade entre vídeos (versão original para arquivos)
const calculateSimilarity = (video1, video2) => {
  let score = 0;
  
  // Mesmo canal (+50 pontos)
  if (video1.channelId === video2.channelId) {
    score += 50;
  }
  
  // Tags em comum (+10 pontos por tag)
  if (video1.tags && video2.tags) {
    const commonTags = video1.tags.filter(tag => 
      video2.tags.some(tag2 => tag.toLowerCase() === tag2.toLowerCase())
    );
    score += commonTags.length * 10;
  }
  
  // Categorias em comum (+15 pontos por categoria)
  if (video1.categories && video2.categories) {
    const commonCategories = video1.categories.filter(cat => 
      video2.categories.includes(cat)
    );
    score += commonCategories.length * 15;
  }
  
  // Similaridade no título (busca por palavras-chave)
  if (video1.title && video2.title) {
    const words1 = video1.title.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const words2 = video2.title.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const commonWords = words1.filter(word => words2.includes(word));
    score += commonWords.length * 5;
  }
  
  // Bônus por popularidade (views similares)
  const viewsDiff = Math.abs(video1.views - video2.views);
  const maxViews = Math.max(video1.views, video2.views);
  if (maxViews > 0) {
    const similarity = 1 - (viewsDiff / maxViews);
    score += similarity * 20;
  }
  
  return score;
};

// Função para calcular similaridade entre vídeos do banco de dados
const calculateSimilarityFromDB = (video1, video2) => {
  let score = 0;
  
  // Mesmo canal (+50 pontos)
  if (video1.channelId && video2.channelId && video1.channelId === video2.channelId) {
    score += 50;
  }
  
  // Mesma categoria (+30 pontos)
  if (video1.category && video2.category && video1.category === video2.category) {
    score += 30;
  }
  
  // Similaridade no título (busca por palavras-chave)
  if (video1.title && video2.title) {
    const words1 = video1.title.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const words2 = video2.title.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const commonWords = words1.filter(word => words2.includes(word));
    score += commonWords.length * 8;
  }
  
  // Similaridade no nome do canal
  if (video1.channelName && video2.channelName && 
      video1.channelName.toLowerCase() === video2.channelName.toLowerCase()) {
    score += 40;
  }
  
  // Tags e categorias do metadata (se disponível)
  if (video1.metadata && video2.metadata) {
    // Tags em comum
    if (video1.metadata.tags && video2.metadata.tags) {
      const commonTags = video1.metadata.tags.filter(tag => 
        video2.metadata.tags.some(tag2 => tag.toLowerCase() === tag2.toLowerCase())
      );
      score += commonTags.length * 12;
    }
    
    // Categorias em comum
    if (video1.metadata.categories && video2.metadata.categories) {
      const commonCategories = video1.metadata.categories.filter(cat => 
        video2.metadata.categories.includes(cat)
      );
      score += commonCategories.length * 15;
    }
    
    // Views similares (se disponível no metadata)
    if (video1.metadata.view_count && video2.metadata.view_count) {
      const viewsDiff = Math.abs(video1.metadata.view_count - video2.metadata.view_count);
      const maxViews = Math.max(video1.metadata.view_count, video2.metadata.view_count);
      if (maxViews > 0) {
        const similarity = 1 - (viewsDiff / maxViews);
        score += similarity * 20;
      }
    }
  }
  
  // Duração similar (+10 pontos se a diferença for menor que 20%)
  if (video1.duration && video2.duration) {
    const durationDiff = Math.abs(video1.duration - video2.duration);
    const maxDuration = Math.max(video1.duration, video2.duration);
    if (maxDuration > 0) {
      const similarity = 1 - (durationDiff / maxDuration);
      if (similarity > 0.8) { // Se a duração for 80% similar
        score += 15;
      }
    }
  }
  
  // Bônus por recência (vídeos mais recentes têm prioridade)
  const now = new Date();
  const video2Date = new Date(video2.downloadedAt);
  const daysDiff = (now - video2Date) / (1000 * 60 * 60 * 24);
  if (daysDiff < 7) {
    score += 10; // Bônus para vídeos da última semana
  } else if (daysDiff < 30) {
    score += 5; // Bônus menor para vídeos do último mês
  }
  
  return score;
};

// GET /api/recommendations/:videoId - Obter recomendações para um vídeo
router.get('/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { limit = 10 } = req.query;
    
    console.log(`🎯 Buscando recomendações para vídeo ID: ${videoId}`);
    
    // Buscar o vídeo atual no banco de dados
    const currentVideo = await Download.findByPk(videoId);
    
    if (!currentVideo) {
      console.log(`❌ Vídeo com ID ${videoId} não encontrado no banco de dados`);
      return res.status(404).json({ 
        error: 'Vídeo não encontrado',
        recommendations: []
      });
    }
    
    console.log(`✅ Vídeo encontrado: ${currentVideo.title}`);
    
    // Buscar outros vídeos para recomendações (excluir o atual)
    const otherVideos = await Download.findAll({
      where: {
        id: { [Op.ne]: videoId },
        status: 'completed'
      },
      order: [['downloadedAt', 'DESC']],
      limit: 100 // Limitar para performance
    });
    
    console.log(`📊 Encontrados ${otherVideos.length} outros vídeos para análise`);
    
    // Calcular scores de similaridade
    const videosWithScores = otherVideos.map(video => ({
      id: video.id,
      youtubeId: video.youtubeId,
      title: video.title,
      description: video.description,
      duration: video.duration,
      channelName: video.channelName,
      channelId: video.channelId,
      downloadedAt: video.downloadedAt,
      category: video.category,
      metadata: video.metadata,
      thumbnail: `/api/direct-downloads/${video.id}/thumbnail`,
      views: video.metadata?.view_count || 0,
      similarityScore: calculateSimilarityFromDB(currentVideo, video)
    }));
    
    // Ordenar por score (maior primeiro) e pegar os melhores
    const recommendations = videosWithScores
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, parseInt(limit))
      .map(video => {
        // Remover o score da resposta final
        const { similarityScore, ...videoData } = video;
        return videoData;
      });
    
    console.log(`✅ Encontradas ${recommendations.length} recomendações para ${currentVideo.title}`);
    
    res.json({
      videoId,
      currentVideo: {
        id: currentVideo.id,
        title: currentVideo.title,
        channelName: currentVideo.channelName
      },
      total: recommendations.length,
      recommendations
    });
    
  } catch (error) {
    console.error('Erro ao buscar recomendações:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      recommendations: []
    });
  }
});

// GET /api/recommendations - Obter recomendações gerais (mais populares)
router.get('/', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    console.log('🔥 Buscando vídeos populares para recomendações gerais');
    
    // Buscar vídeos mais recentes do banco de dados
    const popularVideos = await Download.findAll({
      where: {
        status: 'completed'
      },
      order: [
        ['downloadedAt', 'DESC'], // Mais recentes primeiro
        ['id', 'DESC']
      ],
      limit: parseInt(limit),
      attributes: [
        'id', 'youtubeId', 'title', 'description', 'duration',
        'channelName', 'channelId', 'downloadedAt', 'category', 'metadata'
      ]
    });
    
    console.log(`✅ Encontrados ${popularVideos.length} vídeos recentes`);
    
    // Converter para formato simples
    const recommendations = popularVideos.map(video => ({
      id: video.id,
      youtubeId: video.youtubeId,
      title: video.title,
      description: video.description,
      duration: video.duration,
      channelName: video.channelName,
      channelId: video.channelId,
      downloadedAt: video.downloadedAt,
      category: video.category,
      metadata: video.metadata,
      thumbnail: `/api/direct-downloads/${video.id}/thumbnail`,
      views: video.metadata?.view_count || 0
    }));
    
    res.json({
      total: recommendations.length,
      recommendations
    });
    
  } catch (error) {
    console.error('Erro ao buscar recomendações gerais:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      recommendations: []
    });
  }
});

module.exports = router;