class MenuScene extends Phaser.Scene {
  constructor () {
    super('MenuScene');
  }

  preload () {
    let assetsPath = 'assets/';
    // 載入素材
    this.load.image('tank', assetsPath + 'menu_bg.jpg');
    this.load.image('start', assetsPath + 'start.png');
    this.load.image('text', assetsPath + 'tank_war_text.png');
    this.load.audio('bgmusic', assetsPath + 'bgm_2.wav');

  }

  create () {
    let word = this.add.image(config.width / 2, config.height / 4, 'text')
                   .setDepth(4);
    word.setOrigin(0.5);
    word.setScale(2);

    let startText = this.add.text(
      config.width / 2,
      config.height / 3 * 2,
      'Press Start To Play',
      {
        color: '#ffffff',
        fontSize: 80,
        whiteSpace: { width: 100 },
        fontStyle: 'Bold',
        align: 'center',
        backgroundColor: '#000000'
      }
    ).setDepth(3);

    startText.setOrigin(0.5);

    this.add.image(config.width / 2, config.height / 2, 'tank');

    let startImage = this.add.image(
      config.width / 2,
      config.height / 4 * 3,
      'start');
    startImage.setInteractive({ useHandCursor: true });
    startImage.on('pointerdown', () => this.clickButton());

    let c = this.sound.add('bgmusic', { loop: true });
    c.play();
  }

  clickButton () {
    this.scene.start('ControlScene');
  }
}
    