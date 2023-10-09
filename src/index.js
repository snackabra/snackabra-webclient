/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.js';
import { register } from './serviceWorkerRegistration.js';
import IndexedKV from "./utils/IndexedKV.js";
import * as SB from 'snackabra/dist/snackabra.js'
console.log(SB)
window.SB = {
  ...SB
}

console.log(window.SB)

const container = document.getElementById('root');
const root = createRoot(container);


window.addEventListener('touchmove', function (event) {
  event.preventDefault();
});

window.onpopstate = function (e) {

  e.preventDefault();
  window.history.go(1);
}


const localKV = new IndexedKV({ db: 'sb_files', table: 'files' })

root.render(<App />);

Object.defineProperty(document, 'cacheDb', {
  value: localKV
});

console.log(process.env.NODE_ENV)

const updateServiceWorker = (registration) => {
  registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  registration.update();

};

register({
  onUpdate: reg => updateServiceWorker(reg),
});
// }

