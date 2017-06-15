class Platform extends createjs.Sprite {
  constructor(level) {
    let type = "regular";
    if (Math.random() * level.platforms.onebounce < 1) type = "onebounce";
    if (Math.random() * level.platforms.moving < 1) type = "moving";

    super(game.queue.getResult('platforms'), type);
    this.gotoAndStop(type);
    this.type = type;
    this.scaleX = this.scaleY = 0.15;
    this.width = 75;
    this.height = 25;
    this.bounces = 0;
    this.dir = "right";
    let platforms = game.platforms.length;
    this.level = level;
    this.speed = Math.random() * this.level.platformMovingSpeed;
    if (platforms > 0) {
      let l = game.platforms[platforms - 1];
      this.y = l.y - this.height - Math.random() * (game.maxSpeed * level.rarity);
      this.x = Math.random() * (game.stage.canvas.width - this.width);
    } else {
      this.y = game.stage.canvas.height - this.height - 5;
      this.x = game.stage.canvas.width / 2 - this.width / 2;
    }
    this.position = game.position + (this.y - game.stage.canvas.height) * -1;

    // Randomly spawn a spring
    if (Math.random() > 0.9) this.spring = new Spring(this);

    game.stage.addChild(this);
    game.platforms.push(this);
  }

  checkBounce() {
    return !(game.player.x + game.player.width / 2 - game.player.hitWidth / 2 >= this.x + this.width ||
      game.player.x + game.player.width / 2 + game.player.hitWidth / 2 <= this.x ||
      game.player.y + game.player.height >= this.y + this.height ||
      game.player.y + game.player.height < this.y);
  }

  move() {
    if (this.dir == "right") {
      if (this.x < game.stage.canvas.width - this.width) {
        this.x += this.speed;
        if (this.spring != undefined) this.spring.x += this.speed;
      }
      else this.dir = "left";
    } else {
      if (this.x > 0) {
       this.x -= this.speed;
       if (this.spring != undefined) this.spring.x -= this.speed;
      }
      else this.dir = "right";
    }
  }

  bounce() {
    this.bounces++;
    game.lastPlatforms++;

    // Sound
    if (this.type == "moving") createjs.Sound.play('jump1');
    else createjs.Sound.play('jump2');

    if (this.type == "onebounce") {
      createjs.Sound.play('crack2');
      createjs.Tween.get(this)
        .to({ y: game.stage.canvas.height + 100 }, 500, createjs.Ease.circIn)
        .call(() => {
          game.platforms.splice(game.platforms.indexOf(this), 1);
          game.stage.removeChild(this);
        });
      if (this.spring) {
        createjs.Tween.get(this.spring)
          .to({ y: game.stage.canvas.height + 100 }, 500, createjs.Ease.circIn);
      }
    }
    if (this.spring) {
      game.springStreak++;
      game.bestSpringStreak = Math.max(game.springStreak, game.bestSpringStreak);
      let spring = createjs.Sound.play('boost');
      spring.volume = 0.8;
      this.spring.boost();
    } else {
      game.springStreak = 0;
    }
  }

  clear() {
    game.stage.removeChild(this);
    if (this.spring) game.stage.removeChild(this.spring);
    game.platforms.splice(game.platforms.indexOf(this), 1);
  }

}