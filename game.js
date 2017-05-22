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
      if (item === item) {
        return false;
      }
      // if (item.left >= this.left || item.top >= this.top) {
      //   return false;
      // }
      // if (item.left == this.left && item.top == this.top && item.right == this.right && item.bottom == this.bottom) {
      //   return false;
      // }
    } else{
      throw new Error('Object must to be an instance of Actor');
    }
  }
}
