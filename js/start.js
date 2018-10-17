let game = new Game(FBInstant);

function init() {
  FBInstant.initializeAsync().then(function() {
    game.load();

    FBInstant.startGameAsync().then(function() {
      createjs.Ticker.addEventListener('tick', game.onTick);
      createjs.Ticker.setFPS(60);
      window.addEventListener('deviceorientation', game.tilt);
    });
  });
};

//Events
window.onkeydown = game.keyDown;
window.onkeyup = game.keyUp;
window.onload = game.init;