'use strict'
var VERSION = 9;

// hdpi hook
Phaser.Game.prototype.setUpRenderer = function () {
	var hdpi = window.devicePixelRatio || 1;

    if (this.config['canvasID'])
    {
        this.canvas = Phaser.Canvas.create(this.width, this.height, this.config['canvasID']);
    }
    else
    {
        this.canvas = Phaser.Canvas.create(this.width, this.height);
    }

    if (this.config['canvasStyle'])
    {
        this.canvas.style = this.config['canvasStyle'];
    }
    else
    {
        this.canvas.style['-webkit-full-screen'] = 'width: 100%; height: 100%';
    }

    if (this.device.cocoonJS)
    {
        if (this.renderType === Phaser.CANVAS)
        {
            this.canvas.screencanvas = true;
        }
        else
        {
            // Some issue related to scaling arise with Cocoon using screencanvas and webgl renderer.
            this.canvas.screencanvas = false;
        }
    }

    if (this.renderType === Phaser.HEADLESS || this.renderType === Phaser.CANVAS || (this.renderType === Phaser.AUTO && this.device.webGL === false))
    {
        if (this.device.canvas)
        {
            if (this.renderType === Phaser.AUTO)
            {
                this.renderType = Phaser.CANVAS;
            }

            this.renderer = new PIXI.CanvasRenderer(this.width, this.height, { "view": this.canvas, "transparent": this.transparent, "resolution": hdpi, "clearBeforeRender": true });
            this.context = this.renderer.context;
        }
        else
        {
            throw new Error('Phaser.Game - cannot create Canvas or WebGL context, aborting.');
        }
    }
    else
    {
        //  They requested WebGL and their browser supports it
        this.renderType = Phaser.WEBGL;

        this.renderer = new PIXI.WebGLRenderer(this.width, this.height, { "view": this.canvas, "transparent": this.transparent, "resolution": hdpi, "antialias": this.antialias, "preserveDrawingBuffer": this.preserveDrawingBuffer });
        this.context = null;
    }

    if (this.renderType !== Phaser.HEADLESS)
    {
        this.stage.smoothed = this.antialias;
        
        Phaser.Canvas.addToDOM(this.canvas, this.parent, false);
        Phaser.Canvas.setTouchAction(this.canvas);
    }
}

function init() {	
	var WIDTH = 150, HEIGHT = 200;
	var SPEED = 60;

	function disable_smooting(ctx) {
		ctx.imageSmoothingEnabled = false;
		ctx.mozImageSmoothingEnabled = false;
		ctx.oImageSmoothingEnabled = false;
		ctx.webkitImageSmoothingEnabled = false;		
	}

	function create_back(game, width, height) {
		var GR = 24;
		var back = game.add.bitmapData(width, height);
		var ctx = back.context;

		disable_smooting(ctx);

		ctx.fillStyle = '#f5dab5';
		ctx.fillRect(0, height - GR, width, GR);

		var town = game.cache.getImage('bg');
		ctx.drawImage(town, 0, height - GR - town.height, width, town.height);

		var roll = game.add.tileSprite(0, HEIGHT - GR, 300, 26, 'down');
		roll.autoScroll(-SPEED, 0);
		roll.smoothed = false;

		var g = game.add.group();
		g.add(game.add.sprite(0, 0, back));
		g.add(roll);

		return g;
	}

	function create_bird(game) {
		var bird = game.add.sprite(75, 50, 'bird');
		bird.animations.add('fly', [0, 1, 2, 1], 6, true);
		bird.animations.play('fly');
		bird.smoothed = false;
		return bird;
	}

	function PreloadState(game) {
		this.preload = function () {
			game.load.spritesheet('bird', 'n_bird.png', 17, 12, 3);
			game.load.image('down', 'f_down.png');
			game.load.image('bg', 'f_bg.png');
			game.load.image('wall', 'f_wall.png');
			game.load.image('btn_play','btn_play.png');
		}
		this.create = function () {
			game.state.start('menu');
		}
	}

	function MenuState(game) {
		this.create = function () {
			create_back(game, WIDTH, HEIGHT);
			create_bird(game);

			var play = game.add.button(game.world.centerX - 58 /2, 75, 'btn_play', function () {				
				game.state.start('game');
			});
			play.smoothed = false;


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

	function GameState(game) {
		this.create = function () {
			create_back(game, WIDTH, HEIGHT);
			game.physics.startSystem(Phaser.Physics.ARCADE);
    		game.physics.arcade.gravity.y = 500;
		}

	}

	function FPSPlugin(game) {
		var fpsSpan = document.getElementById('fps');
		var gameDiv = document.getElementById('game');

		this.render = function () {
			var r = (game.renderType == Phaser.WEBGL) ? "WebGL" : "Canvas";
			if (fpsSpan) {
				fpsSpan.innerHTML = '' + game.time.fps + ' ' + gameDiv.clientWidth + 'x' + gameDiv.clientHeight + ' ' + window.devicePixelRatio + ' ' + r + ' ' + VERSION;
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

		game.state.add('preload', PreloadState, true);
		game.state.add('menu', MenuState);
		game.state.add('game', GameState);
	})()
}
