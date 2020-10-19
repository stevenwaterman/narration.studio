<script lang="ts">
  import { play, save, stop } from "./processor";
  import type { DrawToken, EditorToken } from "../tokens";
  import RenderController from "./timeline/renderController";

  export let tokens: EditorToken[];
  export let buffer: AudioBuffer;

  function startAudio(startTime?: number) {
    play(tokens, startTime || 0);
  }

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
  });

  let scroll: number = 0;
  let pixelsPerSecond: number = 200;

  $: canvas && controller && controller.update(drawTokens, scroll, pixelsPerSecond, canvas.clientWidth, canvas.clientHeight);
</script>

<style>
  .container {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    height: 300px;
  }

  canvas {
    width: 100%;
  }
</style>

<button on:click={() => startAudio()}>Start</button>
<button on:click={() => stop(tokens)}>Stop</button>
<button on:click={() => save(tokens)}>Save</button>

<div class="container">
  <canvas bind:this={canvas}/>
</div>

<input type="range" min="0" max="100" step="0.001" bind:value={scroll}/>
{scroll}

<br/>

<input type="range" min="10" max="1000" step="10" bind:value={pixelsPerSecond}/>
{pixelsPerSecond}