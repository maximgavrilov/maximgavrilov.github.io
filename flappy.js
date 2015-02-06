var requestAnimationFrame = window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	window.oRequestAnimationFrame ||
	window.msRequestAnimationFrame ||
	function(callback,element) {
		window.setTimeout(callback, 1000 / 60);
	};

var canvas, context;
var frame = 0, lastTime, frameTime;
var fpsCounter = 0, fpsTime = 0, fps = 0;
var bird, birds;

function init() {	
	canvas = document.getElementById('gameCanvas');
	context = canvas.getContext('2d');
	context.mozImageSmoothingEnabled = false;
	context.webkitImageSmoothingEnabled = false;
	context.msImageSmoothingEnabled = false;
	context.imageSmoothingEnabled = false;

 	var lbird = new Image();
	lbird.onload = function (argument) {
		bird = lbird;

		var b1 = document.createElement('canvas');
		b1.width = 92; b1.height = 64;
		b1.getContext('2d').drawImage(bird, 0, 0, 92, 64, 0, 0, 92, 64);
		var b2 = document.createElement('canvas');
		b2.width = 92; b2.height = 64;
		b2.getContext('2d').drawImage(bird, 92, 0, 92, 64, 0, 0, 92, 64);
		var b3 = document.createElement('canvas');
		b3.width = 92; b3.height = 64;
		b3.getContext('2d').drawImage(bird, 2 * 92, 0, 92, 64, 0, 0, 92, 64);
		birds = [b1, b2, b3, b2];

		start();
	}
	lbird.src = 'http://www.appcycle.me/flappy/img/bird.png';
}

function start() {
	if (!bird) return;

	lastTime = (new Date()).getTime();
	requestAnimationFrame(enter_frame);
}

function enter_frame() {
	frame += 1;	
	
	var prevTime = lastTime;
	lastTime = (new Date()).getTime();
	
	var dt = lastTime - prevTime;
	frameTime += dt;

	fpsCounter += 1;
	fpsTime += dt;
	if (fpsTime > 500) {
		fps = (0.5 + 1000 * fpsCounter / fpsTime) | 0;
		fpsTime = 0;
		fpsCounter = 0;
	}

	context.clearRect(0, 0, canvas.width, canvas.height);

	context.fillStyle = 'green';
	context.fillRect(0, 0, canvas.width, canvas.height);
	
	context.beginPath();
	context.moveTo(10, 10.5);
	context.lineTo(40, 10.5);
	context.strokeStyle = 'red';
	context.stroke();

	var bframe = ((frame / 10) | 0) % 4;
	if (bframe == 3) bframe = 1;

	for (var i = 0; i < 500; i += 64) {
		for (var j = 0; j < 400; j += 92) {
			// context.drawImage(bird, 92 * bframe, 0, 92, 64, j, i, 92, 64);	
			context.drawImage(birds[bframe], j, i);
		}
	}

	context.font = "14px sans-serif";
	context.fillStyle = 'black';
	context.textBaseline = 'top';	
	context.fillText('0' + fps, 0, 0);

	requestAnimationFrame(enter_frame);
}
