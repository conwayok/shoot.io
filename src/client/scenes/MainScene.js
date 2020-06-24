class MainScene extends Phaser.Scene {
  constructor () {
    super();
    this.playerSpawner = new Spawner(this);
    this.names = [];
    this.aiCount = 16;
  }

  preload () {
    let assetsPath = 'client/assets/';

    // 載入素材
    this.load.image('bg', assetsPath + 'whitebg.png');
    this.load.image('player', assetsPath + 'green_block.png');
    this.load.image('bullet', assetsPath + 'bullet.png');
    this.load.image('wide_bullet', assetsPath + 'wide_bullet.png');
    this.load.image('bullet', assetsPath + 'wide_bullet.png');
    this.load.image(
      'penetration_bullet',
      assetsPath + 'penetration_bullet.png'
    );
    this.load.image('enemy', assetsPath + 'blue_square.png');
    this.load.image('heart', assetsPath + 'heart.png');
    this.load.image('xp', assetsPath + 'xp.png');
    this.load.text('names', assetsPath + 'first-names.txt');

    this.load.plugin(
      'rexbbcodetextplugin',
      'lib/rexbbcodetextplugin.min.js',
      true
    );
  }

  create () {

    // <editor-fold defaultstate="collapsed" desc="讀取名字">
    this.names = this.cache.text.get('names').split('\r\n');
    // </editor-fold>

    // <editor-fold defaultstate="collapsed" desc="背景照片">
    this.add.image(640, 360, 'bg');
    // </editor-fold>

    // <editor-fold defaultstate="collapsed" desc="鍵盤按鈕綁定">
    // movement keys
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.mouse = this.input.mousePointer;

    // respawn key
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    // listen to other keys
    this.input.keyboard.on('keydown', this.keydownCallback, this);
    // </editor-fold>

    // <editor-fold defaultstate="collapsed" desc="新增玩家">
    let randomSpawnPos = getRandomPos(
      100,
      100,
      config.width - 100,
      config.height - 100);
    this.player = new HumanPlayer(
      this,
      randomSpawnPos.x,
      randomSpawnPos.y,
      'player',
      'HUMAN');
    this.players = this.physics.add.group();
    this.players.add(this.player);
    // </editor-fold>

    // todo: this is for debug
    this.player.godMode = true;

    // set collide world bounds here because adding player to group will wipe data
    // 在這裡設定玩家不能超出遊戲邊界
    this.player.setCollideWorldBounds(true);

    for (let i = 0; i < this.aiCount; ++i) {
      let randomName = this.names[Math.floor(
        Math.random() * this.names.length)];
      // randomName.replace('\n', '');
      let enemy = new AiPlayer(this, getRandomInt(100, 1000),
        getRandomInt(100, 700), 'enemy', randomName
      );
      this.players.add(enemy);
      enemy.setCollideWorldBounds(true);
    }

    // players collide with each other
    this.physics.add.collider(this.players, this.players);

    this.bullets = this.physics.add.group();

    this.physics.add.overlap(
      this.bullets,
      this.players,
      Bullet.bulletHitPlayer
    );

    this.hearts = this.physics.add.group();
    this.physics.add.overlap(this.hearts, this.players, Heart.overlapPlayer);

    this.xpConsumables = this.physics.add.group();
    this.physics.add.overlap(
      this.xpConsumables,
      this.players,
      XpConsumable.overlapPlayer
    );

    this.leaderBoard = new LeaderBoard(this);

    this.upgradeText = this.add.text(
      config.width / 2,
      (config.height / 10
      ) * 9.5,
      '',
      {
        color: '#ffffff',
        fontSize: 25,
        whiteSpace: { width: 1000 },
        fontStyle: 'Bold',
        align: 'center',
        backgroundColor: '#000000'
      }
    );
    this.upgradeText.originX = 0.5;
    this.upgradeText.depth = 99;

    this.gameFeed = new GameFeed(this);
  }

  update () {

    // <editor-fold defaultstate="collapsed" desc="主玩家相關">
    if (!this.player.isDead) {
      // <editor-fold defaultstate="collapsed" desc="玩家操控">

      // moving
      if (this.keyW.isDown) this.player.setVelocityY(-this.player.speed);
      if (this.keyS.isDown) this.player.setVelocityY(this.player.speed);
      if (this.keyA.isDown) this.player.setVelocityX(-this.player.speed);
      if (this.keyD.isDown) this.player.setVelocityX(this.player.speed);

      // stop
      if (this.keyW.isUp && this.keyS.isUp) this.player.setVelocityY(0);
      if (this.keyA.isUp && this.keyD.isUp) this.player.setVelocityX(0);

      // player will rotate according to mouse
      this.player.setRotation(
        Phaser.Math.Angle.Between(this.player.x, this.player.y,
          this.mouse.x, this.mouse.y
        ));

      // fire
      if (this.mouse.isDown) {
        this.player.shoot({ x: this.mouse.x, y: this.mouse.y });
      }

      // </editor-fold>
    } else {
      if (this.keyR.isDown) {
        this.player.respawn();
      }
    }
    // </editor-fold>

    this.players.children.each(function (player) {
      player.update();
    });

    this.playerSpawner.update();
    this.leaderBoard.update();
    this.gameFeed.update();
  }

  keydownCallback (event) {
    switch (event.key) {
      case '1':
        this.player.levelUp(1);
        break;
      case '2':
        this.player.levelUp(2);
        break;
      case '3':
        this.player.levelUp(3);
        break;
      default:
        break;
    }
  }
}