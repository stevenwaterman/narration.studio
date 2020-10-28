<script lang="ts">
  import Editor from "./editing/Editor.svelte";
  import { load } from "./editing/persistence";
</script>

{#await load()}
  <h2>Loading save</h2>
{:then data}
  <Editor tokens={data.tokens} buffer={data.audio}/>
{:catch error}
  <h2>{error}</h2>
{/await}
