/* eslint-disable */

/*
  for interactive testing of libraries and such, try:
  script = document.createElement("script")
  script.type = "module"
  script.async = false
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.js"
  document.head.appendChild(script)
*/

// import { SBImage, _restrictPhoto } from '../utils/ImageProcessor.js';

export default (i) => {  // eslint-disable-line
  const level = 'production'
      if(level === 'development'){
      }
      if(level === 'stage'){
        console.log = function () {}
        console.assert = function () {}
        console.count = function () {}
        console.debug = function () {}
        console.dir = function () {}
        console.dirxml = function () {}
        console.group = function () {}
        console.table = function () {}
        console.tine = function () {}
        console.timeEnd = function () {}
        console.timeLog = function () {}
        console.trace = function () {}
      }
      if(level === 'production'){
        console.log = function () { }
        console.warn = function () {}
        console.assert = function () {}
        console.count = function () {}
        console.debug = function () {}
        console.dir = function () {}
        console.dirxml = function () {}
        console.group = function () {}
        console.table = function () {}
        console.tine = function () {}
        console.timeEnd = function () {}
        console.timeLog = function () {}
        console.trace = function () {}
      }
  console.log(`starting ab worker number ${i}`);
  function fileToAB(file) {
    file.arrayBuffer().then((a) => postMessage(a, [a]));
  }
  self.onmessage = (event) => {
    fileToAB(event.data);
  }
}