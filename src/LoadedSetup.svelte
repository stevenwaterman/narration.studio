<script lang="ts">
  import Editor from "./editing/Editor.svelte";
  import { load } from "./editing/persistence";
</script>

{#await load()}
  Loading save
{:then data}
  <Editor tokens={data.tokens} buffer={data.audio}/>
{:catch error}
  {error}
{/await}
