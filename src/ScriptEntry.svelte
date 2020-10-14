<script lang="ts">
  let script: string = "";

  export let lines: string[];
  $: lines = script.split("\n");
</script>

<style>
  textarea {
    width: 100%;
    height: 50%;
  }
</style>

<p>Script:</p>
<textarea bind:value={script}/>