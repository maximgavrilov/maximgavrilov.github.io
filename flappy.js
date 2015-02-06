var requestAnimationFrame = window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	window.oRequestAnimationFrame ||
	window.msRequestAnimationFrame ||
	function(callback,element) {
		window.setTimeout(callback, 1000 / 60);
	};

var canvas, context;
var frame = 0;
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

	requestAnimationFrame(enter_frame);
}

function enter_frame() {
	frame += 1;	
	context.clearRect(0, 0, canvas.width, canvas.height);
	var bframe = (frame / 8 | 0) % 3;
	context.drawImage(bird, 92 * bframe, 0, 92, 64, 30, 30, 92, 64);	
	requestAnimationFrame(enter_frame);
}
