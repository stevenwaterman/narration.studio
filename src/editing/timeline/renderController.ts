
import { AudioToken, DrawToken } from "../../tokens";
import RenderWorker from "web-worker:./render.ts";

export type RenderMessageCreate = {
  type: "create",
  canvas: OffscreenCanvas,
  channel0: Float32Array,
  channel1: Float32Array
}

export type RenderMessageDraw = {
  type: "draw",
  tokens: DrawToken[],
  scroll: number,
  pixelsPerSecond: number,
  width: number,
  height: number
}

export type RenderMessage = RenderMessageCreate | RenderMessageDraw;

const worker: Worker = new RenderWorker();

class RenderController {
  constructor(canvas: OffscreenCanvas, buffer: AudioBuffer) {
    const msg: RenderMessageCreate = { 
      type: "create", 
      canvas, 
      channel0: buffer.getChannelData(0), 
      channel1: buffer.getChannelData(1) 
    };

    worker.postMessage(msg, [canvas]);
  }

  update(tokens: DrawToken[], scroll: number, pixelsPerSecond: number, width: number, height: number) {
    const msg: RenderMessageDraw = {type: "draw", tokens, scroll, pixelsPerSecond, width, height};
    worker.postMessage(msg);
  }
}

export default RenderController;