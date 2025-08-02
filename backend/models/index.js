const sequelize = require('../config/database');
const User = require('./User');
const Video = require('./Video');
const Channel = require('./Channel');
const Comment = require('./Comment');
const Download = require('./Download');

// Definindo associações

// User -> Channel (Um usuário pode ter múltiplos canais)
User.hasMany(Channel, { foreignKey: 'user_id', as: 'channels' });
Channel.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });

// Channel -> Video (Um canal pode ter múltiplos vídeos)
Channel.hasMany(Video, { foreignKey: 'channel_id', as: 'videos' });
Video.belongsTo(Channel, { foreignKey: 'channel_id', as: 'channel' });

// User -> Video (Um usuário pode fazer upload de múltiplos vídeos)
User.hasMany(Video, { foreignKey: 'user_id', as: 'uploadedVideos' });
Video.belongsTo(User, { foreignKey: 'user_id', as: 'uploader' });

// Video -> Comment (Um vídeo pode ter múltiplos comentários)
Video.hasMany(Comment, { foreignKey: 'video_id', as: 'comments' });
Comment.belongsTo(Video, { foreignKey: 'video_id', as: 'video' });

// User -> Comment (Um usuário pode fazer múltiplos comentários)
User.hasMany(Comment, { foreignKey: 'user_id', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

// Comment -> Comment (Comentários podem ter respostas)
Comment.hasMany(Comment, { foreignKey: 'parent_id', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parent_id', as: 'parent' });

// User -> Download (Um usuário pode ter múltiplos downloads)
User.hasMany(Download, { foreignKey: 'userId', as: 'downloads' });
Download.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Video -> Download (Um vídeo pode estar associado a um download, opcional)
Video.belongsTo(Download, { foreignKey: 'downloadId', as: 'associatedDownload' });
Download.hasOne(Video, { foreignKey: 'downloadId', as: 'associatedVideo' });

// Função para sincronizar o banco de dados
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida com sucesso.');
    
    // Primeiro tenta sync normal
    try {
      await sequelize.sync({ alter: true });
      console.log('✅ Modelos sincronizados com o banco de dados.');
    } catch (syncError) {
      console.warn('⚠️ Sync normal falhou, tentando recriação da tabela Downloads...');
      console.warn('Erro original:', syncError.message);
      
      // Se falhar, pode ser problema com a tabela Downloads
      if (syncError.message.includes('downloads') || syncError.message.includes('userId')) {
        try {
          // Remove tabela downloads problemática
          await sequelize.query('DROP TABLE IF EXISTS downloads;');
          console.log('🗑️ Tabela downloads removida');
          
          // Recria apenas a tabela Downloads
          await Download.sync({ force: true });
          console.log('✅ Tabela Downloads recriada');
          
          // Tenta sync geral novamente
          await sequelize.sync({ alter: true });
          console.log('✅ Todos os modelos sincronizados após correção.');
        } catch (recreateError) {
          console.error('❌ Erro ao recriar tabela Downloads:', recreateError.message);
          throw recreateError;
        }
      } else {
        throw syncError;
      }
    }
  } catch (error) {
    console.error('❌ Erro ao conectar com banco de dados:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Video,
  Channel,
  Comment,
  Download,
  syncDatabase
};