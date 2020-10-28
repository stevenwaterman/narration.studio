<script lang="ts">
  import type { VisibleToken } from "../../../tokens";
  import AudioTokenOverlay from "./AudioTokenOverlay.svelte";
  import SilenceTokenOverlay from "./SilenceTokenOverlay.svelte";

  export let tokens: VisibleToken[];
  export let pixelsPerSecond: number;
  export let scroll: number;
  export let audioDuration: number;
  export let canvasBounds: {start: number; end: number};
  export let setToken: (token: VisibleToken) => void;

  function toStartTokens(tokens: VisibleToken[], {start, end}: {start: number; end: number}): Array<{token: VisibleToken; left: number}> {
    let timecode = 0;
    const output: Array<{token: VisibleToken; left: number}> = [];
    for(const token of tokens) {
      const newTimecode = timecode + token.duration;
      if(timecode >= end) return output;
      if(
        timecode >= start && timecode < end || 
        newTimecode > start && newTimecode < end || 
        timecode <= start && newTimecode >= end
      ) {
        output.push({
          token,
          left: (timecode - scroll) * pixelsPerSecond
        });
      }
      timecode = newTimecode;
    }
    return output;
  }

  let startTokens: Array<{token: VisibleToken; left: number}>;
  $: startTokens = toStartTokens(tokens, canvasBounds);
</script>

<style>
  .tokensContainer {
    position: absolute;
    top: 30px;
    bottom: 0;
    left: 0;
    right: 0;
    flex-direction: row;
    z-index: 1;
    transform: translateX(50vw);
  }
</style>

<div class="tokensContainer">
  {#each startTokens as {token, left}}
    {#if token.type === "AUDIO"}
      <AudioTokenOverlay {token} {pixelsPerSecond} {audioDuration} {left} {setToken}/>
    {:else}
      <SilenceTokenOverlay {token} {pixelsPerSecond} {left} {setToken}/>
    {/if}
  {/each}
</div>