# XandTube - Troubleshooting

## 🚨 Common Issues

### 1. "Cannot read properties of undefined" Error ✅ FIXED

**Status:** RESOLVED in version 2.1

**Symptoms:**
- Error when trying to get video/playlist information
- Message: `Cannot read properties of undefined (reading '_type')`
- YT-DLP direct command works, but service fails
- Reference error during download: `Cannot access 'result' before initialization`

**Identified Cause:**
1. The `youtube-dl-exec` library was not working correctly on Windows
2. Scope error in progress callback trying to access `result` before initialization

**Implemented Solution:**
✅ Replaced `youtube-dl-exec` with direct `yt-dlp` commands
✅ Use of `child_process.exec` for direct execution
✅ Better error handling and JSON parsing
✅ Automatic fallback for different parameters
✅ **NEW:** Fixed reference error in progress callback
✅ **NEW:** Metadata obtained before download to avoid scope issues

**Diagnosis:**
1. Check if YT-DLP is installed:
   ```bash
   yt-dlp --version
   ```

2. Quick fix test:
   ```bash
   cd backend
   npm run test:download
   ```

3. Specific reference fix test:
   ```bash
   cd backend
   npm run test:fix
   ```

4. Test debug endpoint:
   ```bash
   curl "http://localhost:3001/api/download/test?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

**Fix Verification:**
- ✅ Logs show "🚀 Using direct yt-dlp command..."
- ✅ No more `youtube-dl-exec` dependency
- ✅ Test `npm run test:download` passes
- ✅ **NEW:** Test `npm run test:fix` passes without reference errors
- ✅ **NEW:** Download works with real-time progress

**If Issues Persist:**

#### Option 1: Reinstall YT-DLP
```bash
# Uninstall old version
pip uninstall youtube-dl yt-dlp

# Install latest version
pip install --upgrade yt-dlp
```

#### Option 2: Check PATH
```bash
# Windows
where yt-dlp

# Linux/macOS
which yt-dlp
```

### 2. Issues with Specific Playlists

**Symptoms:**
- Single videos work, but playlists fail
- Playlist returns 0 videos

**Diagnosis:**
1. Test the playlist directly:
   ```bash
   yt-dlp --dump-json "PLAYLIST_URL"
   ```

2. Check if the playlist is public:
   - Private/unlisted playlists may not work
   - Some playlists have regional restrictions

**Solutions:**
- Use public playlists for testing
- Try with `--flat-playlist` if available
- Check if the URL is correct

### 3. CORS Error in Frontend

**Symptoms:**
- CORS error in browser
- Blocked requests

**Solution:**
CRACO is already configured. If problems persist:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### 4. JWT Token Expired

**Symptoms:**
- 401 error in requests
- Automatic redirect to login

**Solution:**
- Logout and login again
- Tokens expire after 7 days

### 5. YT-DLP Incompatible Version

**Symptoms:**
- Some videos/playlists don't work
- Parsing errors

**Solution:**
```bash
# Update YT-DLP
pip install --upgrade yt-dlp

# Check version (should be >= 2023.01.06)
yt-dlp --version
```

## 🛠️ Debug Tools

### 1. Test Endpoint
```bash
GET /api/download/test?url=VIDEO_URL
```

Returns:
```json
{
  "success": true,
  "message": "YT-DLP working correctly",
  "directTest": {
    "type": "video",
    "title": "Video title",
    "hasEntries": false,
    "entriesCount": 0
  }
}
```

### 2. Detailed Logs

In the backend console, look for:
- 🔍 Processing start messages
- ✅ YT-DLP successes
- ❌ Detailed errors
- 📊 Video/playlist information

### 3. Manual YT-DLP Test

```bash
# Basic test
yt-dlp --dump-json "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Playlist test
yt-dlp --dump-json --flat-playlist "https://www.youtube.com/playlist?list=PLExamplePlaylist"
```

## 🔧 Known Test URLs

### Working Videos:
- `https://www.youtube.com/watch?v=dQw4w9WgXcQ` (Rick Roll)
- `https://www.youtube.com/watch?v=jNQXAC9IVRw` (Me at the zoo)

### Working Playlists:
- `https://www.youtube.com/playlist?list=PLrJM4_ZQmJVC7VpIpGOmQANQMeFnR2dQ8`

## 📝 Collecting Logs for Support

1. **Enable detailed logs:**
   ```bash
   cd backend
   DEBUG=* npm run dev
   ```

2. **Reproduce the error**

3. **Collect information:**
   - Node.js version: `node --version`
   - YT-DLP version: `yt-dlp --version`
   - Operating system
   - URL causing the problem
   - Complete error logs

## 🚀 Complete Reinstallation

If nothing works, reinstall completely:

```bash
# 1. Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# 2. Frontend
cd ../frontend
rm -rf node_modules package-lock.json
npm install

# 3. YT-DLP
pip uninstall yt-dlp
pip install --upgrade yt-dlp

# 4. Check installation
yt-dlp --version
```

## 📞 Still Having Problems?

1. Check console logs
2. Use the `/api/download/test` endpoint for diagnosis
3. Test YT-DLP manually
4. Check if the video/playlist URL is public
5. Consult the official YT-DLP documentation

## 🔄 Frequent Updates

YouTube frequently changes its API. To maintain compatibility:

```bash
# Update YT-DLP weekly
pip install --upgrade yt-dlp
```