import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { FaThumbsUp, FaThumbsDown, FaShare, FaDownload } from 'react-icons/fa';
import { videosAPI, commentsAPI, channelsAPI } from '../services/api';

const VideoPageContainer = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const MainContent = styled.div`
  min-width: 0;
`;

const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
`;

const VideoPlayer = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const VideoNotFound = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #aaa;
  font-size: 18px;
  text-align: center;
`;

const VideoTitle = styled.h1`
  font-size: 20px;
  font-weight: 400;
  color: #fff;
  margin-bottom: 12px;
  line-height: 1.3;
`;

const VideoMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #303030;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const VideoStats = styled.div`
  color: #aaa;
  font-size: 14px;
`;

const VideoActions = styled.div`
  display: flex;
  gap: 8px;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: transparent;
  border: 1px solid #303030;
  border-radius: 18px;
  color: #aaa;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #3d3d3d;
    color: #fff;
    border-color: #aaa;
  }
  
  &.liked {
    color: #065fd4;
    border-color: #065fd4;
  }
  
  &.disliked {
    color: #ff0000;
    border-color: #ff0000;
  }
`;

const ChannelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #303030;
`;

const ChannelAvatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #333;
`;

const ChannelDetails = styled.div`
  flex: 1;
`;

const ChannelName = styled.h3`
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
  cursor: pointer;
  
  &:hover {
    color: #aaa;
  }
`;

const ChannelSubs = styled.p`
  color: #aaa;
  font-size: 12px;
`;

const SubscribeButton = styled.button`
  padding: 10px 16px;
  background-color: #ff0000;
  border: none;
  border-radius: 2px;
  color: #fff;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #cc0000;
  }
  
  &.subscribed {
    background-color: #606060;
    
    &:hover {
      background-color: #767676;
    }
  }
`;

const VideoDescription = styled.div`
  background-color: #272727;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
`;

const DescriptionText = styled.p`
  color: #fff;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
`;

const CommentsSection = styled.div`
  margin-top: 24px;
`;

const CommentsHeader = styled.h3`
  color: #fff;
  font-size: 16px;
  font-weight: 400;
  margin-bottom: 24px;
`;

const Sidebar = styled.div`
  @media (max-width: 1024px) {
    display: none;
  }
`;

const SidebarTitle = styled.h3`
  color: #fff;
  font-size: 16px;
  font-weight: 400;
  margin-bottom: 16px;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 60px 20px;
`;

const ErrorTitle = styled.h2`
  color: #fff;
  font-size: 24px;
  margin-bottom: 12px;
`;

const ErrorDescription = styled.p`
  color: #aaa;
  font-size: 16px;
  line-height: 1.5;
