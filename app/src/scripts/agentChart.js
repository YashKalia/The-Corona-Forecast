import 'gl-matrix';
import { mat4 } from 'gl-matrix';

// Vector shader source code
const vsSource = `
    attribute vec4 aVertexColor;
    attribute vec4 aVertexPosition;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform float uPointSize;
    varying lowp vec4 vColor;

    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      gl_PointSize = uPointSize;
      vColor = aVertexColor;
    }
  `;

// Fragment shader source code
const fsSource = `
  varying lowp vec4 vColor;
  void main() {
    gl_FragColor = vColor;
  }
`;

// Represents the webgl canvas we'll use to draw the agents.
export default class AgentChart {
  constructor(gl) {
    this.gl = gl;
    // Compile the shader programs using the helper functions below
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // Collect all the info needed to use the shader program.
    // Look up which attribute our shader program is using
    // for aVertexPosition and look up uniform locations.
    this.programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(
          shaderProgram,
          'uProjectionMatrix'
        ),
        modelViewMatrix: gl.getUniformLocation(
          shaderProgram,
          'uModelViewMatrix'
        ),
        pointSize: gl.getUniformLocation(
          shaderProgram,
          'uPointSize'
        )
      },
    };
  }

  draw(drawinfo){
    debugger;
    const buffers = this.initBuffers(drawinfo.pos, drawinfo.col);
    this.drawScene(buffers, drawinfo.count, drawinfo.size);
  }

  // expects positions as an array like this: [X0, Y0, X1, Y1..... Xn, Yn]
  initBuffers(positions, colors) {
    // Create a buffer for the square's positions.
    const positionBuffer = this.gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(positions),
      this.gl.STATIC_DRAW
    );

    // Now do the same for the colors.
    const colorBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);

    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(colors),
      this.gl.STATIC_DRAW
    );

    return {
      position: positionBuffer,
      color: colorBuffer,
    };
  }

  drawScene(buffers, count, pointSize) {
    this.gl.clearColor(0.8, 0.8, 0.8, 1.0); // Clear to black, fully opaque
    this.gl.clearDepth(1.0); // Clear everything
    this.gl.enable(this.gl.DEPTH_TEST); // Enable depth testing
    this.gl.depthFunc(this.gl.LEQUAL); // Near things obscure far things
  
    // Clear the canvas before we start drawing on it
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  
    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.
    const fieldOfView = (45 * Math.PI) / 180; // in radians
    const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 10000.0;
    const projectionMatrix = mat4.create();
  
    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
  
    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    const modelViewMatrix = mat4.create();
  
    // Now move the drawing position a bit to where we want to
    // start drawing the square.
    mat4.translate(
      modelViewMatrix, // destination matrix
      modelViewMatrix, // matrix to translate
      [-300.0, -300.0, -800.0]
    ); // amount to translate
  
    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    {
      const numComponents = 2; // pull out 2 values per iteration
      const type = this.gl.FLOAT; // the data in the buffer is 32bit floats
      const normalize = false; // don't normalize
      const stride = 0; // how many bytes to get from one set of values to the next
      // 0 = use type and numComponents above
      const offset = 0; // how many bytes inside the buffer to start from
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers.position);
      this.gl.vertexAttribPointer(
        this.programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset
      );
      this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
    }

    {
      const numComponents = 4;
      const type = this.gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers.color);
      this.gl.vertexAttribPointer(
        this.programInfo.attribLocations.vertexColor,
        numComponents,
        type,
        normalize,
        stride,
        offset
      );
      this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexColor);
    }
  
    // Tell WebGL to use our program when drawing
    this.gl.useProgram(this.programInfo.program);
  
    // Set the shader uniforms
    this.gl.uniformMatrix4fv(
      this.programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix
    );
    this.gl.uniformMatrix4fv(
      this.programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix
    );
    this.gl.uniform1f(
      this.programInfo.uniformLocations.pointSize,
      pointSize
    );
    {
      const offset = 0;
      const vertexCount = count;
      this.gl.drawArrays(this.gl.POINTS, offset, vertexCount);
    }
  }
}

// Initialize a shader program, so WebGL knows how to draw our data
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      'Unable to initialize the shader program: ' +
        gl.getProgramInfoLog(shaderProgram)
    );
    return null;
  }
  return shaderProgram;
}

// creates a shader of the given type, uploads the source and compiles it.
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      'An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader)
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}