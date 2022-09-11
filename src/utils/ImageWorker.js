/* eslint-disable no-restricted-globals */

/*
  for interactive testing of libraries and such, try:
  script = document.createElement("script")
  script.type = "module"
  script.async = false
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.js"
  document.head.appendChild(script)
*/

import { SBImage } from '../utils/ImageProcessor.js';

export default(i) => {  // eslint-disable-line
  console.log(`starting worker number ${i}`);

  self.onmessage = (msg) => {
    console.log(`[${i}] starting ImageWorker(args) ... arg object is:`);
    console.log(msg);
    
    if (!crossOriginIsolated) { 
      console.log(`[${i}] not crossOriginIsolated - cannot use shared buffers - exiting`);
      postMessage("ERROR - not crossOriginIsolated");
    } else {
      const command = msg.data[0];
      switch(command) {
      case 'loadSB':
	//
	// load the raw contents of the file into a shared buffer
	// that can be passed between workers
	//
	const file = msg.data[1];
	// console.log("These are params:", file);
	file.arrayBuffer().then((b) => {
	  let buf0 = new Uint8Array(b);
	  // console.log("These are array buffer contents of the file", buf0);
	  let buf1 = new SharedArrayBuffer(buf0.byteLength);
	  let buf2 = new Uint8Array(buf1);
	  buf2.set (buf0, 0); // copy it over
	  // console.log("This object should be a populated sharedarraybuffer:", buf1);
	  postMessage(buf1);
	});
	break;
      case 'testCanvas':
	// 
	const imageDataBuffer = msg.data[1];
	console.log("Imageworker received canvas buffer:", imageDataBuffer);
	postMessage("Still alive!");
	break;
      default:
	postMessage(`No such image worker command (${command})`);
      }
    }
  }
}


// export default(i) => {  // eslint-disable-line
//   console.log(`starting worker number ${i}`);

//   /* utility functions are from snackabra-jslib */
//   function _sb_exception(loc, msg) {
//     const m = '<< ImageWorker error (' + loc + ': ' + msg + ') >>';
//     console.log(m);
//     throw new Error(m);
//   }

//   /**
//      Returns 'true' if (and only if) object is of type 'Uint8Array'.
//      Works same on browsers and nodejs.
//   */
//   function _assertUint8Array(obj) {
//     if (typeof obj === 'object')
//       if (Object.prototype.toString.call(obj) === '[object Uint8Array]')
// 	return true;
//     return false;
//   }

//   /** Standardized 'str2ab()' function, string to array buffer.
//       This assumes on byte per character.
//       @param {string} string
//       @return {Uint8Array} buffer
//   */
//   function str2ab(string) {
//     const length = string.length;
//     const buffer = new Uint8Array(length);
//     for (let i = 0; i < length; i++)
//       buffer[i] = string.charCodeAt(i);
//     return buffer;
//   }

//   /** Standardized 'ab2str()' function, array buffer to string.
//       This assumes one byte per character.
//       @param {string} string
//       @return {Uint8Array} buffer
//   */
//   function ab2str(buffer) { // eslint-disable-line
//     if (!_assertUint8Array(buffer))
//       _sb_exception('ab2str()', 'parameter is not a Uint8Array buffer'); // this will throw
//     return String.fromCharCode.apply(null, new Uint8Array(buffer));
//   }

//   // from https://stackoverflow.com/questions/37228285/uint8array-to-arraybuffer
//   function typedArrayToBuffer(array) {
//     return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset)
//   }

//   function exportIndex(flexSearchIndex) {
//     // https://github.com/nextapps-de/flexsearch/issues/299
//     // https://github.com/nextapps-de/flexsearch/issues/274
//     return new Promise((res, rej) => {
//       let pkg = [];
//       const expected = new Set([
// 	"reg",
// 	"reg.cfg",
// 	"reg.cfg.map",
// 	"reg.cfg.map.ctx"
//       ]);
//       const received = new Set();

//       const setsEq = (a, b) => {
// 	if (a.size !== b.size) {
// 	  return false;
// 	}
// 	return Array.from(a).every(el => b.has(el));
//       };

//       flexSearchIndex.export((key, data) => {
// 	// https://github.com/nextapps-de/flexsearch/issues/290
// 	// https://github.com/nextapps-de/flexsearch/issues/273
// 	pkg.push([
// 	  key
// 	    .toString()
// 	    .split(".")
// 	    .pop(),
// 	  data
// 	]);
// 	received.add(key);
// 	if (setsEq(expected, received)) {
// 	  res(JSON.stringify(pkg));
// 	}
//       });
//     });
//   }

//   // from https://cdnjs.com/libraries/lz-string
//   self.importScripts("https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.js");

//   // self.importScripts("./lib/flexsearch.bundle.js");
//   self.importScripts("https://cdn.jsdelivr.net/gh/nextapps-de/flexsearch@0.7.2/dist/flexsearch.bundle.js");

//   // wasm-flate
//   // self.importScripts("https://unpkg.com/wasm-flate@0.1.11-alpha/dist/bootstrap.js");
//   // console.log("window.g_flate = flate");
//   // console.log(flate); // eslint-disable-line
//   // window.g_flate = flate; // eslint-disable-line

//   self.onmessage = (ab) => {
//     var p = (new Blob([ab.data])).text();
//     p.then((s) => {
//       console.log(`[${i}] starting index on worker ... `);
//       var t = s.match(/([^.!?]+[.!?]+)|([^.!?]+$)/g);
//       var index = new FlexSearch.Index(); // eslint-disable-line
//       t.forEach((item, i) => index.add(i, item));

//       // console.log("testing search:");
//       // console.log(index.search("people"));
//       // var dict = {};
//       // index.export(function(key, data) {
//       // 	console.log(`key ${key}, data ${data}`);
//       // 	dict[key] = data;
//       // });

//       exportIndex(index).then(function(x) {
// 	console.log(`[${i}] new export says (size ${x.length})`);
// 	// console.log(x);
// 	// ok my bad it's already in that format
// 	// var j = JSON.stringify(x);
// 	var j = x;
// 	// console.log(`as json (size ${j.length}):`)
// 	// console.log(j);
// 	var j_ab = str2ab(j);
// 	console.log(`[${i}] then to str2ab(), resulting size ${j_ab.byteLength}, returning.`);
// 	var buf = typedArrayToBuffer(str2ab(j));
// 	// console.log("and as buffer");
// 	// console.log(buf);
// 	postMessage(buf, [buf]);
//       });
//     });
//   }
// }
