/* TODO:
1. Boost animation
2. Improve platform designs
3. Level backgrounds -
  Clouds (+sun?),
  Airplanes and dark blue sky
  Stars and very dark blue sky
4. Start and end screens
5. Levelup show design + extra notifications during game
6. Powerups - ideas, code, design
7. Sounds - backtrack, fx (jump, powerup, breaking, dying)
9. Player selection - boy or girl
10. Missions

BUGS:
- Tilting on mobile
- Make jumping animation more realistic
*/

let game = {
  started: false,
  highScore: 0,
  maxSpeed: 20,
  moveSpeed: 7,
  gravity: 1.09
}

game.init = () => {
  game.stage = new createjs.Stage('myCanvas');
  // Ref: https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie
  let cookieHighScore = document.cookie.replace(/(?:(?:^|.*;\s*)highScore\s*\=\s*([^;]*).*$)|^.*$/, "$1");
  // End of ref
  if (cookieHighScore.length > 0)
    game.highScore = Math.max(new Number(cookieHighScore), game.highScore);
  game.load();
  createjs.Ticker.addEventListener('tick', game.onTick);
  createjs.Ticker.setFPS(60);
}

game.load = () => {
  game.loading = new createjs.Text("Loading", "30px Helvetica", "#fff");
  game.loading.textBaseline = "middle";
  game.loading.textAlign = "center";
  game.loading.x = game.stage.canvas.width / 2;
  game.loading.y = game.stage.canvas.height / 2;
  game.stage.addChild(game.loading);
  
  game.queue = new createjs.LoadQueue(true);
  game.queue.installPlugin(createjs.Sound);
  game.queue.on("progress", game.progress);
  game.queue.on('complete', game.showStartScreen);
  game.queue.loadManifest([
    { id: "levels", src: "js/levels.json" },
    { id: "bg1", src: "graphics/lvl1bg.png" },
    { id: "bg2", src: "graphics/lvl2bg.png" },
    { id: "bg3", src: "graphics/lvl3bg.png" },
    { id: "fredJump", src: "graphics/fredJump/fredJump.json" },
    { id: "platforms", src: "graphics/platforms/platforms.json" }
  ]);
}

game.progress = e => {
  let percent = Math.round(e.progress * 100);
  game.loading.text = "Loading: " + percent + "%";
  game.stage.update()
}
//deviceorientation

game.showStartScreen = () => {
  game.stage.removeAllChildren();
  let title = new createjs.Text("Fly me to the moon", "20px Helvetica", "#111");
  title.y = 100;
  let hs = new createjs.Text("Your high score is: " + game.highScore, "16px Helvetica", "#111");
  hs.y = 130;
  let tut = new createjs.Text("Press arrow keys to move left and right", "12px Helvetica", "#111");
  tut.y = 150;

  let startBtn = new createjs.Shape();
  startBtn.width = 200;
  startBtn.height = 50;
  startBtn.graphics.beginFill('#111').drawRect(0, 0, startBtn.width, startBtn.height);
  startBtn.x = game.stage.canvas.width / 2 - startBtn.width / 2;
  startBtn.y = 200;
  startBtn.addEventListener('click', game.start);

  let btntxt = new createjs.Text("New game", "12px Helvetica", "#fff");
  btntxt.y = startBtn.y + startBtn.height / 2;
  title.x = hs.x = tut.x = btntxt.x = game.stage.canvas.width / 2;
  title.textBaseline = hs.textBaseline = tut.textBaseline = btntxt.textBaseline = "middle";
  title.textAlign = hs.textAlign = tut.textAlign = btntxt.textAlign = "center";

  game.stage.addChild(title, hs, tut, startBtn, btntxt);
}

game.start = () => {
  game.stage.removeAllChildren();
  game.levels = game.queue.getResult("levels");
  game.platforms = [];
  game.position = 0;
  game.score = 0;
  game.moving = false;
  game.keys = { left: false, right: false }
  game.bg = [];
  game.createBackgrounds();
  game.createStats();
  game.player = new Player();
  game.createPlatforms(game.levels[0]);
  game.started = true;
  window.addEventListener('deviceorientation', game.tilt);
}

