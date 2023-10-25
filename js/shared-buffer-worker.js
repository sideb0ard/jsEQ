const STATE = {
  'FRAMES_AVAILABLE': 0,
  'READ_INDEX': 1,
  'WRITE_INDEX': 2,
  'RING_BUFFER_LENGTH': 3,
  'KERNEL_LENGTH': 4,
};

// Worker processor config.
const CONFIG = {
  bytesPerState: Int32Array.BYTES_PER_ELEMENT,
  bytesPerSample: Float32Array.BYTES_PER_ELEMENT,
  stateBufferLength: 5,
  ringBufferLength: 4096,
  kernelLength: 128,
  channelCount: 2,
};

let State;
let RingBuffer;
let WebSock;


let log = true;

function initialize(options) {
  console.log("ININIT");
  if (options.ringBufferLength) {
    CONFIG.ringBufferLength = options.ringBufferLength;
  }
  if (options.channelCount) {
    console.log("CHANZ!", options.channelCount);
    CONFIG.channelCount = options.channelCount;
  }

  console.log("WORKED TRY WEBSOCKET!");
  WebSock = new WebSocket("ws://127.0.0.1:8080");
  WebSock.binaryType = "arraybuffer";

  WebSock.addEventListener("message", (event) => {
    if (event.data instanceof ArrayBuffer) {
      const view = new DataView(event.data);
      const inputData = new Float32Array(event.data);

      const writeIndex = State[STATE.WRITE_INDEX]
      const nextWriteIndex = writeIndex + inputData.length;

      const bufferLen = CONFIG.ringBufferLength * CONFIG.channelCount;

      if (nextWriteIndex < bufferLen) {
        RingBuffer.set(inputData, writeIndex);
        State[STATE.WRITE_INDEX] = nextWriteIndex;
      } else {
        const splitIndex = bufferLen - writeIndex;
        const firstHalf = inputData.subarray(0, splitIndex);
        const secondHalf = inputData.subarray(splitIndex);
        RingBuffer.set(firstHalf, writeIndex);
        RingBuffer.set(secondHalf);
        State[STATE.WRITE_INDEX] = secondHalf.length;
      }

      let frames_avail = State[STATE.FRAMES_AVAILABLE] + (inputData.length / CONFIG.channelCount);
      if (frames_avail > CONFIG.ringBufferLength * CONFIG.channelCount)
        frames_avail = CONFIG.ringBufferLength;
      State[STATE.FRAMES_AVAILABLE] = frames_avail;

    } else {
      // text frame
      console.log("BLAH", event);
    }
  });

  console.log("WUIPup", WebSock);

  if (!self.SharedArrayBuffer) {
    postMessage({
      message: 'WORKER_ERROR',
      detail: `SharedArrayBuffer is not supported in your browser. See
          https://developers.google.com/web/updates/2018/06/audio-worklet-design-pattern
          for more info.`,
    });
    return;
  }

  const sharedBuffer = {
    state: new SharedArrayBuffer(CONFIG.stateBufferLength * CONFIG.bytesPerState),
    ringBuffer: new SharedArrayBuffer(CONFIG.ringBufferLength *
      CONFIG.channelCount * CONFIG.bytesPerSample),
  };
  console.log("len SAB:", sharedBuffer.ringBuffer);
  console.log("STATTSE:", sharedBuffer.state);

  // Get TypedArrayView from SAB.
  State = new Int32Array(sharedBuffer.state);
  RingBuffer = new Float32Array(sharedBuffer.ringBuffer);
  console.log("len RingBuf:", RingBuffer.length);
  console.log("len State:", State);

  // Initialize |States| buffer.
  Atomics.store(State, STATE.RING_BUFFER_LENGTH, CONFIG.ringBufferLength);
  Atomics.store(State, STATE.KERNEL_LENGTH, CONFIG.kernelLength);

  // Notify AWN in the main scope that the worker is ready.
  console.log("?", sharedBuffer);
  postMessage({
    message: 'WORKER_READY',
    SharedBuffer: sharedBuffer,
  });
}

onmessage = (eventFromMain) => {
  if (eventFromMain.data.message === 'INITIALIZE_WORKER') {
    initialize(eventFromMain.data.options);
    return;
  }
  console.log('[SharedBufferWorker] Unknown message: ', eventFromMain);
};
