class MpScene extends Phaser.Scene {
  constructor () {
    super('MpScene');
  }

  //<editor-fold defualtstate="collapsed" desc="preload">
  preload () {
    let assetsPath = 'assets/';

    // 載入素材
    this.load.image('bg', assetsPath + '46.png');
    this.load.image('player', assetsPath + 'tank.png');
    this.load.image('bullet', assetsPath + 'bullet14.png');
    this.load.image('wide_bullet', assetsPath + 'wide_bullet.png');
    this.load.image('bullet', assetsPath + 'wide_bullet.png');
    this.load.image(
      'penetration_bullet',
      assetsPath + 'penetration_bullet.png'
    );
    this.load.image('heart', assetsPath + 'heart.png');
    this.load.image('xp', assetsPath + 'xp.png');
    this.load.image('reticle', assetsPath + 'reticle.png');
    this.load.image('player_dead', assetsPath + 'tank_dead.png');
    this.load.text('names', assetsPath + 'first-names.txt');
  }

  //</editor-fold>

  create () {

    this.names = this.cache.text.get('names').split(',');

    this.socket = io();

    this.bindEvents();

    this.add.image(1280, 720, 'bg');

    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.mouse = this.input.mousePointer;
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.input.keyboard.on('keydown', this.keydownCallback, this);

    let randomSpawnPos = getRandomPos(
      100,
      100,
      config.width - 100,
      config.height - 100);

    this.scene.launch('HudScene');

    let hudScene = this.scene.get('HudScene');

    this.localPlayer = new LocalPlayer(
      this,
      randomSpawnPos.x,
      randomSpawnPos.y,
      'player', getRandomElement(this.names), hudScene);
    this.players = this.physics.add.group();
    this.players.add(this.localPlayer);
    this.localPlayer.setCollideWorldBounds(true);
    let localPlayerData = this.getLocalPlayerData();
    this.socket.emit(PLAYER_JOIN_EVENT, localPlayerData);

    this.reticle = this.physics.add.sprite(
      randomSpawnPos.x + 1,
      randomSpawnPos.y,
      'reticle');
    this.reticle.setCollideWorldBounds(true);

    this.cameras.main.zoom = 2;
    this.cameras.main.startFollow(this.localPlayer);
    this.cameras.main.setBounds(0, 0, config.width, config.height);

    this.bullets = this.physics.add.group();
    this.hearts = this.physics.add.group();
    this.xpConsumables = this.physics.add.group();

    this.physics.add.overlap(
      this.bullets,
      this.players,
      Bullet.bulletHitPlayer
    );

    this.heartOverlap = this.physics.add.overlap(
      this.localPlayer,
      this.hearts,
      Heart.playerOverlapHeart,
      null,
      this
    );

    this.xpOverlap = this.physics.add.overlap(
      this.localPlayer,
      this.xpConsumables,
      XpConsumable.playerOverlapXp,
      null,
      this
    );

    // Pointer lock will only work after mousedown
    game.canvas.addEventListener('mousedown', function () {
      game.input.mouse.requestPointerLock();
    });

    // Exit pointer lock when Q or escape (by default) is pressed.
    this.input.keyboard.on('keydown_Q', function (event) {
      if (game.input.mouse.locked)
        game.input.mouse.releasePointerLock();
    }, 0, this);

    // Move reticle upon locked pointer move
    this.input.on('pointermove', function (pointer) {
      if (this.input.mouse.locked) {
        this.reticle.x += pointer.movementX;
        this.reticle.y += pointer.movementY;
      }
    }, this);

  }

  keydownCallback (event) {
    switch (event.key) {
      case '1':
        this.localPlayer.levelUp(1);
        break;
      case '2':
        this.localPlayer.levelUp(2);
        break;
      case '3':
        this.localPlayer.levelUp(3);
        break;
      default:
        break;
    }
  }

