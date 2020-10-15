<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let duration: number;
  export let zoom: number;

  let timelineWidth: number;
  $: timelineWidth = duration * zoom;

  let timestampCount: number;
  $: timestampCount = Math.floor(timelineWidth / 200);

  let timestampPeriod: number;
  $: timestampPeriod = duration / timestampCount;

  let timestamps: {left: number, mins: string, secs: string}[];
  $: timestamps = new Array(timestampCount + 1)
    .fill(null)
    .map((_, idx) => timestampPeriod * idx)
    .map(ts => ({
      left: ts * zoom,
      mins: (ts / 60).toFixed(0).padStart(2, "0"),
      secs: (ts % 60).toFixed(3).padStart(6, "0")
    }));

  let hovering = false;
  export let cursorPosition: number | null = null;

  function mouseEnter() {
    hovering = true;
  }

  function mouseLeave() {
    hovering = false;
    cursorPosition = null;
  }

  function mouseMove(event: MouseEvent) {
    if(hovering) {
      cursorPosition = event.offsetX;
    }
  }

  const dispatch = createEventDispatcher();

  function mouseClick(event: MouseEvent) {
    const x = event.offsetX;
    const seconds = x / zoom;
    dispatch("play", seconds);
  }
</script>

<style>
  .timestamps {
    height: 30px;
    width: 100%;
    position: relative;
    flex-shrink: 0;
    flex-grow: 0;
    cursor: pointer;
  }

  .timestamp {
    position: absolute;
    top: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transform: translateX(-50%);
    pointer-events: none;
  }
</style>

<div class="timestamps" on:mouseover={mouseEnter} on:mouseout={mouseLeave} on:mousemove={mouseMove} on:click={mouseClick}>
  {#each timestamps as {left, mins, secs}}
    <div class="timestamp" style={`left: ${left}px`}>{mins}:{secs}</div>
  {/each}
</div>