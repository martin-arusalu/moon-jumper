"use strict";
// Main object that contains everything exept utility functions.
let game = {
  started: false,
  maxSpeed: 20,
  moveSpeed: 7,
  gravity: 1.09,
  sensitivity: 4,
  tilt: 0,
  newBadges: 0,
  cookies: ['badges', 'highScore', 'gamesPlayed', 'totalTime', 'lastTime', 'totalPlatforms', 'lastPlatforms', 'lastScore', 'totalScore', 'lastSprings', 'totalSprings', 'bestSpringStreak']
}

// After window loads initialize game.
game.init = () => {
  FBInstant.initializeAsync().then(function() {
    game.stage = new createjs.Stage('myCanvas');
    game.cookies.forEach(o => game[o] = isNaN(getCookie(o)) ? 0 : new Number(getCookie(o)));
    game.badges = Badge.getFromCookie();
    game.load();

    FBInstant.startGameAsync().then(function() {
      game.contextId = FBInstant.context.getID();
      console.log(FBInstant.context);
      game.badgeChecker = window.setInterval(Badge.checkForNewBadges, 1000);
      createjs.Ticker.addEventListener('tick', game.onTick);
      createjs.Ticker.setFPS(60);         
    });
  });
}

game.load = () => {
  // Loading text
  game.loading = new createjs.Text("Loading", "40px riffic", "#fff");
  game.loading.textBaseline = "middle";
  game.loading.textAlign = "center";
  game.loading.x = game.stage.canvas.width / 2;
  game.loading.y = game.stage.canvas.height / 2;
  game.stage.addChild(game.loading);
  
  // Preloading
  game.queue = new createjs.LoadQueue(true);
  game.queue.installPlugin(createjs.Sound);
  game.queue.loadManifest([
    { id: "levels", src: "js/levels.json" },
    { id: "badgesData", src: "js/badgesData.json" },
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
    { id: "fredJump", src: "graphics/fredJump/fredJump.json", "type":"spritesheet" },
    { id: "platforms", src: "graphics/platforms/platforms.json", "type": "spritesheet" },
    { id: "spring", src: "graphics/spring/spring.json", "type": "spritesheet" },
    { id: "badges", src: "graphics/badges/badges.json", "type": "spritesheet" },
    { id: "unmuted", src: "graphics/unmuted.png" },
    { id: "muted", src: "graphics/muted.png" },
    { id: "pause", src: "graphics/pause.png" },
    { id: "continue", src: "graphics/continue.png" },
    { id: "boost", src: "sound/boost.mp3" },
    { id: "crack1", src: "sound/crack1.mp3" },
    { id: "crack2", src: "sound/crack2.mp3" },
    { id: "jump1", src: "sound/jump1.mp3" },
    { id: "jump2", src: "sound/jump2.mp3" },
    { id: "end", src: "sound/end.mp3" },
    { id: "newBadge", src: "sound/badge.mp3" },
  ]);
  game.queue.on("progress", game.progress);
  game.queue.on('complete', game.showStartScreen);
}

// While game is loading
game.progress = e => {
  let percent = Math.ceil(e.progress * 100);
  game.loading.text = "Loading: " + percent + "%"; // Show percentage of loading progress
  game.stage.update();
  FBInstant.setLoadingProgress(percent);
}

// Resets single game data and starts a new game
game.start = () => {
  game.stage.removeAllChildren();
  game.levels = game.queue.getResult("levels");
  game.allBadges = game.queue.getResult("badgesData");
  game.platforms = [];
  game.position = game.score = game.lastSprings = game.lastPlatforms = 0;
  game.timer = Date.now();
  game.moving = false;
  game.keys = { left: false, right: false }
  game.bg = [];
  game.onRecord = false;
  game.springStreak = 0;
  game.createBackgrounds();
  game.createStats();
  game.player = new Player();
  game.createPlatforms();
  game.showMute();
  game.showPause(createjs.Ticker);
  game.started = true;
  window.addEventListener('deviceorientation', game.tilt);
}

game.createStats = () => {
  // Creates the score or distance text element
  game.scoreTxt = new createjs.Text("", "35px riffic", "#fdff66");

  // And positions it in the top right part of the screen
  game.scoreTxt.y = 30;
  game.scoreTxt.x = game.stage.canvas.width - 10;
  game.scoreTxt.textAlign = "right";

  // Creates the badges text element
  game.badgesCount = new createjs.Text("", "20px riffic", "#fdff66");

  // And positions it to the top right part of the screen
  game.badgesCount.y = 30;
  game.badgesCount.x = 10;
  game.stage.addChild(game.scoreTxt, game.badgesCount);
}

game.createBackgrounds = () => {
  for (let i = game.levels.length - 1; i >= 0; i--) { // Get all the background images
    // Get the image
    let bg = new createjs.Bitmap(game.queue.getResult("bg" + (i + 1)));
    
    // Position them under each other
    bg.x = 0;
    bg.y = game.levels[i].bg.y;
    
    // Background moving speed
    bg.distance = game.levels[i].bg.distance;
    game.stage.addChild(bg);
    game.bg.push(bg);
  };
}

