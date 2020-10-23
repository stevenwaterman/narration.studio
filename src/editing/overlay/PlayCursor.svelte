<script lang="ts">
  import { audioStatusStore } from "../processor";

  export let duration: number;
  export let scroll: number;
  export let setScroll: (scroll: number) => void;
  export let pixelsPerSecond: number;

  let offset: number = 0;
  let animationDuration: number;
  let running: boolean = false;
  let startTime: number | undefined;
  
  function animateFirst(timestamp: number) {
    animationDuration = 1000 * (duration - offset);
    if (animationDuration <= 0) return;
    startTime = timestamp;

    if (!running) {
      running = true;
      animate(timestamp);
    }
  }

  function animate(timestamp: number) {
    const addedScroll = (timestamp - (startTime as number)) / 1000;
    setScroll(offset + addedScroll);

    if(state === "PLAYING" && offset + addedScroll < duration) requestAnimationFrame(animate);
    else {
      if (state === "PLAYING") audioStatusStore.set({type: "STOPPED"});
      running = false;
      startTime = undefined
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
      requestAnimationFrame(animateFirst);
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
    transform: translateX(calc(50vw - 50%));
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