<script lang="ts">
import { dragStart } from "../../../drag";

  import type { PauseToken } from "../../../tokens";

  export let pixelsPerSecond: number;
  export let token: PauseToken;

  let width: number;
  $: width = token.duration * pixelsPerSecond;

  function drag(delta: number, startDuration: number) {
    const draggedSeconds = delta / pixelsPerSecond;
    token.duration = Math.max(0.1, startDuration + draggedSeconds);
  }
</script>

<style>
  div {
    flex-grow: 0;
    flex-shrink: 0;
    border-top: 1px solid black;
    border-bottom: 1px solid black;
    cursor: e-resize;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    overflow: hidden;
  }
</style>

<div style={`width: ${width}px;`} on:mousedown|preventDefault={dragStart({
  button: "RIGHT", 
  onDrag: drag, 
  otherInfoGetter: () => token.duration, 
  onEnd: () => {} 
})}>
  {token.duration.toFixed(2)}s
</div> 