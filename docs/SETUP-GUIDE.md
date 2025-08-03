# XandTube - Setup Guide v2.0

## 🆕 New Features

### Authentication System
- User login and registration
- JWT authentication
- Route protection
- Profile management

### YouTube Video Download
- Individual video downloads
- Complete playlist downloads
- Quality selection
- Real-time progress
- YT-DLP integration

### Database
- SQLite with Sequelize ORM
- Complete relational models
- Automatic migrations

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Python 3.x (for YT-DLP)
- FFmpeg (for video processing)

## 🚀 Installation

### 1. Install YT-DLP

**Windows:**
```bash
pip install yt-dlp
# or
winget install yt-dlp
```

**macOS:**
```bash
brew install yt-dlp
```

**Linux:**
```bash
sudo pip install yt-dlp
# or
sudo apt install yt-dlp
```

### 2. Install FFmpeg

**Windows:**
- Download from https://ffmpeg.org/download.html
- Add to system PATH

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt update
sudo apt install ffmpeg
```

### 3. Configure Backend

```bash
cd backend

# Copy example file
cp env.example .env

# Edit .env with your configurations
# Important: Set a secure JWT_SECRET!

# Install dependencies
npm install
```

### 4. Configure Frontend

```bash
cd frontend

# Install dependencies (including CRACO)
npm install

# Create .env file (if needed)
echo "REACT_APP_API_URL=http://localhost:3001/api" > .env
```

## 🏃‍♂️ Running the Project

### Backend (Terminal 1):
```bash
cd backend
npm run dev
```

The backend will start at http://localhost:3001 with:
- REST API
- WebSocket for download progress
- SQLite database

### Frontend (Terminal 2):
```bash
cd frontend
npm start
```

The frontend will start at http://localhost:3000

## 🔐 First Access

1. Access http://localhost:3000
2. Click "Sign Up" to create an account
3. Fill in the data:
   - Username (unique)
   - Email
   - Full name
   - Password (minimum 6 characters)
4. After registration, you will be logged in automatically

## 🎥 Downloading Videos

1. In the side menu, click "Download Videos"
2. Paste the YouTube URL (video or playlist)
3. Click "Analyze"
4. Choose the desired quality
5. Click "Download Video" or "Download Playlist"
6. Follow the progress in real time
7. Videos will be saved to your library

## 📦 Project Structure

```
XandTube/
├── backend/
│   ├── config/         # Database configurations
│   ├── middleware/     # Middlewares (auth, etc)
│   ├── models/         # Sequelize models
│   ├── routes/         # API routes
│   ├── services/       # Services (YT-DLP, etc)
│   ├── database.sqlite # Database
│   └── server.js       # Main server
├── frontend/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Application pages
│   │   └── services/   # API services
│   └── craco.config.js # CRACO configuration
└── videos/             # Video storage
    ├── downloads/      # Downloaded videos
    └── metadata/       # Metadata

```

## 🔧 Troubleshooting

### "allowedHosts" error in frontend
The project is already configured with CRACO to resolve this issue automatically.

### YT-DLP not found
Make sure yt-dlp is installed and accessible in PATH:
```bash
yt-dlp --version
```

### CORS error
Check if the backend is running on the correct port (3001) and if CORS is configured.

### JWT token expired
Logout and login again. Tokens expire after 7 days.

## 📚 API Documentation

### Authentication
All routes (except login/registration) require the header:
```
Authorization: Bearer <token>
```

### Postman Collection
Import the `docs/XandTube-API-v2.postman_collection.json` file in Postman to test all routes.

## 🛠️ Development

### Add new protected routes
```javascript
const { authenticateToken } = require('../middleware/auth');

router.get('/protected-route', authenticateToken, (req, res) => {
  // req.user contains authenticated user data
});
```

### Create new models
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MyModel = sequelize.define('MyModel', {
  // field definitions
});
```

## 📝 Environment Variables

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your_super_secure_secret_key
VIDEOS_PATH=../videos
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:3001/api
```

## 🚨 Security

1. **JWT_SECRET**: Use a complex and unique key
2. **Passwords**: Are hashed with bcrypt
3. **CORS**: Configured to accept only specific origins
4. **Validation**: All inputs are validated on the backend

## 📞 Support

If you encounter problems:
1. Check console logs
2. Consult the API documentation
3. Check installed dependencies
4. Restart servers

## 🎉 Ready!

Now you have a complete YouTube clone with:
- ✅ Authentication system
- ✅ YouTube video downloads
- ✅ Real-time progress
- ✅ Relational database
- ✅ Modern and responsive interface

Enjoy XandTube! 🚀