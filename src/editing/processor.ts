//@ts-ignore
import toWav from "audiobuffer-to-wav";
import download from "downloadjs"
import { ProcessingToken, EditorToken, AudioToken } from "../tokens";
import { writable, Writable } from "svelte/store";

export const sampleRate = 44100;
let audioContext: AudioContext | null = null;
export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext({sampleRate});
  }
  return audioContext;
}

export async function createEditorTokens(tokens: ProcessingToken[], buffer: AudioBuffer): Promise<EditorToken[]> {
  const envelope = await toEnvelope(buffer);
  const envelopeChannel = envelope.getChannelData(0);

  return tokens.map(token => {
    if (token.type === "PAUSE") return token;
    if (token.type === "PARAGRAPH") return token;

    // Start with Speech Recognition API's best guess adjusted slightly for latency
    const originalStartSecs = token.timings.start / 1000;
    let startSearchSample = Math.max(0, Math.round((originalStartSecs - 0.5) * sampleRate));

    const originalEndSecs = token.timings.end / 1000;
    let endSearchSample = Math.min(envelopeChannel.length, Math.round((originalEndSecs + 0.5) * sampleRate));

    let maxVolume = 0;
    for(let i = startSearchSample; i < endSearchSample; i++) {
      maxVolume = Math.max(maxVolume, envelopeChannel[i]);
    }
    const speechThreshold = 0.2 * maxVolume;
    const silenceThreshold = 0.03 * maxVolume;
    const silenceCount = 0.1 * sampleRate; // 0.1 seconds of silence

    // Expand until you hit silence (often immediately)
    // To handle case where speech recognition ended early
    {
      let count = 0;
      for(let i = startSearchSample; i >= 0; i--) {
        const value = envelopeChannel[i];
        if(value <= silenceThreshold) {
          count++;
          if(count > silenceCount) {
            startSearchSample = i;
            break;
          }
        } else {
          count = 0;
        }
      }
    }
  
    {
      let count = 0;
      for(let i = endSearchSample; i < envelopeChannel.length; i++) {
        const value = envelopeChannel[i];
        if(value <= silenceThreshold) {
          count++;
          if(count > silenceCount) {
            endSearchSample = i;
            break;
          }
        } else {
          count = 0;
        }
      }
    }

    // Move in to find speech
    // To handle case where speech recognition ended late
    let startSample: number | null = null;
    for(let i = startSearchSample; i <= endSearchSample; i++) {
      const value = envelopeChannel[i];
      if(value >= speechThreshold) {
        startSample = i;
        break;
      }
    }

    let endSample: number | null = null;
    for(let i = endSearchSample; i >= startSearchSample; i--) {
      const value = envelopeChannel[i];
      if(value >= speechThreshold) {
        endSample = i;
        break;
      }
    }

    // Move out to find silence
    // To handle case where speech has slow ramp in/out
    if(startSample) {
      let count = 0;
      for(let i = startSample; i >= startSearchSample; i--) {
        const value = envelopeChannel[i];
        if(value <= silenceThreshold) {
          count++;
          if(count > silenceCount) {
            startSample = i;
            break;
          }
        } else {
          count = 0;
        }
      }
    }
    
    if(endSample) {
      let count = 0;
      for(let i = endSample; i <= endSearchSample; i++) {
        const value = envelopeChannel[i];
        if(value <= silenceThreshold) {
          count++;
          if(count > silenceCount) {
            endSample = i;
            break;
          }
        } else {
          count = 0;
        }
      }
    }

    const startSecs = startSample === null ? originalStartSecs - 0.5 : startSample / sampleRate;
    const endSecs = endSample === null ? originalEndSecs - 0.25 : endSample / sampleRate + 0.05;
    const duration = endSecs - startSecs;

    return {
      type: "AUDIO",
      idx: token.idx,
      start: startSecs,
      duration: duration,
      buffer: buffer,
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
    if (token.type === "PAUSE" || token.type === "PARAGRAPH") {
      timeOffset += token.duration;
    } else {
      const finishTimeOffset = timeOffset + token.duration;
      if(timeOffset >= startTime) {
        playBuffer(ctx, currentTime + timeOffset - startTime, token);
      } else if (finishTimeOffset > startTime) {
        const additionalOffset = startTime - timeOffset;
        playBuffer(ctx, undefined, token, additionalOffset);
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

  if (newOffset >= duration) {
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
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

  return await postProcessAudio(audioBuffer);
}

function playBuffer(ctx: BaseAudioContext, when: number | undefined, token: AudioToken, offset: number = 0) {
  const duration = token.duration - offset;

  const sourceNode = ctx.createBufferSource();
  sourceNode.buffer = token.buffer;
  sourceNode.start(when, token.start + offset, duration);

  const gainNode = ctx.createGain();
  if(when === undefined) {
    gainNode.gain.value = 1;
  } else {
    gainNode.gain.value = 0;
    gainNode.gain.setValueAtTime(0, when);
    gainNode.gain.linearRampToValueAtTime(1, when + 0.05);
    gainNode.gain.linearRampToValueAtTime(1, when + duration - 0.05);
    gainNode.gain.linearRampToValueAtTime(0, when + duration);
  }
  
  sourceNode.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  token.stop = () => sourceNode.stop();
}

export async function save(tokens: EditorToken[]) {
  const duration: number = tokens.map(token => {
    return token.duration;
  }).reduce((a,b) => a+b, 0);
  const ctx = new OfflineAudioContext({sampleRate, length: duration * sampleRate});

  let currentTime = 0;
  tokens.forEach((token) => {
    if (token.type === "PAUSE" || token.type === "PARAGRAPH") {
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

export async function toEnvelope(buffer: AudioBuffer): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext({sampleRate, length: buffer.length, numberOfChannels: 1});
  await ctx.audioWorklet.addModule("customAudio.js");

  const bufferSource = ctx.createBufferSource();
  bufferSource.buffer = buffer;
  bufferSource.start();

  const bandPass = ctx.createBiquadFilter();
  bandPass.type = "bandpass";
  bandPass.frequency.value = (300 + 3000) / 2;
  bandPass.Q.value = 0.351364184463;
  bufferSource.connect(bandPass);
  
  const absolute = new AudioWorkletNode(ctx, "absolute");
  bandPass.connect(absolute);

  const mean = new AudioWorkletNode(ctx, "mean");
  absolute.connect(mean);
  mean.connect(ctx.destination);

  return await ctx.startRendering();
}

async function postProcessAudio(buffer: AudioBuffer): Promise<AudioBuffer> {
  let maxVolume = 0;
  for(let channelIdx = 0; channelIdx < buffer.numberOfChannels; channelIdx++) {
    const channel = buffer.getChannelData(channelIdx);
    for(let i = 0; i < channel.length; i++) {
      maxVolume = Math.max(maxVolume, Math.abs(channel[i]));
    }
  }
  const gain = 0.8/maxVolume;

  const ctx = new OfflineAudioContext({sampleRate, length: buffer.length});

  const bufferSource = ctx.createBufferSource();
  bufferSource.buffer = buffer;
  bufferSource.start();

  const lowShelf = ctx.createBiquadFilter();
  lowShelf.type = "lowshelf";
  lowShelf.frequency.value = 10;
  lowShelf.gain.value = -100;
  bufferSource.connect(lowShelf);

  const gainNode = ctx.createGain();
  gainNode.gain.value = gain;
  lowShelf.connect(gainNode);
  gainNode.connect(ctx.destination);

  return await ctx.startRendering();
}