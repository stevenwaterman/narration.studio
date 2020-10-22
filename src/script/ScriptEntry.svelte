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
  textarea {
    width: 100%;
    height: 50%;
    padding: 12px;
  }
</style>

<textarea bind:value={script} placeholder="Paste your script in here"/>
<button on:click={submit}>Submit</button>