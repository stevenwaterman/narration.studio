//@ts-ignore
import toWav from "audiobuffer-to-wav";
import download from "downloadjs"
import { ProcessingToken, EditorToken, AudioToken } from "../tokens";

const sampleRate = 44100;

export function createEditorTokens(tokens: ProcessingToken[], buffer: AudioBuffer): EditorToken[] {
  return tokens.map(token => {
    if (token.type === "PAUSE") return token;

    const offset = token.timings.start / 1000;
    const duration = (token.timings.end - token.timings.start) / 1000;
    return {
      type: "AUDIO",
      idx: token.idx,
      offset: offset - 0.5, 
      duration: duration + 0.25,
      buffer: buffer,
      raw: token.raw,
      stop: () => {}
    };
  });
}

export function play(tokens: EditorToken[]): void {
  stop(tokens);
  const ctx = new AudioContext({sampleRate});
  let currentTime = ctx.currentTime;
  tokens.forEach((token) => {
    if (token.type === "PAUSE") {
      currentTime += token.delay;
    } else {
      playBuffer(ctx, currentTime, token);
      currentTime += token.duration;
    }
  });
}

export function stop(tokens: EditorToken[]): void {
  tokens.forEach(token => {
    if (token.type === "AUDIO") token.stop();
  });
}

export async function processRawAudio(audio: Blob): Promise<AudioBuffer> {
  const ctx = new AudioContext({sampleRate});
  const arrayBuffer: ArrayBuffer = await audio.arrayBuffer();
  return await ctx.decodeAudioData(arrayBuffer);
}

function playBuffer(ctx: BaseAudioContext, when: number, token: AudioToken) {
  const source = ctx.createBufferSource();
  source.buffer = token.buffer;
  source.connect(ctx.destination);
  source.start(when, token.offset, token.duration);
  token.stop = () => source.stop();
}

export async function save(tokens: EditorToken[]) {
  const duration: number = tokens.map(token => {
    if (token.type === "PAUSE") return token.delay;
    return token.duration;
  }).reduce((a,b) => a+b, 0);
  const ctx = new OfflineAudioContext({sampleRate, length: duration * sampleRate});

  let currentTime = 0;
  tokens.forEach((token) => {
    if (token.type === "PAUSE") {
      currentTime += token.delay;
    } else {
      playBuffer(ctx, currentTime, token);
      currentTime += token.duration;
    }
  });

  const outputBuffer = await ctx.startRendering();

  const wav = toWav(outputBuffer);
  const array = new Uint8Array(wav);
  download(array, `audio.wav`);
}