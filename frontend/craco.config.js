const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      return webpackConfig;
    },
  },
  devServer: {
    // Configurações do dev server para resolver o erro de allowedHosts
    allowedHosts: 'all', // Permite todos os hosts em desenvolvimento
    host: '0.0.0.0', // Permite conexões de qualquer IP
    port: 3000,
    
    // Configurações de CORS
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
    
    // Proxy para o backend
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
    
    // Configurações para desenvolvimento
    hot: true,
    liveReload: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
    
    // Para funcionar corretamente com roteamento do React Router
    historyApiFallback: {
      disableDotRule: true,
    },
  },
};