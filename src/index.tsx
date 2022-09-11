/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

import IndexedKV from "./utils/IndexedKV";

document.addEventListener("localKvReady", function(e) {
  ReactDOM.render(<App />, document.getElementById('root'));
});

const localKV = new IndexedKV({db: 'sb_files', table: 'files'})

Object.defineProperty(document, 'cacheDb', {
  value: localKV
});



