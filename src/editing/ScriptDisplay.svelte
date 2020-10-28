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

  type DisplayToken = {idx: number; timestamp?: {start: number; end: number;}; raw: string;};

  function toDisplayTokens(tokens: EditorToken[]): DisplayToken[] {
    const output: DisplayToken[] = [];
    let time = 0;
    tokens.forEach(token => {
      if(token.type === "NOTHING") {
        output.push({
          idx: token.idx,
          raw: token.raw
        });
      } else {
        if(token.type === "PARAGRAPH") {
          output.push({
            idx: token.idx,
            raw: token.raw,
            timestamp: {
              start: time,
              end: time + token.duration
            }
          });
        } else if(output.length){
          const last = output[output.length - 1];
          if(last.timestamp !== undefined) {
            last.timestamp.end += token.duration;
          }
        }

        time += token.duration;
      }
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

  function between(currentTime: number | null, timestamp: {start: number; end: number;} | undefined): boolean {
    if (currentTime === null) return false;
    if (timestamp === undefined) return false;
    if (timestamp.start > currentTime) return false;
    if (timestamp.end <= currentTime) return false;
    return true;
  }
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
    margin-top: 20px;
    margin-bottom: 20px;
  }
</style>

<div class="container">
  {#each displayTokens as {idx, raw, timestamp} (idx)}
    {#if timestamp}
      <ScriptTimestamp time={timestamp.start}/>
    {/if}
    
    {#if between(currentTime, timestamp)}
      <div class="highlighted" bind:this={highlightedDiv}>{raw}</div>
    {:else}
      <div>{raw}</div>
    {/if}
  {/each}
</div>