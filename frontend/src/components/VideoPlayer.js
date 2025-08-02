import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FaPlay, 
  FaPause, 
  FaVolumeUp, 
  FaVolumeDown, 
  FaVolumeMute, 
  FaExpand, 
  FaCompress,
  FaCog,
  FaTimes,
  FaYoutube,
  FaDownload
} from 'react-icons/fa';

const VideoPlayerContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);

  /* Mobile */
  @media (max-width: 768px) {
    border-radius: 0;
    margin: 0;
    box-shadow: none;
    max-width: 100%;
    width: 100%;
  }

  @media (max-width: 480px) {
    margin: 0;
    width: 100%;
  }

  /* TV/Large screens */
  @media (min-width: 1920px) {
    max-width: 1600px;
    border-radius: 12px;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6);
  }
  
  @media (min-width: 2560px) {
    max-width: 2200px;
    border-radius: 16px;
    box-shadow: 0 12px 60px rgba(0, 0, 0, 0.7);
  }
`;

const Video = styled.video`
  width: 100%;
  height: auto;
  display: block;
  max-height: 70vh;
  min-height: 200px;

  /* Mobile */
  @media (max-width: 768px) {
    max-height: 60vh;
    min-height: 250px;
  }

  @media (max-width: 480px) {
    max-height: 55vh;
    min-height: 220px;
  }

  /* TV/Large screens */
  @media (min-width: 1920px) {
    max-height: 80vh;
  }
  
  @media (min-width: 2560px) {
    max-height: 85vh;
  }
`;

const Controls = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  padding: 20px 15px 15px 15px;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.3s ease;
  z-index: 10;

  /* Mobile */
  @media (max-width: 768px) {
    padding: 15px 10px 10px 10px;
    /* Always show on mobile for better UX */
    opacity: 1;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
  }

  @media (max-width: 480px) {
    padding: 12px 8px 8px 8px;
  }
`;

const ProgressContainer = styled.div`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  margin-bottom: 15px;
  cursor: pointer;
  position: relative;

  /* Mobile - larger touch target */
  @media (max-width: 768px) {
    height: 6px;
    margin-bottom: 12px;
    /* Add invisible padding for easier touch */
    &::before {
      content: '';
      position: absolute;
      top: -10px;
      bottom: -10px;
      left: 0;
      right: 0;
    }
  }

  @media (max-width: 480px) {
    height: 8px;
    margin-bottom: 10px;
  }
`;

const ProgressBar = styled.div`
  height: 100%;
  background: #ff0000;
  border-radius: 2px;
  width: ${props => props.progress}%;
  transition: width 0.1s ease;
`;

const ProgressThumb = styled.div`
  position: absolute;
  top: -4px;
  right: -6px;
  width: 12px;
  height: 12px;
  background: #ff0000;
  border-radius: 50%;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.2s ease;
`;

const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  /* Mobile */
  @media (max-width: 768px) {
    gap: 8px;
  }

  @media (max-width: 480px) {
    gap: 4px;
  }
`;

const LeftControls = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const RightControls = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const ControlButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: ${props => props.large ? '20px' : '16px'};
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  min-width: 40px;
  min-height: 40px;
  
  &:hover, &:focus {
    background: rgba(255, 255, 255, 0.2);
    outline: 2px solid rgba(255, 255, 255, 0.5);
    outline-offset: 2px;
  }
  
  &:active {
    transform: scale(0.95);
  }

  /* Mobile */
  @media (max-width: 768px) {
    font-size: ${props => props.large ? '24px' : '18px'};
    padding: 12px;
    min-width: 48px;
    min-height: 48px;
  }

  /* TV/Large screens */
  @media (min-width: 1920px) {
    font-size: ${props => props.large ? '28px' : '22px'};
    padding: 12px;
    min-width: 56px;
    min-height: 56px;
    border-radius: 6px;
    
    &:hover, &:focus {
      outline: 3px solid rgba(255, 255, 255, 0.6);
      outline-offset: 3px;
    }
  }
  
  @media (min-width: 2560px) {
    font-size: ${props => props.large ? '32px' : '26px'};
    padding: 16px;
    min-width: 64px;
    min-height: 64px;
    border-radius: 8px;
    
    &:hover, &:focus {
      outline: 4px solid rgba(255, 255, 255, 0.7);
      outline-offset: 4px;
    }
  }
`;

const VolumeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  /* Mobile - hide volume controls */
  @media (max-width: 768px) {
    display: none;
  }
`;

const VolumeSlider = styled.input`
  width: 60px;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  outline: none;
  border-radius: 2px;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    background: #ff0000;
    border-radius: 50%;
    cursor: pointer;
  }
  
  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: #ff0000;
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }
`;

const TimeDisplay = styled.span`
  color: white;
  font-size: 14px;
  font-family: monospace;
  min-width: 100px;

  /* Mobile */
  @media (max-width: 768px) {
    font-size: 14px;
    min-width: 85px;
  }

  @media (max-width: 480px) {
    font-size: 13px;
    min-width: 75px;
  }
`;

const VideoInfo = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(rgba(0, 0, 0, 0.8), transparent);
  padding: 20px;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.3s ease;
  z-index: 10;
  pointer-events: none;

  /* Mobile */
  @media (max-width: 768px) {
    padding: 15px 12px;
    /* Always show on mobile for better UX */
    opacity: 1;
    background: linear-gradient(rgba(0, 0, 0, 0.9), transparent);
    position: absolute;
    max-height: 50%;
    overflow: hidden;
  }

  @media (max-width: 480px) {
    padding: 10px 8px;
    max-height: 45%;
  }
`;

