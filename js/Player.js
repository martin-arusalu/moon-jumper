export default class Player extends window.createjs.Sprite {
  constructor(game){
    super(game.queue.getResult('fredJump'), 'fred');
    this.game = game;
    this.scaleX = this.scaleY = 0.5;
    this.height = 163.5;
    this.width = 90.5;
    this.hitWidth = this.width / 3;
    this.position = 0;
    this.boost = 0;
    this.reset();
    game.stage.addChild(this);
  }

  reset() {
    this.level = this.game.levels[0];
    this.moveUp = true;
    this.speed = this.game.maxSpeed;
    this.x = this.game.stage.canvas.width / 2 - this.width / 2;
    this.y = this.game.stage.canvas.height - this.height;
  }

  move() {
    // Device rotation
    if (this.game.tilt) {
      if (this.game.tilt < 0 && this.x > 0)
        this.x += this.game.tilt / this.game.sensitivity;
      if (this.game.tilt > 0 && this.x < this.game.stage.canvas.width - this.width)
        this.x += this.game.tilt / this.game.sensitivity;
      this.rotation = this.game.tilt / 2;
    }

    // Arrow keys
    if (this.game.keys.left && this.x > 0) {
      this.x -= this.game.moveSpeed;
      window.createjs.Tween.get(this).to({ rotation: -10 }, 100).to({ rotation: 0 }, 200);
    }
    if (this.game.keys.right && this.x < this.game.stage.canvas.width - this.width) {
      this.x += this.game.moveSpeed;
      window.createjs.Tween.get(this).to({ rotation: 10 }, 100).to({ rotation: 0 }, 200);
    }
  }

  jump() {
    if (this.boost > 0) {
      this.game.moveUp(this.game.maxSpeed);
      this.boost--;
    } else if (this.moveUp) {
      if (this.y-200 < 0) {
        this.game.moveUp(this.speed);
        this.y--;
      }
      else this.y -= this.speed;
      
      this.speed /= this.game.gravity;
      this.moveUp = this.speed > 1;
    } else {
      this.y += this.speed;
      this.speed *= this.game.gravity;
      this.speed = Math.min(this.game.maxSpeed, this.speed);
      this.checkBounce();
    }
  }

  checkBounce() {
    // Fall down
    if (this.y + this.height - this.game.maxSpeed > this.game.stage.canvas.height) this.game.end();
    else {
      for (let p of this.game.platforms) {
        this.moveUp = p.checkBounce();
        if (this.moveUp) { // Bounce on platform
          // Animation
          this.gotoAndPlay('fred');
          p.bounce();
          this.speed = this.game.maxSpeed;
          this.position = p.position;

          // Evil impossible jumps near the end
          if (this.position > 300000000) this.level.rarity = 20;
          
          // Levelup
          if (this.position > this.level.points) {
            this.level = this.game.levels[this.game.levels.indexOf(this.level) + 1];
          }

          // Remove passed platforms
          this.game.platforms.filter(o => o.y > this.game.stage.canvas.height).forEach(o => o.clear());
          // New Platforms
          this.game.createPlatforms();

          this.game.score = Math.floor(Math.max(this.position, this.game.score));
          if (this.game.score > this.game.highScore && !this.game.onRecord) {
            this.game.onRecord = true;
            let notification = new window.createjs.Text('New High!', '50px riffic', '#fdff66');
            notification.x = this.game.stage.canvas.width / 2;
            notification.y = this.game.stage.canvas.height / 2;
            notification.textAlign = 'center';
            notification.textBaseline = 'middle';
            this.game.stage.addChild(notification);
            window.createjs.Tween.get(notification)
              .wait(500)
              .to({ alpha: 0 }, 1000)
              .call(() => this.game.stage.removeChild(notification));
          }
          break;
        }
      }
    }
  }

}