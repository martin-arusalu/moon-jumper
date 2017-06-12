class Powerup extends createjs.Sprite {
  constructor(type, platform) {
    super(game.queue.getResult('spring'), "spring");
    this.gotoAndStop("spring");
    this.scaleX = this.scaleY = 0.2;
    this.width = 23.2;
    this.height = 47.6;
    this.x = platform.x + platform.width / 2 - this.width / 2;
    this.y = platform.y - this.height;
    this.type = type;
    this.platform = platform;
    game.stage.addChild(this);
  }

  boost() {
    this.gotoAndPlay("spring");
    game.lastPowerups++;
    game.player.boost = 30;
  }
}