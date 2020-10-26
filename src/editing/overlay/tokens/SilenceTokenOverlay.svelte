<script lang="ts">
  import { dragStart } from "../../../drag";
  import { fade } from "svelte/transition";
  import type { SilenceToken } from "../../../tokens";

  export let pixelsPerSecond: number;
  export let token: SilenceToken;
  export let left: number;
  export let setToken: (token: SilenceToken) => void;

  let width: number;
  $: width = token.duration * pixelsPerSecond;

  function drag(delta: number, startDuration: number) {
    const draggedSeconds = delta / pixelsPerSecond;
    token.duration = Math.max(0.1, startDuration + draggedSeconds);
    setToken(token);
  }

  let showTime: boolean = false;
</script>

<style>
  .silenceTokenContainer {
    cursor: e-resize;
    display: flex;
    position: absolute;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    overflow: hidden;
    height: 100%;
  }
</style>

{#if width > 10}
  <div class="silenceTokenContainer" style={`width: ${width}px; left: ${left}px`} on:mousedown|preventDefault={dragStart({
    button: "RIGHT", 
    onDrag: drag, 
    otherInfoGetter: () => {showTime = true; return token.duration}, 
    onEnd: () => {showTime = false}
  })}>
    {#if showTime}
      <div transition:fade>{token.duration.toFixed(2)}s</div>
    {/if}
  </div> 
{/if}