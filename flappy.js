/*global PIXI, Phaser */

var VERSION = 79;

PIXI.scaleModes.DEFAULT = PIXI.scaleModes.NEAREST;

function init() {
    'use strict';

    var COLLIDE_ENABLED = true,

        WIDTH = 150,
        HEIGHT = 224,
        GR = 24,

        SPEED = 60,
        GRAVITY = 600,
        FLAP_VEL = 180,
        HOLE_SIZE = 48,
        WALL_DIST = 79,
        HOLE_RANGE = [24, 128],
        BIRD_R = 6,

        SEC = Phaser.Timer.SECOND,
        FLAP_ANGLE = -45,
        FLAP_TIME = 0.05 * SEC,

        REAL2GOLD = [50, 275, 1200],
        TOUR_PRICE = 1,
        BIRD_PRICES = [0, 250, 250],
        RISE_PRICE = 250,

        MAX_FREE_GOLD_VALUE = 50,
        birdType = 0,
        freeGold = 35,
        paidGold = 0,
        bestScore = 110,
        onGoldChanged = new Phaser.Signal();

    function assert(condition, message) {
        if (!condition) {
            message = message || "Assertion failed";
            if (Error !== undefined) {
                throw new Error(message);
            }
            throw message;
        }
        return condition;
    }

    function purchase(game, amount, cb) {
        if (freeGold + paidGold >= amount) {
            var freeDec = Math.min(freeGold, amount);
            freeGold -= freeDec;
            paidGold -= amount - freeDec;
            onGoldChanged.dispatch(freeGold, paidGold);
            cb(true);
        } else {
            game.state.start('store');
            cb(false);
        }
    }

    function purchaseGold(realItem, cb) {
        assert(REAL2GOLD[realItem]);
        paidGold += REAL2GOLD[realItem];
        onGoldChanged.dispatch(freeGold, paidGold);
        cb(true);
    }

    function registerFonts(game) {
        function registerFont(game, key, atlas, map) {
            var info = assert(map.info, 'No info for font ' + key),
                data = {};

            data.chars = {};
            data.font = info.face;
            data.size = info.size;
            data.lineHeight = info.lineHeight + info.ySpacing;

            for (var k in map) {
                if (!map.hasOwnProperty(k) || k === 'info') {
                    continue;
                }

                assert(k.length === 1, 'Unknown char ' + k);

                var code = k.charCodeAt(0);
                var name = map[k];
                var frame = game.cache.getFrameByName(atlas, name);
                var texture = PIXI.TextureCache[frame.uuid];

                data.chars[code] = {
                    xOffset: 0,
                    yOffset: 0,
                    xAdvance: texture.frame.width + info.xSpacing,
                    kerning: {},
                    texture: new PIXI.Texture(PIXI.BaseTextureCache[atlas], texture.frame)
                }
            }

            PIXI.BitmapText.fonts[key] = data;
            game.cache._bitmapFont[key] = PIXI.BitmapText.fonts[key];
        }

        registerFont(game, 'bank', 'gui', {
            'info' : {
                face : 'bank',
                size : 5,
                lineHeight: 5,
                xSpacing : 1,
                ySpacing : 1
            },
            '0' : 'font_h0.png',
            '1' : 'font_h1.png',
            '2' : 'font_h2.png',
            '3' : 'font_h3.png',
            '4' : 'font_h4.png',
            '5' : 'font_h5.png',
            '6' : 'font_h6.png',
            '7' : 'font_h7.png',
            '8' : 'font_h8.png',
            '9' : 'font_h9.png'
        });

        registerFont(game, 'bank_add', 'gui', {
            'info' : {
                face : 'bank_add',
                size : 7,
                lineHeight: 7,
                xSpacing : -1,
                ySpacing : 1
            },
            '0' : 'font_ba0.png',
            '1' : 'font_ba1.png',
            '2' : 'font_ba2.png',
            '3' : 'font_ba3.png',
            '4' : 'font_ba4.png',
            '5' : 'font_ba5.png',
            '6' : 'font_ba6.png',
            '7' : 'font_ba7.png',
            '8' : 'font_ba8.png',
            '9' : 'font_ba9.png'
        });

        registerFont(game, 'bank_time', 'gui', {
            'info' : {
                face : 'bank_time',
                size : 5,
                lineHeight: 5,
                xSpacing : 1,
                ySpacing : 1
            },
            '0' : 'font_bt0.png',
            '1' : 'font_bt1.png',
            '2' : 'font_bt2.png',
            '3' : 'font_bt3.png',
            '4' : 'font_bt4.png',
            '5' : 'font_bt5.png',
            '6' : 'font_bt6.png',
            '7' : 'font_bt7.png',
            '8' : 'font_bt8.png',
            '9' : 'font_bt9.png',
            ':' : 'font_btpt.png'
        });

        registerFont(game, 'score', 'gui', {
            'info' : {
                face : 'score',
                size : 11,
                lineHeight: 11,
                xSpacing : 1,
                ySpacing : 1
            },
            '0' : 'font_sc0.png',
            '1' : 'font_sc1.png',
            '2' : 'font_sc2.png',
            '3' : 'font_sc3.png',
            '4' : 'font_sc4.png',
            '5' : 'font_sc5.png',
            '6' : 'font_sc6.png',
            '7' : 'font_sc7.png',
            '8' : 'font_sc8.png',
            '9' : 'font_sc9.png'
        });

        registerFont(game, 'score_result', 'gui', {
            'info' : {
                face : 'score_result',
                size : 8,
                lineHeight: 8,
                xSpacing : 1,
                ySpacing : 1
            },
            '0' : 'font_r0.png',
            '1' : 'font_r1.png',
            '2' : 'font_r2.png',
            '3' : 'font_r3.png',
            '4' : 'font_r4.png',
            '5' : 'font_r5.png',
            '6' : 'font_r6.png',
            '7' : 'font_r7.png',
            '8' : 'font_r8.png',
            '9' : 'font_r9.png'
        });
    }

    function add_button(game, x, y, name, cb) {
        var btn = game.add.button(x, y, 'gui', function (_, pointer, isOver) {
            if (isOver) {
                cb();
            }
        }, null, name + '_over.png', name + '_out.png', name + '_down.png');
        btn.anchor.setTo(0, 0);
        return btn;
    }

    function add_color_box(game, color) {
        var box = game.add.graphics(0, 0);
        box.beginFill(color, 1.0);
        box.drawRect(0, 0, WIDTH, HEIGHT);
        box.endFill();
        return box;
    }

    function hide_to_state(game, name) {
        var blink = add_color_box(game, 0);
        blink.alpha = 0;

        game.add.tween(blink).to({alpha : 1}, 0.2 * SEC, undefined, true).onComplete.addOnce(function () {
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
            Phaser.Group.prototype.update.call(this);

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

        this.setType = function (type) {

        }

        this.update = function () {
            var e = game.time.elapsed / 1000;
            if (this.bodyGravity) {
                this.y += velocityY * e + GRAVITY * e * e / 2;
                velocityY += GRAVITY * e;
            }
            if(this.alive && this.bodyGravity) {
                if (velocityY <= 0) {
                    this.angle = FLAP_ANGLE * Math.min(1.0, -velocityY / 400);
                } else {
                    this.angle = 90 * Math.min(1.0, velocityY / 400);
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
            game.add.tween(this).to({ angle : 90 }, 0.15 * SEC).start();
            this.alive = false;
        }
    }
    Bird.prototype = Object.create(Phaser.Sprite.prototype);
    Bird.prototype.constructor = Bird;

    var AlignText = function (game, x, y, font, size, align) {
        Phaser.Group.call(this, game);

        this.x = x;
        this.y = y;

        var txt = game.add.bitmapText(0, 0, font, '', size);
        this.add(txt);

        var val = 0;
        var text = undefined;
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

        Object.defineProperty(this, 'text', {
            get: function () {
                return text;
            },

            set: function (value) {
                if (text != value) {
                    text = value;
                    needUpdate = true;
                }
            }
        });

        this.update = function () {
            Phaser.Group.prototype.update.call(this);

            if (!needUpdate) return;
            needUpdate = false;

            txt.text = text ? text : ('' + Math.round(val));
            txt.updateText();

            if (align == 'center') {
                txt.x = -Math.floor(txt.textWidth / 2);
            } else if (align == 'left') {
                txt.x = 0;
            } else if (align == 'right') {
                txt.x = -Math.floor(txt.textWidth);
            }
        }
    }
    AlignText.prototype = Object.create(Phaser.Group.prototype);
    AlignText.prototype.constructor = AlignText;

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
        var score = result.add(new AlignText(game, 101, 36, 'score_result', 8, 'right'));
        var bestScore = result.add(new AlignText(game, 101, 50, 'score_result', 8,'right'));
        result.add(add_button(game, 12, 67, 'btn_share', function () {
            // game.state.start('menu');
        }));
        this.add(result);

        var buttons = game.add.group();
        buttons.add(add_button(game, 38, 137, 'btn_continue', function () {
            purchase(game, RISE_PRICE, function (result) {
                if (result) {
                    console.warn('continue');
                }
            });
        }));
        buttons.add(add_button(game, 38, 174, 'btn_menu', function () {
            hide_to_state(game, 'menu');
        }));
        this.add(buttons);

        bestScore.value = bestScore_;
        game.add.tween(title).from({ y : 10, alpha : 0}, 0.2 * SEC, undefined, true, 0.5 * SEC);
        game.add.tween(result).from({ y : HEIGHT }, 0.4 * SEC, undefined, true, 0.8 * SEC);
        game.add.tween(score).to({ value : score_}, 0.5 * SEC, undefined, true, 1.5 * SEC);
        game.add.tween(buttons).from({ alpha : 0 }, 0.2 * SEC, undefined, true, 1.5 * SEC);
    }
    GameOver.prototype = Object.create(Phaser.Group.prototype);
    GameOver.prototype.constructor = GameOver;

    var Bank = function (game) {
        Phaser.Group.call(this, game);

        this.add(game.add.image(0, 0, 'gui', 'bank_bg.png'));
        var progress = this.add(game.add.image(19, 6, 'gui', 'bank_p.png'));
        progress.crop(new Phaser.Rectangle(0, 0, 36, 6));
        this.add(game.add.image(1, 1, 'gui', 'bank_top.png'));

        this.add(add_button(game, 63, 2, 'btn_plus', function () {
            game.state.start('store');
        }));

        var balance = new AlignText(game, 12, 5, 'bank', 5, 'center');
        this.add(balance);

        var time = new AlignText(game, 37, 15, 'bank_time', 5, 'center');
        this.add(time);
        time.text = '05:21';

        var add = new AlignText(game, 78, 6, 'bank_add', 7, 'left');
        this.add(add);

        var _free = freeGold, _paid = paidGold, needUpdate = true;

        onGoldChanged.add(function (freeGold, paidGold) {
            game.add.tween(this).to({ freeGold : freeGold, paidGold : paidGold }, 0.5 * SEC, undefined, true);
        }, this);

        Object.defineProperty(this, 'freeGold', {
            get: function () {
                return _free;
            },

            set: function (value) {
                if (_free != value) {
                    _free = Math.round(value);
                    needUpdate = true;
                }
            }
        });

        Object.defineProperty(this, 'paidGold', {
            get: function () {
                return _paid;
            },

            set: function (value) {
                if (_paid != value) {
                    _paid = Math.round(value);
                    needUpdate = true;
                }
            }
        });

        this.update = function () {
            Phaser.Group.prototype.update.call(this);

            if (!needUpdate) return;
            needUpdate = false;

            var v = _free / MAX_FREE_GOLD_VALUE;
            progress.cropRect.x = Math.round(36 - 36 * v);
            progress.cropRect.width = 36 - progress.cropRect.x;
            progress.updateCrop();

            balance.value = _free;
            add.value = _paid;
            add.visible = (_paid > 0);
        }

        this.destroy = function () {
            Phaser.Group.prototype.destroy.call(this);
            onGoldChanged.removeAll(this);
        }
    }
    Bank.prototype = Object.create(Phaser.Group.prototype);
    Bank.prototype.constructor = Bank;

    function PreloadState(game) {
        this.preload = function () {
            game.load.atlasJSONHash('gui', 'gui.png', 'gui.json');
        }

        this.create = function () {
            game.plugins.add(FPSPlugin);
            game.plugins.add(VSyncPlugin);
            registerFonts(game);

            game.state.start('menu');
        }
    }

    function MenuState(game) {
        this.create = function () {
            var bird, play, lock, buy, bank;

            game.add.image(22, 37, 'gui', 'logo.png');
            bank = new Bank(game);
            bank.x = 6;
            bank.y = 5;
            game.add.existing(bank);
            lock = game.add.image(69, 114, 'gui', 'ico_lock.png');

            add_button(game, 21, 88, 'btn_left', function () {
                birdType -= 1;
                if (birdType < 0) {
                    birdType = BIRD_PRICES.length - 1;
                }
                updateBird();
            });
            add_button(game, 117, 88, 'btn_right', function () {
                birdType += 1;
                if (birdType >= BIRD_PRICES.length) {
                    birdType = 0;
                }
                updateBird();
            });
            play = add_button(game, 38, 137, 'btn_play', function () {
                play.inputEnabled = false;
                purchase(game, TOUR_PRICE, function (result) {
                    play.inputEnabled = true;
                    if (result) {
                        hide_to_state(game, 'game');
                    }
                });
            });
            buy = add_button(game, 38, 137, 'btn_buy', function () {
                assert(BIRD_PRICES[birdType] > 0);
                buy.inputEnabled = false;
                purchase(game, BIRD_PRICES[birdType], function (result) {
                    buy.inputEnabled = true;
                    if (result) {
                        BIRD_PRICES[birdType] = 0;
                        updateBird();
                    }
                });
            });
            add_button(game, 38, 174, 'btn_top', function () {
                game.state.start('top');
            });

            function updateBird() {
                game.world.remove(bird);
                bird = new Bird(game, birdType, 75, 100);
                game.add.existing(bird);
                var p = (BIRD_PRICES[birdType] == 0);
                play.visible = p;
                buy.visible = lock.visible = !p;
            }

            updateBird();
        }
    }

    function StoreState(game) {
        this.create = function () {
            game.add.image(47, 13, 'gui', 'txt_store.png');

            game.add.existing(new AlignText(game, 41, 50, 'bank_add', 7, 'right')).text = '1200';
            game.add.image(45, 46, 'gui', 'ico_heart.png');
            add_button(game, 73, 39, 'btn_buy1', function () {
                purchaseGold(2, function (result) {
                    if (result) {
                        game.state.start('store_back');
                    }
                });
            });

            game.add.existing(new AlignText(game, 41, 93, 'bank_add', 7, 'right')).text = '275';
            game.add.image(45, 89, 'gui', 'ico_heart.png');
            add_button(game, 73, 82, 'btn_buy2', function () {
                purchaseGold(1, function (result) {
                    if (result) {
                        game.state.start('store_back');
                    }
                });
            });

            game.add.existing(new AlignText(game, 41, 135, 'bank_add', 7, 'right')).text = '50';
            game.add.image(45, 131, 'gui', 'ico_heart.png');
            add_button(game, 73, 124, 'btn_buy3', function () {
                purchaseGold(0, function (result) {
                    if (result) {
                        game.state.start('store_back');
                    }
                });
            });

            add_button(game, 38, 174, 'btn_menu', function () {
                game.state.start('store_back');
            })
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

                var blink = add_color_box(game, 0xffffff);
                blink.alpha = 0;

                bird.bodyGravity = false;
                game.add.tween(blink).to({alpha : 0.9}, 0.2 * SEC, undefined, true, 0, 0, true).onComplete.addOnce(function () {
                    score.visible = false;
                    bird.bodyGravity = true;
                    bird.die();

                    blink.destroy();
                    blink = null;

                    game.add.existing(new GameOver(game, sc, bestScore));
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

            var demoTween = game.add.tween(bird).to({ y : 125 + 3}, 0.4 * SEC, undefined, true, 0, -1, true);

            var help = game.add.group();
            help.add(game.add.image(24, 53, 'gui', 'txt_ready.png'));
            help.add(game.add.image(75, 114, 'gui', 'gray_bird.png')).anchor.setTo(0.5, 0.5);
            help.add(game.add.image(75, 126, 'gui', 'txt_taptap.png')).anchor.setTo(0.5, 0);

            for (var i = 0; i < 3; i++) {
                walls.add(new Wall(game));
            }

            score = new AlignText(game, 75, 10, 'score', 11, 'center');

            var isStarted = false;
            isWallStarted = false;
            sc = 0;
            score.value = sc;

            function start() {
                if (isStarted) {
                    return;
                }
                isStarted = true;

                demoTween.stop();
                demoTween = null;

                game.add.tween(help)
                    .to({ alpha : 0}, 0.3 * SEC)
                    .start()
                    .onComplete.addOnce(function () {
                        help.destroy();
                        help = null;
                    });

                bird.hatch();
                bird.flap();

                flapKey.onDown.add(bird.flap, bird);
                this.input.onDown.add(bird.flap, bird);

                game.time.events.add(1.25 * SEC, function () {
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
        game.state.add('store', StoreState);
        game.state.add('game', GameState);
    })()
}
