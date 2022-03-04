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
  }
  catch (e) {
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
  }
  catch (e) {
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
  }
  catch (e) {
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
  }
  catch (e) {
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
