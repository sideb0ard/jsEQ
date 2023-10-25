class EQProcessor extends AudioWorkletProcessor {
  constructor() {
    console.log("EQP Ctor!");
    super();
    this.port.onmessage = (e) => {
      console.log(e.data);
      console.log(typeof(e.data));
      this.q = e.data;
    };
  }


  process(inputs, outputs) {
    //console.log("EQP Process!!");

    //console.log("PUTPUTSlen:", outputs.length);
    let output = outputs[0];
    let chanCount = output.length;

    console.log("can i access Q?", this.q.dequeue());

    //for (let chanNum = 0; chanNum < chanCount; chanNum++) {
    //  for (let i = 0; i < output[chanNum].length; i++) {
    //    output[chanNum][i] = 0;
    //    console.log("chan:", chanNum, "i:", i);
    //  }
    //}

    return true;
  }
}

registerProcessor('eq-processor', EQProcessor);
