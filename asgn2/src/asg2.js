const VSHADER_SOURCE = `
	attribute vec4 a_Position;
	uniform mat4 u_ModelMatrix;
	uniform mat4 u_GlobalRotationMatrix;
	void main() {
		gl_Position = u_GlobalRotationMatrix * u_ModelMatrix * a_Position;
	}
`;
const FSHADER_SOURCE = `
	precision mediump float;
	uniform vec4 u_FragColor;
	void main() {
		gl_FragColor = u_FragColor;
	}
`;

let canvas;
let gl;
let a_Position;
let u_ModelMatrix;
let u_FragColor;
let u_GlobalRotationMatrix;

function getCanvasAndContext() {
	canvas = document.getElementById("webgl");
	gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
	if (!gl) {
		throw new Error("Failed to get the rendering context for WebGL");
	}
	gl.enable(gl.DEPTH_TEST);
}

function compileShadersAndConnectVariables() {
	if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
		throw new Error("Failed to intialize shaders");
	}

	const identity = new Matrix4();

	a_Position = gl.getAttribLocation(gl.program, "a_Position");
	if (a_Position < 0) {
		throw new Error("Failed to get the storage location of a_Position");
	}

	u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
	if (!u_ModelMatrix) {
		throw new Error("Failed to get the storage location of u_ModelMatrix");
	}
	gl.uniformMatrix4fv(u_ModelMatrix, false, identity.elements);

	u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
	if (!u_FragColor) {
		throw new Error("Failed to get the storage location of u_FragColor");
	}

	u_GlobalRotationMatrix = gl.getUniformLocation(gl.program, "u_GlobalRotationMatrix");
	if (!u_GlobalRotationMatrix) {
		throw new Error("Failed to get the storage location of u_GlobalRotationMatrix");
	}
	gl.uniformMatrix4fv(u_GlobalRotationMatrix, false, identity.elements);
}

// Global rotation
let g_globalRotation_y = 0;
let g_globalRotation_x = 0;

// Neck segments (3-level chain)
let g_neckLower = 0;
let g_neckMiddle = 0;
let g_neckUpper = 0;

// Head
let g_headRotation = 0;

// Legs
let g_legFrontLeft = 0;
let g_legFrontRight = 0;

let g_animation_enabled = false;

function createUIEvents() {
	document.getElementById("globalRotationSlider_y").addEventListener("mousemove", function() {
		g_globalRotation_y = this.value;
		renderAllShapes();
	});
	document.getElementById("globalRotationSlider_x").addEventListener("mousemove", function() {
		g_globalRotation_x = this.value;
		renderAllShapes();
	});

	document.getElementById("neckLowerSlider").addEventListener("mousemove", function() {
		g_neckLower = this.value;
		renderAllShapes();
	});
	document.getElementById("neckMiddleSlider").addEventListener("mousemove", function() {
		g_neckMiddle = this.value;
		renderAllShapes();
	});
	document.getElementById("neckUpperSlider").addEventListener("mousemove", function() {
		g_neckUpper = this.value;
		renderAllShapes();
	});
	
	document.getElementById("headRotationSlider").addEventListener("mousemove", function() {
		g_headRotation = this.value;
		renderAllShapes();
	});

	document.getElementById("legFrontLeftSlider").addEventListener("mousemove", function() {
		g_legFrontLeft = this.value;
		renderAllShapes();
	});
	document.getElementById("legFrontRightSlider").addEventListener("mousemove", function() {
		g_legFrontRight = this.value;
		renderAllShapes();
	});
	
	document.getElementById("toggleAnimationButton").onclick = () => {
		g_animation_enabled = !g_animation_enabled;
	};
}

function main() {
	getCanvasAndContext();
	compileShadersAndConnectVariables();
	createUIEvents();
	
	canvas.onmousemove = function(e) { 
		if (e.buttons === 1) { 
			rotateCamera(e);
		} 
	};
	
	gl.clearColor(0.53, 0.81, 0.92, 1.0);
	requestAnimationFrame(tick);
}

function rotateCamera(e) {
	const rect = e.target.getBoundingClientRect();
	const x = ((e.clientX - rect.left) - canvas.width/2)/(canvas.width/2);
	const y = (canvas.height/2 - (e.clientY - rect.top))/(canvas.height/2);
	g_globalRotation_y = 360 * x;
	g_globalRotation_x = 180 * y;
}

const g_startTime = performance.now() / 1000.0;
let g_elapsedTime = 0;

function tick() {
	g_elapsedTime = (performance.now() / 1000.0) - g_startTime;
	updateAnimationAngles();
	renderAllShapes();
	requestAnimationFrame(tick);
}

function updateAnimationAngles() {
	if (g_animation_enabled) {
		g_neckLower = 15 * Math.sin(g_elapsedTime * 0.8);
		g_neckMiddle = 10 * Math.sin(g_elapsedTime * 0.8 + 0.5);
		g_neckUpper = 8 * Math.sin(g_elapsedTime * 0.8 + 1.0);
		g_legFrontLeft = 30 * Math.sin(g_elapsedTime * 2);
		g_legFrontRight = 30 * Math.sin(g_elapsedTime * 2 + Math.PI);
	}
}

