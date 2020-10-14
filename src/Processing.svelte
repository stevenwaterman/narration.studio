<script lang="ts">
  import {process} from "./processor";
  export let times: Array<{start: number; end: number}>;
  export let data: Blob;
</script>
Hello
{#await process(times, data)}
  Processing
{:then audio}
  Done!
{:catch error}
  {error}
{/await}