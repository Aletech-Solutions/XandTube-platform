const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Video = sequelize.define('Video', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  youtubeId: {
    type: DataTypes.STRING,
    unique: true,
    field: 'youtube_id'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  duration: {
    type: DataTypes.INTEGER, // duração em segundos
    allowNull: false
  },
  thumbnail: {
    type: DataTypes.STRING
  },
  videoUrl: {
    type: DataTypes.STRING,
    field: 'video_url'
  },
  originalUrl: {
    type: DataTypes.STRING,
    field: 'original_url'
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  dislikes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  channelId: {
    type: DataTypes.UUID,
    field: 'channel_id'
  },
  userId: {
    type: DataTypes.UUID,
    field: 'user_id',
    allowNull: false
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSON, // Metadados do YT-DLP
    defaultValue: {}
  },
  downloadProgress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'download_progress'
  },
  downloadStatus: {
    type: DataTypes.ENUM('pending', 'downloading', 'completed', 'error'),
    defaultValue: 'pending',
    field: 'download_status'
  },
  fileSize: {
    type: DataTypes.BIGINT,
    field: 'file_size'
  },
  format: {
    type: DataTypes.STRING
  },
  resolution: {
    type: DataTypes.STRING
  },
  
  // Relacionamento opcional com Download
  downloadId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'download_id',
    references: {
      model: 'Downloads',
      key: 'id'
    },
    comment: 'ID do download associado (se o vídeo veio de um download)'
  }
});

module.exports = Video;