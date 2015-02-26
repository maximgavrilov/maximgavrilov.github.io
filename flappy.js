'use strict'
var VERSION = 70;

PIXI.scaleModes.DEFAULT = PIXI.scaleModes.NEAREST;

function init() {	
	var WIDTH = 150, HEIGHT = 200, GR = 0;//24;
	var SPEED = 60, GRAVITY = 600, FLAP_VEL = 175, HOLE_SIZE = 48, WALL_DIST = 79, HOLE_RANGE = [24, 128];
	var BIRD_R = 6;
	var FLAP_ANGLE = -45, FLAP_TIME = 0.05 * Phaser.Timer.SECOND;
	var COLLIDE_ENABLED = true;

	var birdType = 1;

	function add_button(game, x, y, name, cb) {
		var btn = game.add.button(x, y, 'gui', function (_, pointer, isOver) {				
			if (isOver) {
				cb();
			}
		}, null, name + '_over.png', name + '_out.png', name + '_down.png');
		btn.anchor.setTo(0, 0);
		return btn;
	}

	function create_color_box(game, color) {
		var box = game.add.graphics(0, 0);
		box.beginFill(color, 1.0);
		box.drawRect(0, 0, WIDTH, HEIGHT);
		box.endFill();
		return box;
	}

	function hide_to_state(game, name) {
		var blink = create_color_box(game, 0);
		blink.alpha = 0;

		game.add.tween(blink).to({alpha : 1}, 0.2 * Phaser.Timer.SECOND, undefined, true).onComplete.addOnce(function () {
			game.state.start(name);
		});
	}

	var Wall = function (game) {
		Phaser.Group.call(this, game);

		var top = new Phaser.Sprite(game, 0, -150, 'gui');
		top.smoothed = false;
		top.frameName = 'wall_u.png';
		top.crop(new Phaser.Rectangle(0, 0, 26, 200));
		this.add(top);

		var bottom = new Phaser.Sprite(game, 0, -150 + 200 + HOLE_SIZE, 'gui');
		bottom.smoother = false;
		bottom.frameName = 'wall_d.png';
		bottom.crop(new Phaser.Rectangle(0, 0, 26, 200));
		this.add(bottom);

		this.scored = false;

		this.exists = false;
		this.visible = false;

		this.checkWorldBounds = true;
  		this.outOfBoundsKill = true;

  		var isMoving = true;

		this.reset = function (x, wallY) {
			top.reset(x, 0);
			top.cropRect.y = 200 - wallY;
			top.cropRect.height = wallY;
			top.updateCrop();

			bottom.reset(x, wallY + HOLE_SIZE);
			bottom.cropRect.y = 0;
			bottom.cropRect.height = HEIGHT - wallY - HOLE_SIZE - GR;
			bottom.updateCrop();

			this.x = 0;
			this.y = 0;
			this.exists = true;
			this.visible = true;
			this.scored = false;

			isMoving = true;
		}

		this.update = function () {
			if (this.exists && top.x < -26) {
				this.exists = false;
				this.visible = false;
				isMoving = false;
			} else if (isMoving) {
				var e = game.time.elapsed / 1000;
		        top.x += -SPEED * e;
		        bottom.x += -SPEED * e;
			}
		}

		this.stop = function () {
			isMoving = false;
		}

		this.isScored = function (bird) {
			return this.exists && bird.x >= top.x + top.width / 2;
		}

		function intersect(bird, w) {
		    var cx = Math.abs(bird.x - w.x - w.width / 2);
		    var cy = Math.abs(bird.y - w.y - w.height / 2);

		    if (cx > (w.width/2 + BIRD_R)) { return false; }
		    if (cy > (w.height/2 + BIRD_R)) { return false; }

		    if (cx <= (w.width/2)) { return true; } 
		    if (cy <= (w.height/2)) { return true; }

		    var sq = (cx - w.width/2) * (cx - w.width/2) + (cy - w.height/2) * (cy - w.height/2);

		    return (sq <= (BIRD_R * BIRD_R));			
		}

		this.isCollide = function (bird) {
			if (!COLLIDE_ENABLED) return false;
			var over = ((bird.x + BIRD_R) >= top.x && (bird.x - BIRD_R) <= (top.x + top.width)) && bird.y < 0;
			return over || intersect(bird, top) || intersect(bird, bottom);
		}

		this.getX = function () { 
			return top.x;
		}
	}
	Wall.prototype = Object.create(Phaser.Group.prototype);
	Wall.prototype.constructor = Wall;

	var Bird = function (game, type, x, y) {
		Phaser.Sprite.call(this, game, x, y, 'gui');
		this.anchor.setTo(0.5, 0.5);
		this.animations.add('demo', ['bird' + type + '_1.png', 'bird' + type + '_2.png', 'bird' + type + '_3.png', 'bird' + type + '_2.png'], 6, true);
		this.animations.add('flap', ['bird' + type + '_1.png', 'bird' + type + '_2.png', 'bird' + type + '_3.png', 'bird' + type + '_2.png'], 6);
		this.animations.add('fly', ['bird' + type + '_2.png'], 6, true);
		this.animations.play('demo');

		this.alive = false;
		this.smoothed = false;

		this.bodyGravity = false;
		var velocityY = 0;

		this.update = function () {
			var e = game.time.elapsed / 1000;
			if (this.bodyGravity) {
				this.y += velocityY * e + GRAVITY * e * e / 2;
				velocityY += GRAVITY * e;
			}
			if(this.alive && this.bodyGravity) {
				if (velocityY <= 0) {
					this.angle = FLAP_ANGLE * Math.min(1.0, -velocityY / 200);
				} else {
					this.angle = 90 * Math.min(1.0, velocityY / 200);
				}
			}		
		}

		this.hatch = function () {
			this.alive = true;		
			this.bodyGravity = true;
			this.animations.stop();
			this.animations.play('fly');
		}

		this.flap = function () {
			if (!this.alive) {
				return;
			}
			velocityY = -FLAP_VEL;
			this.animations.stop();
			this.animations.play('flap').onComplete.addOnce(function () {
				this.animations.play('fly');
			}, this);
		}

		this.die = function () {
			this.animations.stop();
			this.animations.play('fly');
			velocityY = 0;
			game.add.tween(this).to({ angle : 90 }, 0.15 * Phaser.Timer.SECOND).start();
			this.alive = false;
		}
	}
	Bird.prototype = Object.create(Phaser.Sprite.prototype);
	Bird.prototype.constructor = Bird;

	var Score = function (game, x, y, small, align) {
		Phaser.Group.call(this, game);

		this.x = x;
		this.y = y;

		var val = 0;
		var needUpdate = true;

		Object.defineProperty(this, 'value', {
		    get: function () {
		        return val;
		    },

		    set: function (value) {
		    	if (val != value) {
			        val = value;
			        needUpdate = true;
		    	}
		    }
		});

		this.update = function () {
			if (!needUpdate) return;
			needUpdate = false;

			var value = Math.round(val);
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
				if (small) {
					d.frameName = 's' + a[i] + '.png';
					var w = 7;
					if (a[i] == '1') {
						w = 6;
					}							
				} else {
					d.frameName = a[i] + '.png';
					var w = 10;
					if (a[i] == '1') {
						w = 7;
					} else if (a[i] == '7') {
						w = 8;
					}
				}
				x += w + 1;
			}
			
			if (align == 'center') {
				x = Math.floor(x / 2);
			} else if (align == 'left') {
				x = 0;
			} else if (align == 'right') {
				x = x;
			}

			for (var i = a.length - 1; i >= 0; i--) {
				this.children[i].x -= x;
			}			
		}
	}
	Score.prototype = Object.create(Phaser.Group.prototype);
	Score.prototype.constructor = Score;

	var GameOver = function (game, score_, bestScore_) {
		Phaser.Group.call(this, game);
		var title = this.add(game.add.image(37, 13, 'gui', 'txt_game_over.png'));

		var result = game.add.group();
		result.x = 19;
		result.y = 29;
		result.add(game.add.image(0, 0, 'gui', 'result_bg.png'));
		result.add(game.add.image(13, 9, 'gui', 'medal_gold.png'));
		result.add(game.add.image(43, 17, 'gui', 'txt_medal.png'));
		result.add(game.add.image(27 - 10, 37, 'gui', 'txt_result.png'));
		result.add(game.add.image(44 - 10, 49, 'gui', 'txt_best.png'));
		if (score_ > bestScore_) {
			result.add(game.add.image(19 - 10, 49, 'gui', 'txt_new.png'));
		}
		var score = result.add(new Score(game, 101, 36, true, 'right'));
		var bestScore = result.add(new Score(game, 101, 50, true, 'right'));
		result.add(add_button(game, 12, 67, 'btn_share', function () {
			// game.state.start('menu');
		}));
		this.add(result);

		var buttons = game.add.group();
		buttons.add(add_button(game, 38, 137, 'btn_continue', function () {
			// game.state.start('menu');
		}));
		buttons.add(add_button(game, 38, 174, 'btn_menu', function () {
			hide_to_state(game, 'menu');
		}));
		this.add(buttons);

		bestScore.value = bestScore_;
		game.add.tween(title).from({ y : 10, alpha : 0}, 0.2 * Phaser.Timer.SECOND, undefined, true, 0.5 * Phaser.Timer.SECOND);
		game.add.tween(result).from({ y : 200 }, 0.4 * Phaser.Timer.SECOND, undefined, true, 0.8 * Phaser.Timer.SECOND);
		game.add.tween(score).to({ value : score_}, 0.5 * Phaser.Timer.SECOND, undefined, true, 1.5 * Phaser.Timer.SECOND);
		game.add.tween(buttons).from({ alpha : 0 }, 0.2 * Phaser.Timer.SECOND, undefined, true, 1.5 * Phaser.Timer.SECOND);
	}
	GameOver.prototype = Object.create(Phaser.Group.prototype);
	GameOver.prototype.constructor = GameOver;

	function PreloadState(game) {
		this.preload = function () {
			game.load.atlasJSONHash('gui', 'gui.png', 'gui.json');
		}

		this.create = function () {
			game.plugins.add(FPSPlugin);
			game.plugins.add(VSyncPlugin);
			game.state.start('menu');
		}
	}

	function MenuState(game) {
		this.create = function () {
			game.add.image(22, 37, 'gui', 'logo.png');
			game.add.existing(new Bird(game, birdType, 75, 100));

			add_button(game, 38, 137, 'btn_play', function () {
				hide_to_state(game, 'game');
			});
			add_button(game, 38, 174, 'btn_top', function () {
				game.state.start('top');
			});
		}
	}

	function GameState(game) {
		var isWallStarted;
		var bird, ground, walls, score;
		var sc;

		function emitWall() {
			if (!isWallStarted || !bird.alive) {
				return;
			}

			var maxX = -1;
			walls.forEachExists(function (w) {
				if (w.getX() > maxX) {
					maxX = w.getX();
				}
			});

			if (maxX == -1) {
				maxX = WIDTH - WALL_DIST;
			}

			if (maxX + WALL_DIST <= WIDTH) {
				var wallY = game.rnd.integerInRange(HOLE_RANGE[0], HOLE_RANGE[1]);
	 			var wall = walls.getFirstExists(false);
	 			if (!wall) {
	 				wall = new Wall(game);
	 				walls.add(wall);
	 			}
	 			wall.reset(maxX + WALL_DIST, wallY);
			}
		}

		function death() {
			if (bird.alive) {
				bird.alive = false;
				isWallStarted = false;

				walls.callAll('stop');
				game.tweens.removeFrom(ground);
				// ground.stopScroll();

				var blink = create_color_box(game, 0xffffff);
				blink.alpha = 0;

				bird.bodyGravity = false;
				game.add.tween(blink).to({alpha : 0.9}, 0.2 * Phaser.Timer.SECOND, undefined, true, 0, 0, true).onComplete.addOnce(function () {
					score.visible = false;
					bird.bodyGravity = true;
					bird.die();

					blink.destroy();
					blink = null;

					game.add.existing(new GameOver(game, sc, 110));
				});
			}
		}

		this.create = function () {
    		game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);
    		var flapKey = this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

			game.add.image(0, HEIGHT - GR - game.cache.getFrameByName('gui', 'bg.png').height, 'gui', 'bg.png');
			walls = game.add.group();
			ground = game.add.image(0, HEIGHT - GR, 'gui', 'ground.png');

			bird = game.add.existing(new Bird(game, birdType, 45, 125));

			var demoTween = game.add.tween(bird).to({ y : 125 + 3}, 0.4 * Phaser.Timer.SECOND, undefined, true, 0, -1, true);

			var help = game.add.group();
			help.add(game.add.image(24, 53, 'gui', 'txt_ready.png'));
			help.add(game.add.image(75, 114, 'gui', 'gray_bird.png')).anchor.setTo(0.5, 0.5);
			help.add(game.add.image(75, 126, 'gui', 'txt_taptap.png')).anchor.setTo(0.5, 0);

			for (var i = 0; i < 3; i++) {				
				walls.add(new Wall(game));
			}

			score = game.add.existing(new Score(game, 75, 10, false, 'center'));

			var isStarted = false;
			isWallStarted = false;
			sc = 0;
			score.value = 0;

	   		function start() {
	    		if (isStarted) {
	    			return;
	    		}
				isStarted = true;

				demoTween.stop();
				demoTween = null;

				game.add.tween(help)
					.to({ alpha : 0}, 0.3 * Phaser.Timer.SECOND)
					.start()
					.onComplete.addOnce(function () {
			    		help.destroy();
			    		help = null;
		    		});

				bird.hatch();
				bird.flap();

	    		flapKey.onDown.add(bird.flap, bird);
	    		this.input.onDown.add(bird.flap, bird);

	    		game.time.events.add(1.25 * Phaser.Timer.SECOND, function () {
	    			isWallStarted = true;
	    			emitWall();
	    		});
			}

    		flapKey.onDown.addOnce(start, this);
    		this.input.onDown.addOnce(start, this);
    	}

		this.update = function () {

			if (bird.y + BIRD_R >= ground.y) {
				bird.allowGravity = false;
				bird.x = bird.x;
				bird.y = ground.y - BIRD_R;
				bird.bodyGravity = false;
				death();
			}

			if (bird.alive) {
				var e = game.time.elapsed / 1000;
		        ground.x += -SPEED * e;
		        while (ground.x <= -150) {
		        	ground.x += 150;
		        }
			}

			if (!bird.alive) {
				return;
			}

			emitWall();

			walls.forEach(function (wall) {				
				if (!wall.scored && wall.isScored(bird)) {
					wall.scored = true;
					sc += 1;
					score.value = sc;
				}

				if (wall.isCollide(bird)) {
					death();
				}
			}, this, true);				
		}

		this.shutdown = function() {  
  			game.input.keyboard.removeKey(Phaser.Keyboard.SPACEBAR);
		}
	}

	function FPSPlugin(game) {
		var fpsSpan = document.getElementById('fps');
		var gameDiv = document.getElementById('game');
		var lastHTML;

		this.update = function () {
			var r = (game.renderType == Phaser.WEBGL) ? "WebGL" : "Canvas";
			var html = '' + game.time.fps + ' ' + gameDiv.clientWidth + 'x' + gameDiv.clientHeight + ' ' + game.renderer.resolution + ' ' + r + ' ' + VERSION;
			if (fpsSpan && lastHTML != html) {
				fpsSpan.innerHTML = html;
				lastHTML = html;
			}
		}
	}

	function VSyncPlugin(game) {
		var vsync = new Phaser.Sprite(game, WIDTH - 10, 0, 'gui');
		vsync.frameName = 'vsync0.png';
		game.stage.addChild(vsync)
		var frame = 0;

		this.update = function () {
			frame += 1;
			if (game.stage.getChildIndex(vsync) != game.stage.children.length - 1) {
				game.stage.setChildIndex(vsync, game.stage.children.length - 1);
			}
			vsync.frameName = (frame & 1) ? 'vsync0.png' : 'vsync1.png';
		}
	}
	
	(function () {
		var game = new Phaser.Game(WIDTH, HEIGHT, Phaser.AUTO, 'game', null, false, false, null);
		game.forceSingleUpdate = true;
		game.config.enableDebug = false;
		game.device.whenReady(function () {		
			game.stage.backgroundColor = '#95d5c4';
			game.stage.disableVisibilityChange = true;
			game.stage.smoothed = false;

			game.time.advancedTiming = true;

			game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
			game.scale.pageAlignHorizontally = true;
			var lastScale = 0;
			game.scale.setResizeCallback(function (scale, parentBounds) {
				var s = Math.min(parentBounds.width / WIDTH, parentBounds.height / HEIGHT);
				var HDPI = (window.devicePixelRatio || 1);
				if (HDPI * s != lastScale) {
					lastScale = HDPI * s;
					if (game.renderType == Phaser.WEBGL) {
						game.renderer.resolution = HDPI * s;
					} else {
						game.renderer.resolution = HDPI;
					}
					game.renderer.resize(WIDTH, HEIGHT)
					scale.setUserScale(s, s);
				}
			});		
			game.scale.refresh();
		});

		game.state.add('preload', PreloadState, true);
		game.state.add('menu', MenuState);
		game.state.add('game', GameState);
	})()
}
