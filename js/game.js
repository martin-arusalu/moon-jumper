import Player from './Player.js';
import Platform from './Platform.js';

class Game {
  constructor() {
    this.started = false;
    this.maxSpeed = 20;
    this.moveSpeed = 7;
    this.gravity = 1.09;
    this.sensitivity = 4;
    this.tilt = 0;
    this.newBadges = 0;
    this.highScore = 0;
    this.allBadges = [];
    this.badges = [];
  }
}

const game = new Game();

game.load = () => {
  game.stage = new window.createjs.Stage('myCanvas');
  game.loading = new window.createjs.Text('Loading', '40px riffic', '#fff');
  game.loading.textBaseline = 'middle';
  game.loading.textAlign = 'center';
  game.loading.x = game.stage.canvas.width / 2;
  game.loading.y = game.stage.canvas.height / 2;
  game.stage.addChild(game.loading);

  game.queue = new window.createjs.LoadQueue(true);
  game.queue.installPlugin(window.createjs.Sound);
  game.queue.loadManifest([
    { id: 'levels', src: 'js/levels.json' },
    { id: 'badgesData', src: 'js/badgesData.json' },
    { id: 'bg1', src: 'graphics/lvl1bg.png' },
    { id: 'bg2', src: 'graphics/lvl2bg.png' },
    { id: 'bg3', src: 'graphics/lvl3bg.png' },
    { id: 'bg4', src: 'graphics/lvl4bg.png' },
    { id: 'bg5', src: 'graphics/lvl5bg.png' },
    { id: 'bg6', src: 'graphics/lvl6bg.png' },
    { id: 'startScreen', src: 'graphics/start.png' },
    { id: 'instructionsScreen', src: 'graphics/instructions.png' },
    { id: 'endScreen', src: 'graphics/end.png' },
    { id: 'statsScreen', src: 'graphics/stats.png' },
    { id: 'fredJump', src: 'graphics/fredJump/fredJump.json', 'type': 'spritesheet' },
    { id: 'platforms', src: 'graphics/platforms/platforms.json', 'type': 'spritesheet' },
    { id: 'spring', src: 'graphics/spring/spring.json', 'type': 'spritesheet' },
    { id: 'badges', src: 'graphics/badges/badges.json', 'type': 'spritesheet' },
    { id: 'unmuted', src: 'graphics/unmuted.png' },
    { id: 'muted', src: 'graphics/muted.png' },
    { id: 'pause', src: 'graphics/pause.png' },
    { id: 'continue', src: 'graphics/continue.png' },
    { id: 'boost', src: 'sound/boost.mp3' },
    { id: 'crack1', src: 'sound/crack1.mp3' },
    { id: 'crack2', src: 'sound/crack2.mp3' },
    { id: 'jump1', src: 'sound/jump1.mp3' },
    { id: 'jump2', src: 'sound/jump2.mp3' },
    { id: 'end', src: 'sound/end.mp3' },
    { id: 'newBadge', src: 'sound/badge.mp3' },
  ]);
  game.queue.on('progress', game.progress);
  game.queue.on('complete', game.showStartScreen);
};

game.progress = (e) => {
  const percent = Math.ceil(e.progress * 100);
  game.loading.text = `Loading: ${percent}%`;
  game.stage.update();
  FBInstant.setLoadingProgress(percent);
};

game.start = () => {
  game.stage.removeAllChildren();
  game.levels = game.queue.getResult('levels');
  game.allBadges = game.queue.getResult('badgesData');
  game.platforms = [];
  game.position = game.score = game.lastSprings = game.lastPlatforms = 0;
  game.timer = Date.now();
  game.moving = false;
  game.keys = { left: false, right: false };
  game.bg = [];
  game.onRecord = false;
  game.springStreak = 0;
  game.createBackgrounds();
  game.createStats();
  game.player = new Player(game);
  game.createPlatforms();
  game.showMute();
  game.showPause(window.createjs.Ticker);
  game.started = true;
};

game.createStats = () => {
  game.scoreTxt = new window.createjs.Text('', '35px riffic', '#fdff66');
  game.scoreTxt.y = 30;
  game.scoreTxt.x = game.stage.canvas.width - 10;
  game.scoreTxt.textAlign = 'right';
  game.badgesCount = new window.createjs.Text('', '20px riffic', '#fdff66');
  game.badgesCount.y = 30;
  game.badgesCount.x = 10;
  game.stage.addChild(game.scoreTxt, game.badgesCount);
};

