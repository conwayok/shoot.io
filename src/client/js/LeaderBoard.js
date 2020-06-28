class LeaderBoard {
  constructor (scene) {
    this.scoreBoardStr = '';
    this.textObj = new Phaser.GameObjects.Text(scene, 10, 10,
      this.scoreBoardStr,
      {
        color: '#000000',
        backgroundColor: '#FFFFFF',
        fontSize: 15,
        whiteSpace: { width: 1000 },
        fontStyle: 'Bold'
      }
    );
    this.textObj.depth = 99;
    this.textObj.setScrollFactor(0);
    scene.add.existing(this.textObj);
    this.scene = scene;
  }

  update () {
    let players = this.scene.players.children.entries.slice(0);
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