/* TODO:
1. Boost animation
2. Improve platform designs
3. Level backgrounds -
  Clouds (+sun?),
  Airplanes and dark blue sky
  Stars and very dark blue sky
4. data and loading screens
5. Levelup show design + extra notifications during game
6. Powerups - ideas, code, design
7. Sounds - backtrack, fx (jump, powerup, breaking, dying)
10. Missions

BUGS:
- Make jumping animation more realistic
*/

let game = {
  started: false,
  highScore: 0,
  maxSpeed: 20,
  moveSpeed: 7,
  gravity: 1.09,
  sensitivity: 4,
  tilt: 0,
}

game.init = () => {
  game.stage = new createjs.Stage('myCanvas');
  game.getCookies();
  game.load();
  createjs.Ticker.addEventListener('tick', game.onTick);
  createjs.Ticker.setFPS(60);
}

game.getCookies = () => {
  // Ref: https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie
  let cookieHighScore = document.cookie.replace(/(?:(?:^|.*;\s*)highScore\s*\=\s*([^;]*).*$)|^.*$/, "$1");
  let gamesPlayed = document.cookie.replace(/(?:(?:^|.*;\s*)gamesPlayed\s*\=\s*([^;]*).*$)|^.*$/, "$1");
  // End of ref
  if (cookieHighScore.length > 0)
    game.highScore = Math.max(new Number(cookieHighScore), game.highScore);
  if (gamesPlayed.length > 0)
    game.gamesPlayed = new Number(gamesPlayed);
}

game.setCookies = () => {
  let t = new Date(Date.now() + 100000000000);
  document.cookie = "highScore=" + game.highScore + "; expires=" + t.toGMTString() + ";";
  document.cookie = "gamesPlayed=" + game.gamesPlayed + "; expires=" + t.toGMTString() + ";";
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
    { id: "bg4", src: "graphics/lvl4bg.png" },
    { id: "bg5", src: "graphics/lvl5bg.png" },
    { id: "bg6", src: "graphics/lvl6bg.png" },
    { id: "startScreen", src: "graphics/start.png" },
    { id: "instructionsScreen", src: "graphics/instructions.png" },
    { id: "endScreen", src: "graphics/end.png" },
    { id: "fredJump", src: "graphics/fredJump/fredJump.json", "type":"spritesheet" },
    { id: "platforms", src: "graphics/platforms/platforms.json", "type":"spritesheet" }
  ]);
}

game.progress = e => {
  let percent = Math.round(e.progress * 100);
  game.loading.text = "Loading: " + percent + "%";
  game.stage.update()
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
  game.stats = new createjs.Text("Score: " + game.score.toLocaleString(), "35px riffic", "#fdff66");
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

game.end = () => {
  game.highScore = Math.max(game.highScore, game.score);
  game.gamesPlayed++;
  game.setCookies();
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

game.showStartScreen = () => {
  game.stage.removeAllChildren();

  let screen = new createjs.Bitmap(game.queue.getResult('startScreen'));
  screen.x = screen.y = 0;
  screen.scaleX = screen.scaleY = 0.5;

  let hs = new createjs.Text(game.highScore.toLocaleString(), "30px riffic", "#fff");
  hs.y = 500;
  hs.x = 40;

  let startBtn = new createjs.Shape();
  startBtn.graphics.beginFill("#fff").drawRect(0, 0, 268, 83);
  startBtn.alpha = 0.01;
  startBtn.x = 108;
  startBtn.y = 683;
  startBtn.addEventListener('click', game.start);

  let instructionsBtn = new createjs.Shape();
  instructionsBtn.graphics.beginFill("#fff").drawRect(0, 0, 140, 138);
  instructionsBtn.alpha = 0.01;
  instructionsBtn.x = 0;
  instructionsBtn.y = 42;
  instructionsBtn.addEventListener('click', game.showInstructionsScreen);

  game.stage.addChild(screen, hs, startBtn, instructionsBtn);
}

game.showInstructionsScreen = () => {
  game.stage.removeAllChildren();

  let screen = new createjs.Bitmap(game.queue.getResult('instructionsScreen'));
  screen.x = screen.y = 0;
  screen.scaleX = screen.scaleY = 0.5;

  let startBtn = new createjs.Shape();
  startBtn.graphics.beginFill("#fff").drawRect(0, 0, 268, 83);
  startBtn.alpha = 0.01;
  startBtn.x = 108;
  startBtn.y = 683;
  startBtn.addEventListener('click', game.start);

  let homeBtn = new createjs.Shape();
  homeBtn.graphics.beginFill("#fff").drawRect(0, 0, 100, 70);
  homeBtn.alpha = 0.01;
  homeBtn.x = 400;
  homeBtn.y = 0;
  homeBtn.addEventListener('click', game.showStartScreen);
  game.stage.addChild(screen, startBtn, homeBtn);
}

game.showEndScreen = () => {
  game.stage.removeAllChildren();

  let screen = new createjs.Bitmap(game.queue.getResult('endScreen'));
  screen.x = screen.y = 0;
  screen.scaleX = screen.scaleY = 0.5;

  let s = new createjs.Text(game.score.toLocaleString(), "30px riffic", "#fff");
  s.y = 375;
  s.x = 50;  
  
  let hs = new createjs.Text(game.highScore.toLocaleString(), "30px riffic", "#fff");
  hs.y = 515;
  hs.x = 50;

  let startBtn = new createjs.Shape();
  startBtn.graphics.beginFill("#fff").drawRect(0, 0, 268, 83);
  startBtn.alpha = 0.01;
  startBtn.x = 108;
  startBtn.y = 683;
  startBtn.addEventListener('click', game.start);

  let homeBtn = new createjs.Shape();
  homeBtn.graphics.beginFill("#fff").drawRect(0, 0, 50, 120);
  homeBtn.alpha = 0.01;
  homeBtn.x = 456;
  homeBtn.y = 577;
  homeBtn.addEventListener('click', game.showStartScreen);
  game.stage.addChild(screen, startBtn, homeBtn, hs, s);
}

game.keyDown = e => {
  if (game.started) {
    switch (e.keyCode) {
      case 37: game.keys.left = true; break;
      case 39: game.keys.right = true; break;
    }
  } else if (e.keyCode == 32) game.start();
}

game.keyUp = e => {
  if (game.started) {
    switch (e.keyCode) {
      case 37: game.keys.left = false; break;
      case 39: game.keys.right = false; break;
    }
  }
}

game.tilt = e => {
  game.tilt = e.gamma;
  let maxX = game.stage.canvas.width - game.player.width;
  if (game.tilt >  90) game.tilt =  90;
  if (game.tilt < -90) game.tilt = -90;
}

//Events
window.onkeydown = game.keyDown;
window.onkeyup = game.keyUp;
window.onload = game.init;