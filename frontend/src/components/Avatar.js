import React, { useState } from 'react';
import styled from 'styled-components';
import { createGradientStyle, getInitials } from '../utils/avatarUtils';

const AvatarContainer = styled.div`
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  border-radius: ${props => props.round ? '50%' : '8px'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  position: relative;
  font-size: ${props => Math.floor(props.size * 0.4)}px;
  transition: transform 0.2s ease;
  border: ${props => props.border ? `${props.borderWidth || 2}px solid ${props.borderColor || '#fff'}` : 'none'};
  
  &:hover {
    transform: ${props => props.hover ? 'scale(1.05)' : 'none'};
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    top: 0;
    left: 0;
  }
  
  .initials {
    position: relative;
    z-index: 1;
    user-select: none;
  }
`;

const Avatar = ({
  src,
  name = '',
  size = 40,
  round = true,
  border = false,
  borderWidth = 2,
  borderColor = '#fff',
  hover = false,
  onClick,
  className,
  alt,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const initials = getInitials(name);
  const gradientStyle = createGradientStyle(name);
  
  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };
  
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };
  
  const showFallback = !src || imageError || !imageLoaded;
  
  return (
    <AvatarContainer
      size={size}
      round={round}
      border={border}
      borderWidth={borderWidth}
      borderColor={borderColor}
      hover={hover}
      onClick={onClick}
      className={className}
      style={{
        ...gradientStyle,
        cursor: onClick ? 'pointer' : 'default',
      }}
      {...props}
    >
      {src && !imageError && (
        <img
          src={src}
          alt={alt || name}
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{ 
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}
      

    </AvatarContainer>
  );
};

export default Avatar;
