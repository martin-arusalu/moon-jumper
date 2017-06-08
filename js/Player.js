class Player extends createjs.Sprite {
  constructor() {
    super(new createjs.SpriteSheet(game.queue.getResult('fredJump')), "fred");
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
    this.level = game.levels[0];
    this.moveUp = true;
    this.speed = game.maxSpeed;
    this.x = game.stage.canvas.width / 2 - this.width / 2;
    this.y = game.stage.canvas.height - this.height;
  }

  move() {
    if (game.keys.left && this.x > 0) this.x -= game.moveSpeed;
    if (game.keys.right && this.x < game.stage.canvas.width - this.width) this.x += game.moveSpeed;
  }

  jump() {
    if (this.boost > 0) {
      game.moveUp(game.maxSpeed);
      this.boost--;
    } else if (this.moveUp) {
      if (this.y-200 < 0) {
        game.moveUp(this.speed);
        this.y--;
      }
      else this.y -= this.speed;
      
      this.speed /= game.gravity;
      this.moveUp = this.speed > 1;
    } else {
      this.y += this.speed;
      this.speed *= game.gravity;
      this.speed = Math.min(game.maxSpeed, this.speed);
      this.checkBounce();
    }
  }

  checkBounce() {
    // Fall down
    if (this.y > game.stage.canvas.height) this.moveUp = true;//game.end();
    else {
      for (let p of game.platforms) {
        this.moveUp = p.checkBounce();
        if (this.moveUp) { // Bounce on platform
          this.gotoAndPlay("fred");
          p.bounce();
          this.speed = game.maxSpeed;
          this.position = p.position;
          // New Platforms
          if (this.y < game.platforms[game.platforms.length - 1].y + game.stage.canvas.height) {
            game.platforms.forEach((o, i) => {
              if (o.y > game.stage.canvas.height) {
                game.platforms.splice(i, 1);
                game.stage.removeChild(o);
              }
            });
            game.createPlatforms(game.levels[game.levels.indexOf(this.level) + 1]);
          }

          game.score = Math.floor(Math.max(this.position, game.score));
          break;
        }
      }
    }
  }

}