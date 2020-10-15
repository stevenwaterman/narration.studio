<script lang="ts">
  import { play, save, stop } from "./processor";
  import type { EditorToken } from "../tokens";
  import { drawWaveform } from "./render";
  import EditorSnippet from "./EditorSnippet.svelte";

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
</script>

<style>
  .timeline {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    height: 200px;
    overflow-x: scroll;
  }
</style>

<button on:click={() => play(tokens)}>Start</button>
<button on:click={() => stop(tokens)}>Stop</button>
<button on:click={() => save(tokens)}>Save</button>

<div class="timeline">
  {#each tokens as token (token.idx)}
    <EditorSnippet bind:token waveform={waveform} zoom={zoom}/>
  {/each}
</div>
