const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

const router = express.Router();

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../videos/images');
    await fs.ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // Aceitar apenas imagens
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos de imagem são permitidos'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});

// Middleware para servir imagens com graceful fallback
router.get('/:type/:filename', async (req, res) => {
  try {
    const { type, filename } = req.params;
    console.log(`🖼️ Solicitação de imagem: ${type}/${filename}`);
    
    const imagePath = path.join(__dirname, '../../videos/images', filename);
    
    // Verificar se o arquivo existe
    if (await fs.pathExists(imagePath)) {
      console.log(`✅ Arquivo encontrado: ${imagePath}`);
      res.setHeader('Cache-Control', 'public, max-age=1800');
      return res.sendFile(imagePath);
    }
    
    console.log(`🔄 Gerando placeholder para: ${type}/${filename}`);
    
    // Gerar placeholder baseado no tipo
    const placeholderBuffer = await generatePlaceholder(type, filename);
    
    console.log(`✅ Placeholder gerado com sucesso: ${placeholderBuffer.length} bytes`);
    
    res.set({
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=1800'
    });
    
    res.send(placeholderBuffer);
    
  } catch (error) {
    console.error(`❌ Erro ao servir imagem ${req.params.type}/${req.params.filename}:`, error);
    
    // Fallback final - imagem de erro simples
    const errorBuffer = await generateErrorImage();
    res.set({
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=1800'
    });
    res.send(errorBuffer);
  }
});

// Rota para upload de avatar de canal
router.post('/channel/:channelId/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const { channelId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    
    // Processar imagem (redimensionar para avatar)
    const processedImagePath = await processAvatarImage(req.file.path, channelId);
    
    // Remover arquivo original
    await fs.remove(req.file.path);
    
    // Salvar informações do canal
    await saveChannelImage(channelId, 'avatar', processedImagePath);
    
    const imageUrl = `/api/images/avatar/${path.basename(processedImagePath)}`;
    
    res.json({
      success: true,
      imageUrl,
      message: 'Avatar do canal atualizado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao fazer upload do avatar:', error);
    
    // Limpar arquivo se houver erro
    if (req.file) {
      await fs.remove(req.file.path).catch(() => {});
    }
    
    res.status(500).json({ 
      error: 'Erro ao fazer upload do avatar',
      details: error.message 
    });
  }
});



// Função para gerar placeholder baseado no tipo
async function generatePlaceholder(type, filename) {
  try {
    console.log(`🎨 Gerando placeholder: type=${type}, filename=${filename}`);
    
    const isAvatar = type === 'avatar';
    
    // Extrair primeira letra do nome do canal (se possível)
    const channelLetter = filename.charAt(0).toUpperCase() || 'C';
    
    console.log(`📝 Configuração: isAvatar=${isAvatar}, letter=${channelLetter}`);
    
    if (isAvatar) {
      console.log('🔄 Gerando avatar placeholder...');
      // Avatar circular 150x150
      return await sharp({
        create: {
          width: 150,
          height: 150,
          channels: 4,
          background: { r: 51, g: 51, b: 51, alpha: 1 }
        }
      })
      .composite([{
        input: Buffer.from(`
          <svg width="150" height="150">
            <circle cx="75" cy="75" r="75" fill="#333333"/>
            <text x="75" y="90" text-anchor="middle" fill="white" font-family="Arial" font-size="60" font-weight="bold">${channelLetter}</text>
          </svg>
        `),
        top: 0,
        left: 0
      }])
      .png()
      .toBuffer();
    }
    
    // Para qualquer outro tipo, retornar imagem de erro
    return await generateErrorImage();
    
  } catch (error) {
    console.error('Erro ao gerar placeholder:', error);
    return await generateErrorImage();
  }
}

// Função para gerar imagem de erro
async function generateErrorImage() {
  return await sharp({
    create: {
      width: 300,
      height: 200,
      channels: 4,
      background: { r: 200, g: 200, b: 200, alpha: 1 }
    }
  })
  .composite([{
    input: Buffer.from(`
      <svg width="300" height="200">
        <rect width="300" height="200" fill="#cccccc"/>
        <text x="150" y="110" text-anchor="middle" fill="#666666" font-family="Arial" font-size="16">Imagem não disponível</text>
      </svg>
    `),
    top: 0,
    left: 0
  }])
  .png()
  .toBuffer();
}

// Função para processar avatar (redimensionar e otimizar)
async function processAvatarImage(inputPath, channelId) {
  const outputPath = path.join(
    path.dirname(inputPath), 
    `avatar-${channelId}-${Date.now()}.png`
  );
  
  await sharp(inputPath)
    .resize(150, 150, {
      fit: 'cover',
      position: 'center'
    })
    .png({ quality: 90 })
    .toFile(outputPath);
    
  return outputPath;
}



// Função para salvar informações da imagem do canal
async function saveChannelImage(channelId, type, imagePath) {
  const { ChannelImage } = require('../models');
  
  try {
    // Buscar registro existente ou criar novo
    let channelImageRecord = await ChannelImage.findOne({ where: { channelId } });
    
    if (!channelImageRecord) {
      channelImageRecord = await ChannelImage.create({ channelId });
    }
    
    // Remover imagem anterior se existir
    const oldFilename = type === 'avatar' ? channelImageRecord.avatarFilename : channelImageRecord.bannerFilename;
    if (oldFilename) {
      const oldImagePath = path.join(__dirname, '../../videos/images', oldFilename);
      await fs.remove(oldImagePath).catch(() => {});
    }
    
    // Atualizar com nova imagem
    const filename = path.basename(imagePath);
    const updateData = {};
    
    if (type === 'avatar') {
      updateData.avatarFilename = filename;
      updateData.avatarUrl = `/api/images/avatar/${filename}`;
    } else if (type === 'banner') {
      updateData.bannerFilename = filename;
      updateData.bannerUrl = `/api/images/banner/${filename}`;
    }
    
    await channelImageRecord.update(updateData);
    
    console.log(`✅ Imagem ${type} salva no banco para canal ${channelId}`);
    
  } catch (error) {
    console.error(`❌ Erro ao salvar imagem ${type} no banco:`, error);
    throw error;
  }
}

// Rota para obter informações de imagens do canal
router.get('/channel/:channelId/info', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { ChannelImage } = require('../models');
    
    const channelImageRecord = await ChannelImage.findOne({ where: { channelId } });
    
    if (channelImageRecord) {
      res.json({
        channelId,
        avatar: channelImageRecord.avatarUrl,
        banner: channelImageRecord.bannerUrl,
        updatedAt: channelImageRecord.updatedAt
      });
    } else {
      res.json({
        channelId,
        avatar: null,
        banner: null,
        updatedAt: null
      });
    }
    
  } catch (error) {
    console.error('Erro ao obter informações do canal:', error);
    res.status(500).json({ 
      error: 'Erro ao obter informações do canal',
      details: error.message 
    });
  }
});

module.exports = router;