import React, { createContext, useContext, useState, useEffect } from 'react';

// Configurações padrão
const defaultSettings = {
  theme: 'dark', // Modo escuro como padrão
  language: 'pt' // Português como padrão
};

// Textos de tradução
const translations = {
  pt: {
    // Navegação
    home: 'Início',
    trending: 'Em alta',
    channels: 'Canais',
    library: 'Biblioteca',
    likedVideos: 'Vídeos curtidos',
    history: 'Histórico',
    downloads: 'Baixar Vídeos',
    movies: 'Filmes e programas',
    upload: 'Upload',
    createChannel: 'Criar Canal',
    settings: 'Configurações',
    
    // Configurações
    settingsTitle: 'Configurações',
    appearance: 'Aparência',
    language: 'Idioma',
    theme: 'Tema',
    darkMode: 'Modo Escuro',
    lightMode: 'Modo Claro',
    portuguese: 'Português',
    english: 'Inglês',
    save: 'Salvar',
    cancel: 'Cancelar',
    
    // Geral
    search: 'Pesquisar',
    loading: 'Carregando...',
    error: 'Erro',
    success: 'Sucesso',
    settingsSaved: 'Configurações salvas com sucesso!',
    seeAll: 'Ver todos',
    goToHome: 'Ir para Início',
    uploadVideo: 'Enviar Vídeo',
    whatCanYouDo: 'O que você pode fazer?',
    
    // Downloads
    yourDownloads: 'Seus Downloads',
    noDownloadsFound: 'Nenhum download encontrado',
    downloadDescription: 'Seus downloads do YouTube aparecerão aqui. Vá até a página de Download para baixar vídeos.',
    searchResults: 'Resultados da Busca',
    searchResultsFor: 'Resultados da busca por:',
    videosFound: 'vídeo encontrado',
    videosFoundPlural: 'vídeos encontrados',
    loadingDownloads: 'Carregando downloads...',
    errorLoadingDownloads: 'Erro ao carregar downloads',
    noResultsFound: 'Nenhum resultado encontrado',
    tryOtherTerms: 'Tente pesquisar com outros termos.',
    loadMore: 'Carregar Mais',
    
    // Estatísticas de Downloads
    totalDownloads: 'Total de Downloads',
    completed: 'Concluídos',
    spaceUsed: 'Espaço Utilizado',
    showingInList: 'Exibindo na Lista',
    scanDownloadsFolder: 'Escanear Pasta de Downloads',
    scanning: 'Escaneando...',
    scanFolder: 'Escanear Pasta',
    
    // Página de Download
    downloadYouTubeVideos: 'Baixar Vídeos do YouTube',
    downloadToolDescription: 'Use esta ferramenta para baixar vídeos e playlists do YouTube. Os vídeos serão salvos em sua biblioteca pessoal.',
    pasteVideoUrl: 'Cole a URL do vídeo ou playlist do YouTube aqui...',
    analyze: 'Analisar',
    analyzing: 'Analisando...',
    downloadQuality: 'Qualidade do Download',
    bestQuality: 'Melhor Qualidade',
    downloadVideo: 'Baixar Vídeo',
    saveToLibrary: 'Salvar na Biblioteca',
    onlyDownload: 'Apenas Baixar',
    downloading: 'Baixando...',
    channel: 'Canal',
    duration: 'Duração',
    views: 'visualizações',
    subscribers: 'inscritos',
    downloadProgress: 'Progresso do Download',
    complete: 'completo',
    downloadedOn: 'Baixado em',
    recommendations: 'Recomendações',
    goBack: 'Voltar',
    loadingRecommendations: 'Carregando recomendações...',
    recommendationsSoon: 'Recomendações em breve...',
    popularVideos: 'Vídeos Populares',
    backToChannels: 'Voltar aos Canais',
    
    // Páginas de erro
    pageNotFound: 'Página não encontrada',
    pageNotFoundDescription: 'Ops! A página que você está procurando não existe ou foi movida. Verifique se a URL está correta ou navegue para uma das opções abaixo.',
    goBackHome: 'Volte para a página inicial e descubra vídeos em destaque',
    useSearch: 'Use a busca para encontrar vídeos específicos',
    uploadAndShare: 'Faça upload de um vídeo e compartilhe seu conteúdo',
    
    // Canais
    channelsDescription: 'Descubra canais incríveis e suas melhores criações',
    searchChannels: 'Buscar canais...',
    noChannelsAvailable: 'Nenhum canal disponível',
    noChannelsRegistered: 'Ainda não há canais cadastrados no sistema.',
    noChannelFound: 'Nenhum canal encontrado',
    searchTip: 'Tente ajustar sua busca ou explore outros termos.',
    
    // Estatísticas
    subscribers: 'Inscritos',
    videos: 'Vídeos',
    views: 'Visualizações',
    verified: 'Canal verificado',
    noDescription: 'Sem descrição',
    
    // Mais do XandTube
    moreFromXandTube: 'Mais do XandTube'
  },
  en: {
    // Navigation
    home: 'Home',
    trending: 'Trending',
    channels: 'Channels',
    library: 'Library',
    likedVideos: 'Liked Videos',
    history: 'History',
    downloads: 'Download Videos',
    movies: 'Movies & Shows',
    upload: 'Upload',
    createChannel: 'Create Channel',
    settings: 'Settings',
    
    // Settings
    settingsTitle: 'Settings',
    appearance: 'Appearance',
    language: 'Language',
    theme: 'Theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    portuguese: 'Portuguese',
    english: 'English',
    save: 'Save',
    cancel: 'Cancel',
    
    // General
    search: 'Search',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    settingsSaved: 'Settings saved successfully!',
    seeAll: 'See all',
    goToHome: 'Go to Home',
    uploadVideo: 'Upload Video',
    whatCanYouDo: 'What can you do?',
    
    // Downloads
    yourDownloads: 'Your Downloads',
    noDownloadsFound: 'No downloads found',
    downloadDescription: 'Your YouTube downloads will appear here. Go to the Download page to download videos.',
    searchResults: 'Search Results',
    searchResultsFor: 'Search results for:',
    videosFound: 'video found',
    videosFoundPlural: 'videos found',
    loadingDownloads: 'Loading downloads...',
    errorLoadingDownloads: 'Error loading downloads',
    noResultsFound: 'No results found',
    tryOtherTerms: 'Try searching with other terms.',
    loadMore: 'Load More',
    
    // Download Statistics
    totalDownloads: 'Total Downloads',
    completed: 'Completed',
    spaceUsed: 'Space Used',
    showingInList: 'Showing in List',
    scanDownloadsFolder: 'Scan Downloads Folder',
    scanning: 'Scanning...',
    scanFolder: 'Scan Folder',
    
    // Download Page
    downloadYouTubeVideos: 'Download YouTube Videos',
    downloadToolDescription: 'Use this tool to download YouTube videos and playlists. Videos will be saved to your personal library.',
    pasteVideoUrl: 'Paste the YouTube video or playlist URL here...',
    analyze: 'Analyze',
    analyzing: 'Analyzing...',
    downloadQuality: 'Download Quality',
    bestQuality: 'Best Quality',
    downloadVideo: 'Download Video',
    saveToLibrary: 'Save to Library',
    onlyDownload: 'Download Only',
    downloading: 'Downloading...',
    channel: 'Channel',
    duration: 'Duration',
    views: 'views',
    subscribers: 'subscribers',
    downloadProgress: 'Download Progress',
    complete: 'complete',
    downloadedOn: 'Downloaded on',
    recommendations: 'Recommendations',
    goBack: 'Go Back',
    loadingRecommendations: 'Loading recommendations...',
    recommendationsSoon: 'Recommendations coming soon...',
    popularVideos: 'Popular Videos',
    backToChannels: 'Back to Channels',
    
    // Error pages
    pageNotFound: 'Page not found',
    pageNotFoundDescription: 'Oops! The page you are looking for does not exist or has been moved. Check if the URL is correct or navigate to one of the options below.',
    goBackHome: 'Go back to the home page and discover featured videos',
    useSearch: 'Use search to find specific videos',
    uploadAndShare: 'Upload a video and share your content',
    
    // Channels
    channelsDescription: 'Discover amazing channels and their best creations',
    searchChannels: 'Search channels...',
    noChannelsAvailable: 'No channels available',
    noChannelsRegistered: 'There are no channels registered in the system yet.',
    noChannelFound: 'No channels found',
    searchTip: 'Try adjusting your search or explore other terms.',
    
    // Statistics
    subscribers: 'Subscribers',
    videos: 'Videos',
    views: 'Views',
    verified: 'Verified channel',
    noDescription: 'No description',
    
    // More from XandTube
    moreFromXandTube: 'More from XandTube'
  }
};

