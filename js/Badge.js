class Badge extends createjs.Sprite {
  constructor(id) {
    super(game.queue.getResult('badges'), game.allBadges[id].type);
    this.scaleX = this.scaleY = 0.3;
    this.width = 150;
    this.height = 112.8;
    this.x = game.stage.canvas.width / 2 - this.width / 2;
    this.y = 500;
    this.data = game.allBadges[id];

    this.txt = new createjs.Text(this.data.text, '40px riffic', '#fdff66');
    this.txt.x = game.stage.canvas.width / 2;
    this.txt.textAlign = "center";
    this.txt.y = this.y + this.height + 10;

    // If there are more than one achievement to show, show them in order and with 4s intervals   
    window.setTimeout(() => {
      let container = new createjs.Container();
      container.addChild(this, this.txt);
      game.stage.addChild(container);
      createjs.Sound.play('newBadge');
      createjs.Tween.get(container)
        .wait(1000)
        .to({ alpha: 0 }, 3000)
        .call(() => {
          game.stage.removeChild(container);
          game.newBadges--;
        });
    }, 4000 * game.newBadges);
    game.newBadges++;

    game.badges.push(id);
    let t = new Date(Date.now() + 100000000000);
    document.cookie = "badges=" + game.badges.join(',') + "; expires=" + t.toGMTString() + ";";
  }

  static getFromCookie() {
    let s = getCookie('badges');
    // If there is a cookie (which is numbers separated with commas)
      // split the numbers to make an array of string numbers
      // Then create a new array by converting every string to number
    if (s) return s.split(',').map(Number);
    // If no cookie, return empty array.  
    else return [];
  }

  static checkForNewBadges() {
    // If badges are loaded
    if (game.allBadges != undefined) {
      game.allBadges.forEach((o, i) => {
        // If player doesn't have this badge 
        if (game.badges.indexOf(i) < 0) {
          let comparable = 0;
          // Which value to compare
          switch (o.property) {
            case 'level': comparable = game.levels.indexOf(game.player.level); break;
            case 'totalScore': comparable = game.totalScore + (game.started ? game.score : 0); break;
            case 'timer': comparable = game.started ? Date.now() - game.timer : 0; break;
            case 'totalTime': comparable = game.totalTime + (game.started ? Date.now() - game.timer : 0); break;
            case 'totalPlatforms': comparable = game.totalPlatforms + (game.started ? game.lastPlatforms : 0); break;
            case 'totalSprings': comparable = game.totalSprings + (game.started ? game.lastSprings : 0); break;
            default: comparable = game[o.property]; break;
          }

          // If challenge completed create a new badge
          if (comparable >= o.value) new Badge(i);
        }
      });
    }
  }
}