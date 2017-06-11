'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(v) {
    // лучше не опускать фигурные скобки
    if (!(v instanceof Vector)) throw new Error('v - must to be a vector');

    return new Vector(this.x + v.x, this.y + v.y)
  }

  times(n) {
    return new Vector(this.x * n, this.y * n);
  }
}


class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {

    // сейчас будет одинаковое сообщение для всех параметров, лучше разбить на 4 if
    if (!(pos instanceof Vector && size instanceof Vector && speed instanceof Vector)) throw new Error('pos - must to be a vector');

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
    // лишняя проверка длины arguments
    if (!(item instanceof Actor && arguments.length != 0)) throw new Error('Object must to be an instance of Actor');

    // лучше сделать несколько if - непонятно что тут проиходит
    if (item.left < this.right && item.right > this.left && item.top < this.bottom && item.bottom > this.top && item !== this) {
      return true;
    // else не нужен т.к. if заканчивается на return
    } else {
      return false;
    }
  }
}

class Level {
  constructor(grid = [], actors = []) {
    // тут лучше создать копии grid и actors
    this.grid = grid;
    this.actors = actors;
    this.height = grid.length;
    this.status = null;
    this.finishDelay = 1;
    this.player = this.actors.find((actor) => actor.type === 'player');
  }

  get width() {
    // можно убарть эту проверку, если в max первым аргументом подставить 0
    if (this.grid.length === 0) return 0;
    return Math.max(...this.grid.map(subArray => subArray.length));

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
    // не опускайте фигурные скобки
    if (type === 'lava' || type === 'fireball') this.status = 'lost';
    if (type === 'coin') {
      // здесь должен использоваться метод removeActor
      this.actors = this.actors.filter(other => other !== actor);
      if (this.noMoreActors('coin')) {
        this.status = 'won';
      }
    }
  }
}

class LevelParser {
  constructor(symbol) {
    this.symbol = symbol;
  }
  actorFromSymbol(ch) {
    // лучшу в конструкторе присвоить значение по-умолчанию {} и убрать проверку
    if (this.symbol) return this.symbol[ch];
  }

  obstacleFromSymbol(ch) {
    // здесь больше подходит switch
    if (ch === 'x') return 'wall';
    if (ch === '!') return 'lava';
    return undefined;
  }

  createGrid(plan) {
    // можно не проверять map вернёт пустой массив, если длина 0
    // чтобы не возникало ошибки, в случае вызова метода без парамтров,
    // лушче добавить значение аргумента по-умолчанию
    if (!plan.length) return [];

    return plan.map(char => {
      return char.split('').map(ch => this.obstacleFromSymbol(ch));
    });
  }

  createActors(plan) {
    let actors = [];
    // присвоить значение по-умолчанию и убрать проверку
    if (this.symbol === undefined) return [];

    for (let x = 0; x < plan.length; x++) {
      for (let y = 0; y < plan[x].length; y++) {

        if (typeof this.symbol[plan[x][y]] === 'function') {
          // странная последовательность - по-идее должно быть new Vector(x, y)
          let actor = new this.symbol[plan[x][y]](new Vector(y, x));
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
    // speed по-умолчанию 0, так что проверку можно убрать
    if (this.speed) {
      return this.pos.plus(this.speed.times(time));
    }
    return this.pos;
  }

  handleObstacle() {
    this.speed = this.speed.times(-1);
  }

  act(time, level) {
    let newPos = this.getNextPosition(time);
    // фигурные скобри
    if (level.obstacleAt(newPos, this.size)) return this.handleObstacle();

    // метод не должен ничего позвращать
    return this.pos = newPos;
  }
}

class HorizontalFireball extends Fireball {
  constructor(pos) {
    super(pos, new Vector(2, 0));
    // лишнее - размер всех шаровых молний задаётся в конструкторе базового класса
    this.size = new Vector(1, 1);
  }
}

class VerticalFireball extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 2));
    // лишнее - размер всех шаровых молний задаётся в конструкторе базового класса
    this.size = new Vector(1, 1);
  }
}

class FireRain extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 3));
    // лишнее - размер всех шаровых молний задаётся в конструкторе базового класса
    this.size = new Vector(1, 1);
    this.oldPos = pos;
  }

  handleObstacle() {
    this.pos = this.oldPos;
  }
}

const random = (min, max) => Math.floor((max - min) * Math.random()) + min;

class Coin extends Actor {
  constructor(pos) {
    super(pos, new Vector(0.6, 0.6));
    // pos должно заваться через констуктор базового класса
    this.pos = this.pos.plus(new Vector(0.2, 0.1));
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
  constructor(pos) {
    super(pos, new Vector(0.8, 1.5));
    // через конструктор базового класса
    this.pos = this.pos.plus(new Vector(0, -0.5));
  }
  get type() {
    return 'player';
  }
}

// уровни загружаются через функцию loadLevels
const schemas = [
  [
    "     v                 ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "  |xxx       w         ",
    "  o                 o  ",
    "  x               = x  ",
    "  x          o o    x  ",
    "  x  @    *  xxxxx  x  ",
    "  xxxxx             x  ",
    "      x!!!!!!!!!!!!!x  ",
    "      xxxxxxxxxxxxxxx  ",
    "                       "
  ],
  [
    "     v                 ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "  |                    ",
    "  o                 o  ",
    "  x               = x  ",
    "  x          o o    x  ",
    "  x  @       xxxxx  x  ",
    "  xxxxx             x  ",
    "      x!!!!!!!!!!!!!x  ",
    "      xxxxxxxxxxxxxxx  ",
    "                       "
  ],
  [
    "        |           |  ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "     |                 ",
    "                       ",
    "         =      |      ",
    " @ |  o            o   ",
    "xxxxxxxxx!!!!!!!xxxxxxx",
    "                       "
  ],
  [
    "                       ",
    "                       ",
    "                       ",
    "    o                  ",
    "    x      | x!!x=     ",
    "         x             ",
    "                      x",
    "                       ",
    "                       ",
    "                       ",
    "               xxx     ",
    "                       ",
    "                       ",
    "       xxx  |          ",
    "                       ",
    " @                     ",
    "xxx                    ",
    "                       "
  ],
  [
    "   v         v",
    "              ",
    "         !o!  ",
    "              ",
    "              ",
    "              ",
    "              ",
    "         xxx  ",
    "          o   ",
    "        =     ",
    "  @           ",
    "  xxxx        ",
    "  |           ",
    "      xxx    x",
    "              ",
    "          !   ",
    "              ",
    "              ",
    " o       x    ",
    " x      x     ",
    "       x      ",
    "      x       ",
    "   xx         ",
    "              "
  ]
];

const actorDict = {
  "@": Player,
  "=": HorizontalFireball,
  "|": VerticalFireball,
  "v": FireRain,
  "o": Coin
};

// Можно пройти уровень если после столкновения с шаровой молнией собрать последню монетку
const parser = new LevelParser(actorDict);
runGame(schemas, parser, DOMDisplay)
// console.log лучше заменить на alert
  .then(() => console.log('Вы выиграли приз!'));
