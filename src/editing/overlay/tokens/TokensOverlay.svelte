<script lang="ts">
  import type { EditorToken } from "../../../tokens";
  import AudioTokenOverlay from "./AudioTokenOverlay.svelte";
  import SilenceTokenOverlay from "./SilenceTokenOverlay.svelte";

  export let tokens: EditorToken[];
  export let pixelsPerSecond: number;
  export let scroll: number;
  export let audioDuration: number;
  export let canvasBounds: {start: number; end: number};
  export let setToken: (token: EditorToken) => void;

  function toStartTokens(tokens: EditorToken[], {start, end}: {start: number; end: number}): Array<{token: EditorToken; left: number}> {
    let timecode = 0;
    const output: Array<{token: EditorToken; left: number}> = [];
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

  let startTokens: Array<{token: EditorToken; left: number}>;
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