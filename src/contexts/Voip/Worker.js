
class WorkerAsClass {
  scount = 0;
  rcount = 0;
  currentCryptoKey;
  useCryptoOffset;
  constructor() {
    // Handler for RTCRtpScriptTransforms.
    if (window.RTCTransformEvent) {
      window.onrtctransform = (event) => {
        const transformer = event.transformer;
        this.handleTransform(transformer.options.operation, transformer.readable, transformer.writable);
      };
    }
  }

  dump = (encodedFrame, direction, max = 16) => {
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

  encodeFunction = async (encodedFrame, controller) => {
    if (this.scount++ < 30) { // dump the first 30 packets.
      this.dump(encodedFrame, 'send');
    }
    let iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, this.currentCryptoKey.encryptionKey, encodedFrame.data);
    const data = new Blob([iv, encrypted]);
    encodedFrame.data = await data.arrayBuffer();

    controller.enqueue(encodedFrame);
  }

  decodeFunction = async (encodedFrame, controller) => {
    if (this.rcount++ < 30) { // dump the first 30 packets
      this.dump(encodedFrame, 'recv');
    }
    const blob = new Blob([encodedFrame.data]);
    const iv = await blob.slice(0, 12).arrayBuffer();
    const data = await blob.slice(12, blob.size).arrayBuffer();
    encodedFrame.data = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, this.currentCryptoKey.encryptionKey, data);
    controller.enqueue(encodedFrame);
  }

  handleTransform = async (operation, readable, writable) => {
    if (operation === 'encode') {
      const transformStream = new TransformStream({
        transform: this.encodeFunction,
      });
      readable
        .pipeThrough(transformStream)
        .pipeTo(writable);
    } else if (operation === 'decode') {
      const transformStream = new TransformStream({
        transform: this.decodeFunction,
      });
      readable
        .pipeThrough(transformStream)
        .pipeTo(writable);
    }
  }

  // Handler for messages, including transferable streams.
  postMessage = async (event) => {
    console.log(event)
    if (event) {
      if (event.operation === 'encode' || event.operation === 'decode') {
        return await this.handleTransform(event.operation, event.readable, event.writable);
      }
      if (event.operation === 'setCryptoKey') {
        this.currentCryptoKey = event.currentCryptoKey;
        this.useCryptoOffset = event.useCryptoOffset;
      }
    }
  };
}

export default WorkerAsClass;