<script lang="ts">
  import type { EditorToken } from "../../../tokens";
  import AudioTokenOverlay from "./AudioTokenOverlay.svelte";
  import PauseTokenOverlay from "./PauseTokenOverlay.svelte";

  export let tokens: EditorToken[];
  export let pixelsPerSecond: number;
  export let scroll: number;
  export let audioDuration: number;

  let left: number;
  $: left = -scroll * pixelsPerSecond;
</script>

<style>
  .container {
    position: absolute;
    top: 30px;
    bottom: 0;
    display: flex;
    flex-direction: row;
    z-index: 1;
    transform: translateX(50vw);
  }
</style>

<div class="container" style={`left: ${left}px;`}>
  {#each tokens as token}
    {#if token.type === "AUDIO"}
      <AudioTokenOverlay bind:token pixelsPerSecond={pixelsPerSecond} audioDuration={audioDuration}/>
    {:else}
      <PauseTokenOverlay bind:token pixelsPerSecond={pixelsPerSecond}/>
    {/if}
  {/each}
</div>