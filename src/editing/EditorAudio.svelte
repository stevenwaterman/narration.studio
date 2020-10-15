<script lang="ts">
import { afterUpdate } from "svelte";

  import type { AudioToken } from "../tokens";

  export let zoom: number;
  export let token: AudioToken;
  export let waveform: ImageBitmap;

  let width: number;
  $: width = token.duration * zoom;

  let startPixel: number;
  $: startPixel = token.offset * zoom;

  let canvas: HTMLCanvasElement | undefined;

  afterUpdate(() => {
    canvas?.getContext("2d")?.drawImage(waveform, startPixel, 0, width, 1000, 0, 0, width, 1000);
  })
  
  let dragStart: {mouse: number, offset: number, duration: number, side: "LEFT" | "RIGHT"} | null = null;

  function startDrag(event: MouseEvent, side: "LEFT" | "RIGHT") {
    dragStart = {mouse: event.screenX, offset: token.offset, duration: token.duration, side};
  }

  function endDrag(event: MouseEvent) {
    dragStart = null;
  }

  function drag(event: MouseEvent) {
    if (dragStart === null) return;
    event.preventDefault();

    const dragEnd = event.screenX;
    const draggedPixels = dragEnd - dragStart.mouse;
    const draggedSeconds = draggedPixels / zoom;

    if (dragStart.side === "LEFT") {
      const newOffset = dragStart.offset - draggedSeconds;
      token.offset = newOffset;
    } else {
      const newDuration = dragStart.duration + draggedSeconds;
      token.duration = Math.max(0.1, newDuration);
    }
  }
</script>

<style>
  canvas {
    width: 100%;
    height: 100%;
    cursor: col-resize
  }

  .right {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 100px;
    cursor: e-resize;
    right: 0;
  }

  .right:hover {
    background-color: rgba(0, 0, 0, 0.2);
  }

  .container {
    position: relative;
    border: 1px solid black;
    flex-grow: 0;
    flex-shrink: 0
  }
</style>

<div class="container" style={`width:${width}px`}>
  <canvas bind:this={canvas} width={width} height={1000} on:mousedown|preventDefault={event => startDrag(event, "LEFT")} on:mouseup|preventDefault={endDrag} on:mouseout={endDrag} on:mousemove={drag}/>
  <div class="right" on:mousedown|preventDefault={event => startDrag(event, "RIGHT")} on:mouseup|preventDefault={endDrag} on:mouseout={endDrag} on:mousemove={drag}/>
</div>

