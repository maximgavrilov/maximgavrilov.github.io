function init() {	
	var hdpi = window.devicePixelRatio || 1;
	var WIDTH = 150 * hdpi, HEIGHT = 200 * hdpi;
	var SPEED = 100;

	function TestState(game) {
		this.preload = function () {
			var birdData = {
				'frames' : [
				{ 'frame' : { 'x' : 0, 'y' : 0, 'w' : 17, 'h' : 12} },
				{ 'frame' : { 'x' : 17, 'y' : 0, 'w' : 17, 'h' : 12} },
				{ 'frame' : { 'x' : 2 * 17, 'y' : 0, 'w' : 17, 'h' : 12}}
				]
			};

			game.load.atlas('bird', 'f_bird.png', null, birdData);
			game.load.image('down', 'f_down.png');
			game.load.image('bg', 'f_bg.png');
			game.load.image('wall', 'f_wall.png');
		},

		this.create = function () {
			var GR = 24 * hdpi;

			var ground = game.add.graphics(0, HEIGHT - GR);
			ground.beginFill(0xf5dab5);
			ground.drawRect(0, 0, WIDTH, GR);
			ground.endFill();

			var down = game.add.tileSprite(0, HEIGHT - GR, 300, 26, 'down');
			down.scale = new PIXI.Point(hdpi, hdpi);
			down.autoScroll(-SPEED, 0);
			down.smoothed = false;

			var bg = game.add.image(0, HEIGHT - GR - 200 * hdpi, 'bg');
			bg.scale = new PIXI.Point(hdpi, hdpi);
			bg.smoothed = false;

			var bird = game.add.sprite(100, 100, 'bird');
			bird.animations.add('fly', [0, 1, 2, 1], 6, true);
			bird.animations.play('fly');
			bird.smoothed = false;
			bird.scale = new PIXI.Point(hdpi, hdpi);

			// for (var i = 0; i < WIDTH; i += 17 * hdpi) {
			// 	for (var j = 0; j < HEIGHT - GR - 12 * hdpi; j += 12 * hdpi) {
			// 		var bird = game.add.sprite(i, j, 'bird');
			// 		bird.animations.add('fly', [0, 1, 2, 1], 6, true);
			// 		bird.animations.play('fly');
			// 		bird.smoothed = false;
			// 		bird.scale = new PIXI.Point(hdpi, hdpi);
			// 	}
			// }
		}
	}

	function FPSPlugin(game) {
		var fpsSpan = document.getElementById('fps');
		var gameDiv = document.getElementById('game');

		this.render = function () {
			var r = (game.renderType == Phaser.WEBGL) ? "WebGL" : "Canvas";
			if (fpsSpan) {
				fpsSpan.innerHTML = '' + game.time.fps + ' ' + gameDiv.clientWidth + 'x' + gameDiv.clientHeight + ' ' + window.devicePixelRatio + ' ' + r + ' 5';
			}
		}
	}
	
	(function () {
		var game = new Phaser.Game(WIDTH, HEIGHT, Phaser.AUTO, 'game', null, false, false, null);
		game.device.whenReady(function () {		
			game.stage.backgroundColor = '#93d4c3';
			game.stage.disableVisibilityChange = true;
			game.stage.smoothed = false;

			game.time.advancedTiming = true;

			game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
			game.scale.setMinMax(WIDTH, HEIGHT, 10 * WIDTH, 10 * HEIGHT);
			game.scale.pageAlignHorizontally = true;
			game.scale.setResizeCallback(function (scale, parentBounds) {
				var s = Math.min(parentBounds.width / WIDTH, parentBounds.height / HEIGHT);
				scale.setUserScale(s, s);
			});		
			game.scale.refresh();

			game.plugins.add(FPSPlugin);
		});

		game.state.add('test', TestState, true);
	})()
}
