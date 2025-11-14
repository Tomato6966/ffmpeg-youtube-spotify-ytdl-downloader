const process = require('process');
process.removeAllListeners('warning');
const { mkdirSync } = require('node:fs');
const { writeFile, access, unlink } = require('node:fs/promises');
const selectFolder = require('win-select-folder');
const inquirer = require('inquirer');
const YouTube = require("youtube-sr").default;
const colors = require("colors");
const ora = require("ora");
const { resolve, extname } = require('node:path');
const { platform } = require('node:os');
const { spawn } = require('node:child_process');
const { fetch } = require("undici");
const Spotify = require("spotify-url-info")(fetch);
const { YtDlp } = require('ytdlp-nodejs');
const {
    MAX_RETRIES,
    ffmetadata,
    COOKIE,
} = require('./constants.js');

globalThis.fetch = fetch;
global.fetch = fetch;

// https://www.youtube.com/watch?v=DM8FPq7gs6U

let destinationFolderPath;

async function downloadLinks(urls, mp3) {
    // const downloadQueue = [];
    // let activeDownloads = 0;
    // const downloadPromises = [];

    // for (const url of urls) {
    //     downloadQueue.push(() => processUrl(prettyUrl(url), mp3, 1));
    // }

    // const allDownloadsCompleted = new Promise(async (resolve) => {
    //     const checkCompletion = () => {
    //         if (!downloadQueue.length && activeDownloads === 0) {
    //             resolve();
    //         }
    //     };

    //     while (downloadQueue.length || activeDownloads > 0) {
    //         if (activeDownloads < CONCURRENT_DOWNLOADS && downloadQueue.length) {
    //             const nextDownload = downloadQueue.shift();
    //             activeDownloads++;
    //             downloadPromises.push(
    //                 nextDownload().finally(() => {
    //                     activeDownloads--;
    //                     checkCompletion();
    //                     if (downloadQueue.length) {
    //                         process.nextTick(() => {
    //                             downloadQueue[0]();
    //                         });
    //                     }
    //                 })
    //             );
    //         } else {
    //             if(downloadQueue.length) console.log(`Waiting ${WAIT_DELAY / 1000}s before next queue...`.dim.italic);
    //             await delay(WAIT_DELAY);
    //         }
    //     }
    // });

    // await allDownloadsCompleted;
    for(const url of urls) {
        await processUrl(url, mp3, 1);
    }
    console.log(`[INFO] All downloads attempted!`.cyan.bold);
    cliApp();
}


