// Cube.js - Batched cube renderer for performance

class CubeRenderer {
  constructor(gl, program) {
    this.gl = gl;
    this.program = program;

    // Unit cube: 36 verts, each = x,y,z,u,v (5 floats)
    this.CUBE_VERTS = new Float32Array([
      // Front (z=1)
      0,0,1, 0,0,  1,0,1, 1,0,  1,1,1, 1,1,
      0,0,1, 0,0,  1,1,1, 1,1,  0,1,1, 0,1,
      // Back (z=0)
      1,0,0, 0,0,  0,0,0, 1,0,  0,1,0, 1,1,
      1,0,0, 0,0,  0,1,0, 1,1,  1,1,0, 0,1,
      // Top (y=1)
      0,1,1, 0,0,  1,1,1, 1,0,  1,1,0, 1,1,
      0,1,1, 0,0,  1,1,0, 1,1,  0,1,0, 0,1,
      // Bottom (y=0)
      0,0,0, 0,0,  1,0,0, 1,0,  1,0,1, 1,1,
      0,0,0, 0,0,  1,0,1, 1,1,  0,0,1, 0,1,
      // Right (x=1)
      1,0,1, 0,0,  1,0,0, 1,0,  1,1,0, 1,1,
      1,0,1, 0,0,  1,1,0, 1,1,  1,1,1, 0,1,
      // Left (x=0)
      0,0,0, 0,0,  0,0,1, 1,0,  0,1,1, 1,1,
      0,0,0, 0,0,  0,1,1, 1,1,  0,1,0, 0,1,
    ]);

    this.FLOATS_PER_VERTEX = 5;
    this.VERTS_PER_CUBE = 36;

    this.vertexBuffer = gl.createBuffer();

    this.a_Position = gl.getAttribLocation(program, 'a_Position');
    this.a_UV = gl.getAttribLocation(program, 'a_UV');
    this.u_ModelMatrix = gl.getUniformLocation(program, 'u_ModelMatrix');
    this.u_texColorWeight = gl.getUniformLocation(program, 'u_texColorWeight');
    this.u_baseColor = gl.getUniformLocation(program, 'u_baseColor');
    this.u_whichTexture = gl.getUniformLocation(program, 'u_whichTexture');

    this.modelMatrix = new Matrix4();
  }

  buildBatch(cubeList) {
    let totalVerts = cubeList.length * this.VERTS_PER_CUBE;
    let data = new Float32Array(totalVerts * this.FLOATS_PER_VERTEX);

    for (let i = 0; i < cubeList.length; i++) {
      let c = cubeList[i];
      let offset = i * this.VERTS_PER_CUBE * this.FLOATS_PER_VERTEX;
      for (let v = 0; v < this.VERTS_PER_CUBE; v++) {
        let srcIdx = v * this.FLOATS_PER_VERTEX;
        let dstIdx = offset + v * this.FLOATS_PER_VERTEX;
        data[dstIdx]     = this.CUBE_VERTS[srcIdx]     + c.x;
        data[dstIdx + 1] = this.CUBE_VERTS[srcIdx + 1] + c.y;
        data[dstIdx + 2] = this.CUBE_VERTS[srcIdx + 2] + c.z;
        data[dstIdx + 3] = this.CUBE_VERTS[srcIdx + 3];
        data[dstIdx + 4] = this.CUBE_VERTS[srcIdx + 4];
      }
    }
    return { data: data, count: totalVerts };
  }

  setupAttribs(data) {
    let gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    let FSIZE = data.BYTES_PER_ELEMENT;
    let stride = this.FLOATS_PER_VERTEX * FSIZE;
    gl.vertexAttribPointer(this.a_Position, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(this.a_Position);
    gl.vertexAttribPointer(this.a_UV, 2, gl.FLOAT, false, stride, 3 * FSIZE);
    gl.enableVertexAttribArray(this.a_UV);
  }

  drawBatch(batchData, texID, color) {
    if (!batchData || batchData.count === 0) return;
    let gl = this.gl;
    this.modelMatrix.setIdentity();
    gl.uniformMatrix4fv(this.u_ModelMatrix, false, this.modelMatrix.elements);
    gl.uniform1i(this.u_whichTexture, texID);
    if (texID < 0) {
      gl.uniform1f(this.u_texColorWeight, 0.0);
      gl.uniform4fv(this.u_baseColor, color || [1,1,1,1]);
    } else {
      gl.uniform1f(this.u_texColorWeight, 1.0);
    }
    this.setupAttribs(batchData.data);
    gl.drawArrays(gl.TRIANGLES, 0, batchData.count);
  }

  drawScaledCube(sx, sy, sz, tx, ty, tz, texID, color) {
    let gl = this.gl;
    this.modelMatrix.setIdentity();
    this.modelMatrix.translate(tx, ty, tz);
    this.modelMatrix.scale(sx, sy, sz);
    gl.uniformMatrix4fv(this.u_ModelMatrix, false, this.modelMatrix.elements);
    gl.uniform1i(this.u_whichTexture, texID);
    if (texID < 0) {
      gl.uniform1f(this.u_texColorWeight, 0.0);
      gl.uniform4fv(this.u_baseColor, color || [1,1,1,1]);
    } else {
      gl.uniform1f(this.u_texColorWeight, 1.0);
    }
    this.setupAttribs(this.CUBE_VERTS);
    gl.drawArrays(gl.TRIANGLES, 0, this.VERTS_PER_CUBE);
  }
}
