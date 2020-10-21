<script lang="ts">
  import { audioStatusStore } from "../processor";

  export let duration: number;
  export let scroll: number;
  export let timelineWidthSecs: number;
  export let pixelsPerSecond: number;

  let offset: number = 0;
  let startTime: number | undefined;
  function animate(timestamp: number) {
    if (duration <= offset) return;
    if (startTime === undefined) startTime = timestamp;
    
    const timeDelta = (timestamp - startTime) / 1000;
    const animationDuration = duration - offset;
    const timeFrac = timeDelta / animationDuration;
    scroll = offset + timeFrac * animationDuration - timelineWidthSecs / 2;

    if(state === "PLAYING") {
      if (timeDelta < animationDuration) requestAnimationFrame(animate);
      else audioStatusStore.set({type: "STOPPED"});
    }

    if (state !== "PLAYING") {
      startTime = undefined;
    }
  }

  let pauseOffset: number = 0;
  let pauseLeft: number;
  $: pauseLeft = (pauseOffset - scroll) * pixelsPerSecond;

  let state: "PLAYING" | "PAUSED" | "STOPPED" = "STOPPED";
  audioStatusStore.subscribe(status => {
    state = status.type;
    if (status.type === "PLAYING") {
      offset = status.offset;
      requestAnimationFrame(animate);
    } else if (status.type === "PAUSED") {
      pauseOffset = status.offset;
    }
  });
</script>

<style>
  .playLine {
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

  .pauseLine {
    position: absolute;
    width: 1px;
    top: 30px;
    bottom: 0;
    transform: translateX(-50%);
    background-color: red;
    pointer-events: none;
    z-index: 2;
  }
</style>

{#if state === "PLAYING"}
  <div class="playLine"/>
{:else if state === "PAUSED"}
  <div class="pauseLine" style={`left: ${pauseLeft}px;`}/>
{/if}