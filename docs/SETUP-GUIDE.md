# XandTube - Guia de Configuração v2.0

## 🆕 Novas Funcionalidades

### Sistema de Autenticação
- Login e registro de usuários
- Autenticação JWT
- Proteção de rotas
- Gerenciamento de perfil

### Download de Vídeos do YouTube
- Download de vídeos individuais
- Download de playlists completas
- Seleção de qualidade
- Progresso em tempo real
- Integração com YT-DLP

### Banco de Dados
- SQLite com Sequelize ORM
- Models relacionais completos
- Migrations automáticas

## 📋 Pré-requisitos

- Node.js (v16 ou superior)
- npm ou yarn
- Python 3.x (para YT-DLP)
- FFmpeg (para processamento de vídeo)

## 🚀 Instalação

### 1. Instalar YT-DLP

**Windows:**
```bash
pip install yt-dlp
# ou
winget install yt-dlp
```

**macOS:**
```bash
brew install yt-dlp
```

**Linux:**
```bash
sudo pip install yt-dlp
# ou
sudo apt install yt-dlp
```

### 2. Instalar FFmpeg

**Windows:**
- Baixe de https://ffmpeg.org/download.html
- Adicione ao PATH do sistema

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt update
sudo apt install ffmpeg
```

### 3. Configurar o Backend

```bash
cd backend

# Copiar arquivo de exemplo
cp env.example .env

# Editar .env com suas configurações
# Importante: Defina um JWT_SECRET seguro!

# Instalar dependências
npm install
```

### 4. Configurar o Frontend

```bash
cd frontend

# Instalar dependências (incluindo CRACO)
npm install

# Criar arquivo .env (se necessário)
echo "REACT_APP_API_URL=http://localhost:3001/api" > .env
```

## 🏃‍♂️ Executando o Projeto

### Backend (Terminal 1):
```bash
cd backend
npm run dev
```

O backend iniciará em http://localhost:3001 com:
- API REST
- WebSocket para progresso de downloads
- Banco de dados SQLite

### Frontend (Terminal 2):
```bash
cd frontend
npm start
```

O frontend iniciará em http://localhost:3000

## 🔐 Primeiro Acesso

1. Acesse http://localhost:3000
2. Clique em "Cadastre-se" para criar uma conta
3. Preencha os dados:
   - Username (único)
   - Email
   - Nome completo
   - Senha (mínimo 6 caracteres)
4. Após o cadastro, você será logado automaticamente

## 🎥 Baixando Vídeos

1. No menu lateral, clique em "Baixar Vídeos"
2. Cole a URL do YouTube (vídeo ou playlist)
3. Clique em "Analisar"
4. Escolha a qualidade desejada
5. Clique em "Baixar Vídeo" ou "Baixar Playlist"
6. Acompanhe o progresso em tempo real
7. Os vídeos serão salvos em sua biblioteca

## 📦 Estrutura do Projeto

```
XandTube/
├── backend/
│   ├── config/         # Configurações do banco
│   ├── middleware/     # Middlewares (auth, etc)
│   ├── models/         # Models Sequelize
│   ├── routes/         # Rotas da API
│   ├── services/       # Serviços (YT-DLP, etc)
│   ├── database.sqlite # Banco de dados
│   └── server.js       # Servidor principal
├── frontend/
│   ├── src/
│   │   ├── components/ # Componentes React
│   │   ├── pages/      # Páginas da aplicação
│   │   └── services/   # Serviços de API
│   └── craco.config.js # Configuração do CRACO
└── videos/             # Armazenamento de vídeos
    ├── downloads/      # Vídeos baixados
    └── metadata/       # Metadados

```

## 🔧 Solução de Problemas

### Erro "allowedHosts" no frontend
O projeto já está configurado com CRACO para resolver este problema automaticamente.

### YT-DLP não encontrado
Certifique-se de que o yt-dlp está instalado e acessível no PATH:
```bash
yt-dlp --version
```

### Erro de CORS
Verifique se o backend está rodando na porta correta (3001) e se o CORS está configurado.

### Token JWT expirado
Faça logout e login novamente. Os tokens expiram após 7 dias.

## 📚 API Documentation

### Autenticação
Todas as rotas (exceto login/registro) requerem o header:
```
Authorization: Bearer <token>
```

### Coleção Postman
Importe o arquivo `docs/XandTube-API-v2.postman_collection.json` no Postman para testar todas as rotas.

## 🛠️ Desenvolvimento

### Adicionar novas rotas protegidas
```javascript
const { authenticateToken } = require('../middleware/auth');

router.get('/protected-route', authenticateToken, (req, res) => {
  // req.user contém os dados do usuário autenticado
});
```

### Criar novos models
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MyModel = sequelize.define('MyModel', {
  // definição dos campos
});
```

## 📝 Variáveis de Ambiente

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=sua_chave_secreta_super_segura
VIDEOS_PATH=../videos
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:3001/api
```

## 🚨 Segurança

1. **JWT_SECRET**: Use uma chave complexa e única
2. **Senhas**: São hasheadas com bcrypt
3. **CORS**: Configurado para aceitar apenas origens específicas
4. **Validação**: Todos os inputs são validados no backend

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do console
2. Consulte a documentação da API
3. Verifique as dependências instaladas
4. Reinicie os servidores

## 🎉 Pronto!

Agora você tem um clone completo do YouTube com:
- ✅ Sistema de autenticação
- ✅ Download de vídeos do YouTube
- ✅ Progresso em tempo real
- ✅ Banco de dados relacional
- ✅ Interface moderna e responsiva

Aproveite o XandTube! 🚀