var game;
var hdpi;

var fpsCounter = 0, fpsTime = 0, fps = 0;
var fpsSpan, gameDiv;

function init() {	
	var w = 150, h = 200;
	hdpi = 1;
	if (window.devicePixelRatio) {
		hdpi = window.devicePixelRatio;
		w = w * hdpi;
		h = h * hdpi;
	}
	game = new Phaser.Game(w, h, Phaser.AUTO, 'game', { preload : preload, create : create, render : render }, false, false, null);
	fpsSpan = document.getElementById('fps');
	gameDiv = document.getElementById('game');

	// canvas = document.getElementById('gameCanvas');
	// context = canvas.getContext('2d');
	// context.mozImageSmoothingEnabled = false;
	// context.webkitImageSmoothingEnabled = false;
	// context.msImageSmoothingEnabled = false;
	// context.imageSmoothingEnabled = false;


 // 	var lbird = new Image();
	// lbird.onload = function (argument) {
	// 	bird = lbird;

	// 	var b1 = document.createElement('canvas');
	// 	b1.width = 92; b1.height = 64;
	// 	b1.getContext('2d').drawImage(bird, 0, 0, 92, 64, 0, 0, 92, 64);
	// 	var b2 = document.createElement('canvas');
	// 	b2.width = 92; b2.height = 64;
	// 	b2.getContext('2d').drawImage(bird, 92, 0, 92, 64, 0, 0, 92, 64);
	// 	var b3 = document.createElement('canvas');
	// 	b3.width = 92; b3.height = 64;
	// 	b3.getContext('2d').drawImage(bird, 2 * 92, 0, 92, 64, 0, 0, 92, 64);
	// 	birds = [b1, b2, b3, b2];

	// 	start();
	// }
	// lbird.src = 'http://www.appcycle.me/flappy/img/bird.png';
}

function preload() {
	var birdData = {
		'frames' : [
		{ 'frame' : { 'x' : 0, 'y' : 0, 'w' : 92, 'h' : 64} },
		{ 'frame' : { 'x' : 92, 'y' : 0, 'w' : 92, 'h' : 64} },
		{ 'frame' : { 'x' : 2 * 92, 'y' : 0, 'w' : 92, 'h' : 64}}
		]
	};

	game.load.atlas('bird', 'bird.png', null, birdData);
}

function create() {
	game.stage.backgroundColor = '#00dd00';
	game.stage.disableVisibilityChange = true;
	game.stage.smoothed = false;

	game.time.advancedTiming = true;

	game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
	game.scale.setMinMax(150, 200, 1500, 2000);
	game.scale.pageAlignHorizontally = true;
	game.scale.setResizeCallback(on_resize);
	game.scale.refresh();

	for (var i = 0; i < 150; i += 92) {
		for (var j = 0; j < 200; j += 64) {

			var bird = game.add.sprite(i, j, 'bird');
			bird.animations.add('fly', [0, 1, 2, 1], 6, true);
			bird.animations.play('fly');
			bird.smoothed = false;
		}
	}
}

function on_resize(scale, parentBounds) {
	var s = Math.min(parentBounds.width / 150, parentBounds.height / 200);
	scale.setUserScale(s / hdpi, s / hdpi);
}

function render() {
	var r = (game.renderType == Phaser.WEBGL) ? "WebGL" : "Canvas";
	if (fpsSpan) {
		fpsSpan.innerHTML = '' + game.time.fps + ' ' + gameDiv.clientWidth + 'x' + gameDiv.clientHeight + ' ' + window.devicePixelRatio + ' ' + r;
	}
	// game.debug.text(game.time.fps || '--', 2, 14, "#00ff00");
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

	for (var i = 0; i < 150; i += 64) {
		for (var j = 0; j < 200; j += 92) {
			// context.drawImage(bird, 92 * bframe, 0, 92, 64, j, i, 92, 64);	
			context.drawImage(birds[bframe], j, i);
		}
	}

	fpsSpan.innerHTML = '' + fps;
	requestAnimationFrame(enter_frame);
}