const VideoTitle = styled.h2`
  color: white;
  font-size: 20px;
  margin: 0 0 8px 0;
  font-weight: 500;
  line-height: 1.3;
  pointer-events: all;

  /* Mobile */
  @media (max-width: 768px) {
    font-size: 16px;
    margin: 0 0 4px 0;
    line-height: 1.2;
    max-height: 2.4em;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  @media (max-width: 480px) {
    font-size: 14px;
    margin: 0 0 3px 0;
    max-height: 2.4em;
  }
`;

const VideoMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  pointer-events: all;

  /* Mobile */
  @media (max-width: 768px) {
    gap: 8px;
    font-size: 12px;
    flex-wrap: wrap;
    align-items: flex-start;
  }

  @media (max-width: 480px) {
    gap: 6px;
    font-size: 11px;
    flex-direction: column;
    align-items: flex-start;
  }
`;

const ChannelName = styled.span`
  color: #ff0000;
  font-weight: 500;
`;

const ActionButtons = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.3s ease;
  pointer-events: all;

  /* Mobile */
  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
    gap: 6px;
    /* Always show on mobile */
    opacity: 1;
  }

  @media (max-width: 480px) {
    top: 8px;
    right: 8px;
    gap: 4px;
    flex-direction: column;
  }
`;

const ActionButton = styled.button`
  background: rgba(0, 0, 0, 0.7);
  border: none;
  color: white;
  padding: 12px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.1);
  }

  /* Mobile */
  @media (max-width: 768px) {
    padding: 14px;
    font-size: 18px;
    background: rgba(0, 0, 0, 0.8);
    
    &:active {
      background: rgba(0, 0, 0, 0.9);
      transform: scale(0.95);
    }
  }

  @media (max-width: 480px) {
    padding: 16px;
    font-size: 20px;
  }
`;

const CenterPlayButton = styled.button`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  border: none;
  color: white;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  font-size: 30px;
  cursor: pointer;
  opacity: ${props => props.visible ? 1 : 0};
  transition: all 0.3s ease;
  z-index: 15;
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: translate(-50%, -50%) scale(1.1);
  }

  /* Mobile */
  @media (max-width: 768px) {
    width: 70px;
    height: 70px;
    font-size: 26px;
    
    &:active {
      background: rgba(0, 0, 0, 0.9);
      transform: translate(-50%, -50%) scale(0.95);
    }
  }

  @media (max-width: 480px) {
    width: 60px;
    height: 60px;
    font-size: 22px;
  }
`;

const VideoPlayer = ({ video }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showCenterPlay, setShowCenterPlay] = useState(true);
  
  // Timer para esconder controles
  const hideControlsTimer = useRef(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setShowCenterPlay(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
      setShowCenterPlay(true);
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
    };
  }, []);

  // Auto-hide controls
  useEffect(() => {
    if (isPlaying && showControls) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    };
  }, [isPlaying, showControls]);

  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play();
    }
  };

  const handleProgressClick = (e) => {
    const progressContainer = e.currentTarget;
    const rect = progressContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = clickX / rect.width;
    const newTime = clickPercent * duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      videoRef.current.volume = volume;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return FaVolumeMute;
    if (volume < 0.5) return FaVolumeDown;
    return FaVolumeUp;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const VolumeIcon = getVolumeIcon();

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
  };

  const openYoutube = () => {
    if (video.originalUrl) {
      window.open(video.originalUrl, '_blank');
    }
  };

  return (
    <VideoPlayerContainer 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <Video
        ref={videoRef}
        src={video.videoUrl}
        poster={video.thumbnailUrl}
        preload="metadata"
        onClick={togglePlay}
      />
      
      {/* Video Info */}
      <VideoInfo visible={showControls}>
        <VideoTitle>{video.title}</VideoTitle>
        <VideoMeta>
          <ChannelName>{video.channelName}</ChannelName>
          <span>{video.viewCount?.toLocaleString()} visualizações</span>
          <span>{video.resolution}</span>
          <span>{video.fileSizeFormatted}</span>
        </VideoMeta>
      </VideoInfo>

      {/* Action Buttons */}
      <ActionButtons visible={showControls}>
        <ActionButton 
          onClick={openYoutube}
          title="Abrir no YouTube"
        >
          <FaYoutube />
        </ActionButton>
        <ActionButton 
          title="Fechar player"
          onClick={() => window.history.back()}
        >
          <FaTimes />
        </ActionButton>
      </ActionButtons>

      {/* Center Play Button */}
      <CenterPlayButton
        visible={showCenterPlay && !isPlaying}
        onClick={togglePlay}
      >
        <FaPlay />
      </CenterPlayButton>

      {/* Controls */}
      <Controls visible={showControls}>
        <ProgressContainer onClick={handleProgressClick}>
          <ProgressBar progress={progress}>
            <ProgressThumb visible={showControls} />
          </ProgressBar>
        </ProgressContainer>
        
        <ControlsRow>
          <LeftControls>
            <ControlButton onClick={togglePlay} large>
              {isPlaying ? <FaPause /> : <FaPlay />}
            </ControlButton>
            
            <VolumeContainer>
              <ControlButton onClick={toggleMute}>
                <VolumeIcon />
              </ControlButton>
              <VolumeSlider
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
              />
            </VolumeContainer>
            
            <TimeDisplay>
              {formatTime(currentTime)} / {formatTime(duration)}
            </TimeDisplay>
          </LeftControls>
          
          <RightControls>
            <ControlButton onClick={toggleFullscreen}>
              {isFullscreen ? <FaCompress /> : <FaExpand />}
            </ControlButton>
          </RightControls>
        </ControlsRow>
      </Controls>
    </VideoPlayerContainer>
  );
};

export default VideoPlayer;