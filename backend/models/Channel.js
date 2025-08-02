const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Channel = sequelize.define('Channel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  youtubeChannelId: {
    type: DataTypes.STRING,
    unique: true,
    field: 'youtube_channel_id'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  bannerUrl: {
    type: DataTypes.STRING,
    field: 'banner_url'
  },
  avatarUrl: {
    type: DataTypes.STRING,
    field: 'avatar_url'
  },
  subscriberCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'subscriber_count'
  },
  videoCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'video_count'
  },
  userId: {
    type: DataTypes.UUID,
    field: 'user_id',
    allowNull: false
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_verified'
  },
  customUrl: {
    type: DataTypes.STRING,
    unique: true,
    field: 'custom_url'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
});

module.exports = Channel;