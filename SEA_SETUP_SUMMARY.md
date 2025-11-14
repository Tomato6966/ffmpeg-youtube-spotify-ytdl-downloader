# Single Executable Application (SEA) Setup Summary

## What Was Done

Your YouTube Downloader project has been successfully configured to be exportable as a Node.js Single Executable Application (SEA). This allows you to distribute a standalone `.exe` file that includes the Node.js runtime and your bundled application code.

## Files Created/Modified

### ✅ Created Files

1. **sea-config.json**
   - Configuration file for Node.js SEA
   - Specifies the bundled entry point (`out.js`)
   - Generates the preparation blob (`sea-prep.blob`)
   - Disables experimental warnings
   - No embedded assets to keep executable size manageable

2. **BUILD_SEA_README.md**
   - Comprehensive guide for building the SEA
   - Step-by-step instructions
   - Troubleshooting section
   - Known limitations documented
   - Alternative configurations explained

3. **.gitignore**
   - Ignores build artifacts (`out.js`, `sea-prep.blob`, `YoutubeDownloader.exe`)
   - Ignores sensitive files (cookies)
   - Ignores downloads and temporary files

4. **SEA_SETUP_SUMMARY.md** (this file)
   - Summary of changes and setup

### ✏️ Modified Files

1. **package.json**
   - Updated `build` script to externalize `win-select-folder` (native module)
   - Added `build-sea` script pointing to `bundle.ps1`

2. **bundle.ps1**
   - Enhanced with comprehensive error handling
   - Added progress indicators with colors
   - Automated all 6 steps of SEA creation
   - Added icon setting capability
   - Better user feedback

3. **constants.js**
   - Added SEA detection logic
   - Uses executable directory when running as SEA
   - Provides user warnings if ffmpeg.exe is missing
   - Maintains backward compatibility with normal Node.js execution

4. **README.md**
   - Added SEA build instructions
   - Enhanced feature list
   - Added usage guide
   - Improved documentation structure

## How to Build

### Quick Start
```powershell
npm run build-sea
```

### What Happens
1. **Bundling** - esbuild bundles `index.js` → `out.js` (with dependencies)
2. **Blob Generation** - Node.js creates `sea-prep.blob` from `out.js`
3. **Executable Copy** - Copies Node.js executable → `YoutubeDownloader.exe`
4. **Signature Removal** - Removes Windows signature (if signtool available)
5. **Blob Injection** - Injects blob into executable using postject
6. **Icon Setting** - Sets application icon (if icon.ico exists)

## Distribution Package

After building, distribute these files together:

```
YourDistribution/
├── YoutubeDownloader.exe   (~100MB - includes Node.js runtime + your code)
├── ffmpeg.exe               (~100MB - required for media processing)
└── _cookie.txt              (optional - for authenticated access)
```

## Key Features

### ✅ What Works
- ✅ Single executable that runs without Node.js installed
- ✅ All JavaScript dependencies bundled
- ✅ Works with YouTube and Spotify URLs
- ✅ Playlist support
- ✅ Metadata application
- ✅ Progress indicators and CLI interface
- ✅ Automatic retry on failures

### ⚠️ Important Notes
- ffmpeg.exe must be distributed separately (not embedded)
- The executable is ~100MB (Node.js runtime included)
- Cookie file is optional but recommended for authenticated access
- Some native modules may have limitations in SEA environment

## Technical Details

### SEA Detection
The application automatically detects if it's running as a SEA:
```javascript
const isSEA = require('node:sea').isSea();
```

When running as SEA:
- Base directory = executable's directory (not cwd)
- Looks for ffmpeg.exe next to the executable
- Looks for _cookie.txt next to the executable

### Bundling Strategy
- Uses esbuild for fast bundling
- Externalizes native modules (`win-select-folder`)
- Bundles all JavaScript dependencies
- Output: single `out.js` file

### Why No Embedded Assets?
We chose NOT to embed `ffmpeg.exe` as an asset because:
- ffmpeg.exe is ~100MB alone
- Would make the total executable >200MB
- Asset extraction adds complexity
- Separate distribution is simpler and more maintainable

## Testing the Build

1. **Build the executable:**
   ```powershell
   npm run build-sea
   ```

2. **Prepare distribution folder:**
   ```powershell
   mkdir TestDist
   copy YoutubeDownloader.exe TestDist\
   copy ffmpeg.exe TestDist\
   ```

3. **Run and test:**
   ```powershell
   cd TestDist
   .\YoutubeDownloader.exe
   ```

4. **Verify:**
   - Application starts without errors
   - Folder picker works
   - URL input works
   - Downloads complete successfully
   - Metadata is applied correctly

## Troubleshooting

### Build Fails
- Ensure Node.js v20.6.0 or later
- Run `npm install` to install dependencies
- Check that ffmpeg.exe exists in project directory

### Executable Won't Run
- Check if ffmpeg.exe is in the same directory
- Verify Windows didn't block the executable (right-click → Properties → Unblock)
- Run from PowerShell to see error messages

### "Cannot find module" errors
- All dependencies should be bundled
- Native modules need to be externalized
- Check esbuild output for warnings

## Next Steps

1. **Test thoroughly** - Try various URLs and scenarios
2. **Create a release package** - Zip up the distribution folder
3. **Write release notes** - Document any usage instructions
4. **Consider code signing** - For production distribution (optional)

## Resources

- [Node.js SEA Documentation](https://nodejs.org/api/single-executable-applications.html)
- [postject on npm](https://www.npmjs.com/package/postject)
- [esbuild Documentation](https://esbuild.github.io/)
- [BUILD_SEA_README.md](BUILD_SEA_README.md) - Detailed build guide

## Support

For issues or questions:
1. Check BUILD_SEA_README.md for detailed troubleshooting
2. Verify all prerequisites are met
3. Check console output for specific error messages
4. Review the Node.js SEA documentation for platform-specific issues

---

**Note:** This configuration is based on the official Node.js SEA documentation and tested on Windows. For other platforms (Linux, macOS), the build script may need adjustments.
