<script lang="ts">
  import { audioStatusStore, play, sampleRate, save, stop, togglePause } from "./processor";
  import type { DrawToken, EditorToken } from "../tokens";
  import RenderController from "./canvas/renderController";
  import Timestamps from "./overlay/Timestamps.svelte";
  import PlayCursor from "./overlay/PlayCursor.svelte";
  import TokensOverlay from "./overlay/tokens/TokensOverlay.svelte";
  import { dragStart, drag, dragEnd } from "../drag";
  import ScriptDisplay from "./ScriptDisplay.svelte";

  export let tokens: EditorToken[];
  export let buffer: AudioBuffer;

  let audioDuration: number;
  $: audioDuration = buffer.length / sampleRate;

  function stopOnChange(tokens: EditorToken[]) {
    stop(tokens);
  }

  $: stopOnChange(tokens);

  let canvas: HTMLCanvasElement | undefined;
  let offscreen: OffscreenCanvas | undefined;
  $: offscreen = canvas ? canvas.transferControlToOffscreen() : undefined;
  let controller: RenderController | undefined;
  $: controller = offscreen ? new RenderController(offscreen, buffer) : undefined;

  let drawTokens: DrawToken[];
  $: drawTokens = tokens.map(token => {
    if(token.type === "PARAGRAPH") return token;
    if(token.type === "PAUSE") return token;
    return {
      type: "WAVE",
      start: token.offset,
      duration: token.duration,
      idx: token.idx
    }
  });

  let scroll: number = 0;
  let pixelsPerSecond: number = 200;

  function redraw(drawTokens: DrawToken[], pixelsPerSecond: number, scroll: number) {
    if (!canvas) return;
    if (!controller) return;
    controller.update(drawTokens, scroll, pixelsPerSecond, canvas.clientWidth, canvas.clientHeight)
  }

  $: redraw(drawTokens, pixelsPerSecond, scroll);
  
  let duration: number;
  $: duration = drawTokens.map(token => token.duration).reduce((a,b) => a+b, 0);

  function setScroll(value: number) {
    if (!canvas) return;
    if (!controller) return;

    const widthPx = canvas.clientWidth;
    const heightPx = canvas.clientHeight;
    const widthSecs = widthPx / pixelsPerSecond;
    const minScroll = -0.4 * widthSecs;
    const maxScroll =  duration + 0.4 * widthSecs;
    scroll = Math.min(Math.max(minScroll, value), maxScroll);

    
    // (controller as RenderController).update(drawTokens, scroll, pixelsPerSecond, widthPx, heightPx);
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
    if (deltaX) setScroll(scroll - deltaX / pixelsPerSecond)
    
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
</script>

<style>
  .container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    align-items: center;
    justify-content: flex-start;
  }

  .canvasContainer {
    position: relative;
    height: 50vh;
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
  <ScriptDisplay tokens={drawTokens} {scroll} {cursorPositionSeconds}/>

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
  >
    <PlayCursor {scroll} {duration} {pixelsPerSecond} {setScroll}/>
    <Timestamps bind:cursorPositionSeconds {scroll} {pixelsPerSecond} {duration} on:play={e => play(tokens, e.detail)}/>
    <TokensOverlay bind:tokens {scroll} {pixelsPerSecond}  {audioDuration}/>
    <canvas bind:this={canvas} />
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