// End game
game.end = () => {
  game.started = false;
  let fall = createjs.Sound.play('end');
  fall.volume = 0.1;
  game.highScore = Math.max(game.highScore, game.score);
  game.gamesPlayed++;
  game.totalTime += game.lastTime = Date.now() - game.timer;
  game.totalScore += game.lastScore = game.score;
  game.totalPlatforms += game.lastPlatforms;
  game.totalSprings += game.lastSprings;
  FBInstant
    .getLeaderboardAsync('Highest jumpers.' + game.contextId)
    .then(leaderboard => {
      console.log(leaderboard.getName());
      return leaderboard.setScoreAsync(game.score);
    })
    .then(() => console.log('Score saved'))
    .catch(error => console.error(error));
  
  // Set cookies
  let t = new Date(Date.now() + 100000000000); // Set expiration date to looong in the future
  game.cookies.forEach(o => document.cookie = o + "=" + game[o] + "; expires=" + t.toGMTString() + ";");
  Badge.checkForNewBadges();

  game.showEndScreen();
}

// Move the environment  (seems like player moving up, but environment moving down actually)
game.moveUp = speed => { // param speed - the speed player is currently moving
  // Move the platforms down
  game.platforms.forEach(o => {
    o.y += speed;
    if (o.spring) o.spring.y += speed; // also move the springs on platforms (if any)
  });
  game.position += speed; // bottom edge of the screen
  for (let bg of game.bg)
    // Move the background by the speed defined for it
    bg.y += speed / game.player.level.bg.distance;
}

// New platforms on every jump
game.createPlatforms = () => {
  // On every jump create new platforms until total is 40
  while (game.platforms.length < 40) new Platform(game.player.level);
  
  // Set the player on top of everything
  game.stage.setChildIndex(game.player, game.stage.getNumChildren()-1);
}

// Every frame (60fps)
game.onTick = (e) => {
  // Only do stuff when in game
  if (game.started && !e.paused) {
    game.player.jump();
    game.player.move();

    // Move the movable platforms
    for (p of game.platforms.filter(o => o.type == "moving")) p.move();

    // Update score and set it on top of everything
    game.scoreTxt.text = game.score.toLocaleString() + " m";
    game.stage.setChildIndex(game.scoreTxt, game.stage.getNumChildren() - 1);

    // Upadte the badges count and set it on top of everything
    game.badgesCount.text = "Badges: " + game.badges.length + "/" + game.allBadges.length;
    game.stage.setChildIndex(game.badgesCount, game.stage.getNumChildren() - 1);
  }
  game.stage.update(e);
}

// Just the open screen
game.showStartScreen = () => {
  // Show high score
  let hs = new createjs.Text(game.highScore.toLocaleString() + " m", "30px riffic", "#fff");
  hs.y = 500;
  hs.x = 40;

  let instructionsBtn = new createjs.Shape();
  instructionsBtn.graphics.beginFill("#fff").drawRect(0, 42, 140, 138);
  instructionsBtn.alpha = 0.01;
  instructionsBtn.addEventListener('click', game.showInstructionsScreen);

  let statsBtn = new createjs.Shape();
  statsBtn.graphics.beginFill("#fff").drawCircle(455, 25, 70);
  statsBtn.alpha = 0.01;
  statsBtn.addEventListener('click', game.showStatsScreen);

  game.showScreen('startScreen', [instructionsBtn, statsBtn, hs]);
}

game.showInstructionsScreen = () => {
  let homeBtn = new createjs.Shape();
  homeBtn.graphics.beginFill("#fff").drawRect(400, 0, 100, 70);
  homeBtn.alpha = 0.01;
  homeBtn.addEventListener('click', game.showStartScreen);
  
  game.showScreen('instructionsScreen', [homeBtn]);
}

game.showStatsScreen = () => {
  let homeBtn = new createjs.Shape();
  homeBtn.graphics.beginFill("#fff").drawRect(400, 0, 100, 70);
  homeBtn.alpha = 0.01;
  homeBtn.addEventListener('click', game.showStartScreen);

  // Text about statistics
  let statsTxt = "\nTotal distance: " + game.totalScore.toLocaleString() + " m";
  statsTxt += "\nBest distance: " + game.highScore.toLocaleString() + " m";
  statsTxt += "\nLast game distance: " + game.lastScore.toLocaleString() + " m";
  statsTxt += "\nAverage game distance: " + Math.round((game.totalScore / game.gamesPlayed)).toLocaleString() + " m";

  statsTxt += "\n\nGames Played: " + game.gamesPlayed.toLocaleString();
  statsTxt += "\nTotal time played: " + msToTimeWords(game.totalTime);
  statsTxt += "\nLast game duration: " + msToTimeWords(game.lastTime);

  statsTxt += "\n\nTotal jumps: " + game.totalPlatforms.toLocaleString();
  statsTxt += "\nJumps in last game: " + game.lastPlatforms.toLocaleString();

  statsTxt += "\n\nTotal springs jumped: " + game.totalSprings.toLocaleString();
  statsTxt += "\nSprings jumped in last game: " + game.lastSprings.toLocaleString();
  statsTxt += "\nBest spring jump streak: " + game.bestSpringStreak;

  // Create stats element
  let stats = new createjs.Text(statsTxt, "18px riffic", "#fff");
  stats.lineHeight = 28;
  stats.y = 180;
  stats.x = 60;

  game.showScreen('statsScreen', [homeBtn, stats]);
}

