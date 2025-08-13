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

  // Constrói argumentos anti-detecção de bot
  getAntiDetectionArgs() {
    const args = [
      '--user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"',
      '--add-header "Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"',
      '--add-header "Accept-Language:en-US,en;q=0.5"',
      '--add-header "Accept-Encoding:gzip, deflate"',
      '--add-header "DNT:1"',
      '--add-header "Connection:keep-alive"',
      '--add-header "Upgrade-Insecure-Requests:1"',
      '--sleep-interval 1',
      '--max-sleep-interval 3'
    ];
    
    return args.join(' ');
  }

  // Constrói comando completo com todas as proteções
  buildProtectedCommand(baseCommand, url) {
    const cookieArgs = this.getCookieArgs();
    const antiDetectionArgs = this.getAntiDetectionArgs();
    
    // Primeira tentativa: com cookies e headers
    if (this.hasCookies) {
      return `${baseCommand} ${cookieArgs} ${antiDetectionArgs} "${url}"`;
    }
    
    // Segunda tentativa: usar cookies do navegador (Chrome como padrão)
    const browserCookieArgs = '--cookies-from-browser chrome';
    return `${baseCommand} ${browserCookieArgs} ${antiDetectionArgs} "${url}"`;
  }

  // Método robusto para executar comandos com múltiplos fallbacks
  async executeWithFallbacks(baseCommand, url, options = {}) {
    const attempts = [
      {
        name: 'Cookies file + Anti-detection',
        command: () => this.buildProtectedCommand(baseCommand, url),
        condition: () => this.hasCookies
      },
      {
        name: 'Chrome browser cookies + Anti-detection',
        command: () => `${baseCommand} --cookies-from-browser chrome ${this.getAntiDetectionArgs()} "${url}"`,
        condition: () => true
      },
      {
        name: 'Firefox browser cookies + Anti-detection',
        command: () => `${baseCommand} --cookies-from-browser firefox ${this.getAntiDetectionArgs()} "${url}"`,
        condition: () => true
      },
      {
        name: 'Edge browser cookies + Anti-detection',
        command: () => `${baseCommand} --cookies-from-browser edge ${this.getAntiDetectionArgs()} "${url}"`,
        condition: () => true
      },
      {
        name: 'Only anti-detection headers',
        command: () => `${baseCommand} ${this.getAntiDetectionArgs()} "${url}"`,
        condition: () => true
      },
      {
        name: 'Basic command (last resort)',
        command: () => `${baseCommand} "${url}"`,
        condition: () => true
      }
    ];

    for (const attempt of attempts) {
      if (!attempt.condition()) continue;
      
      try {
        console.log(`🔄 Tentativa: ${attempt.name}`);
        const command = attempt.command();
        const result = await execPromise(command, {
          maxBuffer: options.maxBuffer || 1024 * 1024 * 10,
          timeout: options.timeout || 60000
        });
        
        if (result.stdout && result.stdout.trim()) {
          console.log(`✅ Sucesso com: ${attempt.name}`);
          return result;
        }
      } catch (error) {
        console.log(`❌ ${attempt.name} falhou: ${error.message.substring(0, 100)}...`);
        
        // Se for erro de detecção de bot, adicionar delay antes da próxima tentativa
        if (error.message.includes('bot') || error.message.includes('Sign in')) {
          console.log('🤖 Detecção de bot detectada, aguardando 5 segundos...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }
    
    throw new Error('Todas as tentativas falharam. O YouTube pode estar bloqueando temporariamente.');
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
      
      const baseCommand = 'yt-dlp --dump-json --no-warnings';
      const result = await this.executeWithFallbacks(baseCommand, url, {
        maxBuffer: 1024 * 1024 * 10
      });
      
      const info = JSON.parse(result.stdout.trim());
      console.log('✅ Informações do vídeo obtidas com sucesso!');
      return info;
    } catch (error) {
      throw new Error(`Erro ao obter informações do vídeo: ${error.message}`);
    }
  }

  // Método específico para obter informações de playlist
  async getPlaylistInfo(url) {
    try {
      console.log('🚀 Usando comando otimizado para playlist...');
      
      const cookieArgs = this.getCookieArgs();
      if (this.hasCookies) {
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
        const fallbackCommand = `yt-dlp ${cookieArgs} --dump-json --no-warnings --max-downloads 5 "${url}"`;
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
      title: info.title || 'Sem título',
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
    const baseCommand = `yt-dlp -f "${quality}" --no-playlist --write-info-json --write-thumbnail --merge-output-format mp4 -o "${outputPath}"`;
    const command = this.buildProtectedCommand(baseCommand, url);

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

        ytdlProcess.on('close', (code) => {
          console.log(`📋 Processo finalizado com código: ${code}`);
          
          if (code === 0) {
            resolve({
              metadata,
              filePath: outputPath,
              filename
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
      
      return {
        metadata,
        filePath: outputPath,
        filename
      };
    } catch (error) {
      console.error('❌ Erro no download:', error.message);
      throw error;
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
      
      const cookieArgs = this.getCookieArgs();
      const command = `yt-dlp ${cookieArgs} --list-formats --dump-json "${url}"`;
      
      if (this.hasCookies) {
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

  // Get channel information
  async getChannelInfo(channelUrl) {
    try {
      console.log('🔍 Obtendo informações do canal:', channelUrl);
      
      const cookieArgs = this.getCookieArgs();
      const command = `yt-dlp ${cookieArgs} --dump-json --flat-playlist --playlist-end 1 --no-warnings "${channelUrl}"`;
      
      if (this.hasCookies) {
        console.log('🍪 Usando cookies para obter informações do canal');
      }
      
      const { stdout } = await execPromise(
        command, 
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
        const fallbackCommand = `yt-dlp ${cookieArgs} --dump-json --no-warnings --playlist-end 1 "${channelUrl}"`;
        const { stdout: fallbackStdout } = await execPromise(
          fallbackCommand,
          { maxBuffer: 1024 * 1024 * 10 }
        );
        
        const fallbackLines = fallbackStdout.trim().split('\n').filter(line => line.trim());
        if (fallbackLines.length > 0) {
          channelInfo = JSON.parse(fallbackLines[0]);
        }
      }

      if (!channelInfo) {
        throw new Error('Não foi possível extrair informações do canal');
      }

      console.log('✅ Informações do canal obtidas com sucesso!');
      return channelInfo;
      
    } catch (error) {
      console.error('❌ Erro ao obter informações do canal:', error.message);
      throw new Error(`Erro ao obter informações do canal: ${error.message}`);
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

      const cookieArgs = this.getCookieArgs();
      const command = `yt-dlp ${cookieArgs} --dump-json --flat-playlist --dateafter ${fromDateFormatted} --datebefore ${toDateFormatted} --no-warnings "${channelUrl}"`;
      
      if (this.hasCookies) {
        console.log('🍪 Usando cookies para buscar vídeos do canal');
      }
      
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
              title: parsed.title || `Vídeo ${videos.length + 1}`,
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