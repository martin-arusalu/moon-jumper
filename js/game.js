/* TODO:
3. Level backgrounds -
  Clouds (+sun?),
  Airplanes and dark blue sky
  Stars and very dark blue sky
5. Levelup show design + extra notifications during game
11. Badges (ideas, json, code, showing, screen, design)
*/

let game = {
  started: false,
  maxSpeed: 20,
  moveSpeed: 7,
  gravity: 1.09,
  sensitivity: 4,
  tilt: 0,
  cookies: ['highScore', 'gamesPlayed', 'totalTime', 'lastTime', 'totalPlatforms', 'lastPlatforms', 'lastScore', 'totalScore', 'lastSprings', 'totalSprings']
}

game.init = () => {
  game.stage = new createjs.Stage('myCanvas');
  // getting cookies
  game.cookies.forEach(o => game[o] = isNaN(getCookie(o)) ? 0 : new Number(getCookie(o)));
  game.load();
  createjs.Ticker.addEventListener('tick', game.onTick);
  createjs.Ticker.setFPS(60);
}

game.load = () => {
  game.loading = new createjs.Text("Loading", "40px riffic", "#fff");
  game.loading.textBaseline = "middle";
  game.loading.textAlign = "center";
  game.loading.x = game.stage.canvas.width / 2;
  game.loading.y = game.stage.canvas.height / 2;
  game.stage.addChild(game.loading);
  
  game.queue = new createjs.LoadQueue(true);
  game.queue.installPlugin(createjs.Sound);
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
    { id: "statsScreen", src: "graphics/stats.png" },
    { id: "creditsScreen", src: "graphics/credits.png" },
    { id: "fredJump", src: "graphics/fredJump/fredJump.json", "type":"spritesheet" },
    { id: "platforms", src: "graphics/platforms/platforms.json", "type": "spritesheet" },
    { id: "spring", src: "graphics/spring/spring.json", "type": "spritesheet" },
    { id: "boost", src: "sound/boost.mp3" },
    { id: "crack1", src: "sound/crack1.mp3" },
    { id: "crack2", src: "sound/crack2.mp3" },
    { id: "jump1", src: "sound/jump1.mp3" },
    { id: "jump2", src: "sound/jump2.mp3" },
    { id: "end", src: "sound/end.mp3" },
  ]);
  game.queue.on("progress", game.progress);
  game.queue.on('complete', game.showStartScreen);
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
  game.position = game.score = game.lastSprings = game.lastPlatforms = 0;
  game.timer = Date.now();
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
  game.stats = new createjs.Text("", "35px riffic", "#fdff66");
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
  createjs.Sound.play('end');
  game.highScore = Math.max(game.highScore, game.score);
  game.gamesPlayed++;
  game.totalTime += game.lastTime = Date.now() - game.timer;
  game.totalScore += game.lastScore = game.score;
  game.totalPlatforms += game.lastPlatforms;
  game.totalSprings += game.lastSprings;
  
  // Set cookies
  let t = new Date(Date.now() + 100000000000);
  game.cookies.forEach(o => document.cookie = o + "=" + game[o] + "; expires=" + t.toGMTString() + ";");

  game.showEndScreen();
  game.started = false;
}

