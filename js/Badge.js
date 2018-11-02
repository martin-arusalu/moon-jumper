
export default class Badge extends window.createjs.Sprite {
  constructor(id, game) {
    super(game.queue.getResult('badges'), game.allBadges[id].type);
    this.game = game;
    this.scaleX = this.scaleY = 0.3;
    this.width = 150;
    this.height = 112.8;
    this.x = game.stage.canvas.width / 2 - this.width / 2;
    this.y = 500;
    this.data = game.allBadges[id];

    this.txt = new window.createjs.Text(this.data.text, '40px riffic', '#fdff66');
    this.txt.x = game.stage.canvas.width / 2;
    this.txt.textAlign = 'center';
    this.txt.y = this.y + this.height + 10;

    // If there are more than one achievement to show, show them in order and with 3s intervals   
    window.setTimeout(() => {
      let container = new window.createjs.Container();
      container.addChild(this, this.txt);
      game.stage.addChild(container);
      window.createjs.Sound.play('newBadge');
      window.createjs.Tween.get(container)
        .wait(1000)
        .to({ alpha: 0 }, 3000)
        .call(() => {
          game.stage.removeChild(container);
          game.newBadges--;
        });
    }, 3000 * game.newBadges);
    game.newBadges++;

    game.badges.push(id);
  }

  static checkForNewBadges() {
    // If badges are loaded
    if (this.game.allBadges != undefined) {
      this.game.allBadges.forEach((o, i) => {
        // If player doesn't have this badge 
        if (this.game.badges.indexOf(i) < 0) {
          let comparable = 0;
          // Which value to compare
          switch (o.property) {
          case 'level': comparable = this.game.levels.indexOf(this.game.player.level); break;
          case 'totalScore': comparable = this.game.totalScore + (this.game.started ? this.game.score : 0); break;
          case 'timer': comparable = this.game.started ? Date.now() - this.game.timer : 0; break;
          case 'totalTime': comparable = this.game.totalTime + (this.game.started ? Date.now() - this.game.timer : 0); break;
          case 'totalPlatforms': comparable = this.game.totalPlatforms + (this.game.started ? this.game.lastPlatforms : 0); break;
          case 'totalSprings': comparable = this.game.totalSprings + (this.game.started ? this.game.lastSprings : 0); break;
          default: comparable = this.game[o.property]; break;
          }

          // If challenge completed create a new badge
          if (comparable >= o.value) new Badge(i);
        }
      });
    }
  }
}