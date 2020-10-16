<script lang="ts">
  import { play, sampleRate, save, stop } from "./processor";
  import type { AudioToken, DrawToken, EditorToken } from "../tokens";
  import EditorSnippet from "../../tmp/EditorSnippet.svelte";
  import Timestamps from "./Timestamps.svelte";
  import PlayCursor from "./PlayCursor.svelte";
  import RenderController from "./timeline/renderController";

  export let tokens: EditorToken[];
  export let buffer: AudioBuffer;

  let pixelsPerSecond: number = 200;

  let duration: number;
  $: duration = tokens.map(t => t.duration).reduce((a,b) => a + b, 0);

  function startAudio(startTime?: number) {
    play(tokens, startTime || 0);
  }

  let cursorPosition: number | null;

  function stopOnChange(tokens: EditorToken[]) {
    stop(tokens);
  }

  $: stopOnChange(tokens);

  let canvas: HTMLCanvasElement | undefined;
  let offscreen: OffscreenCanvas | undefined;
  $: offscreen = canvas ? canvas.transferControlToOffscreen() : undefined;
  let controller: RenderController | undefined;
  $: controller = offscreen ? new RenderController(offscreen, buffer) : undefined;

  let drawTokens: DrawToken[];
  $: drawTokens = tokens.map(token => {
    if(token.type === "PAUSE") return token;
    return {
      type: "WAVE",
      start: token.offset,
      duration: token.duration,
      raw: token.raw,
      idx: token.idx
    }
  })

  $: controller && controller.update(drawTokens, pixelsPerSecond);
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
  <canvas height={300} width={1000} bind:this={canvas}/>
</div>

<!-- <div class="container">
  <div class="spacer"/>
  <div class="timeline">
    <Timestamps duration={duration} pixelsPerSecond={pixelsPerSecond} on:play={e => startAudio(e.detail)} bind:cursorPosition/>
    <div class="overlays">
      <div class="snippets">
        {#each tokens as token (token.idx)}
          <EditorSnippet bind:token waveform={waveform} pixelsPerSecond={pixelsPerSecond}/>
        {/each}
      </div>
      <div class="cursorContainer">
        {#if cursorPosition !== null}
          <div class="cursor" style={`left: ${cursorPosition}px`}/>
        {/if}
      </div>
      <PlayCursor duration={duration} pixelsPerSecond={pixelsPerSecond}/>
    </div>
  </div>
  <div class="spacer"/>
</div> -->
