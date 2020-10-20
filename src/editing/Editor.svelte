<script lang="ts">
  import { play, save, stop } from "./processor";
  import type { DrawToken, EditorToken } from "../tokens";
  import RenderController from "./canvas/renderController";
  import Timestamps from "./overlay/Timestamps.svelte";
import PlayCursor from "./overlay/PlayCursor.svelte";

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

  let timelineWidth: number;
  let timelineWidthSecs: number;
  $: timelineWidthSecs = (timelineWidth || 0) / pixelsPerSecond;

  $: canvas && controller && controller.update(drawTokens, scroll, pixelsPerSecond, canvas.clientWidth, canvas.clientHeight);
  
  let duration: number;
  $: duration = drawTokens.map(token => token.duration).reduce((a,b) => a+b, 0);

  function setScroll(value: number) {
    if (!canvas) return;
    const widthPx = canvas.clientWidth;
    const widthSecs = widthPx / pixelsPerSecond;
    const minScroll = -0.9 * widthSecs;
    const maxScroll =  duration - 0.1 * widthSecs;
    scroll = Math.min(Math.max(minScroll, value), maxScroll)
  }

  let dragging: {
    startMouse: number;
    startScroll: number;
  } | null;
  function startDrag(event: MouseEvent) {
    dragging = {startMouse: event.offsetX, startScroll: scroll};
  }
  function endDrag(event: MouseEvent) {
    dragging = null;
  }
  function drag(event: MouseEvent) {
    if(dragging) {
      const x = event.offsetX;
      const dragPx = dragging.startMouse - x;
      const dragSec = dragPx / pixelsPerSecond;
      setScroll(dragging.startScroll + dragSec);
    }
  }
  function onWheel({deltaX, deltaY, offsetX, shiftKey}: WheelEvent) {
    const oldMouseSecs = offsetX / pixelsPerSecond;
    if (shiftKey) {
      if (deltaY) setScroll(scroll + deltaY / pixelsPerSecond);
    } else {
      if (deltaY < 0) pixelsPerSecond *= 1.1;
      if (deltaY > 0) pixelsPerSecond /= 1.1;
    }
    if (deltaX) setScroll(scroll - deltaX / pixelsPerSecond)
    
    const newMouseSecs = offsetX / pixelsPerSecond;
    const requiredScrolling = oldMouseSecs - newMouseSecs;
    setScroll(scroll + requiredScrolling);
  }
</script>

<style>
  .container {
    position: relative;
    height: 300px;
  }

  canvas {
    position: absolute;
    top: 30px;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    cursor: ew-resize;
    z-index: 0;
  }
</style>

<button on:click={() => startAudio()}>Start</button>
<button on:click={() => stop(tokens)}>Stop</button>
<button on:click={() => save(tokens)}>Save</button>

<div class="container">
  <PlayCursor bind:scroll duration={duration} timelineWidthSecs={timelineWidthSecs}/>
  <Timestamps scroll={scroll} pixelsPerSecond={pixelsPerSecond} duration={duration} on:play={e => startAudio(e.detail)}/>
  <canvas 
  bind:this={canvas}
  bind:clientWidth={timelineWidth}
  on:mousedown|preventDefault={startDrag} 
  on:mouseup|preventDefault={endDrag}
  on:mouseout|preventDefault={endDrag} 
  on:mousemove={drag}
  on:wheel|preventDefault={onWheel}
  />
</div>