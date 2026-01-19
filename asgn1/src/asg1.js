// Tenzin Lekphel - ftenzinl@ucsc.edu
// Assignment 1: Painting Application

// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }
`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }
`;

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

// Current drawing settings
let g_selectedColor = [1.0, 0.0, 0.0, 1.0];
let g_selectedSize = 20;
let g_selectedType = 'triangle';
let g_selectedSegments = 10;
let g_selectedAlpha = 1.0;

// Array to store all shapes
let g_shapesList = [];

// UI element references
let redSlider, greenSlider, blueSlider, sizeSlider, segmentSlider, alphaSlider;

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();
  
  // Render initial scene
  renderAllShapes();
}

function setupWebGL() {
  canvas = document.getElementById('webgl');
  
  // Get the rendering context for WebGL
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  
  // Enable alpha blending for transparency
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }
  
  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }
  
  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }
  
  // Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

function addActionsForHtmlUI() {
  // Mouse events
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) {
    if (ev.buttons == 1) {
      click(ev);
    }
  };
  
  // Color sliders
  redSlider = document.getElementById('redSlider');
  greenSlider = document.getElementById('greenSlider');
  blueSlider = document.getElementById('blueSlider');
  
  redSlider.addEventListener('input', function() {
    g_selectedColor[0] = this.value;
    document.getElementById('redValue').textContent = this.value;
  });
  
  greenSlider.addEventListener('input', function() {
    g_selectedColor[1] = this.value;
    document.getElementById('greenValue').textContent = this.value;
  });
  
  blueSlider.addEventListener('input', function() {
    g_selectedColor[2] = this.value;
    document.getElementById('blueValue').textContent = this.value;
  });
  
  // Size slider
  sizeSlider = document.getElementById('sizeSlider');
  sizeSlider.addEventListener('input', function() {
    g_selectedSize = this.value;
    document.getElementById('sizeValue').textContent = this.value;
  });
  
  // Segment slider
  segmentSlider = document.getElementById('segmentSlider');
  segmentSlider.addEventListener('input', function() {
    g_selectedSegments = this.value;
    document.getElementById('segmentValue').textContent = this.value;
  });
  
  // Alpha slider
  alphaSlider = document.getElementById('alphaSlider');
  alphaSlider.addEventListener('input', function() {
    g_selectedAlpha = parseFloat(this.value);
    g_selectedColor[3] = g_selectedAlpha;
    document.getElementById('alphaValue').textContent = this.value;
  });
}

function selectMode(mode) {
  g_selectedType = mode;
  
  // Update button styling
  document.getElementById('squareBtn').classList.remove('active');
  document.getElementById('triangleBtn').classList.remove('active');
  document.getElementById('circleBtn').classList.remove('active');
  
  if (mode === 'square') {
    document.getElementById('squareBtn').classList.add('active');
  } else if (mode === 'triangle') {
    document.getElementById('triangleBtn').classList.add('active');
  } else if (mode === 'circle') {
    document.getElementById('circleBtn').classList.add('active');
  }
}

function click(ev) {
  let [x, y] = convertCoordinatesEventToGL(ev);
  
  let shape;
  if (g_selectedType === 'square') {
    shape = new Square();
  } else if (g_selectedType === 'triangle') {
    shape = new Triangle();
  } else if (g_selectedType === 'circle') {
    shape = new Circle();
    shape.segments = g_selectedSegments;
  }
  
  shape.position = [x, y];
  shape.color = [g_selectedColor[0], g_selectedColor[1], g_selectedColor[2], g_selectedAlpha];
  shape.size = g_selectedSize;
  
  g_shapesList.push(shape);
  
  renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();
  
  x = ((x - rect.left) - canvas.width/2) / (canvas.width/2);
  y = (canvas.height/2 - (y - rect.top)) / (canvas.height/2);
  
  return [x, y];
}

function clearCanvas() {
  g_shapesList = [];
  renderAllShapes();
}

function renderAllShapes() {
  // Clear canvas
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  // Render all shapes
  for (let i = 0; i < g_shapesList.length; i++) {
    g_shapesList[i].render();
  }
}

// Shape Classes

class Square {
  constructor() {
    this.type = 'square';
    this.position = [0.0, 0.0];
    this.color = [1.0, 0.0, 0.0, 1.0];
    this.size = 20.0;
  }
  
  render() {
    let xy = this.position;
    let rgba = this.color;
    let size = this.size / 400.0; // Convert to clip space
    
    // Pass color to shader
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    
    // Draw square using two triangles
    let d = size / 2;
    drawTriangle([xy[0]-d, xy[1]-d, xy[0]+d, xy[1]-d, xy[0]+d, xy[1]+d]);
    drawTriangle([xy[0]-d, xy[1]-d, xy[0]+d, xy[1]+d, xy[0]-d, xy[1]+d]);
  }
}