`;

function VideoPage() {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [channel, setChannel] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    loadVideo();
  }, [id]);

  const loadVideo = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar vídeo
      const videoResponse = await videosAPI.getById(id);
      const videoData = videoResponse.data;
      setVideo(videoData);

      // Carregar informações do canal
      try {
        const channelResponse = await channelsAPI.getById(videoData.channelId);
        setChannel(channelResponse.data);
      } catch (channelError) {
        console.error('Erro ao carregar canal:', channelError);
        // Continue mesmo se não conseguir carregar o canal
      }

      // Carregar comentários
      try {
        const commentsResponse = await commentsAPI.getByVideoId(id);
        setComments(commentsResponse.data.comments || []);
      } catch (commentsError) {
        console.error('Erro ao carregar comentários:', commentsError);
        // Continue mesmo se não conseguir carregar comentários
      }

    } catch (err) {
      console.error('Erro ao carregar vídeo:', err);
      if (err.response?.status === 404) {
        setError({
          title: 'Vídeo não encontrado',
          message: 'O vídeo que você está procurando não existe ou foi removido.'
        });
      } else {
        setError({
          title: 'Erro ao carregar vídeo',
          message: 'Ocorreu um erro ao tentar carregar o vídeo. Tente novamente mais tarde.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      await videosAPI.like(id);
      setLiked(!liked);
      if (disliked) setDisliked(false);
      
      // Atualizar contador local
      setVideo(prev => ({
        ...prev,
        likes: liked ? prev.likes - 1 : prev.likes + 1,
        dislikes: disliked ? prev.dislikes - 1 : prev.dislikes
      }));
    } catch (err) {
      console.error('Erro ao curtir vídeo:', err);
    }
  };

  const handleDislike = async () => {
    try {
      await videosAPI.dislike(id);
      setDisliked(!disliked);
      if (liked) setLiked(false);
      
      // Atualizar contador local
      setVideo(prev => ({
        ...prev,
        dislikes: disliked ? prev.dislikes - 1 : prev.dislikes + 1,
        likes: liked ? prev.likes - 1 : prev.likes
      }));
    } catch (err) {
      console.error('Erro ao descurtir vídeo:', err);
    }
  };

  const handleSubscribe = async () => {
    if (!channel) return;
    
    try {
      if (subscribed) {
        await channelsAPI.unsubscribe(channel.id);
      } else {
        await channelsAPI.subscribe(channel.id);
      }
      setSubscribed(!subscribed);
      
      // Atualizar contador local
      setChannel(prev => ({
        ...prev,
        subscribers: subscribed ? prev.subscribers - 1 : prev.subscribers + 1
      }));
    } catch (err) {
      console.error('Erro ao gerenciar inscrição:', err);
    }
  };

  const formatViews = (views) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views?.toString() || '0';
  };

  const formatSubscribers = (subs) => {
    if (subs >= 1000000) {
      return `${(subs / 1000000).toFixed(1)}M`;
    } else if (subs >= 1000) {
      return `${(subs / 1000).toFixed(1)}K`;
    }
    return subs?.toString() || '0';
  };

  if (loading) {
    return (
      <div className="loading">
        Carregando vídeo...
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage>
        <ErrorTitle>{error.title}</ErrorTitle>
        <ErrorDescription>{error.message}</ErrorDescription>
      </ErrorMessage>
    );
  }

  if (!video) {
    return (
      <ErrorMessage>
        <ErrorTitle>Vídeo não encontrado</ErrorTitle>
        <ErrorDescription>
          O vídeo que você está procurando não existe ou foi removido.
        </ErrorDescription>
      </ErrorMessage>
    );
  }

  return (
    <VideoPageContainer>
      <MainContent>
        <VideoContainer>
          {video.filename ? (
            <VideoPlayer controls>
              <source src={`/videos/${video.filename}`} type="video/mp4" />
              Seu navegador não suporta o elemento de vídeo.
            </VideoPlayer>
          ) : (
            <VideoNotFound>
              Vídeo não disponível
            </VideoNotFound>
          )}
        </VideoContainer>

        <VideoTitle>{video.title}</VideoTitle>

        <VideoMeta>
          <VideoStats>
            {formatViews(video.views)} visualizações
          </VideoStats>
          
          <VideoActions>
            <ActionButton 
              onClick={handleLike}
              className={liked ? 'liked' : ''}
            >
              <FaThumbsUp />
              {video.likes || 0}
            </ActionButton>
            
            <ActionButton 
              onClick={handleDislike}
              className={disliked ? 'disliked' : ''}
            >
              <FaThumbsDown />
              {video.dislikes || 0}
            </ActionButton>
            
            <ActionButton>
              <FaShare />
              Compartilhar
            </ActionButton>
            
            <ActionButton>
              <FaDownload />
              Download
            </ActionButton>
          </VideoActions>
        </VideoMeta>

        <ChannelInfo>
          <ChannelAvatar 
            src={channel ? `/api/channels/${channel.id}/avatar` : '#'}
            alt={video.channelName}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/48x48/333333/ffffff?text=CH';
            }}
          />
          
          <ChannelDetails>
            <ChannelName>{video.channelName}</ChannelName>
            <ChannelSubs>
              {channel ? formatSubscribers(channel.subscribers) : '0'} inscritos
            </ChannelSubs>
          </ChannelDetails>
          
          <SubscribeButton 
            onClick={handleSubscribe}
            className={subscribed ? 'subscribed' : ''}
          >
            {subscribed ? 'Inscrito' : 'Inscrever-se'}
          </SubscribeButton>
        </ChannelInfo>

        {video.description && (
          <VideoDescription>
            <DescriptionText>{video.description}</DescriptionText>
          </VideoDescription>
        )}

        <CommentsSection>
          <CommentsHeader>
            {comments.length} comentário{comments.length !== 1 ? 's' : ''}
          </CommentsHeader>
          
          {comments.length === 0 ? (
            <div style={{ color: '#aaa', textAlign: 'center', padding: '40px 0' }}>
              Nenhum comentário ainda. Seja o primeiro a comentar!
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} style={{ marginBottom: '16px' }}>
                {/* Componente de comentário seria implementado aqui */}
                <p style={{ color: '#fff' }}>{comment.content}</p>
                <small style={{ color: '#aaa' }}>Por {comment.authorName}</small>
              </div>
            ))
          )}
        </CommentsSection>
      </MainContent>

      <Sidebar>
        <SidebarTitle>Próximos vídeos</SidebarTitle>
        <div style={{ color: '#aaa', textAlign: 'center', padding: '40px 0' }}>
          Recomendações em breve...
        </div>
      </Sidebar>
    </VideoPageContainer>
  );
}

export default VideoPage;