game.showEndScreen = () => {
  // Score of the game that just ended  
  let s = new createjs.Text(game.lastScore.toLocaleString() + " m", "30px riffic", "#fff");
  s.y = 375;
  s.x = 50;  
  
  // Your high score
  let hs = new createjs.Text(game.highScore.toLocaleString() + " m", "30px riffic", "#fff");
  hs.y = 515;
  hs.x = 50;

  let homeBtn = new createjs.Shape();
  homeBtn.graphics.beginFill("#fff").drawRect(456, 577, 50, 120);
  homeBtn.alpha = 0.01;
  homeBtn.addEventListener('click', game.showStartScreen);

  game.showScreen('endScreen', [s, hs, homeBtn]);
}

game.showScreen = (screenName, extraElems) => {
  // Clear all
  game.stage.removeAllChildren();

  // Show screen image (static elements)  
  let screen = new createjs.Bitmap(game.queue.getResult(screenName));
  screen.x = screen.y = 0;
  screen.scaleX = screen.scaleY = 0.5;

  let startBtn = new createjs.Shape();
  startBtn.graphics.beginFill("#fff").drawRect(108, 683, 268, 83);
  startBtn.alpha = 0.01;
  startBtn.addEventListener('click', game.start);

  // Add elements to stage
  game.stage.addChild(screen, startBtn);
  for (e of extraElems) game.stage.addChild(e);

  // Show mute status
  game.showMute();
}

// Create / Recreate the button for toggling mute status.
game.showMute = () => {
  // Reset mute button
  if (game.muteBtn != null) {
    game.stage.removeChild(game.muteBtn);
    game.muteBtn = null;
  }

  // If muted show one logo otherwise show the other one.
  if (createjs.Sound.muted) game.muteBtn = new createjs.Bitmap(game.queue.getResult('muted'));
  else game.muteBtn = new createjs.Bitmap(game.queue.getResult('unmuted'));
  game.muteBtn.x = 10;
  game.muteBtn.y = 750;
  game.muteBtn.scaleX = game.muteBtn.scaleY = 0.3;

  // On click reverse the mute status and show the logo again.
  game.muteBtn.addEventListener('click', () => {
    createjs.Sound.muted = !createjs.Sound.muted;
    game.showMute();
  });

  // Add to screen
  game.stage.addChild(game.muteBtn);
}

game.showPause = (e) => {
  // Reset pausing button
  if (game.pauseBtn != null) {
    game.stage.removeChild(game.pauseBtn);
    game.pauseBtn = null;
  }
  // If paused show one logo otherwise show the other one.
  if (e.paused) game.pauseBtn = new createjs.Bitmap(game.queue.getResult('continue'));
  else game.pauseBtn = new createjs.Bitmap(game.queue.getResult('pause'));
  game.pauseBtn.x = 60;
  game.pauseBtn.y = 750;
  game.pauseBtn.scaleX = game.pauseBtn.scaleY = 0.4;

  // On click reverse the paused status and show the logo again.
  game.pauseBtn.addEventListener('click', () => {
    e.paused = !e.paused;
    game.showPause(e);
  });

  // Add to stage
  game.stage.addChild(game.pauseBtn);
}

// Check if key is pressed down
game.keyDown = e => {
  if (game.started)
    switch (e.keyCode) {
      case 37: game.keys.left = true; break;
      case 39: game.keys.right = true; break;
      case 32:
        createjs.Ticker.paused = !createjs.Ticker.paused;
        game.showPause(createjs.Ticker);
        break;  
    }
  else if (e.keyCode == 32) game.start();
  if (e.keyCode == 77) {
    createjs.Sound.muted = !createjs.Sound.muted;
    game.showMute();
  }
}

// Check if key is released
game.keyUp = e => {
  if (game.started)
    switch (e.keyCode) {
      case 37: game.keys.left = false; break;
      case 39: game.keys.right = false; break;
    }
}

// When rotating or tilting the screen
game.tilt = e => {
  game.tilt = e.gamma;
  let maxX = game.stage.canvas.width - game.player.width;
  if (game.tilt >  90) game.tilt =  90;
  if (game.tilt < -90) game.tilt = -90;
}

// Reference: https://stackoverflow.com/a/9763769
function msToTime(s) {
  var pad = n => ('00' + n).slice(-2);
  return pad(s/3.6e6|0) + ':' + pad((s%3.6e6)/6e4 | 0) + ':' + pad((s%6e4)/1000|0);
}
// End of reference

function msToTimeWords(s) {
  let words = (s / 3.6e6 | 0) ? (s / 3.6e6 | 0) + ' h ' : '';
  words += ((s % 3.6e6) / 6e4 | 0) ? ((s % 3.6e6) / 6e4 | 0) + ' min ' : '';
  words += ((s % 6e4) / 1000 | 0) + ' s';
  return words;
}

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