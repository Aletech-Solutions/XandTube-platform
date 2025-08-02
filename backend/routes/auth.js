const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { generateToken, authenticateToken } = require('../middleware/auth');

// Validação de entrada
const validateRegister = (req, res, next) => {
  const { username, email, password, fullName } = req.body;
  const errors = [];

  if (!username || username.length < 3) {
    errors.push('Username deve ter pelo menos 3 caracteres');
  }
  
  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push('Email inválido');
  }
  
  if (!password || password.length < 6) {
    errors.push('Senha deve ter pelo menos 6 caracteres');
  }
  
  if (!fullName || fullName.trim().length < 2) {
    errors.push('Nome completo é obrigatório');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

// POST /api/auth/register - Registro de novo usuário
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    // Verifica se usuário já existe
    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ error: 'Username já em uso' });
      }
    }

    // Cria novo usuário
    const user = await User.create({
      username,
      email,
      password,
      fullName,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`
    });

    // Gera token
    const token = generateToken(user.id);

    // Retorna usuário e token
    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: user.toSafeObject(),
      token
    });

  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// POST /api/auth/login - Login de usuário
router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Email/username e senha são obrigatórios' });
    }

    // Busca usuário por email ou username
    const user = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { email: emailOrUsername },
          { username: emailOrUsername }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verifica senha
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verifica se usuário está ativo
    if (!user.isActive) {
      return res.status(401).json({ error: 'Conta desativada' });
    }

    // Gera token
    const token = generateToken(user.id);

    // Retorna usuário e token
    res.json({
      message: 'Login realizado com sucesso',
      user: user.toSafeObject(),
      token
    });

  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro ao processar login' });
  }
});

// GET /api/auth/me - Obter dados do usuário autenticado
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user.toSafeObject()
    });
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
  }
});

// PUT /api/auth/me - Atualizar perfil do usuário
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { fullName, avatarUrl } = req.body;
    const updates = {};

    if (fullName && fullName.trim().length >= 2) {
      updates.fullName = fullName;
    }

    if (avatarUrl) {
      updates.avatarUrl = avatarUrl;
    }

    await req.user.update(updates);

    res.json({
      message: 'Perfil atualizado com sucesso',
      user: req.user.toSafeObject()
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

// PUT /api/auth/change-password - Alterar senha
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' });
    }

    // Verifica senha atual
    const isValidPassword = await req.user.validatePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Atualiza senha
    await req.user.update({ password: newPassword });

    res.json({ message: 'Senha alterada com sucesso' });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ error: 'Erro ao alterar senha' });
  }
});

// POST /api/auth/logout - Logout (informativo apenas, token fica no cliente)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout realizado com sucesso' });
});

module.exports = router;