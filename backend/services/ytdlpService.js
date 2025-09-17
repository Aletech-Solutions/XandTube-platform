const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs-extra');
const { Video } = require('../models');

const execPromise = util.promisify(exec);

class YtdlpService {
  constructor() {
    this.downloadsPath = path.join(__dirname, '..', '..', 'videos', 'downloads');
    this.metadataPath = path.join(__dirname, '..', '..', 'videos', 'metadata');
    this.cookiesPath = path.join(__dirname, '..', 'cookies.txt');
    
    // Garante que os diretórios existem
    fs.ensureDirSync(this.downloadsPath);
    fs.ensureDirSync(this.metadataPath);
    
    // Verifica se arquivo de cookies existe
    this.hasCookies = fs.existsSync(this.cookiesPath);
    if (this.hasCookies) {
      console.log('🍪 Arquivo de cookies encontrado, será usado para evitar banimentos');
    } else {
      console.log('⚠️ Arquivo de cookies não encontrado. Para evitar banimentos, crie um arquivo cookies.txt na pasta backend');
    }
  }

  // Constrói argumentos de cookies para yt-dlp
  getCookieArgs() {
    return this.hasCookies ? `--cookies "${this.cookiesPath}"` : '';
  }

  // Obtém cookies do banco de dados se disponível
  async getDatabaseCookieArgs() {
    try {
      const cookieService = require('./cookieService');
      const bestCookies = await cookieService.getBestCookies('youtube.com');
      
      if (bestCookies) {
        const tempCookieFile = await cookieService.writeCookiesToFile(bestCookies.id);
        return `--cookies "${tempCookieFile}"`;
      }
    } catch (error) {
      console.warn('⚠️ Erro ao obter cookies do banco:', error.message);
    }
    
    // Fallback para cookies do arquivo se existir
    return this.getCookieArgs();
  }

  // Constrói argumentos anti-detecção de bot com user agents rotativos (robusto)
  getAntiDetectionArgs(attempt = 0) {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0'
    ];

    const selectedUA = userAgents[attempt % userAgents.length];
    
    // Calcular delays progressivos baseados na tentativa
    const baseDelay = 2;
    const maxDelay = 5;
    const progressiveDelay = Math.min(attempt * 2, 8);
    
    const args = [
      `--user-agent "${selectedUA}"`,
      '--add-header "Accept-Language:pt-BR,pt;q=0.9,en;q=0.8"',
      '--add-header "Accept-Encoding:gzip, deflate, br"',
      '--add-header "DNT:1"',
      '--add-header "Upgrade-Insecure-Requests:1"',
      '--add-header "Sec-Fetch-Dest:document"',
      '--add-header "Sec-Fetch-Mode:navigate"',
      '--add-header "Sec-Fetch-Site:none"',
      `--sleep-interval ${baseDelay + progressiveDelay}`,
      `--max-sleep-interval ${maxDelay + progressiveDelay}`,
      '--retries 5',
      '--fragment-retries 5',
      '--socket-timeout 30',
      '--geo-bypass',
      '--no-check-certificate',
      '--prefer-free-formats'
    ];
    
    // Adicionar estratégias específicas para tentativas subsequentes
    if (attempt > 0) {
      args.push('--force-ipv4'); // Forçar IPv4 em tentativas subsequentes
    }
    
    if (attempt > 1) {
      args.push('--source-address 0.0.0.0'); // Tentar IP fonte diferente
    }
    
