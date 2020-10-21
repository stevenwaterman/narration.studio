<script lang="ts">
  import type { DrawToken } from "../tokens";
  import { audioStatusStore } from "./processor";

  export let tokens: DrawToken[];
  export let scroll: number;
  export let timelineWidthSecs: number;

  export let cursorPositionSeconds: number | null;
  
  let playing: boolean;
  $: playing = $audioStatusStore !== null;

  let playingCursorPositionSeconds: number | null;
  $: playingCursorPositionSeconds = playing ? scroll + timelineWidthSecs / 2 : null;

  let currentTime: number | null;
  $: currentTime = playingCursorPositionSeconds === null ? cursorPositionSeconds : playingCursorPositionSeconds;

  type ScriptToken = {start: number; end: number; raw: string};

  function toScriptTokens(tokens: DrawToken[]): ScriptToken[] {
    const output: ScriptToken[] = [];
    let time = 0;
    tokens.forEach(token => {
      output.push({
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
</script>

<style>
  .highlighted {
    background-color: rgba(255, 255, 0, 0.5);
  }

  p {
    max-width: 1000px;
    padding: 10px;
  }
</style>

<p>
  {#each scriptTokens as token}
    <span class:highlighted={currentTime !== null && currentTime >= token.start && currentTime < token.end}>{token.raw}</span>
  {/each}
</p>
