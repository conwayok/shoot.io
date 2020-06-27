class Heart extends Phaser.Physics.Arcade.Sprite {
  constructor (scene, spawnX, spawnY, heartId) {
    super(scene, spawnX, spawnY, 'heart');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.scene = scene;
    this.id = heartId;
  }

  static playerOverlapHeart (player, heart) {
    player.hp += 1;
    let id = heart.id;
    heart.destroy();
    this.socket.emit(HEART_CONSUME_EVENT, id);
  }
}

class XpConsumable extends Phaser.Physics.Arcade.Sprite {
  constructor (scene, spawnX, spawnY, target, xpId, range) {
    super(scene, spawnX, spawnY, 'xp');
    this.scale = 0.5;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.scene = scene;

    this.id = xpId;

    this.startX = spawnX;
    this.startY = spawnY;

    this.direction = Math.atan((target.x - this.x
    ) / (target.y - this.y
    ));

    let speed = 1000;

    this.range = range;

    // Calculate X and y velocity of bullet to move it from shooter to target
    if (target.y >= this.y) {
      this.xSpeed = speed * Math.sin(this.direction);
      this.ySpeed = speed * Math.cos(this.direction);
    } else {
      this.xSpeed = -speed * Math.sin(this.direction);
      this.ySpeed = -speed * Math.cos(this.direction);
    }
  }

  static playerOverlapXp (player, xp) {
    player.xp += 1;
    player.totalXp += 1;
    let id = xp.id;
    xp.destroy();
    this.socket.emit(XP_CONSUME_EVENT, id);
  }

  preUpdate () {
    let travelDistance = calcDistance(this.startX, this.startY, this.x, this.y);
    if (this.y < 20 ||
      this.y > config.height ||
      this.x < 20 ||
      this.x > config.width || travelDistance > this.range) {
      this.xSpeed = 0;
      this.ySpeed = 0;
      this.setVelocityY(this.ySpeed);
      this.setVelocityX(this.xSpeed);
    }
  }

  run () {
    this.setVelocityY(this.ySpeed);
    this.setVelocityX(this.xSpeed);
  }
}