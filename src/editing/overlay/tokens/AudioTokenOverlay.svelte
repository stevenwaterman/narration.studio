<script lang="ts">
  import type { AudioToken } from "../../../tokens";
  import { fade } from "svelte/transition";
import { dragStart } from "../../../drag";

  export let pixelsPerSecond: number;
  export let token: AudioToken;
  export let audioDuration: number;

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
      token.offset = minOffset;
      clamped = "LEFT";
    } else if (newOffset > maxOffset) {
      token.offset = maxOffset;
      clamped = "RIGHT";
    } else {
      token.offset = newOffset;
      clamped = null;
    }
  }

  function stretchHandler(delta: number, originalDuration: number) {
    const draggedSeconds = delta / pixelsPerSecond;

    const newDuration = originalDuration + draggedSeconds;
    const minDuration = 0.1;
    const maxDuration = audioDuration - token.offset;
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
  }
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

    .container {
      display: flex;
      flex-direction: row;
      flex-grow: 0;
      flex-shrink: 0;
      
      position: relative;
      box-sizing: border-box;
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
  </style>
  
  <div class="container" style={`width:${width}px`}>
    <div class="panRegion" on:mousedown|preventDefault={dragStart({
      button: "RIGHT", 
      onDrag: panHandler, 
      otherInfoGetter: () => token.offset, 
      onEnd: () => clamped = null
    })}/>

    <div class="stretchRegion" on:mousedown|preventDefault={dragStart({
      button: "RIGHT", 
      onDrag: stretchHandler, 
      otherInfoGetter: () => token.duration, 
      onEnd: () => clamped = null
    })}/>

    {#if displayLeftClamp}
      <div class="leftClamp" transition:fade/>
    {/if}

    {#if displayRightClamp}
      <div class="rightClamp" transition:fade/>
    {/if}
  </div>