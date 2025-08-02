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
- ✅ **Progresso individual por vídeo** em playlists
- ✅ Seleção de qualidade (Best, 1080p, 720p, 480p)
- ✅ Progresso em tempo real (WebSocket + Polling)
- ✅ Interface visual com barras de progresso coloridas
- ✅ Estados visuais: Aguardando, Iniciando, Baixando, Concluído, Erro
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
npm start        # OU npm run dev

# Ou executar separadamente:
npm run backend     # Backend na porta 3001 (modo desenvolvimento)
npm run frontend    # Frontend na porta 3000
npm run backend:prod # Backend em modo produção
```

### ✅ Verificação da Instalação
```bash
# Testar YT-DLP
cd backend
npm run test:download

# Testar progresso de playlist (com exemplo)
npm run test:playlist

# Verificar saúde da API
curl http://localhost:3001/api/health
```

### 🎯 Funcionalidades de Download

#### Progresso Individual por Vídeo
- **Interface Visual**: Cada vídeo da playlist tem sua própria barra de progresso
- **Estados Coloridos**: 
  - 🟡 Iniciando (laranja)
  - 🔵 Baixando (azul) 
  - 🟢 Concluído (verde)
  - 🔴 Erro (vermelho)
  - ⚫ Aguardando (cinza)
- **Tempo Real**: WebSocket + polling para atualizações instantâneas
- **Informações Detalhadas**: Progresso percentual e status individual

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

## Estrutura de Pastas

```
XandTube/
├── backend/                 # API Node.js/Express
│   ├── config/             # Configurações do banco
│   ├── models/             # Models Sequelize
│   ├── routes/             # Rotas da API
│   ├── services/           # Serviços (YT-DLP, Downloads)
│   ├── middleware/         # Middlewares de autenticação
│   ├── utils/              # Utilitários
│   └── scripts/            # Scripts de teste
├── frontend/               # Interface React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── services/       # APIs e utilitários
│   │   └── utils/          # Helpers e formatadores
│   └── public/             # Arquivos estáticos
├── videos/                 # Armazenamento de vídeos
│   ├── downloads/          # Vídeos baixados (.keep incluído)
│   └── metadata/           # Metadados (.keep incluído)
├── docs/                   # Documentação da API
├── .gitignore             # Ignora node_modules, vídeos, etc.
└── package.json           # Scripts raiz do projeto
```

## Tecnologias Utilizadas

### Backend
- Node.js + Express.js
- SQLite + Sequelize ORM
- WebSocket (ws) para progresso em tempo real  
- JWT para autenticação
- Multer (upload de arquivos)
- YT-DLP para downloads do YouTube
- fs-extra (manipulação de arquivos)

### Frontend
- React 18 + React Router DOM
- Styled Components + React Icons
- Axios (requisições HTTP)
- WebSocket client para progresso
- CRACO (configuração webpack)

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request