class Upgrade {

  getDesc () {
    return '無';
  }

  applyTo (user) {
    // override this function
  }
}

class TripleHpUpgrade extends Upgrade {

  getDesc () {
    return '血量乘3';
  }

  applyTo (user) {
    user.hp *= 3;
  }
}

class ShrinkSelfUpgrade extends Upgrade {

  getDesc () {
    return '縮小60%';
  }

  applyTo (user) {
    user.scale *= 0.6;
    user.scene.socket.emit(PLAYER_UPDATE_EVENT, { scale: user.scale });
  }
}

class WideBulletUpgrade extends Upgrade {

  getDesc () {
    return '寬子彈';
  }

  applyTo (user) {
    user.bulletType = BULLET_TYPE.WIDE;
    user.scene.socket.emit(
      PLAYER_UPDATE_EVENT,
      { bulletType: user.bulletType });
  }
}

class PenetrationBulletUpgrade extends Upgrade {

  getDesc () {
    return '遠程子彈';
  }

  applyTo (user) {
    user.bulletType = BULLET_TYPE.PENETRATION;
    user.scene.socket.emit(
      PLAYER_UPDATE_EVENT,
      { bulletType: user.bulletType });
  }
}

class SpeedUpgrade extends Upgrade {

  getDesc () {
    return '移動速度+50%';
  }

  applyTo (user) {
    user.speed *= 1.5;
  }
}

class FireRateUpgrade extends Upgrade {

  getDesc () {
    return '射速+40%';
  }

  applyTo (user) {
    user.secondsPerShot *= 0.6;
  }
}

let UPGRADES = [
  new TripleHpUpgrade(),
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