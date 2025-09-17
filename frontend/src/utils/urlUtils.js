/**
 * Utilitários para URLs da aplicação
 */

// URL base do backend (sempre porta 3001)
export const BACKEND_BASE_URL = 'http://192.168.3.46:3001';

/**
 * Converte uma URL relativa ou absoluta para garantir que use o backend correto
 * @param {string} url - URL a ser convertida
 * @returns {string|null} - URL absoluta apontando para o backend
 */
export const getAbsoluteBackendUrl = (url) => {
  if (!url) return null;
  
  // Se já for uma URL completa com http/https, retorna como está
  if (url.startsWith('http')) {
    // Se for uma URL do localhost/127.0.0.1 na porta 3002, converte para 3001
    if (url.includes(':3002/api/')) {
      return url.replace(':3002/api/', ':3001/api/');
    }
    return url;
  }
  
  // Se começar com /, é uma URL relativa - adiciona o base URL do backend
  if (url.startsWith('/')) {
    return `${BACKEND_BASE_URL}${url}`;
  }
  
  // Qualquer outro caso, retorna como está
  return url;
};

/**
 * Gera URL de thumbnail garantindo que use o backend
 * @param {number|string} videoId - ID do vídeo
 * @returns {string} - URL completa da thumbnail
 */
export const getThumbnailUrl = (videoId) => {
  return `${BACKEND_BASE_URL}/api/direct-downloads/${videoId}/thumbnail`;
};

/**
 * Gera URL de stream garantindo que use o backend
 * @param {number|string} videoId - ID do vídeo
 * @returns {string} - URL completa do stream
 */
export const getStreamUrl = (videoId) => {
  return `${BACKEND_BASE_URL}/api/direct-downloads/${videoId}/stream`;
};

/**
 * Corrige URLs de thumbnail que podem estar apontando para a porta errada
 * @param {string} thumbnailUrl - URL da thumbnail a ser verificada
 * @param {number|string} videoId - ID do vídeo (fallback se URL estiver incorreta)
 * @returns {string} - URL corrigida da thumbnail
 */
export const fixThumbnailUrl = (thumbnailUrl, videoId) => {
  if (!thumbnailUrl) {
    return videoId ? getThumbnailUrl(videoId) : null;
  }
  
  // Se a URL contém :3002, corrige para :3001
  if (thumbnailUrl.includes(':3002/api/')) {
    return thumbnailUrl.replace(':3002/api/', ':3001/api/');
  }
  
  // Se é uma URL relativa, converte para absoluta
  if (thumbnailUrl.startsWith('/api/')) {
    return `${BACKEND_BASE_URL}${thumbnailUrl}`;
  }
  
  return getAbsoluteBackendUrl(thumbnailUrl);
};
