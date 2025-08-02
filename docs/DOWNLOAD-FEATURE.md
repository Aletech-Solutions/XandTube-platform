# 🎥 XandTube - Funcionalidade de Download

## 📋 Visão Geral

A funcionalidade de download permite baixar vídeos e playlists do YouTube usando o YT-DLP, uma ferramenta robusta e atualizada para extração de conteúdo.

## 🚀 Como Funciona

### 1. **Análise de URL**
- O usuário cola uma URL do YouTube
- O sistema analisa se é um vídeo ou playlist
- Extrai metadados como título, duração, thumbnail

### 2. **Seleção de Qualidade**
- Oferece opções: Best, 1080p, 720p, 480p
- Mostra informações detalhadas do conteúdo

### 3. **Download com Progresso**
- Progresso em tempo real via WebSocket
- Fallback para polling se WebSocket falhar
- Status detalhado durante o processo

### 4. **Armazenamento**
- Opção de salvar na biblioteca pessoal
- Metadados salvos no banco de dados
- Arquivos organizados por usuário

## 🔧 Configuração Técnica

### Dependências Necessárias

1. **YT-DLP**
   ```bash
   pip install yt-dlp
   ```

2. **FFmpeg** (para processamento)
   ```bash
   # Windows
   winget install ffmpeg
   
   # macOS
   brew install ffmpeg
   
   # Linux
   sudo apt install ffmpeg
   ```

### Verificação da Instalação

```bash
# Verificar YT-DLP
yt-dlp --version

# Verificar FFmpeg
ffmpeg -version

# Testar YT-DLP no projeto
cd backend
npm run test:ytdlp
```

## 📊 Endpoints da API

### 1. **Test YT-DLP**
```http
GET /api/download/test?url=VIDEO_URL
Authorization: Bearer TOKEN
```

**Uso:** Diagnóstico e verificação se YT-DLP está funcionando.

### 2. **Get Video Info**
```http
GET /api/download/info?url=VIDEO_URL
Authorization: Bearer TOKEN
```

**Resposta para vídeo:**
```json
{
  "type": "video",
  "youtubeId": "dQw4w9WgXcQ",
  "title": "Rick Astley - Never Gonna Give You Up",
  "duration": 213,
  "thumbnail": "https://...",
  "channelName": "Rick Astley"
}
```

**Resposta para playlist:**
```json
{
  "type": "playlist",
  "title": "Minha Playlist",
  "totalVideos": 25,
  "videos": [
    {
      "id": "video1",
      "title": "Vídeo 1",
      "duration": 180,
      "thumbnail": "https://..."
    }
  ]
}
```

### 3. **Download Video**
```http
POST /api/download/video
Authorization: Bearer TOKEN

{
  "url": "https://youtube.com/watch?v=...",
  "quality": "720p",
  "saveToLibrary": true
}
```

### 4. **Download Playlist**
```http
POST /api/download/playlist
Authorization: Bearer TOKEN

{
  "url": "https://youtube.com/playlist?list=...",
  "quality": "best",
  "saveToLibrary": true
}
```

### 5. **Get Progress**
```http
GET /api/download/progress/{downloadId}
Authorization: Bearer TOKEN
```

**Resposta:**
```json
{
  "progress": 75,
  "status": "downloading",
  "type": "video",
  "metadata": { ... }
}
```

## 🔄 Fluxo de Download

### Vídeo Individual
1. **Análise** → Extrai metadados
2. **Configuração** → Seleciona qualidade
3. **Download** → YT-DLP baixa o arquivo
4. **Processamento** → FFmpeg processa se necessário
5. **Armazenamento** → Salva arquivo e metadados
6. **Notificação** → Usuário é notificado da conclusão

### Playlist
1. **Análise** → Lista todos os vídeos
2. **Iteração** → Baixa cada vídeo individualmente
3. **Progresso** → Atualiza progresso geral e por vídeo
4. **Relatório** → Sumário de sucessos/falhas

