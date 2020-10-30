import { EditorToken, VisibleToken } from "../../tokens";
import RenderWorker from "web-worker:./render.ts";

export type RenderToken = {
  type: "PAUSE"; idx: number; duration: number;
} | {
  type: "AUDIO"; idx: number; start: number; duration: number;
} | {
  type: "NOTHING"; idx: number;
}

export type RenderParams = {
  tokens: RenderToken[];
  scroll: number;
  pixelsPerSecond: number;
  width: number;
  height: number;
}

export type RenderMessageCreate = {
  type: "create";
  canvas: OffscreenCanvas;
  channel: Float32Array;
  initialValues: RenderParams
}

export type RenderMessageUpdateScroll = {
  type: "update_scroll";
  scroll: number;
}

export type RenderMessageUpdateZoom = {
  type: "update_zoom";
  scroll: number;
  pixelsPerSecond: number;
}

export type RenderMessageUpdateSize = {
  type: "update_size";
  width: number;
  height: number;
}

export type RenderMessageUpdateToken = {
  type: "update_token";
  token: {
    idx: number;
    start?: number;
    duration: number;
  }
}

export type RenderMessage = RenderMessageCreate | RenderMessageUpdateScroll | RenderMessageUpdateZoom | RenderMessageUpdateSize | RenderMessageUpdateToken;

const worker: Worker = new RenderWorker();

class RenderController {
  constructor(canvas: OffscreenCanvas, buffer: AudioBuffer, tokens: EditorToken[], scroll: number, pixelsPerSecond: number, width: number, height: number)  {
    const data: Float32Array = getData(buffer);
    const renderTokens: RenderToken[] = tokens.map(token => {
      if(token.type === "AUDIO") {
        return {
          type: "AUDIO",
          idx: token.idx,
          start: token.start,
          duration: token.duration
        }
      } else if(token.type === "NOTHING") {
        return {
          type: "NOTHING",
          idx: token.idx
        }
      } else {
        return {
          type: "PAUSE",
          idx: token.idx,
          duration: token.duration
        }
      }
      
    });
    const msg: RenderMessageCreate = { 
      type: "create", 
      canvas, 
      channel: data,
      initialValues: {
        tokens: renderTokens,
        scroll,
        pixelsPerSecond,
        width,
        height
      }
    };

    worker.postMessage(msg, [canvas]);
  }

  updateScroll(scroll: number) {
    const msg: RenderMessageUpdateScroll = {type: "update_scroll", scroll};
    worker.postMessage(msg);
  }

  updateZoom(pixelsPerSecond: number, scroll: number) {
    const msg: RenderMessageUpdateZoom = {type: "update_zoom", scroll, pixelsPerSecond};
    worker.postMessage(msg);
  }

  updateSize(width: number, height: number) {
    const msg: RenderMessageUpdateSize = {type: "update_size", width, height};
    worker.postMessage(msg);
  }

  updateToken(token: VisibleToken) {
    const start = token.type === "AUDIO" ? token.start : undefined;
    const msgToken = {
      idx: token.idx,
      start,
      duration: token.duration
    };
    const msg: RenderMessageUpdateToken = {type: "update_token", token: msgToken};
    worker.postMessage(msg);
  }
}

export default RenderController;

function getData(buffer: AudioBuffer): Float32Array {
  const data = new Float32Array(buffer.getChannelData(0).length);
  for(let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for(let i = 0; i < data.length; i++) {
      data[i] += channelData[i];
    }
  }
  return data;
}