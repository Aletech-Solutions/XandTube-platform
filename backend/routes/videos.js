const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Configuração do Multer para upload de vídeos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const videosPath = path.join(__dirname, '../../videos');
    fs.ensureDirSync(videosPath);
    cb(null, videosPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|avi|mkv|mov|wmv|flv|webm/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);
    
    if (extName && mimeType) {
      return cb(null, true);
    } else {
      cb(new Error('Formato de vídeo não suportado'));
    }
  }
});

// Mock data - Em produção seria um banco de dados
let videos = [];

// GET /api/videos - Listar todos os vídeos
router.get('/', (req, res) => {
  try {
    const { search, channel, limit = 20, offset = 0 } = req.query;
    
    let filteredVideos = [...videos];
    
    // Filtro por busca
    if (search) {
      const searchLower = search.toLowerCase();
      filteredVideos = filteredVideos.filter(video => 
        video.title.toLowerCase().includes(searchLower) ||
        video.description.toLowerCase().includes(searchLower) ||
        video.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // Filtro por canal
    if (channel) {
      filteredVideos = filteredVideos.filter(video => video.channelId === channel);
    }
    
    // Paginação
    const start = parseInt(offset);
    const end = start + parseInt(limit);
    const paginatedVideos = filteredVideos.slice(start, end);
    
    res.json({
      videos: paginatedVideos,
      total: filteredVideos.length,
      hasMore: end < filteredVideos.length
    });
  } catch (error) {
    console.error('Erro ao buscar vídeos:', error);
    res.status(500).json({ error: 'Erro ao buscar vídeos' });
  }
});

// GET /api/videos/:id - Obter vídeo específico
router.get('/:id', (req, res) => {
  try {
    const video = videos.find(v => v.id === req.params.id);
    
    if (!video) {
      return res.status(404).json({ 
        error: 'Vídeo não encontrado',
        message: 'O vídeo solicitado não existe ou foi removido'
      });
    }
    
    // Incrementar visualizações
    video.views += 1;
    
    res.json(video);
  } catch (error) {
    console.error('Erro ao buscar vídeo:', error);
    res.status(500).json({ error: 'Erro ao buscar vídeo' });
  }
});

// POST /api/videos - Upload de novo vídeo
router.post('/', upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo de vídeo enviado' });
    }
    
    const { title, description, channelId, channelName, tags } = req.body;
    
    if (!title || !channelId) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios ausentes',
        required: ['title', 'channelId']
      });
    }
    
    const newVideo = {
      id: uuidv4(),
      title,
      description: description || '',
      filename: req.file.filename,
      thumbnail: `/api/videos/${uuidv4()}/thumbnail`,
      duration: '0:00', // Seria calculado em produção
      views: 0,
      likes: 0,
      dislikes: 0,
      channelId,
      channelName: channelName || 'Canal Desconhecido',
      uploadDate: new Date().toISOString(),
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    };
    
    videos.push(newVideo);
    
    // Salvar metadados (simulando yt-dlp)
    const metadataPath = path.join(__dirname, '../../videos/metadata', `${newVideo.id}.json`);
    fs.writeJsonSync(metadataPath, {
      ...newVideo,
      filesize: req.file.size,
      mimetype: req.file.mimetype,
      originalName: req.file.originalname
    });
    
    res.status(201).json({
      message: 'Vídeo enviado com sucesso!',
      video: newVideo
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro no upload do vídeo' });
  }
});

// PUT /api/videos/:id/like - Curtir vídeo
router.put('/:id/like', (req, res) => {
  try {
    const video = videos.find(v => v.id === req.params.id);
    
    if (!video) {
      return res.status(404).json({ error: 'Vídeo não encontrado' });
    }
    
    video.likes += 1;
    
    res.json({ 
      message: 'Vídeo curtido!',
      likes: video.likes 
    });
  } catch (error) {
    console.error('Erro ao curtir vídeo:', error);
    res.status(500).json({ error: 'Erro ao curtir vídeo' });
  }
});

// PUT /api/videos/:id/dislike - Descurtir vídeo
router.put('/:id/dislike', (req, res) => {
  try {
    const video = videos.find(v => v.id === req.params.id);
    
    if (!video) {
      return res.status(404).json({ error: 'Vídeo não encontrado' });
    }
    
    video.dislikes += 1;
    
    res.json({ 
      message: 'Vídeo descurtido!',
      dislikes: video.dislikes 
    });
  } catch (error) {
    console.error('Erro ao descurtir vídeo:', error);
    res.status(500).json({ error: 'Erro ao descurtir vídeo' });
  }
});

// GET /api/videos/:id/thumbnail - Obter thumbnail (mock)
router.get('/:id/thumbnail', (req, res) => {
  // Em produção, geraria thumbnails reais dos vídeos
  res.redirect('https://via.placeholder.com/320x180/ff0000/ffffff?text=XandTube');
});

// DELETE /api/videos/:id - Deletar vídeo
router.delete('/:id', (req, res) => {
  try {
    const videoIndex = videos.findIndex(v => v.id === req.params.id);
    
    if (videoIndex === -1) {
      return res.status(404).json({ error: 'Vídeo não encontrado' });
    }
    
    const video = videos[videoIndex];
    
    // Remover arquivo do disco
    const videoPath = path.join(__dirname, '../../videos', video.filename);
    const metadataPath = path.join(__dirname, '../../videos/metadata', `${video.id}.json`);
    
    try {
      fs.removeSync(videoPath);
      fs.removeSync(metadataPath);
    } catch (fileError) {
      console.error('Erro ao remover arquivos:', fileError);
    }
    
    // Remover do array
    videos.splice(videoIndex, 1);
    
    res.json({ message: 'Vídeo removido com sucesso!' });
  } catch (error) {
    console.error('Erro ao deletar vídeo:', error);
    res.status(500).json({ error: 'Erro ao deletar vídeo' });
  }
});

module.exports = router;