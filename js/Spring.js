export default class Spring extends window.createjs.Sprite {
  constructor(platform, game) {
    super(game.queue.getResult('spring'), 'spring');
    this.game = game;
    this.gotoAndStop('spring');
    this.scaleX = this.scaleY = 0.2;
    this.width = 23.3;
    this.height = 47.6;
    this.x = platform.x + platform.width / 2 - this.width / 2;
    this.y = platform.y - this.height;
    this.platform = platform;
    game.stage.addChild(this);
  }

  boost() {
    this.gotoAndPlay('spring');
    this.game.lastSprings++;
    this.game.player.boost = 30;
  }
}