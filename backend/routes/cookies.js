const express = require('express');
const { CookieStorage } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const cookieService = require('../services/cookieService');

const router = express.Router();

/**
 * @route GET /api/cookies
 * @desc Get all cookies for the authenticated user
 * @access Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const cookies = await cookieService.getUserCookies(userId);

    res.json({
      success: true,
      data: cookies,
      total: cookies.length
    });

  } catch (error) {
    console.error('❌ Erro ao buscar cookies:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /api/cookies
 * @desc Upload new cookies
 * @access Private
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, cookieText, browserSource } = req.body;

    // Validar campos obrigatórios
    if (!cookieText) {
      return res.status(400).json({
        success: false,
        error: 'Texto dos cookies é obrigatório'
      });
    }

    // Salvar cookies
    const cookieStorage = await cookieService.saveCookies(userId, {
      name,
      description,
      cookieText,
      browserSource
    });

    res.status(201).json({
      success: true,
      message: 'Cookies salvos com sucesso',
      data: {
        id: cookieStorage.id,
        name: cookieStorage.name,
        description: cookieStorage.description,
        browserSource: cookieStorage.browserSource,
        isActive: cookieStorage.isActive,
        isValid: cookieStorage.isValid,
        createdAt: cookieStorage.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Erro ao salvar cookies:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Erro ao salvar cookies'
    });
  }
});

/**
 * @route PUT /api/cookies/:id/activate
 * @desc Activate cookies (set as system default)
 * @access Private
 */
router.put('/:id/activate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const cookieId = req.params.id;

    // Verificar se o usuário é dono dos cookies
    const cookieStorage = await CookieStorage.findOne({
      where: { 
        id: cookieId,
        userId
      }
    });

    if (!cookieStorage) {
      return res.status(404).json({
        success: false,
        error: 'Cookies não encontrados ou você não tem permissão'
      });
    }

    if (!cookieStorage.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível ativar cookies inválidos'
      });
    }

    // Ativar cookies no sistema
    await cookieService.updateActiveCookies(cookieId);

    res.json({
      success: true,
      message: `Cookies "${cookieStorage.name}" ativados no sistema`,
      data: {
        id: cookieStorage.id,
        name: cookieStorage.name,
        isActive: true
      }
    });

  } catch (error) {
    console.error('❌ Erro ao ativar cookies:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao ativar cookies'
    });
  }
});

/**
 * @route POST /api/cookies/:id/validate
 * @desc Validate cookies by testing them
 * @access Private
 */
router.post('/:id/validate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const cookieId = req.params.id;

    // Verificar se o usuário é dono dos cookies
    const cookieStorage = await CookieStorage.findOne({
      where: { 
        id: cookieId,
        userId
      }
    });

    if (!cookieStorage) {
      return res.status(404).json({
        success: false,
        error: 'Cookies não encontrados ou você não tem permissão'
      });
    }

    // Validar cookies
    const isValid = await cookieService.validateCookies(cookieId);

    res.json({
      success: true,
      message: isValid ? 'Cookies válidos' : 'Cookies inválidos',
      data: {
        id: cookieStorage.id,
        name: cookieStorage.name,
        isValid,
        lastValidated: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Erro ao validar cookies:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Erro ao validar cookies'
    });
  }
});

/**
 * @route PUT /api/cookies/:id
 * @desc Update cookie information (name, description)
 * @access Private
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const cookieId = req.params.id;
    const { name, description, isActive } = req.body;

    const cookieStorage = await CookieStorage.findOne({
      where: { 
        id: cookieId,
        userId
      }
    });

    if (!cookieStorage) {
      return res.status(404).json({
        success: false,
        error: 'Cookies não encontrados ou você não tem permissão'
      });
    }

    // Atualizar campos se fornecidos
    if (name !== undefined) cookieStorage.name = name;
    if (description !== undefined) cookieStorage.description = description;
    if (isActive !== undefined) cookieStorage.isActive = isActive;

    await cookieStorage.save();

    res.json({
      success: true,
      message: 'Cookies atualizados com sucesso',
      data: {
        id: cookieStorage.id,
        name: cookieStorage.name,
        description: cookieStorage.description,
        isActive: cookieStorage.isActive,
        updatedAt: cookieStorage.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar cookies:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route DELETE /api/cookies/:id
 * @desc Delete cookies
 * @access Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const cookieId = req.params.id;

    const success = await cookieService.deleteCookies(cookieId, userId);

    if (success) {
      res.json({
        success: true,
        message: 'Cookies removidos com sucesso'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Cookies não encontrados'
      });
    }

  } catch (error) {
    console.error('❌ Erro ao remover cookies:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao remover cookies'
    });
  }
});

/**
 * @route GET /api/cookies/extraction-script/:browser
 * @desc Get cookie extraction script for specific browser
 * @access Private
 */
router.get('/extraction-script/:browser', authenticateToken, async (req, res) => {
  try {
    const browser = req.params.browser;
    const script = cookieService.generateCookieExtractionScript(browser);

    res.json({
      success: true,
      data: {
        browser,
        script,
        instructions: {
          chrome: 'Cole este script no Console do Chrome (F12 > Console) enquanto estiver logado no YouTube',
          firefox: 'Cole este script no Console do Firefox (F12 > Console) enquanto estiver logado no YouTube',
          manual: 'Instruções para extração manual de cookies'
        }[browser] || 'Instruções gerais para extração de cookies'
      }
    });

  } catch (error) {
    console.error('❌ Erro ao gerar script de extração:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /api/cookies/stats
 * @desc Get cookie usage statistics
 * @access Private
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await CookieStorage.findAll({
      where: { userId },
      attributes: [
        'isActive',
        'isValid',
        'timesUsed',
        'expiresAt'
      ]
    });

    const summary = stats.reduce((acc, cookie) => {
      acc.total++;
      if (cookie.isActive) acc.active++;
      if (cookie.isValid) acc.valid++;
      if (cookie.expiresAt && new Date() > new Date(cookie.expiresAt)) acc.expired++;
      acc.totalUsage += cookie.timesUsed || 0;
      return acc;
    }, {
      total: 0,
      active: 0,
      valid: 0,
      expired: 0,
      totalUsage: 0
    });

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('❌ Erro ao obter estatísticas de cookies:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /api/cookies/cleanup
 * @desc Cleanup expired cookies and temporary files
 * @access Private (Admin only)
 */
router.post('/cleanup', authenticateToken, async (req, res) => {
  try {
    // Verificar se é admin (opcional)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem executar limpeza'
      });
    }

    const expiredCookies = await cookieService.cleanupExpiredCookies();
    const tempFiles = await cookieService.cleanupTempCookieFiles();

    res.json({
      success: true,
      message: 'Limpeza concluída',
      data: {
        expiredCookiesRemoved: expiredCookies,
        tempFilesRemoved: tempFiles
      }
    });

  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
