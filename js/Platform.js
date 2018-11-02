import Spring from './Spring.js';
export default class Platform extends window.createjs.Sprite {
  constructor(level, game) {
    let type = 'regular';
    if (Math.random() * level.platforms.onebounce < 1) type = 'onebounce';
    if (Math.random() * level.platforms.moving < 1) type = 'moving';

    super(game.queue.getResult('platforms'), type);
    this.game = game;
    this.gotoAndStop(type);
    this.type = type;
    this.scaleX = this.scaleY = 0.15;
    this.width = 75;
    this.height = 25;
    this.bounces = 0;
    this.dir = 'right';
    let platforms = game.platforms.length;
    this.level = level;
    this.speed = Math.random() * this.level.platformMovingSpeed;
    if (platforms > 0) { // If more than platforms, place the new one within the reach of a jump
      let l = game.platforms[platforms - 1];
      this.y = l.y - this.height - Math.random() * (game.maxSpeed * level.rarity);
      this.x = Math.random() * (game.stage.canvas.width - this.width);
    } else { // If first platform, put it in the bottom center of the screen
      this.y = game.stage.canvas.height - this.height - 5;
      this.x = game.stage.canvas.width / 2 - this.width / 2;
    }
    this.position = game.position + (this.y - game.stage.canvas.height) * -1;

    // Randomly spawn a spring
    if (Math.random() > 0.9) this.spring = new Spring(this, game);

    game.stage.addChild(this);
    game.platforms.push(this);
  }

  checkBounce() {
    // Basicly a hit test but only to check if players feet touch the top of the platform
    return !(this.game.player.x + this.game.player.width / 2 - this.game.player.hitWidth / 2 >= this.x + this.width ||
      this.game.player.x + this.game.player.width / 2 + this.game.player.hitWidth / 2 <= this.x ||
      this.game.player.y + this.game.player.height >= this.y + this.height ||
      this.game.player.y + this.game.player.height < this.y);
  }

  // For moving platforms  
  move() {
    if (this.dir == 'right') {
      if (this.x < this.game.stage.canvas.width - this.width) {
        this.x += this.speed;
        // If platform has a spring, move it as well
        if (this.spring != undefined) this.spring.x += this.speed;
      }
      else this.dir = 'left';
    } else {
      if (this.x > 0) {
        this.x -= this.speed;
        // If platform has a spring, move it as well 
        if (this.spring != undefined) this.spring.x -= this.speed;
      }
      else this.dir = 'right';
    }
  }

  // Player lands on a platform  
  bounce() {
    this.bounces++;
    this.game.lastPlatforms++;

    // Sound
    if (this.type == 'moving') window.createjs.Sound.play('jump1');
    else window.createjs.Sound.play('jump2');

    // If a sandstone    
    if (this.type == 'onebounce') {
      window.createjs.Sound.play('crack2');
      window.createjs.Tween.get(this)
        // Make it fall down  
        .to({ y: this.game.stage.canvas.height + 100 }, 500, window.createjs.Ease.circIn)
        .call(this.clear);
      if (this.spring) {
        window.createjs.Tween.get(this.spring)
          // Make the spring fall down with the platform  
          .to({ y: this.game.stage.canvas.height + 100 }, 500, window.createjs.Ease.circIn);
      }
    }
    if (this.spring) {
      this.game.springStreak++;
      this.game.bestSpringStreak = Math.max(this.game.springStreak, this.game.bestSpringStreak);
      let spring = window.createjs.Sound.play('boost');
      spring.volume = 0.8;
      this.spring.boost();
    } else this.game.springStreak = 0;
  }

  clear() {
    this.game.stage.removeChild(this);
    if (this.spring) this.game.stage.removeChild(this.spring);
    this.game.platforms.splice(this.game.platforms.indexOf(this), 1);
  }

}