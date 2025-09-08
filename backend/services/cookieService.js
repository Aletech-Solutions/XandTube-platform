const { CookieStorage } = require('../models');
const fs = require('fs-extra');
const path = require('path');
const ytdlpService = require('./ytdlpService');

/**
 * Serviço para gerenciar cookies do YouTube
 */
class CookieService {
  constructor() {
    this.cookiesDir = path.join(__dirname, '..', 'cookies');
    this.activeCookieFile = path.join(__dirname, '..', 'cookies.txt');
    
    // Garante que o diretório de cookies existe
    fs.ensureDirSync(this.cookiesDir);
  }

  /**
   * Salva cookies no banco de dados
   */
  async saveCookies(userId, cookieData) {
    try {
      const { name, description, cookieText, browserSource } = cookieData;

      // Validar formato dos cookies
      if (!this.validateCookieFormat(cookieText)) {
        throw new Error('Formato de cookies inválido. Use o formato Netscape.');
      }

      // Criar novo registro de cookies
      const cookieStorage = new CookieStorage({
        userId,
        name: name || `Cookies ${new Date().toLocaleDateString('pt-BR')}`,
        description: description || 'Cookies importados pelo usuário',
        browserSource: browserSource || 'Desconhecido'
      });

      // Criptografar e salvar cookies
      await cookieStorage.setCookies(cookieText);

      console.log(`✅ Cookies salvos para usuário ${userId}: ${cookieStorage.name}`);
      
      // Testar cookies imediatamente
      try {
        await this.validateCookies(cookieStorage.id);
      } catch (validationError) {
        console.warn('⚠️ Cookies salvos mas falharam na validação:', validationError.message);
      }

      return cookieStorage;

    } catch (error) {
      console.error('❌ Erro ao salvar cookies:', error);
      throw error;
    }
  }

  /**
   * Lista cookies do usuário
   */
  async getUserCookies(userId) {
    try {
      const cookies = await CookieStorage.findAll({
        where: { userId },
        order: [['isActive', 'DESC'], ['lastUsed', 'DESC'], ['createdAt', 'DESC']],
        attributes: [
          'id', 'name', 'description', 'browserSource', 'domain',
          'isActive', 'isValid', 'lastValidated', 'validationError',
          'timesUsed', 'lastUsed', 'expiresAt', 'createdAt'
        ]
      });

      return cookies.map(cookie => ({
        ...cookie.toJSON(),
        status: this.getCookieStatus(cookie),
        expiresIn: cookie.expiresAt ? this.getTimeUntilExpiration(cookie.expiresAt) : null
      }));

    } catch (error) {
      console.error('❌ Erro ao listar cookies do usuário:', error);
      throw error;
    }
  }

  /**
   * Obtém o melhor conjunto de cookies disponível
   */
  async getBestCookies(domain = 'youtube.com') {
    try {
      const bestCookies = await CookieStorage.getBestCookiesForDomain(domain);
      
      if (!bestCookies) {
        return null;
      }

      // Registrar uso
      await bestCookies.recordUsage();
      
      return bestCookies;

    } catch (error) {
      console.error('❌ Erro ao obter melhores cookies:', error);
      return null;
    }
  }

  /**
   * Escreve cookies para arquivo temporário para uso com yt-dlp
   */
  async writeCookiesToFile(cookieStorageId) {
    try {
      const cookieStorage = await CookieStorage.findByPk(cookieStorageId);
      
      if (!cookieStorage || !cookieStorage.isActive || !cookieStorage.isValid) {
        throw new Error('Cookies não encontrados ou inválidos');
      }

      const cookieText = cookieStorage.getCookies();
      const tempCookieFile = path.join(this.cookiesDir, `cookies_${cookieStorageId}_${Date.now()}.txt`);
      
      await fs.writeFile(tempCookieFile, cookieText, 'utf8');
      
      // Registrar uso
      await cookieStorage.recordUsage();
      
      return tempCookieFile;

    } catch (error) {
      console.error('❌ Erro ao escrever cookies para arquivo:', error);
      throw error;
    }
  }

