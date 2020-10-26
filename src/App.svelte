<script lang="ts">
  import { canLoad } from "./editing/persistence";
  import LoadedSetup from "./LoadedSetup.svelte";
  import NewSetup from "./NewSetup.svelte";

  let loadFromSave: boolean | null = null;
</script>

<style>
  .column {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    height: 100%;
    width: 100%;
  }
</style>

<div class="column">
  {#if loadFromSave === null}
    <h1>Narration.studio</h1>
    {#await canLoad()}
      Checking for save data
    {:then dataExists}
      {#if dataExists}
        <h2>Saved data found</h2>
        <div class="buttonRow">
          <button on:click={() => loadFromSave = false}>Start Again</button>
          <button on:click={() => loadFromSave = true}>Load from Save</button>
        </div>
      {:else}
        <h2>No saved data found</h2>
        <div class="buttonRow">
          <button on:click={() => loadFromSave = false}>Start New</button>
        </div>
      {/if}
    {:catch error}
      {error}
    {/await}
  {:else if loadFromSave}
    <LoadedSetup/>
  {:else}
    <NewSetup/>
  {/if}
</div>
