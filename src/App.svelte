<script lang="ts">
  import AudioRecorder from "./AudioRecorder.svelte";
  import Processing from "./Processing.svelte";
  import ScriptEntry from "./ScriptEntry.svelte";

  let lines: string[] = [];
  let submitted: boolean = false;
  function submit() {
    submitted = true;
  }

  let times: Array<{start: number; end: number}> = [];
  let data: Blob | null = null;
</script>

{#if !submitted}
  <ScriptEntry bind:lines/>
  <button on:click={submit}>Submit</button>
{:else if data === null}
  <AudioRecorder lines={lines} bind:times bind:data/>
{:else}
  <Processing times={times} data={data}/>
{/if}