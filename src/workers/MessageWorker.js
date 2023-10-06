/* eslint-disable */

export default () => {
    console.log(`starting message worker`);
    let readyResolver;
    const IndexedKVReadyFlag = new Promise((resolve) => {
        readyResolver = resolve;
    });
    let db;
    let options = {
        db: 'sb_messages',
        table: 'messages'
    }
    let openReq = self.indexedDB.open(options.db);

    openReq.addEventListener('error', (e) => {
        console.error("Database error: " + e);
        throw new Error("Database error: " + e);
    });
    openReq.addEventListener('success', (e) => {
        db = e.target.result;
        console.log('success')
        if (typeof readyResolver !== 'undefined') {
            readyResolver(true);
        }
    });
    openReq.addEventListener('upgradeneeded', (e) => {
        db = e.target.result;
        db.createObjectStore(options.table, { keyPath: "key" });
        console.log('upgradeneeded')

    });

    function openCursor(regex, callback) {
        return new Promise((resolve, reject) => {

            IndexedKVReadyFlag.then(() => {
                if (db) {
                    const transaction = db.transaction([options.table], "readonly");
                    const objectStore = transaction.objectStore(options.table);
                    const request = objectStore.openCursor(null, 'next');
                    let returnArray = [];
                    request.onsuccess = function () {
                        const cursor = request.result;
                        if (cursor) {
                            if (String(cursor.key).match(regex)) {
                                returnArray.push({ value: cursor.value.value, key: cursor.value.key });
                            }
                            cursor.continue();
                        }
                        else {
                            if (callback) {
                                callback(returnArray);
                            }
                            resolve(returnArray);
                        }
                    };
                }
                else {
                    reject('DB is not defined');
                }
            })
        });
    }

    function add(key, value) {
        return new Promise((resolve, reject) => {
            IndexedKVReadyFlag.then(() => {
                if (db) {
                    const transaction = db.transaction([options.table], "readwrite")
                    const objectStore = transaction.objectStore(options.table);
                    const request = objectStore.get(key);
                    request.onerror = event => {
                        reject(event);
                    };
                    request.onsuccess = () => {
                        const data = request.result;
                        if (data?.value) {
                            //Data exists we update the value
                            data.value = value;
                            try {
                                const requestUpdate = objectStore.put(data);
                                requestUpdate.onerror = event => {
                                    reject(event);
                                };
                                requestUpdate.onsuccess = (event) => {
                                    resolve(requestUpdate.result);
                                };
                            } catch (e) {
                                console.error(e);
                            }
                        }
                        else {
                            const requestAdd = objectStore.add({ key: key, value: value });
                            requestAdd.onsuccess = () => {
                                resolve(requestAdd.result);
                            };
                            requestAdd.onerror = event => {
                                console.error(event);
                                reject(event);
                            };
                        }
                    };
                }
                else {
                    reject(new Error('db is not defined'));
                }
            });
        });
    }

    function getDateTimeFromTimestampPrefix(prefix) {


        const binaryTimestamp = prefix;
        const decimalTimestamp = parseInt(binaryTimestamp, 2);

        const datetime = new Date(decimalTimestamp);
        const year = datetime.getFullYear();
        const month = datetime.getMonth() + 1; // Adding 1 because months are zero-based (January is 0)
        const day = datetime.getDate();
        const hours = datetime.getHours();
        const minutes = datetime.getMinutes();
        const seconds = datetime.getSeconds();
        const millisecondsOutput = datetime.getMilliseconds();

        // Format the datetime components into a string
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${millisecondsOutput.toString().padStart(3, '0')}`;

    }

    let level = process.env.NODE_ENV;
    if (level === 'development') {
    }
    if (level === 'stage') {
        console.log = function () { }
        console.assert = function () { }
        console.count = function () { }
        console.debug = function () { }
        console.dir = function () { }
        console.dirxml = function () { }
        console.group = function () { }
        console.table = function () { }
        console.tine = function () { }
        console.timeEnd = function () { }
        console.timeLog = function () { }
        console.trace = function () { }
    }
    if (level === 'production') {
        console.log = function () { }
        console.warn = function () { }
        console.assert = function () { }
        console.count = function () { }
        console.debug = function () { }
        console.dir = function () { }
        console.dirxml = function () { }
        console.group = function () { }
        console.table = function () { }
        console.tine = function () { }
        console.timeEnd = function () { }
        console.timeLog = function () { }
        console.trace = function () { }
    }

    self.onerror = (e) => {
        console.log('Message Worker: Error: ', e);
        postMessage({ error: e, status: 'error', data: { message: e.message }, method: 'onerror' });

    }

    self.onunhandledrejection = (e) => {
        console.log('Message Worker: Unhandled Rejection: ', e);
        postMessage({ error: e, status: 'error', data: { message: e.message }, method: 'unhandledrejection' });
    }

    function mergeMessages(existing, received) {
        let merged = [];
        for (let i = 0; i < existing.length + received.length; i++) {
            if (received.find(itmInner => itmInner._id === existing[i]?._id)) {
                merged.push({
                    ...existing[i],
                    ...received.find(itmInner => itmInner._id === existing[i]?._id)
                });
            } else {
                if (received[i]) {
                    merged.push(received[i]);
                }
            }
        }
        return merged.sort((a, b) => a._id > b._id ? 1 : -1);
    };

    const getMessages = (channel_id) => {
        try {
            let _messageValues = [];
            openCursor(new RegExp(`^${channel_id}`)).then((messages) => {
                for (let i = 0; i < messages.length; i++) {
                    _messageValues.push(messages[i].value);
                }
                postMessage({ error: false, status: 'ok', data: mergeMessages([], _messageValues), method: 'getMessages' });
            })
        } catch (e) {
            throw new Error(`Message Worker: Error(getMessages(${channel_id}) ): ${e.message}`)
        }
    }

    const addMessage = (message, args) => {
        try {
            message.createdAt = getDateTimeFromTimestampPrefix(message.timestampPrefix);
            add(message._id, message)
            postMessage({ error: false, status: 'ok', data: message, method: 'addMessage', args: args });
        } catch (e) {
            throw new Error(`Message Worker: Error(addMessage() ): ${e.message}`)
        }
    }


    self.onmessage = (msg) => {
        const digest = msg.data
        switch (digest.method) {
            case 'getMessages':
                console.log('getMessages', digest.channel_id)
                getMessages(digest.channel_id);
                break;
            case 'addMessage':
                addMessage(digest.message, digest.args);
                break;
            default:
                throw new Error(`No such message worker method (${digest.method})`);
        }

    }
}