game.moveUp = speed => {
  game.platforms.forEach(o => {
    o.y += speed;
    if (o.spring != undefined) o.spring.y += speed;
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
    game.stats.text = "Distance: " + game.score.toLocaleString() + " m";
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

  let hs = new createjs.Text(game.highScore.toLocaleString() + " m", "30px riffic", "#fff");
  hs.y = 500;
  hs.x = 40;

  let startBtn = new createjs.Shape();
  startBtn.graphics.beginFill("#fff").drawRect(108, 683, 268, 83);
  startBtn.alpha = 0.01;
  startBtn.addEventListener('click', game.start);

  let instructionsBtn = new createjs.Shape();
  instructionsBtn.graphics.beginFill("#fff").drawRect(0, 42, 140, 138);
  instructionsBtn.alpha = 0.01;
  instructionsBtn.addEventListener('click', game.showInstructionsScreen);

  let statsBtn = new createjs.Shape();
  statsBtn.graphics.beginFill("#fff").drawCircle(455, 25, 70);
  statsBtn.alpha = 0.01;
  statsBtn.addEventListener('click', game.showStatsScreen);

  game.stage.addChild(screen, hs, startBtn, instructionsBtn, statsBtn);
}

game.showInstructionsScreen = () => {
  game.stage.removeAllChildren();

  let screen = new createjs.Bitmap(game.queue.getResult('instructionsScreen'));
  screen.x = screen.y = 0;
  screen.scaleX = screen.scaleY = 0.5;

  let startBtn = new createjs.Shape();
  startBtn.graphics.beginFill("#fff").drawRect(108, 683, 268, 83);
  startBtn.alpha = 0.01;
  startBtn.addEventListener('click', game.start);

  let homeBtn = new createjs.Shape();
  homeBtn.graphics.beginFill("#fff").drawRect(400, 0, 100, 70);
  homeBtn.alpha = 0.01;
  homeBtn.addEventListener('click', game.showStartScreen);

  game.creditsBtn = new createjs.Shape();
  game.creditsBtn.graphics.beginFill("#fff").drawRect(55, 0, 165, 30);
  game.creditsBtn.alpha = 0.01;
  game.creditsBtn.addEventListener('click', game.showCreditsScreen);

  game.stage.addChild(screen, startBtn, homeBtn, game.creditsBtn);
}

game.showCreditsScreen = () => {
  game.stage.removeAllChildren();

  let screen = new createjs.Bitmap(game.queue.getResult('creditsScreen'));
  screen.x = screen.y = 0;
  screen.scaleX = screen.scaleY = 0.5;

  let startBtn = new createjs.Shape();
  startBtn.graphics.beginFill("#fff").drawRect(108, 683, 268, 83);
  startBtn.alpha = 0.01;
  startBtn.addEventListener('click', game.start);

  let homeBtn = new createjs.Shape();
  homeBtn.graphics.beginFill("#fff").drawRect(400, 0, 100, 70);
  homeBtn.alpha = 0.01;
  homeBtn.addEventListener('click', game.showInstructionsScreen);

  game.stage.addChild(screen, startBtn, homeBtn);
}

game.showStatsScreen = () => {
  game.stage.removeAllChildren();

  let screen = new createjs.Bitmap(game.queue.getResult('statsScreen'));
  screen.x = screen.y = 0;
  screen.scaleX = screen.scaleY = 0.5;

  let startBtn = new createjs.Shape();
  startBtn.graphics.beginFill("#fff").drawRect(108, 683, 268, 83);
  startBtn.alpha = 0.01;
  startBtn.addEventListener('click', game.start);

  let homeBtn = new createjs.Shape();
  homeBtn.graphics.beginFill("#fff").drawRect(400, 0, 100, 70);
  homeBtn.alpha = 0.01;
  homeBtn.addEventListener('click', game.showStartScreen);

  let totalDstKm = Math.round(game.totalScore / 10) / 100;
  let statsTxt = "\nTotal distance: " + totalDstKm.toLocaleString() + " km";
  statsTxt += "\nBest distance: " + game.highScore.toLocaleString() + " m";
  statsTxt += "\nLast game distance: " + game.lastScore.toLocaleString() + " m";

  statsTxt += "\n\nGames Played: " + game.gamesPlayed.toLocaleString();
  statsTxt += "\nTotal time played: " + msToTime(game.totalTime);
  statsTxt += "\nLast game duration: " + msToTime(game.lastTime);
  statsTxt += "\nAverage game duration: " + msToTime(game.totalTime / game.gamesPlayed);

  statsTxt += "\n\nTotal platforms jumped: " + game.totalPlatforms.toLocaleString();
  statsTxt += "\nPlatforms jumped in last game: " + game.lastPlatforms.toLocaleString();

  statsTxt += "\n\nTotal springs jumped: " + game.totalSprings.toLocaleString();
  statsTxt += "\nSprings jumped in last game: " + game.lastSprings.toLocaleString();

  let stats = new createjs.Text(statsTxt, "18px riffic", "#fff");
  stats.lineHeight = 28;
  stats.y = 240;
  stats.x = 60;

  game.stage.addChild(screen, startBtn, homeBtn, stats);
}

game.showEndScreen = () => {
  game.stage.removeAllChildren();

  let screen = new createjs.Bitmap(game.queue.getResult('endScreen'));
  screen.x = screen.y = 0;
  screen.scaleX = screen.scaleY = 0.5;

  let s = new createjs.Text(game.score.toLocaleString() + " m", "30px riffic", "#fff");
  s.y = 375;
  s.x = 50;  
  
  let hs = new createjs.Text(game.highScore.toLocaleString() + " m", "30px riffic", "#fff");
  hs.y = 515;
  hs.x = 50;

  let startBtn = new createjs.Shape();
  startBtn.graphics.beginFill("#fff").drawRect(108, 683, 268, 83);
  startBtn.alpha = 0.01;
  startBtn.addEventListener('click', game.start);

  let homeBtn = new createjs.Shape();
  homeBtn.graphics.beginFill("#fff").drawRect(456, 577, 50, 120);
  homeBtn.alpha = 0.01;
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
  if (e.keyCode == 77) createjs.Sound.muted = !createjs.Sound.muted;
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

// Reference: https://stackoverflow.com/a/9763769
function msToTime(s) {
  var pad = n => ('00' + n).slice(-2);
  return pad(s/3.6e6|0) + ':' + pad((s%3.6e6)/6e4 | 0) + ':' + pad((s%6e4)/1000|0) + '.' + pad(s%1000, 3);
}
// End of reference

// Reference: https://stackoverflow.com/a/10730417
function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length == 2) return parts.pop().split(";").shift();
}
// End of reference

//Events
window.onkeydown = game.keyDown;
window.onkeyup = game.keyUp;
window.onload = game.init;