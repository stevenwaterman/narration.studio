<script lang="ts">
  import { processRawAudio, createEditorTokens } from "./processor";
  import type { ProcessingToken } from "../tokens";
  import Editor from "./Editor.svelte";
  import { saveAudio, saveTokens } from "./persistence";

  export let processingTokens: ProcessingToken[];
  export let data: Blob;

  saveAudio(data);
</script>

{#await processRawAudio(data)}
  <h2>Processing Microphone Audio...</h2>
{:then buffer}
  {#await createEditorTokens(processingTokens, buffer)}
    <h2>Processing Timings...</h2>
  {:then tokens}
    {#await Promise.all([saveAudio(data), saveTokens(tokens)])}
      <h2>Saving...</h2>
    {:then _}
      <Editor {tokens} {buffer}/>
    {:catch error}
      <h2>{error}</h2>
    {/await}
  {:catch error}
    <h2>{error}</h2>
  {/await}
{:catch error}
  <h2>{error}</h2>
{/await}
