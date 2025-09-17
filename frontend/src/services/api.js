import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutos
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para logging de erros e autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Erro na API:', error.response?.data || error.message);
    
    // Se erro 401, redireciona para login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Videos API
export const videosAPI = {
  getAll: (params = {}) => api.get('/videos', { params }),
  getById: (id) => api.get(`/videos/${id}`),
  upload: (formData) => api.post('/videos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  like: (id) => api.put(`/videos/${id}/like`),
  dislike: (id) => api.put(`/videos/${id}/dislike`),
  delete: (id) => api.delete(`/videos/${id}`)
};

// Channels API
export const channelsAPI = {
  getAll: (params = {}) => api.get('/channels', { params }),
  getById: (id) => api.get(`/channels/${id}`),
  create: (data) => api.post('/channels', data),
  update: (id, data) => api.put(`/channels/${id}`, data),
  subscribe: (id) => api.put(`/channels/${id}/subscribe`),
  unsubscribe: (id) => api.put(`/channels/${id}/unsubscribe`),
  delete: (id) => api.delete(`/channels/${id}`)
};

// Comments API
export const commentsAPI = {
  getByVideoId: (videoId, params = {}) => api.get(`/comments/${videoId}`, { params }),
  create: (data) => api.post('/comments', data),
  like: (id) => api.put(`/comments/${id}/like`),
  dislike: (id) => api.put(`/comments/${id}/dislike`),
  delete: (id) => api.delete(`/comments/${id}`)
};

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  logout: () => api.post('/auth/logout')
};

// Download API
export const downloadAPI = {
  getInfo: (url) => api.get('/download/info', { params: { url } }),
  getFormats: (url) => api.get('/download/formats', { params: { url } }),
  downloadVideo: (data) => api.post('/download/video', data),
  downloadPlaylist: (data) => api.post('/download/playlist', data),
  getProgress: (downloadId) => api.get(`/download/progress/${downloadId}`),
  cancelDownload: (downloadId) => api.delete(`/download/cancel/${downloadId}`),
  getHistory: () => api.get('/download/history')
};

// API pública para downloads (sem autenticação)
const publicAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000 // 2 minutos
});

// Downloads salvos API (direta - sem banco de dados, acesso público)
export const downloadsAPI = {
  list: (page = 1, limit = 20, search = null) => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append('search', search);
    return publicAPI.get(`/direct-downloads?${params}`);
  },
  listAll: (page = 1, limit = 20, search = null) => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append('search', search);
    return publicAPI.get(`/direct-downloads/all?${params}`);
  },
  get: (id) => publicAPI.get(`/direct-downloads/${id}`),
  deleteFiles: (id) => publicAPI.delete(`/direct-downloads/${id}/files`), // Agora público também
  stats: () => publicAPI.get('/direct-downloads/stats'),
  scan: () => publicAPI.get('/direct-downloads/scan/folder'),
  clearCache: () => publicAPI.post('/direct-downloads/cache/clear'),
  flushAndReload: async () => {
    // Primeiro limpa o cache
    await publicAPI.post('/direct-downloads/cache/clear');
    // Depois escaneia a pasta para recarregar
    return publicAPI.get('/direct-downloads/scan/folder');
  },
  thumbnail: (id) => `${API_BASE_URL.replace('/api', '')}/api/direct-downloads/${id}/thumbnail`,
  stream: (id) => `${API_BASE_URL.replace('/api', '')}/api/direct-downloads/${id}/stream`,
  // Métodos de conveniência
  search: (query, page = 1, limit = 20) => {
    return publicAPI.get(`/direct-downloads?search=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
  }
};

// Recommendations API
export const recommendationsAPI = {
  getForVideo: (videoId, limit = 10) => api.get(`/recommendations/${videoId}`, { params: { limit } }),
  getPopular: (limit = 10) => api.get('/recommendations', { params: { limit } })
};

// Advanced Search API
export const searchAPI = {
  search: (query, options = {}) => {
    const params = {
      q: query,
      page: options.page || 1,
      limit: options.limit || 20,
      sortBy: options.sortBy || 'relevance',
      sortOrder: options.sortOrder || 'DESC',
      includeMetadata: options.includeMetadata !== false ? 'true' : 'false'
    };
    
    // Add filters
    if (options.category) params.category = options.category;
    if (options.source) params.source = options.source;
    if (options.dateFrom) params.dateFrom = options.dateFrom;
    if (options.dateTo) params.dateTo = options.dateTo;
    
    return api.get('/search', { params });
  },
  
  getSuggestions: (query, limit = 10) => api.get('/search/suggestions', { 
    params: { q: query, limit } 
  }),
  
  getFilters: () => api.get('/search/filters'),
  
  getStats: () => api.get('/search/stats')
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;