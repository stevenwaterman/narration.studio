<script lang="ts">
  import type { AudioToken } from "../../../tokens";
  import { fade } from "svelte/transition";

  export let pixelsPerSecond: number;
  export let token: AudioToken;
  export let audioDuration: number;

  let width: number;
  $: width = token.duration * pixelsPerSecond;

  let clamped: "LEFT" | "RIGHT" | null = null;
  let dragStart: {mouse: number, offset: number, duration: number, side: "LEFT" | "RIGHT"} | null = null;

  let displayLeftClamp: boolean;
  let displayRightClamp: boolean;
  $: displayLeftClamp = dragStart !== null && clamped === "LEFT";
  $: displayRightClamp = dragStart !== null && clamped === "RIGHT";

  function startDrag(event: MouseEvent, side: "LEFT" | "RIGHT") {
    if (event.button === 2 && side === "RIGHT") {
      event.stopPropagation();
      dragStart = {mouse: event.screenX, offset: token.offset, duration: token.duration, side};
    } else if (event.button === 2 && side === "LEFT") {
      dragStart = {mouse: event.screenX, offset: token.offset, duration: token.duration, side};
    }
  }
  function endDrag() {
    dragStart = null;
  }
  function drag(event: MouseEvent) {
    if (dragStart === null) return;

    const dragEnd = event.screenX;
    const draggedPixels = dragEnd - dragStart.mouse;
    const draggedSeconds = draggedPixels / pixelsPerSecond;

    if (dragStart.side === "LEFT") {
      const newOffset = dragStart.offset - draggedSeconds;
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
      
    } else {
      const newDuration = dragStart.duration + draggedSeconds;
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
  }
  </script>
  
  <style>
    .leftClickRegion {
      flex-grow: 1;
      flex-shrink: 1;
      cursor: ew-resize;
    }
    .rightClickRegion {
      width: 40px;
      cursor: e-resize;
    }
    .rightClickRegion:hover {
      background-color: rgba(0, 0, 0, 0.2);
    }
    .container {
      border: 1px solid black;
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
    <div class="leftClickRegion" on:mousedown|preventDefault={event => startDrag(event, "LEFT")} on:mouseup|preventDefault={endDrag} on:mouseout|preventDefault={endDrag} on:mousemove={drag}/>
    <div class="rightClickRegion" on:mousedown|preventDefault={event => startDrag(event, "RIGHT")} on:mouseup|preventDefault={endDrag} on:mouseout|preventDefault={endDrag} on:mousemove={drag}/>
    {#if displayLeftClamp}
      <div class="leftClamp" transition:fade/>
    {/if}

    {#if displayRightClamp}
      <div class="rightClamp" transition:fade/>
    {/if}
  </div>