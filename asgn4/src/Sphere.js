// Sphere.js - UV sphere mesh with normals for Phong lighting

class Sphere {
  constructor(gl, program, stacks, slices) {
    this.gl = gl;
    this.program = program;

    this.a_Position = gl.getAttribLocation(program, 'a_Position');
    this.a_Normal   = gl.getAttribLocation(program, 'a_Normal');
    this.a_UV       = gl.getAttribLocation(program, 'a_UV');

    var verts = [], indices = [];

    for (var i = 0; i <= stacks; i++) {
      var phi = (i / stacks) * Math.PI;
      for (var j = 0; j <= slices; j++) {
        var theta = (j / slices) * 2 * Math.PI;
        var x = Math.sin(phi) * Math.cos(theta);
        var y = Math.cos(phi);
        var z = Math.sin(phi) * Math.sin(theta);
        // position = normal for unit sphere centered at origin
        verts.push(x, y, z,   x, y, z,   j/slices, i/stacks);
      }
    }

    for (var i = 0; i < stacks; i++) {
      for (var j = 0; j < slices; j++) {
        var a = i * (slices+1) + j;
        var b = a + slices + 1;
        indices.push(a, b, a+1,  b, b+1, a+1);
      }
    }

    this.vertBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    this.idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    this.indexCount = indices.length;
    this.FPV = 8; // xyz nxnynz uv
  }

  draw() {
    var gl = this.gl, F = 4, stride = this.FPV * F;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuf);
    gl.vertexAttribPointer(this.a_Position, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(this.a_Position);
    if (this.a_Normal >= 0) {
      gl.vertexAttribPointer(this.a_Normal, 3, gl.FLOAT, false, stride, 3*F);
      gl.enableVertexAttribArray(this.a_Normal);
    }
    gl.vertexAttribPointer(this.a_UV, 2, gl.FLOAT, false, stride, 6*F);
    gl.enableVertexAttribArray(this.a_UV);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.idxBuf);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
  }
}
