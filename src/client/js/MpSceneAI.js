class MpSceneAI extends MpScene {
  constructor () {
    super();
  }

  create () {
    this.socket = io();
    this.bindEvents();
    let randomSpawnPos = getRandomPos(
      100,
      100,
      config.width - 100,
      config.height - 100);
    this.localPlayer = new LocalAIPlayer(
      this,
      randomSpawnPos.x,
      randomSpawnPos.y,
      'player', 'AI' + getRandomInt(1, 1000));
    this.players = this.physics.add.group();
    this.players.add(this.localPlayer);
    this.localPlayer.setCollideWorldBounds(true);
    let localPlayerData = this.getLocalPlayerData();
    this.socket.emit(PLAYER_JOIN_EVENT, localPlayerData);
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
  }

  update () {
    this.players.children.each(function (player) {
      player.update();
    });

    // for respawn
    if (this.localPlayer.isDead) {
      this.localPlayer.update();
    }

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
}