import {SB} from 'snackabra/dist/snackabra.js'
const SKIP_DIR = true;
export const version = "0.0.16";
const DEBUG = true;
const DEBUG2 = false;
const DEBUG3 = false;
const LOAD_SERVICE_WORKER = false;
const sbCrypto = new SB.SBCrypto();
function getProperties(obj, propertyList) {
    const properties = {};
    propertyList.forEach((property) => {
        if (obj.hasOwnProperty(property)) {
            properties[property] = obj[property];
        }
    });
    Object.getOwnPropertyNames(obj).forEach((property) => {
        if (propertyList.includes(property) && !properties.hasOwnProperty(property)) {
            properties[property] = obj[property];
        }
    });
    for (const property in obj) {
        if (propertyList.includes(property) && !properties.hasOwnProperty(property)) {
            properties[property] = obj[property];
        }
    }
    return properties;
}
const createCounter = () => {
    let counter = 0;
    const inc = async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
        counter++;
        return counter - 1;
    };
    return { inc };
};
let serviceWorkerFunctional = false;
function getMimeType(fileName) {
    const MIME_TYPES = {
        '.aac': 'audio/aac',
        '.abw': 'application/x-abiword',
        '.arc': 'application/x-freearc',
        '.avif': 'image/avif',
        '.avi': 'video/x-msvideo',
        '.azw': 'application/vnd.amazon.ebook',
        '.bin': 'application/octet-stream',
        '.bmp': 'image/bmp',
        '.bz': 'application/x-bzip',
        '.bz2': 'application/x-bzip2',
        '.cda': 'application/x-cdf',
        '.csh': 'application/x-csh',
        '.css': 'text/css',
        '.csv': 'text/csv',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.eot': 'application/vnd.ms-fontobject',
        '.epub': 'application/epub+zip',
        '.gz': 'application/gzip',
        '.gif': 'image/gif',
        '.htm': 'text/html',
        '.html': 'text/html',
        '.ico': 'image/vnd.microsoft.icon',
        '.ics': 'text/calendar',
        '.jar': 'application/java-archive',
        '.jpeg': 'image/jpeg',
        '.jpg': 'image/jpeg',
        '.js': 'text/javascript (Specifications: HTML and RFC 9239)',
        '.json': 'application/json',
        '.jsonld': 'application/ld+json',
        '.mid': 'audio/midi',
        '.midi': 'audio/midi',
        '.mjs': 'text/javascript',
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4',
        '.mpeg': 'video/mpeg',
        '.mpkg': 'application/vnd.apple.installer+xml',
        '.odp': 'application/vnd.oasis.opendocument.presentation',
        '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
        '.odt': 'application/vnd.oasis.opendocument.text',
        '.oga': 'audio/ogg',
        '.ogv': 'video/ogg',
        '.ogx': 'application/ogg',
        '.opus': 'audio/opus',
        '.otf': 'font/otf',
        '.png': 'image/png',
        '.pdf': 'application/pdf',
        '.php': 'application/x-httpd-php',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.rar': 'application/vnd.rar',
        '.rtf': 'application/rtf',
        '.sh': 'application/x-sh',
        '.svg': 'image/svg+xml',
        '.tar': 'application/x-tar',
        '.tif': 'image/tiff',
        '.tiff': 'image/tiff',
        '.ts': 'video/mp2t',
        '.ttf': 'font/ttf',
        '.txt': 'text/plain',
        '.vsd': 'application/vnd.visio',
        '.wav': 'audio/wav',
        '.weba': 'audio/webm',
        '.webm': 'video/webm',
        '.webp': 'image/webp',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.xhtml': 'application/xhtml+xml',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.xml': 'application/xml',
        '.xul': 'application/vnd.mozilla.xul+xml',
        '.zip': 'application/zip',
        '.7z': 'application/x-7z-compressed',
    };
    const fileExtension = fileName.slice(fileName.lastIndexOf('.'));
    return MIME_TYPES[fileExtension];
}
const propertyList = ['lastModified', 'name', 'type', 'size', 'webkitRelativePath', 'fullPath', 'isDirectory', 'isFile',
    'SBitemNumber', 'SBitemNumberList', 'fileContentCandidates', 'fileContents', 'uniqueShardId',
    'SBparentEntry', 'SBparentNumber', 'SBfoundMetaData', 'SBfullName'];
