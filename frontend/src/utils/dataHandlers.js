// Utilitários para tratamento de dados ausentes

export const handleMissingData = {
  // Tratamento para vídeos ausentes
  video: (video) => {
    if (!video) {
      return {
        id: null,
        title: 'Vídeo não encontrado',
        description: 'Este vídeo não está disponível',
        thumbnail: 'https://via.placeholder.com/320x180/333333/ffffff?text=Video+Indisponivel',
        duration: '0:00',
        views: 0,
        likes: 0,
        dislikes: 0,
        channelId: null,
        channelName: 'Canal desconhecido',
        uploadDate: new Date().toISOString(),
        tags: [],
        filename: null
      };
    }

    return {
      ...video,
      title: video.title || 'Título não disponível',
      description: video.description || 'Sem descrição disponível',
      thumbnail: video.thumbnail || 'https://via.placeholder.com/320x180/333333/ffffff?text=XandTube',
      duration: video.duration || '0:00',
      views: video.views || 0,
      likes: video.likes || 0,
      dislikes: video.dislikes || 0,
      channelName: video.channelName || 'Canal desconhecido',
      uploadDate: video.uploadDate || new Date().toISOString(),
      tags: video.tags || []
    };
  },

  // Tratamento para canais ausentes
  channel: (channel) => {
    if (!channel) {
      return {
        id: null,
        name: 'Canal não encontrado',
        description: 'Este canal não está disponível',
        avatar: 'https://via.placeholder.com/150x150/333333/ffffff?text=Canal+Indisponivel',
        banner: 'https://via.placeholder.com/1920x480/666666/ffffff?text=Canal+Indisponivel',
        subscribers: 0,
        totalViews: 0,
        videoCount: 0,
        createdAt: new Date().toISOString(),
        verified: false
      };
    }

    return {
      ...channel,
      name: channel.name || 'Canal sem nome',
      description: channel.description || 'Sem descrição disponível',
      subscribers: channel.subscribers || 0,
      totalViews: channel.totalViews || 0,
      videoCount: channel.videoCount || 0,
      createdAt: channel.createdAt || new Date().toISOString(),
      verified: channel.verified || false
    };
  },

  // Tratamento para comentários ausentes
  comment: (comment) => {
    if (!comment) {
      return {
        id: null,
        videoId: null,
        authorName: 'Usuário desconhecido',
        authorAvatar: 'https://via.placeholder.com/40x40/333333/ffffff?text=U',
        content: 'Comentário não disponível',
        timestamp: new Date().toISOString(),
        likes: 0,
        dislikes: 0,
        replies: []
      };
    }

    return {
      ...comment,
      authorName: comment.authorName || 'Usuário desconhecido',
      content: comment.content || 'Comentário removido',
      timestamp: comment.timestamp || new Date().toISOString(),
      likes: comment.likes || 0,
      dislikes: comment.dislikes || 0,
      replies: comment.replies || []
    };
  },

  // Verificar se dados estão válidos
  isValidVideo: (video) => {
    return video && video.id && video.title && video.filename;
  },

  isValidChannel: (channel) => {
    return channel && channel.id && channel.name;
  },

  isValidComment: (comment) => {
    return comment && comment.id && comment.content;
  },

  // Formatação segura de números
  formatViews: (views) => {
    const num = parseInt(views) || 0;
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  },

  formatSubscribers: (subs) => {
    const num = parseInt(subs) || 0;
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  },

  // Formatação segura de datas
  formatDate: (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Data desconhecida';
      }
      
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        return 'há 1 dia';
      } else if (diffDays < 7) {
        return `há ${diffDays} dias`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `há ${weeks} semana${weeks > 1 ? 's' : ''}`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `há ${months} mês${months > 1 ? 'es' : ''}`;
      } else {
        const years = Math.floor(diffDays / 365);
        return `há ${years} ano${years > 1 ? 's' : ''}`;
      }
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  },

  // Estados de erro padronizados
  errors: {
    VIDEO_NOT_FOUND: {
      title: 'Vídeo não encontrado',
      message: 'O vídeo que você está procurando não existe ou foi removido.',
      action: 'Voltar para início'
    },
    CHANNEL_NOT_FOUND: {
      title: 'Canal não encontrado',
      message: 'O canal que você está procurando não existe.',
      action: 'Explorar canais'
    },
    NETWORK_ERROR: {
      title: 'Erro de conexão',
      message: 'Verifique sua conexão com a internet e tente novamente.',
      action: 'Tentar novamente'
    },
    SERVER_ERROR: {
      title: 'Erro do servidor',
      message: 'Ocorreu um problema no servidor. Tente novamente mais tarde.',
      action: 'Recarregar página'
    },
    NO_VIDEOS: {
      title: 'Nenhum vídeo encontrado',
      message: 'Não há vídeos disponíveis no momento.',
      action: 'Fazer upload'
    }
  }
};

// Hook personalizado para tratamento de erros da API
export const useApiError = () => {
  const getErrorMessage = (error) => {
    if (!error) return null;

    // Erro de rede
    if (!error.response) {
      return handleMissingData.errors.NETWORK_ERROR;
    }

    // Erro baseado no status HTTP
    switch (error.response.status) {
      case 404:
        return {
          title: 'Não encontrado',
          message: error.response.data?.message || 'O recurso solicitado não foi encontrado.',
          action: 'Voltar'
        };
      case 500:
        return handleMissingData.errors.SERVER_ERROR;
      default:
        return {
          title: 'Erro',
          message: error.response.data?.message || 'Ocorreu um erro inesperado.',
          action: 'Tentar novamente'
        };
    }
  };

  return { getErrorMessage };
};

export default handleMissingData;