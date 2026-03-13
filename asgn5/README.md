## Citations & Resources

**AI Tools:**
- Claude (Anthropic) - Used for assistance with Three.js scene setup, camera controls, lighting configuration, and adapting A4 world to Three.js

**Course Materials:**
- Matsuda & Lea: "WebGL Programming Guide" - Previous assignments reference
- Three.js Manual - https://threejs.org/manual/ (Fundamentals, Textures, Cameras, Lights, Backgrounds)
- Three.js Docs - https://threejs.org/docs/ (GLTFLoader, PointerLockControls)

**Libraries:**
- Three.js r164 (via CDN) - High-level 3D graphics library
- cuon-utils.js, webgl-utils.js - Standard WebGL utility libraries from textbook (kept for compatibility)
- cuon-matrix-cse160.js - Vector/Matrix library from course materials (kept for compatibility)

**Features:**
- 6 different shape types: BoxGeometry (walls/crates), SphereGeometry (orbs), CylinderGeometry (torch poles/statue), ConeGeometry (flames), TorusGeometry (archways), DodecahedronGeometry (crystals)
- 5 light types: AmbientLight, DirectionalLight, HemisphereLight, PointLight, SpotLight
- Procedural CubeTexture skybox (6 canvas faces)
- Procedural textures (dirt, grass, stone, gold, wood) - same pixel-by-pixel approach as A3/A4
- PointerLockControls for first-person navigation
- GLTFLoader for .glb model loading (with procedural statue fallback)
- 36+ distinct primary shapes plus hundreds of instanced wall cubes

**Wow Feature:**
- Coin collection mini-game (same as A3/A4) with particle burst effects on pickup
- Animated torch flames with flickering point lights
- Rotating crystals and pulsing orbs
- Fog and shadow mapping
