function init() {	
	var hdpi = window.devicePixelRatio || 1;
	var WIDTH = 150 * hdpi, HEIGHT = 200 * hdpi;

	function TestState(game) {
		this.preload = function () {
			var birdData = {
				'frames' : [
				{ 'frame' : { 'x' : 0, 'y' : 0, 'w' : 17, 'h' : 12} },
				{ 'frame' : { 'x' : 17, 'y' : 0, 'w' : 17, 'h' : 12} },
				{ 'frame' : { 'x' : 2 * 17, 'y' : 0, 'w' : 17, 'h' : 12}}
				]
			};

			game.load.atlas('bird', 'birds.png', null, birdData);
		},

		this.create = function () {
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
	}

	function FPSPlugin(game) {
		var fpsSpan = document.getElementById('fps');
		var gameDiv = document.getElementById('game');

		this.render = function () {
			var r = (game.renderType == Phaser.WEBGL) ? "WebGL" : "Canvas";
			if (fpsSpan) {
				fpsSpan.innerHTML = '' + game.time.fps + ' ' + gameDiv.clientWidth + 'x' + gameDiv.clientHeight + ' ' + window.devicePixelRatio + ' ' + r + ' 4';
			}
		}
	}
	
	(function () {
		var game = new Phaser.Game(WIDTH, HEIGHT, Phaser.AUTO, 'game', null, false, false, null);
		game.device.whenReady(function () {		
			game.stage.backgroundColor = '#00dd00';
			game.stage.disableVisibilityChange = true;
			game.stage.smoothed = false;

			game.time.advancedTiming = true;

			game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
			game.scale.setMinMax(150, 200, 1500, 2000);
			game.scale.pageAlignHorizontally = true;
			game.scale.setResizeCallback(function (scale, parentBounds) {
				var s = Math.min(parentBounds.width / 150, parentBounds.height / 200);
				scale.setUserScale(s / hdpi, s / hdpi);
			});		
			game.scale.refresh();

			game.plugins.add(FPSPlugin);
		});

		game.state.add('test', TestState, true);
	})()
}
