# Building YouTube Downloader as a Single Executable Application (SEA)

This guide explains how to build the YouTube Downloader as a Windows Single Executable Application using Node.js's SEA feature.

## Prerequisites

1. **Node.js v20.6.0 or later** (required for SEA support)
   - Check your version: `node --version`
   - Download from: https://nodejs.org/

2. **Windows SDK** (optional, for signature removal)
   - Includes `signtool` for removing signatures
   - Can be skipped if not available

3. **Dependencies installed**
   ```powershell
   npm install
   ```

4. **postject** (automatically installed via npx)
   - Used to inject the blob into the executable

5. **rcedit** (for setting icon, installed as dev dependency)
   ```powershell
   npm install --save-dev rcedit
   ```

## Build Process

### Quick Build

Run the build script:

```powershell
npm run build-sea
```

This script will:
1. Bundle your JavaScript files using esbuild
2. Generate the SEA preparation blob
3. Copy the Node.js executable
4. Remove the signature (if signtool is available)
5. Inject the blob into the executable
6. Set the application icon (if icon.ico exists)

### Manual Build (Step by Step)

If you prefer to build manually or need to troubleshoot:

#### Step 1: Bundle the Application
```powershell
npm run build
```
This creates `out.js` with all bundled code.

#### Step 2: Generate the SEA Blob
```powershell
node --experimental-sea-config sea-config.json
```
This creates `sea-prep.blob` from your bundled code.

#### Step 3: Copy Node.js Executable
```powershell
node -e "require('fs').copyFileSync(process.execPath, 'YoutubeDownloader.exe')"
```

#### Step 4: Remove Signature (Optional)
```powershell
signtool remove /s YoutubeDownloader.exe
```
Skip this if you don't have Windows SDK installed.

#### Step 5: Inject the Blob
```powershell
npx postject YoutubeDownloader.exe NODE_SEA_BLOB sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
```

#### Step 6: Set Icon (Optional)
```powershell
npx rcedit YoutubeDownloader.exe --set-icon icon.ico
```

## Distribution

After building, you need to distribute:

1. **YoutubeDownloader.exe** - The main executable
2. **ffmpeg.exe** - Required for media processing (must be in same directory)
3. **_cookie.txt** - Optional, for authenticated YouTube access

### Directory Structure for End Users
```
YourDistributionFolder/
├── YoutubeDownloader.exe
├── ffmpeg.exe
└── _cookie.txt (optional)
```

## Configuration Files

### sea-config.json
```json
{
  "main": "out.js",
  "output": "sea-prep.blob",
  "disableExperimentalSEAWarning": true,
  "useSnapshot": false,
  "useCodeCache": false
}
```

- **main**: The bundled JavaScript file to embed
- **output**: Where to write the preparation blob
- **disableExperimentalSEAWarning**: Suppresses SEA warnings
- **useSnapshot**: Disabled (not compatible with all dependencies)
- **useCodeCache**: Disabled (not compatible with dynamic imports)

**Note:** We don't bundle `ffmpeg.exe` as an asset because it's very large (~100MB) and would significantly bloat the executable. Instead, distribute it separately alongside the executable.

## Known Limitations

### 1. Native Modules
Some native Node.js modules may not work correctly in SEA:
- `win-select-folder` is externalized and may require additional setup
- Some binary addons might not function properly

### 2. Dynamic Require
The SEA environment has limited `require()` functionality:
- Only built-in Node.js modules work out of the box
- All application code must be bundled

### 3. File System Access
- The executable can access external files normally
- `__dirname` and `__filename` point to the executable location
- Use `process.cwd()` for working directory

### 4. External Dependencies
- `ffmpeg.exe` must be distributed separately (not embedded)
- The executable is ~100MB (Node.js runtime + bundled code)
- Distributing ffmpeg.exe separately keeps the executable manageable

## Troubleshooting

### Error: "Cannot find module"
- Ensure all dependencies are bundled with esbuild
- Check that native modules are externalized
- Verify `out.js` was created successfully

### Error: "postject failed"
- Make sure you removed the signature first (on Windows)
- Check that `sea-prep.blob` was generated
- Try running PowerShell as Administrator

### Executable is too large
- The SEA includes the entire Node.js runtime (~100MB)
- Adding ffmpeg.exe as an asset adds another ~100MB
- Consider distributing ffmpeg.exe separately

### "ffmpeg not found" error
- Ensure ffmpeg.exe is in the same directory as the executable
- Check that ffmpeg.exe has execution permissions
- Verify the path in constants.js is correct

## Embedding Assets (Optional)

If you want to embed ffmpeg.exe and cookies as assets (WARNING: this will make the executable >200MB), you can modify `sea-config.json`:

```json
{
  "main": "out.js",
  "output": "sea-prep.blob",
  "disableExperimentalSEAWarning": true,
  "useSnapshot": false,
  "useCodeCache": false,
  "assets": {
    "ffmpeg.exe": "ffmpeg.exe",
    "cookie.txt": "_cookie.txt"
  }
}
```

You'll also need to update `constants.js` to extract these assets at runtime. This is generally not recommended due to the large file size.

## Testing

Test the executable:

```powershell
.\YoutubeDownloader.exe
```

Make sure:
1. The application starts without errors
2. You can select a download folder
3. Downloads work correctly
4. Metadata is applied properly

## Resources

- [Node.js SEA Documentation](https://nodejs.org/api/single-executable-applications.html)
- [postject on npm](https://www.npmjs.com/package/postject)
- [esbuild Documentation](https://esbuild.github.io/)

## Support

If you encounter issues:
1. Check Node.js version (must be v20.6.0+)
2. Verify all dependencies are installed
3. Try the manual build process step by step
4. Check the console output for specific error messages
