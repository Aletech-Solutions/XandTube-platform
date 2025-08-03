# XandTube API Documentation

This documentation describes all available endpoints in the XandTube API.

## Base URL
```
http://localhost:3001/api
```

## Supported Formats
- **Request**: JSON, Form Data (for uploads)
- **Response**: JSON

---

## 🏥 Health Check

### GET /health
Checks if the API is working.

**Response:**
```json
{
  "status": "OK",
  "message": "XandTube Backend working!",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

---

## 🎥 Videos

### GET /videos
Lists all videos with pagination and filters.

**Query Parameters:**
- `limit` (number, optional): Number of videos per page (default: 20)
- `offset` (number, optional): Offset for pagination (default: 0)
- `search` (string, optional): Search term
- `channel` (string, optional): Channel ID to filter

**Success Response (200):**
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
Gets a specific video by ID.

**URL Parameters:**
- `id` (string): Video ID

**Success Response (200):**
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

**Error Response (404):**
```json
{
  "error": "Video not found",
  "message": "The requested video does not exist or was removed"
}
```

### POST /videos
Uploads a new video.

**Content-Type:** `multipart/form-data`

**Form Parameters:**
- `video` (file, required): Video file
- `title` (string, required): Video title
- `description` (string, optional): Video description
- `channelId` (string, required): Channel ID
- `channelName` (string, optional): Channel name
- `tags` (string, optional): Comma-separated tags

**Success Response (201):**
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
Adds a like to the video.

**Success Response (200):**
```json
{
  "message": "Video liked!",
  "likes": 46
}
```

### PUT /videos/:id/dislike
Adds a dislike to the video.

**Success Response (200):**
```json
{
  "message": "Video disliked!",
  "dislikes": 3
}
```

### GET /videos/:id/thumbnail
Gets the video thumbnail (redirects to placeholder).

### DELETE /videos/:id
Removes a video from the system.

**Success Response (200):**
```json
{
  "message": "Video removed successfully!"
}
```

---

## 📺 Channels

### GET /channels
Lists all channels with pagination.

**Query Parameters:**
- `limit` (number, optional): Number of channels per page (default: 20)
- `offset` (number, optional): Offset for pagination (default: 0)
- `search` (string, optional): Search term

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
Gets a specific channel by ID.

### POST /channels
Creates a new channel.

**Content-Type:** `application/json`

**Body:**
```json
{
  "name": "My New Channel",
  "description": "Channel description"
}
```

**Resposta de Sucesso (201):**
```json
{
  "message": "Channel created successfully!",
  "channel": {
    "id": "new-channel-id",
    "name": "My New Channel",
    "description": "Channel description",
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
Updates channel information.

### PUT /channels/:id/subscribe
Subscribes to a channel.

**Resposta de Sucesso (200):**
```json
{
  "message": "Subscribed to channel!",
  "subscribers": 15421
}
```

### PUT /channels/:id/unsubscribe
Unsubscribes from a channel.

### GET /channels/:id/avatar
Gets the channel avatar.

### GET /channels/:id/banner
Gets the channel banner.

### DELETE /channels/:id
Removes a channel from the system.

---

## 💬 Comments

### GET /comments/:videoId
Gets comments for a video.

**URL Parameters:**
- `videoId` (string): Video ID

**Query Parameters:**
- `limit` (number, optional): Number of comments per page (default: 20)
- `offset` (number, optional): Offset for pagination (default: 0)
- `sortBy` (string, optional): Sorting (newest, oldest, popular)

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
Adds a new comment.

**Content-Type:** `application/json`

**Body for comment:**
```json
{
  "videoId": "1",
  "authorName": "User",
  "content": "Great video!"
}
```

**Body for reply:**
```json
{
  "videoId": "1",
  "authorName": "User",
  "content": "I agree!",
  "parentId": "1"
}
```

### PUT /comments/:id/like
Adds a like to the comment.

### PUT /comments/:id/dislike
Adds a dislike to the comment.

### DELETE /comments/:id
Removes a comment.

---

## ⚠️ Error Codes

- **400**: Bad Request - Invalid or missing data
- **404**: Not Found - Resource not found
- **409**: Conflict - Conflict (e.g. channel name already exists)
- **500**: Internal Server Error - Internal server error

## 📋 Notes

1. **Video Upload**: 100MB limit per file
2. **Supported Formats**: MP4, AVI, MOV, MKV, WMV, FLV, WebM
3. **Pagination**: All listing endpoints support pagination
4. **CORS**: Enabled for development
5. **Metadata**: Automatically saved in JSON in yt-dlp format