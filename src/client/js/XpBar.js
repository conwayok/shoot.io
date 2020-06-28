class XpBar {
  constructor (scene, player) {
    this.scene = scene;
    this.player = player;
    this.barWidth = 450;
    this.barHeight = 20;
    this.startX = config.width / 2 - this.barWidth / 2;
    this.startY = 30;
    this.bar = new Phaser.GameObjects.Graphics(scene);
    this.bar.depth = 99;
    scene.add.existing(this.bar);
    this.verticalPadding = 2;
    this.horizontalPadding = 2;
  }

  draw () {
    this.bar.clear();
    // 黑色底色
    this.bar.fillStyle(0x000000);
    this.bar.fillRect(
      this.startX,
      this.startY,
      this.barWidth,
      this.barHeight
    );

    let xpFillWidth = (this.barWidth - 2 * this.horizontalPadding
    ) * (this.player.xp / this.player.requiredLevelUpXp
    );

    // cyan
    this.bar.fillStyle(0x00FFFF);
    this.bar.fillRect(
      this.startX + this.horizontalPadding,
      this.startY + this.verticalPadding,
      xpFillWidth,
      this.barHeight - 2 * this.verticalPadding
    );
  }
}