<script lang="ts">
  import { processRawAudio, createEditorTokens } from "./processor";
  import type { ProcessingToken } from "../tokens";
  import Editor from "./Editor.svelte";

  export let tokens: ProcessingToken[];
  export let data: Blob;
</script>
{#await processRawAudio(data)}
  Processing Microphone Audio...
{:then audio}
  <Editor tokens={createEditorTokens(tokens, audio)} buffer={audio}/>
{:catch error}
  {error}
{/await}