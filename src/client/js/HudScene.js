class HudScene extends Phaser.Scene {
  constructor () {
    super('HudScene');
  }

  preload () {
    this.load.plugin(
      'rexbbcodetextplugin',
      'lib/rexbbcodetextplugin.min.js',
      true
    );
  }

  create () {
    let mainScene = this.scene.get('MpScene');

    this.localPlayer = mainScene.localPlayer;

    this.xpBar = new XpBar(this, this.localPlayer);
    this.leaderBoard = new LeaderBoard(mainScene, this);
    this.gameFeed = new GameFeed(this);

    mainScene.events.on(GAME_FEED_MESSAGE_EVENT, function (message) {
      this.gameFeed.messages.push(message);
    }, this);

    this.upgradeText = this.add.text(
      config.width / 2,
      (config.height / 10
      ) * 9.5,
      '',
      {
        color: '#ffffff',
        fontSize: 50,
        whiteSpace: { width: 1000 },
        fontStyle: 'Bold',
        align: 'center',
        backgroundColor: '#000000'
      }
    );
    this.upgradeText.originX = 0.5;
    this.upgradeText.setScrollFactor(0);
    this.upgradeText.depth = 99;
  }

  updateUpgradeText () {
    let upgradesAvailableLength = this.localPlayer.upgradesAvailable.length;
    if (upgradesAvailableLength === 0 &&
      this.upgradeText.text.length > 0) {
      this.upgradeText.text = '';

    } else if (upgradesAvailableLength > 0) {
      this.upgradeText.text =
        '可升級 ' + upgradesAvailableLength / 3 +
        ' 次 ' +
        '1)' +
        this.localPlayer.upgradesAvailable[0].getDesc() +
        ' 2)' +
        this.localPlayer.upgradesAvailable[1].getDesc() +
        ' 3)' +
        this.localPlayer.upgradesAvailable[2].getDesc();
    }
  }

  update () {
    this.xpBar.draw();
    this.leaderBoard.update();
    this.gameFeed.update();
    this.updateUpgradeText();
  }
}