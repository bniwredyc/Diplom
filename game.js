'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(v) {
    if (!(v instanceof Vector)) {
      throw new Error('v - must to be a vector');
    }

    return new Vector(this.x + v.x, this.y + v.y)
  }

  times(n) {
    return new Vector(this.x * n, this.y * n);
  }
}


class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {

    if (!(pos instanceof Vector)) {
      throw new Error('pos - must to be a Vector');
    }

    if (!(size instanceof Vector)) {
      throw new Error('size - must to be a Vector');
    }

    if (!(speed instanceof Vector)) {
      throw new Error('speed - must to be a Vector');
    }

    this.pos = pos;
    this.size = size;
    this.speed = speed;
  }

  get type() {
    return 'actor'
  }

  act() {}

  get left() {
    return this.pos.x;
  }

  get right() {
    return this.pos.x + this.size.x;
  }

  get top() {
    return this.pos.y;
  }

  get bottom() {
    return this.pos.y + this.size.y;
  }

  isIntersect(item) {
    if (!(item instanceof Actor)) throw new Error('Object must to be an instance of Actor');

    if (item === this) {
      return false
    }
    if (item.left >= this.right) {
      return false
    }
    if (item.right <= this.left) {
      return false
    }
    if (item.top >= this.bottom) {
      return false
    }
    if (item.bottom <= this.top) {
      return false
    }
    return true;
  }
}

class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid.slice();
    this.actors = actors.slice();
    this.height = this.grid.length;
    this.width = Math.max(0,...this.grid.map(subArray => subArray.length));
    this.status = null;
    this.finishDelay = 1;
    this.player = this.actors.find((actor) => actor.type === 'player');
  }

  isFinished() {
    return this.status !== null && this.finishDelay < 0;
  }

  actorAt(item) {
    return this.actors.find(actor => actor.isIntersect(item));
  }

  obstacleAt(pos, size) {
    const xStart = Math.floor(pos.x);
    const xEnd = Math.ceil(pos.x + size.x);
    const yStart = Math.floor(pos.y);
    const yEnd = Math.ceil(pos.y + size.y);

    if (xStart < 0 || xEnd > this.width || yStart < 0) {
      return 'wall';
    }

    if (yEnd > this.height) {
      return 'lava';
    }

    for (let y = yStart; y < yEnd; y++) {
      for (let x = xStart; x < xEnd; x++) {
        let fieldType = this.grid[y][x];
        if (fieldType) {
          return fieldType;
        }
      }
    }
  }

  removeActor(actor) {
    // тут ошибка
    // не могу понять в чем? Проверил, индекс ищет и вырезает
    this.actors.splice(this.actors.indexOf(actor), 1);
  }

  noMoreActors(type) {
    return !this.actors.some(actor => actor.type === type);
  }

  playerTouched(type, actor) {
    if (this.status !== null) {
      return;
    }

    if (type === 'lava' || type === 'fireball') {
      this.status = 'lost';
    }

    if (type === 'coin') {
      this.removeActor(actor);
      if (this.noMoreActors('coin')) {
        this.status = 'won';
      }
    }
  }
}

class LevelParser {
  constructor(symbol = {}) {
    this.symbol = symbol;
  }

  actorFromSymbol(ch) {
   return this.symbol[ch];
  }

  obstacleFromSymbol(ch) {
    switch (ch) {
      case 'x' : return 'wall';
      case '!' : return 'lava';
      default  : return undefined;
    }

  }

  createGrid(plan) {
    return plan.map((char = []) => {
      return char.split('').map(ch => this.obstacleFromSymbol(ch));
    });
  }

  createActors(plan) {
    let actors = [];

    for (let y = 0; y < plan.length; y++) {
      for (let x = 0; x < plan[y].length; x++) {
        if (typeof this.symbol[plan[y][x]] === 'function') {
          let actor = new this.symbol[plan[y][x]](new Vector(x, y));
          if (actor instanceof Actor) {
            actors.push(actor);
          }
        }
      }
    }
    return actors;
  }

  parse(plan) {
    return new Level(this.createGrid(plan), this.createActors(plan));
  }
}

class Fireball extends Actor {
  constructor(pos, speed) {
    super(pos, new Vector(1, 1), speed);
  }

  get type() {
    return 'fireball'
  }

  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }

  handleObstacle() {
    this.speed = this.speed.times(-1);
  }

  act(time, level) {
    let newPos = this.getNextPosition(time);
    if (level.obstacleAt(newPos, this.size)) {
      this.handleObstacle();
      return;
    }
    this.pos = newPos;
  }
}

class HorizontalFireball extends Fireball {
  constructor(pos) {
    super(pos, new Vector(2, 0));
  }
}

class VerticalFireball extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 2));
  }
}

class FireRain extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 3));
    this.oldPos = pos;
  }

  handleObstacle() {
    this.pos = this.oldPos;
  }
}

const random = (min, max) => Math.floor((max - min) * Math.random()) + min;

class Coin extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
    this.post = this.pos;
    this.spring = random(0, 2 * Math.PI);
    this.springSpeed = 8;
    this.springDist = 0.07;
  }

  get type() {
    return 'coin';
  }

  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }

  getSpringVector() {
    let y = Math.sin(this.spring) * this.springDist;
    return new Vector(0, y);
  }

  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.pos = this.post.plus(this.getSpringVector());
  }

  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

class Player extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5));
  }
  get type() {
    return 'player';
  }
}

const actorDict = {
  "@": Player,
  "=": HorizontalFireball,
  "|": VerticalFireball,
  "v": FireRain,
  "o": Coin
};

const parser = new LevelParser(actorDict);
loadLevels()
  .then(schemas => runGame(JSON.parse(schemas), parser, DOMDisplay))
  .then(() => alert('Вы выиграли приз!'));
