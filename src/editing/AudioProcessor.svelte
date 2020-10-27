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
  Processing Microphone Audio...
{:then buffer}
  {#await createEditorTokens(processingTokens, buffer)}
    Processing Timings...
  {:then tokens}
    {#await Promise.all([saveAudio(data), saveTokens(tokens)])}
      Saving...
    {:then _}
      <Editor {tokens} {buffer}/>
    {:catch error}
      {error}
    {/await}
  {:catch error}
    {error}
  {/await}
{:catch error}
  {error}
{/await}