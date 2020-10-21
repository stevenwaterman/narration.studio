<script lang="ts">
  import type { TextToken, ScriptToken, TimingToken, ProcessingToken, PauseToken } from "./tokens";

  import AudioRecorder from "./recording/AudioRecorder.svelte";
  import AudioProcessor from "./editing/AudioProcessor.svelte";
  import ScriptEntry from "./script/ScriptEntry.svelte";

  let tokens: ScriptToken[] = [];

  let textTokens: TextToken[];
  $: textTokens = tokens.filter(token => token.type === "TEXT") as TextToken[];

  let pauseTokens: PauseToken[];
  $: pauseTokens = tokens.filter(token => token.type === "PAUSE") as PauseToken[];

  let submitted: boolean = false;
  function submit() {
    submitted = true;
  }

  let timingTokens: TimingToken[] = [];
  let data: Blob | null = null;

  let processingTokens: ProcessingToken[];
  $: processingTokens = [...timingTokens, ...pauseTokens].sort((a,b) => a.idx - b.idx);
</script>

<style>
  :global(body) {
    overflow: hidden;
    padding: 0;
  }
</style>

{#if !submitted}
  <ScriptEntry bind:tokens/>
  <button on:click={submit}>Submit</button>
{:else if data === null}
  <AudioRecorder textTokens={textTokens} bind:timingTokens bind:data/>
{:else}
  <AudioProcessor tokens={processingTokens} data={data}/>
{/if}