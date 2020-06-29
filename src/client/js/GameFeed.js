class GameFeed {
  static TTL = 1500;

  constructor (hudScene) {
    this.maxDisplayMessage = 5;
    this.messages = [];
    this.feed = new RexPlugins.GameObjects.BBCodeText(
      hudScene,
      (config.width / 10
      ) * 7.5,
      30,
      '', {
        fontSize: '40px',
        fontFamily: 'Consolas',
        color: '#000000',
        align: 'center',
        backgroundColor: '#FFFFFF'
      },
      true
    );
    this.feed.depth = 99;
    this.feed.setScrollFactor(0);
    hudScene.add.existing(this.feed);
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
  let text = '[b]' + killer.name + '[color=blue] KILLED [/color]' +
    killed.name + '[/b]';
  return new GameFeedMessage(text, Date.now() + GameFeed.TTL);
}

function getJoinedMessage (name) {
  let text = '[b]' + name + '[color=green] JOINED[/color][/b]';
  return new GameFeedMessage(text, Date.now() + GameFeed.TTL);
}

function getDisconnectedMessage (name) {
  let text = '[b]' + name + '[color=red] DISCONNECTED[/color][/b]';
  return new GameFeedMessage(text, Date.now() + GameFeed.TTL);
}