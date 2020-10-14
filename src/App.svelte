<script lang="ts">
  import AudioRecorder from "./AudioRecorder.svelte";
  import Processing from "./Processing.svelte";
  import ScriptEntry from "./ScriptEntry.svelte";

  let scriptLines: string[] = [];
  let submitted: boolean = false;
  function submit() {
    submitted = true;
  }

  let times: Array<{start: number; end: number}> = [];
  let data: Blob | null = null;
</script>

{#if !submitted}
  <ScriptEntry bind:scriptLines/>
  <button on:click={submit}>Submit</button>
{:else if data === null}
  <AudioRecorder lines={scriptLines} bind:times bind:data/>
{:else}
  <Processing times={times} data={data}/>
{/if}