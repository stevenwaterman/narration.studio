<script lang="ts">
  let script: string = "";

  let lines: string[];
  $: lines = script.split(/[\n.]/);

  let filtered: string[];
  $: filtered = lines
    .filter(line => line.trim().replace(/[^a-zA-Z]/g, "").length);

  export let scriptLines: string[];
  $: scriptLines = filtered;
</script>

<style>
  textarea {
    width: 100%;
    height: 50%;
  }
</style>

<p>Script:</p>
<textarea bind:value={script}/>

<ol>
  {#each scriptLines as line}
    <li>{line}</li>
  {/each}
</ol>