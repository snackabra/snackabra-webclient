/* Copyright (c) 2020-2022 Magnusson Institute, All Rights Reserved */
/* Distributed under GPL-v03, see 'LICENSE' file for details */


import * as utils from "../utils";

export function SB_libraryVersion() {
  if (process.browser)
    return 'This is the BROWSER version of the library';
  else
    return 'This is the NODE.JS version of the library';
}


/**
 * @fileoverview Main file for snackabra javascript utilities.
 *               See https://snackabra.io for details.
 * @package
 */

/* TODO - list of modules that main.js can now fully support:
          (note: some MI-internal references)
   m042/src/scripts/components/FormSubmission.js
*/

// the below general exception handler can be improved so us to
// retain the error stack, per:
// https://stackoverflow.com/a/42755876
// class RethrownError extends Error {
//   constructor(message, error){
//     super(message)
//     this.name = this.constructor.name
//     if (!error) throw new Error('RethrownError requires a message and error')
//     this.original_error = error
//     this.stack_before_rethrow = this.stack
//     const message_lines =  (this.message.match(/\n/g)||[]).length + 1
//     this.stack = this.stack.split('\n').slice(0, message_lines+1).join('\n') + '\n' +
//                  error.stack
//   }
// }
// throw new RethrownError(`Oh no a "${error.message}" error`, error)

function _sb_exception(loc, msg) {
  const m = '<< SB lib error (' + loc + ': ' + msg + ') >>';
  console.log(m);
  throw new Error(m);
}

// Parts of this code is based on 'base64.ts':
// raw.githubusercontent.com/dankogai/js-base64/main/base64.mjs which
// was distributed under BSD 3-Clause; we believe our use of the code
// here under GPL v3 is compatible with that license.

const _fromCC = String.fromCharCode.bind(String);

// ****************************************************************
// implement SB flavor of 'btoa'
// ****************************************************************

const _U8Afrom = (it, fn = (x) => x) => new Uint8Array(Array.prototype.slice.call(it, 0).map(fn));

/** Standardized 'btoa()'-like function, e.g., takes a binary string
 ('b') and returns a Base64 encoded version ('a' used to be short
 for 'ascii').

 @param {buffer} Uint8Array buffer
 @return {string} base64 string
 */
export function arrayBufferToBase64(buffer) {
  const u8a = new Uint8Array(buffer);
  if (process.browser) {
    // we could use window.btoa but chose not to
    let u32, c0, c1, c2, asc = '';
    const maxargs = 0x1000;
    const strs = [];
    for (let i = 0, l = u8a.length; i < l; i += maxargs)
      strs.push(_fromCC.apply(null, u8a.subarray(i, i + maxargs)));
    const bin = strs.join('');
    const pad = bin.length % 3;
    for (let i = 0; i < bin.length;) {
      if ((c0 = bin.charCodeAt(i++)) > 255 ||
        (c1 = bin.charCodeAt(i++)) > 255 ||
        (c2 = bin.charCodeAt(i++)) > 255)
        throw new Error('Invalid Character');
      u32 = (c0 << 16) | (c1 << 8) | c2;
      asc += b64chs[u32 >> 18 & 63] +
        b64chs[u32 >> 12 & 63] +
        b64chs[u32 >> 6 & 63] +
        b64chs[u32 & 63];
    }
    return pad ? asc.slice(0, pad - 3) + '==='.substring(pad) : asc;
  } else {
    // nodejs, so has Buffer, just use that
    return Buffer.from(u8a).toString('base64');
  }
}

// ****************************************************************
// implement SB flavor of 'atob'
// ****************************************************************

const b64ch = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const b64chs = Array.prototype.slice.call(b64ch);
const b64tab = ((a) => {
  const tab = {};
  a.forEach((c, i) => tab[c] = i);
  return tab;
})(b64chs);

/** Standardized 'atob()' function, e.g. takes the a Base64 encoded
 input and decodes it. Note: always returns Uint8Array.

 @param {string} base64 string
 @return {Uint8Array} returns decoded result
 */
