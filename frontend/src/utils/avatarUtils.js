/**
 * Utilitários para gerar avatares e imagens de fallback
 */

// Paleta de cores para gradientes
const colorPalettes = [
  ['#FF6B6B', '#4ECDC4'], // Vermelho para verde-azulado
  ['#A8E6CF', '#FF8B94'], // Verde claro para rosa
  ['#FFD93D', '#6BCF7F'], // Amarelo para verde
  ['#4ECDC4', '#45B7D1'], // Verde-azulado para azul
  ['#96CEB4', '#FFEAA7'], // Verde para amarelo claro
  ['#DDA0DD', '#98D8C8'], // Lavanda para menta
  ['#F7DC6F', '#BB8FCE'], // Amarelo para roxo
  ['#85C1E9', '#F8C471'], // Azul claro para laranja claro
  ['#F1948A', '#82E0AA'], // Rosa para verde claro
  ['#D7BDE2', '#A3E4D7'], // Roxo claro para verde-azulado claro
  ['#FAD7A0', '#AED6F1'], // Pêssego para azul claro
  ['#ABEBC6', '#F9E79F'], // Verde claro para amarelo
];

/**
 * Gera um hash simples de uma string
 */
function hashString(str) {
  let hash = 0;
  if (!str || str.length === 0) return hash;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Converte para 32bit
  }
  
  return Math.abs(hash);
}

/**
 * Obtém as iniciais de um nome
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') return '??';
  
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  
  return words
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

/**
 * Gera um gradiente baseado no nome
 */
export function getGradientColors(name) {
  const hash = hashString(name || '');
  const paletteIndex = hash % colorPalettes.length;
  return colorPalettes[paletteIndex];
}

/**
 * Cria um CSS de gradiente baseado no nome
 */
export function createGradientStyle(name, direction = '135deg') {
  const [color1, color2] = getGradientColors(name);
  return {
    background: `linear-gradient(${direction}, ${color1}, ${color2})`,
  };
}

/**
 * Cria uma URL de data para usar como src de imagem
 */
export function createGradientDataUrl(name, width = 120, height = 120) {
  const initials = getInitials(name);
  const [color1, color2] = getGradientColors(name);
  
  // Cria um canvas para gerar a imagem
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Cria o gradiente
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);
  
  // Preenche o fundo
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Adiciona as iniciais
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.floor(width * 0.4)}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Adiciona sombra no texto para melhor legibilidade
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  
  ctx.fillText(initials, width / 2, height / 2);
  
  return canvas.toDataURL();
}

/**
 * Cria uma imagem de banner com gradiente
 */
export function createBannerGradientDataUrl(name, width = 1200, height = 200) {
  const [color1, color2] = getGradientColors(name);
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Cria um gradiente horizontal para banner
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(0.5, color2);
  gradient.addColorStop(1, color1);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Adiciona um overlay sutil
  const overlayGradient = ctx.createLinearGradient(0, 0, 0, height);
  overlayGradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
  overlayGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
  
  ctx.fillStyle = overlayGradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
}

/**
 * Hook para usar avatar com fallback automático
 */
export function useAvatarFallback(name, originalSrc) {
  const fallbackSrc = createGradientDataUrl(name);
  
  return {
    src: originalSrc || fallbackSrc,
    fallbackSrc,
    onError: (e) => {
      if (e.target.src !== fallbackSrc) {
        e.target.src = fallbackSrc;
      }
    }
  };
}

/**
 * Hook para usar banner com fallback automático
 */
export function useBannerFallback(name, originalSrc) {
  const fallbackSrc = createBannerGradientDataUrl(name);
  
  return {
    src: originalSrc || fallbackSrc,
    fallbackSrc,
    onError: (e) => {
      if (e.target.src !== fallbackSrc) {
        e.target.src = fallbackSrc;
      }
    }
  };
}
