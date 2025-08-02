const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 5000]
    }
  },
  videoId: {
    type: DataTypes.UUID,
    field: 'video_id',
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    field: 'user_id',
    allowNull: false
  },
  parentId: {
    type: DataTypes.UUID,
    field: 'parent_id', // Para respostas a comentários
    allowNull: true
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  dislikes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_edited'
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_pinned'
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_deleted'
  }
});

module.exports = Comment;