  /**
   * Atualiza o arquivo de cookies ativo do sistema
   */
  async updateActiveCookies(cookieStorageId) {
    try {
      const cookieStorage = await CookieStorage.findByPk(cookieStorageId);
      
      if (!cookieStorage) {
        throw new Error('Cookies não encontrados');
      }

      const cookieText = cookieStorage.getCookies();
      
      // Backup do arquivo atual se existir
      if (await fs.pathExists(this.activeCookieFile)) {
        const backupFile = `${this.activeCookieFile}.backup.${Date.now()}`;
        await fs.copy(this.activeCookieFile, backupFile);
        console.log(`📋 Backup criado: ${backupFile}`);
      }

      // Escrever novos cookies
      await fs.writeFile(this.activeCookieFile, cookieText, 'utf8');
      
      // Atualizar serviço YT-DLP para usar os novos cookies
      ytdlpService.hasCookies = true;
      ytdlpService.cookiesPath = this.activeCookieFile;
      
      console.log(`✅ Cookies ativos atualizados: ${cookieStorage.name}`);
      
      return true;

    } catch (error) {
      console.error('❌ Erro ao atualizar cookies ativos:', error);
      throw error;
    }
  }

  /**
   * Valida cookies testando com uma requisição simples
   */
  async validateCookies(cookieStorageId) {
    try {
      const cookieStorage = await CookieStorage.findByPk(cookieStorageId);
      
      if (!cookieStorage) {
        throw new Error('Cookies não encontrados');
      }

      // Escrever cookies para arquivo temporário
      const tempCookieFile = await this.writeCookiesToFile(cookieStorageId);
      
      try {
        // Testar cookies com uma requisição simples ao YouTube
        const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rick Roll para teste
        
        // Usar yt-dlp para testar os cookies
        const { exec } = require('child_process');
        const util = require('util');
        const execPromise = util.promisify(exec);
        
        const testCommand = `yt-dlp --cookies "${tempCookieFile}" --dump-json --no-warnings "${testUrl}"`;
        
        await execPromise(testCommand, { 
          timeout: 30000,
          maxBuffer: 1024 * 1024 * 5 
        });
        
        // Se chegou até aqui, os cookies são válidos
        await cookieStorage.markAsValid();
        console.log(`✅ Cookies validados com sucesso: ${cookieStorage.name}`);
        
        return true;

      } catch (testError) {
        // Cookies inválidos
        const errorMsg = testError.message.includes('Sign in') || testError.message.includes('login') 
          ? 'Cookies expirados ou inválidos - necessário fazer login novamente'
          : `Erro na validação: ${testError.message}`;
          
        await cookieStorage.markAsInvalid(errorMsg);
        console.warn(`⚠️ Cookies inválidos: ${cookieStorage.name} - ${errorMsg}`);
        
        throw new Error(errorMsg);

      } finally {
        // Limpar arquivo temporário
        try {
          await fs.remove(tempCookieFile);
        } catch (cleanupError) {
          console.warn('⚠️ Erro ao limpar arquivo temporário:', cleanupError.message);
        }
      }

    } catch (error) {
      console.error('❌ Erro ao validar cookies:', error);
      throw error;
    }
  }

  /**
   * Remove cookies
   */
  async deleteCookies(cookieStorageId, userId) {
    try {
      const cookieStorage = await CookieStorage.findOne({
        where: { 
          id: cookieStorageId,
          userId // Garantir que o usuário é o dono
        }
      });

      if (!cookieStorage) {
        throw new Error('Cookies não encontrados ou você não tem permissão');
      }

      const cookieName = cookieStorage.name;
      await cookieStorage.destroy();
      
      console.log(`🗑️ Cookies removidos: ${cookieName}`);
      
      return true;

    } catch (error) {
      console.error('❌ Erro ao remover cookies:', error);
      throw error;
    }
  }

  /**
   * Limpa cookies expirados
   */
  async cleanupExpiredCookies() {
    try {
      const expiredCount = await CookieStorage.cleanupExpiredCookies();
      
      if (expiredCount > 0) {
        console.log(`🧹 ${expiredCount} conjuntos de cookies expirados foram desativados`);
      }
      
      return expiredCount;

    } catch (error) {
      console.error('❌ Erro ao limpar cookies expirados:', error);
      throw error;
    }
  }

