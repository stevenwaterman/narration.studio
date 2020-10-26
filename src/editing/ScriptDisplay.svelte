<script lang="ts">
  import type { EditorToken } from "../tokens";
  import { audioStatusStore } from "./processor";
  import ScriptTimestamp from "./ScriptTimestamp.svelte";

  export let tokens: EditorToken[];
  export let scroll: number;

  export let cursorPositionSeconds: number | null;
  
  let playing: boolean;
  $: playing = $audioStatusStore.type === "PLAYING";

  let playingCursorPositionSeconds: number | null;
  $: playingCursorPositionSeconds = playing ? scroll : null;

  let currentTime: number | null;
  $: currentTime = playingCursorPositionSeconds === null ? cursorPositionSeconds : playingCursorPositionSeconds;

  type DisplayToken = {idx: number; start: number; end: number; raw: string;};

  function toDisplayTokens(tokens: EditorToken[]): DisplayToken[] {
    const output: DisplayToken[] = [];
    let time = 0;
    tokens.forEach(token => {
      if(token.type === "PARAGRAPH") {
        output.push({
          idx: token.idx,
          start: time,
          end: time + token.duration,
          raw: token.raw,
        });
      } else {
        output[output.length - 1].end += token.duration;
      }
      
      time += token.duration;
    })
    return output;
  }

  let displayTokens: DisplayToken[];
  $: displayTokens = toDisplayTokens(tokens);

  let highlightedDiv: HTMLDivElement | undefined = undefined;
  $: highlightedDiv && highlightedDiv.scrollIntoView({
    block: "center",
    behavior: "auto"
  });
</script>

<style>
  .highlighted {
    background-color: rgba(255, 255, 0, 0.5);
  }

  .container {
    width: 1000px;
    padding: 10px;
    overflow-y: scroll;
    border: 1px solid black;
    flex-grow: 1;
    flex-shrink: 1;
    user-select: all;
    white-space: break-spaces;
  }
</style>

<div class="container">
  {#each displayTokens as token (token.idx)}
    <ScriptTimestamp time={token.start}/>
    
    {#if currentTime !== null && currentTime >= token.start && currentTime < token.end}
      <div class="highlighted" bind:this={highlightedDiv}>{token.raw}</div>
    {:else}
      <div>{token.raw}</div>
    {/if}
  {/each}
</div>
