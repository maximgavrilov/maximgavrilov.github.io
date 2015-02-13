function init() {	
	var game;
	var hdpi;

	var fpsCounter = 0, fpsTime = 0, fps = 0;
	var fpsSpan, gameDiv;

	function preload() {
		var birdData = {
			'frames' : [
			{ 'frame' : { 'x' : 0, 'y' : 0, 'w' : 17, 'h' : 12} },
			{ 'frame' : { 'x' : 17, 'y' : 0, 'w' : 17, 'h' : 12} },
			{ 'frame' : { 'x' : 2 * 17, 'y' : 0, 'w' : 17, 'h' : 12}}
			]
		};

		game.load.atlas('bird', 'birds.png', null, birdData);
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

		for (var i = 0; i < 150 * hdpi; i += 17 * hdpi) {
			for (var j = 0; j < 200 * hdpi; j += 12 * hdpi) {

				var bird = game.add.sprite(i, j, 'bird');
				bird.animations.add('fly', [0, 1, 2, 1], 6, true);
				bird.animations.play('fly');
				bird.smoothed = false;
				bird.scale = new PIXI.Point(hdpi, hdpi);
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
			fpsSpan.innerHTML = '' + game.time.fps + ' ' + gameDiv.clientWidth + 'x' + gameDiv.clientHeight + ' ' + window.devicePixelRatio + ' ' + r + ' 3';
		}
		// game.debug.text(game.time.fps || '--', 2, 14, "#00ff00");
	}

	var w = 150, h = 200;
	hdpi = 1;
	game = new Phaser.Game(w, h, Phaser.AUTO, 'game', { preload : preload, create : create, render : render }, false, false, null);

	fpsSpan = document.getElementById('fps');
	gameDiv = document.getElementById('game');
}
