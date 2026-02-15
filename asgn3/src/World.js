// World.js - World generation, map data, coins, and game logic

class World {
  constructor() {
    this.MAP_SIZE = 32;
    this.map = [];
    this.coins = [];
    this.coinsCollected = 0;
    this.totalCoins = 5;
    this.storyMessages = [
      "Welcome, explorer! Find all 5 golden coins hidden in this world!",
      "Coin found! Keep exploring...",
      "Another one! You're getting warmer...",
      "Great find! Just 2 more to go!",
      "Almost there! One more coin remains!",
      "You found all the coins! You are the champion explorer!"
    ];
    this.storyIndex = 0;
    this.showStoryTime = 0;
    this.generateMap();
    this.placeCoins();

    this.animalX = 16;
    this.animalZ = 16;
    this.animalAngle = 0;
    this.animalBob = 0;
  }

  generateMap() {
    for (let i = 0; i < this.MAP_SIZE; i++) {
      this.map[i] = [];
      for (let j = 0; j < this.MAP_SIZE; j++) {
        this.map[i][j] = 0;
      }
    }

    // Border walls (height 4)
    for (let i = 0; i < this.MAP_SIZE; i++) {
      this.map[0][i] = 4;
      this.map[this.MAP_SIZE - 1][i] = 4;
      this.map[i][0] = 4;
      this.map[i][this.MAP_SIZE - 1] = 4;
    }

    // Inner ring walls
    for (let i = 2; i < 30; i++) {
      this.map[2][i] = 3;  this.map[i][2] = 3;
      this.map[29][i] = 3; this.map[i][29] = 3;
    }
    // Openings in inner ring
    this.map[2][5]=0; this.map[2][6]=0;
    this.map[2][15]=0; this.map[2][16]=0;
    this.map[2][25]=0; this.map[2][26]=0;
    this.map[29][10]=0; this.map[29][11]=0;
    this.map[29][20]=0; this.map[29][21]=0;
    this.map[10][2]=0; this.map[11][2]=0;
    this.map[20][2]=0; this.map[21][2]=0;
    this.map[10][29]=0; this.map[11][29]=0;
    this.map[20][29]=0; this.map[21][29]=0;

    // Horizontal corridor walls
    for (let i = 4; i < 15; i++) { this.map[6][i] = 3; }
    this.map[6][8]=0; this.map[6][9]=0;

    for (let i = 4; i < 15; i++) { this.map[10][i] = 2; }
    this.map[10][6]=0; this.map[10][7]=0;
    this.map[10][12]=0; this.map[10][13]=0;

    for (let i = 18; i < 28; i++) { this.map[6][i] = 3; }
    this.map[6][22]=0; this.map[6][23]=0;

    for (let i = 18; i < 28; i++) { this.map[10][i] = 2; }
    this.map[10][20]=0; this.map[10][21]=0; this.map[10][25]=0;

    // Vertical dividers
    for (let i = 3; i < 10; i++) { this.map[i][15] = 3; }
    this.map[5][15]=0; this.map[8][15]=0;

    for (let i = 3; i < 10; i++) { this.map[i][17] = 3; }
    this.map[5][17]=0; this.map[8][17]=0;

    // Central chamber
    for (let i = 12; i < 20; i++) { this.map[12][i] = 3; }
    for (let i = 12; i < 20; i++) { this.map[20][i] = 3; }
    for (let i = 12; i < 21; i++) { this.map[i][12] = 3; }
    for (let i = 12; i < 21; i++) { this.map[i][20] = 3; }
    this.map[12][15]=0; this.map[12][16]=0;
    this.map[20][15]=0; this.map[20][16]=0;
    this.map[15][12]=0; this.map[16][12]=0;
    this.map[15][20]=0; this.map[16][20]=0;
    // Pillars
    this.map[14][14]=4; this.map[14][17]=4;
    this.map[17][14]=4; this.map[17][17]=4;

    // South corridors
    for (let i = 4; i < 12; i++) { this.map[22][i] = 2; }
    this.map[22][7]=0; this.map[22][8]=0;

    for (let i = 4; i < 12; i++) { this.map[26][i] = 3; }
    this.map[26][5]=0; this.map[26][6]=0; this.map[26][10]=0;

    for (let i = 21; i < 28; i++) { this.map[22][i] = 2; }
    this.map[22][24]=0; this.map[22][25]=0;

    for (let i = 21; i < 28; i++) { this.map[26][i] = 3; }
    this.map[26][23]=0; this.map[26][24]=0;

    // South vertical walls
    for (let i = 22; i < 29; i++) { this.map[i][15] = 2; }
    this.map[24][15]=0; this.map[25][15]=0;

    for (let i = 22; i < 29; i++) { this.map[i][17] = 2; }
    this.map[24][17]=0; this.map[25][17]=0;

    // Corner towers
    this.map[4][4]=2; this.map[4][5]=2; this.map[5][4]=2;
    this.map[4][26]=4; this.map[4][27]=4; this.map[5][26]=4; this.map[5][27]=4;
    this.map[27][4]=4; this.map[27][5]=4; this.map[28][4]=4; this.map[28][5]=4;
    this.map[27][26]=4; this.map[27][27]=4; this.map[28][26]=4; this.map[28][27]=4;

    // Small features
    this.map[8][22]=1; this.map[8][24]=1;
    this.map[24][8]=1; this.map[24][22]=1;

    // SW maze
    for (let i = 23; i < 28; i++) { this.map[i][8] = 2; }
    this.map[25][8]=0;
    for (let i = 23; i < 28; i++) { this.map[i][10] = 1; }
    this.map[24][10]=0; this.map[26][10]=0;

    // SE maze
    for (let i = 23; i < 28; i++) { this.map[i][22] = 2; }
    this.map[25][22]=0;
  }

