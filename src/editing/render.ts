export function drawWaveform(waveform: {min: number; max: number;}[], height: number): ImageBitmap {
  type Coord = {
    x: number,
    y: number
  }

  const triangles: [Coord, Coord, Coord][] = [];
  
  let last: {x: number; min: number; max: number} | undefined;
  waveform.forEach((current, idx) => {
    const x = 2 * idx / (waveform.length - 1) - 1
    if(last) {
      triangles.push(
        [
          {x: last.x, y: last.min},
          {x: last.x, y: last.max},
          {x: x, y: current.max}
        ], [
          {x: last.x, y: last.max},
          {x: last.x, y: last.min},
          {x: x, y: current.min}
        ]
      );
    }
    last = {
      ...current, x
    };
  });

  const vertices: Float32Array = new Float32Array(triangles.flat().flatMap(({x, y}) => [x, y]));

  const canvas = new OffscreenCanvas(waveform.length, height);
  const ctx = canvas.getContext("webgl2");
  if (ctx === null) throw Error("Failed to create offscreen canvas");
  draw(ctx, vertices);
  return canvas.transferToImageBitmap();
}

const vsSource = `
  attribute vec4 a_Position;
  void main() {
      gl_Position = a_Position;
  }
`;

const fsSource = `
  void main() {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  }
`;

function draw(gl: WebGL2RenderingContext, vertices: Float32Array) {
  const program = initShaders(gl, vsSource, fsSource);
  initVertexBuffers(gl, program, vertices);

  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
}

function initShaders(gl: WebGL2RenderingContext, vs_source: string, fs_source: string): WebGLProgram {
  const vertexShader = makeShader(gl, vs_source, gl.VERTEX_SHADER);
  const fragmentShader = makeShader(gl, fs_source, gl.FRAGMENT_SHADER);

  const glProgram = gl.createProgram();
  if(!glProgram) throw Error("Failed to create program");

  gl.attachShader(glProgram, vertexShader);
  gl.attachShader(glProgram, fragmentShader);
  gl.linkProgram(glProgram);
  gl.useProgram(glProgram);

  return glProgram;
}

function initVertexBuffers(gl: WebGL2RenderingContext, program: WebGLProgram, vertices: Float32Array) {
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const a_Position = gl.getAttribLocation(program, 'a_Position');
    gl.enableVertexAttribArray(a_Position);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    // const u_FragColor = gl.getUniformLocation(program, 'u_FragColor');
    // gl.uniform4fv(u_FragColor, [1.0, 1.0, 1.0, 1.0]);
}

function makeShader(gl: WebGL2RenderingContext, src: string, type: number) {
    const shader = gl.createShader(type);
    if(!shader) throw Error("Failed to create shader");
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    return shader;
}