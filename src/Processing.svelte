<script lang="ts">
  import {process} from "./processor";
  import type { ProcessingToken } from "./tokens";
  export let tokens: ProcessingToken[];
  export let data: Blob;
</script>
Hello
{#await process(tokens, data)}
  Processing
{:then audio}
  Done!
{:catch error}
  {error}
{/await}