window.SBFileHelperReady = new Promise((resolve, reject) => {
    window.SBFileHelperReadyResolve = resolve;
    window.SBFileHelperReadyReject = reject;
});
if (LOAD_SERVICE_WORKER) {
    setupServiceWorker().then(() => {
        window.SBFileHelperReadyResolve();
    }).catch((e) => {
        window.SBFileHelperReadyReject(e);
    });
}
else {
    window.SBFileHelperReadyResolve();
}
async function setupServiceWorker() {
    try {
        if ('serviceWorker' in navigator) {
            await navigator.serviceWorker.register('service-worker.js');
            serviceWorkerFunctional = true;
            if (DEBUG)
                console.log('++++ Service Worker registered');
            navigator.serviceWorker.addEventListener('message', function (event) {
                if (DEBUG)
                    console.log("++++ Service worker event: " + event.data);
            });
        }
    }
    catch (e) {
        console.log("Error registering service worker: " + e);
    }
}
const sb384cachePromise = LOAD_SERVICE_WORKER ? caches.open('sb384cache') : Promise.resolve(null);
let serverPrefix;
if (window.location) {
    serverPrefix = window.location.protocol + "//" + window.location.host;
    if (DEBUG)
        console.log("serverPrefix: ", serverPrefix);
}
else {
    serverPrefix = undefined;
}
async function cacheResource(fileName, uniqueShardId, mimeType, bufferMap) {
    if (!LOAD_SERVICE_WORKER)
        return Promise.resolve();
    if (!serviceWorkerFunctional) {
        console.error("service worker is not operational");
        return Promise.resolve();
    }
    if (fileName === "/service-worker.js") {
        console.log("**** special override: self-virtualizing service worker (/service-worker.js)");
        return Promise.resolve();
    }
    if (fileName === "/index.html") {
        console.log("**** special override: index.html can also be accessed as '/'");
        await cacheResource("/", uniqueShardId, mimeType, bufferMap);
    }
    if (DEBUG)
        console.log(`Caching resource '${fileName}' with uniqueShardId '${uniqueShardId}' and mimeType '${mimeType}'`);
    const cache = (await sb384cachePromise);
    let arrayBuffer = bufferMap.get(uniqueShardId);
    const response = new Response(arrayBuffer, {
        status: 200,
        headers: { 'Content-Type': mimeType },
    });
    await cache.put(fileName, response);
}
function testToRead(file, location) {
    try {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = (e) => {
            if (DEBUG2) {
                console.log("========================================================");
                console.log(`[${location}] was able to readAsText():`);
                console.log(file);
            }
            if (e.target === null) {
                if (DEBUG)
                    console.log('**** e.target is null ****');
            }
            else {
                if (DEBUG2)
                    console.log(`[${location}] (direct) successfully read file ${file.name}`);
            }
        };
    }
    catch (error) {
        try {
            if (file.file) {
                let originalFile = file;
                file.file((file) => {
                    if (DEBUG2) {
                        console.log("========================================================");
                        console.log(`[${location}] was able to get a file() for object:`);
                        console.log(originalFile);
                        console.log(file);
                    }
                    const reader = new FileReader();
                    reader.readAsText(file);
                    reader.onload = (e) => {
                        if (e.target === null) {
                            console.log('**** e.target is null ****');
                        }
                        else {
                            if (DEBUG2)
                                console.log(`[${location}] (using file()) successfully read file ${file.name}`);
                        }
                    };
                });
            }
        }
        catch (error) {
            console.log(`[${location}] error reading file ${file.name}`);
        }
    }
}
let printedWarning = false;
function printWarning() {
    if (!printedWarning) {
        console.log("================================================");
        console.log("Warning: you are running in 'local web page' mode");
        console.log("on a browser that has some restrictions.");
        console.log("");
        console.log("So far, looks like this browser will not let you");
        console.log("navigate *into* directories that are drag-and-dropped");
        console.log("Might also be having issues getting meta data,");
        console.log("as well as getting the 'full' path of the file.");
        console.log("============================================");
        printedWarning = true;
    }
    if (window.directoryDropText)
        window.directoryDropText.innerHTML = "Click to choose directories<br />(drag and drop might not work))";
}
export class SBFileHelper {
    server;
    ignoreFileSet = new Set();
    globalItemNumber = createCounter();
    globalFileItemNumber = createCounter();
    globalFileMap = new Map();
    currentFileList = new Map();
    finalFileList = new Map();
    globalBufferMap = new Map();
    constructor(sbConfig) {
        this.ignoreFileSet.add(".DS_Store");
        this.ignoreFileSet.add("/.DS_Store");
        this.ignoreFileSet.add(/.*~$/);
        this.server = new SB.Snackabra(sbConfig);
    }
    ignoreFile(fileName) {
        if (this.ignoreFileSet.has(fileName))
            return true;
        for (let ignoreFile of this.ignoreFileSet)
            if (ignoreFile instanceof RegExp)
                if (ignoreFile.test(fileName))
                    return true;
        return false;
    }
    uploadBuffer(myChannelId, payload, name) {
        console.log("uploadBuffer: ", this.server);
        return new Promise((resolve) => {
            this.server.storage.storeObject(payload, 'p', myChannelId).then((res) => {
                res.fileName = name;
                res.dateAndTime = new Date().toISOString();
                delete res["iv"];
                delete res["salt"];
                Promise.resolve(res.verification).then((v) => {
                    res.verification = v;
                    resolve(res);
                });
            });
        });
    }
    extractFileMetadata(fileObject) {
        function localResolve(metadata) {
            return metadata;
        }
        return new Promise((resolve) => {
            const metadata = {};
            if (fileObject instanceof File) {
                if (fileObject.name)
                    metadata.name = fileObject.name;
                if (fileObject.size)
                    metadata.size = fileObject.size;
                if (fileObject.type)
                    metadata.type = fileObject.type;
                if (fileObject.lastModified)
                    metadata.lastModified = fileObject.lastModified;
                if (fileObject.webkitRelativePath)
                    metadata.webkitRelativePath = fileObject.webkitRelativePath;
            }
            // eslint-disable-next-line no-undef
            if ((typeof FileSystemEntry !== "undefined") && (fileObject instanceof FileSystemEntry)) {
                if (fileObject.name)
                    metadata.name = fileObject.name;
                if (fileObject.fullPath)
                    metadata.fullPath = fileObject.fullPath;
                if (fileObject.isDirectory !== undefined)
                    metadata.isDirectory = fileObject.isDirectory;
                if (fileObject.isFile !== undefined)
                    metadata.isFile = fileObject.isFile;
                metadata.noGetMetaData = true;
            }
            // eslint-disable-next-line no-undef
            if ((typeof FileSystemFileEntry !== "undefined") && (fileObject instanceof FileSystemFileEntry)) {
                if (fileObject.fullPath)
                    metadata.fullPath = fileObject.fullPath;
                if (fileObject.isDirectory !== undefined)
                    metadata.isDirectory = fileObject.isDirectory;
                if (fileObject.isFile !== undefined)
                    metadata.isFile = fileObject.isFile;
                if (fileObject.file)
                    metadata.file = fileObject.file;
            }
            // eslint-disable-next-line no-undef
            if ((typeof FileSystemFileEntry !== "undefined") && ((fileObject instanceof FileSystemFileEntry))
                && (fileObject.getMetadata)) {
                fileObject.getMetadata((fileMetadata) => {
                    metadata.getMetaDataSize = fileMetadata.size;
                    metadata.getMetaDataModificationTime = fileMetadata.modificationTime;
                    if (fileObject.file)
                        fileObject.file((file) => {
                            metadata.getMetaDataFile = file;
                            metadata.getMetaDataType = file.type;
                            resolve(localResolve(metadata));
                        }, (error) => {
                            metadata.getMetaDataGetFileError = error;
                            resolve(localResolve(metadata));
                        });
                }, (error) => {
                    metadata.getMetaDataError = error;
                    resolve(localResolve(metadata));
                });
            }
            else {
                metadata.noGetMetaData = true;
                resolve(localResolve(metadata));
            }
        });
    }
    async scanFile(file, fromItem) {
        if (!file)
            return;
        if (DEBUG2)
            testToRead(file, 'scanFile');
        if (this.ignoreFile(file.name))
            return;
        let path;
        if (file instanceof File) {
            path = file.webkitRelativePath;
        }
        // eslint-disable-next-line no-undef
        else if (file instanceof FileSystemEntry) {
            path = file.fullPath;
        }
        // eslint-disable-next-line no-undef
        else if (file instanceof FileSystemFileEntry) {
            path = file.fullPath;
        }
        else {
            console.warn("**** Unknown file type (should not happen):");
            console.log(file);
            return;
        }
        let fileNumber = await (fromItem === -1 ? this.globalFileItemNumber.inc() : fromItem);
        file.SBitemNumber = fileNumber;
        let fromItemText = fromItem === -1 ? '' : ` (from item ${fromItem})`;
        await this.extractFileMetadata(file).then((metadata) => {
            if (DEBUG2)
                console.log(`adding ${fileNumber}`);
            file.SBfoundMetaData = metadata;
            if (path === '') {
                this.globalFileMap.set(`file ${fileNumber} ${fromItemText} name: '/` + file.name + "' ", file);
            }
            else {
                this.globalFileMap.set(`file ${fileNumber} ${fromItemText} path: '/` + path + "'", file);
            }
        }).catch((error) => {
            console.log("Error getting meta data for FILE (should NOT happen):");
            console.log(file);
            console.log(error);
        });
    }
    scanFileList(files) {
        if (!files)
            return;
        if (DEBUG)
            console.log(`==== scanFileList called, files.length: ${files.length}`);
        if (files)
            for (let i = 0; i < files.length; i++)
                this.scanFile(files[i], -1);
    }
    async scanItem(item, parent) {
        if (!item)
            return;
        if (this.ignoreFile(item.name))
            return;
        if (DEBUG2)
            testToRead(item, 'scanItem');
        let itemNumber = await this.globalItemNumber.inc();
        if (DEBUG2) {
            console.log(`scanItem ${itemNumber} ${item.name}`);
            console.log(item);
        }
        let parentString = '';
        item.SBitemNumber = itemNumber;
        if (parent !== null) {
            item.SBparentEntry = parent;
            item.SBparentNumber = parent.SBitemNumber;
            parentString = ` (parent ${parent.SBitemNumber}) `;
            if (!parent.SBfullName)
                parent.SBfullName = parent.name;
            item.SBfullName = parent.SBfullName + "/" + item.name;
        }
        await this.extractFileMetadata(item).then((metadata) => {
            item.SBfoundMetaData = metadata;
        }).catch((error) => {
            console.log("Error getting meta data for ITEM (should not happen):");
            console.log(item);
            console.log(error);
        });
        if (item.isDirectory) {
            const myThis = this;
            let directoryReader = item.createReader();
            item.SBdirectoryReader = directoryReader;
            this.globalFileMap.set(`item ${itemNumber}: '/` + item.name + `' [directory] ${parentString}`, item);
            directoryReader.readEntries(function (entries) {
                entries.forEach(async function (entry) {
                    await myThis.scanItem(entry, item);
                });
            }, function (error) {
                printWarning();
                if (DEBUG)
                    console.log(`Browser restriction: Unable to process this item as directory, '${item.name}':`);
                if (DEBUG2)
                    console.log(error);
            });
        }
        else {
            this.globalFileMap.set(`item ${itemNumber}: '/` + item.name + "' " + parentString, item);
            item.file((file) => {
                this.scanFile(file, itemNumber);
            }, function () {
                printWarning();
            });
        }
    }
    scanItemList(items) {
        if (!items)
            return;
        if (DEBUG)
            console.log(`==== scanItemList called, items.length: ${items.length}`);
        for (let i = 0; i < items.length; i++) {
            let item = items[i].webkitGetAsEntry();
            if (item)
                this.scanItem(item, null);
            else {
                console.log("just FYI, not a file/webkit entry:");
                console.log(items[i]);
            }
        }
    }
    afterOperation(callback) {
        setTimeout(() => {
            (async () => {
                console.log("-------DONE building globalFileMap---------");
                console.log(this.globalFileMap);
                let nameToFullPath = new Map();
                let candidateFileList = new Map();
                this.globalFileMap.forEach((value, _key) => {
                    if (!this.ignoreFile(value.name)) {
                        if (DEBUG2) {
                            console.log(`[${value.name}] Processing global file map entry: `);
                            console.log(value);
                        }
                        if (value.SBitemNumber !== undefined) {
                            let currentInfo = candidateFileList.get(value.SBitemNumber);
                            if (currentInfo) {
                                let newInfo = getProperties(value, propertyList);
                                Object.assign(newInfo, currentInfo);
                                if ((value.fullPath) && ((!newInfo.fullPath) || (value.fullPath.length > newInfo.fullPath.length)))
                                    newInfo.fullPath = value.fullPath;
                                newInfo.fileContentCandidates.push(value);
                                candidateFileList.set(value.SBitemNumber, newInfo);
                            }
                            else {
                                candidateFileList.set(value.SBitemNumber, Object.assign({}, getProperties(value, propertyList)));
                                currentInfo = candidateFileList.get(value.SBitemNumber);
                                currentInfo.fileContentCandidates = [value];
                            }
                        }
                        else if (value.fullPath) {
                            if (DEBUG2) {
                                console.log(`++++ adding path info for '${value.name}':`);
                                console.log(value.fullPath);
                                console.log(value);
                            }
                            nameToFullPath.set(value.name, value.fullPath);
                        }
                        else {
                            if (DEBUG2) {
                                console.log(`++++ ignoring file '${value.name}' in first phase (SHOULD NOT HAPPEN)`);
                                console.log(value);
                            }
                        }
                    }
                    else {
                        if (DEBUG2)
                            console.log(`Ignoring file '${value.name}' (based on ignoreFile)`);
                    }
                });
                console.log("-------DONE building candidateFileList---------");
                console.log(candidateFileList);
                candidateFileList.forEach((value, key) => {
                    if ((value.SBfullName !== undefined) && (("/" + value.SBfullName) !== value.fullPath)) {
                        console.log("WARNING: SBfullName and fullPath/name do not match");
                        console.log(`Name: ${value.name}, fullPath: ${value.fullPath}, SBfullName: ${value.SBfullName}`);
                        console.log(value);
                    }
                    let uniqueName = value.SBfullName || value.webkitRelativePath + '/' + value.name;
                    if (uniqueName !== undefined) {
                        if (value.isDirectory === true) {
                            uniqueName += " [directory]";
                        }
                        else if (value.isFile === true) {
                            uniqueName += " [file]";
                        }
                        if ((value.size !== undefined) && (value.isDirectory !== true)) {
                            uniqueName += ` [${value.size} bytes]`;
                        }
                        if (value.lastModified !== undefined) {
                            uniqueName += ` [${value.lastModified}]`;
                        }
                        if (DEBUG2) {
                            console.log(`processing object ${key} unique name '${uniqueName}':`);
                            console.log(value);
                        }
                        let currentInfo = this.currentFileList.get(uniqueName);
                        if (currentInfo) {
                            let altFullPath = currentInfo.fullPath;
                            let altFileContentCandidates = currentInfo.fileContentCandidates;
                            let altSbItemNumberList = currentInfo.SBitemNumberList;
                            Object.assign(currentInfo, getProperties(value, propertyList));
                            if ((altFullPath) && ((!currentInfo.fullPath) || (altFullPath.length > currentInfo.fullPath.length)))
                                currentInfo.fullPath = altFullPath;
                            if (altFileContentCandidates) {
                                if (currentInfo.fileContentCandidates === undefined)
                                    currentInfo.fileContentCandidates = [];
                                currentInfo.fileContentCandidates.push(...altFileContentCandidates);
                            }
                            altSbItemNumberList.push(value.SBitemNumber);
                            currentInfo.SBitemNumberList = altSbItemNumberList;
                        }
                        else {
                            value.SBitemNumberList = [value.SBitemNumber];
                            this.currentFileList.set(uniqueName, value);
                            currentInfo = candidateFileList.get(uniqueName);
                        }
                        if (DEBUG2) {
                            console.log(`... currentInfo for '${uniqueName}' (${uniqueName}):`);
                            console.log(currentInfo);
                        }
                    }
                    else {
                        if (DEBUG) {
                            console.log(`++++ ignoring file - it's lacking fullPath (should be rare)`);
                            console.log(value);
                        }
                    }
                });
                console.log("-------DONE building currentFileList---------");
                console.log(this.currentFileList);
                async function FP(file) {
                    return new Promise(async (resolve) => {
                        try {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                if ((e.target === null) || (e.target.result === null)) {
                                    if (DEBUG2)
                                        console.log(`+++++++ got a null back for '${file.name}' (??)`);
                                    resolve(null);
                                }
                                else if (typeof e.target.result === 'string') {
                                    if (DEBUG2)
                                        console.log(`+++++++ got a 'string' back for '${file.name}' (??)`);
                                    resolve(null);
                                }
                                else {
                                    if (DEBUG2) {
                                        console.log(`+++++++ read file '${file.name}'`);
                                        console.log(e.target.result);
                                    }
                                    resolve(e.target.result);
                                }
                            };
                            reader.onerror = (event) => {
                                if (DEBUG2) {
                                    console.log(`Could not read: ${file.name}`);
                                    console.log(event);
                                }
                                resolve(null);
                            };
                            await new Promise((resolve) => setTimeout(resolve, 20));
                            reader.readAsArrayBuffer(file);
                        }
                        catch (error) {
                            try {
                                if (DEBUG2)
                                    console.log(`+++++++ got error on '${file.name}', will try as FileSystemFileEntry`);
                                if (file.file) {
                                    file.file(async (file) => {
                                        const reader = new FileReader();
                                        reader.onload = (e) => {
                                            if ((e.target === null) || (e.target.result === null))
                                                resolve(null);
                                            else if (typeof e.target.result === 'string')
                                                resolve(null);
                                            else
                                                resolve(e.target.result);
                                        };
                                        reader.onerror = () => { resolve(null); };
                                        await new Promise((resolve) => setTimeout(resolve, 20));
                                        reader.readAsArrayBuffer(file);
                                    });
                                }
                                else {
                                    if (DEBUG2)
                                        console.log(`... cannot treat as file: ${file.name}`);
                                }
                            }
                            catch (error) {
                                if (DEBUG2)
                                    console.log(`Could not read: ${file.name}`);
                            }
                            resolve(null);
                        }
                    });
                }
                async function findFirstResolved(fileList) {
                    for (let index = 0; index < fileList.length; index++) {
                        let result = await FP(fileList[index]);
                        if (result !== null)
                            return result;
                    }
                    if (DEBUG) {
                        console.log("findFirstResolved(): found nothing usable from this fileList");
                        console.log(fileList);
                    }
                    return null;
                }
                let listOfFilePromises = [];
                this.currentFileList.forEach((value, key) => {
                    if ((value.fileContentCandidates) && (!value.uniqueShardId)) {
                        listOfFilePromises.push(new Promise(async (resolve) => {
                            findFirstResolved(value.fileContentCandidates)
                                .then(async (result) => {
                                if (DEBUG3)
                                    console.log(`got response for ${value.name}`);
                                if (!result) {
                                    if (DEBUG2)
                                        console.log(`... contents are empty for item ${key} (probably a directory)`);
                                }
                                else {
                                    const { id } = await sbCrypto.generateIdKey(result);
                                    let alreadyThere = this.globalBufferMap.get(id);
                                    if (alreadyThere) {
                                        if (DEBUG2)
                                            console.log(`... duplicate file found for ${key}`);
                                        result = alreadyThere;
                                    }
                                    else {
                                        this.globalBufferMap.set(id, result);
                                    }
                                    if (value.size === undefined) {
                                        if (DEBUG2)
                                            console.log(`... setting size for ${key} to ${result.byteLength}`);
                                        value.size = result.byteLength;
                                    }
                                    else if (value.size !== result.byteLength) {
                                        if (DEBUG)
                                            console.log(`WARNING: file ${value.name} has size ${value.size} but contents are ${result.byteLength} bytes (ignoring)`);
                                        resolve();
                                    }
                                    value.uniqueShardId = id;
                                    if (DEBUG2)
                                        console.log(`... found contents for ${key} (${result.byteLength} bytes)`);
                                }
                                resolve();
                            })
                                .catch((error) => {
                                if (DEBUG2)
                                    console.log(`couldn't read anything for ${key}`, error);
                                resolve();
                            });
                        }));
                    }
                    else {
                        if (DEBUG)
                            console.log(`skipping ${value.name} (item ${key})`);
                    }
                });
                if (DEBUG)
                    console.log("... kicked off all file promises");
                await Promise.all(listOfFilePromises).then((_results) => {
                    console.log("-------DONE building globalBufferMap ---------");
                    console.log(this.globalBufferMap);
                });
                this.currentFileList.forEach((value) => {
                    if (value.name) {
                        let path = "/";
                        if (value.SBfullName) {
                            path = ("/" + value.SBfullName).substring(0, value.fullPath.lastIndexOf('/') + 1);
                        }
                        else if (value.webkitRelativePath) {
                            path = ("/" + value.webkitRelativePath).substring(0, value.webkitRelativePath.lastIndexOf('/') + 1);
                        }
                        else if (value.fullPath) {
                            path = value.fullPath.substring(0, value.fullPath.lastIndexOf('/') + 1);
                        }
                        else if (nameToFullPath.has(value.name)) {
                            path = nameToFullPath.get(value.name).substring(0, nameToFullPath.get(value.name).lastIndexOf('/') + 1);
                        }
                        else {
                            if (DEBUG2) {
                                console.log(`... no (further) path info for '${value.name}'`);
                                console.log(value);
                            }
                        }
                        path = path.endsWith("/") ? path : path.concat("/");
                        if (DEBUG2)
                            console.log(`... path for '${value.name}' is '${path}'`);
                        if (value.isDirectory === true) {
                            value.type = "directory";
                            value.size = 0;
                        }
                        let finalFullName = path + value.name;
                        let metaDataString = "";
                        let lastModifiedString = "";
                        if (value.lastModified) {
                            lastModifiedString = (new Date(value.lastModified)).toLocaleString();
                            // metaDataString += ` [${lastModifiedString}]`;
                        }
                        if (value.size) {
                            metaDataString += ` [${value.size} bytes]`;
                        }
                        if (value.uniqueShardId) {
                            metaDataString += ` [${value.uniqueShardId.substr(0, 12)}]`;
                        }
                        finalFullName += metaDataString;
                        let row = {
                            name: value.name, size: value.size, type: value.type, lastModified: lastModifiedString, hash: value.uniqueShardId?.substr(0, 12),
                            path: path, uniqueShardId: value.uniqueShardId, fullName: finalFullName, metaDataString: metaDataString, SBfullName: value.SBfullName
                        };
                        let currentRow = this.finalFileList.get(finalFullName);
                        if (!currentRow)
                            this.finalFileList.set(finalFullName, row);
                        else {
                            if (DEBUG)
                                console.log(`... overriding some values for ${finalFullName} (this is rare)`);
                            if (currentRow.size === undefined)
                                currentRow.size = row.size;
                            if (currentRow.type === undefined)
                                currentRow.type = row.type;
                            if (currentRow.lastModified === undefined)
                                currentRow.lastModified = row.lastModified;
                            if (currentRow.uniqueShardId === undefined)
                                currentRow.uniqueShardId = row.uniqueShardId;
                        }
                        if (DEBUG2) {
                            console.log(`File ${value.name} has info`);
                            console.log(row);
                        }
                    }
                });
                console.log("-------DONE building finalFileList ---------");
                console.log(this.finalFileList);
                if (SKIP_DIR) {
                    let reverseBufferMap = new Map(Array.from(this.globalBufferMap.keys()).map((key) => [key, new Map()]));
                    for (const key of this.finalFileList.keys()) {
                        let entry = this.finalFileList.get(key);
                        if ((entry.type === "directory") || (entry.uniqueShardId === undefined)) {
                            if (DEBUG2)
                                console.log(`... removing ${key} from final list (directory)`);
                            this.finalFileList.delete(key);
                        }
                        else {
                            const uniqueShortName = entry.name + entry.metaDataString;
                            if (entry.path !== "/") {
                                const mapEntry = reverseBufferMap?.get(entry.uniqueShardId)?.get(uniqueShortName);
                                if (mapEntry) {
                                    if (mapEntry.path.length > entry.path.length) {
                                        this.finalFileList?.delete(key);
                                    }
                                    else {
                                        this.finalFileList.delete(mapEntry.fullName);
                                        reverseBufferMap?.get(entry.uniqueShardId).set(uniqueShortName, entry);
                                    }
                                }
                                else {
                                    reverseBufferMap?.get(entry.uniqueShardId).set(uniqueShortName, entry);
                                }
                            }
                        }
                    }
                    if (DEBUG)
                        console.log(reverseBufferMap);
                    for (const key of this.finalFileList.keys()) {
                        let entry = this.finalFileList.get(key);
                        const uniqueShortName = entry.name + entry.metaDataString;
                        if (entry.path === "/") {
                            const mapEntry = reverseBufferMap?.get(entry.uniqueShardId)?.get(uniqueShortName);
                            if (mapEntry) {
                                if (DEBUG2)
                                    console.log(`... removing ${key} from final list (duplicate short name)`);
                                this.finalFileList.delete(key);
                            }
                            else {
                                if (DEBUG2)
                                    console.log(`... leaving ${key} in final list (unique short name)`);
                            }
                        }
                    }
                }
                for (const key of this.finalFileList.keys()) {
                    let entry = this.finalFileList.get(key);
                    if (entry.type === undefined) {
                        if (DEBUG2)
                            console.log(`... trying to figure out mime type for ${key}`);
                        let mimeType = await getMimeType(entry.uniqueShardId);
                        if (mimeType) {
                            entry.type = mimeType;
                        }
                        else {
                            entry.type = "";
                        }
                    }
                }
                if (LOAD_SERVICE_WORKER) {
                    for (const key of this.finalFileList.keys()) {
                        let entry = this.finalFileList.get(key);
                        if (entry.type !== "directory") {
                            if (DEBUG2)
                                console.log(`... kicking off cacheResource for ${key} (${entry.path + entry.name})`);
                            cacheResource(entry.path + entry.name, entry.uniqueShardId, entry.type, this.globalBufferMap);
                        }
                    }
                }
                let tableContents = Array.from(this.finalFileList.values()).sort((a, b) => a.path.localeCompare(b.path) || a.name.localeCompare(b.name));
                if (DEBUG) {
                    console.log("Table contents:");
                    console.log(this.finalFileList);
                }
                console.log("-------DONE with all file promises (clearing state) ---------");
                this.globalItemNumber = createCounter();
                this.globalFileItemNumber = createCounter();
                this.globalFileMap = new Map();
                this.currentFileList = new Map();
                callback(tableContents);
            })();
        }, 50);
    }
    handleFileDrop(event, callback) {
        event.preventDefault();
        return this.handleEvent(event, callback, "[file drop]");
    }
    handleDirectoryDrop(event, callback) {
        event.preventDefault();
        return this.handleEvent(event, callback, "[directory drop]");
    }
    handleFileClick(event, callback) {
        event.preventDefault();
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.accept = '*/*';
        fileInput.addEventListener('change', (event) => {
            this.handleEvent(event, callback, "[file click]");
        });
        fileInput.click();
    }
    handleDirectoryClick(event, callback) {
        event.preventDefault();
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.webkitdirectory = true;
        fileInput.accept = '*/*';
        fileInput.addEventListener('change', (event) => {
            this.handleEvent(event, callback, "[directory click]");
        });
        fileInput.click();
    }
    async handleEvent(event, callback, _context) {
        let files, items;
        if (event.dataTransfer) {
            files = event.dataTransfer.files;
            items = event.dataTransfer.items;
        }
        else if (event.target) {
            if (event.target.files)
                files = event.target.files;
            if (event.target.items)
                items = event.target.items;
        }
        else {
            console.log("Unknown event type (should not happen):");
            console.log(event);
            return;
        }
        if (DEBUG3) {
            console.log("Received items (DataTransferItemList):");
            console.log(items);
            console.log("Received files:");
            console.log(files);
        }
        this.scanItemList(items);
        this.scanFileList(files);
        this.afterOperation(callback);
    }
}
export class SBFile extends SB.SBMessage {
    data = {
        previewImage: '',
        fullImage: ''
    };
    image = '';
    image_sign = '';
    imageMetaData = {};
    constructor(channel, file) {
        super(channel, '');
        console.warn('working on SBFile()!');
        console.log('file: ', file);
    }
}
//# sourceMappingURL=SBFileHelper.js.map