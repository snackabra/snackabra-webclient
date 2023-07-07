/* eslint-disable no-undef */
/// <reference path="./b64NS.d.ts" />
// import { Snackabra, assemblePayload, SBCrypto } from "./snackabra.js";
// import { b64 } from "./b64NS.js";
// import { arrayBufferToBase64 } from "./dist/b64.dist.js";
// TS Namespace version of SBFileHelperDemo.ts
// ... if you need SBFileHelperDemo.ts, just get it from the core of the NS below
var SBFileHelperDemo;
(function (SBFileHelperDemo) {
    const DEBUG = true;
    const DEBUG2 = false; // more verbose
    const DEBUG3 = false; // etc
    const LOAD_SERVICE_WORKER = false;
    const fileHelperVersion = "0.0.12";
    console.log("==== SBFileHelperDemoNS.ts v" + fileHelperVersion + " loaded ====");
    // hack:
    let arrayBufferToBase64;
    if (window.b64) {
        arrayBufferToBase64 = window.b64.arrayBufferToBase64;
    }
    else if (window.SB) {
        arrayBufferToBase64 = window.SB.arrayBufferToBase64;
    }
    else {
        throw new Error("No b64 or SB namespace found - cannot bootstrap by myself here guys");
    }
    // SUBTLE note about this code:
    // we try hard to execute synchronously (against our nature), because
    // the order in which bits and pieces of information arrive is important.
    // for example, we try to process a directory before it's contents.
    // TODO
    // we might want to automatically strip
    // '//# sourceMappingURL=example.js.map'
    // from any added javascript file (since it will prompt a browser to
    // "leak" back to origin server what files are being processed)
    // TODO: this should be an exported configuration
    // create a set with file names to ignore
    let ignoreFileSet = new Set();
    // add some files to ignore
    ignoreFileSet.add(".DS_Store");
    ignoreFileSet.add("/.DS_Store");
    // add a regex to catch emacs backup files
    ignoreFileSet.add(/.*~$/);
    // TODO
    // in many circumstances, we can infer directory structure from 
    // the various sources of information.  doing this reliably
    // (for example handling "dangling" directories) is tricky to
    // get right. so for now we only include the structure that
    // is clearly indicated by the files.  instead of removing the
    // partial code, however, we just disable it:
    const SKIP_DIR = true; // if you turn this false, you have work to do 
    //#region SETUP *******************************************************************************************************
    let localSB = {};
    let SBServer;
    let sbCrypto;
    let serviceWorkerFunctional = false;
    window.SBFileHelperReady = new Promise((resolve, reject) => {
        window.SBFileHelperReadyResolve = resolve;
        window.SBFileHelperReadyReject = reject;
    });
    console.log("SBFileHelperDemo.ts loaded");
    // console.log((window as any).SBFileHelperReady);
    window.SBReady.then(() => {
        if (!window.SB)
            throw new Error("SB not found");
        const sbConfig = (window.configuration && window.configuration.sbConfig)
            ? window.configuration.sbConfig
            : {
                channel_server: 'https://channel.384co.workers.dev',
                channel_ws: 'wss://channel.384co.workers.dev',
                storage_server: 'https://shard.3.8.4.land' // 'https://storage.384co.workers.dev'
            };
        if (typeof Snackabra !== 'undefined') {
            localSB.Snackabra = Snackabra;
            localSB.assemblePayload = assemblePayload;
            localSB.SBCrypto = SBCrypto;
        }
        else {
            localSB.Snackabra = window.SB.Snackabra;
            localSB.assemblePayload = window.SB.assemblePayload;
            localSB.SBCrypto = window.SB.SBCrypto;
        }
        SBServer = new localSB.Snackabra(sbConfig);
        sbCrypto = new localSB.SBCrypto();
        window.SBServer = SBServer;
        window.SBFileHelper = {
            version: fileHelperVersion,
            currentFileList: currentFileList,
            finalFileList: SBFileHelperDemo.finalFileList,
            globalBufferMap: SBFileHelperDemo.globalBufferMap,
            uploadCurrentFiles: uploadCurrentFiles,
            uploadBuffer: uploadBuffer,
            handleDirectoryDrop: handleDirectoryDrop,
            handleFileDrop: handleFileDrop,
            handleDirectoryClick: handleDirectoryClick,
            handleFileClick: handleFileClick,
        };
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
    });
    //#endregion SETUP
    //#region HELPER FUNCTIONS ************************************************************************************************
    // helper function to pull properties of interest out, resilient
    // to what is available on the object/class/whatever
    // const fileInfo = { ...getProperties(fileObject, propertyList) };
    function getProperties(obj, propertyList) {
        const properties = {};
        // First priority: regular properties (directly on the object)
        propertyList.forEach((property) => {
            if (obj.hasOwnProperty(property)) {
                properties[property] = obj[property];
            }
        });
        // Second priority: own properties (from Object.getOwnPropertyNames)
        Object.getOwnPropertyNames(obj).forEach((property) => {
            if (propertyList.includes(property) && !properties.hasOwnProperty(property)) {
                properties[property] = obj[property];
            }
        });
        // Third priority: properties up the prototype chain (from for...in loop)
        for (const property in obj) {
            if (propertyList.includes(property) && !properties.hasOwnProperty(property)) {
                properties[property] = obj[property];
            }
        }
        return properties;
    }
    // Global counter utility; works well with async/await etc
    const createCounter = () => {
        let counter = 0;
        const inc = async () => {
            await new Promise((resolve) => setTimeout(resolve, 0)); // Simulate asynchronous operation
            counter++;
            return counter - 1; // we count starting at zero
        };
        return { inc };
    };
    // write a function to check if a file should be ignored
    function ignoreFile(fileName) {
        if (ignoreFileSet.has(fileName))
            return true;
        for (let ignoreFile of ignoreFileSet)
            if (ignoreFile instanceof RegExp)
                if (ignoreFile.test(fileName))
                    return true;
        return false;
    }
    // TODO: this is in a newer version of snackabra.ts that what our jslib shard has
    function generateIdKey(buf) {
        return new Promise((resolve, reject) => {
            try {
                crypto.subtle.digest('SHA-512', buf).then((digest) => {
                    const _id = digest.slice(0, 32);
                    const _key = digest.slice(32);
                    resolve({
                        id: arrayBufferToBase64(_id),
                        key: arrayBufferToBase64(_key)
                    });
                });
            }
            catch (e) {
                reject(e);
            }
        });
    }
    function getMimeType(fileName) {
        // Mapping of file extensions to MIME types
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
            '.7z': 'application/x-7z-compressed', // 7-zip archive
        };
        // Extract the file extension from the file name
        const fileExtension = fileName.slice(fileName.lastIndexOf('.'));
        // Return the MIME type if it exists in the mapping, or an empty string otherwise
        return MIME_TYPES[fileExtension];
    }
    //#endregion TYPESCRIPT TYPES ETC ************************************************************************************************
    // give any file or item "seen" a unique number (reset on every UI interaction)
    let globalItemNumber = createCounter();
    // if there are items, files will at first be numbered the same (reset on every UI interaction)
    let globalFileItemNumber = createCounter();
    // all of our scanning results go here, unabridged (reset on every UI interaction)
    let globalFileMap = new Map();
    // this is the distilled list of files we will add to finalFileList (reset on every UI interaction)
    let currentFileList = new Map();
    // this is one accumulative, and used directly for the table (NOT reset)
    SBFileHelperDemo.finalFileList = new Map();
    // track all (unique) array buffers that have been read (NOT reset)
    // TODO: strictly speaking we don't do garbage collection on this
    SBFileHelperDemo.globalBufferMap = new Map();
    // these are the properties that we (potenially) care about
    const propertyList = ['lastModified', 'name', 'type', 'size', 'webkitRelativePath', 'fullPath', 'isDirectory', 'isFile',
        'SBitemNumber', 'SBitemNumberList', 'fileContentCandidates', 'fileContents', 'uniqueShardId',
        'SBparentEntry', 'SBparentNumber', 'SBfoundMetaData', 'SBfullName'];
    // called after every user interaction (eg any possible additions of files)
    function afterOperation(callback) {
        setTimeout(() => {
            (async () => {
                console.log("-------DONE building globalFileMap---------");
                console.log(globalFileMap);
                let nameToFullPath = new Map();
                let candidateFileList = new Map();
                globalFileMap.forEach((value, _key) => {
                    if (!ignoreFile(value.name)) {
                        if (DEBUG2) {
                            console.log(`[${value.name}] Processing global file map entry: `);
                            console.log(value);
                        }
                        if (value.SBitemNumber !== undefined) {
                            let currentInfo = candidateFileList.get(value.SBitemNumber);
                            if (currentInfo) {
                                // let altFullPath = value.fullPath;
                                // let altFileContentCandidates = value.fileContentCandidates;
                                let newInfo = getProperties(value, propertyList);
                                // Object.assign(currentInfo, getProperties(value, propertyList));
                                Object.assign(newInfo, currentInfo);
                                if ((value.fullPath) && ((!newInfo.fullPath) || (value.fullPath.length > newInfo.fullPath.length)))
                                    newInfo.fullPath = value.fullPath;
                                newInfo.fileContentCandidates.push(value);
                                // currentInfo.fileContentCandidates = altFileContentCandidates;
                                candidateFileList.set(value.SBitemNumber, newInfo);
                            }
                            else {
                                candidateFileList.set(value.SBitemNumber, Object.assign({}, getProperties(value, propertyList)));
                                currentInfo = candidateFileList.get(value.SBitemNumber);
                                currentInfo.fileContentCandidates = [value];
                            }
                        }
                        else if (value.fullPath) {
                            // in some cases we can pick up path from here
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
                // now merge into currentFileList
                candidateFileList.forEach((value, key) => {
                    if ((value.SBfullName !== undefined) && (("/" + value.SBfullName) !== value.fullPath)) {
                        console.log("WARNING: SBfullName and fullPath/name do not match");
                        console.log(`Name: ${value.name}, fullPath: ${value.fullPath}, SBfullName: ${value.SBfullName}`);
                        console.log(value);
                    }
                    // pullPath is not reliable in the absence of our ability to reconstruct from parent-child
                    let uniqueName = value.SBfullName || value.webkitRelativePath + '/' + value.name;
                    /* if ((value.isDirectory) && (SKIP_DIR)) {
                        if (DEBUG) console.log(`Skipping directory '${uniqueName}'`);
                    } else */ if (uniqueName !== undefined) {
                        if (value.isDirectory === true) {
                            uniqueName += " [directory]";
                        }
                        else if (value.isFile === true) {
                            uniqueName += " [file]";
                        }
                        if ((value.size !== undefined) && (value.isDirectory != true)) {
                            uniqueName += ` [${value.size} bytes]`;
                        }
                        if (value.lastModified !== undefined) {
                            uniqueName += ` [${value.lastModified}]`;
                        }
                        if (DEBUG2) {
                            console.log(`processing object ${key} unique name '${uniqueName}':`);
                            console.log(value);
                        }
                        let currentInfo = currentFileList.get(uniqueName);
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
                            currentFileList.set(uniqueName, value);
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
                console.log(currentFileList);
                // we'll now try reading all the files, and gathering any missing metadata while we're at it
                // attempts to read a file, returns promise with contents, or null if not readable
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
                            // we try to release pressure on the browser
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
                                        // we try to release pressure on the browser
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
                // function findFirstResolved(fileList: Array<File | FileSystemEntry | FileSystemFileEntry>, index = 0): Promise<ArrayBuffer> {
                //     return new Promise((resolve, reject) => {
                //         if (index < fileList.length) {
                //             if (DEBUG) console.log(`[${index}] trying to get contents for ${fileList[index].name}`)
                //             resolve(Promise.any([
                //                 FP(fileList[index]),
                //                 new Promise<ArrayBuffer>((resolve) => {
                //                     setTimeout(() => { 
                //                         if (DEBUG) console.log(`... trying again to get contents for ${fileList[index].name}`)
                //                         resolve(findFirstResolved(fileList, index + 1));
                //                     }, 50);
                //                 })
                //             ]));
                //         } else {
                //             resolve();
                //         }
                //     });
                // }
                let listOfFilePromises = [];
                currentFileList.forEach((value, key) => {
                    if ((value.fileContentCandidates) && (!value.uniqueShardId)) {
                        // listOfFilePromises.push(value);
                        listOfFilePromises.push(new Promise(async (resolve) => {
                            findFirstResolved(value.fileContentCandidates)
                                .then(async (result) => {
                                if (DEBUG3)
                                    console.log(`got response for ${value.name}`);
                                if (!result) {
                                    if (DEBUG2)
                                        console.log(`... contents are empty for item ${key} (probably a directory)`);
                                    // value.uniqueShardId = null;  // actually no, we'll leave it as undefined
                                }
                                else {
                                    const { id } = await generateIdKey(result); // TODO: should use sbCrypto
                                    let alreadyThere = SBFileHelperDemo.globalBufferMap.get(id);
                                    if (alreadyThere) {
                                        if (DEBUG2)
                                            console.log(`... duplicate file found for ${key}`);
                                        result = alreadyThere; // memory conservation
                                    }
                                    else {
                                        SBFileHelperDemo.globalBufferMap.set(id, result);
                                    }
                                    if (value.size === undefined) {
                                        if (DEBUG2)
                                            console.log(`... setting size for ${key} to ${result.byteLength}`);
                                        value.size = result.byteLength;
                                    }
                                    else if (value.size !== result.byteLength) {
                                        if (DEBUG)
                                            console.log(`WARNING: file ${value.name} has size ${value.size} but contents are ${result.byteLength} bytes (ignoring)`);
                                        resolve(); // not the droid we're looking for
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
                                // value.uniqueShardId = null;
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
                // this now updates the table and the UI
                await Promise.all(listOfFilePromises).then((_results) => {
                    // let's see what's in array buffers:
                    console.log("-------DONE building globalBufferMap ---------");
                    console.log(SBFileHelperDemo.globalBufferMap);
                });
                currentFileList.forEach((value) => {
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
                        // make sure last character is "/"
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
                            metaDataString += ` [${lastModifiedString}]`;
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
                            // these are extra / hidden:
                            path: path, uniqueShardId: value.uniqueShardId, fullName: finalFullName, metaDataString: metaDataString, SBfullName: value.SBfullName
                        };
                        let currentRow = SBFileHelperDemo.finalFileList.get(finalFullName);
                        if (!currentRow)
                            SBFileHelperDemo.finalFileList.set(finalFullName, row);
                        else {
                            // just a handful of things worth overriding:
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
                console.log(SBFileHelperDemo.finalFileList);
                // final coalesing;
                // we review the finalFileList, and remove directories, which includes everything
                // that we were unable to read the contents of
                if (SKIP_DIR) {
                    let reverseBufferMap = new Map(Array.from(SBFileHelperDemo.globalBufferMap.keys()).map((key) => [key, new Map()]));
                    for (const key of SBFileHelperDemo.finalFileList.keys()) {
                        let entry = SBFileHelperDemo.finalFileList.get(key);
                        if ((entry.type === "directory") || (entry.uniqueShardId === undefined)) {
                            if (DEBUG2)
                                console.log(`... removing ${key} from final list (directory)`);
                            SBFileHelperDemo.finalFileList.delete(key);
                        }
                        else {
                            const uniqueShortName = entry.name + entry.metaDataString;
                            if (entry.path !== "/") {
                                const mapEntry = reverseBufferMap.get(entry.uniqueShardId).get(uniqueShortName);
                                if (mapEntry) {
                                    // we have a duplicate
                                    if (mapEntry.path.length > entry.path.length) {
                                        // we're the shorter one, so we remove ourselves
                                        SBFileHelperDemo.finalFileList.delete(key);
                                    }
                                    else {
                                        // we're the longer one, so we remove the old guy
                                        SBFileHelperDemo.finalFileList.delete(mapEntry.fullName);
                                        reverseBufferMap.get(entry.uniqueShardId).set(uniqueShortName, entry);
                                    }
                                }
                                else {
                                    // otherwise we leave ourselves in
                                    reverseBufferMap.get(entry.uniqueShardId).set(uniqueShortName, entry);
                                }
                            }
                        }
                    }
                    if (DEBUG)
                        console.log(reverseBufferMap);
                    // after that first pass, we can now see whether short names are unique
                    for (const key of SBFileHelperDemo.finalFileList.keys()) {
                        let entry = SBFileHelperDemo.finalFileList.get(key);
                        const uniqueShortName = entry.name + entry.metaDataString;
                        if (entry.path === "/") {
                            const mapEntry = reverseBufferMap.get(entry.uniqueShardId).get(uniqueShortName);
                            if (mapEntry) {
                                // we have a duplicate, and delete ourselves
                                if (DEBUG2)
                                    console.log(`... removing ${key} from final list (duplicate short name)`);
                                SBFileHelperDemo.finalFileList.delete(key);
                            }
                            else {
                                // otherwise we leave ourselves in
                                if (DEBUG2)
                                    console.log(`... leaving ${key} in final list (unique short name)`);
                            }
                        }
                    }
                }
                // finally we check if mime type is missing, and if so, try to figure it out
                for (const key of SBFileHelperDemo.finalFileList.keys()) {
                    let entry = SBFileHelperDemo.finalFileList.get(key);
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
                // and now we call "cacheResource()" for all of the entries
                // note that the actual data is in globalBufferMap.get(uniqueShardId)
                if (LOAD_SERVICE_WORKER) {
                    for (const key of SBFileHelperDemo.finalFileList.keys()) {
                        let entry = SBFileHelperDemo.finalFileList.get(key);
                        if (entry.type !== "directory") {
                            if (DEBUG2)
                                console.log(`... kicking off cacheResource for ${key} (${entry.path + entry.name})`);
                            cacheResource(entry.path + entry.name, entry.uniqueShardId, entry.type);
                        }
                    }
                }
                // "export" as a sorted array to our table
                // let tableContents = Array.from(finalFileList).sort((a, b) => a[0].localeCompare(b[0]));
                // let tableContents = Array.from(finalFileList.values()).sort((a, b) => a.toString().localeCompare(b.toString()));
                let tableContents = Array.from(SBFileHelperDemo.finalFileList.values()).sort((a, b) => a.path.localeCompare(b.path) || a.name.localeCompare(b.name));
                if (DEBUG) {
                    console.log("Table contents:");
                    console.log(tableContents);
                }
                // (window as any).renderTable(
                //     tableContents,
                //     ["Name", "Size", "Type", "Last Modified", "Hash"],
                //     [false, false, false, false, false],
                //     "table-container",
                //     (newData: any) => { console.log("Updated table:"); console.log(newData); }
                // );
                console.log("-------DONE with all file promises (clearing state) ---------");
                // now we clear for any additionl UI
                globalItemNumber = createCounter();
                globalFileItemNumber = createCounter();
                globalFileMap = new Map();
                currentFileList = new Map();
                // we do NOT clear the globalBufferMap
                callback(tableContents);
            })(); // async
        }, 50);
    }
    // basic upload single buffer
    function uploadBuffer(myChannelId, payload, name) {
        return new Promise((resolve) => {
            SBServer.storage.storeObject(payload, 'p', myChannelId).then((res) => {
                res.fileName = name;
                res.dateAndTime = new Date().toISOString();
                delete res["iv"]; // hack
                delete res["salt"]; // hack
                Promise.resolve(res.verification).then((v) => {
                    res.verification = v;
                    resolve(res);
                });
            });
        });
    }
    SBFileHelperDemo.uploadBuffer = uploadBuffer;
    async function uploadCurrentFiles(myChannelId, callback) {
        if (DEBUG)
            console.log("==== uploadCurrentFiles() ====");
        let directory = {};
        console.log("Current file list: ");
        console.log(currentFileList);
        currentFileList.forEach((value, key) => {
            if (DEBUG)
                console.log("File: " + value.name);
            let dirEntry = getProperties(value, ["name", "type", "size", "lastModified", "webkitRelativePath"]);
            directory[key] = dirEntry;
        });
        console.log("Directory: ");
        console.log(directory);
    }
    //#region SERVICE WORKER AND CACHE ****************************************************************************************
    async function setupServiceWorker() {
        try {
            if ('serviceWorker' in navigator) {
                await navigator.serviceWorker.register('service-worker.js');
                // MTG: moved this flag here, it seems like we aren't getting a message event.
                // Maybe because we are in a different window?
                // todo: follow up to investigate some more
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
    const serverPrefix = window.location.protocol + "//" + window.location.host;
    if (DEBUG)
        console.log("serverPrefix: ", serverPrefix);
    async function cacheResource(fileName, uniqueShardId, mimeType) {
        if (!LOAD_SERVICE_WORKER)
            return Promise.resolve(); // no-op
        if (!serviceWorkerFunctional) {
            console.error("service worker is not operational");
            return Promise.resolve();
        }
        if (fileName === "/service-worker.js" /* fileName.endsWith("service-worker.js") */) {
            console.log("**** special override: self-virtualizing service worker (/service-worker.js)");
            return Promise.resolve();
        }
        if (fileName === "/index.html") {
            console.log("**** special override: index.html can also be accessed as '/'");
            await cacheResource("/", uniqueShardId, mimeType);
        }
        if (DEBUG)
            console.log(`Caching resource '${fileName}' with uniqueShardId '${uniqueShardId}' and mimeType '${mimeType}'`);
        // Open a cache with a specific name
        const cache = (await sb384cachePromise);
        let arrayBuffer = SBFileHelperDemo.globalBufferMap.get(uniqueShardId);
        // Create a Response object with the ArrayBuffer and MIME type
        const response = new Response(arrayBuffer, {
            status: 200,
            headers: { 'Content-Type': mimeType },
        });
        // Add the Response to the cache using the file name as the key
        await cache.put(fileName, response);
    }
    //#endregion
    //#region SCAN ITEMS AND FILES ****************************************************************************************
    // these are called by the UI code to parse any files or directories that have been selected
    // by the UI, whether through a file input or a drag-and-drop operation
    // returns metadata for a file object whether it is a File or FileEntry
    function extractFileMetadata(fileObject) {
        function localResolve(metadata) {
            // console.log("Extracted metadata:");
            // console.log(metadata);
            return metadata;
        }
        return new Promise((resolve) => {
            const metadata = {};
            // console.log("Extracting metadata from object:");
            // console.log(fileObject);
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
            if ((typeof FileSystemFileEntry !== "undefined") && (fileObject instanceof FileSystemFileEntry)) {
                if (fileObject.fullPath)
                    metadata.fullPath = fileObject.fullPath;
                // if it's there, not so important:
                // if (fileObject.lastModifiedDate)
                //     metadata.lastModifiedDate = fileObject.lastModifiedDate;
                if (fileObject.isDirectory !== undefined)
                    metadata.isDirectory = fileObject.isDirectory;
                if (fileObject.isFile !== undefined)
                    metadata.isFile = fileObject.isFile;
                if (fileObject.file)
                    metadata.file = fileObject.file;
            }
            if ((typeof FileSystemFileEntry !== "undefined") && ((fileObject instanceof FileSystemFileEntry))
                && (fileObject.getMetadata)) {
                // this is the only situation where we have another promise 
                fileObject.getMetadata((fileMetadata) => {
                    // console.log("Got meta data from file object:");
                    // console.log(fileMetadata);
                    // metadata.getMetaDataName = fileMetadata.name; // apparently not available?
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
                // otherwise, all info should be immediately available
                metadata.noGetMetaData = true;
                resolve(localResolve(metadata));
            }
        });
    }
    async function scanFile(file, fromItem) {
        if (!file)
            return;
        if (DEBUG2)
            testToRead(file, 'scanFile');
        if (ignoreFile(file.name))
            return;
        let path;
        if (file instanceof File) {
            path = file.webkitRelativePath;
        }
        else if (file instanceof FileSystemEntry) {
            path = file.fullPath;
        }
        else if (file instanceof FileSystemFileEntry) {
            path = file.fullPath;
        }
        else {
            console.warn("**** Unknown file type (should not happen):");
            console.log(file);
            return;
        }
        let fileNumber = await (fromItem === -1 ? globalFileItemNumber.inc() : fromItem);
        file.SBitemNumber = fileNumber;
        let fromItemText = fromItem === -1 ? '' : ` (from item ${fromItem})`;
        // fileListFile1_Files.push(file);
        await extractFileMetadata(file).then((metadata) => {
            if (DEBUG2)
                console.log(`adding ${fileNumber}`);
            file.SBfoundMetaData = metadata;
            // globalFileMap.set(`file ${fileNumber} (item ${fromItem}): ` + "/" + metadata.name + " [file] [2] (" + metadata.size + ")", file);
            // if ((file instanceof File) && (file.type !== "")) {
            //     globalFileMap.set(`file ${fileNumber} (item ${fromItem}): ` + "/" + metadata.name + " [meta from file]", metadata);
            // }
            if (path === '') {
                // fileListFile1.push('/' + file.name);
                globalFileMap.set(`file ${fileNumber} ${fromItemText} name: '/` + file.name + "' ", file);
            }
            else {
                // fileListFile1.push('/' + path);
                globalFileMap.set(`file ${fileNumber} ${fromItemText} path: '/` + path + "'", file);
            }
        }).catch((error) => {
            console.log("Error getting meta data for FILE (should NOT happen):");
            console.log(file);
            console.log(error);
        });
    }
    function scanFileList(files) {
        if (!files)
            return;
        if (DEBUG)
            console.log(`==== scanFileList called, files.length: ${files.length}`);
        if (files)
            for (let i = 0; i < files.length; i++)
                /* await */ scanFile(files[i], -1);
    }
    async function scanItem(item, parent) {
        if (!item)
            return;
        if (ignoreFile(item.name))
            return;
        if (DEBUG2)
            testToRead(item, 'scanItem');
        let itemNumber = await globalItemNumber.inc();
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
                // if we're a child then parent must be a parent
                parent.SBfullName = parent.name;
            // only if parents are around do we assert any knowledge of path
            item.SBfullName = parent.SBfullName + "/" + item.name;
        }
        // if (item.fullPath)
        //     globalFileMap.set(`item ${itemNumber}: ` + item.fullPath + ` [item] [0] - indent ${indent}`, item);
        // globalFileMap.set(`item ${itemNumber}: ` + '/' + item.name + ` [item] [1] - indent ${indent}`, item);
        await extractFileMetadata(item).then((metadata) => {
            item.SBfoundMetaData = metadata;
            // globalFileMap.set(`item ${itemNumber}: ` + item.fullPath + ` [item] [2] - indent ${indent} `, item);
            // globalFileMap.set(`item ${itemNumber}: ` + item.fullPath + ` [meta from item] - indent ${indent} `, metadata);
        }).catch((error) => {
            console.log("Error getting meta data for ITEM (should not happen):");
            console.log(item);
            console.log(error);
        });
        if (item.isDirectory) {
            let directoryReader = item.createReader();
            item.SBdirectoryReader = directoryReader;
            globalFileMap.set(`item ${itemNumber}: '/` + item.name + `' [directory] ${parentString}`, item);
            directoryReader.readEntries(function (entries) {
                entries.forEach(async function (entry) {
                    await scanItem(entry, item);
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
            globalFileMap.set(`item ${itemNumber}: '/` + item.name + "' " + parentString, item);
            item.file((file) => {
                scanFile(file, itemNumber);
            }, function () {
                printWarning();
            });
        }
    }
    function scanItemList(items) {
        if (!items)
            return;
        if (DEBUG)
            console.log(`==== scanItemList called, items.length: ${items.length}`);
        // console.log(items);
        for (let i = 0; i < items.length; i++) {
            let item = items[i].webkitGetAsEntry();
            if (item) /* await */
                scanItem(item, null);
            else {
                console.log("just FYI, not a file/webkit entry:");
                console.log(items[i]);
            }
        }
    }
    //#endregion SCAN ITEMS OR FILES *******************************************************************************************************
    //#region DEBUG/DEBUG2 SUPPORT FUNCTIONS ******************************************************************************
    function testToRead(file, location) {
        // the commented-out code is proper typescript, but this comes from
        // the browser / app code ...
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
                                // console.log(e.target.result);
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
    // // archived debug code
    // function testList(list: (FileSystemEntry | FileSystemFileEntry)[] | (FileSystemEntry | File)[], listName: string) {
    //     if (DEBUG) console.log("====================================")
    //     if (DEBUG) console.log(`Testing list ${listName}`);
    //     if (DEBUG) console.log(list);
    //     if (list.length > 0) {
    //         if (DEBUG) console.log("has length:");
    //         if (DEBUG) console.log(list.length);
    //         try {
    //             if (DEBUG) console.log(`First item: ${list[0]}`);
    //             if (DEBUG) console.log('Testing to read contents of first item...');
    //             let fileToTest = list[0];
    //             const reader = new FileReader();
    //             reader.readAsText(fileToTest as File);
    //             reader.onload = (e) => {
    //                 if (e.target === null) {
    //                     if (DEBUG) console.log('e.target is null');
    //                 } else {
    //                     if (DEBUG) console.log(`First item read successfully`);
    //                 }
    //             };
    //         } catch (e) {
    //             console.log(`Error reading from list ${list}: ${e}`);
    //         }
    //     }
    // }
    //#endregion DEBUG/DEBUG2 SUPPORT FUNCTIONS
    //#region UI HOOKS ****************************************************************************************************
    //
    // Here's roughly how you would hook up from an HTML page to this code.
    // It will handle clicks and drops, both "file" and "directory" zones.
    //
    // "handleEvent()" handles all such events. It will call
    // scanItemList() and scanFileList() on all the data, then
    // the above "afteOperation()"
    // const fileDropZone = document.getElementById('fileDropZone');
    // const directoryDropZone = document.getElementById('directoryDropZone');
    // SBFileHelperReady.then(() => {
    //     fileDropZone.addEventListener('drop', SBFileHelper.handleFileDrop);
    //     directoryDropZone.addEventListener('drop', SBFileHelper.handleDirectoryDrop);
    //     fileDropZone.addEventListener('click', SBFileHelper.handleFileClick);
    //     directoryDropZone.addEventListener('click', SBFileHelper.handleDirectoryClick);
    // }
    function handleFileDrop(event, callback) {
        event.preventDefault();
        return handleEvent(event, callback, "[file drop]");
    }
    SBFileHelperDemo.handleFileDrop = handleFileDrop;
    function handleDirectoryDrop(event, callback) {
        event.preventDefault();
        return handleEvent(event, callback, "[directory drop]");
    }
    SBFileHelperDemo.handleDirectoryDrop = handleDirectoryDrop;
    function handleFileClick(event, callback) {
        event.preventDefault();
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.accept = '*/*';
        fileInput.addEventListener('change', (event) => {
            handleEvent(event, callback, "[file click]");
        });
        fileInput.click();
    }
    SBFileHelperDemo.handleFileClick = handleFileClick;
    function handleDirectoryClick(event, callback) {
        event.preventDefault();
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.webkitdirectory = true;
        fileInput.accept = '*/*';
        fileInput.addEventListener('change', (event) => {
            handleEvent(event, callback, "[directory click]");
        });
        fileInput.click();
    }
    SBFileHelperDemo.handleDirectoryClick = handleDirectoryClick;
    // this gets both input type=file and drag and drop
    async function handleEvent(event, callback, _context) {
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
            console.w("Unknown event type (should not happen):");
            console.log(event);
            return;
        }
        if (DEBUG3) {
            console.log("Received items (DataTransferItemList):");
            console.log(items);
            console.log("Received files:");
            console.log(files);
        }
        scanItemList(items);
        scanFileList(files);
        afterOperation(callback);
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
})(SBFileHelperDemo || (SBFileHelperDemo = {}));
(function (global) {
    global.SBFileHelperDemo = SBFileHelperDemo;
}(this));
//#endregion
//#region ARCHIVE  ****************************************************************************************************
//********************************************************************************
// ******  Not Used - Archive ********
//     // this is an older function, it reads a simple list of files and uploads them
//     // it's commented out, but should be functional
//     function readFilesIntoBuffers(files: (File | FileSystemEntry | FileSystemFileEntry)[]): Promise<SBPayload> {
//         const fileBuffers: Array<[string, ArrayBuffer]> = [];
//         const promises: Promise<void>[] = [];
//         // add a set to track which file names are duplicates
//         const fileNames = new Set<string>();
//         files.forEach((file) => {
//             let entry: FileSystemFileEntry | undefined = undefined;
//             if (file instanceof File) {
//                 entry = undefined;
//             } else if (file.isFile) {
//                 entry = file as FileSystemFileEntry;
//             } else if (file.isDirectory) {
//                 console.warn(`**** Skipping directory ${file.name}`);
//             } else {
//                 console.warn(`**** Unknown file type ${file}`);
//             }
//             if (entry) {
//                 if (fileNames.has(entry.name)) {
//                     console.info(`**** Skipping duplicate file ${entry.name}`);
//                 } else {
//                     fileNames.add(entry.name);
//                     if (DEBUG) { console.log("Entry: " + entry.name); console.log(entry); }
//                     promises.push(new Promise<void>((resolve, reject) => {
//                         const fileReader = new FileReader();
//                         fileReader.onload = () => {
//                             fileBuffers.push([file.name, fileReader.result as ArrayBuffer]);
//                             resolve();
//                         };
//                         fileReader.onerror = reject;
//                         if (entry) {
//                             entry.file((fileObject) => {
//                                 fileReader.readAsArrayBuffer(fileObject);
//                             }, reject);
//                         } else {
//                             fileReader.readAsArrayBuffer(file as File);
//                         }
//                     }));
//                 }
//             } else {
//                 console.warn(`**** Skipping file (cannot convert to 'entry') ${file.name}`);
//                 console.log(file);
//             }
//         });
//         if (DEBUG) console.log("List of file read promises: " + promises.length);
//         if (DEBUG) console.log(promises);
//         return Promise.all(promises).then(() => {
//             const payload: SBPayload = {};
//             fileBuffers.forEach(([fileName, buffer]) => {
//                 payload[fileName] = buffer;
//             });
//             return payload;
//         });
//         // return Promise.all(promises).then(() => fileBuffers);
//     }
//     // this is an older function, it's commented out but should be working
//     function uploadListOfFiles(myChannelId: SBChannelId,
//         useThisList: (FileSystemEntry | FileSystemFileEntry)[] | (FileSystemEntry | File)[],
//         callback: (res: SBObjectHandle) => void) {
//         readFilesIntoBuffers(useThisList).then((d) => {
//             console.log("Read files into buffers (this should be a list of file names and buffers):");
//             console.log(d);
//             let payload = localSB.assemblePayload(d);
//             console.log("This should be payload:")
//             console.log(payload);
//             if (payload) {
//                 uploadBuffer(myChannelId, payload, "PAYLOAD").then((res) => {
//                     console.log("uploadBuffer() returned: ")
//                     console.log(res);
//                     if (callback) callback(res)
//                 })
//             }
//         });
//     }
// TODO ... these are probably not used anymore ...
// these are file NAMES
// let fileListItem0: Array<string> = [];
// let fileListFile1: Array<string> = [];
// let fileListFile2a: Array<string> = [];
// let fileListFile2b: Array<string> = [];
// NO LONGER USED
// let fileListBest: Array<string> = []; // | Array<File> | Array<FileSystemFileEntry> = [];
// these are file ENTRIES
// let fileListItem0_Files: Array<FileSystemEntry | FileSystemFileEntry> = [];
// let fileListFile1_Files: Array<File | FileSystemEntry> = [];
// let fileListFile2a_Files: Array<File> = [];
// let fileListFile2b_Files: Array<File> = [];
// let fileListBest_Files: Array<File> | Array<FileSystemEntry | FileSystemFileEntry> = [];
// function uploadFiles(myChannelId: SBChannelId, callback: (res: SBObjectHandle) => void) {
//     if (!myChannelId) {
//         console.error("No channel ID provided");
//         return;
//     }
//     // testList(fileListItem0_Files, 'fileListItem0_Files');
//     // testList(fileListFile1_Files, 'fileListFile1_Files');
//     // testList(fileListFile2a_Files, 'fileListFile2a_Files');
//     // testList(fileListFile2b_Files, 'fileListFile2b_Files');
//     // console.log("====================================")
//     if (DEBUG) console.log("Uploading files...");
//     let useThisList = [];
//     if (fileListFile1_Files.length > 0) {
//         if (DEBUG) console.log("Using fileListFile1_Files for upload");
//         useThisList = fileListFile1_Files;
//     } else if (fileListFile2a_Files.length > 0) {
//         if (DEBUG) console.log("Using fileListFile2a_Files for upload");
//         useThisList = fileListFile2a_Files;
//     } else if (fileListFile2b_Files.length > 0) {
//         if (DEBUG) console.log("Using fileListFile2b_Files for upload");
//         useThisList = fileListFile2b_Files;
//     } else if (fileListItem0_Files.length > 0) {
//         if (DEBUG) console.log("Using fileListItem0_Files for upload");
//         useThisList = fileListItem0_Files;
//     } else {
//         console.error("No usable file lists to upload")
//         return;
//     }
//     if (DEBUG) console.log("Use this list is:")
//     if (DEBUG) console.log(useThisList);
//     uploadListOfFiles(myChannelId, useThisList, callback);
// };
// (window as any).uploadFiles = uploadFiles;
// function afterOperation() {
//     setTimeout(() => {
// ... code below used to be in afterOperation() ...
// queueMicrotask(() => {
//     listing.innerHTML = [...globalFileMap.keys()].sort().map((f) => "<li>" + f + "</li>\n").join('')
// });
// if (DEBUG) {
//     // give things a bit of time to settle
//     setTimeout(() => {
//         // some promises might take a bit longer
//         // listing.innerHTML = [...globalFileMap.keys()].sort().map((f) => "<li>" + f + "</li>\n").join('')
//         // just for info
//         if (DEBUG) {
//         console.log("++++ Phase 0: This is the global file map with all the info (note: order of insertion)")
//         console.log(globalFileMap);
//         }
//         if (DEBUG) console.log("++++ Phase 1: SKIPPING ... no longer used")
//         // if (DEBUG) {
//         //     console.log("++++ Phase 1: pick best LIST in this order of preference: Item0, File1, File2a, File2b")
//         //     if (fileListItem0_Files.length > 0) {
//         //         console.log("Item0:");
//         //         console.log(fileListItem0_Files);
//         //     } else {
//         //         console.log("fileListItem0_Files: empty")
//         //     }
//         //     if (fileListFile1_Files.length > 0) {
//         //         console.log("File1:");
//         //         console.log(fileListFile1_Files);
//         //     } else {
//         //         console.log("fileListFile1_Files: empty")
//         //     }
//         //     if (fileListFile2a_Files.length > 0) {
//         //         console.log("File2a (variant 0):");
//         //         console.log(fileListFile2a_Files);
//         //     } else {
//         //         console.log("fileListFile2a_Files: empty")
//         //     }
//         //     if (fileListFile2b_Files.length > 0) {
//         //         console.log("File2b (variant 1):");
//         //         console.log(fileListFile2b_Files);
//         //     } else {
//         //         console.log("fileListFile2b_Files: empty")
//         //     }
//         // }
//         // // trial and error we've determined which subset is coherent in what order
//         // if (fileListItem0.length > 0) {
//         //     if (DEBUG) console.log(".... picking Item0")
//         //     fileListBest = fileListItem0;
//         // } else if (fileListFile1.length > 0) {
//         //     if (DEBUG) console.log(".... picking File1")
//         //     fileListBest = fileListFile1;
//         // } else if (fileListFile2a.length > 0) {
//         //     if (DEBUG) console.log(".... picking File2a")
//         //     fileListBest = fileListFile2a;
//         // } else if (fileListFile2b.length > 0) {
//         //     if (DEBUG) console.log(".... picking File2b")
//         //     fileListBest = fileListFile2b;
//         // } else {
//         //     fileListBest = [];
//         //     console.error("**** Phase 1 failed to find a coherent list of file names ****");
//         // }
//         // if (DEBUG) {
//         //     console.log(".... ergo, 'fileListBest' is set to:")
//         //     console.log(fileListBest)
//         //     // console.log(".... details:")
//         //     // for (const str of fileListBest)
//         //     //     console.log(str)
//         // }
//         // // const list = document.createElement("ul");
//         // // fileListBest.forEach((item) => {
//         // //     const li = document.createElement("li");
//         // //     li.textContent = item;
//         // //     list.appendChild(li);
//         // // });
//         if (DEBUG) console.log("++++ Phase 2: pick best FILE DESCRIPTORS in this order of preference: Item0, File2a, File2b")
//         if (fileListItem0.length > 0) {
//             if (DEBUG) console.log(".... picking Item0")
//             fileListBest_Files = fileListItem0_Files;
//         } else if (fileListFile2a.length > 0) {
//             if (DEBUG) console.log(".... picking File2a")
//             fileListBest_Files = fileListFile2a_Files;
//         } else if (fileListFile2b.length > 0) {
//             if (DEBUG) console.log(".... picking File2b")
//             fileListBest_Files = fileListFile2b_Files;
//         } else {
//             fileListBest_Files = [];
//             console.error("**** Phase 2 failed to find a coherent list of file descriptors ****");
//         }
//         if (DEBUG) {
//             console.log(".... ergo, 'fileListBest_Files' is set to:");
//             console.log(fileListBest_Files);
//         }
//         // document.get ElementBy Id("listing")!.appendChild(list);
//     }, 20);
// }
// setTimeout(() => {
//     // some promises might take a bit longer
//     listing.innerHTML = [...globalFileMap.keys()].sort().map((f) => "<li>" + f + "</li>\n").join('')
// }, 500);
// // similar to above, but tries to read the file as a blob
// function tryToRead(file: File | FileSystemEntry | FileSystemFileEntry): Promise<ArrayBuffer> {
//     return new Promise((resolve, reject) => {
//         try {
//             const reader = new FileReader();
//             reader.readAsArrayBuffer(file as File);
//             reader.onload = (e) => {
//                 if (e.target === null) {
//                     reject('**** e.target is null ****');
//                 } else {
//                     resolve(e.target.result as ArrayBuffer);
//                 }
//             }
//             reader.onerror = (e) => {
//                 reject(e);
//             }
//         } catch (error) {
//             try {
//                 if ((file as any).file) {
//                     (file as any).file((file: File) => {
//                         const reader = new FileReader();
//                         reader.readAsArrayBuffer(file as File);
//                         reader.onload = (e) => {
//                             if (e.target === null) {
//                                 reject('**** e.target is null ****');
//                             } else {
//                                 if (DEBUG) console.log(`[tryToRead] (using file()) successfully read file ${file.name}`);
//                                 resolve(e.target.result as ArrayBuffer);
//                             }
//                         }
//                         reader.onerror = (e) => {
//                             reject(e);
//                         }
//                     });
//                 }
//             } catch (error) {
//                 console.log(`[${location}] error reading file ${file.name}`);
//                 reject(error);
//             }
//         }
//     }
// }
//#endregion
//# sourceMappingURL=SBFileHelperDemoNS.js.map