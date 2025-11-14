const { resolve, dirname } = require('node:path');
const { existsSync, readFileSync, writeFileSync } = require('node:fs');
const { fetch } = require("undici");
const ffmetadata = require("./ffmpegmetadata.js");

globalThis.fetch = fetch;
global.fetch = fetch;

const MAX_RETRIES = 3; // Maximum number of retries for failed downloads
const CONCURRENT_DOWNLOADS = 30; // Max number of concurrent downloads
const WAIT_DELAY = 10000;

// Detect if running in a Single Executable Application
const isSEA = (() => {
    try {
        const sea = require('node:sea');
        return sea.isSea();
    } catch {
        return false;
    }
})();

// Base directory: use executable directory if SEA, otherwise current working directory
const BASE_DIR = isSEA ? dirname(process.execPath) : process.cwd();
const COOKIE_PATH = resolve(BASE_DIR, '_cookie.txt');
const FFMPEG_PATH = resolve(BASE_DIR, 'ffmpeg.exe');

// Note: ffmpeg.exe and _cookie.txt should be placed in the same directory as the executable
if (isSEA) {
    console.log('Running as Single Executable Application'.dim.italic);
    if (!existsSync(FFMPEG_PATH)) {
        console.log('Warning: ffmpeg.exe not found. Please place it in the same directory as the executable.'.yellow);
    }
}

ffmetadata.setFfmpegPath(FFMPEG_PATH)

const COOKIE = existsSync(COOKIE_PATH) ? readFileSync(COOKIE_PATH, 'utf8').trim() : "";  // INSERT cookie for logged in session
if (!COOKIE) console.log("INFO, to fix the 'need to be logged in' error, paste a session-cookie in '_cookie.txt' where the .exe is".dim.italic)

module.exports = {
    MAX_RETRIES,
    CONCURRENT_DOWNLOADS,
    WAIT_DELAY,
    BASE_DIR,
    COOKIE_PATH,
    FFMPEG_PATH,
    ffmetadata,
    COOKIE,
}
