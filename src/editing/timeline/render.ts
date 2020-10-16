import { DrawToken } from "../../tokens";
import { sampleRate } from "../processor";

let offscreen: OffscreenCanvas;
let gl: WebGL2RenderingContext;
let vertices: Float32Array;
let pixels: Float32Array;
let lastKnownZoom: number;
let program: WebGLProgram;

self.addEventListener('message', e => {
  if (e.data.type === "create") {
    setup(e.data);
  } else if (e.data.type === "draw") {
    drawWaveform(e.data);
  }
});

function setup({
  canvas, channel0, channel1
}: {
  canvas: OffscreenCanvas;
  channel0: Float32Array;
  channel1: Float32Array;
}) {
  offscreen = canvas;
  gl = canvas.getContext("webgl2", {preserveDrawingBuffer: true}) as WebGL2RenderingContext;
  init(gl);

  vertices = preprocess(channel0, channel1);
}

function preprocess(channel0: Float32Array, channel1: Float32Array): Float32Array {
  const window = 5000;
  const output = new Float32Array(channel0.length * 4);

  let count: number = 0;
  let avg: number = 0;

  for(let i = 0; i < channel0.length; i++) {
    const val0 = channel0[i];
    const val1 = channel1[i];
    avg += Math.abs(val0) + Math.abs(val1);

    const removeI = i - window;
    if (removeI >= 0) {
      const rem0 = channel0[removeI];
      const rem1 = channel1[removeI];
      avg -= Math.abs(rem0) + Math.abs(rem1);
    } else {
      count += 1;
    }

    const idx = i*4;
    const amp = avg / count;
    output[idx] = i;
    output[idx + 1] = amp;
    output[idx + 2] = i;
    output[idx + 3] = -amp;
  }

  return output;
}

function sample(pixelsPerSecond: number) {
  lastKnownZoom = pixelsPerSecond;
  const samplesPerPixel = sampleRate / pixelsPerSecond;
  const pixelsLength = vertices.length / samplesPerPixel;
  const output = new Float32Array(pixelsLength);

  const width = offscreen.width;
  const pixelsPerClip = width / 2;

  for(let i = 0; i < pixelsLength; i += 4) {
    const j = Math.round(i * samplesPerPixel / 4) * 4;
    const sample = vertices[j];
    const pixels = sample / samplesPerPixel;
    const clip = pixels / pixelsPerClip;

    output[i] = clip;
    output[i + 1] = vertices[j + 1];
    output[i + 2] = clip;
    output[i + 3] = vertices[j + 3];
  }

  pixels = output;
  gl.bufferData(gl.ARRAY_BUFFER, pixels, gl.STATIC_DRAW);
}

function drawWaveform({tokens, pixelsPerSecond}: { tokens: DrawToken[]; pixelsPerSecond: number }): void {
  if (pixelsPerSecond != lastKnownZoom) {
    sample(pixelsPerSecond);
  }

  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  let offset = 0;
  for(const token of tokens) {
    if(token.type === "PAUSE") {
      offset += token.duration * pixelsPerSecond;
    } else {
      const startPixel = Math.round(token.start * pixelsPerSecond);
      const pixelCount = Math.round(token.duration * pixelsPerSecond);
      drawSection(offset, startPixel, pixelCount);
      offset += pixelCount;
    }
  }
}

function drawSection(drawAtPixel: number, startPixel: number, pixelCount: number) {
  const drawAtClip = 2 * drawAtPixel / offscreen.width - 1
  const naturalPosition = pixels[startPixel * 4];
  const offset = drawAtClip - naturalPosition;

  var offsetLoc = gl.getUniformLocation(program, "u_offset");
  gl.uniform4fv(offsetLoc, [offset, 0, 0, 0]);

  gl.drawArrays(gl.LINES, startPixel * 2, pixelCount * 2);
}

const vsSource = `
  uniform vec4 u_offset;
  attribute vec4 a_Position;
  void main() {
    gl_Position = a_Position + u_offset;
  }
`;

const fsSource = `
  void main() {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  }
`;

function init(gl: WebGL2RenderingContext) {
  program = initShaders(gl, vsSource, fsSource);
  initVertexBuffers(gl, program);
  gl.useProgram(program);
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
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    const a_Position = gl.getAttribLocation(program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
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