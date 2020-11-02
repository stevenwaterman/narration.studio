<script lang="ts">
  import type { AudioToken } from "../../../tokens";
  import { fade } from "svelte/transition";
  import { dragStart } from "../../../drag";

  export let pixelsPerSecond: number;
  export let token: AudioToken;
  export let audioDuration: number;
  export let left: number;
  export let setToken: (token: AudioToken) => void;


  let width: number;
  $: width = token.duration * pixelsPerSecond;

  let clamped: "LEFT" | "RIGHT" | null = null;

  let displayLeftClamp: boolean;
  let displayRightClamp: boolean;
  $: displayLeftClamp = clamped === "LEFT";
  $: displayRightClamp = clamped === "RIGHT";

  function panHandler(delta: number, originalOffset: number) {
    const draggedSeconds = delta / pixelsPerSecond;

    const newOffset = originalOffset - draggedSeconds;
    const minOffset = 0;
    const maxOffset = audioDuration - token.duration;
    if (newOffset < minOffset) {
      token.start = minOffset;
      clamped = "LEFT";
    } else if (newOffset > maxOffset) {
      token.start = maxOffset;
      clamped = "RIGHT";
    } else {
      token.start = newOffset;
      clamped = null;
    }
    setToken(token);
  }

  function stretchHandler(delta: number, originalDuration: number) {
    const draggedSeconds = delta / pixelsPerSecond;

    const newDuration = originalDuration + draggedSeconds;
    const minDuration = 0.1;
    const maxDuration = audioDuration - token.start;
    if (newDuration <= minDuration) {
      token.duration = minDuration;
      clamped = "LEFT";
    } else if (newDuration >= maxDuration) {
      token.duration = maxDuration;
      clamped = "RIGHT";
    } else {
      token.duration = newDuration;
      clamped = null;
    }
    setToken(token);
  }

  let stretching: boolean = false;
</script>

<style>
  .panRegion {
    flex-grow: 1;
    flex-shrink: 1;
    cursor: ew-resize;
  }

  .stretchRegion {
    width: 40px;
    max-width: 50%;
    cursor: e-resize;
  }
  .stretchRegion:hover {
    background-color: rgba(0, 0, 0, 0.2);
  }

  .audioTokenContainer {
    display: flex;
    flex-direction: row;
    
    position: absolute;
    box-sizing: border-box;
    height: 100%;
  }

  .leftClamp {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 10px;
    
    pointer-events: none;
    background-image: linear-gradient(90deg, rgba(255,0,0,1) 0%, rgba(255,0,0,0) 100%);
  }
  .rightClamp {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 10px;

    pointer-events: none;
    background-image: linear-gradient(90deg, rgba(255,0,0,0) 0%, rgba(255,0,0,1) 100%);
  }

  .hidden {
    opacity: 0;
  }
</style>

{#if width > 10}
  <div class="audioTokenContainer" style={`width: ${width}px; left: ${left}px;`}>
    <div class="panRegion" on:mousedown|preventDefault={dragStart({
      button: "LEFT",
      onDrag: panHandler,
      otherInfoGetter: () => token.start,
      onEnd: () => clamped = null
    })}/>

    <div class="stretchRegion" class:hidden={stretching} on:mousedown|preventDefault={dragStart({
      button: "LEFT", 
      onDrag: stretchHandler, 
      otherInfoGetter: () => {stretching = true; return token.duration}, 
      onEnd: () => {stretching = false; clamped = null}
    })}/>

    {#if displayLeftClamp}
      <div class="leftClamp" transition:fade/>
    {/if}

    {#if displayRightClamp}
      <div class="rightClamp" transition:fade/>
    {/if}
  </div>
{/if}