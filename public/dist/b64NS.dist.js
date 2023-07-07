// TS Namespace version of b64.ts
// (that's the ONLY thing that should differ)
var b64;
(function (b64_1) {
    const b64lookup = [], urlLookup = [], revLookup = [];
    const CODE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const CODE_B64 = CODE + '+/', CODE_URL = CODE + '-_', PAD = '=';
    for (let i = 0, len = CODE_B64.length; i < len; ++i) {
        b64lookup[i] = CODE_B64[i];
        urlLookup[i] = CODE_URL[i];
        revLookup[CODE_B64.charCodeAt(i)] = i;
    }
    revLookup['-'.charCodeAt(0)] = 62; // minus
    revLookup['_'.charCodeAt(0)] = 63; // underscore
    function getLens(b64) {
        const len = b64.length;
        let validLen = b64.indexOf(PAD);
        if (validLen === -1)
            validLen = len;
        const placeHoldersLen = validLen === len ? 0 : 4 - (validLen % 4);
        return [validLen, placeHoldersLen];
    }
    function base64ToArrayBuffer(str) {
        switch (str.length % 4) {
            case 2:
                str += '==';
                break;
            case 3:
                str += '=';
                break;
        }
        const [validLen, placeHoldersLen] = getLens(str);
        const arr = new Uint8Array(((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen);
        let tmp = 0, curByte = 0, i = 0;
        const len = placeHoldersLen > 0 ? validLen - 4 : validLen;
        for (i = 0; i < len; i += 4) {
            const r0 = revLookup[str.charCodeAt(i)];
            const r1 = revLookup[str.charCodeAt(i + 1)];
            const r2 = revLookup[str.charCodeAt(i + 2)];
            const r3 = revLookup[str.charCodeAt(i + 3)];
            tmp = (r0 << 18) | (r1 << 12) | (r2 << 6) | (r3);
            arr[curByte++] = (tmp >> 16) & 0xff;
            arr[curByte++] = (tmp >> 8) & 0xff;
            arr[curByte++] = (tmp) & 0xff;
        }
        if (placeHoldersLen === 2) {
            const r0 = revLookup[str.charCodeAt(i)];
            const r1 = revLookup[str.charCodeAt(i + 1)];
            tmp = (r0 << 2) | (r1 >> 4);
            arr[curByte++] = tmp & 0xff;
        }
        if (placeHoldersLen === 1) {
            const r0 = revLookup[str.charCodeAt(i)];
            const r1 = revLookup[str.charCodeAt(i + 1)];
            const r2 = revLookup[str.charCodeAt(i + 2)];
            tmp = (r0 << 10) | (r1 << 4) | (r2 >> 2);
            arr[curByte++] = (tmp >> 8) & 0xff;
            arr[curByte++] = tmp & 0xff;
        }
        return arr;
    }
    b64_1.base64ToArrayBuffer = base64ToArrayBuffer;
    const MAX_CHUNK_LENGTH = 16383; // must be multiple of 3
    function tripletToBase64(lookup, num) {
        return (lookup[num >> 18 & 0x3f] +
            lookup[num >> 12 & 0x3f] +
            lookup[num >> 6 & 0x3f] +
            lookup[num & 0x3f]);
    }
    function encodeChunk(lookup, view, start, end) {
        let tmp;
        const output = new Array((end - start) / 3);
        for (let i = start, j = 0; i < end; i += 3, j++) {
            tmp =
                ((view.getUint8(i) << 16) & 0xff0000) +
                    ((view.getUint8(i + 1) << 8) & 0x00ff00) +
                    (view.getUint8(i + 2) & 0x0000ff);
            output[j] = tripletToBase64(lookup, tmp);
        }
        return output.join('');
    }
    const bs2dv = (bs) => bs instanceof ArrayBuffer
        ? new DataView(bs)
        : new DataView(bs.buffer, bs.byteOffset, bs.byteLength);
    function arrayBufferToBase64(buffer, variant = 'url') {
        if (buffer == null)
            throw new Error('arrayBufferToBase64() -> null paramater');
        const view = bs2dv(buffer);
        const len = view.byteLength;
        const extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
        const len2 = len - extraBytes;
        const parts = new Array(Math.floor(len2 / MAX_CHUNK_LENGTH) + Math.sign(extraBytes));
        const lookup = variant == 'url' ? urlLookup : b64lookup; // defaults to url-safe except when overriden
        const pad = '';
        let j = 0;
        for (let i = 0; i < len2; i += MAX_CHUNK_LENGTH) {
            parts[j++] = encodeChunk(lookup, view, i, (i + MAX_CHUNK_LENGTH) > len2 ? len2 : (i + MAX_CHUNK_LENGTH));
        }
        if (extraBytes === 1) {
            const tmp = view.getUint8(len - 1);
            parts[j] = (lookup[tmp >> 2] +
                lookup[(tmp << 4) & 0x3f] +
                pad + pad);
        }
        else if (extraBytes === 2) {
            const tmp = (view.getUint8(len - 2) << 8) + view.getUint8(len - 1);
            parts[j] = (lookup[tmp >> 10] +
                lookup[(tmp >> 4) & 0x3f] +
                lookup[(tmp << 2) & 0x3f] +
                pad);
        }
        return parts.join('');
    }
    b64_1.arrayBufferToBase64 = arrayBufferToBase64;
    function hello() {
        console.log('hello from b64NS.ts');
    }
    b64_1.hello = hello;
})(b64 || (b64 = {}));
// Expose the namespace as a global variable in the UMD pattern
(function (global) {
    global.b64 = b64;
}(this));
// export { b64 };
//# sourceMappingURL=b64NS.js.map