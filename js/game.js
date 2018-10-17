export default class Game {
  constructor(FBInstant) {
    this.started = false;
    this.maxSpeed = 20;
    this.moveSpeed = 7;
    this.gravity = 1.09;
    this.sensitivity = 4;
    this.tilt = 0;
    this.newBadges = 0;
    this.FBInstant = FBInstant;
  }

  load() {
    this.stage = new createjs.Stage('myCanvas');
    this.loading = new createjs.Text("Loading", "40px riffic", "#fff");
    this.loading.textBaseline = "middle";
    this.loading.textAlign = "center";
    this.loading.x = this.stage.canvas.width / 2;
    this.loading.y = this.stage.canvas.height / 2;
    this.stage.addChild(this.loading);
    
    this.queue = new createjs.LoadQueue(true);
    this.queue.installPlugin(createjs.Sound);
    this.queue.loadManifest([
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
    this.queue.on("progress", this.progress);
    this.queue.on('complete', this.showStartScreen);
  };

  progress(e) {
    const percent = Math.ceil(e.progress * 100);
    this.loading.text = `Loading: ${percent}%`;
    this.stage.update();
    FBInstant.setLoadingProgress(percent);
  };

  start() {
    this.stage.removeAllChildren();
    this.levels = this.queue.getResult("levels");
    this.allBadges = this.queue.getResult("badgesData");
    this.platforms = [];
    this.position = this.score = this.lastSprings = this.lastPlatforms = 0;
    this.timer = Date.now();
    this.moving = false;
    this.keys = { left: false, right: false };
    this.bg = [];
    this.onRecord = false;
    this.springStreak = 0;
    this.createBackgrounds();
    this.createStats();
    this.player = new Player();
    this.createPlatforms();
    this.showMute();
    this.showPause(createjs.Ticker);
    this.started = true;
  };

  createStats() {
    this.scoreTxt = new createjs.Text("", "35px riffic", "#fdff66");
    this.scoreTxt.y = 30;
    this.scoreTxt.x = this.stage.canvas.width - 10;
    this.scoreTxt.textAlign = "right";
    this.badgesCount = new createjs.Text("", "20px riffic", "#fdff66");
    this.badgesCount.y = 30;
    this.badgesCount.x = 10;
    this.stage.addChild(this.scoreTxt, this.badgesCount);
  };

  createBackgrounds() {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      const bg = new createjs.Bitmap(this.queue.getResult("bg" + (i + 1)));
      bg.x = 0;
      bg.y = this.levels[i].bg.y;
      bg.distance = this.levels[i].bg.distance;
      this.stage.addChild(bg);
      this.bg.push(bg);
    };
  };

  end() {
    this.started = false;
    const fall = createjs.Sound.play('end');
    fall.volume = 0.1;
    this.highScore = Math.max(this.highScore, this.score);
    this.gamesPlayed++;
    this.totalTime += this.lastTime = Date.now() - this.timer;
    this.totalScore += this.lastScore = this.score;
    this.totalPlatforms += this.lastPlatforms;
    this.totalSprings += this.lastSprings;
  
    this.showEndScreen();
  };

  moveUp(speed) {
    this.platforms.forEach(o => {
      o.y += speed;
      if (o.spring) o.spring.y += speed;
    });
    this.position += speed;
    for (let bg of this.bg) {
      bg.y += speed / this.player.level.bg.distance;
    }
  };

  createPlatforms() {
    while (this.platforms.length < 40) new Platform(this.player.level);
    this.stage.setChildIndex(this.player, this.stage.getNumChildren()-1);
  };

  onTick(e) {
    if (this.started && !e.paused) {
      this.player.jump();
      this.player.move();
      for (let p of this.platforms.filter(o => o.type == "moving")) p.move();
      this.scoreTxt.text = this.score.toLocaleString() + " m";
      this.stage.setChildIndex(this.scoreTxt, this.stage.getNumChildren() - 1);
      this.badgesCount.text = "Badges: " + this.badges.length + "/" + this.allBadges.length;
      this.stage.setChildIndex(this.badgesCount, this.stage.getNumChildren() - 1);
    }
    this.stage.update(e);
  };

  showStartScreen() {
    const hs = new createjs.Text(this.highScore.toLocaleString() + " m", "30px riffic", "#fff");
    hs.y = 500;
    hs.x = 40;
  
    const instructionsBtn = new createjs.Shape();
    instructionsBtn.graphics.beginFill("#fff").drawRect(0, 42, 140, 138);
    instructionsBtn.alpha = 0.01;
    instructionsBtn.addEventListener('click', this.showInstructionsScreen);
  
    const statsBtn = new createjs.Shape();
    statsBtn.graphics.beginFill("#fff").drawCircle(455, 25, 70);
    statsBtn.alpha = 0.01;
    statsBtn.addEventListener('click', this.showStatsScreen);
  
    this.showScreen('startScreen', [instructionsBtn, statsBtn, hs]);
  };

  showInstructionsScreen() {
    const homeBtn = new createjs.Shape();
    homeBtn.graphics.beginFill("#fff").drawRect(400, 0, 100, 70);
    homeBtn.alpha = 0.01;
    homeBtn.addEventListener('click', this.showStartScreen);
    
    this.showScreen('instructionsScreen', [homeBtn]);
  };

  showStatsScreen() {
    const homeBtn = new createjs.Shape();
    homeBtn.graphics.beginFill("#fff").drawRect(400, 0, 100, 70);
    homeBtn.alpha = 0.01;
    homeBtn.addEventListener('click', this.showStartScreen);

    let statsTxt = `\nTotal distance: ${this.totalScore.toLocaleString()} m`;
    statsTxt += `\nBest distance: ${this.highScore.toLocaleString()} m`;
    statsTxt += `\nLast game distance: ${this.lastScore.toLocaleString()} m`;
    statsTxt += `\nAverage game distance: ${Math.round((this.totalScore / this.gamesPlayed)).toLocaleString()} m`;
  
    statsTxt += "\n\nGames Played: " + this.gamesPlayed.toLocaleString();
    statsTxt += "\nTotal time played: " + msToTimeWords(this.totalTime);
    statsTxt += "\nLast game duration: " + msToTimeWords(this.lastTime);
  
    statsTxt += "\n\nTotal jumps: " + this.totalPlatforms.toLocaleString();
    statsTxt += "\nJumps in last game: " + this.lastPlatforms.toLocaleString();
  
    statsTxt += "\n\nTotal springs jumped: " + this.totalSprings.toLocaleString();
    statsTxt += "\nSprings jumped in last game: " + this.lastSprings.toLocaleString();
    statsTxt += "\nBest spring jump streak: " + this.bestSpringStreak;

    const stats = new createjs.Text(statsTxt, "18px riffic", "#fff");
    stats.lineHeight = 28;
    stats.y = 180;
    stats.x = 60;
  
    this.showScreen('statsScreen', [homeBtn, stats]);
  };

  showEndScreen() { 
    const s = new createjs.Text(this.lastScore.toLocaleString() + " m", "30px riffic", "#fff");
    s.y = 375;
    s.x = 50;
    const hs = new createjs.Text(this.highScore.toLocaleString() + " m", "30px riffic", "#fff");
    hs.y = 515;
    hs.x = 50;
  
    const homeBtn = new createjs.Shape();
    homeBtn.graphics.beginFill("#fff").drawRect(456, 577, 50, 120);
    homeBtn.alpha = 0.01;
    homeBtn.addEventListener('click', this.showStartScreen);
  
    this.showScreen('endScreen', [s, hs, homeBtn]);
  };

  showScreen(screenName, extraElems) {
    this.stage.removeAllChildren();

    const screen = new createjs.Bitmap(this.queue.getResult(screenName));
    screen.x = screen.y = 0;
    screen.scaleX = screen.scaleY = 0.5;
  
    const startBtn = new createjs.Shape();
    startBtn.graphics.beginFill("#fff").drawRect(108, 683, 268, 83);
    startBtn.alpha = 0.01;
    startBtn.addEventListener('click', this.start);

    this.stage.addChild(screen, startBtn);
    for (let e of extraElems) this.stage.addChild(e);

    this.showMute();
  };

  showMute() {
    if (this.muteBtn != null) {
      this.stage.removeChild(this.muteBtn);
      this.muteBtn = null;
    }

    if (createjs.Sound.muted) this.muteBtn = new createjs.Bitmap(this.queue.getResult('muted'));
    else this.muteBtn = new createjs.Bitmap(this.queue.getResult('unmuted'));
    this.muteBtn.x = 10;
    this.muteBtn.y = 750;
    this.muteBtn.scaleX = this.muteBtn.scaleY = 0.3;

    this.muteBtn.addEventListener('click', () => {
      createjs.Sound.muted = !createjs.Sound.muted;
      this.showMute();
    });

    this.stage.addChild(this.muteBtn);
  };
  
  showPause(e) {
    if (this.pauseBtn != null) {
      this.stage.removeChild(this.pauseBtn);
      this.pauseBtn = null;
    }

    if (e.paused) this.pauseBtn = new createjs.Bitmap(this.queue.getResult('continue'));
    else this.pauseBtn = new createjs.Bitmap(this.queue.getResult('pause'));
    this.pauseBtn.x = 60;
    this.pauseBtn.y = 750;
    this.pauseBtn.scaleX = this.pauseBtn.scaleY = 0.4;

    this.pauseBtn.addEventListener('click', () => {
      e.paused = !e.paused;
      this.showPause(e);
    });

    this.stage.addChild(this.pauseBtn);
  };
  keyDown(e) {
    if (this.started)
      switch (e.keyCode) {
        case 37: this.keys.left = true; break;
        case 39: this.keys.right = true; break;
        case 32:
          createjs.Ticker.paused = !createjs.Ticker.paused;
          this.showPause(createjs.Ticker);
          break;  
      }
    else if (e.keyCode == 32) this.start();
    if (e.keyCode == 77) {
      createjs.Sound.muted = !createjs.Sound.muted;
      this.showMute();
    }
  };

  keyUp(e) {
    if (this.started)
      switch (e.keyCode) {
        case 37: this.keys.left = false; break;
        case 39: this.keys.right = false; break;
      }
  };

  tilt(e) {
    this.tilt = e.gamma;
    if (this.tilt >  90) this.tilt =  90;
    if (this.tilt < -90) this.tilt = -90;
  };
}

function msToTimeWords(s) {
  let words = (s / 3.6e6 | 0) ? (s / 3.6e6 | 0) + ' h ' : '';
  words += ((s % 3.6e6) / 6e4 | 0) ? ((s % 3.6e6) / 6e4 | 0) + ' min ' : '';
  words += ((s % 6e4) / 1000 | 0) + ' s';
  return words;
}