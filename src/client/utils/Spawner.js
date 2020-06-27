class Spawner {

  constructor (scene) {
    this.scene = scene;

    // 電腦玩家死亡時間
    this.aiPlayerDeathTimes = [];

    // ai wait 5s to respawn
    this.aiRespawnTime = 7000;

    // 玩家重生長寬範圍
    this.playerSpawnMinX = 32;
    this.playerSpawnMaxX = config.width - 32;
    this.playerSpawnMinY = 32;
    this.playerSpawnMaxY = config.height - 32;

    // 愛心生成時間區間
    this.spawnHeartIntervalMin = 1000;
    this.spawnHeartIntervalMax = 3000;
    this.lastSpawnHeartTime = 0;
    this.consumableSpawnMinX = 50;
    this.consumableSpawnMaxX = config.width - 50;
    this.consumableSpawnMinY = 50;
    this.consumableSpawnMaxY = config.width - 50;
  }

  /**
   * 隨機生成ai玩家
   */
  spawnAiRandomPos () {
    let spawnPos = getRandomPos(this.playerSpawnMinX, this.playerSpawnMinY,
      this.playerSpawnMaxX, this.playerSpawnMaxY
    );
    let randomName = getRandomElement(this.scene.names);
    let aiPlayer = new AiPlayer(this.scene, spawnPos.x, spawnPos.y,
      'enemy', randomName
    );
    this.scene.players.add(aiPlayer);
    aiPlayer.setCollideWorldBounds(true);
  }

  /**
   * 隨機生成愛心
   */
  spawnHeartRandomPos () {
    let spawnPos = getRandomPos(
      this.consumableSpawnMinX,
      this.consumableSpawnMinY,
      this.consumableSpawnMaxX,
      this.consumableSpawnMaxY
    );
    let heart = new Heart(this.scene, spawnPos.x, spawnPos.y);
    this.scene.hearts.add(heart);
  }

  update () {
    let now = Date.now();

    // spawn ai
    let remaining = [];
    let canRespawnTime = now + this.aiRespawnTime;
    for (let deathTime in this.aiPlayerDeathTimes) {
      if (deathTime < canRespawnTime) {
        this.spawnAiRandomPos();
      } else {
        remaining.push(deathTime);
      }
    }
    this.aiPlayerDeathTimes = remaining;

    // spawn heart
    if (now > this.lastSpawnHeartTime + getRandomInt(
      this.spawnHeartIntervalMin,
      this.spawnHeartIntervalMax
    )) {
      this.spawnHeartRandomPos();
      this.lastSpawnHeartTime = now;
    }
  }

}