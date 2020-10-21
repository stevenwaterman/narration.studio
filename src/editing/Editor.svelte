<script lang="ts">
  import { play, sampleRate, save, stop } from "./processor";
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

  function startAudio(startTime?: number) {
    play(tokens, startTime || 0);
  }

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
    if(token.type === "PAUSE") return token;
    return {
      type: "WAVE",
      start: token.offset,
      duration: token.duration,
      raw: token.raw,
      idx: token.idx
    }
  });

  let scroll: number = 0;
  let pixelsPerSecond: number = 200;

  let timelineWidth: number;
  let timelineWidthSecs: number;
  $: timelineWidthSecs = (timelineWidth || 0) / pixelsPerSecond;

  $: canvas && controller && controller.update(drawTokens, scroll, pixelsPerSecond, canvas.clientWidth, canvas.clientHeight);
  
  let duration: number;
  $: duration = drawTokens.map(token => token.duration).reduce((a,b) => a+b, 0);

  function setScroll(value: number) {
    if (!canvas) return;
    const widthPx = canvas.clientWidth;
    const widthSecs = widthPx / pixelsPerSecond;
    const minScroll = -0.9 * widthSecs;
    const maxScroll =  duration - 0.1 * widthSecs;
    scroll = Math.min(Math.max(minScroll, value), maxScroll)
  }

  function dragHandler(delta: number, startScroll: number) {
      const dragSec = delta / pixelsPerSecond;
      setScroll(startScroll - dragSec);
  }

  function onWheel(event: WheelEvent) {
    const {deltaX, deltaY, clientX, shiftKey} = event;
    const oldMouseSecs = clientX / pixelsPerSecond;
    if (shiftKey) {
      if (deltaY) setScroll(scroll + deltaY / pixelsPerSecond);
    } else {
      if (deltaY < 0) pixelsPerSecond *= 1.2;
      if (deltaY > 0) pixelsPerSecond /= 1.2;
    }
    if (deltaX) setScroll(scroll - deltaX / pixelsPerSecond)
    
    const newMouseSecs = clientX / pixelsPerSecond;
    const requiredScrolling = newMouseSecs - oldMouseSecs;
    setScroll(scroll - requiredScrolling);
  }

  let cursorPositionSeconds: number | null;
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
</style>

<button on:click={() => startAudio()}>Start</button>
<button on:click={() => stop(tokens)}>Stop</button>
<button on:click={() => save(tokens)}>Save</button>

<div class="container"
  on:mousemove={drag}
>
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
  on:contextmenu|preventDefault={() => {}}
  >
    <PlayCursor bind:scroll duration={duration} timelineWidthSecs={timelineWidthSecs}/>
    <Timestamps bind:cursorPositionSeconds scroll={scroll} pixelsPerSecond={pixelsPerSecond} duration={duration} on:play={e => startAudio(e.detail)}/>
    <TokensOverlay scroll={scroll} pixelsPerSecond={pixelsPerSecond} bind:tokens audioDuration={audioDuration}/>
    <canvas bind:this={canvas} bind:clientWidth={timelineWidth} />
  </div>
  <ScriptDisplay tokens={drawTokens} scroll={scroll} timelineWidthSecs={timelineWidthSecs} cursorPositionSeconds={cursorPositionSeconds}/>
</div>
