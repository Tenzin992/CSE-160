// Cube.js - Cube renderer with normal support for lighting

class CubeRenderer {
  constructor(gl, program) {
    this.gl = gl;
    this.program = program;

    // 36 verts: x,y,z, nx,ny,nz, u,v  (8 floats)
    // Normals are face normals, one per triangle
    this.CUBE_VERTS = new Float32Array([
      // Front (z=1, n=0,0,1)
      0,0,1, 0,0,1, 0,0,  1,0,1, 0,0,1, 1,0,  1,1,1, 0,0,1, 1,1,
      0,0,1, 0,0,1, 0,0,  1,1,1, 0,0,1, 1,1,  0,1,1, 0,0,1, 0,1,
      // Back (z=0, n=0,0,-1)
      1,0,0, 0,0,-1, 0,0,  0,0,0, 0,0,-1, 1,0,  0,1,0, 0,0,-1, 1,1,
      1,0,0, 0,0,-1, 0,0,  0,1,0, 0,0,-1, 1,1,  1,1,0, 0,0,-1, 0,1,
      // Top (y=1, n=0,1,0)
      0,1,1, 0,1,0, 0,0,  1,1,1, 0,1,0, 1,0,  1,1,0, 0,1,0, 1,1,
      0,1,1, 0,1,0, 0,0,  1,1,0, 0,1,0, 1,1,  0,1,0, 0,1,0, 0,1,
      // Bottom (y=0, n=0,-1,0)
      0,0,0, 0,-1,0, 0,0,  1,0,0, 0,-1,0, 1,0,  1,0,1, 0,-1,0, 1,1,
      0,0,0, 0,-1,0, 0,0,  1,0,1, 0,-1,0, 1,1,  0,0,1, 0,-1,0, 0,1,
      // Right (x=1, n=1,0,0)
      1,0,1, 1,0,0, 0,0,  1,0,0, 1,0,0, 1,0,  1,1,0, 1,0,0, 1,1,
      1,0,1, 1,0,0, 0,0,  1,1,0, 1,0,0, 1,1,  1,1,1, 1,0,0, 0,1,
      // Left (x=0, n=-1,0,0)
      0,0,0, -1,0,0, 0,0,  0,0,1, -1,0,0, 1,0,  0,1,1, -1,0,0, 1,1,
      0,0,0, -1,0,0, 0,0,  0,1,1, -1,0,0, 1,1,  0,1,0, -1,0,0, 0,1,
    ]);

    this.FLOATS_PER_VERTEX = 8; // xyz + nxnynz + uv
    this.VERTS_PER_CUBE = 36;

    this.vertexBuffer = gl.createBuffer();

    this.a_Position  = gl.getAttribLocation(program, 'a_Position');
    this.a_Normal    = gl.getAttribLocation(program, 'a_Normal');
    this.a_UV        = gl.getAttribLocation(program, 'a_UV');
    this.u_ModelMatrix    = gl.getUniformLocation(program, 'u_ModelMatrix');
    this.u_NormalMatrix   = gl.getUniformLocation(program, 'u_NormalMatrix');
    this.u_texColorWeight = gl.getUniformLocation(program, 'u_texColorWeight');
    this.u_baseColor      = gl.getUniformLocation(program, 'u_baseColor');
    this.u_whichTexture   = gl.getUniformLocation(program, 'u_whichTexture');

    this.modelMatrix = new Matrix4();
  }

  _bind(data) {
    var gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    var F = data.BYTES_PER_ELEMENT;
    var stride = this.FLOATS_PER_VERTEX * F;
    gl.vertexAttribPointer(this.a_Position, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(this.a_Position);
    if (this.a_Normal >= 0) {
      gl.vertexAttribPointer(this.a_Normal, 3, gl.FLOAT, false, stride, 3*F);
      gl.enableVertexAttribArray(this.a_Normal);
    }
    gl.vertexAttribPointer(this.a_UV, 2, gl.FLOAT, false, stride, 6*F);
    gl.enableVertexAttribArray(this.a_UV);
  }

  // Draw raw cube with whatever model matrix is already set externally
  drawRaw() {
    this._bind(this.CUBE_VERTS);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.VERTS_PER_CUBE);
  }

  buildBatch(cubeList) {
    var FPV = this.FLOATS_PER_VERTEX, VPC = this.VERTS_PER_CUBE;
    var data = new Float32Array(cubeList.length * VPC * FPV);
    for (var i = 0; i < cubeList.length; i++) {
      var c = cubeList[i], off = i * VPC * FPV;
      for (var v = 0; v < VPC; v++) {
        var s = v * FPV, d = off + v * FPV;
        data[d]   = this.CUBE_VERTS[s]   + c.x;
        data[d+1] = this.CUBE_VERTS[s+1] + c.y;
        data[d+2] = this.CUBE_VERTS[s+2] + c.z;
        data[d+3] = this.CUBE_VERTS[s+3]; // nx
        data[d+4] = this.CUBE_VERTS[s+4]; // ny
        data[d+5] = this.CUBE_VERTS[s+5]; // nz
        data[d+6] = this.CUBE_VERTS[s+6]; // u
        data[d+7] = this.CUBE_VERTS[s+7]; // v
      }
    }
    return { data: data, count: cubeList.length * VPC };
  }

  drawBatch(batch, texID, color) {
    if (!batch || batch.count === 0) return;
    var gl = this.gl;
    var m = new Matrix4(); m.setIdentity();
    gl.uniformMatrix4fv(this.u_ModelMatrix, false, m.elements);
    gl.uniformMatrix4fv(this.u_NormalMatrix, false, m.elements);
    gl.uniform1i(this.u_whichTexture, texID);
    if (texID < 0) {
      gl.uniform1f(this.u_texColorWeight, 0.0);
      gl.uniform4fv(this.u_baseColor, color || [1,1,1,1]);
    } else {
      gl.uniform1f(this.u_texColorWeight, 1.0);
    }
    this._bind(batch.data);
    gl.drawArrays(gl.TRIANGLES, 0, batch.count);
  }

  drawScaledCube(sx, sy, sz, tx, ty, tz, texID, color) {
    var gl = this.gl;
    this.modelMatrix.setIdentity();
    this.modelMatrix.translate(tx, ty, tz);
    this.modelMatrix.scale(sx, sy, sz);
    gl.uniformMatrix4fv(this.u_ModelMatrix, false, this.modelMatrix.elements);
    // For uniform scaling normals don't need special treatment, identity normal matrix is fine
    var nm = new Matrix4(this.modelMatrix); nm.invert(); nm.transpose();
    gl.uniformMatrix4fv(this.u_NormalMatrix, false, nm.elements);
    gl.uniform1i(this.u_whichTexture, texID);
    if (texID < 0) {
      gl.uniform1f(this.u_texColorWeight, 0.0);
      gl.uniform4fv(this.u_baseColor, color || [1,1,1,1]);
    } else {
      gl.uniform1f(this.u_texColorWeight, 1.0);
    }
    this._bind(this.CUBE_VERTS);
    gl.drawArrays(gl.TRIANGLES, 0, this.VERTS_PER_CUBE);
  }
}
