// asg4.js - Assignment 4: Phong Lighting
// Name: Tenzin Lekphel

var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform mat4 u_NormalMatrix;

  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec3 v_WorldPos;

  void main() {
    vec4 worldPos = u_ModelMatrix * a_Position;
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * worldPos;
    v_UV = a_UV;
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 0.0)));
    v_WorldPos = worldPos.xyz;
  }
`;

var FSHADER_SOURCE = `
  precision mediump float;

  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec3 v_WorldPos;

  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform int u_whichTexture;
  uniform vec4 u_baseColor;
  uniform float u_texColorWeight;

  uniform int u_lightingOn;
  uniform int u_showNormals;

  // Point light
  uniform int u_pointLightOn;
  uniform vec3 u_lightPos;
  uniform vec3 u_lightColor;

  // Spot light
  uniform int u_spotLightOn;
  uniform vec3 u_spotPos;
  uniform vec3 u_spotDir;
  uniform float u_spotCosineCutoff;
  uniform float u_spotExponent;

  uniform vec3 u_cameraPos;

  vec3 calcPhong(vec3 lightPos, vec3 lightColor, vec3 normal, vec3 worldPos, vec3 baseRGB) {
    vec3 L = normalize(lightPos - worldPos);
    vec3 N = normalize(normal);
    vec3 V = normalize(u_cameraPos - worldPos);
    vec3 R = reflect(-L, N);

    float diff = max(dot(N, L), 0.0);
    float spec = 0.0;
    if (diff > 0.0) {
      spec = pow(max(dot(R, V), 0.0), 32.0);
    }

    vec3 diffuse  = 0.75 * diff * lightColor * baseRGB;
    vec3 specular = 0.4 * spec * lightColor;

    return diffuse + specular;
  }

  void main() {
    vec4 baseColor;
    if (u_whichTexture == 0) {
      baseColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1) {
      baseColor = texture2D(u_Sampler1, v_UV);
    } else if (u_whichTexture == 2) {
      baseColor = texture2D(u_Sampler2, v_UV);
    } else if (u_whichTexture == 3) {
      baseColor = texture2D(u_Sampler3, v_UV);
    } else {
      baseColor = u_baseColor;
    }
    baseColor = (1.0 - u_texColorWeight) * u_baseColor + u_texColorWeight * baseColor;

    if (u_showNormals == 1) {
      gl_FragColor = vec4(abs(v_Normal), 1.0);
      return;
    }

    if (u_lightingOn == 0) {
      gl_FragColor = baseColor;
      return;
    }

    vec3 base = baseColor.rgb;
    // Global ambient so nothing is ever pitch black
    vec3 color = 0.3 * base;

    if (u_pointLightOn == 1) {
      color += calcPhong(u_lightPos, u_lightColor, v_Normal, v_WorldPos, base);
    }

    if (u_spotLightOn == 1) {
      vec3 L = normalize(u_spotPos - v_WorldPos);
      float cosAngle = dot(-L, normalize(u_spotDir));
      if (cosAngle >= u_spotCosineCutoff) {
        float factor = pow(cosAngle, u_spotExponent);
        // 0.4 scale keeps spotlight from blowing out the ground
        color += 0.4 * factor * calcPhong(u_spotPos, vec3(1.0, 0.95, 0.8), v_Normal, v_WorldPos, base);
      }
    }

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), baseColor.a);
  }
