const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * ChannelTracking Model
 * Manages channels that are being tracked for automatic video downloads
 */
const ChannelTracking = sequelize.define('ChannelTracking', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  
  // Channel identification
  youtubeChannelId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'YouTube channel ID (e.g., UCxxxxx or @username)'
  },
  
  channelUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Full YouTube channel URL'
  },
  
  channelName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Channel display name'
  },
  
  // User who added this tracking
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who added this channel to tracking'
  },
  
  // Tracking configuration
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether this channel is actively being tracked'
  },
  
  quality: {
    type: DataTypes.STRING,
    defaultValue: 'best',
    comment: 'Video quality preference (best, worst, 720p, etc.)'
  },
  
  saveToLibrary: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether to save downloaded videos to user library'
  },
  
  // Tracking metadata
  lastCheck: {
    type: DataTypes.DATE,
    comment: 'Last time this channel was checked for new videos'
  },
  
  lastVideoId: {
    type: DataTypes.STRING,
    comment: 'ID of the last video found (to avoid duplicates)'
  },
  
  totalVideosFound: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total number of videos found through tracking'
  },
  
  totalVideosDownloaded: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total number of videos successfully downloaded'
  },
  
  // Error handling
  lastError: {
    type: DataTypes.TEXT,
    comment: 'Last error message if any'
  },
  
  errorCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of consecutive errors (for automatic disabling)'
  },
  
  // Scheduling options
  scheduledHour: {
    type: DataTypes.INTEGER,
    defaultValue: 2,
    validate: {
      min: 0,
      max: 23
    },
    comment: 'Hour of day to check this channel (0-23)'
  },
  
  // Metadata
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional channel metadata from YT-DLP'
  }
}, {
  tableName: 'channel_tracking',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['scheduled_hour']
    },
    {
      fields: ['youtube_channel_id'],
      unique: true
    }
  ]
});

// Instance methods
ChannelTracking.prototype.updateLastCheck = function() {
  this.lastCheck = new Date();
  return this.save();
};

ChannelTracking.prototype.incrementError = function(errorMessage) {
  this.errorCount += 1;
  this.lastError = errorMessage;
  
  // Auto-disable after 5 consecutive errors
  if (this.errorCount >= 5) {
    this.isActive = false;
  }
  
  return this.save();
};

ChannelTracking.prototype.resetErrors = function() {
  this.errorCount = 0;
  this.lastError = null;
  return this.save();
};

ChannelTracking.prototype.recordVideoFound = function(videoId) {
  this.totalVideosFound += 1;
  this.lastVideoId = videoId;
  return this.save();
};

ChannelTracking.prototype.recordVideoDownloaded = function() {
  this.totalVideosDownloaded += 1;
  return this.save();
};

// Class methods
ChannelTracking.getActiveChannelsForHour = function(hour) {
  return this.findAll({
    where: {
      isActive: true,
      scheduledHour: hour
    },
    include: [
      {
        model: sequelize.models.User,
        attributes: ['id', 'username', 'email']
      }
    ]
  });
};

ChannelTracking.getByUserId = function(userId) {
  return this.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']]
  });
};

module.exports = ChannelTracking;