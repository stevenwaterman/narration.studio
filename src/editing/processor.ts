//@ts-ignore
import toWav from "audiobuffer-to-wav";
import download from "downloadjs"
import { ProcessingToken, EditorToken, AudioToken } from "../tokens";
import { writable, Writable, Readable } from "svelte/store";

export const sampleRate = 44100;
let audioContext: AudioContext | null = null;
export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext({sampleRate});
  }
  return audioContext;
}

export function createEditorTokens(tokens: ProcessingToken[], buffer: AudioBuffer): EditorToken[] {
  return tokens.map(token => {
    if (token.type === "PAUSE") return token;

    const offset = token.timings.start / 1000;
    const duration = (token.timings.end - token.timings.start) / 1000;
    return {
      type: "AUDIO",
      idx: token.idx,
      offset: offset - 0.5,
      duration: duration,
      buffer: buffer,
      raw: token.raw,
      stop: () => {}
    };
  });
}

type PlayingState = {
  type: "PLAYING";
  offset: number;
  ctxStartTime: number;
}
type PausedState = {
  type: "PAUSED";
  offset: number;
}
type StoppedState = {
  type: "STOPPED";
}
type AudioState = PlayingState | PausedState | StoppedState;

export const audioStatusStore: Writable<AudioState> = writable({type: "STOPPED"});

let audioState: AudioState; 
audioStatusStore.subscribe(state => {
  audioState = state;
})

export function getCurrentTime(): number {
  if (audioState.type === "PLAYING") {
    return getAudioContext().currentTime - audioState.ctxStartTime;
  }
  return -1;
}

export function play(tokens: EditorToken[], startTime: number = 0): void {
  stop(tokens);
  const ctx = getAudioContext();
  const currentTime = ctx.currentTime;
  let timeOffset = 0;
  tokens.forEach((token) => {
    if (token.type === "PAUSE") {
      timeOffset += token.duration;
    } else {
      const finishTimeOffset = timeOffset + token.duration;
      if(timeOffset >= startTime) {
        playBuffer(ctx, currentTime + timeOffset - startTime, token);
      } else if (finishTimeOffset > startTime) {
        const additionalOffset = startTime - timeOffset;
        playBuffer(ctx, currentTime + timeOffset, token, additionalOffset);
      }
      timeOffset = finishTimeOffset;
    }
  });
  audioStatusStore.set({type: "PLAYING", offset: startTime, ctxStartTime: currentTime});
}

export function stop(tokens: EditorToken[]): void {
  tokens.forEach(token => {
    if (token.type === "AUDIO") token.stop();
  });
  audioStatusStore.set({type: "STOPPED"});
}

export function pause(tokens: EditorToken[]): void {
  let duration = 0;
  tokens.forEach(token => {
    if (token.type === "AUDIO") token.stop();
    duration += token.duration;
  });
  const oldOffset = audioState.type === "PLAYING" ? audioState.offset : 0;
  const newOffset = oldOffset + getCurrentTime();

  if (newOffset <= duration) {
    audioStatusStore.set({type: "STOPPED"});
  } else {
    audioStatusStore.set({type: "PAUSED", offset: newOffset});
  }
}

export function togglePause(tokens: EditorToken[]): void {
  if(audioState.type === "STOPPED") {
    play(tokens);
  } else if(audioState.type === "PAUSED") {
    play(tokens, audioState.offset);
  } else if(audioState.type === "PLAYING") {
    pause(tokens);
  }
}

export async function processRawAudio(audio: Blob): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const arrayBuffer: ArrayBuffer = await audio.arrayBuffer();
  return await ctx.decodeAudioData(arrayBuffer);
}

function playBuffer(ctx: BaseAudioContext, when: number, token: AudioToken, offset: number = 0) {
  const source = ctx.createBufferSource();
  source.buffer = token.buffer;
  source.connect(ctx.destination);
  source.start(when, token.offset + offset, token.duration - offset);
  token.stop = () => source.stop();
}

export async function save(tokens: EditorToken[]) {
  const duration: number = tokens.map(token => {
    if (token.type === "PAUSE") return token.duration;
    return token.duration;
  }).reduce((a,b) => a+b, 0);
  const ctx = new OfflineAudioContext({sampleRate, length: duration * sampleRate});

  let currentTime = 0;
  tokens.forEach((token) => {
    if (token.type === "PAUSE") {
      currentTime += token.duration;
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

