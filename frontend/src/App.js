import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MobileNavigation from './components/MobileNavigation';
import { SettingsProvider } from './contexts/SettingsContext';
import HomePage from './pages/HomePage';
import VideoPage from './pages/VideoPage';
import ChannelPage from './pages/ChannelPage';
import UploadPage from './pages/UploadPage';
import CreateChannelPage from './pages/CreateChannelPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DownloadPage from './pages/DownloadPage';
import HistoricoPage from './pages/HistoricoPage';
import WatchPage from './pages/WatchPage';
import ChannelsPage from './pages/ChannelsPage';
import ChannelDetailsPage from './pages/ChannelDetailsPage';
import ChannelManagePage from './pages/ChannelManagePage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import api from './services/api';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--bg-secondary);
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  padding-top: 56px; /* Height of header */
`;

const ContentArea = styled.main`
  flex: 1;
  padding: 20px;
  margin-left: ${props => props.$sidebarOpen ? '240px' : '72px'}; /* Width of sidebar */
  transition: margin-left 0.3s;
  
  @media (max-width: 768px) {
    margin-left: 0;
    padding: 10px 10px 70px 10px; /* Extra bottom padding for mobile nav */
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 24px;
  color: var(--text-muted);
`;

// Componente para rotas protegidas
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    // Redireciona para login salvando a rota original
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Componente para rotas públicas (login/registro)
function PublicRoute({ children }) {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (token) {
    // Se já está logado, redireciona para home ou página anterior
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return children;
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Verifica autenticação ao montar
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        // Configura token no axios
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        try {
          // Verifica se token é válido
          const response = await api.get('/auth/me');
          setUser(response.data.user);
        } catch (error) {
          console.error('Token inválido:', error);
          // Remove token inválido
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete api.defaults.headers.common['Authorization'];
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Esconde sidebar em páginas de login/registro
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (loading) {
    return <LoadingContainer>Carregando...</LoadingContainer>;
  }

  return (
    <SettingsProvider>
      <ErrorBoundary>
        <AppContainer>
          {!isAuthPage && <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} />}
          
          <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } />

            {/* Rotas protegidas */}
            <Route path="/*" element={
              <ProtectedRoute>
                <MainContent>
                  {!isAuthPage && <Sidebar isOpen={sidebarOpen} />}
                  <ContentArea $sidebarOpen={sidebarOpen}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/watch/:id" element={<VideoPage />} />
                      <Route path="/watch-download/:id" element={<WatchPage />} />
                      <Route path="/channel/:id" element={<ChannelPage />} />
                      <Route path="/channels" element={<ChannelsPage />} />
                      <Route path="/channels/:id" element={<ChannelDetailsPage />} />
                      <Route path="/channels/:channelId/manage" element={<ChannelManagePage />} />
                      <Route path="/upload" element={<UploadPage />} />
                      <Route path="/create-channel" element={<CreateChannelPage />} />
                      <Route path="/download" element={<DownloadPage />} />
                      <Route path="/historico" element={<HistoricoPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </ContentArea>
                </MainContent>
              </ProtectedRoute>
            } />
          </Routes>
          
          {/* Mobile Navigation - appears only on mobile */}
          {!isAuthPage && <MobileNavigation />}
        </AppContainer>
      </ErrorBoundary>
    </SettingsProvider>
  );
}

export default App;