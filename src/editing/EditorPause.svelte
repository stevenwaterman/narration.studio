<script lang="ts">
  import type { PauseToken } from "../tokens";

  export let zoom: number;
  export let token: PauseToken;

  let width: number;
  $: width = token.duration * zoom;

  let dragStart: {mouse: number, duration: number} | null = null;

  function startDrag(event: MouseEvent) {
    dragStart = {mouse: event.screenX, duration: token.duration};
  }

  function endDrag(event: MouseEvent) {
    dragStart = null;
  }

  function drag(event: MouseEvent) {
    if (dragStart === null) return;

    const dragEnd = event.screenX;
    const draggedPixels = dragEnd - dragStart.mouse;
    const draggedSeconds = draggedPixels / zoom;
    const newDelay = dragStart.duration + draggedSeconds;
    token.duration = Math.max(0.1, newDelay);
  }
</script>

<style>
  div {
    flex-grow: 0;
    flex-shrink: 0;
    border: 1px solid black;
    cursor: e-resize;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>

<div style={`width: ${width}px;`} on:mousedown|preventDefault={startDrag} on:mouseup|preventDefault={endDrag} on:mouseout={endDrag} on:mousemove={drag}>
  {token.duration.toFixed(2)}s
</div> 