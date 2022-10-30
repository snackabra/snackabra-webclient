/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

/* snackabra-webclient/src/utils/utils.js */

/* NOTE: most of these are migrating to snackabra.ts */

// function assemblePayloadV1(data) {
//   try {
//     let metadata = {}
//     for (const key in data) {
//       metadata[key] = data[key].byteLength;
//     }
//     let encoder = new TextEncoder();
//     const metadataBuffer = encoder.encode(JSON.stringify(metadata));
//     const metadataSize = new Uint32Array([metadataBuffer.byteLength]);
//     let payload = _appendBuffer(metadataSize.buffer, metadataBuffer);
//     for (const key in data) {
//       payload = _appendBuffer(payload, data[key]);
//     }
//     return payload;
//   } catch (e) {
//     console.log(e);
//     return {};
//   }
// }


import config from "../config";

export function extractPayloadV1(payload) {
  try {
    const metadataSize = new Uint32Array(payload.slice(0, 4))[0];
    const decoder = new TextDecoder();
    const metadata = JSON.parse(decoder.decode(payload.slice(4, 4 + metadataSize)));
    let startIndex = 4 + metadataSize;
    let data = {};
    for (const key in metadata) {
      data[key] = payload.slice(startIndex, startIndex + metadata[key]);
      startIndex += metadata[key];
    }
    return data;
  } catch (e) {
    console.log(e);
    return {};
  }
}


export function _appendBuffer(buffer1, buffer2) {
  try {
    var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
  } catch (e) {
    console.log(e);
    return {};
  }
};
/***********************************************************/
/***********************************************************/
/***********************************************************/
// KLUDGE: selectively copy-pasting from snackabra.js
/***********************************************************/
/***********************************************************/
/***********************************************************/