class Triangle {
  constructor() {
    this.type = 'triangle';
    this.position = [0.0, 0.0];
    this.color = [1.0, 0.0, 0.0, 1.0];
    this.size = 20.0;
  }
  
  render() {
    let xy = this.position;
    let rgba = this.color;
    let size = this.size / 400.0;
    
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    
    let d = size / 2;
    drawTriangle([xy[0], xy[1]+d, xy[0]-d, xy[1]-d, xy[0]+d, xy[1]-d]);
  }
}

class Circle {
  constructor() {
    this.type = 'circle';
    this.position = [0.0, 0.0];
    this.color = [1.0, 0.0, 0.0, 1.0];
    this.size = 20.0;
    this.segments = 10;
  }
  
  render() {
    let xy = this.position;
    let rgba = this.color;
    let d = this.size / 400.0;
    
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    
    let angleStep = 360 / this.segments;
    for (let angle = 0; angle < 360; angle += angleStep) {
      let centerPt = [xy[0], xy[1]];
      let angle1 = angle;
      let angle2 = angle + angleStep;
      let vec1 = [Math.cos(angle1 * Math.PI / 180) * d, Math.sin(angle1 * Math.PI / 180) * d];
      let vec2 = [Math.cos(angle2 * Math.PI / 180) * d, Math.sin(angle2 * Math.PI / 180) * d];
      let pt1 = [centerPt[0] + vec1[0], centerPt[1] + vec1[1]];
      let pt2 = [centerPt[0] + vec2[0], centerPt[1] + vec2[1]];
      
      drawTriangle([xy[0], xy[1], pt1[0], pt1[1], pt2[0], pt2[1]]);
    }
  }
}

function drawTriangle(vertices) {
  let n = 3;
  
  let vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  
  gl.drawArrays(gl.TRIANGLES, 0, n);
}

