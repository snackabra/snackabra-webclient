/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import React from 'react';
import './index.css';
import App from './App';
import { createRoot } from 'react-dom/client';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import IndexedKV from "./utils/IndexedKV";
const container = document.getElementById('root');
const root = createRoot(container);


window.addEventListener('touchmove', function (event) {
  event.preventDefault();
});

// document.location.replace(window.location.href)
// console.log(window.location)
window.onpopstate = function (e) {

  e.preventDefault();
  window.history.go(1);
}


const localKV = new IndexedKV({ db: 'sb_files', table: 'files' })

localKV.ready.then(() => {
  root.render(<App />);
})


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

