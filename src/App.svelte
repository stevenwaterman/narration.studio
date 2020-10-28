<script lang="ts">
  import { canLoad } from "./editing/persistence";
  import LoadedSetup from "./LoadedSetup.svelte";
  import NewSetup from "./NewSetup.svelte";
  import Bowser from "bowser";
  import Guide from "./Guide.svelte";

  const browser = Bowser.getParser(window.navigator.userAgent);
  const isValidBrowser: boolean = browser.satisfies({
    chrome: ">=69"
  }) || false;

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

  .unsupported {
    color: red;
  }

  .explanation {
    max-width: 600px;
    margin-left: 100px;
    margin-right: 100px;
    text-align: center;
    font-size: 16px;
  }

  :global(body) {
    overflow: hidden;
    padding: 0;
  }

  :global(h1) {
    font-size: 36px;
    color: #444;
    margin-block-start: 0.2em;
    margin-block-end: 0.2em;
  }

  :global(h2) {
    font-size: 28px;
    color: #444;
  }

  :global(h3) {
    font-size: 20px;
    color: #444;
  }

  :global(button) {
    font-size: 20px;
    background-color: lightskyblue;
    border: none;
    border-radius: 10px;
    padding: 10px;
  }

  :global(button:disabled) {
    font-size: 20px;
    background-color: lightsteelblue;
    border: none;
    border-radius: 10px;
    padding: 10px;
  }

  .clickable {
    cursor: pointer;
  }

  .github {
    position: fixed;
    top: 10px;
    left: 10px;
    color: lightskyblue;
  }

  .plug {
    position: fixed;
    top: 10px;
    right: 10px;
    color: lightskyblue;
  }
</style>

<span class="github"><a href="https://github.com/stevenwaterman/narration.studio">View the Source on GitHub</a></span>
<span class="plug"><a href="https://www.stevenwaterman.uk">by Steven Waterman</a></span>

<div class="column">
  <h1 class:clickable={loadFromSave !== null} on:click={() => {loadFromSave = null;}}>Narration.studio</h1>
  {#if isValidBrowser}
    {#if loadFromSave === null}
      {#await canLoad()}
        <h2>Checking for save data</h2>
      {:then dataExists}
        {#if dataExists}
          <h2>Welcome Back!</h2>
          <h2>Saved data found</h2>
          <div class="buttonRow">
            <button on:click={() => loadFromSave = false}>Start Again</button>
            <button on:click={() => loadFromSave = true}>Load from Save</button>
          </div>
        {:else}
          <Guide/>
          <div class="buttonRow">
            <button on:click={() => loadFromSave = false}>Start</button>
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
  {:else}
    <h2 class="unsupported">Unsupported Browser</h2>
    <p class="explanation">
      You are using <strong>{browser.getBrowserName()} {browser.getBrowserVersion()}</strong>.
      Only <a href="https://www.google.com/chrome/">Google Chrome 69+</a> is supported.
    </p>
    <p class="explanation">
      Not in the sense that we haven't tested it, but in the sense that it legitimately won't work.
      We use lots of experimental APIs that only exist in Chrome.
      Trust me, I'm a Firefox user and normally ignore these.
    </p>
    <h2>Sorry!</h2>
  {/if}
</div>
