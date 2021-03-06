/*global PIXI, Phaser */

var VERSION = 193;

PIXI.scaleModes.DEFAULT = PIXI.scaleModes.NEAREST;
PIXI.CanvasTinter.convertTintToImage = true;

function init() {
    'use strict';

    var SERVER = 'http://flappyok.appspot.com/',

        WIDTH = 150,
        HEIGHT = 224,
        GR = 24,
        BG_COLOR = 0x95d5c4,
        OK_WIDGET_WIDTH = 32,
        HDPI = (window.devicePixelRatio || 1),
        globalScale = 1,

        COLLIDE_ENABLED = true,
        DEBUG = false,

        SPEED = 60,
        GRAVITY = 600,
        FLAP_VEL = 180,
        HOLE_SIZE = 48,
        WALL_DIST = 79,
        HOLE_RANGE = [24, 128],
        BIRD_R = 6,

        SEC = Phaser.Timer.SECOND,
        FLAP_ANGLE = -15,
        FLAP_TIME = 0.05 * SEC,

        TOUR_PRICE = 1,
        RISE_PRICE = 250,

        MAX_HEALTH_VALUE = 20,
        HEALTH_UPDATE_SEC = 5 * 60,
        birdType = 0,
        onHealthChanged = new Phaser.Signal(),
        onResized = new Phaser.Signal(),

        processPurchase,
        PRODUCTS = {
            'health' : { name : 'Восстановить здоровье', price : 10, code : 'health' },
            'bird1' : { name : 'Попугай', price : 50, code : 'bird1' },
            'bird2' : { name : 'Снегирь', price : 100, code : 'bird2' }
        },

        fsig,
        viewerId,
        viewerName,
        friendIds,
        unlocked,
        topResults,
        health,
        next_health_update;

    var GAME_STATE_HELP = 'help',
        GAME_STATE_PREFLY = 'prefly',
        GAME_STATE_FLY = 'fly',
        GAME_STATE_FALL = 'fall',
        GAME_STATE_DEAD = 'dead',
        gameState;

    function serverCall(method, params, cb) {
        var p = [];
        for (var k in params) {
            if (params.hasOwnProperty(k)) {
                p.push(k + '=' + params[k]);
            }
        }
        if (fsig) {
            p.push('fsig=' + fsig);
        }
        if (viewerId) {
            p.push('uid=' + viewerId);
        }
        p = p.join('&');

        var http = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");

        http.onreadystatechange = function() {
            if (http.readyState == 4) {
                if (http.status == 200) {
                    var obj = JSON.parse(http.responseText);
                    if (obj && obj.status === 'ok') {
                        cb(obj);
                    }
                }
            }
        }

        http.open('POST', SERVER + method, true);
        http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        http.send(p);
    }

    function time() {
        return new Date() / 1000;
    }

    function assert(game, condition, message) {
        if (!condition) {
            message = message || "Assertion failed";
            if (game) {
                game.state.start('error', true, false, 'Произошла ошибка. Обновите страницу.');
            }
            if (Error !== undefined) {
                throw new Error(message);
            }
            throw message;
        }
        return condition;
    }

    function registerFonts(game) {
        [{
            atlas: 'gui',
            face: 'bank',
            size: 5,
            lineHeight: 5,
            xSpacing: 1,
            ySpacing: 1,
            prefix: 'font_h',
            chars: '0123456789'
        },
        {
            atlas: 'gui',
            face: 'bank_add',
            size: 7,
            lineHeight: 7,
            xSpacing: -1,
            ySpacing: 1,
            prefix: 'font_ba',
            chars: '0123456789'
        },
        {
            atlas: 'gui',
            face : 'bank_time',
            size : 5,
            lineHeight: 5,
            xSpacing : 1,
            ySpacing : 1,
            prefix: 'font_bt',
            chars: '0123456789:'
        },
        {
            atlas: 'gui',
            face: 'score',
            size: 11,
            lineHeight: 11,
            xSpacing: 1,
            ySpacing: 1,
            prefix: 'font_sc',
            chars: '0123456789'
        },
        {
            atlas: 'gui',
            face: 'score_result',
            size: 8,
            lineHeight: 8,
            xSpacing: 1,
            ySpacing: 1,
            prefix: 'font_r',
            chars: '0123456789'
        },
        {
            atlas: 'gui',
            face : 'top',
            size : 8,
            lineHeight: 8,
            xSpacing : 1,
            ySpacing : 0,
            prefix: 'font_res_',
            chars: ' _,!?."()[]{}§@*/&#%`^+±<=>|~$0123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЮЯ'
        }].map(function (info) {
            var REPL = {
                ':' : 'col',
                '/' : 'slash'
            }

            var data = {};

            data.chars = {};
            data.font = info.face;
            data.size = info.size;
            data.lineHeight = info.lineHeight + info.ySpacing;


            for (var i = 0; i < info.chars.length; i++) {
                var k = info.chars[i];
                var code = k.charCodeAt(0);
                var name = info.prefix + (REPL[k] || k) + '.png';
                var frame = game.cache.getFrameByName(info.atlas, name);
                var texture = PIXI.TextureCache[frame.uuid];

                data.chars[code] = {
                    xOffset: 0,
                    yOffset: 0,
                    xAdvance: texture.frame.width + info.xSpacing,
                    kerning: {},
                    texture: new PIXI.Texture(PIXI.BaseTextureCache[info.atlas], texture.frame)
                }
            }

            PIXI.BitmapText.fonts[info.face] = data;
            game.cache._bitmapFont[info.face] = PIXI.BitmapText.fonts[info.face];
        });
    }

    function add_button(game, x, y, name, cb) {
        var btn = game.add.button(x, y, 'gui', function (_, pointer, isOver) {
            if (isOver) {
                game.add.audio('click').play('');
                cb();
            }
        }, null, name + '_over.png', name + '_out.png', name + '_down.png');
        btn.anchor.setTo(0, 0);
        return btn;
    }

    function add_color_box(game, color) {
        var box = game.add.graphics(0, 0);
        box.beginFill(color, 1.0);
        box.drawRect(0, 0, game.width, game.height);
        box.endFill();
        return box;
    }

    function hide_to_state(game, cb) {
        var blink = add_color_box(game, 0);
        blink.alpha = 0;

        game.add.tween(blink).to({alpha : 1}, 0.2 * SEC, undefined, true).onComplete.addOnce(function () {
            cb();
        });
        return blink;
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

        this.updatePhys = function () {
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
        this.animations.add('demo', ['bird' + type + '_1.png', 'bird' + type + '_2.png', 'bird' + type + '_3.png', 'bird' + type + '_2.png'], 10, true);
        this.animations.add('fly', ['bird' + type + '_1.png', 'bird' + type + '_2.png', 'bird' + type + '_3.png', 'bird' + type + '_2.png'], 10, true);
        this.animations.add('notfly', ['bird' + type + '_2.png'], 1, true);
        this.animations.add('dead', ['bird' + type + '_2.png'], 1, true);
        this.animations.play('demo');

        this.smoothed = false;

        this.bodyGravity = false;
        this.velocityY = 0;

        this.hatch = function () {
            this.bodyGravity = true;
            this.animations.stop();
        }

        this.flap = function () {
            if (gameState === GAME_STATE_FLY || gameState === GAME_STATE_PREFLY) {
                this.velocityY = -FLAP_VEL;
                game.add.audio('flap').play('');
            }
        }

        this.die = function () {
            this.animations.stop();
            this.animations.play('dead');
            this.velocityY = Math.max(0, this.velocityY);
        }

        this.updateAngle = function (e) {
            if (this.velocityY <= FLAP_VEL - 40) {
                this.angle = FLAP_ANGLE;
                this.animations.play('fly');
            } else {
                this.angle = FLAP_ANGLE + (90 - FLAP_ANGLE) * Math.min(1.0, (this.velocityY - FLAP_VEL + 40) / 300);
                this.animations.play('notfly');
            }
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
        var _inputEnbaled = false;
        var _inputRect;

        Object.defineProperty(this, 'left', {
            get: function () {
                if (needUpdate) {
                    this.update();
                }
                return txt.x;
            }
        });

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

        Object.defineProperty(this, 'tint', {
            get: function () {
                return txt.tint;
            },

            set: function (value) {
                txt.tint = value;
            }
        });

        this.update = function () {
            Phaser.Group.prototype.update.call(this);

            if (!needUpdate) return;
            needUpdate = false;

            txt.text = text ? text : ('' + Math.round(val));
            txt.updateText();

            if (align == 'center') {
                txt.x = -Math.ceil(txt.textWidth / 2);
            } else if (align == 'left') {
                txt.x = 0;
            } else if (align == 'right') {
                txt.x = -Math.floor(txt.textWidth);
            }
        }
    }
    AlignText.prototype = Object.create(Phaser.Group.prototype);
    AlignText.prototype.constructor = AlignText;

    var GameOver = function (game, score_, bestScore_, isNew_, medal_) {
        Phaser.Group.call(this, game);
        var title = this.add(game.add.image(37, 13, 'gui', 'txt_game_over.png'));

        var result = game.add.group();
        result.x = 19;
        result.y = 39;
        result.add(game.add.image(0, 0, 'gui', 'result_bg_tmp.png'));
        result.add(game.add.image(14, 13, 'gui', 'medal_' + medal_ + '.png'));
        result.add(game.add.image(77, 14, 'gui', 'txt_points.png'));
        result.add(game.add.image(63, 38, 'gui', 'txt_best.png'));
        var score = result.add(new AlignText(game, 100, 23, 'score_result', 8, 'right'));
        var bestScore = result.add(new AlignText(game, 100, 49, 'score_result', 8,'right'));
        bestScore.value = bestScore_;
        if (isNew_) {
            result.add(game.add.image(bestScore.x + bestScore.left - 23 - 2, 48, 'gui', 'txt_new.png'));
        }
        // result.add(add_button(game, 12, 67, 'btn_share', function () {
        //     // TODO: game.state.start('menu');
        // }));
        this.add(result);

        var buttons = game.add.group();
        buttons.add(add_button(game, 38, 137, 'btn_menu', function () {
            hide_to_state(game, function () { game.state.start('menu'); });
        }));
        this.add(buttons);

        game.add.tween(title).from({ y : 10, alpha : 0}, 0.2 * SEC, undefined, true, 0.5 * SEC);
        game.add.tween(result).from({ y : game.height }, 0.4 * SEC, undefined, true, 0.8 * SEC);
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

        var balance = new AlignText(game, 12, 5, 'bank', 5, 'center');
        this.add(balance);

        var ttime = new AlignText(game, 37, 15, 'bank_time', 5, 'center');
        this.add(ttime);

        var _health = health, _time = next_health_update, needUpdateHealth = true, needUpdateTime = true;

        onHealthChanged.add(function (health, next_health_update) {
            game.add.tween(this).to({ health : health }, 0.5 * SEC, undefined, true);
            this.time = next_health_update;
        }, this);

        Object.defineProperty(this, 'time', {
            get: function () {
                return _time;
            },

            set: function (value) {
                value = Math.round(value);
                if (_time != value) {
                    _time = value;
                    needUpdateTime = true;
                }
            }
        });

        Object.defineProperty(this, 'health', {
            get: function () {
                return _health;
            },

            set: function (value) {
                value = Math.round(value);
                if (_health != value) {
                    _health = value;
                    needUpdateHealth = true;
                }
            }
        });

        this.update = function () {
            Phaser.Group.prototype.update.call(this);

            if (needUpdateHealth) {
                needUpdateHealth = false;

                var v = Math.min(1.0, _health / MAX_HEALTH_VALUE);
                progress.cropRect.x = Math.round(36 - 36 * v);
                progress.cropRect.width = 36 - progress.cropRect.x;
                progress.updateCrop();

                balance.value = _health;
                balance.update();
            }

            if (health < MAX_HEALTH_VALUE) {
                var up = _time - time()
                var min = '' + Math.floor(up / 60);
                var sec = '' + Math.floor(up % 60);
                if (sec.length < 2) sec = '0' + sec;
                ttime.text = min + ':' + sec;
                ttime.visible = true;
            } else {
                ttime.visible = false;
            }
        }

        this.destroy = function () {
            Phaser.Group.prototype.destroy.call(this);
            onHealthChanged.removeAll(this);
        }
    }
    Bank.prototype = Object.create(Phaser.Group.prototype);
    Bank.prototype.constructor = Bank;

    var PreloadState = function (game) {
        var created = false, friendsGot = false, logged = false;

        this.preload = function () {
            game.load.atlasJSONHash('gui', 'gui.png?' + VERSION, 'gui.json?' + VERSION);
            game.load.audio('click', ['sound/click.wav']);
            game.load.audio('flap', ['sound/flap.wav']);
            game.load.audio('point', ['sound/point.wav']);
            game.load.audio('punch', ['sound/punch.wav']);

            var okParams = FAPI.Util.getRequestParameters();
            viewerId = okParams['logged_user_id'];

            FAPI.Client.call({
                method: 'users.getCurrentUser',
                fields: 'NAME'
            }, function (status, data, err) {
                if (status === 'ok') {
                    assert(game, viewerId === data.uid);
                    viewerName = data.name;

                    okParams['name'] = viewerName;
                    serverCall('login', okParams, function (obj) {
                        fsig = obj.fsig;
                        if (obj.name) {
                            viewerName = obj.name;
                        }

                        unlocked = obj.unlocked;
                        health = obj.health;
                        next_health_update = obj.next_health_update + time();

                        logged = true;
                        checkInit();
                    });
                } else {
                    assert(game, false, 'user.getCurrentUser failed');
                }
            });
            FAPI.Client.call({
                method: 'friends.getAppUsers'
            }, function (status, data, err) {
                if (status === 'ok') {
                    friendIds = data.uids;
                } else {
                    friendsIds = [];
                }
                friendsGot = true;
                checkInit();
            });
            FAPI.Client.call({
                method: 'widget.getWidgetContent',
                wid: 'mobile-header-small',
                style: okParams['header_widget']
            }, function (status, data, err) {
                if (status === 'ok') {
                    var d = window.atob(data);
                    var w = document.getElementById('okwidget');
                    w.innerHTML = d;
                }
            });

            processPurchase = function (product) {
                assert(game, PRODUCTS[product]);

                var params = {
                    application_key : okParams.application_key,
                    session_key : okParams.session_key,
                    name : PRODUCTS[product].name,
                    price : PRODUCTS[product].price,
                    code : PRODUCTS[product].code
                }
                params.sig = FAPI.Util.calcSignature(params, okParams.session_secret_key)

                var form = document.createElement('form');
                form.method = 'GET';
                form.action = 'http://m.odnoklassniki.ru/api/show_payment';
                for (var k in params) {
                    if (params.hasOwnProperty(k)) {
                        var el = document.createElement('input');
                        el.name = k;
                        el.value = params[k];
                        el.type = 'hidden';
                        form.appendChild(el);
                    }
                }
                document.body.appendChild(form);
                form.submit();
            }
        }

        this.create = function () {
            if (DEBUG) {
                game.plugins.add(FPSPlugin);
                game.plugins.add(VSyncPlugin);
            } else {
                var element = document.getElementById('fps');
                element.parentNode.removeChild(element);
            }
            game.plugins.add(UpdateHealthPlugin);
            registerFonts(game);
            created = true;
            checkInit();
        }

        function checkInit() {
            if (created && friendsGot && logged) {
                document.getElementById('okwidget').style.display = 'block';


                game.state.start('menu');
            }
        }
    }

    var MenuState = function (game) {
        var bank, bankX = 6;

        this.create = function () {
            ga('send', 'pageview', '/menu');

            game.add.image(22, 37, 'gui', 'logo.png');

            bank = new Bank(game);
            bank.x = bankX;
            bank.y = 5;
            game.add.existing(bank);
            var lock = game.add.image(69, 114, 'gui', 'ico_lock.png');
            var nolife = game.add.image(33, 119, 'gui', 'txt_ended_life.png');

            add_button(game, 21, 88, 'btn_left', function () {
                birdType -= 1;
                if (birdType < 0) {
                    birdType = unlocked.length - 1;
                }
                updateBird();
            });
            add_button(game, 117, 88, 'btn_right', function () {
                birdType += 1;
                if (birdType >= unlocked.length) {
                    birdType = 0;
                }
                updateBird();
            });
            var play = add_button(game, 38, 137, 'btn_play', function () {
                play.inputEnabled = false;
                top.inputEnabled = false;
                serverCall('play', { }, function (obj) {
                    health = obj.health;
                    next_health_update = obj.next_health_update + time();
                    onHealthChanged.dispatch(health, next_health_update);

                    hide_to_state(game, function () {
                        game.state.start('game');
                    });
                });
            });
            var buy_health = add_button(game, 38, 137, 'btn_buy_health', function () {
                buy_health.inputEnabled = false;
                processPurchase('health');
            });
            var buy_bird1 = add_button(game, 38, 137, 'btn_buy_bird1', function () {
                buy_bird1.inputEnabled = false;
                processPurchase('bird' + birdType);
            });
            var buy_bird2 = add_button(game, 38, 137, 'btn_buy_bird2', function () {
                buy_bird2.inputEnabled = false;
                processPurchase('bird' + birdType);
            });
            var top = add_button(game, 38, 174, 'btn_top', function () {
                play.inputEnabled = false;
                top.inputEnabled = false;
                serverCall('top', { uids : friendIds }, function (obj) {
                    topResults = obj.top;

                    hide_to_state(game, function () {
                        game.state.start('top');
                    });
                });
            });

            var bird;
            function updateBird() {
                game.world.remove(bird);
                bird = new Bird(game, birdType, 75, 100);
                game.add.existing(bird);

                play.visible = false;
                buy_bird1.visible = false;
                buy_bird2.visible = false;
                buy_health.visible = false;
                lock.visible = false;
                nolife.visible = false;

                if (unlocked[birdType]) {
                    if (health > 0) {
                        play.visible = true;
                    } else {
                        nolife.visible = true;
                        buy_health.visible = true;
                    }
                } else {
                    lock.visible = true;
                    if (birdType === 1) {
                        buy_bird1.visible = true;
                    } else if (birdType === 2) {
                        buy_bird2.visible = true;
                    } else {
                        assert(game, false, 'Unknown locked bird type = ' + birdType);
                    }
                }
            }

            function updateScale() {
                bankX = Math.ceil(OK_WIDGET_WIDTH / globalScale) + 6;
                if (bank) {
                    bank.x = bankX;
                }
            }

            updateBird();
            updateScale();

            onResized.add(function (w, h, s) {
                updateScale();
            }, this);

            var _health = health;
            onHealthChanged.add(function (health, next_health_update) {
                if (_health != health) {
                    _health = health;
                    updateBird();
                }
            }, this);
        }

        this.shutdown = function () {
            onResized.removeAll(this);
            onHealthChanged.removeAll(this);
        }
    }

    var TopState = function (game) {
        this.create = function () {
            ga('send', 'pageview', '/top');

            var NUM_LINES = 5;
            var top = topResults.concat();
            top.sort(function (a, b) { return b.score - a.score });

            var idx;
            for (var i = 0; i < top.length; i++) {
                if (top[i].uid == viewerId) {
                    idx = i;
                    break;
                }
            }
            assert(game, idx !== undefined);
            if (idx >= 0 && idx < NUM_LINES) {
                idx = 0;
            } else if (idx >= top.length - NUM_LINES) {
                idx = Math.max(0, top.length - NUM_LINES);
            } else {
                idx = Math.max(0, idx - 2);
            }

            game.add.image(44, 13, 'gui', 'txt_top.png');

            var up = add_button(game, 64, 30, 'btn_up', function () {
                idx -= 1;
                updateTop();
            });

            game.add.image(13, 46, 'gui', 'top_bg.png');

            var lines = [];
            var link;
            for (var l = 0; l < NUM_LINES; l++) {
                lines.push([
                    new AlignText(game, 30, 55 + 20 * l, 'top', 8, 'right'),
                    new AlignText(game, 45, 55 + 20 * l, 'top', 8, 'left'),
                    link = new AlignText(game, 80, 55 + 20 * l, 'top', 8, 'left')
                ]);
            }

            var down = add_button(game, 64, 153, 'btn_down', function () {
                idx += 1;
                updateTop();
            });

            var menu = add_button(game, 38, 174, 'btn_menu', function () {
                menu.inputEnabled = false;
                hide_to_state(game, function () {
                    game.state.start('menu');
                });
            });

            function updateTop() {
                up.visible = idx > 0;
                down.visible = (idx + NUM_LINES) < top.length;
                for (var i = 0; i < NUM_LINES; i++) {
                    if (idx + i >= top.length) {
                        lines[i][0].visible = false;
                        lines[i][1].visible = false;
                        lines[i][2].visible = false;
                    } else {
                        var tint = (top[idx + i].uid === viewerId) ? 0x89d443 : 0x373737;
                        lines[i][0].value = (idx + i + 1);
                        lines[i][0].tint = tint;
                        lines[i][0].visible = true;
                        lines[i][1].value = Math.min(999999, top[idx + i].score);
                        lines[i][1].tint = tint;
                        lines[i][1].visible = true;
                        lines[i][2].text = top[idx + i].name.toUpperCase().substr(0, 11);
                        lines[i][2].tint = tint;
                        lines[i][2].visible = true;
                    }
                }
            }

            updateTop();
        }
    }

    var GameState = function (game) {
        var bird, ground, walls, score;
        var sc;
        var globalGroup;

        function emitWall() {
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
            game.add.audio('punch').play('');

            walls.callAll('stop');
            game.tweens.removeFrom(ground);

            var tweenComplete = false, overData = null;
            function check() {
                if (tweenComplete && overData) {
                    game.add.existing(new GameOver(game, sc, overData.best_score, overData.new, overData.medal));
                }
            }

            bird.bodyGravity = false;
            bird.die();

            game.add.tween(globalGroup)
            .to({ x : 1, y : 1},  0.05 * SEC, Phaser.Easing.Linear.None)
            .to({ x : 0, y : 0},  0.05 * SEC, Phaser.Easing.Linear.None)
            .to({ x : -1, y : -1},  0.05 * SEC, Phaser.Easing.Linear.None)
            .to({ x : 0, y : 0},  0.05 * SEC, Phaser.Easing.Linear.None)
            .to({ x : 1, y : 1},  0.05 * SEC, Phaser.Easing.Linear.None)
            .to({ x : 0, y : 0},  0.05 * SEC, Phaser.Easing.Linear.None)
            .start();


            var blink = add_color_box(game, 0xffffff);
            blink.alpha = 0;
            game.add.tween(blink).to({alpha : 0.9}, 0.2 * SEC, undefined, true, 0, 0, true).onComplete.addOnce(function () {
                score.visible = false;

                bird.bodyGravity = true;

                blink.destroy();
                blink = null;

                tweenComplete = true;
                check();
            });

            serverCall('over', { score : sc }, function (obj) {
                overData = obj;
                check();
            })
        }

        this.create = function () {
            ga('send', 'pageview', '/game');

            game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);
            var flapKey = this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

            globalGroup = game.add.group();
            globalGroup.add(game.add.image(0, HEIGHT - GR - game.cache.getFrameByName('gui', 'bg.png').height, 'gui', 'bg.png'));
            walls = globalGroup.add(game.add.group());

            var underground = globalGroup.add(game.add.image(0, HEIGHT - 2, 'gui', 'underground.png'));
            underground.width = WIDTH + 1;
            underground.height = 2000;

            ground = globalGroup.add(game.add.image(0, HEIGHT - GR, 'gui', 'ground.png'));

            bird = globalGroup.add(game.add.existing(new Bird(game, birdType, 45, 125)));

            var demoTween = game.add.tween(bird).to({ y : 125 + 3}, 0.4 * SEC, undefined, true, 0, -1, true);

            var help = globalGroup.add(game.add.group());
            help.add(game.add.image(24, 53, 'gui', 'txt_ready.png'));
            help.add(game.add.image(75, 114, 'gui', 'gray_bird' + birdType + '.png')).anchor.setTo(0.5, 0.5);
            help.add(game.add.image(75, 126, 'gui', 'txt_taptap.png')).anchor.setTo(0.5, 0);

            for (var i = 0; i < 3; i++) {
                walls.add(new Wall(game));
            }

            score = new AlignText(game, 75, 10, 'score', 11, 'center');

            gameState = GAME_STATE_HELP;
            sc = 0;
            score.value = sc;

            function start() {
                if (gameState !== GAME_STATE_HELP) {
                    return;
                }
                gameState = GAME_STATE_PREFLY;

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
                    if (gameState === GAME_STATE_PREFLY) {
                        gameState = GAME_STATE_FLY;
                        emitWall();
                    }
                });
            }

            flapKey.onDown.addOnce(start, this);
            this.input.onDown.addOnce(start, this);
        }

        this.update = function () {
            var e = game.time.elapsed / 1000;

            var gravState = bird.bodyGravity && (gameState === GAME_STATE_FLY || gameState === GAME_STATE_PREFLY || gameState === GAME_STATE_FALL);

            if (gravState) {
                bird.y += bird.velocityY * e + GRAVITY * e * e / 2;
                bird.velocityY += GRAVITY * e;
                bird.updateAngle(e);
            }

            if (gravState) {
                if (bird.y + BIRD_R >= ground.y) {
                    bird.x = bird.x;
                    bird.y = ground.y - BIRD_R;
                    bird.bodyGravity = false;
                    if (gameState === GAME_STATE_PREFLY || gameState === GAME_STATE_FLY) {
                        death();
                    }
                    gameState = GAME_STATE_DEAD;
                }
            }

            if (gameState !== GAME_STATE_DEAD && gameState !== GAME_STATE_FALL) {
                ground.x += -SPEED * e;
                while (ground.x <= -150) {
                    ground.x += 150;
                }
            }

            if (gameState === GAME_STATE_FLY) {
                emitWall();
            }

            if (gameState === GAME_STATE_FLY) {
                walls.forEach(function (wall) {
                    wall.updatePhys();
                    if (!wall.scored && wall.isScored(bird)) {
                        wall.scored = true;
                        sc += 1;
                        score.value = sc;
                        game.add.audio('point').play('');
                    }

                    if (wall.isCollide(bird)) {
                        gameState = GAME_STATE_FALL;
                        death();
                    }
                }, this, true);
            }
        }

        this.shutdown = function() {
            game.input.keyboard.removeKey(Phaser.Keyboard.SPACEBAR);
            this.input.onDown.removeAll(this);
        }
    }

    var ErrorState = function (game) {
        var _msg = '';

        this.init = function (msg) {
            _msg = msg;
        }

        this.create = function () {
            ga('send', 'pageview', '/error');

            var div = document.getElementById('error');
            div.innerHTML = _msg;
            div.style.display = 'block';
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

    function UpdateHealthPlugin(game) {
        this.update = function () {
            var ohealth = health;
            while (time() > next_health_update) {
                next_health_update += HEALTH_UPDATE_SEC;
                health += 1;
            }
            if (health > MAX_HEALTH_VALUE) {
                health = MAX_HEALTH_VALUE;
            }
            if (ohealth != health) {
                onHealthChanged.dispatch(health, next_health_update);
            }
        }
    }

    (function () {
        var errHandler = window.onerror;
        window.onerror = function (errorMsg, url, lineNumber, column, errorObj) {
            var http = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
            var p = {
                errorMsg : errorMsg,
                url : url,
                lineNumber : lineNumber,
                column : column
            }
            if (errorObj !== undefined){
                p.stack = errorObj.stack;
            }
            if (viewerId) {
                p.uid = viewerId;
            }
            p.rnd = ((1000000 * Math.random()) | 0);

            var req = [];
            for (var k in p) {
                if (p.hasOwnProperty(k)) {
                    req.push(k + '=' + escape(encodeURI(p[k])));
                }
            }

            http.open('GET', SERVER + 'error?' + req.join('&'), true);
            http.send();

            if (errHandler) {
                return errHandler(errorMsg, url, lineNumber, column, errorObj);
            }
            return false;
        }

        var game = new Phaser.Game(WIDTH, HEIGHT, Phaser.AUTO, 'game', null, false, false, null);
        game.forceSingleUpdate = true;
        game.config.enableDebug = false;
        game.device.whenReady(function () {
            game.stage.backgroundColor = BG_COLOR;
            game.stage.disableVisibilityChange = true;
            game.stage.smoothed = false;

            game.time.advancedTiming = true;

            game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
            game.scale.pageAlignHorizontally = true;
            var lastScale = 0;
            game.scale.setResizeCallback(function (scale, parentBounds) {
                var s = Math.min(parentBounds.width / WIDTH, parentBounds.height / HEIGHT);
                if (HDPI * s != lastScale) {
                    lastScale = HDPI * s;
                    if (game.renderType == Phaser.WEBGL) {
                        game.renderer.resolution = HDPI * s;
                    } else {
                        game.renderer.resolution = HDPI;
                    }
                    var h = HEIGHT + (parentBounds.height - s * HEIGHT) / s;
                    game.height = h;
                    game.renderer.resize(WIDTH, h)
                    scale.setUserScale(s, s);
                    globalScale = s;
                }
                scale.reflowCanvas();

                var widget = document.getElementById('okwidget');
                widget.style.marginLeft = scale.margin.x + 'px';

                onResized.dispatch(game.width, game.height, s);
            });
            game.scale.refresh();
        });

        game.state.add('preload', PreloadState, true);
        game.state.add('menu', MenuState);
        game.state.add('game', GameState);
        game.state.add('top', TopState);
        game.state.add('error', ErrorState);
    })()
}
