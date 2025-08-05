const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

// Inicializa banco de dados
const { syncDatabase } = require('./models');

// Importa rotas
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const channelRoutes = require('./routes/channels');
const channelTrackingRoutes = require('./routes/channelTracking');
const commentRoutes = require('./routes/comments');
const downloadRoutes = require('./routes/download');
// const downloadsRoutes = require('./routes/downloads'); // Comentado devido a problemas de banco
const directDownloadsRoutes = require('./routes/directDownloads');
const imageRoutes = require('./routes/images');
const recommendationsRoutes = require('./routes/recommendations');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (vídeos)
const videosPath = path.join(__dirname, process.env.VIDEOS_PATH || '../videos');
app.use('/videos', express.static(videosPath));

// Garantir que as pastas necessárias existem
fs.ensureDirSync(videosPath);
fs.ensureDirSync(path.join(videosPath, 'metadata'));
fs.ensureDirSync(path.join(videosPath, 'images'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/channel-tracking', channelTrackingRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/download', downloadRoutes);
// app.use('/api/downloads', downloadsRoutes); // Comentado devido a problemas de banco
app.use('/api/direct-downloads', directDownloadsRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/recommendations', recommendationsRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const { checkYtdlpInstallation } = require('./utils/checkYtdlp');
    const ytdlpAvailable = await checkYtdlpInstallation();
    
    res.json({ 
      status: 'OK', 
      message: 'XandTube Backend funcionando!',
      timestamp: new Date().toISOString(),
      services: {
        database: 'OK',
        ytdlp: ytdlpAvailable ? 'OK' : 'NOT_AVAILABLE',
        websocket: 'OK'
      },
      version: '2.0.0'
    });
  } catch (error) {
    console.error('Erro no health check:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Erro no health check',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Erro no servidor:', err.stack);
  
  // Log detalhado para debug
  console.error('📝 Detalhes do erro:', {
    message: err.message,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    query: req.query,
    userAgent: req.headers['user-agent']
  });
  
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint não encontrado',
    path: req.originalUrl 
  });
});

// WebSocket para progresso de download em tempo real
wss.on('connection', (ws) => {
  console.log('🔌 Cliente WebSocket conectado');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'subscribe' && data.downloadId) {
        ws.downloadId = data.downloadId;
      }
    } catch (error) {
      console.error('Erro ao processar mensagem WebSocket:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 Cliente WebSocket desconectado');
  });
});

// Exporta wss para uso nas rotas
app.locals.wss = wss;

// Inicializa servidor
const startServer = async () => {
  try {
    // Verifica YT-DLP
    const { checkYtdlpInstallation } = require('./utils/checkYtdlp');
    const ytdlpInstalled = await checkYtdlpInstallation();
    
    if (!ytdlpInstalled) {
      console.warn('⚠️  YT-DLP não encontrado - funcionalidade de download limitada');
    }
    
    // Sincroniza banco de dados (comentado temporariamente devido a problemas)
    try {
      await syncDatabase();
      console.log('✅ Banco de dados sincronizado');
    } catch (dbError) {
      console.warn('⚠️ Problema no banco de dados, continuando sem sync:', dbError.message);
    }
    
    // Testa sistema de downloads direto
    try {
      console.log('🔍 Testando sistema de downloads direto...');
      const directDownloadService = require('./services/directDownloadService');
      const { downloads, total } = await directDownloadService.listDownloads(null, 1, 5);
      console.log(`✅ Sistema direto funcionando: ${total} downloads encontrados`);
    } catch (scanError) {
      console.warn('⚠️ Erro ao testar downloads direto:', scanError.message);
    }
    
    // Inicia servidor
    server.listen(PORT, () => {
      console.log(`🎥 XandTube Backend rodando na porta ${PORT}`);
      console.log(`📁 Pasta de vídeos: ${videosPath}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
      console.log(`🔒 JWT Secret: ${process.env.JWT_SECRET ? 'Configurado' : 'Usando padrão'}`);
      console.log(`🔌 WebSocket pronto para conexões`);
      console.log(`📥 YT-DLP: ${ytdlpInstalled ? 'Disponível' : 'Não instalado'}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();