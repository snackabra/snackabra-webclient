/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

/* snackabra-webclient/src/utils/utils.js */

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

function extractPayloadV1(payload) {
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


export function arrayBufferToBase64(buffer) {
  try {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  } catch (e) {
    console.log(e);
    return { error: e };
  }
}


export function base64ToArrayBuffer(base64) {
  try {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (e) {
    console.log(e);
    return { error: e };
  }
}

export function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

export function partition(str, n) {
  var returnArr = [];
  var i, l;
  for (i = 0, l = str.length; i < l; i += n) {
    returnArr.push(str.substr(i, n));
  }
  return returnArr;
};

export function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

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
  try {
    const ciphertext = typeof contents.content === 'string' ? base64ToArrayBuffer(decodeURIComponent(contents.content)) : contents.content;
    const iv = typeof contents.iv === 'string' ? base64ToArrayBuffer(decodeURIComponent(contents.iv)) : contents.iv;
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
    // console.log(e);
    return { error: true, plaintext: "(whispered)" };
  }
}
