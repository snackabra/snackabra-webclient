// #########################    FUNCTIONS TO HANDLE ALL IMAGE PROCESSING   ###########################################


// TODO - can be optimized (asynchronized more) to return the hashes once calculated and then do all the encryption stuff.
import * as utils from "./utils";
import config from "../config";
import { encrypt, getImageKey } from "./crypto";
import { decrypt } from "./utils";

export async function saveImage(image, roomId, sendSystemMessage) {
  const previewImage = padImage(await (await restrictPhoto(image, 4096, "image/jpeg", 0.92)).arrayBuffer());
  const previewHash = await generateImageHash(previewImage);
  const fullImage = image.size > 15728640 ? padImage(await (await restrictPhoto(image, 15360, "image/jpeg", 0.92)).arrayBuffer()) : padImage(await image.arrayBuffer());
  const fullHash = await generateImageHash(fullImage);
  const previewStorePromise = storeImage(previewImage, previewHash.id, previewHash.key, 'p', roomId).then(_x => {
    if (_x.hasOwnProperty('error')) sendSystemMessage('Could not store preview: ' + _x['error']);
    return _x;
  });
  const fullStorePromise = storeImage(fullImage, fullHash.id, fullHash.key, 'f', roomId).then(_x => {
    if (_x.hasOwnProperty('error')) sendSystemMessage('Could not store full image: ' + _x['error']);
    return _x;
  });

  // return { full: { id: fullHash.id, key: fullHash.key }, preview: { id: previewHash.id, key: previewHash.key } }
  return {
    full: fullHash.id,
    preview: previewHash.id,
    fullKey: fullHash.key,
    previewKey: previewHash.key,
    fullStorePromise: fullStorePromise,
    previewStorePromise: previewStorePromise
  };
}


export async function storeImage(image, image_id, keyData, type, roomId) {

  const storeReqResp = await (await fetch(config.STORAGE_SERVER + "/storeRequest?name=" + image_id)).arrayBuffer();
  const encrypt_data = utils.extractPayload(storeReqResp);
  // console.log(encrypt_data)
  const key = await getImageKey(keyData, encrypt_data.salt);
  let storageToken, verificationToken;
  const data = await encrypt(image, key, "arrayBuffer", encrypt_data.iv);
  console.log(data)
  const storageTokenReq = await (await fetch(config.ROOM_SERVER + roomId + '/storageRequest?size=' + data.content.byteLength)).json();
  if (storageTokenReq.hasOwnProperty('error')) {
    return { error: storageTokenReq.error }
  }
  // storageToken = new TextEncoder().encode(storageTokenReq.token);
  storageToken = JSON.stringify(storageTokenReq);
  const resp = await fetch(config.STORAGE_SERVER + "/storeData?type=" + type + "&key=" + encodeURIComponent(image_id),
    {
      method: "POST",
      body: utils.assemblePayload({
        iv: encrypt_data.iv,
        salt: encrypt_data.salt,
        image: data.content,
        storageToken: (new TextEncoder()).encode(storageToken),
        vid: window.crypto.getRandomValues(new Uint8Array(48))
      })
    });
  const resp_json = await resp.json();
  // console.log("Response for " + type + ": ", resp_json)
  if (resp_json.hasOwnProperty('error')) {
    // TODO - why can't we throw exceptions?
    // Promise.reject(new Error('Server error on storing image (' + resp_json.error + ')'));
    return { error: 'Error: storeImage() failed (' + resp_json.error + ')' };
  }
  verificationToken = resp_json.verification_token;
  return { verificationToken: verificationToken, id: resp_json.image_id, type: type };
}


export async function generateImageHash(image) {
  try {
    const digest = await crypto.subtle.digest('SHA-512', image);
    const _id = digest.slice(0, 32);
    const _key = digest.slice(32);
    return {
      id: encodeURIComponent(utils.arrayBufferToBase64(_id)),
      key: encodeURIComponent(utils.arrayBufferToBase64(_key))
    };
  } catch (e) {
    console.log(e);
    return {};
  }
}