`;

// ---- Globals ----
var gl, canvas, camera, world, cubeRenderer, sphere, objModel;
var g_startTime, g_frameCount = 0, g_fps = 0, g_lastFPSTime = 0;
var g_keys = {}, g_pointerLocked = false;
var g_wallBatch = null, g_needsRebuild = true;

var g_lightingOn = true;
var g_showNormals = false;
var g_pointLightOn = true;
var g_spotLightOn = true;

var g_lightY = 2.0;
var g_lightSpeed = 1.0;
var g_lightColor = [1.0, 1.0, 1.0];

var g_spotCutoffDeg = 20;
var g_spotExponent = 15;

// spotlight fixed above center, pointing down
var g_spotPos = [16, 8, 16];
var g_spotDir = [0, -1, 0];

var g_camAngleOffset = 0;

// uniform locations
var u_ViewMatrix, u_ProjectionMatrix, u_ModelMatrix, u_NormalMatrix;
var u_lightingOn, u_showNormals_loc, u_pointLightOn_loc, u_spotLightOn_loc;
var u_lightPos_loc, u_lightColor_loc, u_cameraPos_loc;
var u_spotPos_loc, u_spotDir_loc, u_spotCosineCutoff_loc, u_spotExponent_loc;

function main() {
  canvas = document.getElementById('webgl');
  canvas.width = window.innerWidth - 240;
  canvas.height = window.innerHeight;

  gl = getWebGLContext(canvas, false);
  if (!gl) { console.error('WebGL failed'); return; }
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) { console.error('Shader init failed'); return; }

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.clearColor(0.05, 0.05, 0.1, 1.0);

  // Cache uniform locations
  u_ViewMatrix       = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_ModelMatrix      = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_NormalMatrix     = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  u_lightingOn       = gl.getUniformLocation(gl.program, 'u_lightingOn');
  u_showNormals_loc  = gl.getUniformLocation(gl.program, 'u_showNormals');
  u_pointLightOn_loc = gl.getUniformLocation(gl.program, 'u_pointLightOn');
  u_spotLightOn_loc  = gl.getUniformLocation(gl.program, 'u_spotLightOn');
  u_lightPos_loc     = gl.getUniformLocation(gl.program, 'u_lightPos');
  u_lightColor_loc   = gl.getUniformLocation(gl.program, 'u_lightColor');
  u_cameraPos_loc    = gl.getUniformLocation(gl.program, 'u_cameraPos');
  u_spotPos_loc      = gl.getUniformLocation(gl.program, 'u_spotPos');
  u_spotDir_loc      = gl.getUniformLocation(gl.program, 'u_spotDir');
  u_spotCosineCutoff_loc = gl.getUniformLocation(gl.program, 'u_spotCosineCutoff');
  u_spotExponent_loc = gl.getUniformLocation(gl.program, 'u_spotExponent');

  camera = new Camera(canvas);
  world  = new World();
  cubeRenderer = new CubeRenderer(gl, gl.program);
  sphere = new Sphere(gl, gl.program, 24, 24);
  objModel = new ObjModel(gl, gl.program);

  createAllTextures();
  setupInputHandlers();

  // Try to load the teapot obj; silently skip if not found
  objModel.load('models/teapot.obj');

  g_startTime = performance.now() / 1000;
  g_lastFPSTime = g_startTime;

  requestAnimationFrame(tick);
}

function tick() {
  var now = performance.now() / 1000;
  updateFPS(now);
  handleKeys();
  var t = now - g_startTime;
  world.updateAnimal(t);

  // Orbit point light
  var lx = 16 + Math.cos(t * g_lightSpeed) * 5;
  var lz = 16 + Math.sin(t * g_lightSpeed) * 5;

  renderScene(lx, g_lightY, lz);
  requestAnimationFrame(tick);
}

// ---- UI callbacks ----
function toggleLighting() {
  g_lightingOn = !g_lightingOn;
  var btn = document.getElementById('btnLighting');
  btn.textContent = 'Lighting: ' + (g_lightingOn ? 'ON' : 'OFF');
  btn.className = g_lightingOn ? 'active' : '';
}
function toggleNormals() {
  g_showNormals = !g_showNormals;
  var btn = document.getElementById('btnNormals');
  btn.textContent = 'Normal Vis: ' + (g_showNormals ? 'ON' : 'OFF');
  btn.className = g_showNormals ? 'active' : '';
}
function togglePointLight() {
  g_pointLightOn = !g_pointLightOn;
  var btn = document.getElementById('btnPointLight');
  btn.textContent = 'Point Light: ' + (g_pointLightOn ? 'ON' : 'OFF');
  btn.className = g_pointLightOn ? 'active' : '';
}
function toggleSpotLight() {
  g_spotLightOn = !g_spotLightOn;
  var btn = document.getElementById('btnSpotLight');
  btn.textContent = 'Spot Light: ' + (g_spotLightOn ? 'ON' : 'OFF');
  btn.className = g_spotLightOn ? 'active' : '';
}
function updateLightY(v) {
  g_lightY = parseFloat(v);
  document.getElementById('lblLightY').textContent = parseFloat(v).toFixed(1);
}
function updateLightSpeed(v) {
  g_lightSpeed = parseFloat(v);
  document.getElementById('lblLightSpeed').textContent = parseFloat(v).toFixed(1);
}
function updateLightColor(ch, v) {
  var idx = ch === 'r' ? 0 : ch === 'g' ? 1 : 2;
  g_lightColor[idx] = parseFloat(v);
  document.getElementById('lblL' + ch.toUpperCase()).textContent = parseFloat(v).toFixed(2);
}
function updateCutoff(v) {
  g_spotCutoffDeg = parseInt(v);
  document.getElementById('lblCutoff').textContent = v;
}
function updateSpotExp(v) {
  g_spotExponent = parseInt(v);
  document.getElementById('lblSpotExp').textContent = v;
}
function updateCamAngle(v) {
  g_camAngleOffset = parseFloat(v);
  document.getElementById('lblCamAngle').textContent = v;
  camera.yaw = -90 + g_camAngleOffset;
  camera.updateAtFromAngles();
}

// ---- Render ----
function renderScene(lx, ly, lz) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Pass camera + matrices
  camera.updateViewMatrix();
  gl.uniformMatrix4fv(u_ViewMatrix,       false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
  gl.uniform3f(u_cameraPos_loc,
    camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2]);

  // Lighting uniforms
  gl.uniform1i(u_lightingOn,       g_lightingOn ? 1 : 0);
  gl.uniform1i(u_showNormals_loc,  g_showNormals ? 1 : 0);
  gl.uniform1i(u_pointLightOn_loc, g_pointLightOn ? 1 : 0);
  gl.uniform1i(u_spotLightOn_loc,  g_spotLightOn ? 1 : 0);
  gl.uniform3f(u_lightPos_loc,   lx, ly, lz);
  gl.uniform3fv(u_lightColor_loc, g_lightColor);
  gl.uniform3fv(u_spotPos_loc,    g_spotPos);
  gl.uniform3fv(u_spotDir_loc,    g_spotDir);
  gl.uniform1f(u_spotCosineCutoff_loc, Math.cos(g_spotCutoffDeg * Math.PI / 180));
  gl.uniform1f(u_spotExponent_loc, g_spotExponent);

  // Rebuild wall batch if needed
  if (g_needsRebuild) {
    var cubes = world.buildAllWallCubes();
    g_wallBatch = cubeRenderer.buildBatch(cubes);
    g_needsRebuild = false;
  }

  // Sky (no lighting on skybox)
  gl.uniform1i(u_lightingOn, 0);
  gl.disable(gl.CULL_FACE);
  cubeRenderer.drawScaledCube(500, 500, 500, -250, -50, -250, -1, [0.02, 0.02, 0.08, 1.0]);
  gl.enable(gl.CULL_FACE);
  gl.uniform1i(u_lightingOn, g_lightingOn ? 1 : 0);

  // Ground
  cubeRenderer.drawScaledCube(40, 0.02, 40, -4, -0.01, -4, 2, null);

  // Walls
  if (g_wallBatch) cubeRenderer.drawBatch(g_wallBatch, 0, null);

  // Red sphere (center of world)
  drawSphereAt(16, 1.2, 16, [0.85, 0.1, 0.05, 1.0]);

  // Second sphere (near spotlight)
  drawSphereAt(16, 1.2, 12, [0.1, 0.3, 0.9, 1.0]);

  // OBJ model (teapot) near center
  if (objModel.ready) {
    var m = new Matrix4();
    m.setIdentity();
    m.translate(14, 0.0, 16);
    m.scale(0.35, 0.35, 0.35);
    gl.disable(gl.CULL_FACE);
    drawWithMatrix(m, -1, [0.7, 0.6, 0.2, 1.0], function() {
      objModel.draw();
    });
    gl.enable(gl.CULL_FACE);
  }

  // Duck animal
  drawAnimal();

  // Light marker cube (small white cube at light pos, no lighting)
  gl.uniform1i(u_lightingOn, 0);
  cubeRenderer.drawScaledCube(0.3, 0.3, 0.3, lx - 0.15, ly - 0.15, lz - 0.15, -1, g_lightColor.concat([1.0]));

  // Spotlight marker
  cubeRenderer.drawScaledCube(0.25, 0.25, 0.25,
    g_spotPos[0]-0.125, g_spotPos[1]-0.125, g_spotPos[2]-0.125,
    -1, [1.0, 0.9, 0.5, 1.0]);
  gl.uniform1i(u_lightingOn, g_lightingOn ? 1 : 0);

  // Coins
  drawCoins();
}

function drawSphereAt(x, y, z, color) {
  var m = new Matrix4();
  m.setIdentity();
  m.translate(x, y, z);
  m.scale(1.2, 1.2, 1.2);
  setModelMatrix(m);
  gl.uniform1i(gl.getUniformLocation(gl.program, 'u_whichTexture'), -1);
  gl.uniform1f(gl.getUniformLocation(gl.program, 'u_texColorWeight'), 0.0);
  gl.uniform4fv(gl.getUniformLocation(gl.program, 'u_baseColor'), color);
  gl.disable(gl.CULL_FACE);
  sphere.draw();
  gl.enable(gl.CULL_FACE);
}

function drawWithMatrix(m, texID, color, drawFn) {
  setModelMatrix(m);
  gl.uniform1i(gl.getUniformLocation(gl.program, 'u_whichTexture'), texID);
  if (texID < 0) {
    gl.uniform1f(gl.getUniformLocation(gl.program, 'u_texColorWeight'), 0.0);
    gl.uniform4fv(gl.getUniformLocation(gl.program, 'u_baseColor'), color);
  } else {
    gl.uniform1f(gl.getUniformLocation(gl.program, 'u_texColorWeight'), 1.0);
  }
  drawFn();
}

function setModelMatrix(m) {
  gl.uniformMatrix4fv(u_ModelMatrix, false, m.elements);
  // Normal matrix = transpose(inverse(M)) upper-left 3x3
  var nm = new Matrix4(m);
  nm.invert();
  nm.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, nm.elements);
}

function drawAnimal() {
  var ax = world.animalX, az = world.animalZ;
  var bobY = world.animalBob, angle = world.animalAngle;

  function part(sx, sy, sz, tx, ty, tz, r, g, b) {
    var m = new Matrix4();
    m.setIdentity();
    m.translate(ax + tx, ty + bobY, az + tz);
    m.rotate(angle, 0, 1, 0);
    m.scale(sx, sy, sz);
    setModelMatrix(m);
    gl.uniform1i(gl.getUniformLocation(gl.program, 'u_whichTexture'), -1);
    gl.uniform1f(gl.getUniformLocation(gl.program, 'u_texColorWeight'), 0.0);
    gl.uniform4f(gl.getUniformLocation(gl.program, 'u_baseColor'), r, g, b, 1.0);
    cubeRenderer.drawRaw();
  }

  part(0.6, 0.4, 0.8, -0.3, 0.3, -0.4,  1.0, 1.0, 0.9); // body
  part(0.35,0.35,0.35,-0.17,0.6,-0.65,   1.0, 1.0, 0.9); // head
  part(0.15,0.08,0.15,-0.07,0.65,-0.85,  1.0, 0.6, 0.0); // beak
  part(0.05,0.05,0.05,-0.2, 0.72,-0.7,   0.0, 0.0, 0.0); // eye L
  part(0.05,0.05,0.05, 0.05,0.72,-0.7,   0.0, 0.0, 0.0); // eye R
}

function drawCoins() {
  var t = performance.now() / 1000;
  gl.uniform1i(u_lightingOn, 0);
  gl.disable(gl.CULL_FACE);
  for (var c of world.coins) {
    if (c.collected) continue;
    var bobY = Math.sin(t * 3 + c.x) * 0.15 + 0.5;
    var m = new Matrix4();
    m.setIdentity();
    m.translate(c.x + 0.5, bobY, c.z + 0.5);
    m.rotate(t * 90, 0, 1, 0);
    m.scale(0.3, 0.3, 0.08);
    setModelMatrix(m);
    gl.uniform1i(gl.getUniformLocation(gl.program, 'u_whichTexture'), 3);
    gl.uniform1f(gl.getUniformLocation(gl.program, 'u_texColorWeight'), 1.0);
    cubeRenderer.drawRaw();
  }
  gl.enable(gl.CULL_FACE);
  gl.uniform1i(u_lightingOn, g_lightingOn ? 1 : 0);
}

// ---- Textures (same as asg3) ----
function createAllTextures() {
  createDirtTexture(0);
  createDirtTexture2(1);
  createGrassTexture(2);
  createGoldTexture(3);
}

function createDirtTexture(unit) {
  var sz = 16, c = document.createElement('canvas');
  c.width = sz; c.height = sz;
  var ctx = c.getContext('2d'), img = ctx.createImageData(sz, sz), d = img.data;
  for (var y = 0; y < sz; y++) for (var x = 0; x < sz; x++) {
    var i = (y*sz+x)*4, r = Math.random();
    if      (r < 0.07) { d[i]=115+rand(35); d[i+1]=120+rand(35); d[i+2]=140+rand(40); }
    else if (r < 0.22) { d[i]=95+rand(25);  d[i+1]=65+rand(20);  d[i+2]=35+rand(15);  }
    else if (r < 0.50) { d[i]=140+rand(20); d[i+1]=100+rand(20); d[i+2]=55+rand(15);  }
    else if (r < 0.75) { d[i]=170+rand(20); d[i+1]=130+rand(20); d[i+2]=75+rand(15);  }
    else               { d[i]=155+rand(15); d[i+1]=115+rand(15); d[i+2]=65+rand(10);  }
    d[i+3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  loadTex(c, unit);
}
function createDirtTexture2(unit) {
  var sz = 16, c = document.createElement('canvas');
  c.width = sz; c.height = sz;
  var ctx = c.getContext('2d'), img = ctx.createImageData(sz, sz), d = img.data;
  for (var y = 0; y < sz; y++) for (var x = 0; x < sz; x++) {
    var i = (y*sz+x)*4, r = Math.random();
    if      (r < 0.05) { d[i]=130;         d[i+1]=135;         d[i+2]=155;         }
    else if (r < 0.30) { d[i]=105+rand(20);d[i+1]=75+rand(15); d[i+2]=42+rand(12); }
    else if (r < 0.65) { d[i]=148+rand(18);d[i+1]=108+rand(15);d[i+2]=62+rand(12); }
    else               { d[i]=175+rand(15);d[i+1]=128+rand(18);d[i+2]=78+rand(12); }
    d[i+3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  loadTex(c, unit);
}
function createGrassTexture(unit) {
  var sz = 16, c = document.createElement('canvas');
  c.width = sz; c.height = sz;
  var ctx = c.getContext('2d'), img = ctx.createImageData(sz, sz), d = img.data;
  for (var y = 0; y < sz; y++) for (var x = 0; x < sz; x++) {
    var i = (y*sz+x)*4;
    d[i]=70+rand(40); d[i+1]=150+rand(60); d[i+2]=25+rand(30); d[i+3]=255;
  }
  ctx.putImageData(img, 0, 0);
  loadTex(c, unit);
}
function createGoldTexture(unit) {
  var sz = 16, c = document.createElement('canvas');
  c.width = sz; c.height = sz;
  var ctx = c.getContext('2d'), img = ctx.createImageData(sz, sz), d = img.data;
  for (var y = 0; y < sz; y++) for (var x = 0; x < sz; x++) {
    var i = (y*sz+x)*4;
    d[i]=220+rand(35); d[i+1]=180+rand(40); d[i+2]=20+rand(30); d[i+3]=255;
  }
  ctx.putImageData(img, 0, 0);
  loadTex(c, unit);
}
function rand(n) { return Math.floor(Math.random()*n); }
function loadTex(c2d, unit) {
  var tex = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c2d);
  gl.uniform1i(gl.getUniformLocation(gl.program, 'u_Sampler' + unit), unit);
}

// ---- Input ----
function setupInputHandlers() {
  document.addEventListener('keydown', function(e) { g_keys[e.key.toLowerCase()] = true; });
  document.addEventListener('keyup',   function(e) { g_keys[e.key.toLowerCase()] = false; });

  canvas.addEventListener('click', function(e) {
    if (!g_pointerLocked) { canvas.requestPointerLock(); }
    else { handleBlockAction(e); }
  });
  document.addEventListener('pointerlockchange', function() {
    g_pointerLocked = (document.pointerLockElement === canvas);
  });
  document.addEventListener('mousemove', function(e) {
    if (g_pointerLocked) camera.handleMouseMove(e.movementX, e.movementY);
  });
  window.addEventListener('resize', function() {
    canvas.width = window.innerWidth - 240;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    camera.projectionMatrix.setPerspective(camera.fov, canvas.width/canvas.height, 0.1, 1000);
  });
}

function handleBlockAction(e) {
  var pos = camera.getBlockInFront();
  if (e.shiftKey) { if (world.removeBlock(pos[0], pos[1])) g_needsRebuild = true; }
  else            { if (world.addBlock(pos[0], pos[1]))    g_needsRebuild = true; }
}

function handleKeys() {
  if (g_keys['w']) camera.moveForward();
  if (g_keys['s']) camera.moveBackwards();
  if (g_keys['a']) camera.moveLeft();
  if (g_keys['d']) camera.moveRight();
  if (g_keys['q']) camera.panLeft();
  if (g_keys['e']) camera.panRight();
}

function updateFPS(now) {
  g_frameCount++;
  if (now - g_lastFPSTime >= 1.0) {
    g_fps = g_frameCount; g_frameCount = 0; g_lastFPSTime = now;
    document.getElementById('fps').textContent = 'FPS: ' + g_fps;
  }
  var cx = camera.eye.elements[0], cz = camera.eye.elements[2];
  document.getElementById('pos').textContent = 'Pos: '+cx.toFixed(1)+', '+cz.toFixed(1);
  world.checkCoinCollection(cx, cz);
}

main();
