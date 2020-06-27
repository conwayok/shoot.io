class Player extends Phaser.Physics.Arcade.Sprite {

  //<editor-fold defaultstate="collapsed" desc="constructor">
  constructor (scene, spawnX, spawnY, texture, nameStr) {
    super(scene, spawnX, spawnY, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.scene = scene;
    this.name = nameStr;

    // not setting this here because we set this property AFTER adding player to group
    // this.setCollideWorldBounds(true);

    this.speed = 200;

    // seconds, in accordance to fireRate
    this.secondsPerShot = 0.25;
    this.prevFireTime = 0;
    this.defaultHp = 3;
    this.hp = 3;
    this.isDead = false;
    this.healthBar = new HealthBar(scene, this);

    // for debug
    this.godMode = false;

    this.xp = 1;
    this.totalXp = 1;
    this.bulletType = BULLET_TYPE.NORMAL;

    // array of upgrades available to the player
    this.upgradesAvailable = [];
    this.level = 1;
    this.additionalXpRequiredPerLevel = 5;
    this.requiredLevelUpXp = this.level * this.additionalXpRequiredPerLevel;

    this.nameText = new Phaser.GameObjects.Text(scene, this.x,
      this.y, '',
      {
        color: '#000000',
        fontSize: 15
        // backgroundColor: '#000000'
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

  getNextAvailableFireTime () {
    return this.prevFireTime + this.secondsPerShot * 1000;
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

    for (let i = 0; i < this.xp; ++i) {
      let xpConsumable = new XpConsumable(
        this.scene,
        this.x,
        this.y,
        getRandomPos(0, 0, config.width, config.height)
      );
      this.scene.xpConsumables.add(xpConsumable);
      xpConsumable.run();
    }
  }

  update () {
    if (!this.isDead) {
      this.healthBar.draw();
      this.updateName();
      this.checkLevelUp();
    }
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

  shoot (target) {
    if (this.getNextAvailableFireTime() <= Date.now()) {
      let bullet = this.createBullet(target);
      this.scene.bullets.add(bullet);
      bullet.run();
      this.prevFireTime = Date.now();
    }
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
        this.scene.gameFeed.messages.push(getKillMessage(bullet.shooter, this));
        this.die();
      }
    }
  }
}

class HumanPlayer extends Player {

  //<editor-fold defaultstate="collapsed" desc="constructor">
  constructor (scene, spawnX, spawnY, texture, nameStr) {
    super(scene, spawnX, spawnY, texture, nameStr);
    this.xpBar = new XpBar(scene, this);
  }

  //</editor-fold>

  respawn () {
    this.hp = this.defaultHp;
    this.isDead = false;
    this.clearTint();
    let randomX = getRandomInt(32, config.width - 32);
    let randomY = getRandomInt(32, config.height - 32);
    this.body.reset(randomX, randomY);
    this.scene.players.add(this);
    this.body.setCollideWorldBounds(true);
  }

  update () {
    super.update();
    // 更新升級技能字串
    this.updateUpgradeText();
    this.xpBar.draw();
  }

  die () {
    super.die();
    if (this.isDead) {
      this.xp = 1;
      this.level = 1;
      this.requiredLevelUpXp = this.level * this.additionalXpRequiredPerLevel;
    }
  }

  updateUpgradeText () {
    let upgradesAvailableLength = this.upgradesAvailable.length;

    if (upgradesAvailableLength === 0 &&
      this.scene.upgradeText.text.length > 0) {
      this.scene.upgradeText.text = '';

    } else if (upgradesAvailableLength > 0) {
      this.scene.upgradeText.text =
        '可升級 ' + upgradesAvailableLength / 3 +
        ' 次 ' +
        '1)' +
        this.upgradesAvailable[0].getDesc() +
        ' 2)' +
        this.upgradesAvailable[1].getDesc() +
        ' 3)' +
        this.upgradesAvailable[2].getDesc();
    }
  }
}

class AiPlayer extends Player {
  constructor (scene, spawnX, spawnY, texture, nameStr) {
    super(scene, spawnX, spawnY, texture, nameStr);
    this.keys = ['w', 'a', 's', 'd', 'wa', 'wd', 'sa', 'sd'];
    this.changeDirectionTime = 0;
    this.sight = 500;
    this.deathTime = 0;
  }

  move () {
    let now = Date.now();
    if (now > this.changeDirectionTime) {
      this.changeDirection();
      this.changeDirectionTime = now + getRandomInt(125, 250);
    }

    this.setVelocityY(this.ySpeed);
    this.setVelocityX(this.xSpeed);
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
        this.shoot(player);
      }
    }
  }

  shoot (target) {
    // change direction to face target
    this.setRotation(
      Phaser.Math.Angle.Between(this.x, this.y,
        target.x, target.y
      ));

    if (this.getNextAvailableFireTime() <= Date.now()) {
      let bullet =
        // add random values to target xy to simulate inaccuracy
        super.createBullet({
          x: target.x + getRandomInt(-50, 50),
          y: target.y + getRandomInt(-50, 50)
        });
      this.scene.bullets.add(bullet);
      bullet.run();
      this.prevFireTime = Date.now();
    }
  }

  die () {
    super.die();
    this.deathTime = Date.now();
  }

  preUpdate () {
    // ai 死亡: 直接刪掉
    // 想要call this.destroy()，code必須放在preUpdate裡面
    let destroyTime = this.deathTime + 1000;
    if (this.isDead && Date.now() > destroyTime) {
      this.scene.playerSpawner.aiPlayerDeathTimes.push(destroyTime);
      super.updateName();
      this.healthBar.bar.destroy();
      this.destroy();
      this.nameText.destroy();
    }
  }

  update () {
    super.update();

    // ai specific behavior
    if (!this.isDead) {
      // randomly move
      this.move();

      // randomly find enemies
      this.findEnemy(this.scene.players);

      // randomly level up
      if (this.upgradesAvailable.length > 0) {
        super.levelUp(getRandomInt(1, 4));
      }
    }
  }
}