  /**
   * Gera script para extrair cookies do navegador
   */
  generateCookieExtractionScript(browser = 'chrome') {
    const scripts = {
      chrome: `
// Script Universal para extrair cookies do YouTube
// Cole este código no Console do navegador (F12 > Console) enquanto estiver logado no YouTube

(function() {
  console.log('🍪 Iniciando extração de cookies do YouTube...');
  
  function formatCookie(name, value, domain, path, expires, secure) {
    return [
      domain,
      domain.startsWith('.') ? 'TRUE' : 'FALSE',
      path || '/',
      secure ? 'TRUE' : 'FALSE',
      expires || Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
      name,
      value || 'default_value'
    ].join('\\t');
  }

  // Método 1: Tentar usar Chrome Extension API (se disponível)
  if (typeof chrome !== 'undefined' && chrome.cookies) {
    console.log('📡 Usando Chrome Extension API...');
    chrome.cookies.getAll({domain: 'youtube.com'}, function(cookies) {
      let netscapeFormat = '# Netscape HTTP Cookie File\\n';
      netscapeFormat += '# Generated by XandTube Cookie Extractor (Chrome API)\\n';
      netscapeFormat += '# This file contains the cookies for YouTube\\n\\n';
      
      cookies.forEach(cookie => {
        netscapeFormat += formatCookie(
          cookie.name, 
          cookie.value, 
          cookie.domain, 
          cookie.path, 
          Math.floor(cookie.expirationDate || 0), 
          cookie.secure
        ) + '\\n';
      });
      
      downloadCookieFile(netscapeFormat, cookies.length);
    });
    return;
  }
  
  // Método 2: Usar document.cookie (método padrão)
  console.log('📄 Usando document.cookie...');
  const cookieString = document.cookie;
  
  if (!cookieString) {
    console.error('❌ Nenhum cookie encontrado! Certifique-se de estar logado no YouTube.');
    alert('Nenhum cookie encontrado! Faça login no YouTube primeiro.');
    return;
  }
  
  const cookies = cookieString.split(';');
  let netscapeFormat = '# Netscape HTTP Cookie File\\n';
  netscapeFormat += '# Generated by XandTube Cookie Extractor (Document API)\\n';
  netscapeFormat += '# This file contains the cookies for YouTube\\n\\n';
  
  let cookieCount = 0;
  
  cookies.forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value && name.length > 0) {
      const domain = '.youtube.com';
      const path = '/';
      const expires = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // 1 ano
      const secure = true;
      
      netscapeFormat += formatCookie(name, value, domain, path, expires, secure) + '\\n';
      cookieCount++;
    }
  });
  
  // Adicionar cookies essenciais se não existirem
  const essentialCookies = [
    'CONSENT',
    'VISITOR_INFO1_LIVE', 
    'YSC',
    'PREF',
    'GPS',
    'SIDCC'
  ];
  
  essentialCookies.forEach(cookieName => {
    if (!cookieString.includes(cookieName + '=')) {
      const expires = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60);
      netscapeFormat += formatCookie(
        cookieName, 
        'AUTO_GENERATED_' + Date.now(), 
        '.youtube.com', 
        '/', 
        expires, 
        true
      ) + '\\n';
      cookieCount++;
    }
  });
  
  downloadCookieFile(netscapeFormat, cookieCount);
  
  function downloadCookieFile(content, count) {
    try {
      // Criar elemento para download
      const element = document.createElement('a');
      const file = new Blob([content], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = 'youtube_cookies_' + new Date().toISOString().slice(0,10) + '.txt';
      
      // Adicionar ao DOM temporariamente
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      // Limpar URL object
      URL.revokeObjectURL(element.href);
      
      console.log('✅ Cookies extraídos com sucesso!');
      console.log('📁 Arquivo baixado: ' + element.download);
      console.log('📊 Total de cookies: ' + count);
      console.log('🔧 Agora copie o conteúdo do arquivo e cole no XandTube');
      
      alert('✅ Cookies extraídos! Arquivo baixado: ' + element.download + '\\n\\nTotal: ' + count + ' cookies\\n\\nAbra o arquivo e copie todo o conteúdo para o XandTube.');
      
    } catch (error) {
      console.error('❌ Erro ao baixar arquivo:', error);
      
      // Fallback: mostrar conteúdo no console
      console.log('📋 CONTEÚDO DOS COOKIES (copie tudo abaixo):');
      console.log('=====================================');
      console.log(content);
      console.log('=====================================');
      
      alert('❌ Erro no download automático.\\n\\nVeja o console (F12) e copie o conteúdo dos cookies manualmente.');
    }
  }
  
})();`,

      firefox: `
// Script para extrair cookies do YouTube no Firefox
// Cole este código no Console do navegador (F12 > Console) enquanto estiver logado no YouTube

(function() {
  function formatCookie(cookie) {
    return [
      cookie.domain,
      cookie.domain.startsWith('.') ? 'TRUE' : 'FALSE', 
      cookie.path,
      cookie.secure ? 'TRUE' : 'FALSE',
      Math.floor((cookie.expiry || 0)),
      cookie.name,
      cookie.value
    ].join('\\t');
  }

  // Firefox usa uma API diferente
  browser.cookies.getAll({domain: 'youtube.com'}).then(cookies => {
    let netscapeFormat = '# Netscape HTTP Cookie File\\n';
    netscapeFormat += '# Generated by XandTube Cookie Extractor\\n';
    netscapeFormat += '# This file contains the cookies for YouTube\\n\\n';
    
    cookies.forEach(cookie => {
      netscapeFormat += formatCookie(cookie) + '\\n';
    });
    
    // Criar elemento para download
    const element = document.createElement('a');
    const file = new Blob([netscapeFormat], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = 'youtube_cookies.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    console.log('✅ Cookies extraídos e baixados como youtube_cookies.txt');
    console.log('📋 Total de cookies:', cookies.length);
  });
})();`,

      manual: `
# Extração Manual de Cookies

## Método 1: Usando Extensão do Navegador
1. Instale a extensão "Get cookies.txt" no seu navegador
2. Vá para youtube.com e faça login
3. Clique na extensão e baixe os cookies

## Método 2: Usando Ferramentas de Desenvolvedor
1. Abra o YouTube e faça login
2. Pressione F12 para abrir as ferramentas de desenvolvedor
3. Vá para a aba "Application" (Chrome) ou "Storage" (Firefox)
4. Clique em "Cookies" > "https://www.youtube.com"
5. Copie todos os cookies manualmente

## Método 3: Usando yt-dlp
Execute no terminal:
yt-dlp --cookies-from-browser chrome --dump-json "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

Isso extrairá os cookies automaticamente do Chrome.
`
    };

    return scripts[browser] || scripts.manual;
  }

