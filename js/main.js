const audioContext = new AudioContext();
let analyser;
let canvas;
let canvasContext;
let fbc_array;
let bar_count;
let bar_pos;
let bar_width;
let bar_height;

const startAudio = async (context) => {
  console.log("YO START AUDIO", context);

  const {
    default: SharedBufferWorkletNode
  } =
  await import('./shared-buffer-worklet-node.js');

  await context.audioWorklet.addModule('./js/shared-buffer-worklet-processor.js');
  const sbwNode = new SharedBufferWorkletNode(context, {
    outputChannelCount: [2]
  });

  analyser = context.createAnalyser();
  canvas = document.getElementById("canvas");
  canvasContext = canvas.getContext("2d");

  sbwNode.onInitialized = () => {
    sbwNode.connect(analyser);
    // analyser.connect(context.destination);
  };

  sbwNode.onError = (errorData) => {
    console.log('[ERROR] ' + errorData.detail);
  };
};


window.addEventListener('load', async () => {
  console.log("LOOOAD MOFO!");
  const buttonEl = document.getElementById('button-start');
  buttonEl.disabled = false;
  buttonEl.addEventListener('click', async () => {
    console.log("CLIOCK YO MOFO!");
    await startAudio(audioContext);
    audioContext.resume();
    buttonEl.disabled = true;
    buttonEl.textContent = 'Playing...';

    FrameLooper();
  }, false);
});

function FrameLooper() {
  window.RequestAnimationFrame =
    window.requestAnimationFrame(FrameLooper) ||
    window.msRequestAnimationFrame(FrameLooper) ||
    window.mozRequestAnimationFrame(FrameLooper) ||
    window.webkitRequestAnimationFrame(FrameLooper);

  fbc_array = new Uint8Array(analyser.frequencyBinCount);
  bar_count = window.innerWidth / 2;

  analyser.getByteFrequencyData(fbc_array);

  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  canvasContext.fillStyle = "#ffffff";

  for (let i = 0; i < bar_count; i++) {
    bar_pos = i * 4;
    bar_width = 2;
    bar_height = -(fbc_array[i] / 2);

    canvasContext.fillRect(bar_pos, canvas.height, bar_width, bar_height);
  }
}
