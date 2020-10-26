<script lang="ts">
  import { processRawAudio, createEditorTokens } from "./processor";
  import type { ProcessingToken } from "../tokens";
  import Editor from "./Editor.svelte";
  import { saveAudio, saveTokens } from "./persistence";

  export let tokens: ProcessingToken[];
  export let data: Blob;

  saveAudio(data);
</script>
{#await processRawAudio(data)}
  Processing Microphone Audio...
{:then buffer}
  <Editor tokens={createEditorTokens(tokens, buffer)} {buffer}/>
{:catch error}
  {error}
{/await}