  bindEvents () {
    this.socket.on(PLAYER_JOIN_EVENT, this.addPlayer.bind(this));
    this.socket.on(PLAYER_UPDATE_EVENT, this.updatePlayer.bind(this));
    this.socket.on(PLAYER_SHOOT_EVENT, this.playerShoot.bind(this));
    this.socket.on(PLAYER_DISCONNECT_EVENT, this.playerDisconnect.bind(this));
    this.socket.on(PLAYER_DIE_EVENT, this.playerDie.bind(this));
    this.socket.on(PLAYER_SPAWN_EVENT, this.playerSpawn.bind(this));
    this.socket.on(HEART_SPAWN_EVENT, this.spawnHeart.bind(this));
    this.socket.on(HEART_CONSUME_EVENT, this.removeHeart.bind(this));
    this.socket.on(XP_SPAWN_EVENT, this.spawnXpMultiple.bind(this));
    this.socket.on(XP_CONSUME_EVENT, this.removeXp.bind(this));
    this.socket.on(XP_SPAWN_STATIC_EVENT, this.spawnXpStatic.bind(this));
    this.socket.on(KILL_EVENT, this.killFeedMessage.bind(this));
  }

  addPlayer (id, playerData) {
    let newPlayer = new RemotePlayer(
      this,
      playerData.x,
      playerData.y,
      'player',
      playerData.name);
    newPlayer.isDead = playerData.isDead;

    newPlayer.hp = playerData.hp;
    newPlayer.bulletType = playerData.bulletType;
    newPlayer.totalXp = playerData.totalXp;
    newPlayer.level = playerData.level;
    newPlayer.scale = playerData.scale;

    // sync death state
    if (newPlayer.isDead) newPlayer.die();
    else this.players.add(newPlayer);

    PLAYERS_MAP.set(id, newPlayer);
    newPlayer.setCollideWorldBounds(true);

    this.events.emit(GAME_FEED_MESSAGE_EVENT, getJoinedMessage(newPlayer.name));
  }

  updatePlayer (id, playerData) {
    let player = PLAYERS_MAP.get(id);
    if (player !== undefined) {
      if (playerData.hasOwnProperty('x')) player.x = playerData.x;
      if (playerData.hasOwnProperty('y')) player.y = playerData.y;
      if (playerData.hasOwnProperty('rotation')) player.rotation = playerData.rotation;
      if (playerData.hasOwnProperty('hp')) player.hp = playerData.hp;
      if (playerData.hasOwnProperty('xp')) player.xp = playerData.xp;
      if (playerData.hasOwnProperty('totalXp')) player.totalXp = playerData.totalXp;
      if (playerData.hasOwnProperty('level')) player.level = playerData.level;
      if (playerData.hasOwnProperty('bulletType')) player.bulletType = playerData.bulletType;
      if (playerData.hasOwnProperty('scale')) player.scale = playerData.scale;
    }
  }

  playerDisconnect (id) {
    let player = PLAYERS_MAP.get(id);
    if (player !== undefined) {
      player.destroyWhole();
      this.events.emit(
        GAME_FEED_MESSAGE_EVENT,
        getDisconnectedMessage(player.name));
    }
  }

  playerShoot (id, target) {
    let player = PLAYERS_MAP.get(id);
    player.shoot(target);
  }

  playerDie (id) {
    let player = PLAYERS_MAP.get(id);
    console.log(player.name + ' died');
    player.die();
  }

  playerSpawn (id, pos) {
    let player = PLAYERS_MAP.get(id);
    player.spawn(pos.x, pos.y);
  }

  spawnHeart (id, pos) {
    let heart = new Heart(this, pos.x, pos.y, id);
    this.hearts.add(heart);
  }

  removeHeart (heartId) {
    this.hearts.children.each(function (heart) {
      if (heart.id === heartId)
        heart.destroy();
    });
  }

  spawnXpMultiple (xps) {
    for (const [xpId, xpData] of Object.entries(xps))
      this.spawnXp(xpId, xpData.x, xpData.y, xpData.target, xpData.range);
  }

  spawnXp (id, x, y, target, range) {
    let xp = new XpConsumable(this, x, y, target, id, range);
    this.xpConsumables.add(xp);
    xp.run();
  }