function renderAllShapes() {
	const startTime = performance.now();

	const globalRotationMatrix = new Matrix4();
	globalRotationMatrix.rotate(g_globalRotation_x, 1, 0, 0);
	globalRotationMatrix.rotate(-g_globalRotation_y, 0, 1, 0);
	gl.uniformMatrix4fv(u_GlobalRotationMatrix, false, globalRotationMatrix.elements);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	const bodyColor = [0.85, 0.7, 0.4, 1.0];
	const legColor = [0.8, 0.65, 0.35, 1.0];
	const headColor = [0.9, 0.75, 0.45, 1.0];

	// BODY
	var body = new Cube();
	body.color = bodyColor;
	body.matrix.translate(-0.25, -0.1, 0);
	body.matrix.scale(0.5, 0.4, 0.8);
	body.render();

	// FRONT LEFT LEG
	var legFL = new Cube();
	legFL.color = legColor;
	legFL.matrix.translate(0.15, -0.1, 0.15);
	legFL.matrix.rotate(-g_legFrontLeft, 1, 0, 0);
	legFL.matrix.scale(0.12, 0.6, 0.12);
	legFL.matrix.translate(-0.5, -1, -0.5);
	legFL.render();

	// FRONT RIGHT LEG
	var legFR = new Cube();
	legFR.color = legColor;
	legFR.matrix.translate(-0.15, -0.1, 0.15);
	legFR.matrix.rotate(-g_legFrontRight, 1, 0, 0);
	legFR.matrix.scale(0.12, 0.6, 0.12);
	legFR.matrix.translate(-0.5, -1, -0.5);
	legFR.render();

	// BACK LEFT LEG
	var legBL = new Cube();
	legBL.color = legColor;
	legBL.matrix.translate(0.15, -0.1, 0.65);
	legBL.matrix.scale(0.12, 0.6, 0.12);
	legBL.matrix.translate(-0.5, -1, -0.5);
	legBL.render();

	// BACK RIGHT LEG
	var legBR = new Cube();
	legBR.color = legColor;
	legBR.matrix.translate(-0.15, -0.1, 0.65);
	legBR.matrix.scale(0.12, 0.6, 0.12);
	legBR.matrix.translate(-0.5, -1, -0.5);
	legBR.render();

	// NECK LOWER
	var neckLower = new Cube();
	neckLower.color = bodyColor;
	neckLower.matrix.translate(0, 0.3, 0);
	neckLower.matrix.rotate(g_neckLower, 1, 0, 0);
	var neckLower_coords = new Matrix4(neckLower.matrix);
	neckLower.matrix.scale(0.15, 0.35, 0.15);
	neckLower.matrix.translate(-0.5, 0, -0.5);
	neckLower.render();

	// NECK MIDDLE
	var neckMiddle = new Cube();
	neckMiddle.color = bodyColor;
	neckMiddle.matrix = neckLower_coords;
	neckMiddle.matrix.translate(0, 0.35, 0);
	neckMiddle.matrix.rotate(g_neckMiddle, 1, 0, 0);
	var neckMiddle_coords = new Matrix4(neckMiddle.matrix);
	neckMiddle.matrix.scale(0.14, 0.35, 0.14);
	neckMiddle.matrix.translate(-0.5, 0, -0.5);
	neckMiddle.render();

	// NECK UPPER
	var neckUpper = new Cube();
	neckUpper.color = bodyColor;
	neckUpper.matrix = neckMiddle_coords;
	neckUpper.matrix.translate(0, 0.35, 0);
	neckUpper.matrix.rotate(g_neckUpper, 1, 0, 0);
	var neckUpper_coords = new Matrix4(neckUpper.matrix);
	neckUpper.matrix.scale(0.13, 0.3, 0.13);
	neckUpper.matrix.translate(-0.5, 0, -0.5);
	neckUpper.render();

	// HEAD
	var head = new Cube();
	head.color = headColor;
	head.matrix = neckUpper_coords;
	head.matrix.translate(0, 0.3, 0);
	head.matrix.rotate(g_headRotation, 0, 1, 0);
	var head_coords = new Matrix4(head.matrix);
	head.matrix.scale(0.22, 0.18, 0.28);
	head.matrix.translate(-0.5, 0, -0.5);
	head.render();

	// LEFT EYE
	var eyeL = new Cube();
	eyeL.color = [0, 0, 0, 1];
	eyeL.matrix = head_coords;
	eyeL.matrix.translate(0.08, 0.06, 0.1);
	eyeL.matrix.scale(0.03, 0.03, 0.03);
	eyeL.render();

	// RIGHT EYE
	var eyeR = new Cube();
	eyeR.color = [0, 0, 0, 1];
	eyeR.matrix = head_coords;
	eyeR.matrix.translate(-0.08, 0.06, 0.1);
	eyeR.matrix.scale(0.03, 0.03, 0.03);
	eyeR.render();

	// OSSICONE
	var horn = new Pyramid();
	horn.color = [0.6, 0.4, 0.2, 1];
	horn.matrix = head_coords;
	horn.matrix.translate(0, 0.18, 0);
	horn.matrix.scale(0.08, 0.15, 0.08);
	horn.render();

	const duration = performance.now() - startTime;
	const fpsCounter = document.getElementById("fpsCounter");
	if (fpsCounter) {
		fpsCounter.innerHTML = `ms: ${duration.toFixed(2)}, fps: ${Math.floor(1000 / duration)}`;
	}
}

main();
