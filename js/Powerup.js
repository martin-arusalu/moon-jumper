class Powerup extends createjs.Shape {
  constructor(type, platform) {
    super();
    this.width = this.height = 10;
    this.x = platform.x + platform.width / 2 - this.width / 2;
    this.y = platform.y - this.height;
    this.type = type;
    this.platform = platform;
    this.graphics.beginFill("#111").drawRect(0, 0, this.width, this.height);
    game.stage.addChild(this);
  }

  boost() {
    game.player.boost = 30;
    game.stage.removeChild(this);
    this.platform.booster = undefined;
  }
}