// Function to draw the personalized picture with TL initials using custom triangle vertices
function drawMyPicture() {
  // Clear previous shapes
  g_shapesList = [];
  
  // Set background color to sky blue
  gl.clearColor(0.53, 0.81, 0.92, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  // Letter "T" - Made from mountain-shaped triangles (GREEN MOUNTAINS)
  // Vertical part of T (mountain range going down)
  let tColor = [0.2, 0.6, 0.2, 1.0]; // Green
  
  // Top horizontal bar of T (3 mountains)
  drawTriangle([-0.8, 0.5, -0.7, 0.7, -0.6, 0.5]); // Left peak
  gl.uniform4f(u_FragColor, tColor[0], tColor[1], tColor[2], tColor[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  
  drawTriangle([-0.65, 0.5, -0.5, 0.7, -0.35, 0.5]); // Center peak
  gl.uniform4f(u_FragColor, tColor[0], tColor[1], tColor[2], tColor[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  
  drawTriangle([-0.4, 0.5, -0.3, 0.7, -0.2, 0.5]); // Right peak
  gl.uniform4f(u_FragColor, tColor[0], tColor[1], tColor[2], tColor[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  
  // Vertical stem of T (4 large mountains going down)
  drawTriangle([-0.6, 0.45, -0.5, 0.65, -0.4, 0.45]);
  gl.uniform4f(u_FragColor, tColor[0], tColor[1], tColor[2], tColor[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  
  drawTriangle([-0.6, 0.3, -0.5, 0.5, -0.4, 0.3]);
  gl.uniform4f(u_FragColor, tColor[0], tColor[1], tColor[2], tColor[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  
  drawTriangle([-0.6, 0.1, -0.5, 0.3, -0.4, 0.1]);
  gl.uniform4f(u_FragColor, tColor[0], tColor[1], tColor[2], tColor[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  
  drawTriangle([-0.6, -0.1, -0.5, 0.1, -0.4, -0.1]);
  gl.uniform4f(u_FragColor, tColor[0], tColor[1], tColor[2], tColor[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  
  drawTriangle([-0.6, -0.3, -0.5, -0.1, -0.4, -0.3]);
  gl.uniform4f(u_FragColor, tColor[0], tColor[1], tColor[2], tColor[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  
  // Letter "L" - Made from mountain-shaped triangles (ORANGE/BROWN MOUNTAINS)
  let lColor = [0.8, 0.5, 0.2, 1.0]; // Orange/Brown
  
  // Vertical part of L (5 mountains going down)
  drawTriangle([0.15, 0.5, 0.25, 0.7, 0.35, 0.5]);
  gl.uniform4f(u_FragColor, lColor[0], lColor[1], lColor[2], lColor[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  
  drawTriangle([0.15, 0.3, 0.25, 0.5, 0.35, 0.3]);
  gl.uniform4f(u_FragColor, lColor[0], lColor[1], lColor[2], lColor[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  
  drawTriangle([0.15, 0.1, 0.25, 0.3, 0.35, 0.1]);
  gl.uniform4f(u_FragColor, lColor[0], lColor[1], lColor[2], lColor[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  
  drawTriangle([0.15, -0.1, 0.25, 0.1, 0.35, -0.1]);
  gl.uniform4f(u_FragColor, lColor[0], lColor[1], lColor[2], lColor[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  
  drawTriangle([0.15, -0.3, 0.25, -0.1, 0.35, -0.3]);
  gl.uniform4f(u_FragColor, lColor[0], lColor[1], lColor[2], lColor[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  
  // Horizontal bottom part of L (4 mountains going right)
  drawTriangle([0.3, -0.35, 0.35, -0.2, 0.4, -0.35]);
  gl.uniform4f(u_FragColor, lColor[0], lColor[1], lColor[2], lColor[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  
  drawTriangle([0.45, -0.35, 0.5, -0.2, 0.55, -0.35]);
  gl.uniform4f(u_FragColor, lColor[0], lColor[1], lColor[2], lColor[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  
  drawTriangle([0.6, -0.35, 0.65, -0.2, 0.7, -0.35]);
  gl.uniform4f(u_FragColor, lColor[0], lColor[1], lColor[2], lColor[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  
  drawTriangle([0.75, -0.35, 0.8, -0.2, 0.85, -0.35]);
  gl.uniform4f(u_FragColor, lColor[0], lColor[1], lColor[2], lColor[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  
  // Add decorative mountains in background (lighter green)
  let bgColor = [0.4, 0.7, 0.4, 0.6]; // Lighter green with transparency
  
  drawTriangle([-0.9, -0.5, -0.7, 0.0, -0.5, -0.5]);
  gl.uniform4f(u_FragColor, bgColor[0], bgColor[1], bgColor[2], bgColor[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  
  drawTriangle([-0.3, -0.5, -0.1, 0.1, 0.1, -0.5]);
  gl.uniform4f(u_FragColor, bgColor[0], bgColor[1], bgColor[2], bgColor[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  
  drawTriangle([0.5, -0.5, 0.7, 0.0, 0.9, -0.5]);
  gl.uniform4f(u_FragColor, bgColor[0], bgColor[1], bgColor[2], bgColor[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  
  // Add a sun (using triangles in a circle pattern - 6 triangles)
  let sunColor = [1.0, 0.9, 0.2, 1.0]; // Yellow
  let sunCenter = [0.0, 0.85];
  let sunRadius = 0.08;
  
  for (let i = 0; i < 6; i++) {
    let angle1 = (i * 60) * Math.PI / 180;
    let angle2 = ((i + 1) * 60) * Math.PI / 180;
    let x1 = sunCenter[0] + Math.cos(angle1) * sunRadius;
    let y1 = sunCenter[1] + Math.sin(angle1) * sunRadius;
    let x2 = sunCenter[0] + Math.cos(angle2) * sunRadius;
    let y2 = sunCenter[1] + Math.sin(angle2) * sunRadius;
    
    drawTriangle([sunCenter[0], sunCenter[1], x1, y1, x2, y2]);
    gl.uniform4f(u_FragColor, sunColor[0], sunColor[1], sunColor[2], sunColor[3]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  
  // Ground triangles (dark green grass - 4 triangles)
  let groundColor = [0.1, 0.4, 0.1, 1.0];
  
  drawTriangle([-1.0, -0.5, -0.5, -0.5, -1.0, -1.0]);
  gl.uniform4f(u_FragColor, groundColor[0], groundColor[1], groundColor[2], groundColor[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  
  drawTriangle([-0.5, -0.5, 0.0, -0.5, -0.5, -1.0]);
  gl.uniform4f(u_FragColor, groundColor[0], groundColor[1], groundColor[2], groundColor[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  
  drawTriangle([0.0, -0.5, 0.5, -0.5, 0.0, -1.0]);
  gl.uniform4f(u_FragColor, groundColor[0], groundColor[1], groundColor[2], groundColor[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  
  drawTriangle([0.5, -0.5, 1.0, -0.5, 0.5, -1.0]);
  gl.uniform4f(u_FragColor, groundColor[0], groundColor[1], groundColor[2], groundColor[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  
  // Total triangles: 8 (T) + 9 (L) + 3 (bg mountains) + 6 (sun) + 4 (ground) = 30 triangles!
}
