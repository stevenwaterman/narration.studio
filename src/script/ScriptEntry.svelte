<script lang="ts">
  import type { ScriptToken } from "../tokens";
  import { computeScriptTokens } from "./tokenizer";

  let script: string = "";

  function submit() {
    tokens = computeScriptTokens(script);
  }

  export let tokens: ScriptToken[];
</script>

<style>
  .column {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  textarea {
    width: 90%;
    flex-grow: 1;
    flex-shrink: 1;
    margin: 12px;
    padding: 12px;
  }
</style>

<div class="column">
  <h1>Narration.studio</h1>
  <textarea bind:value={script} placeholder="Paste your script in here (supports markdown)"/>
  <button on:click={submit}>Submit</button>
</div>
