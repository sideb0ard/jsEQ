const STATE = {
  'FRAMES_AVAILABLE': 0,
  'READ_INDEX': 1,
  'WRITE_INDEX': 2,
  'RING_BUFFER_LENGTH': 3,
  'KERNEL_LENGTH': 4,
};

class SharedBufferWorkletProcessor extends AudioWorkletProcessor {
  constructor(nodeOptions) {
    super();

    this._initialized = false;
    this.port.onmessage = this._initializeOnEvent.bind(this);
  }

  _initializeOnEvent(eventFromWorker) {
    const sharedBuffer = eventFromWorker.data;

    console.log("YO, SHRED BUF:", sharedBuffer);
    // Get the state buffer.
    this._state = new Int32Array(sharedBuffer.state);
    console.log("YO, STATE:", this._state);

    this._ringBuffer = new Float32Array(sharedBuffer.ringBuffer);

    this._kernelLength = this._state[STATE.KERNEL_LENGTH];

    this._initialized = true;
    this.port.postMessage({
      message: 'PROCESSOR_READY',
    });
  }

  _pullOutputChannelData(outputChannelData) {

    const outputFrameCount = 128;

    if (this._state[STATE.FRAMES_AVAILABLE] > outputFrameCount) {
      let readIndex = this._state[STATE.READ_INDEX];

      let leftchan = outputChannelData[0];
      let rightchan = outputChannelData[1];

      for (let i = 0; i < outputFrameCount; i++) {
        leftchan[i] = this._ringBuffer[readIndex];
        readIndex = (readIndex + 1) % this._ringBuffer.length;
        rightchan[i] = this._ringBuffer[readIndex];
        readIndex = (readIndex + 1) % this._ringBuffer.length;
      }

      this._state[STATE.READ_INDEX] = readIndex;
      this._state[STATE.FRAMES_AVAILABLE] -= outputFrameCount;
    }
  }

  process(inputs, outputs) {
    if (!this._initialized) {
      return true;
    }

    const outputChannelData = outputs[0];
    this._pullOutputChannelData(outputChannelData);

    return true;
  }
}

registerProcessor(
  'shared-buffer-worklet-processor', SharedBufferWorkletProcessor);
