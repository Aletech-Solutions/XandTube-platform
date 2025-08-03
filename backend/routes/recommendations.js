const express = require('express');
const fs = require('fs-extra');
const path = require('path');

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

// Função para calcular similaridade entre vídeos
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

// GET /api/recommendations/:videoId - Obter recomendações para um vídeo
router.get('/:videoId', (req, res) => {
  try {
    const { videoId } = req.params;
    const { limit = 10 } = req.query;
    
    console.log(`🎯 Buscando recomendações para vídeo: ${videoId}`);
    
    const allVideos = getAllVideos();
    const currentVideo = allVideos.find(v => v.id === videoId);
    
    if (!currentVideo) {
      return res.status(404).json({ 
        error: 'Vídeo não encontrado',
        recommendations: []
      });
    }
    
    // Filtrar vídeos (excluir o atual)
    const otherVideos = allVideos.filter(v => v.id !== videoId);
    
    // Calcular scores de similaridade
    const videosWithScores = otherVideos.map(video => ({
      ...video,
      similarityScore: calculateSimilarity(currentVideo, video)
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
    
    console.log(`✅ Encontradas ${recommendations.length} recomendações para ${videoId}`);
    
    res.json({
      videoId,
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
router.get('/', (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    console.log('🔥 Buscando vídeos populares para recomendações gerais');
    
    const allVideos = getAllVideos();
    
    // Ordenar por visualizações (mais popular primeiro)
    const popularVideos = allVideos
      .sort((a, b) => b.views - a.views)
      .slice(0, parseInt(limit));
    
    console.log(`✅ Encontrados ${popularVideos.length} vídeos populares`);
    
    res.json({
      total: popularVideos.length,
      recommendations: popularVideos
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