class LeaderBoard {
  constructor (mainScene, hudScene) {
    this.scoreBoardStr = '';
    this.textObj = new Phaser.GameObjects.Text(hudScene, 10, 10,
      this.scoreBoardStr,
      {
        color: '#000000',
        backgroundColor: '#FFFFFF',
        fontSize: 30,
        whiteSpace: { width: 1000 },
        fontStyle: 'Bold'
      }
    );
    this.textObj.depth = 99;
    this.textObj.setScrollFactor(0);
    hudScene.add.existing(this.textObj);
    this.mainScene = mainScene;
  }

  update () {
    let players = this.mainScene.players.children.entries.slice(0);
    players.sort(function (a, b) {
      return b.totalXp - a.totalXp;
    });

    this.scoreBoardStr = '';

    let maxI = 5;
    if (players.length < 5) maxI = players.length;

    for (let i = 0; i < maxI; ++i) {
      let player = players[i];
      this.scoreBoardStr += player.name + ':' + player.totalXp + '\n';
    }

    this.textObj.text = this.scoreBoardStr;
  }
}