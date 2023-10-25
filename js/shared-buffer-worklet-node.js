class SharedBufferWorkletNode extends AudioWorkletNode {

  constructor(context, options) {
    super(context, 'shared-buffer-worklet-processor', options);

    this._workerOptions = (options && options.worker) ?
      options.worker : {
        ringBufferLength: 4096,
        channelCount: 2
      };

    this._worker = new Worker('./js/shared-buffer-worker.js');

    this._worker.onmessage = this._onWorkerInitialized.bind(this);
    this.port.onmessage = this._onProcessorInitialized.bind(this);

    this._worker.postMessage({
      message: 'INITIALIZE_WORKER',
      options: {
        ringBufferLength: this._workerOptions.ringBufferLength,
        channelCount: this._workerOptions.channelCount,
      },
    });
  }

  _onWorkerInitialized(eventFromWorker) {
    const data = eventFromWorker.data;
    if (data.message === 'WORKER_READY') {
      this.port.postMessage(data.SharedBuffer);
      return;
    }

    if (data.message === 'WORKER_ERROR') {
      console.log(`[SharedBufferWorklet] Worker Error: ${data.detail}`);
      if (typeof this.onError === 'function') {
        this.onError(data);
      }
      return;
    }

    console.log(`[SharedBufferWorklet] Unknown message: ${eventFromWorker}`);
  }

  _onProcessorInitialized(eventFromProcessor) {
    const data = eventFromProcessor.data;
    if (data.message === 'PROCESSOR_READY' &&
      typeof this.onInitialized === 'function') {
      this.onInitialized();
      return;
    }

    console.log(`[SharedBufferWorklet] Unknown message: ${eventFromProcessor}`);
  }
}

export default SharedBufferWorkletNode;