export async function retrieveImagePreview(msgId, messages) {
  try {
    const imageHash = messages.find(msg => msg._id === msgId).imageMetaData;
    // console.log(imageHash)
    const image_id = imageHash.previewId;
    const imageFetch = await (await fetch(config.STORAGE_SERVER + "/fetchImage?id=" + encodeURIComponent(image_id))).arrayBuffer();
    const data = utils.extractPayload(imageFetch);
    const iv = data.iv;
    const salt = data.salt;
    const image_key = await getImageKey(imageHash.previewKey, salt);
    const encrypted_image = data.image;
    const img = await decrypt(image_key, { content: encrypted_image, iv: iv }, "arrayBuffer");
    //console.log(img)
    //console.log("data:image/jpeg;base64,"+arrayBufferToBase64(img.plaintext))
    if (!img.error) {
      return "data:image/jpeg;base64," + utils.arrayBufferToBase64(img.plaintext);
    }
    return null;
  } catch (e) {
    console.log(e);
    return null;
  }
}


export async function retrieveData(msgId, messages, controlMessages) {
  // console.log(state.controlMessages)
  const imageMetaData = messages.find(msg => msg._id === msgId).imageMetaData;
  // console.log(imageHash)
  const image_id = imageMetaData.previewId;
  const control_msg = controlMessages.find(msg => msg.hasOwnProperty('id') && msg.id.startsWith(image_id));
  console.log(imageMetaData, image_id, control_msg, controlMessages);
  if (!control_msg) {
    return { 'error': 'Failed to fetch data - missing control message for that image' };
  }
  const imageFetch = await (await fetch(config.STORAGE_SERVER + "/fetchData?id=" + encodeURIComponent(control_msg.id) + '&verification_token=' + control_msg.verificationToken)).arrayBuffer();
  const data = utils.extractPayload(imageFetch);
  console.log(data);
  const iv = data.iv;
  const salt = data.salt;
  const image_key = await getImageKey(imageMetaData.previewKey, salt);
  const encrypted_image = data.image;
  const padded_img = await decrypt(image_key, { content: encrypted_image, iv: iv }, "arrayBuffer");
  const img = unpadData(padded_img.plaintext);
  //console.log(img)
  //console.log("data:image/jpeg;base64,"+arrayBufferToBase64(img.plaintext))
  if (img.error) {
    console.log('(Image error: ' + img.error + ')');
    throw new Error('Failed to fetch data - authentication or formatting error');
  }
  return { 'url': "data:image/jpeg;base64," + utils.arrayBufferToBase64(img) };
}


export async function getFileData(file, outputType) {
  try {
    let reader = new FileReader();
    if (file.size === 0) {
      return null;
    }
    outputType === 'url' ? reader.readAsDataURL(file) : reader.readAsArrayBuffer(file);
    return new Promise((resolve, reject) => {
      reader.onloadend = (event) => {
        let the_blob = reader.result;
        resolve(the_blob);
      };
    });
  } catch (e) {
    console.log(e);
    return null;
  }
}


