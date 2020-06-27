// todo: front shield, add shooting direction

class Upgrade {

  getDesc () {
    return '無';
  }

  applyTo (user) {
    // override this function
  }
}

class DoubleHpUpgrade extends Upgrade {

  getDesc () {
    return '血量乘二';
  }

  applyTo (user) {
    user.hp *= 2;
  }
}

class ShrinkSelfUpgrade extends Upgrade {

  getDesc () {
    return '縮小20%';
  }

  applyTo (user) {
    user.scale *= 0.8;
    user.scene.socket.emit(PLAYER_UPDATE_EVENT, { scale: user.scale });
  }
}

class WideBulletUpgrade extends Upgrade {

  getDesc () {
    return '寬子彈';
  }

  applyTo (user) {
    user.bulletType = BULLET_TYPE.WIDE;
  }
}

class PenetrationBulletUpgrade extends Upgrade {

  getDesc () {
    return '穿透子彈';
  }

  applyTo (user) {
    user.bulletType = BULLET_TYPE.PENETRATION;
  }
}

class SpeedUpgrade extends Upgrade {
  static desc = '血量乘二';

  getDesc () {
    return '移動速度+20%';
  }

  applyTo (user) {
    user.speed *= 1.2;
  }
}

class FireRateUpgrade extends Upgrade {

  getDesc () {
    return '射速+20%';
  }

  applyTo (user) {
    user.secondsPerShot *= 0.8;
  }
}

let UPGRADES = [
  new DoubleHpUpgrade(),
  new ShrinkSelfUpgrade(),
  new WideBulletUpgrade(),
  new SpeedUpgrade(),
  new FireRateUpgrade(),
  new PenetrationBulletUpgrade()
];

function getThreeRandomUpgrades () {
  shuffleArray(UPGRADES);
  return [UPGRADES[0], UPGRADES[1], UPGRADES[2]];
}