// CSS Variables para temas
const themes = {
  dark: {
    '--bg-primary': '#0f0f0f',
    '--bg-secondary': '#181818',
    '--bg-tertiary': '#202020',
    '--bg-hover': '#3d3d3d',
    '--bg-input': '#121212',
    '--text-primary': '#ffffff',
    '--text-secondary': '#cccccc',
    '--text-muted': '#aaaaaa',
    '--border-color': '#303030',
    '--accent-color': '#065fd4',
    '--accent-hover': '#1976d2',
    '--error-color': '#f44336',
    '--success-color': '#4caf50',
    '--warning-color': '#ff9800'
  },
  light: {
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f9f9f9',
    '--bg-tertiary': '#f0f0f0',
    '--bg-hover': '#e0e0e0',
    '--bg-input': '#ffffff',
    '--text-primary': '#000000',
    '--text-secondary': '#333333',
    '--text-muted': '#666666',
    '--border-color': '#e0e0e0',
    '--accent-color': '#1976d2',
    '--accent-hover': '#065fd4',
    '--error-color': '#d32f2f',
    '--success-color': '#388e3c',
    '--warning-color': '#f57c00'
  }
};

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar configurações do localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('xandtube-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Aplicar tema ao carregar
  useEffect(() => {
    if (!isLoading) {
      applyTheme(settings.theme);
    }
  }, [settings.theme, isLoading]);

  // Função para aplicar tema
  const applyTheme = (theme) => {
    const root = document.documentElement;
    const themeVars = themes[theme] || themes.dark;
    
    Object.entries(themeVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
    // Adicionar classe ao body para compatibilidade
    document.body.className = `theme-${theme}`;
  };

  // Função para salvar configurações
  const saveSettings = (newSettings) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      localStorage.setItem('xandtube-settings', JSON.stringify(updatedSettings));
      
      // Disparar evento customizado para notificar mudanças
      window.dispatchEvent(new Event('localStorageChange'));
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      return false;
    }
  };

  // Função para alterar tema
  const setTheme = (theme) => {
    saveSettings({ theme });
  };

  // Função para alterar idioma
  const setLanguage = (language) => {
    saveSettings({ language });
  };

  // Função para obter texto traduzido
  const t = (key, fallback = key) => {
    return translations[settings.language]?.[key] || fallback;
  };

  // Função para obter todas as traduções do idioma atual
  const getTranslations = () => {
    return translations[settings.language] || translations.pt;
  };

  const value = {
    settings,
    isLoading,
    theme: settings.theme,
    language: settings.language,
    setTheme,
    setLanguage,
    saveSettings,
    t,
    getTranslations,
    themes: Object.keys(themes),
    languages: Object.keys(translations)
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;