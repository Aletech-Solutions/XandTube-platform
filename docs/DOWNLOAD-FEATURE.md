# 🎥 XandTube - Download Feature

## 📋 Overview

The download feature allows downloading YouTube videos and playlists using YT-DLP, a robust and updated tool for content extraction.

## 🚀 How It Works

### 1. **URL Analysis**
- User pastes a YouTube URL
- System analyzes if it's a video or playlist
- Extracts metadata like title, duration, thumbnail

### 2. **Quality Selection**
- Offers options: Best, 1080p, 720p, 480p
- Shows detailed content information

### 3. **Download with Progress**
- Real-time progress via WebSocket
- Fallback to polling if WebSocket fails
- Detailed status during the process

### 4. **Storage**
- Option to save to personal library
- Metadata saved to database
- Files organized by user

## 🔧 Technical Configuration

### Required Dependencies

1. **YT-DLP**
   ```bash
   pip install yt-dlp
   ```

2. **FFmpeg** (for processing)
   ```bash
   # Windows
   winget install ffmpeg
   
   # macOS
   brew install ffmpeg
   
   # Linux
   sudo apt install ffmpeg
   ```

### Installation Verification

```bash
# Check YT-DLP
yt-dlp --version

# Check FFmpeg
ffmpeg -version

# Test YT-DLP in project
cd backend
npm run test:ytdlp
```

## 📊 API Endpoints

### 1. **Test YT-DLP**
```http
GET /api/download/test?url=VIDEO_URL
Authorization: Bearer TOKEN
```

**Usage:** Diagnosis and verification if YT-DLP is working.

### 2. **Get Video Info**
```http
GET /api/download/info?url=VIDEO_URL
Authorization: Bearer TOKEN
```

**Response for video:**
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

**Response for playlist:**
```json
{
  "type": "playlist",
  "title": "My Playlist",
  "totalVideos": 25,
  "videos": [
    {
      "id": "video1",
      "title": "Video 1",
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

**Response:
```json
{
  "progress": 75,
  "status": "downloading",
  "type": "video",
  "metadata": { ... }
}
```

## 🔄 Download Flow

### Individual Video
1. **Analysis** → Extracts metadata
2. **Configuration** → Selects quality
3. **Download** → YT-DLP downloads the file
4. **Processing** → FFmpeg processes if necessary
5. **Storage** → Saves file and metadata
6. **Notification** → User is notified of completion

### Playlist
1. **Analysis** → Lists all videos
2. **Iteration** → Downloads each video individually
3. **Progress** → Updates general and per-video progress
4. **Report** → Summary of successes/failures

## 🛠️ File Structure

```
videos/
├── downloads/           # Downloaded files
│   ├── dQw4w9WgXcQ_1234567890.mp4
│   └── ...
└── metadata/           # JSON metadata
    ├── dQw4w9WgXcQ.json
    └── ...
```

## 📱 User Interface

### React Components

1. **DownloadPage** - Main page
2. **VideoAnalyzer** - URL analysis
3. **QualitySelector** - Quality selection
4. **ProgressTracker** - Real-time tracking
5. **VideoPreview** - Content preview

### Download States

- `idle` - Waiting for action
- `analyzing` - Analyzing URL
- `ready` - Ready for download
- `downloading` - Download in progress
- `completed` - Successfully completed
- `error` - Error during process

## 🔍 Monitoring and Logs

### System Logs

```javascript
// Process start
console.log('🔍 Starting information search for:', url);

// Success
console.log('✅ YT-DLP success!');

// Error
console.error('❌ Detailed error:', error.message);
```

### Important Metrics

- Download success rate
- Average processing time
- Most common errors
- Problematic URLs

## 🚨 Common Issues

### 1. **YT-DLP not found**
```bash
# Solution
pip install yt-dlp
# Check PATH
which yt-dlp
```

### 2. **Empty playlist**
- Check if playlist is public
- Test with individual video URL
- Update YT-DLP

### 3. **Progress not updating**
- Check WebSocket
- Fallback to polling activated automatically

### 4. **Slow downloads**
- Check internet connection
- Selected quality (lower = faster)
- YouTube limitations

## 🔧 Customizations

### Add New Formats

```javascript
// In ytdlpService.js
const ytdlOptions = {
  format: 'bestaudio[ext=m4a]', // Audio only
  // or
  format: 'best[height<=480]',   // Maximum 480p
};
```

### Modify Download Directory

```javascript
// In ytdlpService.js
this.downloadsPath = path.join(__dirname, '..', 'custom-downloads');
```

### Add Filters

```javascript
// Filter by duration
if (info.duration > 3600) { // > 1 hour
  throw new Error('Video too long');
}
```

## 📊 Performance

### Implemented Optimizations

1. **Lazy Loading** - Components loaded on demand
2. **Chunked Downloads** - For large playlists
3. **Progress Batching** - Efficient updates
4. **Error Recovery** - Automatic retry
5. **Resource Cleanup** - Temporary file cleanup

### Recommended Limits

- **Individual video:** Up to 4GB
- **Playlist:** Up to 100 videos
- **Concurrent downloads:** 3 simultaneous
- **Timeout:** 30 minutes per video

## 🔐 Security

### Validations

1. **URL Sanitization** - Removes dangerous characters
2. **File Path Validation** - Prevents directory traversal
3. **User Authorization** - Only authenticated users
4. **Rate Limiting** - Prevents abuse

### Restrictions

- YouTube URLs only
- Public content only
- We respect copyright
- Audit logs maintained

## 🎯 Roadmap

### Future Features

- [ ] Audio-only download
- [ ] Subtitle selection
- [ ] Scheduled downloads
- [ ] Automatic compression
- [ ] Cloud synchronization
- [ ] Complete channel downloads
- [ ] Format conversion

### Technical Improvements

- [ ] Download workers
- [ ] Metadata caching
- [ ] Resumable downloads
- [ ] Bandwidth limiting
- [ ] Statistics dashboard