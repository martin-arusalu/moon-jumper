class Player extends createjs.Sprite {
  constructor() {
    super(game.queue.getResult('fredJump'), "fred");
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
    // Device rotation
    if (game.tilt) {
      if (game.tilt < 0 && this.x > 0)
        this.x += game.tilt / game.sensitivity;
      if (game.tilt > 0 && this.x < game.stage.canvas.width - this.width)
        this.x += game.tilt / game.sensitivity;
      this.rotation = game.tilt / 2;
    }

    // Arrow keys
    if (game.keys.left && this.x > 0) {
      this.x -= game.moveSpeed;
      createjs.Tween.get(this).to({ rotation: -10 }, 100).to({ rotation: 0 }, 200);
    }
    if (game.keys.right && this.x < game.stage.canvas.width - this.width) {
      this.x += game.moveSpeed;
      createjs.Tween.get(this).to({ rotation: 10 }, 100).to({ rotation: 0 }, 200);
    }
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
    if (this.y + this.height - game.maxSpeed > game.stage.canvas.height) game.end();
    else {
      for (let p of game.platforms) {
        this.moveUp = p.checkBounce();
        if (this.moveUp) { // Bounce on platform
          // Animation
          this.gotoAndPlay("fred");
          p.bounce();
          this.speed = game.maxSpeed;
          this.position = p.position;

          // Evil impossible jumps near the end
          if (this.position > 300000000) this.level.rarity = 20;
          
          // Levelup
          if (this.position > this.level.points) {
            this.level = game.levels[game.levels.indexOf(this.level) + 1];
          }

          // Remove passed platforms
          game.platforms.filter(o => o.y > game.stage.canvas.height).forEach(o => o.clear());
          // New Platforms
          game.createPlatforms();

          game.score = Math.floor(Math.max(this.position, game.score));
          if (game.score > game.highScore && !game.onRecord) {
            game.onRecord = true;
            let notification = new createjs.Text('New High!', '50px riffic', '#fdff66');
            notification.x = game.stage.canvas.width / 2;
            notification.y = game.stage.canvas.height / 2;
            notification.textAlign = "center";
            notification.textBaseline = "middle";
            game.stage.addChild(notification);
            createjs.Tween.get(notification)
              .wait(500)
              .to({ alpha: 0 }, 1000)
              .call(() => game.stage.removeChild(notification));
          }
          break;
        }
      }
    }
  }

}