    return args.join(' ');
  }

  // Constrói comando completo com todas as proteções
  async buildProtectedCommand(baseCommand, url, attempt = 0) {
    // Tentar obter cookies do banco de dados primeiro
    const cookieArgs = await this.getDatabaseCookieArgs();
    const antiDetectionArgs = this.getAntiDetectionArgs(attempt);
    
    // Se temos cookies (do banco ou arquivo), usar eles
    if (cookieArgs) {
      return `${baseCommand} ${cookieArgs} ${antiDetectionArgs} "${url}"`;
    }
    
    // Fallback: usar cookies do navegador (Chrome como padrão)
    const browserCookieArgs = '--cookies-from-browser chrome';
    return `${baseCommand} ${browserCookieArgs} ${antiDetectionArgs} "${url}"`;
  }

  // Método robusto para executar comandos com múltiplos fallbacks avançados
  async executeWithFallbacks(baseCommand, url, options = {}) {
    const strategies = [
      // Estratégia 1: Cookies do banco + Headers avançados
      {
        name: 'Cookies do banco + Headers avançados',
        command: async (attempt) => {
          const cookieArgs = await this.getDatabaseCookieArgs();
          if (cookieArgs) {
            console.log(`🍪 Tentativa ${attempt + 1}: Usando cookies do banco de dados`);
            return `${baseCommand} ${cookieArgs} ${this.getAntiDetectionArgs(attempt)} --geo-bypass --geo-bypass-country US "${url}"`;
          }
          console.log('⚠️ Nenhum cookie válido encontrado no banco de dados');
          return null;
        },
        condition: () => true
      },
      
      // Estratégia 2: Arquivo cookies.txt (fallback principal)
      {
        name: 'Arquivo cookies.txt',
        command: (attempt) => {
          if (this.hasCookies) {
            console.log(`🍪 Tentativa ${attempt + 1}: Usando arquivo cookies.txt`);
            return `${baseCommand} --cookies "${this.cookiesPath}" ${this.getAntiDetectionArgs(attempt)} --geo-bypass --geo-bypass-country BR "${url}"`;
          }
          console.log('⚠️ Arquivo cookies.txt não encontrado');
          return null;
        },
        condition: () => this.hasCookies
      },
      
      // Estratégia 3: Chrome cookies + IPv6
      {
        name: 'Chrome cookies + IPv6',
        command: (attempt) => {
          console.log(`🌐 Tentativa ${attempt + 1}: Usando cookies do Chrome`);
          return `${baseCommand} --cookies-from-browser chrome ${this.getAntiDetectionArgs(attempt)} --force-ipv6 --geo-bypass "${url}"`;
        },
        condition: () => true
      },
      
      // Estratégia 4: Firefox cookies + diferentes headers
      {
        name: 'Firefox cookies + UA rotativo',
        command: (attempt) => {
          console.log(`🦊 Tentativa ${attempt + 1}: Usando cookies do Firefox`);
          return `${baseCommand} --cookies-from-browser firefox ${this.getAntiDetectionArgs(attempt)} --geo-bypass-country GB "${url}"`;
        },
        condition: () => true
      },
      
      // Estratégia 5: Edge + bypass geográfico
      {
        name: 'Edge + Bypass geográfico',
        command: (attempt) => {
          console.log(`🔷 Tentativa ${attempt + 1}: Usando cookies do Edge`);
          return `${baseCommand} --cookies-from-browser edge ${this.getAntiDetectionArgs(attempt)} --geo-bypass-country CA "${url}"`;
        },
        condition: () => true
      },
      
      // Estratégia 6: Método embebido (para vídeos restritos)
      {
        name: 'Método embebido',
        command: (attempt) => {
          console.log(`🔗 Tentativa ${attempt + 1}: Usando método embebido com referrer`);
          return `${baseCommand} ${this.getAntiDetectionArgs(attempt)} --referer "https://www.google.com/" --add-header "X-Forwarded-For:8.8.8.8" "${url}"`;
        },
        condition: () => true
      },
      
      // Estratégia 7: Método idade verificada
      {
        name: 'Bypass verificação idade',
        command: (attempt) => {
          console.log(`🔞 Tentativa ${attempt + 1}: Usando bypass de verificação de idade`);
          return `${baseCommand} ${this.getAntiDetectionArgs(attempt)} --age-limit 999 --geo-bypass --add-header "Cookie:PREF=f1=50000000" "${url}"`;
        },
        condition: () => true
      },
      
      // Estratégia 7: Método de extrator genérico
      {
        name: 'Extrator genérico',
        command: (attempt) => `${baseCommand} --extractor-args "youtube:player_client=web" ${this.getAntiDetectionArgs(attempt)} "${url}"`,
        condition: () => true
      },
      
      // Estratégia 8: Último recurso - comando simples com delay longo
      {
        name: 'Último recurso (delay longo)',
        command: (attempt) => `${baseCommand} --sleep-interval 10 --max-sleep-interval 15 --retries 5 "${url}"`,
        condition: () => true
      }
    ];

    let attemptCount = 0;
    const maxAttempts = strategies.length * 2; // Permite algumas repetições com diferentes UAs
    
    while (attemptCount < maxAttempts) {
      const strategy = strategies[attemptCount % strategies.length];
      
      if (!strategy.condition()) {
        attemptCount++;
        continue;
      }
      
      try {
        const commandResult = await strategy.command(attemptCount);
        if (!commandResult) {
          attemptCount++;
          continue;
        }
        
        console.log(`🔄 Tentativa ${attemptCount + 1}/${maxAttempts}: ${strategy.name}`);
        
        const result = await execPromise(commandResult, {
          maxBuffer: options.maxBuffer || 1024 * 1024 * 10,
          timeout: options.timeout || 120000 // Timeout maior para comandos complexos
        });
        
        if (result.stdout && result.stdout.trim()) {
          console.log(`✅ Sucesso com: ${strategy.name}`);
          return result;
        }
      } catch (error) {
        const errorMsg = error.message.substring(0, 150);
        console.log(`❌ ${strategy.name} falhou: ${errorMsg}...`);
        
        // Análise do tipo de erro para estratégia de delay
        if (error.message.includes('bot') || error.message.includes('Sign in') || error.message.includes('confirm you\'re not a bot')) {
          console.log('🤖 Detecção de bot detectada - aplicando estratégias avançadas...');
          const delayTime = Math.min(10000 + (attemptCount * 2000), 30000); // Delay progressivo até 30s
          console.log(`⏳ Aguardando ${delayTime/1000} segundos antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delayTime));
          
          // Log de orientação para o usuário
          if (attemptCount > 3) {
            console.log('💡 DICA: Para melhor performance, certifique-se de que o arquivo cookies.txt esteja atualizado.');
            console.log('💡 Você pode exportar cookies do seu navegador usando uma extensão como "Get cookies.txt"');
          }
        } else if (error.message.includes('429') || error.message.includes('rate limit')) {
          console.log('⏱️ Rate limit detectado - aguardando período maior...');
          await new Promise(resolve => setTimeout(resolve, 20000));
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
          console.log('🚫 Acesso negado - tentando estratégia alternativa...');
          await new Promise(resolve => setTimeout(resolve, 12000));
        } else if (error.message.includes('private') || error.message.includes('unavailable')) {
          console.log('🔒 Vídeo/Canal privado ou indisponível - pulando para próxima estratégia...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          console.log('⚠️ Erro genérico - aguardando antes de tentar novamente...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
      
      attemptCount++;
    }
    
    throw new Error(`Todas as ${maxAttempts} tentativas falharam. O YouTube está bloqueando muito agressivamente. Tente novamente em alguns minutos ou use um IP/VPN diferente.`);
  }

  // Método especial para vídeos muito bloqueados usando técnicas avançadas
  async executeAdvancedBypass(url, options = {}) {
    console.log('🚀 Iniciando bypass avançado para vídeo altamente protegido...');
    
    const advancedStrategies = [
      {
        name: 'YouTube API simulada',
        command: `yt-dlp --extractor-args "youtube:player_client=web,tv" --geo-bypass --cookies-from-browser chrome "${url}"`,
      },
      {
        name: 'Método mobile web',
        command: `yt-dlp --extractor-args "youtube:player_client=mweb" --user-agent "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15" "${url}"`,
      },
      {
        name: 'Cliente Android TV',
        command: `yt-dlp --extractor-args "youtube:player_client=tv_embedded" --geo-bypass --age-limit 999 "${url}"`,
      },
      {
        name: 'Método embebido com iframe',
        command: `yt-dlp --extractor-args "youtube:player_client=web" --referer "https://www.youtube.com/embed/" --add-header "Origin:https://www.youtube.com" "${url}"`,
      },
      {
        name: 'Cliente iOS nativo',
        command: `yt-dlp --extractor-args "youtube:player_client=ios" --user-agent "com.google.ios.youtube/19.09.3 (iPhone14,3; U; CPU iOS 16_0 like Mac OS X)" "${url}"`,
      }
    ];

    for (let i = 0; i < advancedStrategies.length; i++) {
      const strategy = advancedStrategies[i];
      
      try {
        console.log(`🔧 Bypass avançado ${i + 1}/${advancedStrategies.length}: ${strategy.name}`);
        
        const result = await execPromise(strategy.command, {
          maxBuffer: options.maxBuffer || 1024 * 1024 * 10,
          timeout: 180000 // 3 minutos para estratégias avançadas
        });
        
        if (result.stdout && result.stdout.trim()) {
          console.log(`🎉 SUCESSO com bypass avançado: ${strategy.name}`);
          return result;
        }
      } catch (error) {
        console.log(`❌ Bypass ${strategy.name} falhou: ${error.message.substring(0, 100)}...`);
        
        // Delay progressivo mais longo para métodos avançados
        const delay = (i + 1) * 3000; // 3s, 6s, 9s, etc.
        console.log(`⏳ Aguardando ${delay/1000}s antes da próxima tentativa avançada...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Todos os métodos avançados de bypass falharam. O vídeo pode estar permanentemente restrito.');
  }

  // Busca informações do vídeo/playlist sem baixar usando comando direto
  async getInfo(url) {
    console.log('🔍 Iniciando busca de informações para:', url);
    
    try {
      // Verifica se é playlist e ajusta o comando
      const isPlaylistUrl = url.includes('playlist') || url.includes('list=');
      
      if (isPlaylistUrl) {
        console.log('📋 Detectada URL de playlist, usando método otimizado...');
        return await this.getPlaylistInfo(url);
      } else {
        console.log('🎥 Detectada URL de vídeo único...');
        return await this.getVideoInfo(url);
      }
    } catch (error) {
      console.error('❌ Erro detalhado ao buscar informações:', error.message);
      console.error('🔗 URL problemática:', url);
      throw new Error(`Não foi possível obter informações: ${error.message || 'Erro desconhecido'}`);
    }
  }

  // Método específico para obter informações de vídeo único
  async getVideoInfo(url) {
    try {
      console.log('🚀 Obtendo informações do vídeo com métodos robustos...');
      
      const baseCommand = 'yt-dlp --dump-json --no-warnings --extractor-args "youtube:lang=pt"';
      const result = await this.executeWithFallbacks(baseCommand, url, {
        maxBuffer: 1024 * 1024 * 10
      });
      
      const info = JSON.parse(result.stdout.trim());
      console.log('✅ Informações do vídeo obtidas com sucesso!');
      return info;
    } catch (error) {
      console.log('⚠️ Métodos padrão falharam, tentando bypass avançado...');
      
      // Último recurso: bypass avançado
      try {
        const advancedResult = await this.executeAdvancedBypass(url, {
          maxBuffer: 1024 * 1024 * 10
        });
        
        // Processa output que pode conter --dump-json
        let stdout = advancedResult.stdout.trim();
        
        // Se o comando avançado não tinha --dump-json, executa novamente para obter JSON
        if (!stdout.startsWith('{')) {
          console.log('📊 Bypass funcionou, obtendo JSON...');
          const jsonCommand = `yt-dlp --extractor-args "youtube:player_client=web;lang=pt" --dump-json --no-warnings "${url}"`;
          const jsonResult = await execPromise(jsonCommand, { maxBuffer: 1024 * 1024 * 10 });
          stdout = jsonResult.stdout.trim();
        }
        
        const info = JSON.parse(stdout);
        console.log('🎉 Sucesso com bypass avançado!');
        return info;
      } catch (advancedError) {
        console.log('❌ Bypass avançado também falhou:', advancedError.message);
        throw new Error(`Todos os métodos falharam: ${error.message}. Bypass avançado: ${advancedError.message}`);
      }
    }
  }

  // Método específico para obter informações de playlist
  async getPlaylistInfo(url) {
    try {
      console.log('🚀 Usando comando otimizado para playlist...');
      
      const cookieArgs = await this.getDatabaseCookieArgs();
      if (cookieArgs) {
        console.log('🍪 Usando cookies para playlist');
      }
      
      // Primeiro, obtém informações básicas da playlist
      const command = `yt-dlp ${cookieArgs} --dump-json --flat-playlist --no-warnings "${url}"`;
      const { stdout: playlistStdout } = await execPromise(
        command, 
        { maxBuffer: 1024 * 1024 * 50 } // 50MB buffer para playlists grandes
      );
      
      if (!playlistStdout || playlistStdout.trim() === '') {
        throw new Error('YT-DLP retornou saída vazia para playlist');
      }

      // Para playlists, o yt-dlp pode retornar múltiplas linhas JSON
      const lines = playlistStdout.trim().split('\n').filter(line => line.trim());
      
      let playlistInfo = null;
      const entries = [];

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          
          if (parsed._type === 'playlist') {
            // Esta é a informação principal da playlist
            playlistInfo = parsed;
          } else if (parsed._type === 'url' || parsed.id) {
            // Esta é uma entrada da playlist
            entries.push({
              id: parsed.id,
              title: parsed.title || `Vídeo ${entries.length + 1}`,
              url: parsed.url || `https://www.youtube.com/watch?v=${parsed.id}`,
              duration: parsed.duration || 0,
              thumbnail: parsed.thumbnail || parsed.thumbnails?.[0]?.url || ''
            });
          }
        } catch (parseError) {
          console.warn('⚠️ Linha JSON inválida ignorada:', parseError.message);
        }
      }

      // Se não conseguiu obter informações da playlist, cria uma estrutura básica
      if (!playlistInfo) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const playlistId = urlParams.get('list');
        
        playlistInfo = {
          _type: 'playlist',
          id: playlistId || 'unknown',
          title: `Playlist ${playlistId || 'Desconhecida'}`,
          entries: entries
        };
      } else {
        // Garante que as entries estão no formato correto
        playlistInfo.entries = entries;
      }

      console.log(`✅ Playlist processada: ${entries.length} vídeos encontrados`);
      console.log('📊 Título da playlist:', playlistInfo.title);
      
      return playlistInfo;
    } catch (error) {
      console.error('❌ Erro ao processar playlist:', error.message);
      
      // Fallback: tenta método mais simples
      try {
        console.log('🔄 Tentando método alternativo para playlist...');
        const fallbackCookieArgs = await this.getDatabaseCookieArgs();
        const fallbackCommand = `yt-dlp ${fallbackCookieArgs} --dump-json --no-warnings --max-downloads 5 "${url}"`;
        const { stdout } = await execPromise(
          fallbackCommand,
          { maxBuffer: 1024 * 1024 * 20 }
        );
        
        if (stdout && stdout.trim()) {
          const lines = stdout.trim().split('\n');
          const firstVideo = JSON.parse(lines[0]);
          
          // Cria uma estrutura de playlist simulada
          return {
            _type: 'playlist',
            id: 'fallback',
            title: 'Playlist (limitada a 5 vídeos)',
            entries: lines.map((line, index) => {
              try {
                const video = JSON.parse(line);
                return {
                  id: video.id,
                  title: video.title || `Vídeo ${index + 1}`,
                  url: video.webpage_url || `https://www.youtube.com/watch?v=${video.id}`,
                  duration: video.duration || 0,
                  thumbnail: video.thumbnail || ''
                };
              } catch (e) {
                return null;
              }
            }).filter(v => v !== null)
          };
        }
      } catch (fallbackError) {
        console.error('❌ Método alternativo também falhou:', fallbackError.message);
      }
      
      throw new Error(`Não foi possível processar a playlist: ${error.message}`);
    }
  }

  // Formata metadados do vídeo
  formatVideoMetadata(info) {
    // Trata casos onde info pode ter estruturas diferentes
    if (!info) {
      return null;
    }

    // Obtém a melhor resolução disponível dos formatos
    let bestHeight = info.height || 0;
    if (info.formats && Array.isArray(info.formats)) {
      bestHeight = Math.max(bestHeight, ...info.formats
        .filter(f => f.height && f.vcodec !== 'none')
        .map(f => f.height)
      );
    }

    return {
      youtubeId: info.id || info.display_id || 'unknown',
      title: info.title || 'Vídeo sem título',
      description: info.description || '',
      duration: info.duration || 0,
      thumbnail: info.thumbnail || info.thumbnails?.[0]?.url || '',
      originalUrl: info.webpage_url || info.url || '',
      channelId: info.channel_id || info.uploader_id,
      channelName: info.channel || info.uploader || 'Canal Desconhecido',
      uploadDate: info.upload_date,
      viewCount: info.view_count || 0,
      likeCount: info.like_count || 0,
      tags: info.tags || [],
      categories: info.categories || [],
      resolution: bestHeight ? `${bestHeight}p` : 'unknown',
      format: info.ext || 'mp4',
      availableQualities: info.formats ? this.extractQualityOptions(info.formats) : []
    };
  }

  // Extrai opções de qualidade disponíveis
  extractQualityOptions(formats) {
    const qualities = new Set();
    
    formats.forEach(format => {
      if (format.height && format.vcodec !== 'none') {
        qualities.add(`${format.height}p`);
      }
    });

    return Array.from(qualities)
      .map(q => parseInt(q))
      .sort((a, b) => b - a)
      .map(q => `${q}p`);
  }

  // Converte opção de qualidade do usuário para formato yt-dlp
  buildQualitySelector(requestedQuality) {
    if (!requestedQuality || requestedQuality === 'best') {
      // Sempre prioriza a melhor qualidade disponível
      return 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best[ext=mp4]/best';
    }

    // Para qualidades específicas (1080p, 720p, etc.)
    const height = parseInt(requestedQuality.replace('p', ''));
    
    return [
      // Primeiro: tenta vídeo + áudio na altura específica
      `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]`,
      // Segundo: qualquer formato na altura específica
      `bestvideo[height<=${height}]+bestaudio`,
      // Terceiro: melhor MP4 na altura específica
      `best[height<=${height}][ext=mp4]`,
      // Quarto: qualquer formato na altura específica
      `best[height<=${height}]`,
      // Quinto: fallback para melhor qualidade geral
      'bestvideo[ext=mp4]+bestaudio[ext=m4a]',
      'bestvideo+bestaudio',
      'best[ext=mp4]',
      'best'
    ].join('/');
  }

  // Baixa vídeo único com callback de progresso usando comando direto
  async downloadVideo(url, options = {}, progressCallback = null) {
    const info = await this.getInfo(url);
    const metadata = this.formatVideoMetadata(info);
    
    if (!metadata) {
      throw new Error('Não foi possível formatar metadados do vídeo');
    }
    
    const filename = `${metadata.youtubeId}_${Date.now()}.mp4`;
    const outputPath = path.join(this.downloadsPath, filename);

    // Constrói comando yt-dlp com seletor de qualidade otimizado e proteções
    const quality = this.buildQualitySelector(options.quality);
    const baseCommand = `yt-dlp -f "${quality}" --no-playlist --write-info-json --write-thumbnail --merge-output-format mp4 --geo-bypass --geo-bypass-country BR --prefer-free-formats --sub-langs "pt,pt-BR,en" --extractor-args "youtube:lang=pt" -o "${outputPath}"`;
    const command = await this.buildProtectedCommand(baseCommand, url);

    console.log('📥 Iniciando download com comando:', command);
    console.log('📊 Qualidade solicitada:', options.quality || 'best');
    console.log('📊 Seletor yt-dlp:', quality);

    // Se tiver callback de progresso
    if (progressCallback) {
      return new Promise((resolve, reject) => {
        const ytdlProcess = exec(command);
        
        ytdlProcess.stdout.on('data', (data) => {
          const output = data.toString();
          console.log('📊 YT-DLP Output:', output);
          
          // Busca por padrões de progresso
          const progressMatch = output.match(/(\d+\.?\d*)%/);
          
          if (progressMatch) {
            const progress = parseFloat(progressMatch[1]);
            console.log(`📈 Progresso: ${progress}%`);
            progressCallback(progress);
          }
        });

        ytdlProcess.stderr.on('data', (data) => {
          console.log('📝 YT-DLP Stderr:', data.toString());
        });

        ytdlProcess.on('error', (error) => {
          console.error('❌ Erro no processo:', error);
          reject(error);
        });

        ytdlProcess.on('close', async (code) => {
          console.log(`📋 Processo finalizado com código: ${code}`);
          
          if (code === 0) {
            // Aguardar um pouco para garantir que todos os arquivos foram escritos
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Determinar caminhos dos arquivos gerados
            const baseName = outputPath.replace('.mp4', '');
            const thumbnailPath = await this.findThumbnailFile(baseName);
            const infoPath = `${baseName}.info.json`;
            
            console.log(`🖼️ Thumbnail detectada: ${thumbnailPath ? path.basename(thumbnailPath) : 'Não encontrada'}`);
            
            resolve({
              metadata,
              filePath: outputPath,
              filename,
              thumbnailPath: thumbnailPath && await fs.pathExists(thumbnailPath) ? thumbnailPath : null,
              infoPath: await fs.pathExists(infoPath) ? infoPath : null,
              fileSize: await fs.pathExists(outputPath) ? (await fs.stat(outputPath)).size : null
            });
          } else {
            reject(new Error(`Download falhou com código ${code}`));
          }
        });
      });
    }

    // Download sem callback de progresso
    try {
      const { stdout, stderr } = await execPromise(command, {
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      console.log('✅ Download concluído:', stdout);
      
      if (stderr) {
        console.log('📝 Stderr:', stderr);
      }
      
      // Aguardar um pouco para garantir que todos os arquivos foram escritos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Determinar caminhos dos arquivos gerados
      const baseName = outputPath.replace('.mp4', '');
      const thumbnailPath = await this.findThumbnailFile(baseName);
      const infoPath = `${baseName}.info.json`;
      
      console.log(`🖼️ Thumbnail detectada: ${thumbnailPath ? path.basename(thumbnailPath) : 'Não encontrada'}`);
      
      return {
        metadata,
        filePath: outputPath,
        filename,
        thumbnailPath: thumbnailPath && await fs.pathExists(thumbnailPath) ? thumbnailPath : null,
        infoPath: await fs.pathExists(infoPath) ? infoPath : null,
        fileSize: await fs.pathExists(outputPath) ? (await fs.stat(outputPath)).size : null
      };
    } catch (error) {
      console.error('❌ Erro no download:', error.message);
      
      // Log adicional para debug
      if (error.stderr) {
        console.error('📝 Stderr detalhado:', error.stderr);
      }
      
      // Verificar se é um erro de comando muito longo
      if (error.message.includes('too long') || error.message.includes('command line')) {
        console.error('⚠️ Comando muito longo detectado, tentando versão simplificada...');
        
        // Tentar com comando mais simples
        try {
          const simpleCommand = `yt-dlp -f "best" --no-playlist -o "${outputPath}" "${url}"`;
          console.log('🔄 Tentando comando simplificado:', simpleCommand);
          
          const { stdout } = await execPromise(simpleCommand, {
            maxBuffer: 1024 * 1024 * 10
          });
          
          console.log('✅ Download simplificado concluído');
          
          return {
            metadata,
            filePath: outputPath,
            filename,
            thumbnailPath: null,
            infoPath: null,
            fileSize: await fs.pathExists(outputPath) ? (await fs.stat(outputPath)).size : null
          };
        } catch (simpleError) {
          console.error('❌ Comando simplificado também falhou:', simpleError.message);
          throw new Error(`Download falhou: ${error.message}. Tentativa simplificada: ${simpleError.message}`);
        }
      }
      
      throw new Error(`Erro no download: ${error.message}`);
    }
  }

  // Baixa playlist inteira com progresso individual para cada vídeo
  async downloadPlaylist(url, options = {}, progressCallback = null) {
    const playlistInfo = await this.getInfo(url);
    
    if (!playlistInfo.entries || playlistInfo.entries.length === 0) {
      throw new Error('Playlist vazia ou inválida');
    }

    const results = [];
    const totalVideos = playlistInfo.entries.length;
    const videosProgress = {};

    // Inicializa progresso de todos os vídeos
    for (let i = 0; i < totalVideos; i++) {
      const video = playlistInfo.entries[i];
      if (video && video.id) {
        videosProgress[video.id] = {
          index: i + 1,
          title: video.title || `Vídeo ${i + 1}`,
          status: 'pending',
          progress: 0,
          error: null
        };
      }
    }

    // Envia progresso inicial
    if (progressCallback) {
      progressCallback({
        type: 'playlist_init',
        totalVideos,
        playlistTitle: playlistInfo.title,
        videos: videosProgress
      });
    }

    for (let i = 0; i < totalVideos; i++) {
      const video = playlistInfo.entries[i];
      
      if (!video || !video.url) {
        if (video && video.id && videosProgress[video.id]) {
          videosProgress[video.id].status = 'skipped';
          videosProgress[video.id].error = 'URL inválida';
          
          if (progressCallback) {
            progressCallback({
              type: 'video_update',
              videoId: video.id,
              videos: videosProgress,
              current: i + 1,
              total: totalVideos
            });
          }
        }
        continue;
      }

      try {
        // Marca vídeo como iniciando
        if (video.id && videosProgress[video.id]) {
          videosProgress[video.id].status = 'starting';
          videosProgress[video.id].progress = 0;
          
          if (progressCallback) {
            progressCallback({
              type: 'video_update',
              videoId: video.id,
              videos: videosProgress,
              current: i + 1,
              total: totalVideos
            });
          }
        }

        const result = await this.downloadVideo(
          video.url,
          options,
          progressCallback ? (progress) => {
            if (video.id && videosProgress[video.id]) {
              videosProgress[video.id].status = 'downloading';
              videosProgress[video.id].progress = progress;
              
              progressCallback({
                type: 'video_update',
                videoId: video.id,
                videos: videosProgress,
                current: i + 1,
                total: totalVideos,
                videoProgress: progress
              });
            }
          } : null
        );

        // Marca como concluído
        if (video.id && videosProgress[video.id]) {
          videosProgress[video.id].status = 'completed';
          videosProgress[video.id].progress = 100;
          
          if (progressCallback) {
            progressCallback({
              type: 'video_update',
              videoId: video.id,
              videos: videosProgress,
              current: i + 1,
              total: totalVideos
            });
          }
        }

        results.push(result);
      } catch (error) {
        console.error(`Erro ao baixar vídeo ${i + 1}/${totalVideos}:`, error);
        
        // Marca como erro
        if (video.id && videosProgress[video.id]) {
          videosProgress[video.id].status = 'error';
          videosProgress[video.id].error = error.message;
          
          if (progressCallback) {
            progressCallback({
              type: 'video_update',
              videoId: video.id,
              videos: videosProgress,
              current: i + 1,
              total: totalVideos
            });
          }
        }
        
        results.push({
          error: error.message,
          video: video.title || video.url,
          videoId: video.id
        });
      }
    }

    // Finaliza playlist
    if (progressCallback) {
      progressCallback({
        type: 'playlist_complete',
        totalVideos,
        downloaded: results.filter(r => !r.error).length,
        videos: videosProgress
      });
    }

    return {
      playlistTitle: playlistInfo.title,
      playlistId: playlistInfo.id,
      totalVideos,
      downloaded: results.filter(r => !r.error).length,
      results,
      videosProgress
    };
  }

  // Obtém formatos disponíveis para download usando comando direto
  async getAvailableFormats(url) {
    try {
      console.log('🔍 Listando formatos disponíveis para:', url);
      
      const cookieArgs = await this.getDatabaseCookieArgs();
      const command = `yt-dlp ${cookieArgs} --list-formats --dump-json "${url}"`;
      
      if (cookieArgs) {
        console.log('🍪 Usando cookies para listar formatos');
      }
      
      const { stdout } = await execPromise(command, {
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      if (!stdout || stdout.trim() === '') {
        throw new Error('Nenhum formato encontrado');
      }

      const info = JSON.parse(stdout.trim());

      if (!info.formats || !Array.isArray(info.formats)) {
        throw new Error('Formatos não encontrados na resposta');
      }

      return info.formats.map(format => ({
        formatId: format.format_id,
        ext: format.ext,
        resolution: format.resolution || format.height ? `${format.height}p` : 'audio only',
        filesize: format.filesize,
        quality: format.quality,
        fps: format.fps,
        vcodec: format.vcodec || 'none',
        acodec: format.acodec || 'none'
      }));
    } catch (error) {
      console.error('❌ Erro ao listar formatos:', error.message);
      throw new Error('Não foi possível obter formatos disponíveis: ' + error.message);
    }
  }

  // Limpa arquivos temporários
  async cleanupTempFiles(olderThanDays = 7) {
    const now = Date.now();
    const maxAge = olderThanDays * 24 * 60 * 60 * 1000;

    const files = await fs.readdir(this.downloadsPath);
    
    for (const file of files) {
      const filePath = path.join(this.downloadsPath, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtimeMs > maxAge) {
        await fs.remove(filePath);
        console.log(`Arquivo temporário removido: ${file}`);
      }
    }
  }

  // Get available video formats for quality selection
  async getVideoFormats(videoUrl) {
    try {
      console.log('🔍 Obtendo formatos disponíveis para:', videoUrl);
      
      const cookieArgs = this.getCookieArgs();
      const command = `yt-dlp ${cookieArgs} --list-formats --dump-json --no-warnings "${videoUrl}"`;
      
      const { stdout } = await execPromise(
        command,
        { maxBuffer: 1024 * 1024 * 5 }
      );

      if (!stdout.trim()) {
        console.warn('⚠️ Nenhum formato retornado');
        return [];
      }

      // Parse JSON lines
      const lines = stdout.trim().split('\n').filter(line => line.trim());
      const formats = [];

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.formats) {
            // Se é o objeto principal com array de formatos
            return parsed.formats;
          } else if (parsed.format_id) {
            // Se é um formato individual
            formats.push(parsed);
          }
        } catch (parseError) {
          // Ignorar linhas que não são JSON válido
          continue;
        }
      }

      console.log(`✅ Encontrados ${formats.length} formatos disponíveis`);
      return formats;

    } catch (error) {
      console.error('❌ Erro ao obter formatos do vídeo:', error);
      return [];
    }
  }

  // Get recent videos from a channel
  async getChannelVideos(channelUrl, limit = 5) {
    try {
      console.log(`🔍 Obtendo ${limit} vídeos recentes do canal:`, channelUrl);
      
      const cookieArgs = await this.getDatabaseCookieArgs();
      const command = `yt-dlp ${cookieArgs} --dump-json --flat-playlist --playlist-end ${limit} --no-warnings --extractor-args "youtube:lang=pt" "${channelUrl}"`;
      
      if (cookieArgs) {
        console.log('🍪 Usando cookies para obter vídeos do canal');
      }
      console.log('🇧🇷 Priorizando títulos em português');
      
      const { stdout } = await execPromise(
        command,
        { maxBuffer: 1024 * 1024 * 10 }
      );

      if (!stdout.trim()) {
        console.warn('⚠️ Nenhum dado retornado para vídeos do canal');
        return [];
      }

      // Parse each line as a separate JSON object
      const lines = stdout.trim().split('\n').filter(line => line.trim());
      const videos = [];

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          
          // Skip if it's channel info (not a video)
          if (parsed._type === 'playlist' || !parsed.id) {
            continue;
          }
          
          videos.push({
            id: parsed.id,
            title: parsed.title || 'Vídeo sem título',
            description: parsed.description || null,
            duration: parsed.duration || null,
            upload_date: parsed.upload_date,
            view_count: parsed.view_count || 0,
            url: parsed.url || `https://www.youtube.com/watch?v=${parsed.id}`
          });
        } catch (parseError) {
          console.warn('⚠️ Linha JSON inválida ignorada:', parseError.message);
        }
      }

      console.log(`✅ Encontrados ${videos.length} vídeos do canal`);
      return videos;

    } catch (error) {
      console.error('❌ Erro ao obter vídeos do canal:', error);
      throw new Error(`Falha ao obter vídeos do canal: ${error.message}`);
    }
  }

  // Get channel information
  async getChannelInfo(channelUrl) {
    try {
      console.log('🔍 Obtendo informações do canal:', channelUrl);
      
      // Usar executeWithFallbacks para melhor resistência a detecção de bot
      const baseCommand = 'yt-dlp --dump-json --flat-playlist --playlist-end 1 --no-warnings --extractor-args "youtube:lang=pt"';
      
      console.log('🍪 Usando cookies para obter informações do canal');
      console.log('🇧🇷 Priorizando títulos em português');
      console.log('🛡️ Usando estratégias anti-detecção de bot');
      
      const { stdout } = await this.executeWithFallbacks(
        baseCommand, 
        channelUrl,
        { maxBuffer: 1024 * 1024 * 10 } // 10MB buffer
      );
      
      if (!stdout || stdout.trim() === '') {
        throw new Error('YT-DLP retornou saída vazia para o canal');
      }

      // Parse the first line which should contain channel info
      const lines = stdout.trim().split('\n').filter(line => line.trim());
      let channelInfo = null;

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          
          // Look for channel information
          if (parsed._type === 'playlist' || parsed.channel || parsed.uploader) {
            channelInfo = parsed;
            break;
          }
        } catch (parseError) {
          console.warn('⚠️ Linha JSON inválida ignorada:', parseError.message);
        }
      }

      if (!channelInfo) {
        // Fallback: try to get channel info using different approach
        const fallbackCookieArgs = await this.getDatabaseCookieArgs();
        const fallbackCommand = `yt-dlp ${fallbackCookieArgs} --dump-json --no-warnings --playlist-end 1 "${channelUrl}"`;
        const { stdout: fallbackStdout } = await execPromise(
          fallbackCommand,
          { maxBuffer: 1024 * 1024 * 10 }
        );
        
        const fallbackLines = fallbackStdout.trim().split('\n').filter(line => line.trim());
        if (fallbackLines.length > 0) {
          const videoInfo = JSON.parse(fallbackLines[0]);
          
          // Extrair informações do canal a partir do vídeo, priorizando campos do canal
          channelInfo = {
            _type: 'playlist',
            id: videoInfo.channel_id || videoInfo.uploader_id,
            channel_id: videoInfo.channel_id || videoInfo.uploader_id,
            channel: videoInfo.channel || videoInfo.uploader,
            uploader: videoInfo.uploader || videoInfo.channel,
            uploader_id: videoInfo.uploader_id || videoInfo.channel_id,
            title: videoInfo.channel || videoInfo.uploader, // Usar nome do canal, não título do vídeo
            description: videoInfo.channel_description || videoInfo.description,
            subscriber_count: videoInfo.channel_follower_count || videoInfo.subscriber_count,
            video_count: videoInfo.playlist_count,
            thumbnail: videoInfo.channel_thumbnail || videoInfo.thumbnail
          };
          console.log('ℹ️ Informações do canal extraídas via vídeo');
        }
      }

      if (!channelInfo) {
        throw new Error('Não foi possível extrair informações do canal');
      }

      console.log('✅ Informações do canal obtidas com sucesso!');
      console.log(`📊 Canal: ${channelInfo.channel || channelInfo.uploader || 'N/A'}`);
      console.log(`📊 ID: ${channelInfo.id || channelInfo.channel_id || channelInfo.uploader_id || 'N/A'}`);
      
      return channelInfo;
      
    } catch (error) {
      console.error('❌ Erro ao obter informações do canal:', error.message);
      throw new Error(`Erro ao obter informações do canal: ${error.message}`);
    }
  }

  // Encontra o arquivo de thumbnail gerado pelo YT-DLP
  async findThumbnailFile(baseName) {
    try {
      const possibleExtensions = ['.webp', '.jpg', '.jpeg', '.png'];
      
      // Método 1: Procurar com o nome exato
      for (const ext of possibleExtensions) {
        const thumbnailPath = `${baseName}${ext}`;
        if (await fs.pathExists(thumbnailPath)) {
          console.log(`🔍 Thumbnail encontrada (método 1): ${path.basename(thumbnailPath)}`);
          return thumbnailPath;
        }
      }
      
      // Método 2: Procurar arquivos que começam com o baseName
      const files = await fs.readdir(this.downloadsPath);
      const fileBaseName = path.basename(baseName);
      
      const thumbnailFile = files.find(file => {
        return file.startsWith(fileBaseName) && possibleExtensions.some(ext => file.endsWith(ext));
      });
      
      if (thumbnailFile) {
        const fullPath = path.join(this.downloadsPath, thumbnailFile);
        console.log(`🔍 Thumbnail encontrada (método 2): ${thumbnailFile}`);
        return fullPath;
      }
      
      // Método 3: Procurar por padrão mais flexível (caso o nome tenha mudado)
      const possibleThumbnails = files.filter(file => 
        possibleExtensions.some(ext => file.endsWith(ext)) &&
        file.includes(fileBaseName.split('_')[0]) // Usar apenas o ID do YouTube
      );
      
      if (possibleThumbnails.length > 0) {
        // Pegar o mais recente
        const mostRecent = possibleThumbnails.sort((a, b) => {
          const aTime = a.match(/_(\d+)\./)?.[1] || '0';
          const bTime = b.match(/_(\d+)\./)?.[1] || '0';
          return parseInt(bTime) - parseInt(aTime);
        })[0];
        
        const fullPath = path.join(this.downloadsPath, mostRecent);
        console.log(`🔍 Thumbnail encontrada (método 3): ${mostRecent}`);
        return fullPath;
      }
      
      console.log(`❌ Thumbnail não encontrada para: ${fileBaseName}`);
      return null;
    } catch (error) {
      console.warn('⚠️ Erro ao procurar arquivo de thumbnail:', error.message);
      return null;
    }
  }

  // Get new videos from channel within date range
  async getChannelVideosInDateRange(channelUrl, fromDate, toDate) {
    try {
      console.log(`🔍 Buscando vídeos do canal entre ${fromDate} e ${toDate}`);
      
      // Format dates for yt-dlp (YYYYMMDD format)
      const formatDate = (date) => {
        const d = new Date(date);
        return d.getFullYear().toString() + 
               (d.getMonth() + 1).toString().padStart(2, '0') + 
               d.getDate().toString().padStart(2, '0');
      };

      const fromDateFormatted = formatDate(fromDate);
      const toDateFormatted = formatDate(toDate);

      const cookieArgs = await this.getDatabaseCookieArgs();
      const command = `yt-dlp ${cookieArgs} --dump-json --flat-playlist --dateafter ${fromDateFormatted} --datebefore ${toDateFormatted} --no-warnings --extractor-args "youtube:lang=pt" "${channelUrl}"`;
      
      if (cookieArgs) {
        console.log('🍪 Usando cookies para buscar vídeos do canal');
      }
      console.log('🇧🇷 Priorizando títulos em português');
      
      const { stdout } = await execPromise(
        command,
        { maxBuffer: 1024 * 1024 * 50 } // 50MB buffer for large channels
      );
      
      if (!stdout || stdout.trim() === '') {
        console.log('ℹ️ Nenhum vídeo encontrado no período especificado');
        return [];
      }

      const lines = stdout.trim().split('\n').filter(line => line.trim());
      const videos = [];

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          
          // Skip playlist info, only get video entries
          if (parsed._type !== 'playlist' && parsed.id) {
            videos.push({
              id: parsed.id,
              title: parsed.title || 'Vídeo sem título',
              url: parsed.url || `https://www.youtube.com/watch?v=${parsed.id}`,
              upload_date: parsed.upload_date,
              duration: parsed.duration || 0,
              thumbnail: parsed.thumbnail || parsed.thumbnails?.[0]?.url || '',
              description: parsed.description || '',
              view_count: parsed.view_count || 0
            });
          }
        } catch (parseError) {
          console.warn('⚠️ Linha JSON inválida ignorada:', parseError.message);
        }
      }

      console.log(`✅ Encontrados ${videos.length} vídeos no período especificado`);
      return videos;
      
    } catch (error) {
      console.error('❌ Erro ao buscar vídeos do canal:', error.message);
      throw new Error(`Erro ao buscar vídeos do canal: ${error.message}`);
    }
  }
}

module.exports = new YtdlpService();