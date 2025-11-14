const { promises: { access, unlink }, mkdirSync } = require('node:fs');
const selectFolder = require('win-select-folder');
const delay = (ms) => new Promise(res => setTimeout(res, ms));
const customFileNamechanger = (fileName) => fileName.replace(/["']/g, '').replace(/[<>:/\\|?*]/g, '');

const prettyUrl = (providedUrl) => {
    const url = new URL(providedUrl);
    const vid = url.searchParams.get("v");
    const list = url.searchParams.get("list");
    if(list) return `https://www.youtube.com/playlist?list=${list}`;
    return `https://www.youtube.com/watch?v=${vid}`;
}

const exists = async (filename) => await access(filename).then(() => true).catch(() => false);
const deleteIfExists = async (filename) => {
    if (await exists(filename)) await unlink(filename).catch(() => null);
    return;
}
const askForDownloadFolder = async () => {
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


module.exports = {
    delay,
    customFileNamechanger,
    prettyUrl,
    exists,
    deleteIfExists,
    askForDownloadFolder
}
