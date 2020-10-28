<script lang="ts">
  import type { TextToken, ScriptToken, TimingToken, ProcessingToken, SilenceToken } from "./tokens";

  import AudioRecorder from "./recording/AudioRecorder.svelte";
  import AudioProcessor from "./editing/AudioProcessor.svelte";
  import ScriptEntry from "./script/ScriptEntry.svelte";

  let tokens: ScriptToken[] = [];

  let textTokens: TextToken[];
  $: textTokens = tokens.filter(token => token.type === "TEXT") as TextToken[];

  let silenceTokens: SilenceToken[];
  $: silenceTokens = tokens.filter(token => token.type === "PAUSE" || token.type === "PARAGRAPH") as SilenceToken[];

  let timingTokens: TimingToken[] = [];
  let data: Blob | null = null;

  let processingTokens: ProcessingToken[];
  $: processingTokens = [...timingTokens, ...silenceTokens].sort((a,b) => a.idx - b.idx);
</script>

{#if !tokens.length}
  <ScriptEntry bind:tokens/>
{:else if data === null}
  <AudioRecorder {textTokens} bind:timingTokens bind:data/>
{:else}
  <AudioProcessor {processingTokens} {data}/>
{/if}