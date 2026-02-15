// asg3.js - Main application file for Assignment 3: Virtual World

// Vertex Shader
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  varying vec2 v_UV;

  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }
`;

// Fragment Shader
var FSHADER_SOURCE = `
  precision mediump float;

  varying vec2 v_UV;

  uniform vec4 u_baseColor;
  uniform float u_texColorWeight;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform int u_whichTexture;

  void main() {
    vec4 texColor;

    if (u_whichTexture == 0) {
      texColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1) {
      texColor = texture2D(u_Sampler1, v_UV);
    } else if (u_whichTexture == 2) {
      texColor = texture2D(u_Sampler2, v_UV);
    } else if (u_whichTexture == 3) {
      texColor = texture2D(u_Sampler3, v_UV);
    } else {
      texColor = vec4(1.0);
    }

    gl_FragColor = (1.0 - u_texColorWeight) * u_baseColor + u_texColorWeight * texColor;
  }
`;

// ============ Globals ============
var gl, canvas, camera, world, cubeRenderer;
var g_startTime;
var g_frameCount = 0;
var g_fps = 0;
var g_lastFPSTime = 0;
var g_keys = {};
var g_wallBatch = null;
var g_needsRebuild = true;
var g_pointerLocked = false;
var u_ViewMatrix, u_ProjectionMatrix;

function main() {
  canvas = document.getElementById('webgl');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  gl = getWebGLContext(canvas, false);
  if (!gl) { console.error('Failed to get WebGL context'); return; }

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.error('Failed to init shaders'); return;
  }

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.clearColor(0.53, 0.53, 0.84, 1.0);

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');

  camera = new Camera(canvas);
  world = new World();
  cubeRenderer = new CubeRenderer(gl, gl.program);

  world.showStoryTime = 240;
  world.storyIndex = 0;

  createAllTextures();
  setupInputHandlers();

  g_startTime = performance.now() / 1000;
  g_lastFPSTime = g_startTime;

  function tick() {
    updateFPS();
    handleKeys();
    updateWorld();
    renderScene();
    requestAnimationFrame(tick);
  }
  tick();
}

// ============ Procedural Textures ============

function createAllTextures() {
  createDirtTexture(0);
  createDirtTexture2(1);
  createGrassTexture(2);
  createGoldTexture(3);
}

function createDirtTexture(unit) {
  var size = 16;
  var c = document.createElement('canvas');
  c.width = size; c.height = size;
  var ctx = c.getContext('2d');
  var imgData = ctx.createImageData(size, size);
  var d = imgData.data;

  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      var i = (y * size + x) * 4;
      var rand = Math.random();
      if (rand < 0.07) {
        d[i]=115+Math.floor(Math.random()*35);
        d[i+1]=120+Math.floor(Math.random()*35);
        d[i+2]=140+Math.floor(Math.random()*40);
      } else if (rand < 0.22) {
        d[i]=95+Math.floor(Math.random()*25);
        d[i+1]=65+Math.floor(Math.random()*20);
        d[i+2]=35+Math.floor(Math.random()*15);
      } else if (rand < 0.50) {
        d[i]=140+Math.floor(Math.random()*20);
        d[i+1]=100+Math.floor(Math.random()*20);
        d[i+2]=55+Math.floor(Math.random()*15);
      } else if (rand < 0.75) {
        d[i]=170+Math.floor(Math.random()*20);
        d[i+1]=130+Math.floor(Math.random()*20);
        d[i+2]=75+Math.floor(Math.random()*15);
      } else {
        d[i]=155+Math.floor(Math.random()*15);
        d[i+1]=115+Math.floor(Math.random()*15);
        d[i+2]=65+Math.floor(Math.random()*10);
      }
      d[i+3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  loadTextureFromCanvas(c, unit);
}

function createDirtTexture2(unit) {
  var size = 16;
  var c = document.createElement('canvas');
  c.width = size; c.height = size;
  var ctx = c.getContext('2d');
  var imgData = ctx.createImageData(size, size);
  var d = imgData.data;
  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      var i = (y * size + x) * 4;
      var rand = Math.random();
      if (rand < 0.05) {
        d[i]=130; d[i+1]=135; d[i+2]=155;
      } else if (rand < 0.3) {
        d[i]=105+Math.floor(Math.random()*20);
        d[i+1]=75+Math.floor(Math.random()*15);
        d[i+2]=42+Math.floor(Math.random()*12);
      } else if (rand < 0.65) {
        d[i]=148+Math.floor(Math.random()*18);
        d[i+1]=108+Math.floor(Math.random()*15);
        d[i+2]=62+Math.floor(Math.random()*12);
      } else {
        d[i]=175+Math.floor(Math.random()*15);
        d[i+1]=128+Math.floor(Math.random()*18);
        d[i+2]=78+Math.floor(Math.random()*12);
      }
      d[i+3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  loadTextureFromCanvas(c, unit);
}

function createGrassTexture(unit) {
  var size = 16;
  var c = document.createElement('canvas');
  c.width = size; c.height = size;
  var ctx = c.getContext('2d');
  var imgData = ctx.createImageData(size, size);
  var d = imgData.data;
  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      var i = (y * size + x) * 4;
      d[i]=70+Math.floor(Math.random()*40);
      d[i+1]=150+Math.floor(Math.random()*60);
      d[i+2]=25+Math.floor(Math.random()*30);
      d[i+3]=255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  loadTextureFromCanvas(c, unit);
}

function createGoldTexture(unit) {
  var size = 16;
  var c = document.createElement('canvas');
  c.width = size; c.height = size;
  var ctx = c.getContext('2d');
  var imgData = ctx.createImageData(size, size);
  var d = imgData.data;
  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      var i = (y * size + x) * 4;
      d[i]=220+Math.floor(Math.random()*35);
      d[i+1]=180+Math.floor(Math.random()*40);
      d[i+2]=20+Math.floor(Math.random()*30);
      d[i+3]=255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  loadTextureFromCanvas(c, unit);
}

function loadTextureFromCanvas(canvas2d, unit) {
  var texture = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2d);
  gl.uniform1i(gl.getUniformLocation(gl.program, 'u_Sampler' + unit), unit);
}

// ============ Input ============

function setupInputHandlers() {
  document.addEventListener('keydown', function(ev) { g_keys[ev.key.toLowerCase()] = true; });
  document.addEventListener('keyup', function(ev) { g_keys[ev.key.toLowerCase()] = false; });

  canvas.addEventListener('click', function(ev) {
    if (!g_pointerLocked) {
      canvas.requestPointerLock();
    } else {
      handleBlockAction(ev);
    }
  });

  document.addEventListener('pointerlockchange', function() {
    g_pointerLocked = (document.pointerLockElement === canvas);
  });

  document.addEventListener('mousemove', function(ev) {
    if (g_pointerLocked) camera.handleMouseMove(ev.movementX, ev.movementY);
  });

  window.addEventListener('resize', function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    camera.projectionMatrix.setPerspective(camera.fov, canvas.width / canvas.height, 0.1, 1000);
  });
}

function handleBlockAction(ev) {
  let pos = camera.getBlockInFront();
  if (ev.shiftKey) {
    if (world.removeBlock(pos[0], pos[1])) g_needsRebuild = true;
  } else {
    if (world.addBlock(pos[0], pos[1])) g_needsRebuild = true;
  }
}

function handleKeys() {
  if (g_keys['w']) camera.moveForward();
  if (g_keys['s']) camera.moveBackwards();
  if (g_keys['a']) camera.moveLeft();
  if (g_keys['d']) camera.moveRight();
  if (g_keys['q']) camera.panLeft();
  if (g_keys['e']) camera.panRight();
}

// ============ Update ============

function updateFPS() {
  g_frameCount++;
  var now = performance.now() / 1000;
  if (now - g_lastFPSTime >= 1.0) {
    g_fps = g_frameCount;
    g_frameCount = 0;
    g_lastFPSTime = now;
    document.getElementById('fps').textContent = 'FPS: ' + g_fps;
  }
}

function updateWorld() {
  var t = performance.now() / 1000 - g_startTime;
  world.updateAnimal(t);

  let cx = camera.eye.elements[0];
  let cz = camera.eye.elements[2];
  world.checkCoinCollection(cx, cz);

  document.getElementById('pos').textContent =
    'Pos: ' + cx.toFixed(1) + ', ' + cz.toFixed(1);
  document.getElementById('coins').textContent =
    'Coins: ' + world.coinsCollected + ' / ' + world.totalCoins;

  var msg = world.getStoryMessage();
  var storyEl = document.getElementById('story');
  if (msg) {
    storyEl.textContent = msg;
    storyEl.classList.add('show');
  } else {
    storyEl.classList.remove('show');
  }
}

// ============ Render ============

function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);

  if (g_needsRebuild) {
    var cubes = world.buildAllWallCubes();
    g_wallBatch = cubeRenderer.buildBatch(cubes);
    g_needsRebuild = false;
  }

  // Sky box
  gl.disable(gl.CULL_FACE);
  cubeRenderer.drawScaledCube(
    500, 500, 500, -250, -50, -250,
    -1, [0.53, 0.53, 0.84, 1.0]
  );
  gl.enable(gl.CULL_FACE);

  // Ground
  cubeRenderer.drawScaledCube(
    40, 0.01, 40, -4, -0.01, -4,
    -1, [0.55, 0.78, 0.22, 1.0]
  );

  // Walls
  if (g_wallBatch) {
    cubeRenderer.drawBatch(g_wallBatch, 0, null);
  }

  // Coins
  drawCoins();

  // Animal
  drawAnimal();
}

function drawCoins() {
  var t = performance.now() / 1000;
  for (var c of world.coins) {
    if (c.collected) continue;
    var bobY = Math.sin(t * 3 + c.x) * 0.15 + 0.5;
    gl.disable(gl.CULL_FACE);

    var m = cubeRenderer.modelMatrix;
    m.setIdentity();
    m.translate(c.x + 0.5, bobY, c.z + 0.5);
    m.rotate(t * 90, 0, 1, 0);
    m.scale(0.3, 0.3, 0.08);

    gl.uniformMatrix4fv(cubeRenderer.u_ModelMatrix, false, m.elements);
    gl.uniform1i(cubeRenderer.u_whichTexture, 3);
    gl.uniform1f(cubeRenderer.u_texColorWeight, 1.0);

    cubeRenderer.setupAttribs(cubeRenderer.CUBE_VERTS);
    gl.drawArrays(gl.TRIANGLES, 0, cubeRenderer.VERTS_PER_CUBE);
    gl.enable(gl.CULL_FACE);
  }
}

function drawAnimal() {
  var ax = world.animalX;
  var az = world.animalZ;
  var bobY = world.animalBob;
  var angle = world.animalAngle;
  var m = cubeRenderer.modelMatrix;

  function colorCube(sx, sy, sz, tx, ty, tz, r, g, b) {
    m.setIdentity();
    m.translate(ax + tx, ty + bobY, az + tz);
    m.rotate(angle, 0, 1, 0);
    m.scale(sx, sy, sz);
    gl.uniformMatrix4fv(cubeRenderer.u_ModelMatrix, false, m.elements);
    gl.uniform1i(cubeRenderer.u_whichTexture, -1);
    gl.uniform1f(cubeRenderer.u_texColorWeight, 0.0);
    gl.uniform4f(cubeRenderer.u_baseColor, r, g, b, 1.0);
    cubeRenderer.setupAttribs(cubeRenderer.CUBE_VERTS);
    gl.drawArrays(gl.TRIANGLES, 0, cubeRenderer.VERTS_PER_CUBE);
  }

  // Duck: body, head, beak, eyes
  colorCube(0.6, 0.4, 0.8, -0.3, 0.3, -0.4, 1.0, 1.0, 0.9);
  colorCube(0.35, 0.35, 0.35, -0.17, 0.6, -0.65, 1.0, 1.0, 0.9);
  colorCube(0.15, 0.08, 0.15, -0.07, 0.65, -0.85, 1.0, 0.6, 0.0);
  colorCube(0.05, 0.05, 0.05, -0.2, 0.72, -0.7, 0.0, 0.0, 0.0);
  colorCube(0.05, 0.05, 0.05, 0.05, 0.72, -0.7, 0.0, 0.0, 0.0);
}

main();
