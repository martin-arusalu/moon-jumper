class Platform extends createjs.Sprite {
  constructor(level) {
    let type = "regular";
    if (Math.random() * level.platforms.onebounce < 1) type = "onebounce";
    if (Math.random() * level.platforms.moving < 1) type = "moving";

    super(new createjs.SpriteSheet(game.queue.getResult('platforms')), type);
    this.type = type;
    this.scaleX = this.scaleY = 0.15;
    this.width = 75;
    this.height = 25;

    /*if (this.type == "branch") {
      this.scaleX = this.scaleY = 0.18;
      this.width = 85;
    }*/
    this.bounces = 0;
    this.dir = "right";
    let platforms = game.platforms.length;
    if (platforms > 0) {
      let l = game.platforms[platforms - 1];
      this.y = l.y - this.height - Math.random() * (game.maxSpeed * level.rarity);
      this.x = Math.random() * (game.stage.canvas.width - this.width);
    } else {
      this.y = game.stage.canvas.height - this.height - 5;
      this.x = game.stage.canvas.width / 2 - this.width / 2;
    }
    this.position = game.position + (this.y - game.stage.canvas.height) * -1;

    if (Math.random() > 0.8) this.powerup = new Powerup("spring", this);

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
        this.x++;
        if (this.powerup != undefined) this.powerup.x++;
      }
      else this.dir = "left";
    } else {
      if (this.x > 0) {
        this.x--;
        if (this.powerup != undefined) this.powerup.x--;
      }
      else this.dir = "right";
    }
  }

  bounce() {
    this.bounces++;
    if (this.type == "onebounce") {
      if (this.bounces >= 1) {
        game.stage.removeChild(this);
        game.platforms.splice(game.platforms.indexOf(this), 1);
      }
    }
    if (this.powerup != undefined) this.powerup.boost();
  }

}