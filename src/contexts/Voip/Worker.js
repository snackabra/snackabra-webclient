'use strict';
export default () => {  // eslint-disable-line
  let scount = 0;
  let rcount = 0;
  let currentCryptoKey;
  let useCryptoOffset;

  console.log = (...args) => {
    postMessage({ operation: 'log', args: JSON.stringify(args) });
  };


  const dump = (encodedFrame, direction, max = 16) => {
    const data = new Uint8Array(encodedFrame.data);
    let bytes = '';
    for (let j = 0; j < data.length && j < max; j++) {
      bytes += (data[j] < 16 ? '0' : '') + data[j].toString(16) + ' ';
    }
    console.log(performance.now().toFixed(2), direction, bytes.trim(),
      'len=' + encodedFrame.data.byteLength,
      'type=' + (encodedFrame.type || 'audio'),
      'ts=' + encodedFrame.timestamp,
      'ssrc=' + encodedFrame.getMetadata().synchronizationSource,
      'pt=' + (encodedFrame.getMetadata().payloadType || '(unknown)')
    );
  }

  const encodeFunction = async (encodedFrame, controller) => {
    if (scount++ < 30) { // dump the first 30 packets.
      dump(encodedFrame, 'send');
    }
    let iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, currentCryptoKey.encryptionKey, encodedFrame.data);
    const data = new Blob([iv, encrypted]);
    encodedFrame.data = await data.arrayBuffer();

    controller.enqueue(encodedFrame);
  }

  const decodeFunction = async (encodedFrame, controller) => {
    if (rcount++ < 30) { // dump the first 30 packets
      dump(encodedFrame, 'recv');
    }
    const blob = new Blob([encodedFrame.data]);
    const iv = await blob.slice(0, 12).arrayBuffer();
    const data = await blob.slice(12, blob.size).arrayBuffer();
    encodedFrame.data = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, currentCryptoKey.encryptionKey, data);
    controller.enqueue(encodedFrame);
  }

  const handleTransform = async (operation, readable, writable) => {
    if (operation === 'encode') {
      const transformStream = new TransformStream({
        transform: encodeFunction,
      });
      readable
        .pipeThrough(transformStream)
        .pipeTo(writable);
    } else if (operation === 'decode') {
      const transformStream = new TransformStream({
        transform: decodeFunction,
      });
      readable
        .pipeThrough(transformStream)
        .pipeTo(writable);
    }
  }

  // Handler for messages, including transferable streams.
  // const postMessage = async (event) => {
  //   console.log(event)
  //   if (event) {
  //     if (event.operation === 'encode' || event.operation === 'decode') {
  //       return await handleTransform(event.operation, event.readable, event.writable);
  //     }
  //     if (event.operation === 'setCryptoKey') {
  //       currentCryptoKey = event.currentCryptoKey;
  //       useCryptoOffset = event.useCryptoOffset;
  //     }
  //   }
  // };
  onmessage = async (event) => {
    postMessage('asdasdasdasdasd')
    if (event) {
      if (event.data.operation === 'encode' || event.data.operation === 'decode') {
        return await handleTransform(event.data.operation, event.data.readable, event.data.writable);
      }
      if (event.data.operation === 'setCryptoKey') {
        currentCryptoKey = event.data.currentCryptoKey;
        useCryptoOffset = event.data.useCryptoOffset;
      }
    }
  };

  // eslint-disable-next-line no-restricted-globals
  if (self.RTCTransformEvent) {
    // eslint-disable-next-line no-restricted-globals
    self.onrtctransform = (event) => {
      const transformer = event.transformer;
      handleTransform(transformer.options.operation, transformer.readable, transformer.writable);
    };
  }

  console.log('Worker loaded');

}
