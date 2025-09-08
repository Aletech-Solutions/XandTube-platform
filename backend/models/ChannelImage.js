const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Model para ChannelImage - Armazena informações de imagens dos canais
 */
const ChannelImage = sequelize.define('ChannelImage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  channelId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'channel_id',
    comment: 'ID do canal no YouTube'
  },
  
  avatarFilename: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'avatar_filename',
    comment: 'Nome do arquivo do avatar'
  },
  
  bannerFilename: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'banner_filename',
    comment: 'Nome do arquivo do banner'
  },
  
  avatarUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'avatar_url',
    comment: 'URL completa do avatar'
  },
  
  bannerUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'banner_url',
    comment: 'URL completa do banner'
  }
}, {
  tableName: 'channel_images',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['channel_id']
    }
  ]
});

module.exports = ChannelImage;