  placeCoins() {
    this.coins = [
      { x: 4,  y: 0.75, z: 4,  collected: false },
      { x: 5,  y: 0.75, z: 22, collected: false },
      { x: 16, y: 0.75, z: 16, collected: false },
      { x: 27, y: 0.75, z: 5,  collected: false },
      { x: 27, y: 0.75, z: 27, collected: false },
    ];
  }

  checkCoinCollection(camX, camZ) {
    for (let c of this.coins) {
      if (c.collected) continue;
      let dx = camX - c.x, dz = camZ - c.z;
      if (dx*dx + dz*dz < 2.0) {
        c.collected = true;
        this.coinsCollected++;
        this.storyIndex = this.coinsCollected;
        this.showStoryTime = 180;
      }
    }
  }

  addBlock(x, z) {
    if (x<0||x>=this.MAP_SIZE||z<0||z>=this.MAP_SIZE) return false;
    if (this.map[x][z] < 4) { this.map[x][z]++; return true; }
    return false;
  }

  removeBlock(x, z) {
    if (x<0||x>=this.MAP_SIZE||z<0||z>=this.MAP_SIZE) return false;
    if (this.map[x][z] > 0) { this.map[x][z]--; return true; }
    return false;
  }

  getStoryMessage() {
    if (this.showStoryTime > 0) {
      this.showStoryTime--;
      return this.storyMessages[this.storyIndex];
    }
    return null;
  }

  buildAllWallCubes() {
    let cubes = [];
    for (let x = 0; x < this.MAP_SIZE; x++) {
      for (let z = 0; z < this.MAP_SIZE; z++) {
        let h = this.map[x][z];
        for (let y = 0; y < h; y++) {
          cubes.push({ x: x, y: y, z: z });
        }
      }
    }
    return cubes;
  }

  updateAnimal(time) {
    this.animalAngle = time * 30;
    this.animalBob = Math.sin(time * 2) * 0.1;
    let radius = 3;
    this.animalX = 16 + Math.cos(time * 0.5) * radius;
    this.animalZ = 16 + Math.sin(time * 0.5) * radius;
  }
}
