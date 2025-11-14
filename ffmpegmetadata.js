"use strict";
const { spawn } = require("child_process");
const fs = require("fs");
const through = require("through");
const concat = require("concat-stream");
const { extname } = require("path");

let ffmpeg = spawn.bind(null, process.env.FFMPEG_PATH || "ffmpeg");

module.exports.setFfmpegPath = function(path) {
    ffmpeg = spawn.bind(null, path || "ffmpeg");
};

module.exports.writeFfmpeg = function (src, data, picture, callback) {
    const [mainSrc, audioSrc] = Array.isArray(src) ? src : [src];
    // Default encoding is MP3 or MP4 based on file type
    const dst = audioSrc ? mainSrc.replace("-video.mp4", ".mp4") : getTempPath(mainSrc);
    const args = getWriteArgs(mainSrc, dst, data, audioSrc, picture);

    const proc = ffmpeg(args),
        stream = through(),
        error = concat();

    // Proxy any child process error events
    proc.on("error", stream.emit.bind(stream, "error"));

    // Proxy child process stdout but don't end the stream until we know the process exits with a zero exit code
    proc.stdout.on("data", stream.emit.bind(stream, "data"));

    // Capture stderr (to use in case of non-zero exit code)
    proc.stderr.pipe(error);

    proc.on("close", function (code) {
        if (code === 0) {
            finish();
        } else {
            handleError(new Error(error.getBody().toString()));
        }
    });

    if (callback) {
        stream.on("end", callback);
        stream.on("error", callback);
    }

    function handleError(err) {
        if(audioSrc) fs.unlinkSync(audioSrc);
        if(picture) fs.unlinkSync(picture);
        fs.unlink(dst, function () {
            stream.emit("error", err);
        });
    }

    function finish() {
        if(picture) fs.unlinkSync(picture);
        if(audioSrc){
            fs.unlinkSync(audioSrc)
            fs.unlinkSync(mainSrc);
        } else fs.renameSync(dst, mainSrc);
        stream.emit("end");
    }

    return stream;
};

function getTempPath(src) {
    const ext = extname(src);
    return `${src.replace(ext, ".tmp")}${ext}`;
}

function isMp4(src) {
    return extname(src).toLowerCase() === '.mp4';
}

function isAudio(src) {
    const audioExtensions = ['.mp3', '.aac', '.m4a', '.flac', '.ogg', '.wav'];
    return audioExtensions.includes(extname(src).toLowerCase());
}

function getWriteArgs(src, dst, data, audioSrc, picture) {
    const extension = extname(src).toLowerCase();
    const mp4 = isMp4(src);

    let args = [
        '-i',
        src
    ];

    if (mp4 && audioSrc) {
        args.push('-i', audioSrc);
        const audioSrcMaps = [
            '-map', '0:v:0',
            '-map', '1:a:0',
        ];
        const audioSrcARgs = [
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-b:a', '192k'
        ];
        if (picture) {
            args.push('-i', picture, ...audioSrcMaps, '-map', '2', '-disposition:v:1', 'attached_pic', ...audioSrcARgs);
        } else {
            args.push(
                ...audioSrcMaps,
                ...audioSrcARgs,
            );
        }
    } else if (isAudio(src)) {
        if(picture) args.push('-i', picture);

        if (extension === '.mp3') {
            if (picture) args.push('-map', '0', '-map', '1', '-c:a', 'libmp3lame', '-q:a', '2', '-b:a', '192k', '-id3v2_version', '3', '-write_id3v1', '1');
            else args.push('-map', '0', '-c:a', 'libmp3lame', '-q:a', '2', '-b:a', '192k');
        } else if (extension === '.ogg') {
            args.push('-map', '0', '-c:a', 'libvorbis', '-q:a', '6', '-b:a', '192k');
        } else {
            args.push('-map', '0', '-c:a', 'aac', '-b:a', '192k');
        }
    }

    // Apply standard metadata fields
    Object.keys(data).forEach((name) => {
        args.push('-metadata', `${escapeMetadata(name)}=${escapeMetadata(data[name])}`);
    });

    args.push('-y', dst);
    return args;
}

function escapeMetadata(value) {
    if (typeof value !== 'string') return value;
    return value.replace(/(["\\])/g, '\\$1'); // Escapes quotes and backslashes
}
