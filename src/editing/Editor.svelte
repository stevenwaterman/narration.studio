<script lang="ts">
  import { play, sampleRate, save, stop } from "./processor";
  import type { EditorToken } from "../tokens";
  import { drawWaveform } from "./render";
  import EditorSnippet from "./EditorSnippet.svelte";
import Timestamps from "./Timestamps.svelte";

  export let tokens: EditorToken[];
  export let buffer: AudioBuffer;

  function drawBaseCanvas(buffer: AudioBuffer): ImageBitmap {
    const firstChannel = buffer.getChannelData(0);
    const secondChannel = buffer.getChannelData(1);

    const samples = firstChannel.length;
    const waveform: {min: number; max: number;}[] = [];
    for(let i = 0; i < samples; i++) {
      const pixel = Math.floor(i / 100);
      const firstSample = firstChannel[i];
      const secondSample = secondChannel[i];
      
      const {min, max} = waveform[pixel] || {min: 1, max: -1};
      waveform[pixel] = {
        min: Math.min(min, firstSample, secondSample),
        max: Math.max(max, firstSample, secondSample)
      }
    }

    const max = Math.max(...waveform.flatMap(({min, max}) => [Math.abs(min), max]))
    const amplification = 1 / max;

    const amplified = waveform.map(({min, max}) => ({
      min: min * amplification ,
      max: max * amplification
    }));

    return drawWaveform(amplified, 1000);
  }

  let waveform: ImageBitmap;
  $: waveform = drawBaseCanvas(buffer);

  let zoom: number = 441;

  let duration: number;
  $: duration = tokens.map(t => t.duration).reduce((a,b) => a + b, 0);

  function startAudio(startTime?: number) {
    play(tokens, startTime || 0);
  }

  let cursorPosition: number | null;
</script>

<style>
  .container {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    overflow-x: scroll;
    height: 300px;
  }

  .timeline {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  .snippets {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    height: 100%;
  }

  .cursorContainer {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    pointer-events: none;
  }

  .spacer {
    width: 100vw;
    flex-grow: 0;
    flex-shrink: 0;
  }

  .overlays {
    position: relative;
    flex-shrink: 1;
    flex-grow: 1;
    min-height: 0;
  }

  .cursor {
    position: absolute;
    top: 0;
    bottom: 0;
    background-color: black;
    width: 2px;
  }
</style>

<button on:click={() => startAudio()}>Start</button>
<button on:click={() => stop(tokens)}>Stop</button>
<button on:click={() => save(tokens)}>Save</button>

<div class="container">
  <div class="spacer"/>
  <div class="timeline">
    <Timestamps duration={duration} zoom={zoom} on:play={e => startAudio(e.detail)} bind:cursorPosition/>
    <div class="overlays">
      <div class="snippets">
        {#each tokens as token (token.idx)}
          <EditorSnippet bind:token waveform={waveform} zoom={zoom}/>
        {/each}
      </div>
      <div class="cursorContainer">
        {#if cursorPosition !== null}
          <div class="cursor" style={`left: ${cursorPosition}px`}/>
        {/if}
      </div>
    </div>
  </div>
  <div class="spacer"/>
</div>
