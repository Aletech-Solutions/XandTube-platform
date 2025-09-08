const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const crypto = require('crypto');

/**
 * CookieStorage Model
 * Manages encrypted cookies for YouTube access
 */
const CookieStorage = sequelize.define('CookieStorage', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  
  // User who owns these cookies
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who uploaded these cookies'
  },
  
  // Cookie identification
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Friendly name for this cookie set'
  },
  
  description: {
    type: DataTypes.TEXT,
    comment: 'Description of when/how these cookies were obtained'
  },
  
  // Encrypted cookie data
  encryptedCookies: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Encrypted cookie data in Netscape format'
  },
  
  // Cookie metadata
  domain: {
    type: DataTypes.STRING,
    defaultValue: 'youtube.com',
    comment: 'Domain these cookies are for'
  },
  
  browserSource: {
    type: DataTypes.STRING,
    comment: 'Browser these cookies were extracted from (Chrome, Firefox, etc.)'
  },
  
  // Status and validation
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether these cookies are currently active'
  },
  
  isValid: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether these cookies are still valid (tested)'
  },
  
  lastValidated: {
    type: DataTypes.DATE,
    comment: 'Last time these cookies were tested'
  },
  
  validationError: {
    type: DataTypes.TEXT,
    comment: 'Last validation error message if any'
  },
  
  // Usage statistics
  timesUsed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of times these cookies have been used'
  },
  
  lastUsed: {
    type: DataTypes.DATE,
    comment: 'Last time these cookies were used'
  },
  
  // Expiration tracking
  expiresAt: {
    type: DataTypes.DATE,
    comment: 'When these cookies expire (if known)'
  }
}, {
  tableName: 'cookie_storage',
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
      fields: ['is_valid']
    },
    {
      fields: ['domain']
    }
  ]
});

// Encryption key for cookies (should be in environment variable in production)
const ENCRYPTION_KEY = process.env.COOKIE_ENCRYPTION_KEY || 'xandtube-cookie-key-32-chars-long';
const ALGORITHM = 'aes-256-cbc';

// Instance methods
CookieStorage.prototype.setCookies = function(cookieText) {
  try {
    // Encrypt the cookie data
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    let encrypted = cipher.update(cookieText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Store IV + encrypted data
    this.encryptedCookies = iv.toString('hex') + ':' + encrypted;
    
    // Try to extract expiration date from cookies
    this.extractExpirationDate(cookieText);
    
    return this.save();
  } catch (error) {
    throw new Error(`Erro ao criptografar cookies: ${error.message}`);
  }
};

CookieStorage.prototype.getCookies = function() {
  try {
    if (!this.encryptedCookies) {
      return null;
    }
    
    // Split IV and encrypted data
    const parts = this.encryptedCookies.split(':');
    if (parts.length !== 2) {
      throw new Error('Formato de cookie inválido');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    
    // Decrypt
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Erro ao descriptografar cookies: ${error.message}`);
  }
};

CookieStorage.prototype.extractExpirationDate = function(cookieText) {
  try {
    // Parse Netscape cookie format to find earliest expiration
    const lines = cookieText.split('\n').filter(line => 
      line.trim() && !line.startsWith('#')
    );
    
    let earliestExpiration = null;
    
    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length >= 5) {
        const expirationTimestamp = parseInt(parts[4]);
        if (expirationTimestamp && expirationTimestamp > 0) {
          const expirationDate = new Date(expirationTimestamp * 1000);
          if (!earliestExpiration || expirationDate < earliestExpiration) {
            earliestExpiration = expirationDate;
          }
        }
      }
    }
    
    if (earliestExpiration) {
      this.expiresAt = earliestExpiration;
    }
  } catch (error) {
    console.warn('⚠️ Erro ao extrair data de expiração dos cookies:', error.message);
  }
};

CookieStorage.prototype.recordUsage = function() {
  this.timesUsed += 1;
  this.lastUsed = new Date();
  return this.save();
};

CookieStorage.prototype.markAsInvalid = function(error) {
  this.isValid = false;
  this.validationError = error;
  this.lastValidated = new Date();
  return this.save();
};

CookieStorage.prototype.markAsValid = function() {
  this.isValid = true;
  this.validationError = null;
  this.lastValidated = new Date();
  return this.save();
};

// Class methods
CookieStorage.getActiveCookiesForUser = function(userId) {
  return this.findAll({
    where: {
      userId,
      isActive: true,
      isValid: true
    },
    order: [['lastUsed', 'DESC'], ['createdAt', 'DESC']]
  });
};

CookieStorage.getBestCookiesForDomain = function(domain = 'youtube.com') {
  return this.findOne({
    where: {
      domain,
      isActive: true,
      isValid: true
    },
    order: [
      ['timesUsed', 'ASC'], // Prefer less used cookies to distribute load
      ['lastValidated', 'DESC'],
      ['createdAt', 'DESC']
    ]
  });
};

CookieStorage.cleanupExpiredCookies = async function() {
  const now = new Date();
  const expiredCookies = await this.findAll({
    where: {
      expiresAt: {
        [sequelize.Sequelize.Op.lt]: now
      },
      isActive: true
    }
  });
  
  for (const cookie of expiredCookies) {
    cookie.isActive = false;
    cookie.isValid = false;
    cookie.validationError = 'Cookies expirados';
    await cookie.save();
  }
  
  return expiredCookies.length;
};

module.exports = CookieStorage;
