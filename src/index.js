/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import React from 'react';
import './index.css';
import App from './App';
import { createRoot } from 'react-dom/client';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import IndexedKV from "./utils/IndexedKV";

let SB = require(process.env.NODE_ENV === 'development' ? 'snackabra/dist/snackabra' : 'snackabra')
console.log(SB)
window.SB = {
  Snackabra: SB.Snackabra,
  SBCrypto: SB.SBCrypto
}

const container = document.getElementById('root');
const root = createRoot(container);


window.addEventListener('touchmove', function (event) {
  event.preventDefault();
});


let shard = {
  "version": "1",
  "type": "p",
  "id": "00eCXyZDlh5HoGGRRwOZDIWVPiY9GvL9UV22mI_UMMs",
  "verification": "9598257574988828520",
}
// eslint-disable-next-line no-undef
let loadShard = loadShardLibrary.loadShard;

const benchmark = async () => {
  let start = Date.now()
  let promises = []
  for (let i = 0; i < 16; i++) {
    promises.push(loadShard(shard))
  }
  await Promise.allSettled(promises).
    then((results) => results.forEach((result) => console.log(result.status)));
  let end = Date.now()
  console.log('benchmark', end - start)
}

function makeNetworkRequests() {
  const requestsPerSecond = 16;
  const interval = 1000 / requestsPerSecond;

  // Perform a network request
  function performRequest() {
    let start = Date.now()
    loadShard(shard).then((result) => {
      console.log('Received data:', result);
      let end = Date.now()
      console.log('benchmark', end - start)
    })
  }

  // Perform requests at the desired interval
  setInterval(performRequest, interval);
}

// makeNetworkRequests()
// setInterval(() => {
// let promises = []
// for(let i = 0; i < 16; i++) {
//   promises.push(loadShard(shard))
// }
// Promise.allSettled(promises).
// then((results) => results.forEach((result) => console.log(result.status)));

// }, 1000)
// eslint-disable-next-line no-undef
console.log(loadShardLibrary.loadShard)
// document.location.replace(window.location.href)
// console.log(window.location)
window.onpopstate = function (e) {

  e.preventDefault();
  window.history.go(1);
}


const localKV = new IndexedKV({ db: 'sb_files', table: 'files' })

root.render(<App />);

Object.defineProperty(document, 'cacheDb', {
  value: localKV
});

if (process.env.NODE_ENV === 'production') {

  console.log(process.env.NODE_ENV + ' registering service worker')

  const updateServiceWorker = (registration) => {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    registration.update();

  };

  serviceWorkerRegistration.register({
    onUpdate: reg => updateServiceWorker(reg),
  });
}