export function base64ToArrayBuffer(asc) {
  asc = asc.replace(/\s+/g, ''); // collapse any whitespace
  asc += '=='.slice(2 - (asc.length & 3)); // make it tolerant of padding
  if (!_assertBase64(asc))
    throw new Error('Invalid Character');
  if (process.browser) {
    // we could use window.atob but chose not to
    let u24, bin = '', r1, r2;
    for (let i = 0; i < asc.length;) {
      u24 = b64tab[asc.charAt(i++)] << 18
        | b64tab[asc.charAt(i++)] << 12
        | (r1 = b64tab[asc.charAt(i++)]) << 6
        | (r2 = b64tab[asc.charAt(i++)]);
      bin += r1 === 64 ? _fromCC(u24 >> 16 & 255)
        : r2 === 64 ? _fromCC(u24 >> 16 & 255, u24 >> 8 & 255)
          : _fromCC(u24 >> 16 & 255, u24 >> 8 & 255, u24 & 255);
    }
    return str2ab(bin);
  } else {
    return _U8Afrom(Buffer.from(asc, 'base64'));
  }
}

/* ****************************************************************
 *  These are wrappers to handle both browser and node targets
 *  with the same code. The 'process.browser' value is replaced
 *  by rollup and this whole library is then tree-shaken so
 *  that only either the node-specific or browser-specific code
 *  is retained, into 'index.mjs' and 'browser.mjs' respectively.
 * ****************************************************************/

let _crypto = null;
if (process.browser)
  _crypto = crypto;
else
  _crypto = await import('crypto');

export function getRandomValues(buffer) {
  return _crypto.getRandomValues(buffer);
}

/**
 Returns 'true' if (and only if) object is of type 'Uint8Array'.
 Works same on browsers and nodejs.
 */
function _assertUint8Array(obj) {
  if (typeof obj === 'object')
    if (Object.prototype.toString.call(obj) === '[object Uint8Array]')
      return true;
  return false;
}

const b64_regex = new RegExp('^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$');

/**
 Returns 'true' if (and only if) string is well-formed base64.
 Works same on browsers and nodejs.
 */
function _assertBase64(base64) {
  /* webpack 4 doesn't support optional chaining, requires webpack 5;
     since wp 5 is pretty recent (2020-10-10), we'll avoid using
     optional chaining in this library for a while */
  // return (b64_regex.exec(base64)?.[0] === base64);
  const z = b64_regex.exec(base64);
  if (z)
    return (z[0] === base64);
  else
    return false;
}

/** Standardized 'str2ab()' function, string to array buffer.
 This assumes on byte per character.
 @param {string} string
 @return {Uint8Array} buffer
 */
export function str2ab(string) {
  const length = string.length;
  const buffer = new Uint8Array(length);
  for (let i = 0; i < length; i++)
    buffer[i] = string.charCodeAt(i);
  return buffer;
}

/** Standardized 'ab2str()' function, array buffer to string.
 This assumes one byte per character.
 @param {string} string
 @return {Uint8Array} buffer
 */
