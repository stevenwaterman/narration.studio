<script lang="ts">
  import type { DrawToken } from "../tokens";
  import { audioStatusStore } from "./processor";

  export let tokens: DrawToken[];
  export let scroll: number;
  export let timelineWidthSecs: number;

  export let cursorPositionSeconds: number | null;
  
  let playing: boolean;
  $: playing = $audioStatusStore.type === "PLAYING";

  let playingCursorPositionSeconds: number | null;
  $: playingCursorPositionSeconds = playing ? scroll + timelineWidthSecs / 2 : null;

  let currentTime: number | null;
  $: currentTime = playingCursorPositionSeconds === null ? cursorPositionSeconds : playingCursorPositionSeconds;

  type ScriptToken = {idx: number; start: number; end: number; raw: string};

  function toScriptTokens(tokens: DrawToken[]): ScriptToken[] {
    const output: ScriptToken[] = [];
    let time = 0;
    tokens.forEach(token => {
      output.push({
        idx: token.idx,
        start: time,
        end: time + token.duration,
        raw: token.raw
      });
      time += token.duration;
    })
    return output;
  }

  let scriptTokens: ScriptToken[];
  $: scriptTokens = toScriptTokens(tokens);

  let highlightedDiv: HTMLDivElement | undefined = undefined;
  $: highlightedDiv && highlightedDiv.scrollIntoView({
    block: "nearest"
  })
</script>

<style>
  .highlighted {
    background-color: rgba(255, 255, 0, 0.5);
  }

  p {
    width: 1000px;
    padding: 10px;
    overflow-y: scroll;
    border: 1px solid black;
  }

  div {
    display: inline;
    white-space: pre;
  }
</style>

<p>
  {#each scriptTokens as token (token.idx)}
    {#if currentTime !== null && currentTime >= token.start && currentTime < token.end}
      <div class="highlighted" bind:this={highlightedDiv}>{token.raw}</div>
    {:else}
      <div>{token.raw}</div>
    {/if}
  {/each}
</p>
