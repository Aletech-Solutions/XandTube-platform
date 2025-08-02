const express = require('express');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Mock data - Em produção seria um banco de dados
let comments = [
  {
    id: '1',
    videoId: '1',
    authorName: 'João Silva',
    authorAvatar: '/api/comments/avatar/1',
    content: 'Excelente vídeo! Muito bem explicado.',
    timestamp: '2024-01-16T09:15:00Z',
    likes: 12,
    dislikes: 0,
    replies: []
  },
  {
    id: '2',
    videoId: '1',
    authorName: 'Maria Santos',
    authorAvatar: '/api/comments/avatar/2',
    content: 'Obrigada pelo tutorial, me ajudou muito!',
    timestamp: '2024-01-16T14:30:00Z',
    likes: 8,
    dislikes: 0,
    replies: [
      {
        id: '2-1',
        authorName: 'João Silva',
        authorAvatar: '/api/comments/avatar/1',
        content: 'Fico feliz em ajudar!',
        timestamp: '2024-01-16T15:00:00Z',
        likes: 3,
        dislikes: 0
      }
    ]
  },
  {
    id: '3',
    videoId: '2',
    authorName: 'Pedro Costa',
    authorAvatar: '/api/comments/avatar/3',
    content: 'Quando vai sair a próxima parte?',
    timestamp: '2024-01-11T11:45:00Z',
    likes: 5,
    dislikes: 1,
    replies: []
  }
];

// GET /api/comments/:videoId - Obter comentários de um vídeo
router.get('/:videoId', (req, res) => {
  try {
    const { videoId } = req.params;
    const { limit = 20, offset = 0, sortBy = 'newest' } = req.query;
    
    let videoComments = comments.filter(comment => comment.videoId === videoId);
    
    // Ordenação
    switch (sortBy) {
      case 'oldest':
        videoComments.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        break;
      case 'popular':
        videoComments.sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes));
        break;
      case 'newest':
      default:
        videoComments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    // Paginação
    const start = parseInt(offset);
    const end = start + parseInt(limit);
    const paginatedComments = videoComments.slice(start, end);
    
    res.json({
      comments: paginatedComments,
      total: videoComments.length,
      hasMore: end < videoComments.length
    });
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    res.status(500).json({ error: 'Erro ao buscar comentários' });
  }
});

// POST /api/comments - Adicionar novo comentário
router.post('/', (req, res) => {
  try {
    const { videoId, authorName, content, parentId } = req.body;
    
    if (!videoId || !authorName || !content) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios ausentes',
        required: ['videoId', 'authorName', 'content']
      });
    }
    
    if (content.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Comentário não pode estar vazio'
      });
    }
    
    // Se é uma resposta a outro comentário
    if (parentId) {
      const parentComment = comments.find(c => c.id === parentId);
      
      if (!parentComment) {
        return res.status(404).json({ error: 'Comentário pai não encontrado' });
      }
      
      const newReply = {
        id: `${parentId}-${parentComment.replies.length + 1}`,
        authorName,
        authorAvatar: `/api/comments/avatar/${uuidv4()}`,
        content: content.trim(),
        timestamp: new Date().toISOString(),
        likes: 0,
        dislikes: 0
      };
      
      parentComment.replies.push(newReply);
      
      return res.status(201).json({
        message: 'Resposta adicionada com sucesso!',
        reply: newReply
      });
    }
    
    // Comentário principal
    const newComment = {
      id: uuidv4(),
      videoId,
      authorName,
      authorAvatar: `/api/comments/avatar/${uuidv4()}`,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      replies: []
    };
    
    comments.push(newComment);
    
    res.status(201).json({
      message: 'Comentário adicionado com sucesso!',
      comment: newComment
    });
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({ error: 'Erro ao adicionar comentário' });
  }
});

// PUT /api/comments/:id/like - Curtir comentário
router.put('/:id/like', (req, res) => {
  try {
    const { id } = req.params;
    
    // Procurar comentário principal
    let comment = comments.find(c => c.id === id);
    
    // Se não encontrou, procurar nas respostas
    if (!comment) {
      for (const mainComment of comments) {
        const reply = mainComment.replies.find(r => r.id === id);
        if (reply) {
          comment = reply;
          break;
        }
      }
    }
    
    if (!comment) {
      return res.status(404).json({ error: 'Comentário não encontrado' });
    }
    
    comment.likes += 1;
    
    res.json({ 
      message: 'Comentário curtido!',
      likes: comment.likes 
    });
  } catch (error) {
    console.error('Erro ao curtir comentário:', error);
    res.status(500).json({ error: 'Erro ao curtir comentário' });
  }
});

// PUT /api/comments/:id/dislike - Descurtir comentário
router.put('/:id/dislike', (req, res) => {
  try {
    const { id } = req.params;
    
    // Procurar comentário principal
    let comment = comments.find(c => c.id === id);
    
    // Se não encontrou, procurar nas respostas
    if (!comment) {
      for (const mainComment of comments) {
        const reply = mainComment.replies.find(r => r.id === id);
        if (reply) {
          comment = reply;
          break;
        }
      }
    }
    
    if (!comment) {
      return res.status(404).json({ error: 'Comentário não encontrado' });
    }
    
    comment.dislikes += 1;
    
    res.json({ 
      message: 'Comentário descurtido!',
      dislikes: comment.dislikes 
    });
  } catch (error) {
    console.error('Erro ao descurtir comentário:', error);
    res.status(500).json({ error: 'Erro ao descurtir comentário' });
  }
});

// GET /api/comments/avatar/:id - Obter avatar (mock)
router.get('/avatar/:id', (req, res) => {
  // Em produção, serviria avatares reais
  res.redirect('https://via.placeholder.com/40x40/007bff/ffffff?text=U');
});

// DELETE /api/comments/:id - Deletar comentário
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Procurar comentário principal
    const commentIndex = comments.findIndex(c => c.id === id);
    
    if (commentIndex !== -1) {
      comments.splice(commentIndex, 1);
      return res.json({ message: 'Comentário removido com sucesso!' });
    }
    
    // Procurar nas respostas
    for (const mainComment of comments) {
      const replyIndex = mainComment.replies.findIndex(r => r.id === id);
      if (replyIndex !== -1) {
        mainComment.replies.splice(replyIndex, 1);
        return res.json({ message: 'Resposta removida com sucesso!' });
      }
    }
    
    res.status(404).json({ error: 'Comentário não encontrado' });
  } catch (error) {
    console.error('Erro ao deletar comentário:', error);
    res.status(500).json({ error: 'Erro ao deletar comentário' });
  }
});

module.exports = router;