export async function restrictPhoto(photo, maxSize, imageType, qualityArgument) {
  // imageType default should be 'image/jpeg'
  // qualityArgument should be 0.92 for jpeg and 0.8 for png (MDN default)
  maxSize = maxSize * 1024; // KB
  // console.log(`Target size is ${maxSize} bytes`);
  let _c = await readPhoto(photo);
  let _b1 = await new Promise((resolve) => {
    _c.toBlob(resolve, imageType, qualityArgument);
  });
  // workingDots();
  // console.log(`start canvas W ${_c.width} x H ${_c.height}`)
  let _size = _b1.size;
  if (_size <= maxSize) {
    // console.log(`Starting size ${_size} is fine`);
    return _b1;
  }
  // console.log(`Starting size ${_size} too large, start by reducing image size`);
  // compression wasn't enough, so let's resize until we're getting close
  let _old_size;
  let _old_c;
  while (_size > maxSize) {
    _old_c = _c;
    _c = scaleCanvas(_c, .5);
    _b1 = await new Promise((resolve) => {
      _c.toBlob(resolve, imageType, qualityArgument);
    });
    _old_size = _size;
    _size = _b1.size;
    // workingDots();
    // console.log(`... reduced to W ${_c.width} x H ${_c.height} (to size ${_size})`);
  }

  // we assume that within this width interval, storage is roughly prop to area,
  // with a little tuning downwards
  let _ratio = maxSize / _old_size;
  let _maxIteration = 12;  // to be safe
  // console.log(`... stepping back up to W ${_old_c.width} x H ${_old_c.height} and will then try scale ${_ratio.toFixed(4)}`);
  let _final_c;
  do {
    _final_c = scaleCanvas(_old_c, Math.sqrt(_ratio) * 0.99);  // we're targeting within 1%
    _b1 = await new Promise((resolve) => {
      _final_c.toBlob(resolve, imageType, qualityArgument);
      // console.log(`(generating blob of requested type ${imageType})`);
    });
    // workingDots();
    // console.log(`... fine-tuning to W ${_final_c.width} x H ${_final_c.height} (size ${_b1.size})`);
    _ratio *= (maxSize / _b1.size);
  } while (((_b1.size > maxSize) || ((Math.abs(_b1.size - maxSize) / maxSize) > 0.02)) && (--_maxIteration > 0));  // it's ok within 2%

  // workingDots();
  // console.log(`... ok looks like we're good now ... final size is ${_b1.size} (which is ${((_b1.size * 100) / maxSize).toFixed(2)}% of cap)`);

  // document.getElementById('the-original-image').width = _final_c.width;  // a bit of a hack
  return _b1;
}


export async function readPhoto(photo) {
  const canvas = document.createElement('canvas');
  const img = document.createElement('img');

  // create img element from File object
  img.src = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(photo);
  });
  await new Promise((resolve) => {
    img.onload = resolve;
  });

  // console.log("img object");
  // console.log(img);
  // console.log("canvas object");
  // console.log(canvas);

  // draw image in canvas element
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}


export function scaleCanvas(canvas, scale) {
  const scaledCanvas = document.createElement('canvas');
  scaledCanvas.width = canvas.width * scale;
  scaledCanvas.height = canvas.height * scale;
  // console.log(`#### scaledCanvas target W ${scaledCanvas.width} x H ${scaledCanvas.height}`);
  scaledCanvas
    .getContext('2d')
    .drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
  // console.log(`#### scaledCanvas actual W ${scaledCanvas.width} x H ${scaledCanvas.height}`);
  return scaledCanvas;
}


export function padImage(image_buffer) {
  let _sizes = [128, 256, 512, 1024, 2048, 4096];   // in KB
  _sizes = _sizes.map((size) => size * 1024);
  const image_size = image_buffer.byteLength;
  // console.log('BEFORE PADDING: ', image_size)
  let _target;
  if (image_size < _sizes[_sizes.length - 1]) {
    for (let i = 0; i < _sizes.length; i++) {
      if (image_size + 21 < _sizes[i]) {
        _target = _sizes[i];
        break;
      }
    }
  } else {
    _target = (Math.ceil(image_size / (1024 * 1024))) * 1024 * 1024;
    if (image_size + 21 >= _target) {
      _target += 1024;
    }
  }
  let _padding_array = [128];
  _target = _target - image_size - 21;
  // We will finally convert to Uint32Array where each element is 4 bytes
  // So we need (_target/4) - 6 array elements with value 0 (128 bits or 16 bytes or 4 elements to be left empty,
  // last 4 bytes or 1 element to represent the size and 1st element is 128 or 0x80)
  for (let i = 0; i < _target; i++) {
    _padding_array.push(0);
  }
  // _padding_array.push(image_size);
  const _padding = new Uint8Array(_padding_array).buffer;
  // console.log('Padding size: ', _padding.byteLength)
  let final_data = utils._appendBuffer(image_buffer, _padding);
  final_data = utils._appendBuffer(final_data, new Uint32Array([image_size]).buffer);
  // console.log('AFTER PADDING: ', final_data.byteLength)
  return final_data;
}


export function unpadData(data_buffer) {
  // console.log(data_buffer, typeof data_buffer)
  const _size = new Uint32Array(data_buffer.slice(-4))[0];
  return data_buffer.slice(0, _size);
}
