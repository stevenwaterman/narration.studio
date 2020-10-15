<script lang="ts">
  import type { EditorToken } from "../tokens";
  import EditorAudio from "./EditorAudio.svelte";
  import EditorPause from "./EditorPause.svelte";

  export let zoom: number;
  export let token: EditorToken;
  export let waveform: ImageBitmap;
</script>

{#if token.type === "AUDIO"}
  <EditorAudio bind:token waveform={waveform} zoom={zoom}/>
{:else}
  <EditorPause bind:token zoom={zoom}/>
{/if}