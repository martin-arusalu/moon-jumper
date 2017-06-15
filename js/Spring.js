class Spring extends createjs.Sprite {
  constructor(platform) {
    super(game.queue.getResult('spring'), "spring");
    this.gotoAndStop("spring");
    this.scaleX = this.scaleY = 0.2;
    this.width = 23.2;
    this.height = 47.6;
    this.x = platform.x + platform.width / 2 - this.width / 2;
    this.y = platform.y - this.height;
    this.platform = platform;
    game.stage.addChild(this);
  }

// Boosting player up  
  boost() {
    this.gotoAndPlay("spring");
    game.lastSprings++;
    game.player.boost = 30;
  }
}