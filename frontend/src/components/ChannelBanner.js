import React, { useState } from 'react';
import styled from 'styled-components';
import { createBannerGradientDataUrl } from '../utils/avatarUtils';

const BannerContainer = styled.div`
  width: 100%;
  height: ${props => props.height}px;
  border-radius: ${props => props.rounded ? '12px' : '0'};
  overflow: hidden;
  position: relative;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.1) 0%,
      rgba(0, 0, 0, 0.3) 100%
    );
    z-index: 1;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.3s ease;
  }
`;

const BannerContent = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  
  ${props => props.children && `
    background: rgba(0, 0, 0, 0.2);
  `}
`;

const ChannelBanner = ({
  src,
  channelName = '',
  height = 200,
  rounded = true,
  children,
  className,
  alt,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const fallbackSrc = createBannerGradientDataUrl(channelName, 1200, height);
  
  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };
  
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };
  
  const showFallback = !src || imageError;
  const backgroundImage = showFallback ? `url(${fallbackSrc})` : (imageLoaded ? `url(${src})` : `url(${fallbackSrc})`);
  
  return (
    <BannerContainer
      height={height}
      rounded={rounded}
      className={className}
      style={{
        backgroundImage,
      }}
      {...props}
    >
      {src && !showFallback && (
        <img
          src={src}
          alt={alt || `Banner do canal ${channelName}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{ 
            opacity: imageLoaded ? 1 : 0,
          }}
        />
      )}
      
      {children && (
        <BannerContent children={children}>
          {children}
        </BannerContent>
      )}
    </BannerContainer>
  );
};

export default ChannelBanner;
