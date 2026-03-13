// asg5.js - Assignment 5: Three.js World
// Name: Tenzin Lekphel
// Uses Three.js (high-level 3D library) to recreate the A3/A4 virtual world.

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ============ Globals ============
var renderer, scene, camera, controls;
var world;  // World class loaded globally from World.js
var g_startTime, g_frameCount = 0, g_fps = 0, g_lastFPSTime = 0;
var g_keys = {};
var g_pointerLocked = false;
var g_speed = 0.15;

// Animated objects
var g_coins3D = [];
var g_flames = [];
var g_torchLights = [];
var g_crystals = [];
var g_particles = [];
var g_orbMeshes = [];
var g_duckGroup;

// ============ Procedural Textures (same style as A3/A4) ============
function rand(n) { return Math.floor(Math.random() * n); }

function createDirtTexture() {
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
  var tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createGrassTexture() {
  var sz = 16, c = document.createElement('canvas');
  c.width = sz; c.height = sz;
  var ctx = c.getContext('2d'), img = ctx.createImageData(sz, sz), d = img.data;
  for (var y = 0; y < sz; y++) for (var x = 0; x < sz; x++) {
    var i = (y*sz+x)*4;
    d[i]=70+rand(40); d[i+1]=150+rand(60); d[i+2]=25+rand(30); d[i+3]=255;
  }
  ctx.putImageData(img, 0, 0);
  var tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createStoneTexture() {
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
  var tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createGoldTexture() {
  var sz = 16, c = document.createElement('canvas');
  c.width = sz; c.height = sz;
  var ctx = c.getContext('2d'), img = ctx.createImageData(sz, sz), d = img.data;
  for (var y = 0; y < sz; y++) for (var x = 0; x < sz; x++) {
    var i = (y*sz+x)*4;
    d[i]=220+rand(35); d[i+1]=180+rand(40); d[i+2]=20+rand(30); d[i+3]=255;
  }
  ctx.putImageData(img, 0, 0);
  var tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createWoodTexture() {
  var sz = 16, c = document.createElement('canvas');
  c.width = sz; c.height = sz;
  var ctx = c.getContext('2d');
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(0, 0, sz, sz);
  for (var row = 0; row < sz; row += 2) {
    ctx.fillStyle = 'rgb('+(120+rand(30))+','+(70+rand(20))+','+(30+rand(15))+')';
    ctx.fillRect(0, row, sz, 2);
  }
  var tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ============ Skybox (CubeTexture - 6 faces as required) ============
function createSkyboxTexture() {
  var size = 256, faces = [];
  for (var f = 0; f < 6; f++) {
    var c = document.createElement('canvas');
    c.width = size; c.height = size;
    var ctx = c.getContext('2d');
    var grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#0a0a2e');
    grad.addColorStop(0.4, '#16213e');
    grad.addColorStop(0.7, '#1a1a4e');
    grad.addColorStop(1, '#0f3460');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    for (var s = 0; s < 80; s++) {
      var sx = Math.random() * size, sy = Math.random() * size * 0.7;
      ctx.beginPath();
      ctx.arc(sx, sy, Math.random() * 1.5 + 0.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,'+(200+rand(55))+','+(0.5+Math.random()*0.5)+')';
      ctx.fill();
    }
    faces.push(c);
  }
  var tex = new THREE.CubeTexture(faces);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// ============ Main ============
function main() {
  var canvas = document.getElementById('webgl');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // ---- Renderer ----
  renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // ---- Scene ----
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x1a1a2e, 0.02);
  scene.background = createSkyboxTexture();

  // ---- Camera (perspective projection) ----
  camera = new THREE.PerspectiveCamera(60, canvas.width / canvas.height, 0.1, 500);
  camera.position.set(4, 1.5, 4);

  // ---- Controls (pointer lock, same as A3/A4) ----
  controls = new PointerLockControls(camera, document.body);
  canvas.addEventListener('click', function() { controls.lock(); });
  document.addEventListener('pointerlockchange', function() {
    g_pointerLocked = !!document.pointerLockElement;
  });

  // ---- World (global class from World.js script tag) ----
  world = new World();

  // ---- Build everything ----
  setupLights();
  buildGround();
  buildWalls();
  buildShapes();
  buildCoins();
  buildDuck();
  loadGLTFModel();
  setupInputHandlers();

  g_startTime = performance.now() / 1000;
  g_lastFPSTime = g_startTime;
  requestAnimationFrame(tick);
}

// ============ Lights (3+ different types required) ============
function setupLights() {
  // 1. Ambient Light
  scene.add(new THREE.AmbientLight(0x404060, 0.5));

  // 2. Directional Light (moonlight with shadows)
  var dirLight = new THREE.DirectionalLight(0x8888ff, 1.0);
  dirLight.position.set(20, 30, 10);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 100;
  dirLight.shadow.camera.left = -30;
  dirLight.shadow.camera.right = 30;
  dirLight.shadow.camera.top = 30;
  dirLight.shadow.camera.bottom = -30;
  scene.add(dirLight);

  // 3. Hemisphere Light (sky/ground blending)
  scene.add(new THREE.HemisphereLight(0x4466aa, 0x553311, 0.4));

  // 4. Point Lights (torches)
  var torchPositions = [
    [5,2.5,5],[15,2.5,5],[25,2.5,5],
    [5,2.5,15],[25,2.5,15],
    [5,2.5,25],[15,2.5,25],[25,2.5,25],
  ];
  torchPositions.forEach(function(pos) {
    var light = new THREE.PointLight(0xff6600, 2, 10, 1.5);
    light.position.set(pos[0], pos[1], pos[2]);
    scene.add(light);
    g_torchLights.push({ light: light, pos: pos });
  });

  // 5. Spot Light (dramatic center spotlight, same as A4's u_spotPos/u_spotDir)
  var spotLight = new THREE.SpotLight(0xffffff, 5, 20, Math.PI / 6, 0.5, 1);
  spotLight.position.set(16, 8, 16);
  spotLight.target.position.set(16, 0, 16);
  spotLight.castShadow = true;
  scene.add(spotLight);
  scene.add(spotLight.target);
}

// ============ Ground ============
function buildGround() {
  var grassTex = createGrassTexture();
  grassTex.repeat.set(16, 16);
  var geo = new THREE.PlaneGeometry(32, 32);
  var mat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.9 });
  var ground = new THREE.Mesh(geo, mat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(16, 0, 16);
  ground.receiveShadow = true;
  scene.add(ground);
}

// ============ Walls (InstancedMesh of cubes from world.map) ============
function buildWalls() {
  var wallCount = 0;
  for (var x = 0; x < world.MAP_SIZE; x++)
    for (var z = 0; z < world.MAP_SIZE; z++)
      wallCount += world.map[x][z];

  var geo = new THREE.BoxGeometry(1, 1, 1);
  var mat = new THREE.MeshStandardMaterial({ map: createStoneTexture(), roughness: 0.85 });
  var mesh = new THREE.InstancedMesh(geo, mat, wallCount);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  var dummy = new THREE.Object3D();
  var idx = 0;
  for (var x = 0; x < world.MAP_SIZE; x++) {
    for (var z = 0; z < world.MAP_SIZE; z++) {
      for (var y = 0; y < world.map[x][z]; y++) {
        dummy.position.set(x + 0.5, y + 0.5, z + 0.5);
        dummy.updateMatrix();
        mesh.setMatrixAt(idx++, dummy.matrix);
      }
    }
  }
  scene.add(mesh);
}

// ============ Shapes (20+ primary shapes, 3+ kinds) ============
function buildShapes() {
  var woodMat = new THREE.MeshStandardMaterial({ map: createWoodTexture(), roughness: 0.9 });

  // ---- Spheres on pillars (4) ----
  var sphereGeo = new THREE.SphereGeometry(0.4, 16, 16);
  var orbMat = new THREE.MeshStandardMaterial({
    color: 0x4488ff, emissive: 0x112244, emissiveIntensity: 0.5,
    metalness: 0.6, roughness: 0.3
  });
  [[14,14],[14,17],[17,14],[17,17]].forEach(function(p) {
    var orb = new THREE.Mesh(sphereGeo, orbMat);
    orb.position.set(p[0]+0.5, 4.5, p[1]+0.5);
    orb.castShadow = true;
    scene.add(orb);
    g_orbMeshes.push(orb);
  });

  // ---- Cylinders: torch poles (8) ----
  var cylGeo = new THREE.CylinderGeometry(0.08, 0.08, 2, 8);
  g_torchLights.forEach(function(t) {
    var pole = new THREE.Mesh(cylGeo, woodMat);
    pole.position.set(t.pos[0], 1, t.pos[2]);
    pole.castShadow = true;
    scene.add(pole);
  });

  // ---- Cones: torch flames (8, animated) ----
  var flameGeo = new THREE.ConeGeometry(0.15, 0.4, 8);
  g_torchLights.forEach(function(t) {
    var mat = new THREE.MeshStandardMaterial({
      color: 0xff4400, emissive: 0xff6600, emissiveIntensity: 1.5,
      transparent: true, opacity: 0.9
    });
    var flame = new THREE.Mesh(flameGeo, mat);
    flame.position.set(t.pos[0], 2.2, t.pos[2]);
    scene.add(flame);
    g_flames.push(flame);
  });

  // ---- Torus: archway decorations (4) ----
  var torusGeo = new THREE.TorusGeometry(0.5, 0.1, 8, 16);
  var torusMat = new THREE.MeshStandardMaterial({ color: 0xcc8833, metalness: 0.7, roughness: 0.3 });
  [[15.5,3.5,12],[15.5,3.5,20],[12,3.5,15.5],[20,3.5,15.5]].forEach(function(p) {
    var t = new THREE.Mesh(torusGeo, torusMat);
    t.position.set(p[0], p[1], p[2]);
    t.castShadow = true;
    scene.add(t);
  });

  // ---- Crates: textured boxes (8) ----
  var crateGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  var crateMat = new THREE.MeshStandardMaterial({ map: createDirtTexture(), roughness: 0.9 });
  [[4,0.4,8],[7,0.4,4],[24,0.4,4],[27,0.4,10],
   [4,0.4,24],[8,0.4,27],[24,0.4,27],[27,0.4,20]].forEach(function(p) {
    var crate = new THREE.Mesh(crateGeo, crateMat);
    crate.position.set(p[0], p[1], p[2]);
    crate.castShadow = true; crate.receiveShadow = true;
    scene.add(crate);
  });

  // ---- Dodecahedrons: crystals (4, animated) ----
  var crystalGeo = new THREE.DodecahedronGeometry(0.25);
  var crystalMat = new THREE.MeshStandardMaterial({
    color: 0x88ffcc, emissive: 0x22aa66, emissiveIntensity: 0.6,
    metalness: 0.4, roughness: 0.2, transparent: true, opacity: 0.8
  });
  [[8,1.5,8],[24,1.5,8],[8,1.5,24],[24,1.5,24]].forEach(function(p) {
    var c = new THREE.Mesh(crystalGeo, crystalMat.clone());
    c.position.set(p[0], p[1], p[2]);
    c.castShadow = true;
    scene.add(c);
    g_crystals.push(c);
  });
  // Total distinct shapes: 4+8+8+4+8+4 = 36 (plus hundreds of wall cubes)
}

// ============ Coins (same positions as A4 World.placeCoins) ============
function buildCoins() {
  var goldTex = createGoldTexture();
  var goldMat = new THREE.MeshStandardMaterial({
    map: goldTex, metalness: 0.8, roughness: 0.2,
    emissive: 0x332200, emissiveIntensity: 0.3
  });
  var coinGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 16);

  world.coins.forEach(function(c) {
    var mesh = new THREE.Mesh(coinGeo, goldMat.clone());
    mesh.position.set(c.x + 0.5, c.y, c.z + 0.5);
    mesh.rotation.x = Math.PI / 2;
    mesh.castShadow = true;
    // Glow light on each coin
    mesh.add(new THREE.PointLight(0xffd700, 1, 4, 2));
    scene.add(mesh);
    g_coins3D.push({ mesh: mesh, data: c, baseY: c.y });
  });
}

// ============ Duck (same animal from A4, built from box cubes) ============
function buildDuck() {
  g_duckGroup = new THREE.Group();
  var bodyMat = new THREE.MeshStandardMaterial({ color: 0xfffff0, roughness: 0.7 });
  var beakMat = new THREE.MeshStandardMaterial({ color: 0xff9900, roughness: 0.5 });
  var eyeMat  = new THREE.MeshStandardMaterial({ color: 0x000000 });

  function part(geo, mat, x, y, z) {
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    g_duckGroup.add(m);
    return m;
  }
  part(new THREE.BoxGeometry(0.6,0.4,0.8),  bodyMat, 0,   0.3,  0);      // body
  part(new THREE.BoxGeometry(0.35,0.35,0.35),bodyMat, 0,   0.6, -0.35);   // head
  part(new THREE.BoxGeometry(0.15,0.08,0.15),beakMat, 0,   0.55,-0.55);   // beak
  part(new THREE.BoxGeometry(0.05,0.05,0.05),eyeMat, -0.12,0.68,-0.45);   // eye L
  part(new THREE.BoxGeometry(0.05,0.05,0.05),eyeMat,  0.12,0.68,-0.45);   // eye R

  g_duckGroup.position.set(16, 0, 16);
  scene.add(g_duckGroup);
}

// ============ GLTF Model (textured 3D model requirement) ============
function loadGLTFModel() {
  var loader = new GLTFLoader();
  loader.load(
    'models/Captus_III.glb',
    function(gltf) {
      var model = gltf.scene;
      // Auto-scale: measure bounding box, fit to ~2 units tall
      var box = new THREE.Box3().setFromObject(model);
      var size = box.getSize(new THREE.Vector3());
      var maxDim = Math.max(size.x, size.y, size.z);
      var scale = 2.0 / maxDim;
      model.scale.set(scale, scale, scale);
      // Place in the central chamber on a small pedestal area
      model.position.set(16, 0, 16);
      // Center it on the ground
      var box2 = new THREE.Box3().setFromObject(model);
      model.position.y = -box2.min.y;
      model.traverse(function(child) {
        if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
      });
      scene.add(model);
      console.log('Captus_III.glb loaded, scale=' + scale.toFixed(3));
    },
    undefined,
    function() {
      console.log('GLB not found, building procedural textured statue');
      buildStatue();
    }
  );
}

function buildStatue() {
  var mat = new THREE.MeshStandardMaterial({ map: createStoneTexture(), roughness: 0.7 });
  var g = new THREE.Group();

  var base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.2), mat);
  base.position.y = 0.2; base.castShadow = true; g.add(base);

  var body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.5, 8), mat);
  body.position.y = 1.25; body.castShadow = true; g.add(body);

  var head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), mat);
  head.position.y = 2.25; head.castShadow = true; g.add(head);

  [-0.6, 0.6].forEach(function(xOff) {
    var arm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1, 6), mat);
    arm.position.set(xOff, 1.3, 0);
    arm.rotation.z = xOff > 0 ? -0.3 : 0.3;
    arm.castShadow = true; g.add(arm);
  });

  g.position.set(10, 0, 10);
  scene.add(g);
}

