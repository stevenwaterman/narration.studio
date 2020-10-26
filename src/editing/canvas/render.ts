import { sampleRate } from "../processor";
import { RenderMessage, RenderMessageCreate, RenderParams } from "./renderController";

let offscreen: OffscreenCanvas;
let gl: WebGL2RenderingContext;
let vertices: Float32Array;
let program: WebGLProgram;

type Message = {
  data: RenderMessage
};

const renderPixelSize = 1;
let renderParams: RenderParams = null as any;

self.addEventListener('message', ({data}: Message) => {
  if (data.type === "create") {
    setup(data);
  } else {
    if(data.type === "update_scroll") {
      renderParams.scroll = data.scroll;
    } else if(data.type === "update_zoom") {
      renderParams.pixelsPerSecond = data.pixelsPerSecond;
      renderParams.scroll = data.scroll;
    } else if(data.type === "update_size") {
      renderParams.width = data.width;
      renderParams.height = data.height;
    } else {
      const {idx, start, duration} = data.token;
      const token = renderParams.tokens[idx];
      token.duration = duration;
      if (token.type === "AUDIO" && start !== undefined) {
        token.start = start;
      }
    }

    drawWaveform();
  }
});

function setup({ canvas, channel, initialValues }: RenderMessageCreate) {
  renderParams = initialValues;
  offscreen = canvas;
  gl = canvas.getContext("webgl2", {preserveDrawingBuffer: true, desynchronized: true}) as WebGL2RenderingContext;
  
  vertices = preprocess(channel);
  init();
}

function preprocess(channel: Float32Array): Float32Array {
  const vertices = channel.length / renderPixelSize;
  const outputLength = vertices * 2;
  const output = new Float32Array(outputLength);

  for(let i = 0; i < vertices; i++) {
    let sum = 0;
    let count = 0;

    for(let j = 0; j < renderPixelSize; j++) {
      const idx = i * renderPixelSize + j;
      if (idx < channel.length) {
        sum += channel[idx];
        count++;
      }
    }

    const xSamples = i * renderPixelSize;
    const xSeconds = xSamples / sampleRate;

    const idx = i*2;
    output[idx] = xSeconds;
    output[idx + 1] = sum / count;
  }

  let peak = 0;
  for(let i = 1; i < output.length; i += 2) peak = Math.max(peak, Math.abs(output[i]));
  for(let i = 1; i < output.length; i += 2) output[i] /= peak;
  return output;
}

function drawWaveform(): void {
  const {tokens, pixelsPerSecond, scroll, width, height} = renderParams;

  offscreen.width = width;
  offscreen.height = height;
  gl.viewport(0, 0, width, height);

  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const pixelsPerClip = width / 2;
  const secondsPerClip = pixelsPerClip / pixelsPerSecond;

  const minSecs = scroll - secondsPerClip;
  const maxSecs = scroll + secondsPerClip;

  const drawTasks: Array<() => void> = [];
  let timecode = 0;
  for(const token of tokens) {
    const drawAtTime = Math.max(minSecs, timecode);
    const croppedFromStart = drawAtTime - timecode;
    const startAdjustedDuration = token.duration - croppedFromStart;
    const maxDuration = maxSecs - drawAtTime;
    const endAdjustedDuration = Math.min(maxDuration, startAdjustedDuration);

    if(endAdjustedDuration > 0) {
      setScale(pixelsPerSecond);

      if(token.type === "AUDIO") {
        const tokenOffset = token.start + croppedFromStart;
        drawSection(drawAtTime, tokenOffset, endAdjustedDuration, scroll);
      }
      
      drawOutline(drawAtTime, endAdjustedDuration, scroll);
    }
    
    timecode += token.duration;
  }
}

function setScale(pixelsPerSecond: number) {
  const lineCount = vertices.length / 2;
  const sampleCount = lineCount * renderPixelSize;
  const totalDuration = sampleCount / sampleRate;

  const pixelsPerClip = offscreen.width / 2;
  const totalClip = lineCount / pixelsPerClip;
  const secondsToClipScale = totalClip / totalDuration;

  const basePPS = sampleRate / renderPixelSize;
  const displayScale = pixelsPerSecond / basePPS;

  const scale = secondsToClipScale * displayScale;

  const scaleLoc = gl.getUniformLocation(program, "u_scale");
  gl.uniform4fv(scaleLoc, [scale, 1, 1, 1]);
}

function drawSection(drawAtTime: number, tokenOffset: number, tokenDuration: number, scroll: number) {
  const startVertex = Math.round(tokenOffset * sampleRate / renderPixelSize);
  const naturalTime = vertices[startVertex * 2];
  const offset = drawAtTime - naturalTime - scroll;

  const offsetLoc = gl.getUniformLocation(program, "u_offset");
  gl.uniform4fv(offsetLoc, [offset, 0, 0, 0]);
  
  const vertexCount = Math.round(tokenDuration * sampleRate / renderPixelSize);

  const start = Math.max(0, startVertex - 1);
  const end = Math.min(vertices.length / 2, start + vertexCount + 2);
  gl.drawArrays(gl.LINE_STRIP, start, end - start);
}

function drawOutline(drawAtTime: number, tokenDuration: number, scroll: number) {
  const offsetLoc = gl.getUniformLocation(program, "u_offset");
  gl.uniform4fv(offsetLoc, [drawAtTime - scroll, 0, 0, 0]);
  
  const outline = new Float32Array([0, -1, 0, 1, tokenDuration, 1, tokenDuration, -1]);

  gl.bufferSubData(gl.ARRAY_BUFFER, vertices.length * vertices.BYTES_PER_ELEMENT, outline);
  gl.drawArrays(gl.LINE_LOOP, vertices.length / 2, 4);
}

const vectorShader = `
  uniform vec4 u_offset;
  uniform vec4 u_scale;
  attribute vec4 a_Position;
  void main() {
    gl_Position = u_scale * (a_Position + u_offset);
  }
`;

const fragmentShader = `
  void main() {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  }
`;

function init() {
  program = initShaders(gl, vectorShader, fragmentShader);
  const buffers = initVertexBuffers(gl, program);
  gl.useProgram(program);
  return buffers;
}

function initShaders(gl: WebGL2RenderingContext, vs_source: string, fs_source: string): WebGLProgram {
  const vertexShader = makeShader(gl, vs_source, gl.VERTEX_SHADER);
  const fragmentShader = makeShader(gl, fs_source, gl.FRAGMENT_SHADER);

  const glProgram = gl.createProgram();
  if(!glProgram) throw new Error("Failed to create program");

  gl.attachShader(glProgram, vertexShader);
  gl.attachShader(glProgram, fragmentShader);
  gl.linkProgram(glProgram);

  if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(glProgram));
    throw new Error("Failed to create program");
  }

  return glProgram;
}

function initVertexBuffers(gl: WebGL2RenderingContext, program: WebGLProgram) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  const a_Position = gl.getAttribLocation(program, 'a_Position');
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bufferData(gl.ARRAY_BUFFER, (vertices.length + 8) * vertices.BYTES_PER_ELEMENT, gl.STATIC_DRAW);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);
}

function makeShader(gl: WebGL2RenderingContext, src: string, type: number) {
    const shader = gl.createShader(type);
    if(!shader) throw new Error("Failed to create shader");
    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      throw new Error("Failed to create shader");
    }

    return shader;
}