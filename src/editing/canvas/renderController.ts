
import { DrawToken } from "../../tokens";
import RenderWorker from "web-worker:./render.ts";

export type RenderMessageCreate = {
  type: "create",
  canvas: OffscreenCanvas,
  channel: Float32Array,
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
    const data: Float32Array = new Float32Array(buffer.getChannelData(0).length);
    for(let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for(let i = 0; i < data.length; i++) {
        data[i] += channelData[i];
      }
    }
    const msg: RenderMessageCreate = { 
      type: "create", 
      canvas, 
      channel: data
    };

    worker.postMessage(msg, [canvas]);
  }

  update(tokens: DrawToken[], scroll: number, pixelsPerSecond: number, width: number, height: number) {
    const msg: RenderMessageDraw = {type: "draw", tokens, scroll, pixelsPerSecond, width, height};
    worker.postMessage(msg);
  }
}

export default RenderController;