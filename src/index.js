/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import React from 'react';
import './index.css';
import App from './App';
import { createRoot } from 'react-dom/client';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import IndexedKV from "./utils/IndexedKV";
const container = document.getElementById('root');
const root = createRoot(container);

// window.pinchZoomEvent = document.addEventListener('touchmove', function (event) {
//   if (event.scale !== 1) { event.preventDefault(); }
// }, { passive: false });

document.addEventListener("localKvReady", async (e) => {
    root.render(<App />);
});


const localKV = new IndexedKV({ db: 'sb_files', table: 'files' })

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