// ============ Particles (coin pickup burst, wow feature) ============
function spawnParticles(pos) {
  for (var i = 0; i < 15; i++) {
    var p = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 4, 4),
      new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true })
    );
    p.position.copy(pos);
    p.userData.vel = new THREE.Vector3(
      (Math.random()-0.5)*0.15, Math.random()*0.15+0.05, (Math.random()-0.5)*0.15
    );
    p.userData.life = 1.0;
    scene.add(p);
    g_particles.push(p);
  }
}

// ============ Input (same pattern as A4) ============
function setupInputHandlers() {
  document.addEventListener('keydown', function(e) { g_keys[e.code] = true; });
  document.addEventListener('keyup',   function(e) { g_keys[e.code] = false; });
  window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function handleKeys() {
  if (!controls.isLocked) return;
  var mx = 0, mz = 0;
  if (g_keys['KeyW'] || g_keys['ArrowUp'])    mz -= 1;
  if (g_keys['KeyS'] || g_keys['ArrowDown'])  mz += 1;
  if (g_keys['KeyA'] || g_keys['ArrowLeft'])  mx -= 1;
  if (g_keys['KeyD'] || g_keys['ArrowRight']) mx += 1;
  if (mx === 0 && mz === 0) return;

  var len = Math.sqrt(mx*mx + mz*mz);
  mx /= len; mz /= len;

  var oldX = camera.position.x, oldZ = camera.position.z;
  controls.moveRight(mx * g_speed);
  controls.moveForward(-mz * g_speed);
  camera.position.y = 1.5;

  // Wall collision (same as A4)
  var cx = Math.floor(camera.position.x);
  var cz = Math.floor(camera.position.z);
  if (cx >= 0 && cx < world.MAP_SIZE && cz >= 0 && cz < world.MAP_SIZE) {
    if (world.map[cx][cz] > 0) {
      camera.position.x = oldX;
      camera.position.z = oldZ;
    }
  }
  camera.position.x = Math.max(0.5, Math.min(world.MAP_SIZE-0.5, camera.position.x));
  camera.position.z = Math.max(0.5, Math.min(world.MAP_SIZE-0.5, camera.position.z));
}

// ============ HUD (same as A4) ============
function updateHUD(now) {
  g_frameCount++;
  if (now - g_lastFPSTime >= 1.0) {
    g_fps = g_frameCount; g_frameCount = 0; g_lastFPSTime = now;
  }
  document.getElementById('fps').textContent = 'FPS: ' + g_fps;
  document.getElementById('pos').textContent = 'Pos: ' +
    camera.position.x.toFixed(1) + ', ' + camera.position.z.toFixed(1);
  document.getElementById('coins').textContent = 'Coins: ' +
    world.coinsCollected + ' / ' + world.totalCoins;

  // Story message (same as A4's getStoryMessage)
  var msg = world.getStoryMessage();
  var storyEl = document.getElementById('story');
  if (msg) {
    storyEl.textContent = msg;
    storyEl.className = 'show';
  } else {
    storyEl.className = '';
  }
}

// ============ Animation Loop (tick, same name as A4) ============
function tick() {
  requestAnimationFrame(tick);
  var now = performance.now() / 1000;
  var t = now - g_startTime;

  handleKeys();
  updateHUD(now);

  // Check coin collection (same as A4)
  world.checkCoinCollection(camera.position.x, camera.position.z);

  // ---- Coin animation (spin + float, same as A4's drawCoins) ----
  for (var i = 0; i < g_coins3D.length; i++) {
    var coin = g_coins3D[i];
    if (coin.data.collected) {
      if (coin.mesh.visible) {
        coin.mesh.visible = false;
        spawnParticles(coin.mesh.position.clone());
      }
    } else {
      coin.mesh.rotation.y = t * 2;
      coin.mesh.position.y = coin.baseY + Math.sin(t * 3 + coin.data.x) * 0.15;
    }
  }

  // ---- Particles ----
  for (var i = g_particles.length - 1; i >= 0; i--) {
    var p = g_particles[i];
    p.position.add(p.userData.vel);
    p.userData.vel.y -= 0.005;
    p.userData.life -= 0.03;
    p.material.opacity = Math.max(0, p.userData.life);
    if (p.userData.life <= 0) {
      scene.remove(p);
      p.geometry.dispose(); p.material.dispose();
      g_particles.splice(i, 1);
    }
  }

  // ---- Flame flicker (animated cones) ----
  for (var i = 0; i < g_flames.length; i++) {
    var flicker = 0.8 + Math.sin(t*10 + i*2) * 0.2;
    g_flames[i].scale.set(flicker, 0.8 + Math.sin(t*8+i)*0.3, flicker);
    g_flames[i].material.emissiveIntensity = 1.0 + Math.sin(t*12+i*3)*0.5;
  }

  // ---- Torch light flicker ----
  for (var i = 0; i < g_torchLights.length; i++) {
    g_torchLights[i].light.intensity = 2 + Math.sin(t*8 + i*1.5)*0.8;
  }

  // ---- Crystal rotation ----
  for (var i = 0; i < g_crystals.length; i++) {
    g_crystals[i].rotation.x = t*0.5 + i;
    g_crystals[i].rotation.y = t*0.7 + i;
  }

  // ---- Orb pulse ----
  for (var i = 0; i < g_orbMeshes.length; i++) {
    var pulse = 1 + Math.sin(t*2) * 0.1;
    g_orbMeshes[i].scale.set(pulse, pulse, pulse);
  }

  // ---- Duck animation (same as A4's updateAnimal + drawAnimal) ----
  world.updateAnimal(t);
  g_duckGroup.position.set(world.animalX, world.animalBob, world.animalZ);
  g_duckGroup.rotation.y = world.animalAngle * Math.PI / 180;

  renderer.render(scene, camera);
}

// ============ Start ============
main();
