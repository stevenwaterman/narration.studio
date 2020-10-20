<script lang="ts">
  import { create_in_transition } from "svelte/internal";
  import { audioStatusStore } from "../processor";

  export let duration: number;
  export let scroll: number;
  export let timelineWidthSecs: number;

  let offset: number = 0;
  let startTime: number | undefined;
  function animate(timestamp: number) {
    if (duration <= offset) return;
    if (startTime === undefined) startTime = timestamp;
    
    const timeDelta = (timestamp - startTime) / 1000;
    const animationDuration = duration - offset;
    const timeFrac = timeDelta / animationDuration;
    scroll = offset + timeFrac * animationDuration - timelineWidthSecs / 2;

    if(!hidden && timeDelta < animationDuration) requestAnimationFrame(animate);
    else {
      startTime = undefined;
      hidden = true;
    }
  }

  let hidden: boolean = true;
  audioStatusStore.subscribe(status => {
    hidden = status === null;
    if (status) {
      offset = status.offset;
      requestAnimationFrame(animate);
    }
  });
</script>

<style>
  .line {
    position: absolute;
    width: 1px;
    left: 50%;
    right: 50%;
    top: 30px;
    bottom: 0;
    transform: translateX(-50%);
    background-color: red;
    pointer-events: none;
    z-index: 2;
  }
</style>

{#if !hidden}
  <div class="line"/>
{/if}