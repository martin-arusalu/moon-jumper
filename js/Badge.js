// Badges:
/*
  Levels
1. First steps - first game / level
2. The trees - level 2
3. Mountains - level 3
4. Clouds - level 4
5. Outer space - level 5
6. Approaching the Moon - level 6

  Distance
10k in game
50k in game
100k in game
200k in game
500k in game

50k total
100k total
200k total
500k total
1m total

  Games played
10 games played
20 games played
50 games played
100 games played
1k games played

  Time
10 min game
20 min game
30 min game
1h game
2h game

30min total
1h total
5h total
10h total
50h total

  Platforms
50 platforms in game
100 platforms in game
500 platforms in game
1k platforms in game
10k platforms in game

1k platforms total
5k platforms total
10k platforms total
30k platforms total
50k platforms total

  Springs
20 springs in game
50 springs in game
100 springs in game
500 springs in game
1k springs in game

100 springs total
500 springs total
1k springs total
5k springs total
10k springs total

*/
class Badge extends createjs.Sprite {
  constructor(platform) {
    super(game.queue.getResult('badge'), "badge");
    this.scaleX = this.scaleY = 0.2;
    this.width = 23.2;
    this.height = 47.6;
    this.x = platform.x + platform.width / 2 - this.width / 2;
    this.y = platform.y - this.height;
    this.platform = platform;
    game.stage.addChild(this);
  }
}