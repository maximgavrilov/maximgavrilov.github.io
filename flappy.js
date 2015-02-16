'use strict'
var VERSION = 12;

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
	var GR = 24;
	var SPEED = 60, GRAVITY = 500, FLAP_ACCEL = 200;

	function disable_smooting(ctx) {
		ctx.imageSmoothingEnabled = false;
		ctx.mozImageSmoothingEnabled = false;
		ctx.oImageSmoothingEnabled = false;
		ctx.webkitImageSmoothingEnabled = false;		
	}

	var Background = function (game, x, y, width, height) {
		var back = new Phaser.BitmapData(game, null, width, height);
		var ctx = back.context;

		disable_smooting(ctx);

		ctx.fillStyle = '#93d4c3';
		ctx.fillRect(0, 0, width, height - GR);

		ctx.fillStyle = '#f5dab5';
		ctx.fillRect(0, height - GR, width, GR);

		var town = game.cache.getImage('bg');
		ctx.drawImage(town, 0, height - GR - town.height, width, town.height);

		Phaser.Image.call(this, game, x, y, back);
	}
	Background.prototype = Object.create(Phaser.Image.prototype);  
	Background.prototype.constructor = Background;

	var Ground = function (game, y) {
		Phaser.TileSprite.call(this, game, 0, y, 300, 26, 'down');
		this.autoScroll(-SPEED, 0);
		this.smoothed = false;
		this.game.physics.arcade.enableBody(this);
		this.body.immovable = true;  
		this.body.allowGravity = false;
	}	
	Ground.prototype = Object.create(Phaser.TileSprite.prototype);
	Ground.prototype.constructor = Ground;

	var Bird = function (game, x, y) {
		Phaser.Sprite.call(this, game, x, y, 'bird');
		this.anchor.setTo(0.5, 0.5);
		this.animations.add('fly', [0, 1, 2, 1], 6, true);
		this.animations.play('fly');
		this.smoothed = false;
		this.game.physics.arcade.enableBody(this);
	}	
	Bird.prototype = Object.create(Phaser.Sprite.prototype);
	Bird.prototype.constructor = Bird;

	Bird.prototype.flap = function () {
		this.body.velocity.y = -FLAP_ACCEL;		
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
			this.game.add.existing(new Background(game, 0, 0, WIDTH, HEIGHT));
			this.game.add.existing(new Ground(game, HEIGHT - GR));
			this.game.add.existing(new Bird(game, 75, 50));

			var play = game.add.button(game.world.centerX - 58 /2, 75, 'btn_play', function () {				
				game.state.start('game');
			});
			play.smoothed = false;
		}
	}

	function GameState(game) {
		var bird, ground;
		this.create = function () {
			this.game.add.existing(new Background(game, 0, 0, WIDTH, HEIGHT));
			ground = this.game.add.existing(new Ground(game, HEIGHT - GR));
			bird = this.game.add.existing(new Bird(game, 75, 50));
			
			game.physics.startSystem(Phaser.Physics.ARCADE);
    		game.physics.arcade.gravity.y = GRAVITY;

    		game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);
    		var flapKey = this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    		flapKey.onDown.add(bird.flap, bird);
    		this.input.onDown.add(bird.flap, bird);
		}

		this.update = function () {
			game.physics.arcade.collide(bird, ground);
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
			game.stage.backgroundColor = '#ff0000';
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
