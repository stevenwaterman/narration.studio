<script lang="ts">
  import { play, save, stop } from "./processor";
  import type { EditorToken } from "../tokens";

  export let tokens: EditorToken[];
</script>

<button on:click={() => play(tokens)}>Start</button>
<button on:click={() => stop(tokens)}>Stop</button>
<button on:click={() => save(tokens)}>Save</button>

