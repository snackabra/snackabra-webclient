import { amber, blue, blueGrey, brown, common, cyan, deepOrange, deepPurple, green, grey, indigo, lightBlue, lightGreen, lime, orange, pink, purple, red, teal, yellow } from '@mui/material/colors/index.js';

export const getColorFromId = (id) => {
  let sumChars = 0;
  for (let i = 0; i < id.length; i++) {
    sumChars += id.charCodeAt(i);
  }

  const colors = [
    amber,
    blue,
    blueGrey,
    brown,
    common,
    cyan,
    deepOrange,
    deepPurple,
    green,
    grey,
    indigo,
    lightBlue,
    lightGreen,
    lime,
    orange,
    pink,
    purple,
    red,
    teal,
    yellow
  ];

  const keys = Object.keys(colors[sumChars % colors.length]);
  return colors[sumChars % colors.length][keys[sumChars % keys.length]];
}

// ChatGPT function for mobile compatibility when downloading files
// Expects fileData to be btoa encoded
export const downloadFile = (fileData, fileName, fileType) => {
  if (fileData) {
    var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    var isChrome =
      navigator.userAgent.toLowerCase().indexOf("CriOS") > -1 ||
      navigator.vendor.toLowerCase().indexOf("google") > -1;
    var iOSVersion = [];
    if (iOS) {
      iOSVersion = navigator.userAgent
        .match(/OS [\d_]+/i)[0]
        .substr(3)
        .split("_")
        .map((n) => parseInt(n));
    }
    var attachmentData = fileData;
    var attachmentName = fileName;
    var contentType = fileType;

    var binary = atob(attachmentData.replace(/\s/g, ""));
    var len = binary.length;
    var buffer = new ArrayBuffer(len);
    var view = new Uint8Array(buffer);
    for (var i = 0; i < len; i++) {
      view[i] = binary.charCodeAt(i);
    }
    var linkElement = document.createElement("a");
    try {
      var hrefUrl = "";
      var blob = "";
      if (iOS && !isChrome && iOSVersion[0] <= 12) {
        blob = `data:${fileType};base64,` + fileData;
        hrefUrl = blob;
      } else {
        if (iOS && !isChrome) {
          contentType = "application/octet-stream";
        }
        blob = new Blob([view], { type: contentType });
        hrefUrl = window.URL.createObjectURL(blob);
      }
      linkElement.setAttribute("href", hrefUrl);
      linkElement.setAttribute("target", "_blank");
      if ((iOS && (iOSVersion[0] > 12 || isChrome)) || !iOS) {
        linkElement.setAttribute("download", attachmentName);
      }
      var clickEvent = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: false
      });
      linkElement.dispatchEvent(clickEvent);


    } catch (ex) { }
  }
};

export function cloneMap(map) {
  const clonedMap = new Map();
  map.forEach((value, key) => {
    clonedMap.set(key, value);
  });

  return clonedMap;
}

export function isDataURL(s) {
  return !!s.match(isDataURL.regex);
}
isDataURL.regex = /^\s*data:([a-z]+\/[a-z]+(;[a-z\-]+\=[a-z\-]+)?)?(;base64)?,[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*$/i;