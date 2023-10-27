const audioContext = new AudioContext();
let analyser;
let canvas;
let canvasContext;
let fbc_array;
let bar_count;
let bar_pos;
let bar_width;
let bar_height;
let previousValueToDisplay = 0;
let smoothingCount = 0;
let smoothingThreshold = 5;
let smoothingCountThreshold = 5;

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
  canvas.width = window.innerWidth * 0.8;
  canvas.height = window.innerHeight * 0.6;
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

// Thanks to PitchDetect: https://github.com/cwilso/PitchDetect/blob/master/js/pitchdetect.js
let noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function noteFromPitch(frequency) {
  let noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
  return Math.round(noteNum) + 69;
}

function FrameLooper() {
  window.RequestAnimationFrame =
    window.requestAnimationFrame(FrameLooper) ||
    window.msRequestAnimationFrame(FrameLooper) ||
    window.mozRequestAnimationFrame(FrameLooper) ||
    window.webkitRequestAnimationFrame(FrameLooper);

  let drawFrequency = function() {
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

  let drawSine = function() {
    analyser.fftSize = 2048;
    let bufferLength = analyser.fftSize;
    let dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    canvasContext.fillStyle = 'rgb(200, 200, 200)';
    canvasContext.fillRect(0, 0, canvas.width, canvas.height);

    canvasContext.lineWidth = 2;
    canvasContext.strokeStyle = 'rgb(0, 0, 0)';

    canvasContext.beginPath();

    var sliceWidth = canvas.width * 1.0 / bufferLength;
    var x = 0;

    for (var i = 0; i < bufferLength; i++) {

      var v = dataArray[i] / 128.0;
      var y = v * canvas.height / 2;

      if (i === 0) {
        canvasContext.moveTo(x, y);
      } else {
        canvasContext.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasContext.lineTo(canvas.width, canvas.height / 2);
    canvasContext.stroke();
  }

  let drawNote = function() {
    let bufferLength = analyser.fftSize;
    let buffer = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(buffer);
    let autoCorrelateValue = autoCorrelate(buffer, audioContext.sampleRate)

    // Handle rounding
    let valueToDisplay = autoCorrelateValue;
    let roundingValue = document.querySelector('input[name="rounding"]:checked').value
    if (roundingValue == 'none') {
      // Do nothing
    } else if (roundingValue == 'hz') {
      valueToDisplay = Math.round(valueToDisplay);
    } else {
      // Get the closest note
      // Thanks to PitchDetect:
      valueToDisplay = noteStrings[noteFromPitch(autoCorrelateValue) % 12];
    }

    let smoothingValue = document.querySelector('input[name="smoothing"]:checked').value


    if (autoCorrelateValue === -1) {
      document.getElementById('note').innerText = 'Too quiet...';
      return;
    }
    if (smoothingValue === 'none') {
      smoothingThreshold = 99999;
      smoothingCountThreshold = 0;
    } else if (smoothingValue === 'basic') {
      smoothingThreshold = 10;
      smoothingCountThreshold = 5;
    } else if (smoothingValue === 'very') {
      smoothingThreshold = 5;
      smoothingCountThreshold = 10;
    }

    function noteIsSimilarEnough() {
      // Check threshold for number, or just difference for notes.
      if (typeof(valueToDisplay) == 'number') {
        return Math.abs(valueToDisplay - previousValueToDisplay) < smoothingThreshold;
      } else {
        return valueToDisplay === previousValueToDisplay;
      }
    }
    // Check if this value has been within the given range for n iterations
    if (noteIsSimilarEnough()) {
      if (smoothingCount < smoothingCountThreshold) {
        smoothingCount++;
        return;
      } else {
        previousValueToDisplay = valueToDisplay;
        smoothingCount = 0;
      }
    } else {
      previousValueToDisplay = valueToDisplay;
      smoothingCount = 0;
      return;
    }
    if (typeof(valueToDisplay) == 'number') {
      valueToDisplay += ' Hz';
    }

    document.getElementById('note').innerText = valueToDisplay;
  }
  let vizType = document.querySelector('input[name="display"]:checked').value
  if (vizType === "sine") {
    drawSine();
  } else {
    drawFrequency();
  }
  drawNote();
}

// i grabbed this from https://alexanderell.is/posts/tuner/tuner.js
///////////////////////////////////////////////////////////////////////////////
// Must be called on analyser.getFloatTimeDomainData and audioContext.sampleRate
// From https://github.com/cwilso/PitchDetect/pull/23
function autoCorrelate(buffer, sampleRate) {
  // Perform a quick root-mean-square to see if we have enough signal
  let SIZE = buffer.length;
  let sumOfSquares = 0;
  for (let i = 0; i < SIZE; i++) {
    let val = buffer[i];
    sumOfSquares += val * val;
  }
  let rootMeanSquare = Math.sqrt(sumOfSquares / SIZE)
  if (rootMeanSquare < 0.01) {
    return -1;
  }

  // Find a range in the buffer where the values are below a given threshold.
  let r1 = 0;
  let r2 = SIZE - 1;
  let threshold = 0.2;

  // Walk up for r1
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < threshold) {
      r1 = i;
      break;
    }
  }

  // Walk down for r2
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < threshold) {
      r2 = SIZE - i;
      break;
    }
  }

  // Trim the buffer to these ranges and update SIZE.
  buffer = buffer.slice(r1, r2);
  SIZE = buffer.length

  // Create a new array of the sums of offsets to do the autocorrelation
  let c = new Array(SIZE).fill(0);
  // For each potential offset, calculate the sum of each buffer value times its offset value
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE - i; j++) {
      c[i] = c[i] + buffer[j] * buffer[j + i]
    }
  }

  // Find the last index where that value is greater than the next one (the dip)
  let d = 0;
  while (c[d] > c[d + 1]) {
    d++;
  }

  // Iterate from that index through the end and find the maximum sum
  let maxValue = -1;
  let maxIndex = -1;
  for (let i = d; i < SIZE; i++) {
    if (c[i] > maxValue) {
      maxValue = c[i];
      maxIndex = i;
    }
  }

  let T0 = maxIndex;

  // Not as sure about this part, don't @ me
  // From the original author:
  // interpolation is parabolic interpolation. It helps with precision. We suppose that a parabola pass through the
  // three points that comprise the peak. 'a' and 'b' are the unknowns from the linear equation system and b/(2a) is
  // the "error" in the abscissa. Well x1,x2,x3 should be y1,y2,y3 because they are the ordinates.
  let x1 = c[T0 - 1];
  let x2 = c[T0];
  let x3 = c[T0 + 1]

  let a = (x1 + x3 - 2 * x2) / 2;
  let b = (x3 - x1) / 2
  if (a) {
    T0 = T0 - b / (2 * a);
  }

  return sampleRate / T0;
}
