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
var bird;

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
		start();
	}
	lbird.src = 'http://www.appcycle.me/flappy/img/bird.png';
}

function start() {
	if (!bird) return;

	context.clearRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = 'green';
	context.fillRect(0, 0, canvas.width, canvas.height);
	
	context.beginPath();
	context.moveTo(10, 10.5);
	context.lineTo(40, 10.5);
	context.strokeStyle = 'red';
	context.stroke();

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
		fps = (1000 / (fpsTime / fpsCounter)) | 0;
		fpsTime = 0;
		fpsCounter = 0;
	}

	context.clearRect(0, 0, canvas.width, canvas.height);
	var bframe = ((frame / 10) | 0) % 4;
	if (bframe == 3) bframe = 1;
	context.drawImage(bird, 92 * bframe, 0, 92, 64, 30, 0, 92, 64);	
	context.drawImage(bird, 92 * bframe, 0, 92, 64, 30, 15, 92, 64);	
	context.drawImage(bird, 92 * bframe, 0, 92, 64, 30, 30, 92, 64);	
	context.drawImage(bird, 92 * bframe, 0, 92, 64, 30, 50, 92, 64);	
	context.drawImage(bird, 92 * bframe, 0, 92, 64, 30, 80, 92, 64);	

	context.font = "bold 12px sans-serif";
	context.fillStyle = 'black';
	context.textBaseline = 'top';	
	context.fillText(fps, 0, 0);

	requestAnimationFrame(enter_frame);
}