game.createStats = () => {
  game.stats = new createjs.Text("Score: " + game.score, "35px riffic", "#fdff66");
  game.stats.y = 30;
  game.stage.addChild(game.stats);
}

game.createBackgrounds = () => {
  for (let i = game.levels.length - 1; i >= 0; i--) {
    let bg = new createjs.Bitmap(game.queue.getResult("bg" + (i+1)));
    bg.x = 0;
    bg.y = game.levels[i].bg.y;
    bg.distance = game.levels[i].bg.distance;
    game.stage.addChild(bg);
    game.bg.push(bg);
  };
}

game.showEndScreen = () => {
  game.stage.removeAllChildren();
  let dead = new createjs.Text("You fell down", "20px Helvetica", "#111");
  dead.y = 100;
  let s = new createjs.Text("Your score was: " + game.score, "16px Helvetica", "#111");
  s.y = 130;

  let homeBtn = new createjs.Shape();
  homeBtn.width = 200;
  homeBtn.height = 50;
  homeBtn.graphics.beginFill('#111').drawRect(0, 0, homeBtn.width, homeBtn.height);
  homeBtn.x = game.stage.canvas.width / 2 - homeBtn.width / 2;
  homeBtn.y = 200;
  homeBtn.addEventListener('click', game.showStartScreen);

  let btntxt = new createjs.Text("Home", "12px Helvetica", "#fff");
  btntxt.y = homeBtn.y + homeBtn.height / 2;
  dead.x = s.x = btntxt.x = game.stage.canvas.width / 2;
  dead.textBaseline = s.textBaseline = btntxt.textBaseline = "middle";
  dead.textAlign = s.textAlign = btntxt.textAlign = "center";

  game.stage.addChild(dead, s, homeBtn, btntxt);
}

game.end = () => {
  game.highScore = Math.max(game.highScore, game.score);
  document.cookie = "highScore=" + game.highScore;
  game.showEndScreen();
  game.started = false;
}
game.moveUp = speed => {
  game.platforms.forEach(o => {
    o.y += speed;
    if (o.powerup != undefined) o.powerup.y += speed;
  });
  game.position += speed;
  if (game.position > game.player.level.points)
    game.player.level = game.levels[game.levels.indexOf(game.player.level) + 1];
  for (let bg of game.bg)
    bg.y += speed / game.player.level.bg.distance;
}

game.createPlatforms = level => {
  if (game.platforms.length == 0) new Platform(level);
  while (game.platforms[game.platforms.length - 1].position < level.points) new Platform(level);
  game.stage.setChildIndex(game.player, game.stage.getNumChildren()-1);
}

game.onTick = () => {
  if (game.started) {
    game.player.jump();
    game.player.move();
    for (p of game.platforms.filter(o => o.type == "moving")) p.move();
    game.stats.text = "Score: " + game.score.toLocaleString();
    game.stats.x = game.stage.canvas.width - game.stats.text.length * 18;
    game.stage.setChildIndex(game.stats, game.stage.getNumChildren()-1);
  }
  game.stage.update();
}

game.keyDown = e => {
  if (game.started) {
    switch (e.keyCode) {
      case 37: game.keys.left = true; break;
      case 39: game.keys.right = true; break;
    }
  }
}

game.keyUp = e => {
  if (game.started) {
    switch (e.keyCode) {
      case 37: game.keys.left = false; break;
      case 39: game.keys.right = false; break;
    }
  }
}

// Ref: https://developer.mozilla.org/en-US/docs/Web/API/Detecting_device_orientation
game.tilt = e => {
  let tilt = e.gamma;
  let maxX = game.stage.canvas.width - game.player.width;
  if (tilt >  90) tilt =  90;
  if (tilt < -90) tilt = -90 ;
  tilt += 90;
  game.player.x = (maxX * tilt / 180);
}
// End of ref


//Events
window.onkeydown = game.keyDown;
window.onkeyup = game.keyUp;
window.onload = game.init;