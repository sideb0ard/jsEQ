Graphic Equalizer for visualizing output from [Soundb0ard](https://github.com/sideb0ard/SoundB0ard).

Visualizer Implementation based on [this article](https://orangeable.com/javascript/equalizer-web-audio-api).

AudioWorklet and SharedArrayBuffer implementation based on [this](https://googlechromelabs.github.io/web-audio-samples/audio-worklet/design-pattern/shared-buffer/)

SharedArrayBuffer is disabled by default in browsers [due to potential vulns like Spectre](https://vercel.com/guides/fix-shared-array-buffer-not-defined-nextjs-react). Serve this content in this dir via the included python script which sets the correct heaaders for a localhost connection.
