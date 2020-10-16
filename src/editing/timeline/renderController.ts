
import { AudioToken, DrawToken } from "../../tokens";
import RenderWorker from "web-worker:./render.ts";

const worker: Worker = new RenderWorker();

class RenderController {
  constructor(canvas: OffscreenCanvas, buffer: AudioBuffer) {
    worker.postMessage({ 
      type: "create", 
      canvas, 
      channel0: buffer.getChannelData(0), 
      channel1: buffer.getChannelData(1) 
    }, [canvas]);
  }

  update(tokens: DrawToken[], pixelsPerSecond: number) {
    worker.postMessage({type: "draw", tokens, pixelsPerSecond});
  }
}

export default RenderController;