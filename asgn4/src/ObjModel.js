// ObjModel.js - Basic OBJ loader (v, vn, f with v//vn or v/vt/vn)

class ObjModel {
  constructor(gl, program) {
    this.gl = gl;
    this.program = program;
    this.ready = false;
    this.vertCount = 0;
    this.buf = null;

    this.a_Position = gl.getAttribLocation(program, 'a_Position');
    this.a_Normal   = gl.getAttribLocation(program, 'a_Normal');
    this.a_UV       = gl.getAttribLocation(program, 'a_UV');
  }

  load(url) {
    fetch(url)
      .then(r => { if (!r.ok) throw new Error('not found'); return r.text(); })
      .then(text => this._parse(text))
      .catch(() => { /* model file missing, skip silently */ });
  }

  _parse(text) {
    var posArr = [], normArr = [], uvArr = [];
    var verts = [];

    var lines = text.split('\n');
    for (var line of lines) {
      line = line.trim();
      var parts = line.split(/\s+/);
      if (parts[0] === 'v') {
        posArr.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
      } else if (parts[0] === 'vn') {
        normArr.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
      } else if (parts[0] === 'vt') {
        uvArr.push([parseFloat(parts[1]), parseFloat(parts[2])]);
      } else if (parts[0] === 'f') {
        // Triangulate face (fan from first vert)
        var faceVerts = [];
        for (var k = 1; k < parts.length; k++) {
          var idx = parts[k].split('/');
          var pi = parseInt(idx[0]) - 1;
          var ti = idx[1] && idx[1] !== '' ? parseInt(idx[1]) - 1 : -1;
          var ni = idx[2] ? parseInt(idx[2]) - 1 : -1;
          faceVerts.push({ pi, ti, ni });
        }
        for (var k = 1; k < faceVerts.length - 1; k++) {
          [faceVerts[0], faceVerts[k], faceVerts[k+1]].forEach(fv => {
            var p = posArr[fv.pi] || [0,0,0];
            var n = fv.ni >= 0 ? normArr[fv.ni] : [0,1,0];
            var uv = fv.ti >= 0 ? uvArr[fv.ti] : [0,0];
            verts.push(p[0], p[1], p[2],  n[0], n[1], n[2],  uv[0], uv[1]);
          });
        }
      }
    }

    if (verts.length === 0) return;

    var gl = this.gl;
    this.buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    this.vertCount = verts.length / 8;
    this.ready = true;
  }

  draw() {
    if (!this.ready) return;
    var gl = this.gl, F = 4, stride = 8*F;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.vertexAttribPointer(this.a_Position, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(this.a_Position);
    if (this.a_Normal >= 0) {
      gl.vertexAttribPointer(this.a_Normal, 3, gl.FLOAT, false, stride, 3*F);
      gl.enableVertexAttribArray(this.a_Normal);
    }
    gl.vertexAttribPointer(this.a_UV, 2, gl.FLOAT, false, stride, 6*F);
    gl.enableVertexAttribArray(this.a_UV);
    gl.drawArrays(gl.TRIANGLES, 0, this.vertCount);
  }
}
