var canvas;
var ctx;

function main() {  
  canvas = document.getElementById('example');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  ctx = canvas.getContext('2d');

  handleDrawEvent();
}

function handleDrawEvent() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  var v1x = parseFloat(document.getElementById('v1x').value);
  var v1y = parseFloat(document.getElementById('v1y').value);
  var v2x = parseFloat(document.getElementById('v2x').value);
  var v2y = parseFloat(document.getElementById('v2y').value);
  
  var v1 = new Vector3([v1x, v1y, 0]);
  var v2 = new Vector3([v2x, v2y, 0]);
  
  drawVector(v1, "red");
  drawVector(v2, "blue");
}

function handleDrawOperationEvent() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  var v1x = parseFloat(document.getElementById('v1x').value);
  var v1y = parseFloat(document.getElementById('v1y').value);
  var v2x = parseFloat(document.getElementById('v2x').value);
  var v2y = parseFloat(document.getElementById('v2y').value);
  var scalar = parseFloat(document.getElementById('scalar').value);
  var operation = document.getElementById('operation').value;
  
  var v1 = new Vector3([v1x, v1y, 0]);
  var v2 = new Vector3([v2x, v2y, 0]);
  
  drawVector(v1, "red");
  drawVector(v2, "blue");
  
  if (operation === "add") {
    var v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    v3.add(v2);
    drawVector(v3, "green");
  } else if (operation === "subtract") {
    var v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    v3.sub(v2);
    drawVector(v3, "green");
  } else if (operation === "multiply") {
    var v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    v3.mul(scalar);
    drawVector(v3, "green");
    
    var v4 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);
    v4.mul(scalar);
    drawVector(v4, "green");
  } else if (operation === "divide") {
    var v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    v3.div(scalar);
    drawVector(v3, "green");
    
    var v4 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);
    v4.div(scalar);
    drawVector(v4, "green");
  } else if (operation === "magnitude") {
    var mag1 = v1.magnitude();
    var mag2 = v2.magnitude();
    console.log("Magnitude v1:", mag1);
    console.log("Magnitude v2:", mag2);
  } else if (operation === "normalize") {
    var v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    v3.normalize();
    drawVector(v3, "green");
    
    var v4 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);
    v4.normalize();
    drawVector(v4, "green");
  } else if (operation === "anglebetween") {
    var angle = angleBetween(v1, v2);
    console.log("Angle:", angle);
  } else if (operation === "area") {
    var area = areaTriangle(v1, v2);
    console.log("Area:", area);
  }
}

function drawVector(v, color) {
  var x = v.elements[0];
  var y = v.elements[1];
  
  var centerX = canvas.width / 2;
  var centerY = canvas.height / 2;
  
  var endX = centerX + x * 20;
  var endY = centerY - y * 20;
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}

function angleBetween(v1, v2) {
  var dotProduct = Vector3.dot(v1, v2);
  var mag1 = v1.magnitude();
  var mag2 = v2.magnitude();
  var cosAlpha = dotProduct / (mag1 * mag2);
  var alpha = Math.acos(cosAlpha);
  var degrees = alpha * (180 / Math.PI);
  return degrees;
}

function areaTriangle(v1, v2) {
  var crossProduct = Vector3.cross(v1, v2);
  var area = crossProduct.magnitude() / 2;
  return area;
}