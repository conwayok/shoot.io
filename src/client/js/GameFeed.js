class GameFeed {
  static TTL = 1500;

  constructor (scene) {
    this.maxDisplayMessage = 5;
    this.scene = scene;
    this.messages = [];
    this.feed = new RexPlugins.GameObjects.BBCodeText(
      scene,
      (config.width / 10
      ) * 7.5,
      30,
      '', {
        fontSize: '20px',
        fontFamily: 'Consolas',
        color: '#000000',
        // backgroundColor: '#000000',
        align: 'center'
      },
      true
    );
    this.feed.depth = 99;
    this.feed.setScrollFactor(0);
    scene.add.existing(this.feed);
  }

  update () {

    let now = Date.now();

    let remaining = [];

    // clear outdated messages
    for (let i = 0; i < this.messages.length; ++i) {
      let m = this.messages[i];
      if (m.expireTime > now) remaining.push(m);
    }

    this.messages = remaining;

    let messageBBStr = '';

    let iterationLength = this.maxDisplayMessage;
    if (iterationLength >
      this.messages.length) iterationLength = this.messages.length;

    for (let i = 0; i < iterationLength; ++i) {
      messageBBStr += this.messages[i].text;
      if (i < iterationLength - 1) messageBBStr += '\n';
    }
    this.feed.text = messageBBStr;
  }
}

class GameFeedMessage {
  constructor (text, expireTime) {
    this.text = text;
    this.expireTime = expireTime;
  }
}

function getKillMessage (killer, killed) {
  let text = '[b]' + killer.name + '[/b]' +
    '[color=red] KILLED [/color]' +
    '[b]' + killed.name + '[/b]';
  return new GameFeedMessage(text, Date.now() + GameFeed.TTL);
}