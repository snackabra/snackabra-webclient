// ##########################   FUNCTIONS TO HANDLE ANY AND ALL CRYPTO  ####################################


import * as utils from "./utils";

export function extractPubKey(privateKey) {
  try {
    let pubKey = { ...privateKey }
    delete pubKey.d;
    delete pubKey.dp;
    delete pubKey.dq;
    delete pubKey.q;
    delete pubKey.qi;
    pubKey.key_ops = []
    return pubKey;
  } catch (e) {
    console.log(e);
    return {};
  }
}


export async function generateKeys() {
  try {
    let keyPair = await window.crypto.subtle.generateKey(
      {
        name: "ECDH",
        namedCurve: "P-384"
      },
      true,
      ["deriveKey"]
    );

    return keyPair;
  }
  catch (e) {
    console.log(e);
    return { error: 'Failed to generate keys' }
  }
}


export async function importKey(format, key, type, extractable, keyUsages) {

  const keyAlgorithms = {
    ECDH: {
      name: "ECDH",
      namedCurve: "P-384"
    },
    AES: {
      name: "AES-GCM"
    },
    PBKDF2: "PBKDF2"
  }
  let _key;
  try {
    _key = await crypto.subtle.importKey(
      format,
      key,
      keyAlgorithms[type],
      extractable,
      keyUsages
    );
  } catch (error) {
    _key = { error: error };
  }
  return _key;
}


export async function deriveKey(privateKey, publicKey, type, extractable, keyUsages) {
  const keyAlgorithms = {
    AES: {
      name: "AES-GCM",
      length: 256
    },
    HMAC: {
      name: "HMAC",
      hash: "SHA-256",
      length: 256
    }
  }
  try {
    return await window.crypto.subtle.deriveKey(
      {
        name: "ECDH",
        public: publicKey
      },
      privateKey,
      keyAlgorithms[type],
      extractable,
      keyUsages
    );
  } catch (error) {
    console.log(error);
    return { error: "Could not derive keys" }
  }
}


export async function getImageKey(imageHash, _salt) {

  try {
    let keyMaterial = await importKey("raw", utils.base64ToArrayBuffer(decodeURIComponent(imageHash)), "PBKDF2", false, ["deriveBits", "deriveKey"]);

    // TODO - Support deriving from PBKDF2 in deriveKey function
    let key = await window.crypto.subtle.deriveKey(
      {
        "name": "PBKDF2",
        // salt: window.crypto.getRandomValues(new Uint8Array(16)),
        salt: _salt,
        "iterations": 100000, // small is fine, we want it snappy
        "hash": "SHA-256"
      },
      keyMaterial,
      { "name": "AES-GCM", "length": 256 },
      true,
      ["encrypt", "decrypt"]
    );
    // return key;
    return key;
  }
  catch (e) {
    console.log(e);
    return { error: e };
  }
}


export async function encrypt(contents, secret_key = null, outputType = "string", _iv = null) {
  try {
    if (contents === null) {
      return;
    }
    const iv = _iv === null ? window.crypto.getRandomValues(new Uint8Array(12)) : _iv;
    const algorithm = {
      name: "AES-GCM",
      iv: iv
    };
    let key = secret_key;
    let data = contents;
    const encoder = new TextEncoder();
    if (typeof contents === 'string') {
      data = encoder.encode(contents);
    }

    let encrypted;
    try {
      encrypted = await window.crypto.subtle.encrypt(algorithm, key, data);
    } catch (error) {
      console.log(error);
      return { error: "Encryption failed" }
    }
    return (outputType === 'string') ? { content: encodeURIComponent(utils.arrayBufferToBase64(encrypted)), iv: encodeURIComponent(utils.arrayBufferToBase64(iv)) } : { content: encrypted, iv: iv };
  } catch (e) {
    console.log(e);
    return { error: e };
  }
}


export async function decrypt(secretKey, contents, outputType = "string") {
  try {
    const ciphertext = typeof contents.content === 'string' ? utils.base64ToArrayBuffer(decodeURIComponent(contents.content)) : contents.content;
    const iv = typeof contents.iv === 'string' ? utils.base64ToArrayBuffer(decodeURIComponent(contents.iv)) : contents.iv;
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


export async function sign(secretKey, contents) {
  try {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(contents);
    let sign;
    try {
      sign = await window.crypto.subtle.sign(
        'HMAC',
        secretKey,
        encoded
      );
      return encodeURIComponent(utils.arrayBufferToBase64(sign));
    } catch (error) {
      console.log(error);
      return { error: "Failed to sign content" };
    }
  } catch (error) {
    console.log(error);
    return { error: error };
  }
}


export async function verify(secretKey, sign, contents) {
  try {
    const _sign = utils.base64ToArrayBuffer(decodeURIComponent(sign));
    const encoder = new TextEncoder();
    const encoded = encoder.encode(contents);
    try {
      let verified = await window.crypto.subtle.verify(
        'HMAC',
        secretKey,
        _sign,
        encoded
      );
      return verified;
    } catch (e) {
      return false;
    }
  } catch (e) {
    console.log(e);
    return false
  }
}


export function areKeysSame(key1, key2) {
  if (key1 != null && key2 != null && typeof key1 === 'object' && typeof key2 === 'object') {
    return key1['x'] === key2['x'] && key1['y'] === key2['y'];
  }
  return false;
}
