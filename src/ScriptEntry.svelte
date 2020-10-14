<script lang="ts">
  import type { ScriptToken } from "./tokens";

  let script: string = "";

  let clean: string;
  $: clean = script
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/\n\r/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\. /g, ".\n")
    .replace(/\? /g, "?\n")
    .replace(/\! /g, "!\n")
    .replace(/; /g, ";\n");

  let lines: string[];
  $: lines = clean.split("\n");

  export let tokens: ScriptToken[];
  $: tokens = lines.map((line, idx) => {
    const lettersOnly = line.trim().toLowerCase().replace(/[^a-z]/g, "");
    if (lettersOnly) {
      return {
        type: "TEXT",
        script: line.trim(),
        raw: line,
        idx
      }
    } else {
      return {
        type: "PAUSE",
        delay: 0.7,
        raw: line,
        idx
      }
    }
  })
</script>

<style>
  textarea {
    width: 100%;
    height: 50%;
  }
</style>

<p>Script:</p>
<textarea bind:value={script}/>

<ol>
  {#each tokens as token}
    {#if token.type === "TEXT"}
      <li>{token.script}</li>
    {:else if token.type === "PAUSE"}
      <li>&lt;pause&gt;</li>
    {/if}
  {/each}
</ol>