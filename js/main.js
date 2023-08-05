let canvas,
  canvasContext,
  source,
  audioContext,
  analyser,
  fbc_array,
  bar_count,
  bar_pos,
  bar_width,
  bar_height;

let audio = new Audio();

audio.id = "audio_player";
audio.src = "mp3/test.mp3";
audio.controls = true;
audio.loop = false;
audio.autoplay = false;

window.addEventListener(
  "load",
  function() {
    document.getElementById("audio").appendChild(audio);

    document.getElementById("audio_player").onplay = function() {
      if (typeof(audioContext) === "undefined") {
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        canvas = document.getElementById("canvas");
        canvasContext = canvas.getContext("2d");
        source = audioContext.createMediaElementSource(audio);

        canvas.width = window.innerWidth * 0.80;
        canvas.height = window.innerHeight * 0.60;

        source.connect(analyser);
        analyser.connect(audioContext.destination);
      }

      FrameLooper();
    };
  },
  false
);

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
