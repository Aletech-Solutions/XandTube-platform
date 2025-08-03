# XandTube - YouTube Clone

A complete YouTube clone with video upload, viewing, and commenting features.

## Project Structure

```
XandTube/
├── backend/          # Node.js/Express API
├── frontend/         # React interface
├── videos/           # Video storage
└── docs/            # API documentation
```

## Features

### 🔐 Authentication System (NEW!)
- ✅ User registration and login
- ✅ JWT authentication
- ✅ Route protection
- ✅ Profile management

### 📥 YouTube Video Download (NEW!)
- ✅ Individual video downloads
- ✅ Complete playlist downloads
- ✅ **Individual video progress** in playlists
- ✅ Quality selection (Best, 1080p, 720p, 480p)
- ✅ Real-time progress (WebSocket + Polling)
- ✅ Visual interface with colored progress bars
- ✅ Visual states: Waiting, Starting, Downloading, Completed, Error
- ✅ Robust YT-DLP integration

### Backend
- ✅ REST API for videos, channels and comments
- ✅ Video upload system
- ✅ SQLite database with Sequelize
- ✅ Complete relational models
- ✅ WebSocket for download progress
- ✅ CORS enabled for frontend

### Frontend
- ✅ YouTube-like interface
- ✅ Modern login and registration screens
- ✅ Video download page
- ✅ Integrated video player
- ✅ Channel system
- ✅ Comment system
- ✅ CRACO configured (resolves webpack errors)

## How to Run

### Prerequisites
- Node.js 16+
- npm or yarn
- **YT-DLP** (for video downloads):
  ```bash
  pip install yt-dlp
  ```
- **FFmpeg** (for video processing):
  ```bash
  # Windows: winget install ffmpeg
  # macOS: brew install ffmpeg  
  # Linux: sudo apt install ffmpeg
  ```

### Installation
```bash
npm run install-all
```

### Execution
```bash
# Run backend and frontend simultaneously
npm start        # OR npm run dev

# Or run separately:
npm run backend     # Backend on port 3001 (development mode)
npm run frontend    # Frontend on port 3000
npm run backend:prod # Backend in production mode
```

### ✅ Installation Verification
```bash
# Test YT-DLP
cd backend
npm run test:download

# Test playlist progress (with example)
npm run test:playlist

# Check API health
curl http://localhost:3001/api/health
```

### 🎯 Download Features

#### Individual Video Progress
- **Visual Interface**: Each playlist video has its own progress bar
- **Colored States**: 
  - 🟡 Starting (orange)
  - 🔵 Downloading (blue) 
  - 🟢 Completed (green)
  - 🔴 Error (red)
  - ⚫ Waiting (gray)
- **Real Time**: WebSocket + polling for instant updates
- **Detailed Information**: Percentage progress and individual status

## Available APIs

Check the complete documentation in Postman (link in documentation section).

### Main Endpoints
- `GET /api/videos` - List videos
- `POST /api/videos` - Video upload
- `GET /api/videos/:id` - Get specific video
- `GET /api/channels` - List channels
- `POST /api/channels` - Create channel
- `GET /api/comments/:videoId` - Video comments
- `POST /api/comments` - Add comment

## Folder Structure

```
XandTube/
├── backend/                 # Node.js/Express API
│   ├── config/             # Database configurations
│   ├── models/             # Sequelize models
│   ├── routes/             # API routes
│   ├── services/           # Services (YT-DLP, Downloads)
│   ├── middleware/         # Authentication middlewares
│   ├── utils/              # Utilities
│   └── scripts/            # Test scripts
├── frontend/               # React interface
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Application pages
│   │   ├── services/       # APIs and utilities
│   │   └── utils/          # Helpers and formatters
│   └── public/             # Static files
├── videos/                 # Video storage
│   ├── downloads/          # Downloaded videos (.keep included)
│   └── metadata/           # Metadata (.keep included)
├── docs/                   # API documentation
├── .gitignore             # Ignores node_modules, videos, etc.
└── package.json           # Root project scripts
```

## Technologies Used

### Backend
- Node.js + Express.js
- SQLite + Sequelize ORM
- WebSocket (ws) for real-time progress  
- JWT for authentication
- Multer (file upload)
- YT-DLP for YouTube downloads
- fs-extra (file manipulation)

### Frontend
- React 18 + React Router DOM
- Styled Components + React Icons
- Axios (HTTP requests)
- WebSocket client for progress
- CRACO (webpack configuration)

## Contributing

1. Fork the project
2. Create a branch for your feature
3. Commit your changes
4. Push to the branch
5. Open a Pull Request