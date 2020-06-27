class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor (scene, shooter, target, texture = 'bullet') {
    super(scene, shooter.x, shooter.y, texture);
    scene.physics.world.enable(this);
    scene.add.existing(this);

    this.startX = shooter.x;
    this.startY = shooter.y;

    this.shooter = shooter;

    this.direction = Math.atan((target.x - this.x
    ) / (target.y - this.y
    ));

    this.speed = 1000;

    this.range = 500;

    this.damage = 1;

    this.type = BULLET_TYPE.NORMAL;

    // Calculate X and y velocity of bullet to move it from shooter to target
    if (target.y >= this.y) {
      this.xSpeed = this.speed * Math.sin(this.direction);
      this.ySpeed = this.speed * Math.cos(this.direction);
    } else {
      this.xSpeed = -this.speed * Math.sin(this.direction);
      this.ySpeed = -this.speed * Math.cos(this.direction);
    }

    this.rotation = shooter.rotation + Math.PI / 2; // angle bullet with shooters rotation
  }

  static bulletHitPlayer (bullet, player) {
    let shooter = bullet.shooter;
    if (player === shooter) return;
    player.takeDamage(bullet);

    // 穿透式子彈打到人會直接穿過去
    if (bullet.type !== BULLET_TYPE.PENETRATION)
      bullet.destroy();
  }

  preUpdate () {
    let travelDistance = calcDistance(this.startX, this.startY, this.x, this.y);
    if (this.y < 0 ||
      this.y > config.height ||
      this.x < 0 ||
      this.x > config.width || travelDistance > this.range) {
      this.destroy();
    }
  }

  run () {
    this.setVelocityY(this.ySpeed);
    this.setVelocityX(this.xSpeed);
  }
}

class WideBullet extends Bullet {
  constructor (scene, shooter, target) {
    super(scene, shooter, target, 'wide_bullet');
    this.type = BULLET_TYPE.WIDE;
  }
}

class PenetrationBullet extends Bullet {
  constructor (scene, shooter, target) {
    super(scene, shooter, target, 'penetration_bullet');
    this.range = 1500;
    this.type = BULLET_TYPE.PENETRATION;
  }
}

const BULLET_TYPE = { NORMAL: 1, WIDE: 2, PENETRATION: 3 };