game.createBackgrounds = () => {
  for (let i = game.levels.length - 1; i >= 0; i--) {
    const bg = new window.createjs.Bitmap(game.queue.getResult('bg' + (i + 1)));
    bg.x = 0;
    bg.y = game.levels[i].bg.y;
    bg.distance = game.levels[i].bg.distance;
    game.stage.addChild(bg);
    game.bg.push(bg);
  }
};

game.end = () => {
  game.started = false;
  const fall = window.createjs.Sound.play('end');
  fall.volume = 0.1;
  game.highScore = Math.max(game.highScore, game.score);
  game.gamesPlayed++;
  game.totalTime += game.lastTime = Date.now() - game.timer;
  game.totalScore += game.lastScore = game.score;
  game.totalPlatforms += game.lastPlatforms;
  game.totalSprings += game.lastSprings;

  game.showEndScreen();
};

game.moveUp = (speed) => {
  game.platforms.forEach(o => {
    o.y += speed;
    if (o.spring) o.spring.y += speed;
  });
  game.position += speed;
  for (let bg of game.bg) {
    bg.y += speed / game.player.level.bg.distance;
  }
};

game.createPlatforms = () => {
  while (game.platforms.length < 40) new Platform(game.player.level, game);
  game.stage.setChildIndex(game.player, game.stage.getNumChildren() - 1);
};

game.onTick = (e) => {
  if (game.started && !e.paused) {
    game.player.jump();
    game.player.move();
    for (let p of game.platforms.filter(o => o.type == 'moving')) p.move();
    game.scoreTxt.text = game.score.toLocaleString() + ' m';
    game.stage.setChildIndex(game.scoreTxt, game.stage.getNumChildren() - 1);
    game.badgesCount.text = 'Badges: ' + game.badges.length + '/' + game.allBadges.length;
    game.stage.setChildIndex(game.badgesCount, game.stage.getNumChildren() - 1);
  }
  game.stage.update(e);
};

game.showStartScreen = () => {
  const hs = new window.createjs.Text(game.highScore.toLocaleString() + ' m', '30px riffic', '#fff');
  hs.y = 500;
  hs.x = 40;

  const instructionsBtn = new window.createjs.Shape();
  instructionsBtn.graphics.beginFill('#fff').drawRect(0, 42, 140, 138);
  instructionsBtn.alpha = 0.01;
  instructionsBtn.addEventListener('click', game.showInstructionsScreen);

  const statsBtn = new window.createjs.Shape();
  statsBtn.graphics.beginFill('#fff').drawCircle(455, 25, 70);
  statsBtn.alpha = 0.01;
  statsBtn.addEventListener('click', game.showStatsScreen);

  game.showScreen('startScreen', [instructionsBtn, statsBtn, hs]);
};

game.showInstructionsScreen = () => {
  const homeBtn = new window.createjs.Shape();
  homeBtn.graphics.beginFill('#fff').drawRect(400, 0, 100, 70);
  homeBtn.alpha = 0.01;
  homeBtn.addEventListener('click', game.showStartScreen);

  game.showScreen('instructionsScreen', [homeBtn]);
};

game.showStatsScreen = () => {
  const homeBtn = new window.createjs.Shape();
  homeBtn.graphics.beginFill('#fff').drawRect(400, 0, 100, 70);
  homeBtn.alpha = 0.01;
  homeBtn.addEventListener('click', game.showStartScreen);

  let statsTxt = `\nTotal distance: ${game.totalScore.toLocaleString()} m`;
  statsTxt += `\nBest distance: ${game.highScore.toLocaleString()} m`;
  statsTxt += `\nLast game distance: ${game.lastScore.toLocaleString()} m`;
  statsTxt += `\nAverage game distance: ${Math.round((game.totalScore / game.gamesPlayed)).toLocaleString()} m`;

  statsTxt += '\n\nGames Played: ' + game.gamesPlayed.toLocaleString();
  statsTxt += '\nTotal time played: ' + msToTimeWords(game.totalTime);
  statsTxt += '\nLast game duration: ' + msToTimeWords(game.lastTime);

  statsTxt += '\n\nTotal jumps: ' + game.totalPlatforms.toLocaleString();
  statsTxt += '\nJumps in last game: ' + game.lastPlatforms.toLocaleString();

  statsTxt += '\n\nTotal springs jumped: ' + game.totalSprings.toLocaleString();
  statsTxt += '\nSprings jumped in last game: ' + game.lastSprings.toLocaleString();
  statsTxt += '\nBest spring jump streak: ' + game.bestSpringStreak;

  const stats = new window.createjs.Text(statsTxt, '18px riffic', '#fff');
  stats.lineHeight = 28;
  stats.y = 180;
  stats.x = 60;

  game.showScreen('statsScreen', [homeBtn, stats]);
};