  spawnXpStatic (xps) {
    for (const [xpId, xpData] of Object.entries(xps)) {
      let xp = new XpConsumable(
        this,
        xpData.x,
        xpData.y,
        { x: xpData.x, y: xpData.y },
        xpId,
        null);
      this.xpConsumables.add(xp);
    }
  }

  removeXp (xpId) {
    this.xpConsumables.children.each(function (xp) {
      if (xp.id === xpId)
        xp.destroy();
    });
  }

  killFeedMessage (message) {
    this.events.emit(GAME_FEED_MESSAGE_EVENT, message);
  }

  update () {
    if (!this.localPlayer.isDead) {
      // moving
      if (this.keyW.isDown) this.localPlayer.setVelocityY(-this.localPlayer.speed);
      if (this.keyS.isDown) this.localPlayer.setVelocityY(this.localPlayer.speed);
      if (this.keyA.isDown) this.localPlayer.setVelocityX(-this.localPlayer.speed);
      if (this.keyD.isDown) this.localPlayer.setVelocityX(this.localPlayer.speed);

      // stop
      if (this.keyW.isUp && this.keyS.isUp) this.localPlayer.setVelocityY(0);
      if (this.keyA.isUp && this.keyD.isUp) this.localPlayer.setVelocityX(0);

      // fire
      if (this.mouse.isDown) {
        this.localPlayer.shoot({
          x: this.reticle.x,
          y: this.reticle.y
        });
      }

      // localPlayer will rotate according to reticle
      this.localPlayer.setRotation(
        Phaser.Math.Angle.Between(
          this.localPlayer.x,
          this.localPlayer.y,
          this.reticle.x,
          this.reticle.y));

      this.reticle.body.velocity.x = this.localPlayer.body.velocity.x;
      this.reticle.body.velocity.y = this.localPlayer.body.velocity.y;

      this.constrainReticle();
    } else {
      if (this.keyR.isDown) {
        this.localPlayer.respawn();
      }
    }

    this.players.children.each(function (player) {
      player.update();
    });

    // update this player's state to other people
    let localPlayerData = {
      x: this.localPlayer.x,
      y: this.localPlayer.y,
      rotation: this.localPlayer.rotation,
      hp: this.localPlayer.hp,
      totalXp: this.localPlayer.totalXp
    };

    this.socket.emit(
      PLAYER_UPDATE_EVENT,
      localPlayerData);
  }

  // Ensures reticle does not move offscreen
  constrainReticle () {
    let distX = this.reticle.x - this.localPlayer.x; // X distance between player & reticle
    let distY = this.reticle.y - this.localPlayer.y; // Y distance between player & reticle

    // half of screen, while using zoom 2x
    let maxXDistance = config.width / 2 / 2;
    let maxYDistance = config.height / 2 / 2;

    // Ensures reticle cannot be moved offscreen (player follow)
    if (distX > maxXDistance)
      this.reticle.x = this.localPlayer.x + maxXDistance;
    else if (distX < -maxXDistance)
      this.reticle.x = this.localPlayer.x - maxXDistance;

    if (distY > maxYDistance)
      this.reticle.y = this.localPlayer.y + maxYDistance;
    else if (distY < -maxYDistance)
      this.reticle.y = this.localPlayer.y - maxYDistance;
  }

  getLocalPlayerData () {
    let localPlayerData = {};
    // position data
    localPlayerData.x = this.localPlayer.x;
    localPlayerData.y = this.localPlayer.y;
    localPlayerData.rotation = this.localPlayer.rotation;

    // stat data
    localPlayerData.scale = this.localPlayer.scale;
    localPlayerData.hp = this.localPlayer.hp;
    localPlayerData.xp = this.localPlayer.xp;
    localPlayerData.totalXp = this.localPlayer.totalXp;
    localPlayerData.level = this.localPlayer.level;
    localPlayerData.bulletType = this.localPlayer.bulletType;
    localPlayerData.name = this.localPlayer.name;
    localPlayerData.isDead = this.localPlayer.isDead;
    return localPlayerData;
  }

}