  /**
   * Valida formato de cookies Netscape
   */
  validateCookieFormat(cookieText) {
    if (!cookieText || typeof cookieText !== 'string') {
      return false;
    }

    // Verificar se tem o cabeçalho Netscape ou pelo menos algumas linhas válidas
    const lines = cookieText.split('\n').filter(line => 
      line.trim() && !line.startsWith('#')
    );

    if (lines.length === 0) {
      return false;
    }

    // Verificar se pelo menos uma linha tem o formato correto (7 campos separados por tab)
    const validLines = lines.filter(line => {
      const parts = line.split('\t');
      return parts.length >= 6; // Pelo menos 6 campos (pode ter 7)
    });

    return validLines.length > 0;
  }

  /**
   * Obtém status do cookie
   */
  getCookieStatus(cookie) {
    if (!cookie.isActive) return 'inactive';
    if (!cookie.isValid) return 'invalid';
    if (cookie.expiresAt && new Date() > new Date(cookie.expiresAt)) return 'expired';
    return 'active';
  }

  /**
   * Calcula tempo até expiração
   */
  getTimeUntilExpiration(expiresAt) {
    if (!expiresAt) return null;
    
    const now = new Date();
    const expiration = new Date(expiresAt);
    const diffMs = expiration - now;
    
    if (diffMs <= 0) return 'Expirado';
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} dias`;
    if (hours > 0) return `${hours} horas`;
    return 'Menos de 1 hora';
  }

  /**
   * Limpa arquivos temporários de cookies
   */
  async cleanupTempCookieFiles() {
    try {
      const files = await fs.readdir(this.cookiesDir);
      const tempFiles = files.filter(file => 
        file.startsWith('cookies_') && file.endsWith('.txt')
      );
      
      let cleaned = 0;
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas
      
      for (const file of tempFiles) {
        const filePath = path.join(this.cookiesDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtimeMs > maxAge) {
          await fs.remove(filePath);
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        console.log(`🧹 ${cleaned} arquivos temporários de cookies removidos`);
      }
      
      return cleaned;

    } catch (error) {
      console.warn('⚠️ Erro ao limpar arquivos temporários:', error.message);
      return 0;
    }
  }
}

// Exportar instância singleton
const cookieService = new CookieService();
module.exports = cookieService;
