// Camera.js - First-person camera with keyboard and mouse controls
class Camera {
  constructor(canvas) {
    this.fov = 60;
    this.eye = new Vector3([2, 1.5, 2]);
    this.at = new Vector3([2, 1.5, 1]);
    this.up = new Vector3([0, 1, 0]);

    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();

    this.projectionMatrix.setPerspective(this.fov, canvas.width / canvas.height, 0.1, 1000);
    this.updateViewMatrix();

    this.speed = 0.15;
    this.rotSpeed = 3;
    this.mouseSensitivity = 0.15;
    this.yaw = -90;
    this.pitch = 0;
  }

  updateViewMatrix() {
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0], this.at.elements[1], this.at.elements[2],
      this.up.elements[0], this.up.elements[1], this.up.elements[2]
    );
  }

  updateAtFromAngles() {
    let radYaw = this.yaw * Math.PI / 180;
    let radPitch = this.pitch * Math.PI / 180;
    let fx = Math.cos(radPitch) * Math.cos(radYaw);
    let fy = Math.sin(radPitch);
    let fz = Math.cos(radPitch) * Math.sin(radYaw);
    this.at.elements[0] = this.eye.elements[0] + fx;
    this.at.elements[1] = this.eye.elements[1] + fy;
    this.at.elements[2] = this.eye.elements[2] + fz;
    this.updateViewMatrix();
  }

  moveForward() {
    let f = new Vector3();
    f.set(this.at); f.sub(this.eye);
    f.elements[1] = 0;
    f.normalize(); f.mul(this.speed);
    this.eye.add(f); this.at.add(f);
    this.updateViewMatrix();
  }

  moveBackwards() {
    let b = new Vector3();
    b.set(this.eye); b.sub(this.at);
    b.elements[1] = 0;
    b.normalize(); b.mul(this.speed);
    this.eye.add(b); this.at.add(b);
    this.updateViewMatrix();
  }

  moveLeft() {
    let f = new Vector3();
    f.set(this.at); f.sub(this.eye);
    let s = Vector3.cross(this.up, f);
    s.elements[1] = 0;
    s.normalize(); s.mul(this.speed);
    this.eye.add(s); this.at.add(s);
    this.updateViewMatrix();
  }

  moveRight() {
    let f = new Vector3();
    f.set(this.at); f.sub(this.eye);
    let s = Vector3.cross(f, this.up);
    s.elements[1] = 0;
    s.normalize(); s.mul(this.speed);
    this.eye.add(s); this.at.add(s);
    this.updateViewMatrix();
  }

  panLeft(degrees) {
    this.yaw -= (degrees || this.rotSpeed);
    this.updateAtFromAngles();
  }

  panRight(degrees) {
    this.yaw += (degrees || this.rotSpeed);
    this.updateAtFromAngles();
  }

  handleMouseMove(dx, dy) {
    this.yaw += dx * this.mouseSensitivity;
    this.pitch -= dy * this.mouseSensitivity;
    if (this.pitch > 89) this.pitch = 89;
    if (this.pitch < -89) this.pitch = -89;
    this.updateAtFromAngles();
  }

  getBlockInFront() {
    let f = new Vector3();
    f.set(this.at); f.sub(this.eye);
    f.elements[1] = 0;
    f.normalize(); f.mul(2.0);
    let targetX = Math.floor(this.eye.elements[0] + f.elements[0]);
    let targetZ = Math.floor(this.eye.elements[2] + f.elements[2]);
    return [targetX, targetZ];
  }
}
