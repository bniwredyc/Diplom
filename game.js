'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(v){
    if (v instanceof Vector) {
     return new Vector(this.x + v.x, this.y + v.y)
   } else {
     throw new Error('v - must to be a vector');
   }
  }

  times(n){
    return new Vector(this.x * n, this.y * n)
  }
}


class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if (pos instanceof Vector) {
      this.pos = pos;
    } else{
      throw new Error('pos - must to be a vector');
    }

    if (size instanceof Vector) {
      this.size = size;
    } else{
      throw new Error('size - must to be a vector');
    }

    if (speed instanceof Vector) {
      this.speed = speed;
    } else{
      throw new Error('speed - must to be a vector');
    }
  }

  get type () {
    return 'actor'
  }

  act(){

  }

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
    if (item instanceof Actor && arguments.length != 0) {
      if (item === this) {
        return false;
      }
      if (item.right < this.left || item.top > this.bottom || item.left > this.right || item.bottom < this.top) {
        return false;
      }
      if (item.right === this.left || item.left === this.right || item.top === this.bottom || item.bottom === this.top) {
        return false;
      }
      if (-item.left === this.left && -item.top === this.top && -item.right === this.right && -item.bottom === this.bottom) {
        return false;
      }
      if (item.left > this.left && item.top > this.top && item.right < this.right && item.bottom < this.bottom) {
        return true;
      }
      if (item.left < this.right && item.right > this.left && item.top < this.bottom && item.bottom > this.top) {
        return true;
      }

    } else {
      throw new Error('Object must to be an instance of Actor');
    }
  }
}

class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid;
    this.actors = actors;
    this.height = grid.length;
    this.status = null;
    this.finishDelay = 1;
    this.player = this.actors.filter((actor) => actor.type === 'player')[0];
  }

  get width() {
    let max = 0;

    if (this.grid.length) {
      for (let i = 0; i < this.grid.length; i++) {
        if (max < this.grid[i].length) {
          max = this.grid[i].length;
        }
      }
    }
    return max;
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
    this.actors.splice(this.actors.indexOf(actor), 1);
  }

  noMoreActors(type) {
    return !this.actors.some(actor => actor.type === type);
  }

  playerTouched(type, actor) {
    if (type === 'lava' || type === 'fireball') {
      this.status = "lost";
    } else if (type === "coin") {
      this.actors = this.actors.filter(other => other !== actor);
      if (this.noMoreActors('coin')) {
        this.status = "won";
      }
    }
  }
}

class LevelParser {
  constructor(symbol) {
    this.symbol = symbol;
  }
  actorFromSymbol(ch) {
    if (!this.symbol) {
      return this.symbol = undefined;
    }
    return this.symbol[ch];
  }

  obstacleFromSymbol(ch) {
    if (ch === 'x') return 'wall';
    if (ch === '!') return 'lava';
    return undefined;
  }

  createGrid(plan) {
    if (!plan.length) return [];

    return plan.map(char => {
      return char.split('').map(ch => this.obstacleFromSymbol(ch));
    });
  }

  createActors(plan) {
    if (!plan.length) return [];

    return plan.map(char => {
      return char.split('').map(ch => {

        if (ch === 'o' || ch === 'z') return [];

        });
     });



  }

}


class Player {
  constructor(pos = new Vector(0, 0), size = new Vector(0.8, 1.5)) {
    this.pos = pos.plus(new Vector(10, -0.5));
    this.size = size;
    this.type = 'player';
  }
}

class Fireball extends Actor {
  constructor(pos,speed) {
    super();

     this.pos   = pos;
     this.speed = speed;
  }
  get type () {
    return 'fireball'
  }

  getNextPosition(time = 1) {
   if (this.speed) {
     let newPosX = this.pos.x + this.speed.x * time;
     let newPosY = this.pos.y + this.speed.y * time;
     return new Vector(newPosX, newPosY);
   }

   return this.pos;
 }

 handleObstacle() {
   this.speed.x = -this.speed.x;
   this.speed.y = -this.speed.y;
 }

 act(time, level) {
    let newPos = this.pos.plus(this.speed.times(time));

    if (!level.obstacleAt(newPos, this.size)) {
      this.pos = this.getNextPosition(time);
    } else {
      this.handleObstacle();
    }
  }

}
