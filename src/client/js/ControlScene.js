class ControlScene extends Phaser.Scene {
  constructor () {
    super('ControlScene');
  }

  preload () {
    let assetsPath = 'assets/';
    // 載入素材
    this.load.image('next', assetsPath + 'next.png');
    this.load.image('text', assetsPath + 'tank_war_text.png');
    this.load.image('tank', assetsPath + 'menu_bg.jpg');
    this.load.image('controls', assetsPath + 'controls.png');
  }

  create () {
    let word = this.add.image(
      config.width / 2,
      config.height / 4,
      'text').setDepth(4);
    word.setOrigin(0.5);
    word.setScale(2);

    let tank = this.add.image(config.width / 2, config.height / 2, 'tank');
    tank.setOrigin(0.5);

    this.add.image(config.width / 2, config.height / 3 * 2, 'controls');

    let next = this.add.image(
      config.width / 2,
      config.height / 7 * 6,
      'next').setScale(0.5);

    next.setInteractive({ useHandCursor: true });
    next.on('pointerdown', () => this.clickButton());
  }

  clickButton () {
    this.scene.start('MpScene');
  }
}
      