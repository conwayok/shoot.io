class Heart extends Phaser.Physics.Arcade.Sprite {
  constructor (scene, spawnX, spawnY) {
    super(scene, spawnX, spawnY, 'heart');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.scene = scene;
  }

  static overlapPlayer (heart, player) {
    player.hp += 1;
    heart.destroy();
  }
}

class XpConsumable extends Phaser.Physics.Arcade.Sprite {
  constructor (scene, spawnX, spawnY, target) {
    super(scene, spawnX, spawnY, 'xp');
    this.scale = 0.5;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.scene = scene;

    this.startX = spawnX;
    this.startY = spawnY;

    this.direction = Math.atan((target.x - this.x
    ) / (target.y - this.y
    ));

    let speed = 1000;

    this.range = getRandomInt(50, 150);

    // Calculate X and y velocity of bullet to move it from shooter to target
    if (target.y >= this.y) {
      this.xSpeed = speed * Math.sin(this.direction);
      this.ySpeed = speed * Math.cos(this.direction);
    } else {
      this.xSpeed = -speed * Math.sin(this.direction);
      this.ySpeed = -speed * Math.cos(this.direction);
    }
  }

  static overlapPlayer (xp, player) {
    player.xp += 1;
    player.totalXp += 1;
    xp.destroy();
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