export function jsonParseWrapper(str, loc) {
  // psm: you can't have a return type in TS if the function
  //      might throw an exception
  try {
      return JSON.parse(str);
  }
  catch (error) {
      // sometimes it's an embedded string
      try {
          // This would be simple: 'return JSON.parse(eval(str));'
          // But eval() not safe. Instead we iteratively strip possible wrapping
          // single or double quotation marks. There are various cases where this
          // will not be enough, but we'll add "unwrapping" logic as we find
          // the examples.
          let s2 = '';
          let s3 = '';
          let str2 = str;
          while (str2 != (s3 = s2, s2 = str2, str2 = str2?.match(/^(['"])(.*)\1$/m)?.[2]))
              return JSON.parse(`'${s3}'`);
      }
      catch {
          // let's try one more thing
          try {
              return JSON.parse(str.slice(1, -1));
          }
          catch {
              // i am beginning to dislike TS .. ugh no simple way to get error message
              // see: https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript
              throw new Error(`JSON.parse() error at ${loc} (tried eval and slice)\nString was: ${str}`);
          }
      }
  }
}


// for later use - message ID formats
const messageIdRegex = /([A-Za-z0-9+/_\-=]{64})([01]{42})/;
// Strict b64 check:
// const b64_regex = new RegExp('^(?:[A-Za-z0-9+/_\-]{4})*(?:[A-Za-z0-9+/_\-]{2}==|[A-Za-z0-9+/_\-]{3}=)?$')
// But we will go (very) lenient:
const b64_regex = /^([A-Za-z0-9+/_\-=]*)$/;
// stricter - only accepts URI friendly:
const url_regex = /^([A-Za-z0-9_\-=]*)$/;
/**
 * Returns 'true' if (and only if) string is well-formed base64.
 * Works same on browsers and nodejs.
 */
function _assertBase64(base64) {
    // return (b64_regex.exec(base64)?.[0] === base64);
    const z = b64_regex.exec(base64);
    if (z)
        return (z[0] === base64);
    else
        return false;
}
// refactor helper - replace encodeURIComponent everywhere
function ensureSafe(base64) {
    const z = b64_regex.exec(base64);
    _sb_assert((z) && (z[0] === base64), 'ensureSafe() tripped: something is not URI safe');
    return base64;
}

/**
 * Standardized 'str2ab()' function, string to array buffer.
 * This assumes on byte per character.
 *
 * @param {string} string
 * @return {Uint8Array} buffer
 */
export function str2ab(string) {
  return new TextEncoder().encode(string);
}
/**
* Standardized 'ab2str()' function, array buffer to string.
* This assumes one byte per character.
*
* @param {Uint8Array} buffer
* @return {string} string
*/
export function ab2str(buffer) {
  return new TextDecoder('utf-8').decode(buffer);
}
/**
* based on https://github.com/qwtel/base64-encoding/blob/master/base64-js.ts
*/
const b64lookup = [];
const urlLookup = [];
const revLookup = [];
const CODE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const CODE_B64 = CODE + '+/';
const CODE_URL = CODE + '-_';
const PAD = '=';
const MAX_CHUNK_LENGTH = 16383; // must be multiple of 3
for (let i = 0, len = CODE_B64.length; i < len; ++i) {
  b64lookup[i] = CODE_B64[i];
  urlLookup[i] = CODE_URL[i];
  revLookup[CODE_B64.charCodeAt(i)] = i;
}
revLookup['-'.charCodeAt(0)] = 62; //
revLookup['_'.charCodeAt(0)] = 63;
function getLens(b64) {
  const len = b64.length;
  let validLen = b64.indexOf(PAD);
  if (validLen === -1)
      validLen = len;
  const placeHoldersLen = validLen === len ? 0 : 4 - (validLen % 4);
  return [validLen, placeHoldersLen];
}
function _byteLength(validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen;
}
/**
* Standardized 'atob()' function, e.g. takes the a Base64 encoded
* input and decodes it. Note: always returns Uint8Array.
* Accepts both regular Base64 and the URL-friendly variant,
* where `+` => `-`, `/` => `_`, and the padding character is omitted.
*
* @param {str} base64 string in either regular or URL-friendly representation.
* @return {Uint8Array} returns decoded binary result
*/
export function base64ToArrayBuffer(str) {
  if (!_assertBase64(str))
      throw new Error(`invalid character in string '${str}'`);
  let tmp;
  switch (str.length % 4) {
      case 2:
          str += '==';
          break;
      case 3:
          str += '=';
          break;
  }
  const [validLen, placeHoldersLen] = getLens(str);
  const arr = new Uint8Array(_byteLength(validLen, placeHoldersLen));
  let curByte = 0;
  const len = placeHoldersLen > 0 ? validLen - 4 : validLen;
  let i;
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
  
/**
* Standardized 'btoa()'-like function, e.g., takes a binary string
* ('b') and returns a Base64 encoded version ('a' used to be short
* for 'ascii').
*
* @param {bufferSource} ArrayBuffer buffer
* @return {string} base64 string
*/
export function arrayBufferToBase64(buffer) {
  if (buffer == null) {
      _sb_exception('L509', 'arrayBufferToBase64() -> null paramater');
      return '';
  }
  else {
      // const view = bs2dv(bufferSource)
      // const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      // console.log(buffer)
      // const view = new DataView(buffer)
      const view = bs2dv(buffer);
      const len = view.byteLength;
      const extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
      const len2 = len - extraBytes;
      const parts = new Array(Math.floor(len2 / MAX_CHUNK_LENGTH) + Math.sign(extraBytes));
      const lookup = urlLookup; // Note: yes this will break regular atob()
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
}

/***********************************************************/
/***********************************************************/
/***********************************************************/

// export function arrayBufferToBase64(buffer) {
//   try {
//     let binary = '';
//     const bytes = new Uint8Array(buffer);
//     const len = bytes.byteLength;
//     for (let i = 0; i < len; i++) {
//       binary += String.fromCharCode(bytes[i]);
//     }
//     return window.btoa(binary);
//   } catch (e) {
//     console.log(e);
//     return { error: e };
//   }
// }


// export function base64ToArrayBuffer(base64) {
//   try {
//     var binary_string = window.atob(base64);
//     var len = binary_string.length;
//     var bytes = new Uint8Array(len);
//     for (var i = 0; i < len; i++) {
//       bytes[i] = binary_string.charCodeAt(i);
//     }
//     return bytes.buffer;
//   } catch (e) {
//     console.log(e);
//     console.log("string was:")
//     console.log(base64)
//     return { error: e };
//   }
// }

// export function ab2str(buf) {
//   return String.fromCharCode.apply(null, new Uint8Array(buf));
// }

// export function str2ab(str) {
//   const buf = new ArrayBuffer(str.length);
//   const bufView = new Uint8Array(buf);
//   for (let i = 0, strLen = str.length; i < strLen; i++) {
//     bufView[i] = str.charCodeAt(i);
//   }
//   return buf;
// }

export function partition(str, n) {
  var returnArr = [];
  var i, l;
  for (i = 0, l = str.length; i < l; i += n) {
    returnArr.push(str.substr(i, n));
  }
  return returnArr;
};

export function assemblePayload(data) {
  try {
    let metadata = {}
    metadata["version"] = "002";
    let keyCount = 0;
    let startIndex = 0;
    for (const key in data) {
      keyCount++;
      metadata[keyCount.toString()] = { name: key, start: startIndex, size: data[key].byteLength };
      startIndex += data[key].byteLength;
    }
    let encoder = new TextEncoder();
    const metadataBuffer = encoder.encode(JSON.stringify(metadata));
    const metadataSize = new Uint32Array([metadataBuffer.byteLength]);
    let payload = _appendBuffer(metadataSize.buffer, metadataBuffer);
    for (const key in data) {
      payload = _appendBuffer(payload, data[key]);
    }
    return payload;
  } catch (e) {
    console.log(e);
    return {};
  }
}

export function extractPayload(payload) {
  try {
    console.log("extractPayload(): ")
    console.log(payload)
    const metadataSize = new Uint32Array(payload.slice(0, 4))[0];
    const decoder = new TextDecoder();
    console.log("METADATASIZE: ", metadataSize)
    console.log("METADATASTRING: ", decoder.decode(payload.slice(4, 4 + metadataSize)))
    const _metadata = JSON.parse(decoder.decode(payload.slice(4, 4 + metadataSize)));
    console.log("METADATA EXTRACTED", JSON.stringify(_metadata))
    let startIndex = 4 + metadataSize;
    if (!_metadata.hasOwnProperty("version")) {
      _metadata["version"] = "001";
    }
    console.log(_metadata["version"])
    switch (_metadata["version"]) {
      case "001":
        return extractPayloadV1(payload);
      case "002":
        let data = {};
        for (let i = 1; i < Object.keys(_metadata).length; i++) {
          let _index = i.toString();
          if (_metadata.hasOwnProperty(_index)) {
            let propertyStartIndex = _metadata[_index]["start"]
            console.log(propertyStartIndex);
            let size = _metadata[_index]["size"]
            data[_metadata[_index]["name"]] = payload.slice(startIndex + propertyStartIndex, startIndex + propertyStartIndex + size);
          }
        }
        return data;
      default:
        throw new Error('Unsupported payload version (' + _metadata["version"] + ') - fatal')
    }
  } catch (e) {
    // console.log("HIGH LEVEL ERROR", e.message);
    throw new Error('extractPayload() exception (' + e.message + ')')
  }
}

export function encodeB64Url(input) {
  return input.replaceAll('+', '-').replaceAll('/', '_');
}

export function decodeB64Url(input) {
  input = input.replaceAll('-', '+').replaceAll('_', '/');

  // Pad out with standard base64 required padding characters
  var pad = input.length % 4;
  if (pad) {
    if (pad === 1) {
      throw new Error('InvalidLengthError: Input base64url string is the wrong length to determine padding');
    }
    input += new Array(5 - pad).join('=');
  }

  return input;
}

export function importFile(key) {
  const keys = JSON.parse(key);

  // FIXME: Add validation for room JSON here
  importKeysToLS(keys);
}

export async function importKeysToLS(data) {
  try {
    let pem = false;
    if (data.hasOwnProperty("pem") && data["pem"] === true) {
      pem = true;
    }
    for (let room in data['roomData']) {
      for (let type in data['roomData'][room]) {
        if (type === 'key') {
          let key = data['roomData'][room][type]
          if (pem) {
            let cryptokey = await importPrivatePemKey(key);
            let jsonKey = await window.crypto.subtle.exportKey("jwk", cryptokey);
            key = JSON.stringify(jsonKey);
          }
          localStorage.setItem(room, key);
        } else {
          localStorage.setItem(room + '_' + type, data['roomData'][room][type]);
        }
      }
    }
    localStorage.setItem('rooms', JSON.stringify(data['roomMetadata']));
    localStorage.setItem('contacts', JSON.stringify(data['contacts']));
  } catch (e) {
    console.log(e);
  }
}

export async function importPrivatePemKey(pem) {
  // fetch the part of the PEM string between header and footer
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
  // base64 decode the string to get the binary data
  const binaryDerString = window.atob(pemContents);
  // convert from a binary string to an ArrayBuffer
  const binaryDer = str2ab(binaryDerString);

  return window.crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "ECDH",
      namedCurve: "P-384",
    },
    true,
    ["deriveKey"]
  );
}


export function downloadFile(text, file) {
  try {
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8, ' + encodeURIComponent(text));
    element.setAttribute('download', file);
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  } catch (error) {
    console.log(error);
  }
}


export async function downloadRoomData(roomId, rooms) {
  console.log("Fetching room data...")
  let fetchReq = await fetch(config.ROOM_SERVER + roomId + "/downloadData");
  let data = await fetchReq.arrayBuffer();
  console.log("Got data...");
  try {
    let dataString = new TextDecoder().decode(data);
    console.log("Got data string...")
    console.log("Will now process messages to find image ids");
    let dataJson = JSON.parse(dataString);
    let room_lockedKey_string = localStorage.getItem(roomId + "_lockedKey");
    let decKey_string = dataJson["encryptionKey"];
    let decKey = await crypto.subtle.importKey("jwk", JSON.parse(decKey_string), { name: "AES-GCM" }, false, ["decrypt"]);
    let room_lockedKey = null;
    if (room_lockedKey_string != null) {
      console.log("Found locked key in localstorage")
      room_lockedKey = await crypto.subtle.importKey("jwk", JSON.parse(room_lockedKey_string), { name: "AES-GCM" }, false, ["decrypt"]);
    }
    console.log("Imported decryption keys", decKey, room_lockedKey)
    let imageData = await getImageIds(dataJson, decKey, room_lockedKey);
    imageData["target"] = "s4.privacy.app";
    let imagedataString = JSON.stringify(imageData);
    const name = rooms[roomId]?.name ? rooms[roomId]?.name : 'Snackabra';
    downloadFile(imagedataString, name + "_storage.txt")
    downloadFile(dataString, name + "_data.txt");
  } catch (err) {
    console.log(err);
  }
}


export async function getImageIds(messages, decKey, lockedKey) {
  let unwrapped_messages = {}
  for (let id in messages) {
    try {
      let message = JSON.parse(messages[id]);
      if (message.hasOwnProperty("encrypted_contents")) {
        let _contents = message.encrypted_contents;
        // let _contents = JSON.parse(message.encrypted_contents);
        let msg = await decrypt(decKey, _contents)
        if (msg.error && lockedKey !== null) {
          msg = await decrypt(lockedKey, _contents)
        }
        // console.log(msg)
        const _json_msg = JSON.parse(msg.plaintext);
        // console.log(_json_msg)
        if (_json_msg.hasOwnProperty('control')) {
          console.log(_json_msg)
          unwrapped_messages[_json_msg["id"] + "." + (_json_msg.hasOwnProperty("type") ? _json_msg["type"] : "")] = _json_msg['verificationToken'];
        }
      }
    } catch (e) {
      // console.log(e);
      // Skip the message if decryption fails - its probably due to the user not having <roomId>_lockedKey.
    }
  }
  return unwrapped_messages;
}

export async function decrypt(secretKey, contents, outputType = "string") {
  let ciphertext, iv
  try {
    // const ciphertext = typeof contents.content === 'string' ? base64ToArrayBuffer(decodeURIComponent(contents.content)) : contents.content;
    ciphertext = typeof contents.content === 'string' ? base64ToArrayBuffer(contents.content) : contents.content;
    // const iv = typeof contents.iv === 'string' ? base64ToArrayBuffer(decodeURIComponent(contents.iv)) : contents.iv;
    // const iv = typeof contents.iv === 'string' ? base64ToArrayBuffer(contents.iv) : contents.iv;
    console.log(contents.iv)
    iv = typeof contents.iv === 'string'
      ? base64ToArrayBuffer(contents.iv)
      : new Uint8Array(Array.from(Object.values(contents.iv))); // sigh want snackabra.ts soon ...
    let decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      secretKey,
      ciphertext
    );
    if (outputType === "string") {
      return { error: false, plaintext: new TextDecoder().decode(decrypted) };
    }
    return { error: false, plaintext: decrypted };
  } catch (e) {
    console.log(`error in decrypt: ${e}`)
    console.dir(e);
    console.trace();
    console.log("iv:")
    console.log(iv)
    console.log("cipher:")
    console.log(ciphertext)
    console.log("secret key:");
    console.log(typeof secretKey);
    console.log(secretKey);
    console.log("contents:");
    console.log(contents);
    return { error: true, plaintext: `error in decrypt (utils): ${e}` };
  }
}

export function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