export function ab2str(buffer) {
  if (!_assertUint8Array(buffer))
    _sb_exception('ab2str()', 'parameter is not a Uint8Array buffer'); // this will throw
  return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

/* ****************************************************************
 *  TODO functions - look for duplicates
 * ****************************************************************/

/* TODO
export function verifyCookie(request, env) {
  // room.mjs uses without env, storage with env
}
*/

// the publicKeyPEM paramater below needs to look like this:
const defaultPublicKeyPEM = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAtVedzwPq7OIl84xx9ruV
TAkv+sUPUYeQJ3PtFOJkBSrMyGPErVxjXQQ6nvb+OevQ2t7EhimyQ3bnP7PdeAU2
mWQX6V8LfhJj0ox8Envtw9DF7nEED5aLwnimTjox906j7itXO2xDdJCRuAfpar3u
Tj3d0EAKWFXTBHrorKI0pHCg1opIRsqNjpVnetZn1SweCtArE7YymNRQmoi8XWzj
yCt41fGFoFcmVeE87hiq41NJkE0iMfrmf6QqE91Fp1BSSTD75KEbKPXepS/jl3nV
VFe4tWrHypcT+Uk7I2UBqHnR+AnODVrSxZMzoVnXoYbhDAdReTQ81MrSQ+LW7yZV
rTxa5uYVPIRB6l58dpBEhIGcvEz376fvEwdhEqw9iXm7FchbqX3FQpwDVKvguj+w
jIaV60/hyBaRPO2oD9IhByvL3F+Gq+iwQRXbEgvI8QvkJ1w/WcelytljcwUoYbC5
7VS7EvnoNvMQT+r5RJfoPVPbwsCOFAQCVnzyOPAMZyUn69ycK+rONvrVxkM+c8Q2
8w7do2MDeRWJRf4Va0XceXsN+YcK7g9bqBWrBYJIWzeRiAQ3R6kyaxxbdEhyY3Hl
OlY876IbVmwlWAQ82l9r7ECjBL2nGMjDFm5Lv8TXKC5NHWHwY1b2vfvl6cyGtG1I
OTJj8TMRI6y3Omop3kIfpgUCAwEAAQ==
-----END PUBLIC KEY-----`;

/** Import a PEM encoded RSA public key, to use for RSA-OAEP
 encryption.  Takes a string containing the PEM encoded key, and
 returns a Promise that will resolve to a CryptoKey representing
 the public key.

 @param {PEM} RSA public key, string, PEM format
 @return {cryptoKey} RSA-OAEP key
 */
export function importPublicKey(pem) {
  if (!pem)
    pem = defaultPublicKeyPEM;
  // fetch the part of the PEM string between header and footer
  const pemHeader = '-----BEGIN PUBLIC KEY-----';
  const pemFooter = '-----END PUBLIC KEY-----';
  const start = pem.indexOf(pemHeader);
  const end = pem.indexOf(pemFooter);
  if ((start < 0) || (end < 0))
    _sb_exception('importPublicKey()', 'fail to find BEGIN and/or END string in RSA (PEM) key');
  const pemContents = pem.slice(start + pemHeader.length, end);
  // const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
  const binaryDer = base64ToArrayBuffer(pemContents);
  return _crypto.subtle.importKey('spki', binaryDer, {name: 'RSA-OAEP', hash: 'SHA-256'}, true, ['encrypt']);
}

/** Returns random number
 @return {int} integer 0..255
 */
export function simpleRand256() {
  return _crypto.getRandomValues(new Uint8Array(1))[0];
}


const base32mi = '0123456789abcdefyhEjkLmNHpFrRTUW';

/** Returns a random string in requested encoding
 @param {n} number of characters
 @param {code} encoding, supported types: 'base32mi'
 @return {string} random string

 'base32mi': '0123456789abcdefyhEjkLmNHpFrRTUW'
 */
export function simpleRandomString(n, code) {
  if (code == 'base32mi') {
    // yeah of course we need to add base64 etc
    const z = _crypto.getRandomValues(new Uint8Array(n));
    let r = '';
    for (let i = 0; i < n; i++)
      r += base32mi[z[i] & 31];
    return r;
  }
  _sb_exception('simpleRandomString', 'code ' + code + ' not supported');
}

/** Disambiguates strings that are known to be 'base32mi' type
 @param {s} string
 @return {string} cleaned up string

 'base32mi': '0123456789abcdefyhEjkLmNHpFrRTUW'

 This is the base32mi disambiguation table:

 [OoQD] -> '0'
 [lIiJ] -> '1'
 [Zz] -> '2'
 [A] -> '4'
 [Ss] -> '5'
 [G] -> '6'
 [t] -> '7'
 [B] -> '8'
 [gq] -> '9'
 [C] -> 'c'
 [Y] -> 'y'
 [KxX] -> 'k'
 [M] -> 'm'
 [n] -> 'N'
 [P] -> 'p'
 [uvV] -> 'U'
 [w] -> 'W'

 Another way to think of it is that this, becomes this ('.' means no change):

 0123456789abcdefghijklmnopqrstuvxyzABCDEFGHIJKLMNOPQRSTUVXYZ
 ................9.1..1.N0.9.57UUk.248c0EF6.11kLm.0p0.5..Uky2

 */
export function cleanBase32mi(s) {
  // this of course is not the most efficient
  return s.replace(/[OoQD]/g, '0').replace(/[lIiJ]/g, '1').replace(/[Zz]/g, '2').replace(/[A]/g, '4').replace(/[Ss]/g, '5').replace(/[G]/g, '6').replace(/[t]/g, '7').replace(/[B]/g, '8').replace(/[gq]/g, '9').replace(/[C]/g, 'c').replace(/[Y]/g, 'y').replace(/[KxX]/g, 'k').replace(/[M]/g, 'm').replace(/[n]/g, 'N').replace(/[P]/g, 'p').replace(/[uvV]/g, 'U').replace(/[w]/g, 'w');
}


/** Takes an arbitrary dict object, a public key in PEM
 format, and a callback function: generates a random AES key,
 wraps that in (RSA) key, and when all done will call the
 callback function with the results

 @param {dict} dictionary (payload)
 @param {publicKeyPEM} public key (PEM format)
 @param {callback} callback function, called with results
 */
export function packageEncryptDict(dict, publicKeyPEM, callback) {
  const clearDataArrayBufferView = str2ab(JSON.stringify(dict));
  const aesAlgorithmKeyGen = {name: 'AES-GCM', length: 256};
  const aesAlgorithmEncrypt = {name: 'AES-GCM', iv: _crypto.getRandomValues(new Uint8Array(16))};
  if (!publicKeyPEM)
    publicKeyPEM = defaultPublicKeyPEM;
  // Create a key generator to produce a one-time-use AES key to encrypt some data
  _crypto.subtle.generateKey(aesAlgorithmKeyGen, true, ['encrypt']).then(
    (aesKey) => {
      // we are exporting the symmetric AES key so we can encrypt it using pub key
      _crypto.subtle.exportKey('raw', aesKey).then((theKey) => {
        // console.log('raw key is:');
        // console.log(theKey);
        // console.log('arrayBufferToBase64 of raw AES key is:');
        // console.log(arrayBufferToBase64(theKey));
        // console.log('raw AES key itself: ');
        // console.log(theKey);
        const rsaAlgorithmEncrypt = {name: 'RSA-OAEP'};
        importPublicKey(publicKeyPEM).then((publicKey) => {
          return _crypto.subtle.encrypt(rsaAlgorithmEncrypt, publicKey, theKey);
        }).then(
          (buf) => {
            const encryptedAesKey = arrayBufferToBase64(buf);
            // console.log('rsa ciphertext of our aes key in base 64 encoding is: ');
            // console.log(encryptedAesKey);
            return encryptedAesKey;
          }).then(
          (encAesKey) => {
            // console.log('IV is:');
            // console.log(arrayBufferToBase64(aesAlgorithmEncrypt.iv));
            return Promise.all([_crypto.subtle.encrypt(aesAlgorithmEncrypt, aesKey, clearDataArrayBufferView), encAesKey]);
          }).then(
          (arr) => {
            // arr[0] is the encrypted dict in raw format, arr[1] is the aes key encrypted with rsa public key
            const encryptedData = arrayBufferToBase64(arr[0]);
            // console.log('this is the encryptedApplication, or arrayBufferToBase64(arr[0])');
            // console.log(arr[0]);
            // console.log(encryptedData);
            const postableEncryptedAesKey = arr[1];
            // console.log(postableEncryptedAesKey);
            const theContent = encodeURIComponent(encryptedData);
            const data = {
              enc_aes_key: encodeURIComponent(postableEncryptedAesKey),
              iv: encodeURIComponent(arrayBufferToBase64(aesAlgorithmEncrypt.iv)),
              content: theContent
            };
            if (callback) {
              callback(data);
            } else {
              console.log('(No Callback) Resulting data:');
              console.log(data);
            }
          });
      });
    }
  );
} // packageEncrypt()



const Snackabra = {
  SB_libraryVersion: SB_libraryVersion,
  ab2str: ab2str,
  str2ab: str2ab,
  base64ToArrayBuffer: base64ToArrayBuffer,
  arrayBufferToBase64: arrayBufferToBase64,
  getRandomValues: getRandomValues
};

export default Snackabra;


if (process.browser)
  window.Snackabra = Snackabra;
