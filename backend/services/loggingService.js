const fs = require('fs-extra');
const path = require('path');

/**
 * Serviço de logging estruturado para o sistema
 */
class LoggingService {
  constructor() {
    this.logsDir = path.join(__dirname, '..', 'logs');
    this.maxLogFiles = 30; // Manter logs por 30 dias
    this.maxLogSize = 10 * 1024 * 1024; // 10MB por arquivo
    
    // Garantir que o diretório de logs existe
    fs.ensureDirSync(this.logsDir);
    
    // Limpar logs antigos no startup
    this.cleanupOldLogs();
  }

  /**
   * Log de informação
   */
  info(component, message, data = {}) {
    this.writeLog('INFO', component, message, data);
  }

  /**
   * Log de sucesso
   */
  success(component, message, data = {}) {
    this.writeLog('SUCCESS', component, message, data);
  }

  /**
   * Log de aviso
   */
  warn(component, message, data = {}) {
    this.writeLog('WARN', component, message, data);
  }

  /**
   * Log de erro
   */
  error(component, message, data = {}) {
    this.writeLog('ERROR', component, message, data);
  }

  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug(component, message, data = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.writeLog('DEBUG', component, message, data);
    }
  }

  /**
   * Escreve log no arquivo e console
   */
  writeLog(level, component, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      component,
      message,
      data: Object.keys(data).length > 0 ? data : undefined,
      pid: process.pid
    };

    // Log no console com cores
    this.logToConsole(logEntry);

    // Log no arquivo
    this.logToFile(logEntry);
  }

  /**
   * Log colorido no console
   */
  logToConsole(logEntry) {
    const colors = {
      INFO: '\x1b[36m',     // Cyan
      SUCCESS: '\x1b[32m',  // Green
      WARN: '\x1b[33m',     // Yellow
      ERROR: '\x1b[31m',    // Red
      DEBUG: '\x1b[35m'     // Magenta
    };

    const reset = '\x1b[0m';
    const color = colors[logEntry.level] || '';
    
    const timeStr = new Date(logEntry.timestamp).toLocaleString('pt-BR');
    const prefix = `${color}[${timeStr}] ${logEntry.level} [${logEntry.component}]${reset}`;
    
    console.log(`${prefix} ${logEntry.message}`);
    
    if (logEntry.data) {
      console.log(`${color}Data:${reset}`, JSON.stringify(logEntry.data, null, 2));
    }
  }

  /**
   * Escreve log em arquivo
   */
  async logToFile(logEntry) {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const logFile = path.join(this.logsDir, `xandtube-${today}.log`);
      
      // Verificar tamanho do arquivo
      if (await fs.pathExists(logFile)) {
        const stats = await fs.stat(logFile);
        if (stats.size > this.maxLogSize) {
          // Rotacionar arquivo se muito grande
          const rotatedFile = path.join(this.logsDir, `xandtube-${today}-${Date.now()}.log`);
          await fs.move(logFile, rotatedFile);
        }
      }

      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(logFile, logLine, 'utf8');

    } catch (error) {
      console.error('❌ Erro ao escrever log:', error);
    }
  }

  /**
   * Limpa logs antigos
   */
  async cleanupOldLogs() {
    try {
      const files = await fs.readdir(this.logsDir);
      const logFiles = files.filter(file => file.startsWith('xandtube-') && file.endsWith('.log'));
      
      if (logFiles.length <= this.maxLogFiles) {
        return;
      }

      // Ordenar por data (mais antigos primeiro)
      logFiles.sort();
      
      // Remover arquivos mais antigos
      const filesToRemove = logFiles.slice(0, logFiles.length - this.maxLogFiles);
      
      for (const file of filesToRemove) {
        const filePath = path.join(this.logsDir, file);
        await fs.remove(filePath);
        console.log(`🗑️ Log antigo removido: ${file}`);
      }

    } catch (error) {
      console.error('❌ Erro ao limpar logs antigos:', error);
    }
  }

  /**
   * Obtém logs recentes
   */
  async getRecentLogs(days = 7, level = null, component = null) {
    try {
      const logs = [];
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Ler arquivos de log no período
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const logFile = path.join(this.logsDir, `xandtube-${dateStr}.log`);
        
        if (await fs.pathExists(logFile)) {
          const content = await fs.readFile(logFile, 'utf8');
          const lines = content.trim().split('\n').filter(line => line);
          
          for (const line of lines) {
            try {
              const logEntry = JSON.parse(line);
              
              // Filtrar por level se especificado
              if (level && logEntry.level !== level) {
                continue;
              }
              
              // Filtrar por component se especificado
              if (component && logEntry.component !== component) {
                continue;
              }
              
              logs.push(logEntry);
            } catch (parseError) {
              // Ignorar linhas inválidas
            }
          }
        }
      }

      // Ordenar por timestamp (mais recentes primeiro)
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return logs;

    } catch (error) {
      console.error('❌ Erro ao obter logs recentes:', error);
      return [];
    }
  }

  /**
   * Obtém estatísticas de logs
   */
  async getLogStats(days = 7) {
    try {
      const logs = await this.getRecentLogs(days);
      
      const stats = {
        total: logs.length,
        byLevel: {},
        byComponent: {},
        byDate: {},
        errors: logs.filter(log => log.level === 'ERROR').length,
        warnings: logs.filter(log => log.level === 'WARN').length
      };

      // Contar por level
      for (const log of logs) {
        stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      }

      // Contar por component
      for (const log of logs) {
        stats.byComponent[log.component] = (stats.byComponent[log.component] || 0) + 1;
      }

      // Contar por data
      for (const log of logs) {
        const date = log.timestamp.split('T')[0];
        stats.byDate[date] = (stats.byDate[date] || 0) + 1;
      }

      return stats;

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de logs:', error);
      return {};
    }
  }

  /**
   * Log específico para tracking de canais
   */
  channelTracking(action, channelName, data = {}) {
    this.info('CHANNEL_TRACKING', `${action}: ${channelName}`, data);
  }

  /**
   * Log específico para downloads
   */
  download(action, videoTitle, data = {}) {
    this.info('DOWNLOAD', `${action}: ${videoTitle}`, data);
  }

  /**
   * Log específico para cookies
   */
  cookies(action, cookieName, data = {}) {
    this.info('COOKIES', `${action}: ${cookieName}`, data);
  }

  /**
   * Log específico para jobs
   */
  job(action, jobName, data = {}) {
    this.info('JOB', `${action}: ${jobName}`, data);
  }

  /**
   * Log de performance
   */
  performance(operation, duration, data = {}) {
    this.info('PERFORMANCE', `${operation} completed in ${duration}ms`, data);
  }
}

// Exportar instância singleton
const loggingService = new LoggingService();
module.exports = loggingService;