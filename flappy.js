'use strict'
var VERSION = 26;

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

        this.renderer = new PIXI.WebGLRenderer(this.width, this.height, { "view": this.canvas, "transparent": this.transparent, "resolution": hdpi, "antialias": this.antialias, "preserveDrawingBuffer": this.preserveDrawingBuffer, "clearBeforeRender" : true });
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
	var SPEED = 60, GRAVITY = 500, FLAP_VEL = 180;
	var FLAP_ANGLE = -45, FLAP_TIME = 0.05 * Phaser.Timer.SECOND;

	function disable_smooting(ctx) {
		ctx.imageSmoothingEnabled = false;
		ctx.mozImageSmoothingEnabled = false;
		ctx.oImageSmoothingEnabled = false;
		ctx.webkitImageSmoothingEnabled = false;		
	}

	function add_button(game, x, y, name, cb) {
		var btn = game.add.button(x, y, 'gui', function (_, pointer, isOver) {				
			if (isOver) {
				cb();
			}
		}, null, name + '_over.png', name + '_out.png', name + '_down.png');
		btn.anchor.setTo(0, 0);
		btn.smoothed = false;
		return btn;
	}

	var bgBitmap;
	var Background = function (game, x, y, width, height) {
		var back = bgBitmap;
		if (!back) {
			back = new Phaser.BitmapData(game, null, width, height);
			var ctx = back.context;

			disable_smooting(ctx);

			ctx.fillStyle = '#93d4c3';
			ctx.fillRect(0, 0, width, height - GR);

			ctx.fillStyle = '#f5dab5';
			ctx.fillRect(0, height - GR, width, GR);

			var town = game.cache.getImage('bg');
			ctx.drawImage(town, 0, height - GR - town.height, width, town.height);

			bgBitmap = back;
		}
		Phaser.Image.call(this, game, x, y, back);
	}
	Background.prototype = Object.create(Phaser.Image.prototype);  
	Background.prototype.constructor = Background;

	var Ground = function (game, y) {
		Phaser.TileSprite.call(this, game, 0, y, 150, 24, 'gui', 'ground.png');
		this.autoScroll(-SPEED, 0);
		this.smoothed = false;
		this.game.physics.arcade.enableBody(this);
		this.body.immovable = true;  
		this.body.allowGravity = false;

		// workaround for Phaser 2.2.2 bug
		this.destroy = function () {
			Phaser.TileSprite.prototype.destroy.call(this);
			if (this.tilingTexture) {
				this.tilingTexture.destroy(true);
				this.tilingTexture = null;								
			}
		}
	}	
	Ground.prototype = Object.create(Phaser.TileSprite.prototype);
	Ground.prototype.constructor = Ground;

	var Wall = function (game) {
		Phaser.Group.call(this, game);

		var top = new Phaser.Sprite(game, 0, -150, 'gui');
		top.frameName = 'wall_u.png';
		game.physics.arcade.enableBody(top);
		top.body.allowGravity = false;
		top.body.immovable = true;  
		top.smoothed = false;
		top.crop(new Phaser.Rectangle(0, 0, 26, 200));
		this.add(top);

		var bottom = new Phaser.Sprite(game, 0, 100, 'gui');
		bottom.frameName = 'wall_d.png';
		game.physics.arcade.enableBody(bottom);
		bottom.body.allowGravity = false;
		bottom.body.immovable = true;  
		bottom.smoothed = false;
		bottom.crop(new Phaser.Rectangle(0, 0, 26, 200));
		this.add(bottom);

		this.scored = false;

		this.exists = false;
		this.visible = false;

		this.checkWorldBounds = true;
  		this.outOfBoundsKill = true;

		this.reset = function (wallY) {
			top.reset(0, 0);
			top.cropRect.y = 200 - wallY - 50;
			top.cropRect.height = wallY + 50;
			top.updateCrop();
			top.body.velocity.x = -SPEED;  
			top.body.setSize(top.cropRect.width - 2, top.cropRect.height - 1, 1, 0);

			bottom.reset(0, wallY + 50 + 50);
			bottom.cropRect.y = 0;
			bottom.cropRect.height = HEIGHT - wallY - 50 - 50 - GR;
			bottom.updateCrop();
			bottom.body.setSize(bottom.cropRect.width - 2, bottom.cropRect.height - 1, 1, 1);
			bottom.body.velocity.x = -SPEED;  			

			this.x = game.width - 1;
			this.y = 0;
			this.exists = true;
			this.visible = true;
			this.scored = false;
		}

		this.update = function () {
			if (this.exists && !top.inWorld) {
				this.exists = false;
				this.visible = false;
			}
		}

		this.stop = function () {
			top.body.velocity.x = 0;
			bottom.body.velocity.x = 0;
		}

		this.isScored = function (bird) {
			return this.exists && bird.body.position.x >= top.body.position.x;
		}
	}
	Wall.prototype = Object.create(Phaser.Group.prototype);
	Wall.prototype.constructor = Wall;

	var Bird = function (game, x, y) {
		Phaser.Sprite.call(this, game, x, y, 'gui');
		this.anchor.setTo(0.5, 0.5);
		this.animations.add('demo', ['bird1.png', 'bird2.png', 'bird3.png', 'bird2.png'], 6, true);
		this.animations.add('flap', ['bird1.png', 'bird2.png', 'bird3.png', 'bird2.png'], 6);
		this.animations.add('fly', ['bird2.png'], 6, true);
		this.animations.play('demo');

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
			this.animations.stop();
			this.animations.play('fly');
		}

		this.flap = function () {
			if (!this.alive) {
				return;
			}
			this.body.velocity.y = -FLAP_VEL;		
			this.animations.stop();
			this.animations.play('flap').onComplete.addOnce(function () {
				this.animations.play('fly');
			}, this);
		}

		this.die = function () {
			if (!this.alive) {
				return;
			}
			this.animations.stop();
			this.animations.play('fly');
			this.body.velocity.x = 0;
			game.add.tween(this).to({ angle : 90 }, 0.15 * Phaser.Timer.SECOND).start();
			this.alive = false;
		}
	}
	Bird.prototype = Object.create(Phaser.Sprite.prototype);
	Bird.prototype.constructor = Bird;

	var Score = function (game) {
		Phaser.Group.call(this, game);

		this.setValue = function (value) {
			var a;
			if (value == 0) {
				a = ['0'];
			} else {
				a = [];
				while (value > 0) {
					a.push('' + (value % 10));
					value = Math.floor(value / 10);
				}
			}
			while (this.children.length < a.length) {
				this.add(new Phaser.Sprite(game, 0, 0, 'gui'));
			}
			while (this.children.length > a.length) {
				this.remove(this.children[0]);
			}
			var x = 0;
			for (var i = a.length - 1; i >= 0; i--) {
				var d = this.children[i];
				d.reset(x, 0);
				d.frameName = a[i] + '.png';
				var w = 10;
				if (a[i] == '1') {
					w = 7;
				} else if (a[i] == '7') {
					w = 8;
				}
				x += w + 1;
			}
			x = Math.floor(x / 2);
			for (var i = a.length - 1; i >= 0; i--) {
				this.children[i].x -= x;
			}
		}
	}
	Score.prototype = Object.create(Phaser.Group.prototype);
	Score.prototype.constructor = Score;

	var GameOver = function (game) {
		Phaser.Group.call(this, game);
		this.add(game.add.image(37, 13, 'gui', 'game_over.png'));
		this.add(game.add.image(19, 29, 'gui', 'result_bg.png'));
		this.add(add_button(game, 38, 137, 'btn_continue', function () {
			// game.state.start('menu');
		}));
		this.add(add_button(game, 38, 174, 'btn_menu', function () {
			game.state.start('menu');
		}));
	}
	GameOver.prototype = Object.create(Phaser.Group.prototype);
	GameOver.prototype.constructor = GameOver;

	function PreloadState(game) {
		this.preload = function () {
			game.load.image('bg', 'f_bg.png');
			game.load.atlasJSONHash('gui', 'gui.png', 'gui.json');
		}

		this.create = function () {
			game.state.start('menu');
		}
	}

	function MenuState(game) {
		this.create = function () {
			// game.add.existing(new Background(game, 0, 0, WIDTH, HEIGHT));
			// game.add.existing(new Ground(game, HEIGHT - GR));
			game.add.image(22, 37, 'gui', 'logo.png');
			game.add.existing(new Bird(game, 75, 100));

			add_button(game, 38, 137, 'btn_play', function () {
				game.state.start('game');
			});
			add_button(game, 38, 174, 'btn_top', function () {
				game.state.start('top');
			});
		}
	}

	function GameState(game) {
		var bird, bg, ground, walls, score, gameOver;
		var sc = 0;

		function emitWall() {
			var wallY = game.rnd.integerInRange(-50, 50);
 			var wall = walls.getFirstExists(false);
 			if (!wall) {
 				wall = new Wall(game);
 				walls.add(wall);
 			}
 			wall.reset(wallY)
		}

		function death() {
			if (bird.alive) {
				score.visible = false;

				bird.die();
				walls.callAll('stop');
				ground.stopScroll();
				game.time.events.stop();

				gameOver = new GameOver(game);
				game.add.existing(gameOver);
				game.add.tween(gameOver).from({ y : 200 }, 0.4 * Phaser.Timer.SECOND, Phaser.Easing.Quadratic.In, true, 0.8 * Phaser.Timer.SECOND);
			}
		}

		this.create = function () {
			bg = this.game.add.existing(new Background(game, 0, 0, WIDTH, HEIGHT));
			walls = this.game.add.group();
			ground = this.game.add.existing(new Ground(game, HEIGHT - GR));
			bird = this.game.add.existing(new Bird(game, 75, 50));

			score = game.add.existing(new Score(game));
			score.x = 75;
			score.y = 10;
			score.setValue(sc);

			bird.hatch();
			for (var i = 0; i < 3; i++) {				
				walls.add(new Wall(game));
			}

			game.physics.startSystem(Phaser.Physics.ARCADE);
    		game.physics.arcade.gravity.y = GRAVITY;

    		game.time.events.loop(1.25 * Phaser.Timer.SECOND, emitWall);

    		game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);
    		var flapKey = this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    		flapKey.onDown.add(bird.flap, bird);
    		this.input.onDown.add(bird.flap, bird);
		}

		this.update = function () {
			game.physics.arcade.collide(bird, ground, death);
			if (bird.alive) {
				walls.forEach(function (wall) {
					if (!wall.scored && wall.isScored(bird)) {
						wall.scored = true;
						sc += 1;
						score.setValue(sc);
					}
					game.physics.arcade.collide(bird, wall, death);
				}, this, true);				
			}
		}

		this.shutdown = function() {  
			bg.destroy();
			walls.destroy();
			ground.destroy();
			bird.destroy();
			score.destroy();
			if (gameOver) {
				gameOver.destroy();
			}
  			game.input.keyboard.removeKey(Phaser.Keyboard.SPACEBAR);
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
			game.stage.backgroundColor = '#95d5c4';
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
