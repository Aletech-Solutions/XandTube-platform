const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Model para Downloads - Representa vídeos baixados via YT-DLP
 */
const Download = sequelize.define('Download', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Identificadores
  youtubeId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: false, // Pode baixar mesmo vídeo várias vezes
    comment: 'ID do vídeo no YouTube'
  },
  
  downloadId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: false,
    comment: 'ID único do download (userId_timestamp)'
  },
  
  // Informações do vídeo
  title: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Título do vídeo'
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descrição do vídeo'
  },
  
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duração em segundos'
  },
  
  // Informações do canal
  channelName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Nome do canal'
  },
  
  channelId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID do canal no YouTube'
  },
  
  // Informações de download
  originalUrl: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'URL original do YouTube'
  },
  
  quality: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'best',
    comment: 'Qualidade solicitada (best, 720p, 480p, etc.)'
  },
  
  format: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Formato final do arquivo (mp4, webm, etc.)'
  },
  
  resolution: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Resolução do vídeo (1920x1080, 1280x720, etc.)'
  },
  
  fileSize: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'Tamanho do arquivo em bytes'
  },
  
  // Caminhos dos arquivos
  videoPath: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Caminho para o arquivo de vídeo'
  },
  
  thumbnailPath: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Caminho para a miniatura'
  },
  
  infoPath: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Caminho para o arquivo .info.json'
  },
  
  // Status e progresso
  status: {
    type: DataTypes.STRING,
    defaultValue: 'completed',
    comment: 'Status do download'
  },
  
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    comment: 'Progresso do download (0-100)'
  },
  
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Mensagem de erro se houver'
  },
  
  // Metadados completos
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Metadados completos do YT-DLP'
  },
  
  // Timestamps
  downloadedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Data e hora do download'
  },
  
  // Relacionamento com usuário
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'ID do usuário que fez o download'
  }
}, {
  tableName: 'downloads',
  timestamps: true
  // Temporariamente sem índices até a tabela estar estável
});

module.exports = Download;