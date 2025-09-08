const sequelize = require('../config/database');
const User = require('./User');
const Video = require('./Video');
const Channel = require('./Channel');
const ChannelTracking = require('./ChannelTracking');
const Comment = require('./Comment');
const Download = require('./Download');
const ChannelImage = require('./ChannelImage');
const CookieStorage = require('./CookieStorage');

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

// User -> ChannelTracking (Um usuário pode trackear múltiplos canais)
User.hasMany(ChannelTracking, { foreignKey: 'userId', as: 'trackedChannels' });
ChannelTracking.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> CookieStorage (Um usuário pode ter múltiplos conjuntos de cookies)
User.hasMany(CookieStorage, { foreignKey: 'userId', as: 'cookieStorage' });
CookieStorage.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Video -> Download (Um vídeo pode estar associado a um download, opcional)
Video.belongsTo(Download, { foreignKey: 'downloadId', as: 'associatedDownload' });
Download.hasOne(Video, { foreignKey: 'downloadId', as: 'associatedVideo' });

// ChannelImage (não precisa de associação direta, usa channelId como chave)

// Função para sincronizar o banco de dados
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida com sucesso.');
    
    // Configurar SQLite para melhor compatibilidade
    await sequelize.query('PRAGMA foreign_keys = ON;');
    await sequelize.query('PRAGMA journal_mode = WAL;');
    
    // Tentar sync normal primeiro
    try {
      await sequelize.sync({ logging: false });
      console.log('✅ Modelos sincronizados com o banco de dados.');
    } catch (syncError) {
      console.warn('⚠️ Sync normal falhou, tentando recriação completa...');
      console.warn('Erro original:', syncError.message);
      
      try {
        // Desabilitar foreign keys temporariamente
        await sequelize.query('PRAGMA foreign_keys = OFF;');
        
        // Recriar todas as tabelas na ordem correta
        console.log('🔄 Recriando tabelas na ordem correta...');
        
        await User.sync({ force: true });
        console.log('✅ Tabela Users criada');
        
        await Channel.sync({ force: true });
        console.log('✅ Tabela Channels criada');
        
        await Download.sync({ force: true });
        console.log('✅ Tabela Downloads criada');
        
        await Video.sync({ force: true });
        console.log('✅ Tabela Videos criada');
        
        await Comment.sync({ force: true });
        console.log('✅ Tabela Comments criada');
        
        await ChannelTracking.sync({ force: true });
        console.log('✅ Tabela ChannelTracking criada');
        
        await ChannelImage.sync({ force: true });
        console.log('✅ Tabela ChannelImages criada');
        
        await CookieStorage.sync({ force: true });
        console.log('✅ Tabela CookieStorage criada');
        
        // Reabilitar foreign keys
        await sequelize.query('PRAGMA foreign_keys = ON;');
        
        console.log('✅ Todas as tabelas recriadas com sucesso.');
        
        // Criar usuário admin padrão
        try {
          const adminExists = await User.findOne({ where: { username: 'admin' } });
          if (!adminExists) {
            await User.create({
              username: 'admin',
              email: 'admin@xandtube.local',
              password: 'admin123',
              fullName: 'Administrador',
              role: 'admin'
            });
            console.log('✅ Usuário admin padrão criado');
          }
        } catch (adminError) {
          console.warn('⚠️ Erro ao criar usuário admin:', adminError.message);
        }
        
      } catch (recreateError) {
        console.error('❌ Erro na recriação completa:', recreateError.message);
        throw recreateError;
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
  ChannelTracking,
  Comment,
  Download,
  ChannelImage,
  CookieStorage,
  syncDatabase
};