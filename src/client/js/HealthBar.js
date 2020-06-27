class HealthBar {

  constructor (scene, player) {
    this.bar = new Phaser.GameObjects.Graphics(scene);
    this.gap = -35;
    this.player = player;
    let pos = this.calcPos();
    this.x = pos.x;
    this.y = pos.y;
    this.height = 10;
    scene.add.existing(this.bar);
  }

  calcPos () {
    let x = this.player.x - (this.width / 2
    );
    let y = this.player.y + this.gap;
    return { x: x, y: y };
  }

  draw () {
    let hp = this.player.hp;
    this.width = hp * 7;
    this.bar.clear();
    //  Health
    let pos = this.calcPos();
    this.bar.fillStyle(0xff0000);
    this.bar.fillRect(pos.x, pos.y, this.width, this.height);
  }
}
