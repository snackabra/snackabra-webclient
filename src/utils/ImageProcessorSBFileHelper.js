/**
 *This is a version of the image processor that is compatible with the SBFileHelper
 */

import ImageWorker from './ImageWorker.js';
import ArrayBufferWorker from './ArrayBufferWorker.js';


//Pulled from jslib
function _appendBuffer(buffer1, buffer2) {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
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

export async function _restrictPhoto(maxSize, _c, _b1, scale, canvas) {
  const t2 = new Date().getTime();
  const imageType = "image/jpeg";
  const qualityArgument = 0.92;
  let _size = _b1.size;
  if (_size <= maxSize) {
    console.log(`Starting size ${_size} is fine (below target size ${maxSize}`);
    return _b1;
  }
  console.log(`Starting size ${_size} too large (max is ${maxSize}) bytes.`)
  console.log(`Reduce size by scaling canvas - start size is W ${_c.width} x H ${_c.height}`)

  let _old_size;
  let _old_c;

  _old_c = _c;

  _old_size = _size;
  _size = _b1.size;
  // workingDots();
  const t3 = new Date().getTime();
  console.log(`... reduced to W ${_c.width} x H ${_c.height} (to size ${_size}) ... total time ${t3 - t2} milliseconds`);
  // }

  // we assume that within this width interval, storage is roughly prop to area,
  // with a little tuning downwards
  let _ratio = (maxSize / _old_size) * scale; // overshoot a bit
  console.warn("scale is:")
  console.warn(scale);
  console.log(`... stepping back up to W ${_old_c.width} x H ${_old_c.height} and will then try scale ${_ratio.toFixed(4)}`);
  let _final_c = canvas;
  // we assume that within this width interval, storage is roughly prop to area,
  // with a little tuning downwards
  let _maxIteration = 12;  // to be safe
  console.log("_old_c is:")
  console.log(`... stepping back up to W ${_old_c.width} x H ${_old_c.height} and will then try scale ${_ratio.toFixed(4)}`);
  const t4 = new Date().getTime();
  do {
    _final_c = scaleCanvas(_old_c, Math.sqrt(_ratio) * 0.95, _final_c); // always overshoot
    // eslint-disable-next-line no-loop-func
    _b1 = await new Promise((resolve) => {
      _final_c.toBlob(resolve, imageType, qualityArgument);
      console.log(`(generating blob of requested type ${imageType})`);
    });
    console.log(`... fine-tuning to W ${_final_c.width} x H ${_final_c.height} (size ${_b1.size})`);
    _ratio *= (maxSize / _b1.size);
    const t5 = new Date().getTime();
    console.log(`... resulting _ratio is ${_ratio} ... total time here ${t5 - t4} milliseconds`);
    console.log(` ... we're within ${(Math.abs(_b1.size - maxSize) / maxSize)} of cap (${maxSize})`);
  } while (((_b1.size > maxSize) || ((Math.abs(_b1.size - maxSize) / maxSize) > 0.10)) && (--_maxIteration > 0));  // we're pretty tolerant here
  releaseCanvas(_final_c)

  return _b1;
}


function releaseCanvas(canvas) {
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx && ctx.clearRect(0, 0, 1, 1);
  canvas.remove()
  console.warn("Canvase released")
}

export async function restrictPhoto(sbImage, maxSize, type) {
  console.log("################################################################");
  console.log("#################### inside restrictPhoto() ####################");
  console.log("################################################################");
  let scale = .5

  switch (type) {
    case 'thumbnail':
      scale = .30;
      break;
    case 'preview':
      scale = .50;
      break;
    default:
      scale = 1;
      break;
  }
  const t0 = new Date().getTime();
  // imageType default should be 'image/jpeg'
  // qualityArgument should be 0.92 for jpeg and 0.8 for png (MDN default)
  maxSize = maxSize * 1024; // KB
  // let _c = await readPhoto(photo);
  let _c = await sbImage.img;
  const t1 = new Date().getTime();
  console.log(`#### readPhoto took ${t1 - t0} milliseconds`);
  // let _b1 = await new Promise((resolve) => _c.blob.then((b) => resolve(b)));
  let _b1 = await sbImage.blob();
  console.log("got blob");
  console.log(_b1);

  // let _b1 = await new Promise((resolve) => {
  //   _c.toBlob(resolve, imageType, qualityArgument);
  // });
  const t2 = new Date().getTime();
  console.log(`#### getting photo into a blob took ${t2 - t1} milliseconds`);
  // workingDots();

  let _final_b1 = _restrictPhoto(maxSize, _c, _b1, scale, sbImage.canvas);

  // workingDots();
  console.log(`... ok looks like we're good now ... final size is ${_b1.size} (which is ${((_b1.size * 100) / maxSize).toFixed(2)}% of cap)`);
  // document.getElementById('the-original-image').width = _final_c.width;  // a bit of a hack
  const end = new Date().getTime();
  console.log(`#### restrictPhoto() took total ${end - t0} milliseconds`);
  return _final_b1;
}


export function scaleCanvas(canvas, scale, sCanvas) {

  var start = new Date().getTime();
  let scaledCanvas = sCanvas;
  if (!scaledCanvas) {
    console.warn('new canvas')
    scaledCanvas = document.createElement('canvas');
  }
  scaledCanvas.width = canvas.width * scale;
  scaledCanvas.height = canvas.height * scale;
  console.log(`#### scaledCanvas starting with W ${canvas.width} x H ${canvas.height}`);
  const ctx = scaledCanvas.getContext('2d')
  if (ctx) {
    ctx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
    console.log(`#### scaledCanvas actual W ${scaledCanvas.width} x H ${scaledCanvas.height}`);
    var end = new Date().getTime();
    console.log(`#### scaleCanvas() took ${end - start} milliseconds`);
    console.log(`#### scaledCanvas scale ${scale} to target W ${scaledCanvas.width} x H ${scaledCanvas.height} took ${end - start} milliseconds`);
    return scaledCanvas;
  } else {
    return canvas;
  }

}

export function padImage(image_buffer) {
  let _sizes = [128, 256, 512, 1024, 2048, 4096];   // in KB
  _sizes = _sizes.map((size) => size * 1024);
  const image_size = image_buffer.byteLength;
  console.log('BEFORE PADDING: ', image_size)
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
  const _padding = new Uint8Array(_padding_array).buffer;
  console.log('Padding size: ', _padding.byteLength)
  let final_data = _appendBuffer(image_buffer, _padding);
  final_data = _appendBuffer(final_data, new Uint32Array([image_size]).buffer);
  console.log('AFTER PADDING: ', final_data.byteLength)
  return final_data;
}

export function unpadData(data_buffer) {
  const _size = new Uint32Array(data_buffer.slice(-4))[0];
  return data_buffer.slice(0, _size);
}

// code by Thomas Lochmatter, thomas.lochmatter@viereck.ch
// Returns an object with the width and height of the JPEG image
// stored in bytes, or null if the bytes do not represent a JPEG
// image.
function readJpegHeader(bytes) {
  // JPEG magick
  if (bytes[0] !== 0xff) return;
  if (bytes[1] !== 0xd8) return;
  // Go through all markers
  var pos = 2;
  var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  while (pos + 4 < bytes.byteLength) {
    // Scan for the next start marker (if the image is corrupt, this marker may not be where it is expected)
    if (bytes[pos] !== 0xff) {
      pos += 1;
      continue;
    }
    var type = bytes[pos + 1];
    // Short marker
    pos += 2;
    if (bytes[pos] === 0xff) continue;
    // SOFn marker
    var length = dv.getUint16(pos);
    if (pos + length > bytes.byteLength) return;
    if (length >= 7 && (type === 0xc0 || type === 0xc2)) {
      var data = {};
      data.progressive = type === 0xc2;
      data.bitDepth = bytes[pos + 2];
      data.height = dv.getUint16(pos + 3);
      data.width = dv.getUint16(pos + 5);
      data.components = bytes[pos + 7];
      return data;
    }
    // Other marker
    pos += length;
  }
  return;
}


export class SBImage {
  SB;
  imageBuffer;
  thumbnailDetails = {};
  previewDetails = {};
  /**
   *
   * @param {File} image
   * @param {Snackabra} SB
   */
  constructor(buffer, SBFileHelperFile) {
    this.SB = window.SB
    this.SBFile = SBFileHelperFile;
    const blob = new Blob([buffer]);
    const image = new File([blob], SBFileHelperFile.name);
    this.image = image;

    this.thumbnailReady = new Promise((resolve) => {
      // block on getting width and height...
      this.thumbnailResolve = resolve;
    });

    this.processingReady = new Promise((resolve) => {
      // block on getting width and height...
      this.processingResolve = resolve;
    });


    this.aspectRatio = new Promise((resolve) => {
      // block on getting width and height...
      this.resolveAspectRatio = resolve;
    });

    // Fetch the original image
    console.log("Fetching file:");
    console.log(buffer);
    this.imgURL = new Promise((resolve) => {
      new Promise(() => {
        const _self = this;
        const reader = image.stream().getReader();
        return new ReadableStream({
          start(controller) {
            var foundSize = false;
            function pump() {
              return reader.read().then(({ done, value }) => {
                // When no more data needs to be consumed, close the stream
                if (done) {
                  controller.close();
                  return;
                }
                // console.log("Got a chunk!");
                // console.log(value);
                // pull out size
                if (!foundSize) {
                  foundSize = true;
                  // console.log("$$$$$$$ found first chunk")
                  const h = readJpegHeader(value);
                  // _self.width = value[165] * 256 + value[166];
                  // _self.height = value[163] * 256 + value[164];
                  // var width = value[165] * 256 + value[166];
                  // var height = value[163] * 256 + value[164];

                  if (h) {
                    console.log("^^^^^^^^^^^^^^^^", h);
                    _self.width = h.width;
                    _self.height = h.height;
                    console.log(`got the size of the image!!  ${_self.width} x ${_self.height}`);
                    _self.resolveAspectRatio(_self.width / _self.height);
                  } else {
                    console.warn("PROBLEM ***** ... could not parse jpeg header");
                    console.warn("Loading file to get demensions");
                    _self.img.then((el) => {
                      _self.width = el.width;
                      _self.height = el.height;
                      _self.resolveAspectRatio(_self.width / _self.height);
                    })
                  }
                }
                // Enqueue the next data chunk into our target stream
                controller.enqueue(value);
                pump();
              });
            }
            pump();
          }
        })
      })
        // Create a new response out of the stream
        .then((stream) => {
          console.log('stream', stream)
          new Response(stream)
        })

        // Create an object URL for the response
        .then((response) => response.blob())
        .then((blob) => URL.createObjectURL(blob))
        // Update image
        .then((url) => {
          console.log("Finished getting 'url':");
          console.log(url);
          resolve(url);
        })
        .catch((err) => console.error(err));
    })

    this.img = new Promise((resolve) => {
      if (this.url) {
        resolve(this.url)
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        var img = new Image();
        img.onload = function () {
          this.width = img.width;
          this.height = img.height;
          this.url = img;
          resolve(img);
        };
        img.src = reader.result;
      }
      console.warn(this.image.size)
      reader.readAsDataURL(this.image);
    });
    // this requests some worker to load the file into a sharedarraybuffer
    this.imageSAB = doImageTask(['loadSB', image], false);
  }

  blob = () => {
    return new Promise((resolve, reject) => {
      // spin up worker
      try {
        const code = ArrayBufferWorker.toString();
        const blob = new Blob([`(${code})(${0})`]);
        let worker = new Worker(URL.createObjectURL(blob));
        console.warn('worker', worker)
        worker.onmessage = (event) => {
          console.warn("Got blob from worker:");
          console.trace(event.data);
          worker.terminate()
          resolve(new Blob([event.data])); // convert arraybuffer to blob
        }
        worker.postMessage(this.image);
      } catch (e) {
        console.error(e)
        reject(e)
      }

    });
  }

  processThumbnail = () => {
    const t0 = new Date().getTime();
    return new Promise((resolve) => {
      // new channel server is more ornery about this. our thumbnail limit
      // is potentially 64 KiB, but this needs to wait for jslib 1.4.0 which
      // will redesign some key low level aspects of messages. currently we
      // want some space, so let's say 62 KiB, but then that needs to 
      // tolerate b64 encoding along the way, ergo 62 * 3 / 4 = 46.5
      restrictPhoto(this, 46 /* 64 */, 'thumbnail').then(async (photo) => {
        const t1 = new Date().getTime();
        console.warn(`#### thumbnail processing total ${t1 - t0} milliseconds (blocking)`);
        this.thumbnail = await getFileData(photo, 'url');
        const fileReader = new FileReader();
        fileReader.onloadend = (e)=>{
          const name = `thumbnail_${this.SBFile.name}`
          const file = new File([photo], name)
          e.target.files = [file]
          // eslint-disable-next-line no-undef
          window.SBFileHelper.handleFileDrop(e, (r)=>{
            for(let i in r){
              if(r[i].name === name){
                this.thumbnailDetails = {
                  uniqueShardId: r[i].uniqueShardId,
                  fullName: r[i].fullName,
                }
              }
            }
          });
          this.thumbnailResolve();
          resolve(this)
        };
        fileReader.readAsText(photo);

      }).catch(console.error)
    })
  }

  processImage = () => {
    const t0 = new Date().getTime();
    let promisesArray = [
      restrictPhoto(this, 4096, 'preview'), // Preview 4MB
      // restrictPhoto(this, 15360, 'full') // Full 15MB
    ]
    return new Promise((resolve) => {
      Promise.all(promisesArray).then(async (results) => {
        console.log(results)
        const fileReader = new FileReader();
        fileReader.onloadend = (e)=>{
          const name = `preview_${this.SBFile.name}`
          const file = new File([results[0]], name)
          e.target.files = [file]
          // eslint-disable-next-line no-undef
          window.SBFileHelper.handleFileDrop(e, (r)=>{
            for(let i in r){
              if(r[i].name === name){
                this.previewDetails = {
                  uniqueShardId: r[i].uniqueShardId,
                  fullName: r[i].fullName,
                }
              }
            }
          });
          this.processingResolve();
          resolve(this)
        };
        fileReader.readAsText(results[0]);
        // const p = await this.SB.storage.getObjectMetadata(await results[0].arrayBuffer(), 'p')
        // const f = await this.SB.storage.getObjectMetadata(await results[1].arrayBuffer(), 'f')
        const t1 = new Date().getTime();
        console.warn(`#### image processing total ${t1 - t0} milliseconds (blocking)`);
        // this.objectMetadata = {
        //   preview: p,
        //   full: f
        // }
      }).catch(console.error)
    })
  }

  processFullImage = () => {
    const t0 = new Date().getTime();
    let promisesArray = [
      restrictPhoto(this, 15360, 'full') // Full 15MB
    ]
    return new Promise((resolve) => {
      Promise.all(promisesArray).then(async (results) => {
        console.log(results)
        // const f = await this.SB.storage.getObjectMetadata(await results[1].arrayBuffer(), 'f')
        const t1 = new Date().getTime();
        console.warn(`#### image processing total ${t1 - t0} milliseconds (blocking)`);
        // this.objectMetadata = {
        //   full: f
        // }
        this.processingResolve();
        resolve(this)
      }).catch(console.error)
    })
  }

  loadToCanvas(canvas) {
    return new Promise((resolve) => {
      this.aspectRatio.then((r) => {
        console.log(0)
        console.log("~~~~~~~~~~~~~~~~ got WxH", this.width, this.height);
        canvas.width = this.width;
        canvas.height = this.height;
        this.canvas = canvas;
        this.imageSAB.then((imageSAB) => {
          try {
            console.log('After SAB Promise', OffscreenCanvas)
            if (OffscreenCanvas) {
              console.log("%%%%%%%%%%%%%%%% we are here");
              console.log(imageSAB);
              // const canvas = document.createElement('canvas'); // test to give it from caller
              // var ctx = canvas.getContext('2d');
              // var imageData = ctx.createImageData(400, 400);
              const toOffscreen = cloneCanvas(canvas);
              const offscreen = toOffscreen.transferControlToOffscreen();
              // const ctx = offscreen.getContext('2d');
              // doImageTask(['testCanvas', imageData.data.buffer], [imageData.data.buffer]).then((m) => console.log(m));
              doImageTask(['testCanvas', offscreen, imageSAB], [offscreen]).then((m) => {
                console.log("**************** Returned message:", m);
                console.log("**************** offscreen:", canvas);
                console.log("**************** offscreen:", offscreen);
                releaseCanvas(toOffscreen)
                resolve(canvas);
              });
            } else {
              console.log("**************** THIS feature only works with OffscreenCanvas");
              console.log("                 (TODO: make the code work as promise as fallback");
            }
          } catch (e) {
            console.log("**************** THIS feature only works with OffscreenCanvas");
            console.log("                 (TODO: make the code work as promise as fallback");
            console.log(e)
            resolve(this.canvas);
          }
        }).catch(console.error)
      });
    });
  }

}

function cloneCanvas(oldCanvas) {

  //create a new canvas
  var newCanvas = document.createElement('canvas');
  var context = newCanvas.getContext('2d');

  //set dimensions
  newCanvas.width = oldCanvas.width;
  newCanvas.height = oldCanvas.height;

  //apply the old canvas to the new one
  context.drawImage(oldCanvas, 0, 0);

  //return the new canvas
  return newCanvas;
}

// we need this so it can be packaged
export class BlobWorker extends Worker {
  constructor(worker, i) {
    const code = worker.toString();
    const blob = new Blob([`(${code})(${i})`]);
    return new Worker(URL.createObjectURL(blob));
  }
}

// let image_workers = [];
let next_worker = 0;
// let max_workers = window.navigator.hardwareConcurrency / 2; // dialing back to not overload
// max_workers = max_workers >= 1 ? max_workers : 1 // just a safeguardd
// console.log(`setting up ${max_workers} image helper workers`);

// const IW_code = _restrictPhoto.toString();
// const IW_blob = new Blob([`${IW_code}`]);
// const IW_url = URL.createObjectURL(IW_blob);
// console.log("%%%%%%%%%%%%%%%% IW_code:", IW_code);

// for (let i = 0; i < max_workers; i++) {
//   let newWorker = {
//     worker: new BlobWorker(ImageWorker, i),
//     i: i, // index/number of worker
//     broken: false // tracks if there's a problem
//   };
//   image_workers.push(newWorker);
// }

function doImageTask(vars, transfer) {
  console.log("doImageTask() - vars are:");
  console.log(vars);
  next_worker++;
  var instance = new BlobWorker(ImageWorker, next_worker);
  return new Promise(function (resolve, reject) {
    // we pick one, rotating
    console.log(`Passing ${vars} on to ${next_worker}`);
    instance.onmessage = function (m) {
      console.log(`[${next_worker}] finished finished ... returning with:`);
      console.log(m);
      instance.terminate()
      resolve(m.data);
    }
    try {
      if (transfer) {
        instance.postMessage(vars, transfer);
      } else {
        instance.postMessage(vars);
      }
    } catch (error) {
      console.error(`Failed to send task to worker ${next_worker}`);
      console.error(error);
      instance.terminate()
      reject("failed");
    }
  });
}