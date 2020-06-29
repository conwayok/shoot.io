class Player extends Phaser.Physics.Arcade.Sprite {

  //<editor-fold defaultstate="collapsed" desc="constructor">
  constructor (scene, spawnX, spawnY, texture, nameStr) {
    super(scene, spawnX, spawnY, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.scene = scene;
    this.name = nameStr;

    this.speed = 200;

    this.hp = 3;
    this.isDead = false;
    this.healthBar = new HealthBar(scene, this);

    this.godMode = false;

    this.xp = 1;
    this.totalXp = 1;
    this.bulletType = BULLET_TYPE.NORMAL;

    // array of upgrades available to the player
    this.upgradesAvailable = [];
    this.level = 1;
    this.additionalXpRequiredPerLevel = 2;
    this.requiredLevelUpXp = this.level * this.additionalXpRequiredPerLevel;

    this.nameText = new Phaser.GameObjects.Text(scene, this.x,
      this.y, '',
      {
        color: '#000000',
        fontSize: 15
      }
    );
    this.nameText.setOrigin(0.5, 0.5);
    scene.add.existing(this.nameText);

    this.updateName();
  }

  //</editor-fold>

  updateName () {
    let posX = this.x;
    let posY = this.y - 45;
    this.nameText.x = posX;
    this.nameText.y = posY;
    this.nameText.text = this.name + ' lvl ' + this.level;
  }

  spawn (spawnX, spawnY) {
    this.hp = PLAYER_DEFAULT_HP;
    this.isDead = false;
    this.clearTint();
    this.body.reset(spawnX, spawnY);
    this.rotation = 0;
    this.scene.players.add(this);
    this.body.setCollideWorldBounds(true);
  }

  die () {
    // 死亡狀態設定為true
    this.isDead = true;
    // 變黑色
    this.setTint(0xff0000);
    // 不要動
    this.body.setVelocity(0, 0);
    // 從玩家群組移除，才不會繼續被射
    this.scene.players.remove(this);

    this.bulletType = BULLET_TYPE.NORMAL;

    this.xp = 1;
    this.level = 1;
    this.totalXp = 1;
    this.requiredLevelUpXp = this.level * this.additionalXpRequiredPerLevel;
  }

  update () {
    if (!this.isDead) {
      this.healthBar.draw();
      this.updateName();
    }
  }

  shoot (target) {
    let bullet = this.createBullet(target);
    this.scene.bullets.add(bullet);
    bullet.run();
  }

  createBullet (target) {
    switch (this.bulletType) {
      case BULLET_TYPE.NORMAL:
        return new Bullet(this.scene, this, target);
      case BULLET_TYPE.WIDE:
        return new WideBullet(this.scene, this, target);
      case BULLET_TYPE.PENETRATION:
        return new PenetrationBullet(this.scene, this, target);
      default:
        break;
    }
  }

  takeDamage (bullet) {
    if (!this.godMode) {
      this.hp -= bullet.damage;
      this.healthBar.draw();
      if (this.hp <= 0) {
        let message = getKillMessage(bullet.shooter, this);
        // local kill feed
        this.scene.events.emit(GAME_FEED_MESSAGE_EVENT, message);
        // remote kill feed
        this.scene.socket.emit(KILL_EVENT, message);
        this.die();
      }
    }
  }
}

class LocalPlayer extends Player {

  //<editor-fold defaultstate="collapsed" desc="constructor">
  constructor (scene, spawnX, spawnY, texture, nameStr) {
    super(scene, spawnX, spawnY, texture, nameStr);
    this.prevFireTime = 0;
    this.secondsPerShot = 0.25;
    this.rotation = 0;
    this.nameText.setStyle({
      color: '#0024ff',
      fontStyle: 'Bold',
      fontSize: 15
    });
  }

  //</editor-fold>

  shoot (target) {
    if (this.getNextAvailableFireTime() <= Date.now()) {
      let bullet = super.createBullet(target);
      this.scene.bullets.add(bullet);
      bullet.run();
      this.prevFireTime = Date.now();

      // tell others that i shot
      this.scene.socket.emit(PLAYER_SHOOT_EVENT, target);
    }
  }

  getNextAvailableFireTime () {
    return this.prevFireTime + this.secondsPerShot * 1000;
  }

  respawn () {
    let randomX = getRandomInt(32, config.width - 32);
    let randomY = getRandomInt(32, config.height - 32);
    super.spawn(randomX, randomY);
    this.scene.xpOverlap.active = true;
    this.scene.heartOverlap.active = true;
    this.bulletType = BULLET_TYPE.NORMAL;
    this.xp = 1;
    this.level = 1;
    this.totalXp = 1;
    this.secondsPerShot = 0.25;
    this.requiredLevelUpXp = this.level * this.additionalXpRequiredPerLevel;
    this.scale = 1;
    this.speed = 200;
    this.upgradesAvailable = [];
    this.scene.socket.emit(PLAYER_SPAWN_EVENT, { x: randomX, y: randomY });
  }

  checkLevelUp () {
    if (this.xp >= this.requiredLevelUpXp) {
      this.xp = 0;
      this.level += 1;
      this.requiredLevelUpXp = this.level * this.additionalXpRequiredPerLevel;
      this.upgradesAvailable.push(...getThreeRandomUpgrades());
    }
  }

  levelUp (option) {
    // can only upgrade if upgrades available
    if (this.upgradesAvailable.length > 0) {
      // get chosen upgrade from array
      let upgrade = this.upgradesAvailable[option - 1];
      // and apply to user
      upgrade.applyTo(this);
      // pop 3 elements out (users have to choose one from three upgrades at a time)
      for (let i = 0; i < 3; ++i) {
        this.upgradesAvailable.shift();
      }
    }
  }

  update () {
    super.update();
    // 更新升級技能字串
    this.checkLevelUp();
  }

  die () {
    super.die();
    if (this.isDead) {
      this.scene.xpOverlap.active = false;
      this.scene.heartOverlap.active = false;

      // if i died, i will tell server
      this.scene.socket.emit(PLAYER_DIE_EVENT);
    }
  }

}

class RemotePlayer extends Player {
  constructor (scene, spawnX, spawnY, texture, nameStr) {
    super(scene, spawnX, spawnY, texture, nameStr);
  }

  destroyWhole () {
    super.updateName();
    this.healthBar.bar.destroy();
    this.destroy();
    this.nameText.destroy();
  }

  takeDamage (bullet) {}
}

class LocalAIPlayer extends LocalPlayer {

  constructor (scene, spawnX, spawnY, texture, nameStr) {
    super(
      scene,
      spawnX,
      spawnY,
      texture,
      nameStr);
    this.nameText.setStyle({
      color: '#0024ff',
      fontStyle: 'Bold',
      fontSize: 15
    });
    this.keys = ['w', 'a', 's', 'd', 'wa', 'wd', 'sa', 'sd'];
    this.changeDirectionTime = 0;
    this.sight = 500;
    this.deathTime = 0;

    // ai players have manually generated random id
    this.id = getRandomId();
  }

  move () {
    let now = Date.now();
    if (now > this.changeDirectionTime) {
      this.changeDirection();
      this.changeDirectionTime = now + getRandomInt(200, 300);
    }

    this.setVelocityY(this.ySpeed);
    this.setVelocityX(this.xSpeed);
  }

  die () {
    super.die();
    this.deathTime = Date.now();
    // console.log(this.deathTime);
  }

  changeDirection () {
    let key = this.keys[Math.floor(Math.random() * this.keys.length)];
    switch (key) {
      case 'w':
        this.xSpeed = 0;
        this.ySpeed = this.speed;
        break;
      case 'a':
        this.xSpeed = -this.speed;
        this.ySpeed = 0;
        break;
      case 's':
        this.xSpeed = 0;
        this.ySpeed = -this.speed;
        break;
      case 'd':
        this.xSpeed = this.speed;
        this.ySpeed = 0;
        break;
      case 'wa':
        this.xSpeed = -this.speed;
        this.ySpeed = this.speed;
        break;
      case 'wd':
        this.xSpeed = this.speed;
        this.ySpeed = this.speed;
        break;
      case 'sa':
        this.xSpeed = this.speed;
        this.ySpeed = -this.speed;
        break;
      case 'sd':
        this.xSpeed = -this.speed;
        this.ySpeed = -this.speed;
        break;
    }
  }

  // find if any of the enemy players are in range
  findEnemy () {
    let childrenArray = this.scene.players.children.entries;
    for (let i = 0; i < childrenArray.length; ++i) {
      let player = childrenArray[i];
      let distance = calcDistance(this.x, this.y, player.x, player.y);
      // 如果該玩家不是自己且在視線範圍內，射他
      if (player !== this && distance <= this.sight) {
        this.shoot({
          x: player.x + getRandomInt(-50, 50),
          y: player.y + getRandomInt(-50, 50)
        });
      }
    }
  }

  shoot (target) {
    // change direction to face target
    this.setRotation(
      Phaser.Math.Angle.Between(this.x, this.y,
        target.x, target.y
      ));
    super.shoot(target);
  }

  update () {
    // ai specific behavior
    if (!this.isDead) {
      // this.healthBar.draw();
      // this.updateName();

      // randomly move
      this.move();

      // randomly find enemies
      this.findEnemy(this.scene.players);

      this.checkLevelUp();

      // randomly level up
      if (this.upgradesAvailable.length > 0) {
        super.levelUp(getRandomInt(1, 4));
      }
    } else if ((Date.now() - this.deathTime
    ) > 3000) {
      super.respawn();
    }
  }
}