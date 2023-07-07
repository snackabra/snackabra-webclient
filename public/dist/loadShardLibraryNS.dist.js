/* eslint-disable no-undef */
// import { b64 } from './b64NS.js';
// starting "v02" on 2023-04-22
// intention:
// - switch to async model
// - switch to pure b62 encoding only
// - direct support for "app loading"
var loadShardLibrary;
(function (loadShardLibrary) {
    function deCryptShard(data) {
        return new Promise((resolve, reject) => {
            crypto.subtle.importKey("raw", data.shardKey, "PBKDF2", false, ['deriveBits', 'deriveKey'])
                .then((keyMaterial) => {
                crypto.subtle.deriveKey({
                    'name': 'PBKDF2',
                    'salt': data.salt,
                    'iterations': 100000,
                    'hash': 'SHA-256'
                }, keyMaterial, { 'name': 'AES-GCM', 'length': 256 }, true, ['encrypt', 'decrypt'])
                    .then((key) => {
                    crypto.subtle.decrypt({ name: 'AES-GCM', iv: data.iv }, key, data.image)
                        .then((padded) => {
                        let actualSize = new DataView(padded.slice(-4)).getUint32(0);
                        resolve(padded.slice(0, actualSize));
                    }).catch(() => { reject('error decrypting shard'); });
                }).catch(() => { reject('unable to derive key'); });
            })
                .catch(() => { reject('unable to import key'); });
        });
    }
    loadShardLibrary.deCryptShard = deCryptShard;
    function processPayload(payload) {
        const metadataSize = new Uint32Array(payload.slice(0, 4))[0];
        const decoder = new TextDecoder();
        const _metadata = JSON.parse(decoder.decode(payload.slice(4, 4 + metadataSize)));
        const startIndex = 4 + metadataSize;
        const data = {};
        for (let i = 1; i < Object.keys(_metadata).length; i++) {
            const _index = i.toString();
            if (_metadata[_index]) {
                const propertyStartIndex = _metadata[_index]['start'];
                const size = _metadata[_index]['size'];
                const entry = _metadata[_index];
                data[entry['name']] = payload.slice(startIndex + propertyStartIndex, startIndex + propertyStartIndex + size);
            }
            else {
                console.log(`found nothing for index ${i}`);
            }
        }
        return data;
    }
    loadShardLibrary.processPayload = processPayload;
    function loadShard(shard) {
        return new Promise((resolve, reject) => {
            const shardServer = shard.shardServer ? shard.shardServer : 'https://shard.3.8.4.land'; // 'https://storage.384co.workers.dev'
            const codeShardFetch = `${shardServer}/api/v1/fetchData?id=${shard.id}&type=p&verification_token=${shard.verification}`;
            fetch(codeShardFetch)
                .then((res) => res.arrayBuffer())
                .then((payload) => {
                let data = processPayload(payload);
                data.shardKey = b64.base64ToArrayBuffer(shard.key);
                // data.shardKey = base62ToArrayBuffer32(shard.key)  // TODO: switch to b62
                deCryptShard(data).then((decrypted) => {
                    resolve(decrypted);
                }).catch(() => { reject('unable to decrypt'); });
            })
                .catch((err) => {
                if (`${err}`.match('"ror":"cann"'))
                    reject('shard not found');
                else
                    reject(`failed to fetch or process shard: ${err}`);
            });
        });
    }
    loadShardLibrary.loadShard = loadShard;
    function loadLibraryCode(shard) {
        return new Promise((resolve, reject) => {
            loadShard(shard)
                .then((decrypted) => {
                let jslibText = new TextDecoder("utf-8").decode(decrypted);
                const script = document.createElement('script');
                script.textContent = jslibText;
                document.head.append(script);
                console.log("'window.SB' object (library loaded) should be available in the console.");
                resolve();
            })
                .catch(() => { reject('unable to fetch shard'); });
        });
    }
    loadShardLibrary.loadLibraryCode = loadLibraryCode;
    const jsLib = (window.configuration && window.configuration.jslibShardHandle)
        ? window.configuration.jslibShardHandle
        : {
            "version": "1",
            "type": "p",
            "id": "fIyzdNScN7MCv58GS5tTmIJCFcR2g3j4qn6Otw8QqW4",
            "key": "uZAr9ozF92rhRijlFIci-Aobosh6yMGRVWjrB8osyRw",
            "actualSize": 40142,
            "verification": "48906636302226264130",
            "fileName": "snackabra.min.js",
            "dateAndTime": "2023-04-24T22:00:25.952Z",
            "fileType": "text/javascript",
            "lastModified": 1682373567992
        };
    console.log("++++ Using the following shard to load the library: ", jsLib);
    loadShardLibrary.SBReady = loadLibraryCode(jsLib);
})(loadShardLibrary || (loadShardLibrary = {}));
// Expose the namespace as a global variable in the UMD pattern
(function (global) {
    global.loadShardLibrary = loadShardLibrary;
    // SBReady is special
    global.SBReady = loadShardLibrary.SBReady;
}(this));
// export { loadShardLibrary };
//# sourceMappingURL=loadShardLibraryNS.js.map