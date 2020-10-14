<script lang="ts">
  import type { TextToken, ScriptToken, TimingToken, ProcessingToken, PauseToken } from "./tokens";

  import AudioRecorder from "./AudioRecorder.svelte";
  import Processing from "./Processing.svelte";
  import ScriptEntry from "./ScriptEntry.svelte";

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

{#if !submitted}
  <ScriptEntry bind:tokens/>
  <button on:click={submit}>Submit</button>
{:else if data === null}
  <AudioRecorder textTokens={textTokens} bind:timingTokens bind:data/>
{:else}
  <Processing tokens={processingTokens} data={data}/>
{/if}