## 🛠️ Estrutura de Arquivos

```
videos/
├── downloads/           # Arquivos baixados
│   ├── dQw4w9WgXcQ_1234567890.mp4
│   └── ...
└── metadata/           # Metadados JSON
    ├── dQw4w9WgXcQ.json
    └── ...
```

## 📱 Interface do Usuário

### Componentes React

1. **DownloadPage** - Página principal
2. **VideoAnalyzer** - Análise de URLs
3. **QualitySelector** - Seleção de qualidade
4. **ProgressTracker** - Acompanhamento em tempo real
5. **VideoPreview** - Preview do conteúdo

### Estados de Download

- `idle` - Aguardando ação
- `analyzing` - Analisando URL
- `ready` - Pronto para download
- `downloading` - Download em andamento
- `completed` - Concluído com sucesso
- `error` - Erro durante processo

## 🔍 Monitoramento e Logs

### Logs do Sistema

```javascript
// Início do processo
console.log('🔍 Iniciando busca de informações para:', url);

// Sucesso
console.log('✅ YT-DLP sucesso!');

// Erro
console.error('❌ Erro detalhado:', error.message);
```

### Métricas Importantes

- Taxa de sucesso de downloads
- Tempo médio de processamento
- Erros mais comuns
- URLs problemáticas

## 🚨 Problemas Comuns

### 1. **YT-DLP não encontrado**
```bash
# Solução
pip install yt-dlp
# Verificar PATH
which yt-dlp
```

### 2. **Playlist vazia**
- Verificar se playlist é pública
- Testar com URL de vídeo individual
- Atualizar YT-DLP

### 3. **Progresso não atualiza**
- Verificar WebSocket
- Fallback para polling ativado automaticamente

### 4. **Downloads lentos**
- Verificar conexão de internet
- Qualidade selecionada (lower = faster)
- Limitações do YouTube

## 🔧 Customizações

### Adicionar Novos Formatos

```javascript
// Em ytdlpService.js
const ytdlOptions = {
  format: 'bestaudio[ext=m4a]', // Só áudio
  // ou
  format: 'best[height<=480]',   // Máximo 480p
};
```

### Modificar Diretório de Download

```javascript
// Em ytdlpService.js
this.downloadsPath = path.join(__dirname, '..', 'custom-downloads');
```

### Adicionar Filtros

```javascript
// Filtrar por duração
if (info.duration > 3600) { // > 1 hora
  throw new Error('Vídeo muito longo');
}
```

## 📊 Performance

### Otimizações Implementadas

1. **Lazy Loading** - Componentes carregados sob demanda
2. **Chunked Downloads** - Para playlists grandes
3. **Progress Batching** - Atualizações eficientes
4. **Error Recovery** - Retry automático
5. **Resource Cleanup** - Limpeza de arquivos temporários

### Limites Recomendados

- **Vídeo individual:** Até 4GB
- **Playlist:** Até 100 vídeos
- **Concurrent downloads:** 3 simultâneos
- **Timeout:** 30 minutos por vídeo

## 🔐 Segurança

### Validações

1. **URL Sanitization** - Remove caracteres perigosos
2. **File Path Validation** - Previne directory traversal
3. **User Authorization** - Apenas usuários autenticados
4. **Rate Limiting** - Previne abuso

### Restrições

- Apenas URLs do YouTube
- Conteúdo público apenas
- Respeitamos direitos autorais
- Logs de auditoria mantidos

## 🎯 Roadmap

### Funcionalidades Futuras

- [ ] Download de áudio apenas
- [ ] Seleção de legendas
- [ ] Agendamento de downloads
- [ ] Compressão automática
- [ ] Sincronização na nuvem
- [ ] Download de canais completos
- [ ] Conversão de formatos

### Melhorias Técnicas

- [ ] Workers para downloads
- [ ] Cache de metadados
- [ ] Resumable downloads
- [ ] Bandwidth limiting
- [ ] Statistics dashboard