const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Gerar token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'xandtube-secret-key-2024',
    { expiresIn: '7d' }
  );
};

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'xandtube-secret-key-2024');
    
    // Busca o usuário no banco
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
    }

    // Adiciona o usuário à requisição
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(500).json({ error: 'Erro ao verificar token' });
  }
};

// Middleware opcional - não bloqueia se não houver token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'xandtube-secret-key-2024');
      const user = await User.findByPk(decoded.userId);
      if (user && user.isActive) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    next(); // Continua sem usuário autenticado
  }
};

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Privilégios de administrador necessários.' });
  }
  next();
};

module.exports = {
  generateToken,
  authenticateToken,
  optionalAuth,
  requireAdmin
};