//@ts-ignore
import toWav from "audiobuffer-to-wav";
import download from "downloadjs"
import { ProcessingToken } from "./tokens";

export async function process(tokens: ProcessingToken[], data: Blob): Promise<void> {
  let currentTime = 0;
  const times: Array<{when: number; offset: number; duration: number}> = [];
  tokens.forEach(token => {
    if (token.type === "TIMING") {
      const offset = token.timings.start / 1000;
      const duration = (token.timings.end - token.timings.start) / 1000;
      times.push({when: currentTime, offset: offset - 0.5, duration: duration + 0.25});
      currentTime = currentTime + duration + 0.25;
    } else if (token.type === "PAUSE") {
      currentTime += token.delay;
    }
  })

  const sampleRate = 44100;
  const ctx = new OfflineAudioContext({
    sampleRate,
    length: sampleRate * currentTime
  });
  const arrayBuffer: ArrayBuffer = await data.arrayBuffer();
  const inputBuffer: AudioBuffer = await ctx.decodeAudioData(arrayBuffer);

  times.forEach(({when, offset, duration}) => {
    const source = ctx.createBufferSource();
    source.buffer = inputBuffer;
    source.connect(ctx.destination);
    source.start(when, offset, duration);
  })

  console.log("Starting rendering");
  const outputBuffer = await ctx.startRendering();
  console.log("Playing");

  const liveCtx = new AudioContext({
    sampleRate: ctx.sampleRate
  });
  const liveBufferSource = liveCtx.createBufferSource();
  liveBufferSource.buffer = outputBuffer;
  liveBufferSource.loop = true;
  liveBufferSource.connect(liveCtx.destination);
  liveBufferSource.start();

  const wav = toWav(outputBuffer);
  const array = new Uint8Array(wav);
  download(array, `audio.wav`);
}