game.showEndScreen = () => {
  const s = new window.createjs.Text(game.lastScore.toLocaleString() + ' m', '30px riffic', '#fff');
  s.y = 375;
  s.x = 50;
  const hs = new window.createjs.Text(game.highScore.toLocaleString() + ' m', '30px riffic', '#fff');
  hs.y = 515;
  hs.x = 50;

  const homeBtn = new window.createjs.Shape();
  homeBtn.graphics.beginFill('#fff').drawRect(456, 577, 50, 120);
  homeBtn.alpha = 0.01;
  homeBtn.addEventListener('click', game.showStartScreen);

  game.showScreen('endScreen', [s, hs, homeBtn]);
};

game.showScreen = (screenName, extraElems) => {
  game.stage.removeAllChildren();

  const screen = new window.createjs.Bitmap(game.queue.getResult(screenName));
  screen.x = screen.y = 0;
  screen.scaleX = screen.scaleY = 0.5;

  const startBtn = new window.createjs.Shape();
  startBtn.graphics.beginFill('#fff').drawRect(108, 683, 268, 83);
  startBtn.alpha = 0.01;
  startBtn.addEventListener('click', game.start);

  game.stage.addChild(screen, startBtn);
  for (let e of extraElems) game.stage.addChild(e);

  game.showMute();
};

game.showMute = () => {
  if (game.muteBtn != null) {
    game.stage.removeChild(game.muteBtn);
    game.muteBtn = null;
  }

  if (window.createjs.Sound.muted) game.muteBtn = new window.createjs.Bitmap(game.queue.getResult('muted'));
  else game.muteBtn = new window.createjs.Bitmap(game.queue.getResult('unmuted'));
  game.muteBtn.x = 10;
  game.muteBtn.y = 750;
  game.muteBtn.scaleX = game.muteBtn.scaleY = 0.3;

  game.muteBtn.addEventListener('click', () => {
    window.createjs.Sound.muted = !window.createjs.Sound.muted;
    game.showMute();
  });

  game.stage.addChild(game.muteBtn);
};

game.showPause = (e) => {
  if (game.pauseBtn != null) {
    game.stage.removeChild(game.pauseBtn);
    game.pauseBtn = null;
  }

  if (e.paused) game.pauseBtn = new window.createjs.Bitmap(game.queue.getResult('continue'));
  else game.pauseBtn = new window.createjs.Bitmap(game.queue.getResult('pause'));
  game.pauseBtn.x = 60;
  game.pauseBtn.y = 750;
  game.pauseBtn.scaleX = game.pauseBtn.scaleY = 0.4;

  game.pauseBtn.addEventListener('click', () => {
    e.paused = !e.paused;
    game.showPause(e);
  });

  game.stage.addChild(game.pauseBtn);
};

game.keyDown = (e) => {
  if (game.started)
    switch (e.keyCode) {
    case 37: game.keys.left = true; break;
    case 39: game.keys.right = true; break;
    case 32:
      window.createjs.Ticker.paused = !window.createjs.Ticker.paused;
      game.showPause(window.createjs.Ticker);
      break;
    }
  else if (e.keyCode == 32) game.start();
  if (e.keyCode == 77) {
    window.createjs.Sound.muted = !window.createjs.Sound.muted;
    game.showMute();
  }
};

game.keyUp = (e) => {
  if (game.started)
    switch (e.keyCode) {
    case 37: game.keys.left = false; break;
    case 39: game.keys.right = false; break;
    }
};

game.tilt = (e) => {
  game.tilt = e.gamma;
  if (game.tilt > 90) game.tilt = 90;
  if (game.tilt < -90) game.tilt = -90;
};

function msToTimeWords(s) {
  let words = (s / 3.6e6 | 0) ? (s / 3.6e6 | 0) + ' h ' : '';
  words += ((s % 3.6e6) / 6e4 | 0) ? ((s % 3.6e6) / 6e4 | 0) + ' min ' : '';
  words += ((s % 6e4) / 1000 | 0) + ' s';
  return words;
}

export default game;