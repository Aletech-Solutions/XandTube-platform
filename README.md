# XandTube - Clone do YouTube

Um clone completo do YouTube com funcionalidades de upload, visualização e comentários de vídeos.

## Estrutura do Projeto

```
XandTube/
├── backend/          # API Node.js/Express
├── frontend/         # Interface React
├── videos/           # Armazenamento de vídeos
└── docs/            # Documentação da API
```

## Funcionalidades

### 🔐 Sistema de Autenticação (NOVO!)
- ✅ Registro e login de usuários
- ✅ Autenticação JWT
- ✅ Proteção de rotas
- ✅ Gerenciamento de perfil

### 📥 Download de Vídeos do YouTube (NOVO!)
- ✅ Download de vídeos individuais
- ✅ Download de playlists completas
- ✅ Seleção de qualidade (Best, 1080p, 720p, 480p)
- ✅ Progresso em tempo real (WebSocket)
- ✅ Integração robusta com YT-DLP

### Backend
- ✅ API REST para vídeos, canais e comentários
- ✅ Sistema de upload de vídeos
- ✅ Banco de dados SQLite com Sequelize
- ✅ Models relacionais completos
- ✅ WebSocket para progresso de downloads
- ✅ CORS habilitado para frontend

### Frontend
- ✅ Interface similar ao YouTube
- ✅ Telas de login e registro modernas
- ✅ Página de download de vídeos
- ✅ Player de vídeo integrado
- ✅ Sistema de canais
- ✅ Sistema de comentários
- ✅ CRACO configurado (resolve erros webpack)

## Como Executar

### Pré-requisitos
- Node.js 16+
- npm ou yarn
- **YT-DLP** (para download de vídeos):
  ```bash
  pip install yt-dlp
  ```
- **FFmpeg** (para processamento de vídeo):
  ```bash
  # Windows: winget install ffmpeg
  # macOS: brew install ffmpeg  
  # Linux: sudo apt install ffmpeg
  ```

### Instalação
```bash
npm run install-all
```

### Execução
```bash
# Executar backend e frontend simultaneamente
npm run dev

# Ou executar separadamente:
npm run backend  # Backend na porta 3001
npm run frontend # Frontend na porta 3000
```

### ✅ Verificação da Instalação
```bash
# Testar YT-DLP
cd backend
npm run test:download

# Verificar saúde da API
curl http://localhost:3001/api/health
```

## APIs Disponíveis

Consulte a documentação completa no Postman (link na seção de documentação).

### Principais Endpoints
- `GET /api/videos` - Listar vídeos
- `POST /api/videos` - Upload de vídeo
- `GET /api/videos/:id` - Obter vídeo específico
- `GET /api/channels` - Listar canais
- `POST /api/channels` - Criar canal
- `GET /api/comments/:videoId` - Comentários do vídeo
- `POST /api/comments` - Adicionar comentário

## Tecnologias Utilizadas

### Backend
- Node.js
- Express.js
- Multer (upload de arquivos)
- fs-extra (manipulação de arquivos)
- UUID (geração de IDs únicos)

### Frontend
- React 18
- React Router DOM
- Styled Components
- Axios (requisições HTTP)
- React Icons

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request