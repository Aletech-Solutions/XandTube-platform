# XandTube API Documentation

Esta documentação descreve todos os endpoints disponíveis na API do XandTube.

## Base URL
```
http://localhost:3001/api
```

## Formatos Suportados
- **Request**: JSON, Form Data (para uploads)
- **Response**: JSON

---

## 🏥 Health Check

### GET /health
Verifica se a API está funcionando.

**Resposta:**
```json
{
  "status": "OK",
  "message": "XandTube Backend funcionando!",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

---

## 🎥 Vídeos

### GET /videos
Lista todos os vídeos com paginação e filtros.

**Parâmetros de Query:**
- `limit` (number, opcional): Número de vídeos por página (padrão: 20)
- `offset` (number, opcional): Deslocamento para paginação (padrão: 0)
- `search` (string, opcional): Termo de busca
- `channel` (string, opcional): ID do canal para filtrar

**Resposta de Sucesso (200):**
```json
{
  "videos": [
    {
      "id": "1",
      "title": "Vídeo de Demonstração",
      "description": "Descrição do vídeo",
      "filename": "demo1.mp4",
      "thumbnail": "/api/videos/1/thumbnail",
      "duration": "2:30",
      "views": 1250,
      "likes": 45,
      "dislikes": 2,
      "channelId": "channel-1",
      "channelName": "Canal Tecnologia",
      "uploadDate": "2024-01-15T10:30:00Z",
      "tags": ["tecnologia", "demo"]
    }
  ],
  "total": 2,
  "hasMore": false
}
```

### GET /videos/:id
Obtém um vídeo específico pelo ID.

**Parâmetros de URL:**
- `id` (string): ID do vídeo

**Resposta de Sucesso (200):**
```json
{
  "id": "1",
  "title": "Vídeo de Demonstração",
  "description": "Descrição do vídeo",
  "filename": "demo1.mp4",
  "thumbnail": "/api/videos/1/thumbnail",
  "duration": "2:30",
  "views": 1251,
  "likes": 45,
  "dislikes": 2,
  "channelId": "channel-1",
  "channelName": "Canal Tecnologia",
  "uploadDate": "2024-01-15T10:30:00Z",
  "tags": ["tecnologia", "demo"]
}
```

**Resposta de Erro (404):**
```json
{
  "error": "Vídeo não encontrado",
  "message": "O vídeo solicitado não existe ou foi removido"
}
```

### POST /videos
Faz upload de um novo vídeo.

**Content-Type:** `multipart/form-data`

**Parâmetros do Form:**
- `video` (file, obrigatório): Arquivo de vídeo
- `title` (string, obrigatório): Título do vídeo
- `description` (string, opcional): Descrição do vídeo
- `channelId` (string, obrigatório): ID do canal
- `channelName` (string, opcional): Nome do canal
- `tags` (string, opcional): Tags separadas por vírgula

**Resposta de Sucesso (201):**
```json
{
  "message": "Vídeo enviado com sucesso!",
  "video": {
    "id": "new-video-id",
    "title": "Meu Novo Vídeo",
    "description": "Descrição do vídeo",
    "filename": "uuid-filename.mp4",
    "thumbnail": "/api/videos/new-video-id/thumbnail",
    "duration": "0:00",
    "views": 0,
    "likes": 0,
    "dislikes": 0,
    "channelId": "channel-1",
    "channelName": "Meu Canal",
    "uploadDate": "2024-01-20T10:30:00.000Z",
    "tags": ["tutorial", "tecnologia"]
  }
}
```

### PUT /videos/:id/like
Adiciona um like ao vídeo.

**Resposta de Sucesso (200):**
```json
{
  "message": "Vídeo curtido!",
  "likes": 46
}
```

### PUT /videos/:id/dislike
Adiciona um dislike ao vídeo.

**Resposta de Sucesso (200):**
```json
{
  "message": "Vídeo descurtido!",
  "dislikes": 3
}
```

### GET /videos/:id/thumbnail
Obtém a thumbnail do vídeo (redirecionamento para placeholder).

### DELETE /videos/:id
Remove um vídeo do sistema.

**Resposta de Sucesso (200):**
```json
{
  "message": "Vídeo removido com sucesso!"
}
```

---

## 📺 Canais

### GET /channels
Lista todos os canais com paginação.

**Parâmetros de Query:**
- `limit` (number, opcional): Número de canais por página (padrão: 20)
- `offset` (number, opcional): Deslocamento para paginação (padrão: 0)
- `search` (string, opcional): Termo de busca

**Resposta de Sucesso (200):**
```json
{
  "channels": [
    {
      "id": "channel-1",
      "name": "Canal Tecnologia",
      "description": "Canal dedicado a tecnologia",
      "avatar": "/api/channels/channel-1/avatar",
      "banner": "/api/channels/channel-1/banner",
      "subscribers": 15420,
      "totalViews": 234567,
      "videoCount": 45,
      "createdAt": "2023-06-15T10:30:00Z",
      "verified": true
    }
  ],
  "total": 2,
  "hasMore": false
}
```

### GET /channels/:id
Obtém um canal específico pelo ID.

### POST /channels
Cria um novo canal.

**Content-Type:** `application/json`

**Body:**
```json
{
  "name": "Meu Novo Canal",
  "description": "Descrição do canal"
}
```

**Resposta de Sucesso (201):**
```json
{
  "message": "Canal criado com sucesso!",
  "channel": {
    "id": "new-channel-id",
    "name": "Meu Novo Canal",
    "description": "Descrição do canal",
    "avatar": "/api/channels/new-channel-id/avatar",
    "banner": "/api/channels/new-channel-id/banner",
    "subscribers": 0,
    "totalViews": 0,
    "videoCount": 0,
    "createdAt": "2024-01-20T10:30:00.000Z",
    "verified": false
  }
}
```

### PUT /channels/:id
Atualiza informações de um canal.

### PUT /channels/:id/subscribe
Inscreve-se em um canal.

**Resposta de Sucesso (200):**
```json
{
  "message": "Inscrito no canal!",
  "subscribers": 15421
}
```

### PUT /channels/:id/unsubscribe
Cancela inscrição em um canal.

### GET /channels/:id/avatar
Obtém o avatar do canal.

### GET /channels/:id/banner
Obtém o banner do canal.

### DELETE /channels/:id
Remove um canal do sistema.

---

## 💬 Comentários

### GET /comments/:videoId
Obtém comentários de um vídeo.

**Parâmetros de URL:**
- `videoId` (string): ID do vídeo

**Parâmetros de Query:**
- `limit` (number, opcional): Número de comentários por página (padrão: 20)
- `offset` (number, opcional): Deslocamento para paginação (padrão: 0)
- `sortBy` (string, opcional): Ordenação (newest, oldest, popular)

**Resposta de Sucesso (200):**
```json
{
  "comments": [
    {
      "id": "1",
      "videoId": "1",
      "authorName": "João Silva",
      "authorAvatar": "/api/comments/avatar/1",
      "content": "Excelente vídeo!",
      "timestamp": "2024-01-16T09:15:00Z",
      "likes": 12,
      "dislikes": 0,
      "replies": []
    }
  ],
  "total": 2,
  "hasMore": false
}
```

### POST /comments
Adiciona um novo comentário.

**Content-Type:** `application/json`

**Body para comentário:**
```json
{
  "videoId": "1",
  "authorName": "Usuário",
  "content": "Ótimo vídeo!"
}
```

**Body para resposta:**
```json
{
  "videoId": "1",
  "authorName": "Usuário",
  "content": "Concordo!",
  "parentId": "1"
}
```

### PUT /comments/:id/like
Adiciona um like ao comentário.

### PUT /comments/:id/dislike
Adiciona um dislike ao comentário.

### DELETE /comments/:id
Remove um comentário.

---

## ⚠️ Códigos de Erro

- **400**: Bad Request - Dados inválidos ou ausentes
- **404**: Not Found - Recurso não encontrado
- **409**: Conflict - Conflito (ex: nome de canal já existe)
- **500**: Internal Server Error - Erro interno do servidor

## 📋 Notas

1. **Upload de Vídeos**: Limite de 100MB por arquivo
2. **Formatos Suportados**: MP4, AVI, MOV, MKV, WMV, FLV, WebM
3. **Paginação**: Todos os endpoints de listagem suportam paginação
4. **CORS**: Habilitado para desenvolvimento
5. **Metadados**: Salvos automaticamente em JSON no formato yt-dlp