async function processUrl(url, mp3, attempt) {
    if(url.includes("spotify.com")) {
        const spotifySpinner = ora.default(`${url} | Fetching Spotify info on youtube...`).start();
        try {
            const res = await Spotify.getData(url);
            if(res.type === "track") {
                spotifySpinner.succeed(`${url} | Spotify info fetched | single Track data received`);
                const title = res.title || res.name;
                const artist = res.artists?.[0]?.name;
                const onYoutube = await YouTube.search(`${title}${artist ? ` by ${artist}` : ""}`, { type: "video" }).catch(() => {
                    spotifySpinner.fail(`${url} | Spotify succeed, but couldn't find on youtube`);
                    return null;
                });
                if(!onYoutube?.length) {
                    spotifySpinner.fail(`${url} | Spotify succeed, but couldn't find on youtube`);
                } else {
                    spotifySpinner.succeed(`${url} | Spotify succeded, found reference on youtube`);
                    url = onYoutube[0].url;
                }
            } else if(res.trackList?.length) {
                spotifySpinner.succeed(`${url} | Spotify info fetched | single Tracklist data received, now trying each track on youtube`);
                for(const track of res.trackList) {
                    const title = track.title || track.name;
                    const artist = track.subtitle;
                    try {
                        const onYoutube = await YouTube.search(`${title}${artist ? ` by ${artist}` : ""}`, { type: "video" }).catch(() => {
                            return null;
                        });
                        if(onYoutube?.length > 0) {
                            await processUrl(onYoutube[0].url, mp3, attempt);
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
            console.log("Finished processing all spotify tracks...".green.italic.bold);
            return cliApp();
        } catch (err) {
            spotifySpinner.fail(`${url} | Spotify info failed`);
            console.error(err);
            return cliApp();
        }
        return console.log("Received spotify url but couldn'T properly process it".red.italic.bold);
    }
    const ytUrl = prettyUrl(url);
    try {
        if (await YouTube.isPlaylist(ytUrl)) {
            const videos = await YouTube.getPlaylist(ytUrl, { fetchAll: true });
            for(const video of videos.videos) {
                await processVideo(video.id, video.title, mp3, video, attempt);
            }
        } else {
            const video = await YouTube.getVideo(ytUrl);
            await processVideo(video.id, video.title, mp3, video, attempt);
        }
    } catch (error) {
        console.error(`[ERROR] Failed to process ${ytUrl}: ${error.message}`.red);
    }
}

// Process a single video download
async function processVideo(id, title, mp3, videoData, attempt) {
    const outputPath = resolve(destinationFolderPath);
    const filename = resolve(`${outputPath}/${customFileNamechanger(title)}.${mp3 ? "mp3" : "mp4"}`);
    const videoFilename = `${filename.replace(extname(filename), "")}-video.mp4`;
    const audioFilename = `${filename.replace(extname(filename), "")}-audio.mp3`;
    if (await exists(filename)) return console.log(`[INFO] File already exists: ${title}`.cyan);

    console.log(`[INFO] Starting download for: ${title}`.yellow);

    try {
        // Apply metadata if mp3
        const durationInSeconds = Math.floor(videoData.duration / 1000); // Duration in seconds
        const metadata = {
            title: videoData.title,
            artist: String(videoData.channel?.name || videoData.artist?.name || videoData.author?.name || videoData.author || videoData.artist || ""),
            author: String(videoData.channel?.name || videoData.artist?.name || videoData.author?.name || videoData.author || videoData.artist || ""),
            length: String(durationInSeconds),
            duration: String(durationInSeconds),
            comments: typeof videoData.comments === "string" ? videoData.comments : Array.isArray(videoData.comments) ? String(videoData.comments.map(comment => comment?.content || comment).join(", ")) : "No comments",
            creationDate: videoData.uploadedAt ? typeof videoData.uploadedAt === "string" ? videoData.uploadedAt : videoData.uploadedAt?.toISOString?.() || "" : "",
            album: videoData.album || "Unknown Album",
            genre: videoData.genre || "Unknown Genre",
            trackNumber: videoData.trackNumber || "0",
            year: videoData.year || "Unknown Year",
            description: videoData.description || "No description available",
            copyright: videoData.copyright || "Unknown Copyright",
            publisher: videoData.publisher || "Unknown Publisher",
            isrc: videoData.isrc || "Unknown ISRC",
            language: videoData.language || "Unknown Language",
        };
        const audioDownloadSpinner = ora.default(`${title} | Downloading Audio...`).start();
        const metaFileNames = mp3 ? filename : [videoFilename, audioFilename];
        const url = `https://youtube.com/watch?v=${id}`;
        const ytdlp = new YtDlp();
        // download audio
        try {
            await new Promise(async (resolve, reject) => {
                const audioStream = ytdlp.download(url, {
                    format: {
                        filter: "audioonly",
                        quality: "highest",
                        type: "mp3",
                    },
                    headers: {
                        "Cookie": COOKIE,
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    },
                    output: filename,
                });
                audioStream.on('exit', () => {
                    audioDownloadSpinner.succeed(`${title} | Audio Downloaded`);
                    resolve();
                });
                audioStream.on("error", (err) => {
                    console.error(err);
                    audioDownloadSpinner.fail(`${title} | Audio Download failed`);
                    reject(err);
                });
            });
        } catch (err) {
            console.error(err);
            await deleteIfExists(filename);
            await deleteIfExists(videoFilename);
            await deleteIfExists(audioFilename);
            if (attempt < MAX_RETRIES) {
                return await processVideo(id, title, mp3, videoData, attempt + 1); // Retry download
            }
        }

        // additionally download video
        if(!mp3) {
            try {
                const videoDownloadSpinner = ora.default(`${title} | Downloading Video...`).start();
                await new Promise(async (resolve, reject) => {
                    const videoStream = ytdlp.download(url, {
                        format: {
                            filter: "videoonly",
                            quality: "highest",
                            type: "mp4",
                        },
                        headers: {
                            "Cookie": COOKIE,
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                        },
                        output: filename,
                    });
                    videoStream.on('exit', () => {
                        videoDownloadSpinner.succeed(`${title} | Video Downloaded`);
                        resolve();
                    });
                    videoStream.on("error", (err) => {
                        console.error(err);
                        videoDownloadSpinner.fail(`${title} | Video Download failed`);
                        reject(err);
                    });
                });
            } catch (err) {
                console.error(err);
                await deleteIfExists(filename);
                await deleteIfExists(videoFilename);
                await deleteIfExists(audioFilename);
                if (attempt < MAX_RETRIES) {
                    return await processVideo(id, title, mp3, videoData, attempt + 1); // Retry download
                }
            }
        }

        // FFMPEG MetaData
        const thumb = videoData.music?.[0]?.cover || videoData?.thumbnail?.url || videoData?.channel?.icon?.url;

        let picture = null;

        if(thumb) {
            await fetch(thumb).then(res => res.arrayBuffer()).then(async (buffer) => {
                const imgpath = resolve(`${outputPath}/temp-thumb.png`);
                await writeFile(imgpath, Buffer.from(buffer)).then(() => {
                    picture = imgpath;
                }).catch((e) => {
                    console.error(e);
                    picture = null;
                });
                await delay(2500);
                return;
            })
        }

        const processStr = metaFileNames.length > 1 ? "& Merging [Video + Audio]" : "Audio";
        const mergingSpinner = ora.default(`${title} | Processing ${processStr} (Meta-Data)...`).start();
        try {
            await applyMetadata(metaFileNames, metadata, picture);
            mergingSpinner.succeed(`${title} | Processing ${processStr} (Meta-Data) successful`);
        } catch (ferr) {
            console.error(ferr);
            mergingSpinner.fail(`${title} | Processing ${processStr} (Meta-Data) failed`);
        }
    } catch (error) {
        console.error(`[ERROR] Download failed for ${title}: ${error.message}`.red, error.stack);
    }
}

// Function to set metadata with ffmetadata
async function applyMetadata(filenames, metadata, picture) {
    return new Promise((resolve, reject) => {
        ffmetadata.writeFfmpeg(filenames, metadata, picture, (err) => {
            if (err) return reject(err);
            return resolve();
        });
    });
}


// CLI Application for input and options
async function cliApp(firstEnter = false) {
    destinationFolderPath = destinationFolderPath || await askForDownloadFolder();

    if(firstEnter) {
        const { openstate } = await inquirer.default.prompt([{
            type: 'list',
            name: 'openstate',
            message: "Should I open the destination folder?",
            choices: ['No', 'Yes']
        }]);

        if(openstate === "Yes") {
            let explorer;
            switch (platform()) {
                case "win32": explorer = "explorer"; break;
                case "linux": explorer = "xdg-open"; break;
                case "darwin": explorer = "open"; break;
            }
            spawn(explorer, [destinationFolderPath], { detached: true }).unref();
        }
    }

    const { input } = await inquirer.default.prompt([{
        type: 'input',
        name: 'input',
        message: "Enter YouTube/Spotify link(s) (comma-separated for multiple) or type 'cancel' to exit:"
    }]);

    if (input.trim().toLowerCase() === 'cancel') {
        console.log("[INFO] Exiting application (in 10s)...".cyan);
        return setTimeout(() => process.exit(), 10000);;
    }

    const urls = input.split(/[\s,]+/).filter(url => url?.startsWith("https://") || url?.startsWith("http://"));
    if (!urls.length) {
        console.log("No valid Url(s) entered, please try again".red.italic);
        return cliApp();
    }

    const { format } = await inquirer.default.prompt([{
        type: 'list',
        name: 'format',
        message: "Choose format:",
        choices: ['mp3', 'mp4']
    }]);

    downloadLinks(urls, format.toLowerCase() === 'mp3');

}

// Start the CLI application
cliApp(true);


process.on("uncaughtException", (error) => {
    console.log("UNKNOWN ERROR-Exception, exiting in 10s", error);
    setTimeout(() => process.exit(), 10000);
})
process.on("unhandledRejection", (error) => {
    console.log("UNKNOWN ERROR-Rejection, exiting in 10s", error);
    setTimeout(() => process.exit(), 10000);
})



function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
}
function customFileNamechanger(fileName) {
    return fileName.replace(/["']/g, '').replace(/[<>:/\\|?*]/g, '');
}

function prettyUrl(providedUrl) {
    const url = new URL(providedUrl);
    const vid = url.searchParams.get("v");
    const list = url.searchParams.get("list");
    if(list) return `https://www.youtube.com/playlist?list=${list}`;
    return `https://www.youtube.com/watch?v=${vid}`;
}

function exists(filename) {
    return access(filename).then(() => true).catch(() => false);
}
async function deleteIfExists(filename) {
    if (await exists(filename)) await unlink(filename).catch(() => null);
    return;
}
async function askForDownloadFolder() {
    const dest = await selectFolder({ description: "Where to save the downloads?" })
        .then((selectedPath) => {
            if (selectedPath === "cancelled") {
                console.log("cancelled by the user".italic);
                return null;
            }
            if (selectedPath) {
                console.log(`Destination folder is set to: ${selectedPath}`.italic);
                return selectedPath;
            } else {
                console.log('No folder was selected.'.italic);
                return undefined;
            }
        })
        .catch((error) => {
            console.error('An error occurred:', error);
            return null;
        });
    if (dest === undefined) return askForDownloadFolder();
    if (dest === null) {
        console.log("exiting in 10s".red.italic)
        return await new Promise(r => setTimeout(() => r(process.exit()), 10000));
    }

    if (!await exists(dest)) mkdirSync(dest);
    return dest;
}
