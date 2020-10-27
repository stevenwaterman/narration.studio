class AbsoluteProcessor extends AudioWorkletProcessor {
  process (inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    input.forEach((inputChannel, idx) => {
      const outputChannel = output[idx];
      for(let i = 0; i < inputChannel.length; i++) {
        outputChannel[i] = Math.abs(inputChannel[i]);
      }
    })
    return true;
  }
}

class MeanProcessor extends AudioWorkletProcessor {
  process (inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    input.forEach((inputChannel, idx) => {
      const outputChannel = output[idx];
      const count = inputChannel.length;
      let sum = 0;
      for(let i = 0; i < count; i++) {
        sum += inputChannel[i];
      }
      const mean = sum / count;
      for(let i = 0; i < count; i++) {
        outputChannel[i] = mean;
      }
    })
    return true;
  }
}

registerProcessor('absolute', AbsoluteProcessor);
registerProcessor('mean', MeanProcessor);