'use strict'
var VERSION = 21;

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

            this.renderer = new PIXI.CanvasRenderer(this.width, this.height, { "view": this.canvas, "transparent": this.transparent, "resolution": hdpi, "clearBeforeRender": false });
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

        this.renderer = new PIXI.WebGLRenderer(this.width, this.height, { "view": this.canvas, "transparent": this.transparent, "resolution": hdpi, "antialias": this.antialias, "preserveDrawingBuffer": this.preserveDrawingBuffer, "clearBeforeRender" : false });
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
	var SPEED = 60, GRAVITY = 500, FLAP_VEL = 200;
	var FLAP_ANGLE = -45, FLAP_TIME = 0.05 * Phaser.Timer.SECOND;

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
		// Phaser.Sprite.call(this, game, 0, y, 'down');
		Phaser.TileSprite.call(this, game, 0, y, 150, 24, 'down');
		this.autoScroll(-SPEED, 0);
		this.smoothed = false;
		this.game.physics.arcade.enableBody(this);
		this.body.immovable = true;  
		this.body.allowGravity = false;

		// this.preUpdate = function () {
		// 	this.x += -SPEED * this.game.time.physicsElapsed;
		// 	while (this.x <= -150) {
		// 		this.x += 150;
		// 	}
		// }
	}	
	Ground.prototype = Object.create(Phaser.TileSprite.prototype);
	Ground.prototype.constructor = Ground;

	var Wall = function (game) {
		Phaser.Group.call(this, game);
		var top = new Phaser.Sprite(game, 0, -150, 'wall_u');
		game.physics.arcade.enableBody(top);
		top.body.velocity.x = -SPEED;  
		top.body.allowGravity = false;
		this.add(top);
		var bottom = new Phaser.Sprite(game, 0, 100, 'wall_u');
		game.physics.arcade.enableBody(bottom);
		bottom.body.velocity.x = -SPEED;  
		bottom.body.allowGravity = false;
		this.add(bottom);

		this.checkWorldBounds = true;
  		this.outOfBoundsKill = true;

		this.reset = function (x, y) {
			top.reset(0, -150);
			top.body.velocity.x = -SPEED;  
			bottom.reset(0, 100 + 200);
			bottom.scale.y = -1;
			bottom.body.velocity.x = -SPEED;  
			this.x = x;
			this.y = y;
			this.exists = true;
			this.visible = true;
		}

		this.update = function () {
			if (this.exists && !top.inWorld) {
				this.exists = false;
				this.visible = false;
			}
		}
	}
	Wall.prototype = Object.create(Phaser.Group.prototype);
	Wall.prototype.constructor = Wall;

	var Bird = function (game, x, y) {
		Phaser.Sprite.call(this, game, x, y, 'bird');
		this.anchor.setTo(0.5, 0.5);
		this.animations.add('fly', [0, 1, 2, 1], 6, true);
		this.animations.play('fly');
		this.smoothed = false;
		this.game.physics.arcade.enableBody(this);
		this.alive = false;
		this.body.allowGravity = false;

		this.update = function () {
			if(this.alive) {
				var v = this.body.velocity.y;
				if (v <= 0) {
					this.angle = FLAP_ANGLE * Math.min(1.0, -v / 200);
				} else {
					this.angle = 90 * Math.min(1.0, v / 200);
				}
			}		
		}

		this.hatch = function () {
			this.alive = true;		
			this.body.allowGravity = true;
		}
		this.flap = function () {
			this.body.velocity.y = -FLAP_VEL;		
		}
	}
	Bird.prototype = Object.create(Phaser.Sprite.prototype);
	Bird.prototype.constructor = Bird;

	function PreloadState(game) {
		this.preload = function () {
			game.load.spritesheet('bird', 'n_bird.png', 17, 12, 3);
			game.load.image('down', 'f_down_2.png');
			game.load.image('bg', 'f_bg.png');
			game.load.image('wall_u', 'f_wall_u.png');
			game.load.image('wall_d', 'f_wall_d.png');
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

			var play = game.add.button(game.world.centerX, 105, 'btn_play', function () {				
				game.state.start('game');
			});
			play.anchor.setTo(0.5, 0.5);
			play.smoothed = false;
		}
	}

	function GameState(game) {
		var bird, ground, walls;
		var wallsTimer;

		function emitWall() {
			var wallY = game.rnd.integerInRange(-50, 50);
 			var wall = walls.getFirstExists(false);
 			if (!wall) {
 				wall = new Wall(game);
 				walls.add(wall);
 			}
 			wall.reset(game.width - 1, wallY)
		}

		this.create = function () {
			this.game.add.existing(new Background(game, 0, 0, WIDTH, HEIGHT));
			bird = this.game.add.existing(new Bird(game, 75, 50));
			walls = this.game.add.group();
			ground = this.game.add.existing(new Ground(game, HEIGHT - GR));
			bird.hatch();

			game.physics.startSystem(Phaser.Physics.ARCADE);
    		game.physics.arcade.gravity.y = GRAVITY;

    		game.time.events.loop(Phaser.Timer.SECOND * 1.25, emitWall);

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
		game.config.enableDebug = false;
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
