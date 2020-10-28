<script lang="ts">
  import { audioStatusStore, play, sampleRate, save, stop, togglePause } from "./processor";
  import type { EditorToken, VisibleToken } from "../tokens";
  import RenderController from "./canvas/renderController";
  import Timestamps from "./overlay/Timestamps.svelte";
  import PlayCursor from "./overlay/PlayCursor.svelte";
  import TokensOverlay from "./overlay/tokens/TokensOverlay.svelte";
  import { dragStart, drag, dragEnd } from "../drag";
  import ScriptDisplay from "./ScriptDisplay.svelte";
  import { onMount } from "svelte";
  import { saveChangedToken } from "./persistence";

  export let tokens: EditorToken[];
  export let buffer: AudioBuffer;

  let visibleTokens: VisibleToken[];
  $: visibleTokens = tokens.filter(token => token.type !== "NOTHING") as VisibleToken[];

  let audioDuration: number;
  $: audioDuration = buffer.length / sampleRate;

  let canvas: HTMLCanvasElement;
  let controller: RenderController | undefined = undefined;

  let containerWidth: number = 0;
  $: canvasWidth = containerWidth - 30;
  let canvasHeight: number = 0;
  let scroll: number = 0;
  let pixelsPerSecond: number = 200;

  onMount(() => {
    const offscreen = (canvas as HTMLCanvasElement).transferControlToOffscreen();
    controller = new RenderController(offscreen, buffer, visibleTokens, scroll, pixelsPerSecond, canvasWidth, canvasHeight);
  });

  let canvasWidthSecs: number;
  $: canvasWidthSecs = canvasWidth / pixelsPerSecond;

  let canvasStartSecs: number;
  $: canvasStartSecs = scroll - canvasWidthSecs / 2;

  let canvasEndSecs: number;
  $: canvasEndSecs = scroll + canvasWidthSecs / 2;

  let canvasBounds: {start: number; end: number};
  $: canvasBounds = {start: canvasStartSecs, end: canvasEndSecs};

  let duration: number;
  $: duration = tokens.map(token => token.type === "NOTHING" ? 0 : token.duration).reduce((a,b) => a+b, 0);

  function setScroll(value: number) {
    const widthSecs = canvasWidth / pixelsPerSecond;
    const minScroll = -0.4 * widthSecs;
    const maxScroll =  duration + 0.4 * widthSecs;
    scroll = Math.min(Math.max(minScroll, value), maxScroll);
  }

  function dragHandler(delta: number, startScroll: number) {
      const dragSec = delta / pixelsPerSecond;
      setScroll(startScroll - dragSec);
  }

  function onWheel(event: WheelEvent) {
    if(!canvas) return;
    const width = canvas.width;

    const {deltaX, deltaY, clientX, shiftKey} = event;
    const offsetX = clientX - width / 2;

    const oldMouseSecs = offsetX / pixelsPerSecond;
    if (shiftKey) {
      if (deltaY) setScroll(scroll - deltaY / pixelsPerSecond);
    } else {
      if (deltaY < 0) pixelsPerSecond *= 1.2;
      if (deltaY > 0) pixelsPerSecond /= 1.2;
      pixelsPerSecond = Math.min(100 * 1000, pixelsPerSecond);
    }
    if (deltaX) setScroll(scroll + deltaX / pixelsPerSecond)
    
    const newMouseSecs = offsetX / pixelsPerSecond;
    const requiredScrolling = newMouseSecs - oldMouseSecs;
    setScroll(scroll - requiredScrolling);
  }

  let cursorPositionSeconds: number | null;

  function keypress(event: KeyboardEvent) {
    if(event.code === "Space") {
      togglePause(tokens);
    }
  }

  function timechange(event: CustomEvent) {
    const newTime: number = event.detail;
    setScroll(newTime);
  }

  function renderScrollChange(scroll: number) {
    if(controller) {
      controller.updateScroll(scroll);
    }
  }
  $: renderScrollChange(scroll);

  function renderZoomChange(pixelsPerSecond: number) {
    if(controller) {
      controller.updateZoom(pixelsPerSecond, scroll);
    }
  }
  $: renderZoomChange(pixelsPerSecond);

  function renderSizeChange(width: number, height: number) {
    if(controller) {
      controller.updateSize(width, height);
    }
  }
  $: renderSizeChange(canvasWidth, canvasHeight);

  function renderTokenChange(token: VisibleToken) {
    if(controller) {
      controller.updateToken(token);
    }
  }

  function setToken(token: VisibleToken) {
    tokens[token.idx] = token;
    renderTokenChange(token);
    saveChangedToken(token);
    stop(tokens);
    
  }
</script>

<style>
  .container {
    display: flex;
    flex-direction: column;
    width: 100%;
    align-items: center;
    justify-content: flex-start;
    flex-shrink: 1;
    flex-grow: 1;
    min-height: 0;
  }

  .canvasContainer {
    position: relative;
    min-height: 40vh;
    width: 100%;
    flex-grow: 1;
    flex-shrink: 1;
  }

  canvas {
    position: absolute;
    top: 30px;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: calc(100% - 30px);
    cursor: ew-resize;
    z-index: 0;
  }

  .buttonRow {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-self: center;
    font-size: 36px;
  }

  .button {
    display: flex;
    justify-content: center;
    margin: 10px;
    width: 50px;
    height: 50px;
    border-radius: 25%;
    border: 1px solid black;
    user-select: none;
    cursor: pointer;
  }

  .instruction {
    position: fixed;
    bottom: 0;
    margin: 4px;
    font-size: 18px;
  }

  .left {
    left: 0;
  }

  .right {
    right: 0;
  }
</style>

<div class="container"
  on:mousemove={drag}
>
  <ScriptDisplay {tokens} {scroll} {cursorPositionSeconds}/>

  <div class="canvasContainer"
  on:mousedown|preventDefault={dragStart({
    button: "LEFT", 
    onDrag: dragHandler,
    otherInfoGetter: () => scroll,
    onEnd: () => {}
  })}
  on:mouseup|preventDefault={dragEnd}
  on:mouseout|preventDefault|self={dragEnd}
  on:wheel|preventDefault={onWheel}
  on:contextmenu|preventDefault
  bind:clientWidth={canvasWidth}
  bind:clientHeight={canvasHeight}
  >
    <PlayCursor {scroll} {duration} {pixelsPerSecond} on:timechange={timechange}/>
    <Timestamps bind:cursorPositionSeconds {scroll} {pixelsPerSecond} {duration} on:play={e => play(tokens, e.detail)}/>
    <TokensOverlay tokens={visibleTokens} {scroll} {pixelsPerSecond}  {audioDuration} {canvasBounds} {setToken}/>
    <canvas bind:this={canvas}/>
  </div>
  
  <div class="buttonRow">
    <div class="button" on:click={() => togglePause(tokens)}>{$audioStatusStore.type === "PLAYING" ? "⏸️" : "▶️"}</div>
    <div class="button" disabled={$audioStatusStore.type !== "STOPPED"} on:click={() => stop(tokens)}>⏹️</div>
    <div class="button" on:click={() => save(tokens)}>↓</div>
  </div>

  <div class="instruction left">Left-click drag or shift-scroll to pan</div>
  <div class="instruction right">Right-click drag to adjust offset and duration</div>
</div>
<svelte:body on:keypress={keypress}/>