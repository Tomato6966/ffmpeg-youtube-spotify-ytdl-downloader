# Youtube Downloader

You can download youtube video(s) / playlist as (mp3 / mp4) with metadata flags.

## Features
- 🎵 Download audio as **MP3** with full metadata
- 🎬 Download video as **MP4** with metadata
- 📋 Support for **playlists** and **individual videos**
- 🎧 **Spotify URL support** - automatically finds songs on YouTube
- 🔄 **Automatic retry** - up to 3 times on errors
- 📊 **Rich metadata** - artist, album, thumbnail, and more
- 🎨 **Beautiful CLI** - with progress indicators and colors

## Quick Start

### For End Users (Download & Run)

1. Download the latest release
2. Ensure `ffmpeg.exe` is in the same folder as `YoutubeDownloader.exe`
3. (Optional) Add your YouTube cookie to `_cookie.txt` for authenticated access
4. Run `YoutubeDownloader.exe`

### For Developers (Running from Source)

```bash
# Install dependencies
npm install

# IMPORTANT: Download ffmpeg.exe and place it in the same directory as index.js
# You can download it from: https://ffmpeg.org/download.html

# Run the application
npm start
```

**Note:** `ffmpeg.exe` is required for media processing. Place it in the root directory alongside `index.js` before running.

## Building as Single Executable Application (SEA)

This project supports being built as a single standalone executable using Node.js's SEA feature.

### Prerequisites
- Node.js v20.6.0 or later
- npm dependencies installed (`npm install`)
- `ffmpeg.exe` in the project directory

### Build Instructions

**Quick Build:**
```powershell
npm run build-sea
```

**Or use the PowerShell script directly:**
```powershell
.\bundle.ps1
```

This will create `YoutubeDownloader.exe` - a single executable file that includes:
- Your bundled application code
- The Node.js runtime
- All JavaScript dependencies

**Setting Custom Icon (Optional):**

After building, you can set a custom icon using ResourceHacker:

1. Download [ResourceHacker](http://www.angusj.com/resourcehacker/)
2. Open `YoutubeDownloader.exe` in ResourceHacker
3. Go to `Action` → `Replace Icon...`
4. Select your `icon.ico` file
5. Click `Replace` and save the file

Alternatively, the build script will automatically set the icon if `rcedit` is working properly.

**Distribution:**
After building, distribute these files together:
- `YoutubeDownloader.exe` - The main executable
- `ffmpeg.exe` - Required for media processing
- `_cookie.txt` - (Optional) For authenticated YouTube access

For detailed build instructions, troubleshooting, and advanced options, see [BUILD_SEA_README.md](BUILD_SEA_README.md).

## Usage

1. **Start the application**
   ```powershell
   .\YoutubeDownloader.exe
   ```

2. **Select download folder**
   - A folder picker dialog will appear
   - Choose where you want to save your downloads

3. **Enter YouTube or Spotify URL(s)**
   - Single video: `https://www.youtube.com/watch?v=...`
   - Playlist: `https://www.youtube.com/playlist?list=...`
   - Spotify track/album: `https://open.spotify.com/track/...`
   - Multiple URLs: Separate with commas or spaces

4. **Choose format**
   - `mp3` - Audio only with metadata
   - `mp4` - Video with audio and metadata

5. **Wait for download**
   - Progress will be shown in the console
   - Files are saved with proper metadata

## Cookie Setup (Optional)

For age-restricted or members-only videos, you need to provide authentication:

1. Log in to YouTube in your browser
2. Get your session cookie (use a browser extension like "EditThisCookie")
3. Save the cookie to `_cookie.txt` in the same directory as the executable
4. The format should be the full cookie string

## Dependencies

- `ytdlp-nodejs` - YouTube downloading
- `youtube-sr` - YouTube search and metadata
- `spotify-url-info` - Spotify URL parsing
- `ffmetadata` - Media metadata handling
- `inquirer` - Interactive CLI prompts
- `ora` - Progress spinners
- `colors` - Colorful console output

## File Structure

```
YoutubeDownloader/
├── index.js              # Main application entry point
├── utils.js              # Utility functions
├── constants.js          # Configuration and constants
├── ffmpegmetadata.js     # FFmpeg metadata handling
├── sea-config.json       # SEA build configuration
├── bundle.ps1            # Build script for SEA
├── ffmpeg.exe            # FFmpeg binary (required)
├── _cookie.txt           # Optional cookie file
└── package.json          # Dependencies and scripts
```

## Troubleshooting

**"Need to be logged in" error:**
- Add your YouTube session cookie to `_cookie.txt`

**"ffmpeg not found" error:**
- Ensure `ffmpeg.exe` is in the same directory as the executable
- Check that the file has execution permissions

**Downloads fail:**
- Check your internet connection
- Verify the URL is valid
- Try with a cookie for authenticated access
- The application will retry up to 3 times automatically

**Build errors:**
- Ensure Node.js v20.6.0 or later is installed
- Run `npm install` to install all dependencies
- Check that `ffmpeg.exe` exists in the project directory

## License

ISC

## Author

Tomato#6966
