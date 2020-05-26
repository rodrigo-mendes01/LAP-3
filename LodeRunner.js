/*     Lode Runner

01234567890123456789012345678901234567890123456789012345678901234567890123456789
*/

// GLOBAL VARIABLES

// tente não definir mais nenhuma variável global
/*
-------------------------------------------||-------------------------------------------
TODO:

1-queda em camara lenta
2-ladrões a mexer(pensar num algoritmo para seguir)
3-ladroes a apanhar o ouro, a largar quando caem 
4-trocar o passar de nivel para dentro da class gamecontrol em vez de tar na funçao animiation
5-fazer o choque entre atores ativos,ou seja nao se podem anular uns aos outros
6-por na classe topo o que e da classe topo e tirar de la o q nao pode tar la
7-queda dos ladroes entre dois blocos
-------------------------------------------||----------------------------------------------
*/

let empty, hero, control;

// ACTORS

class Actor {
  constructor(x, y, imageName) {
    this.x = x;
    this.y = y;
    this.imageName = imageName;
    this.show();
  }
  draw(x, y) {
    control.ctx.drawImage(
      GameImages[this.imageName],
      x * ACTOR_PIXELS_X,
      y * ACTOR_PIXELS_Y
    );
  }
  move(dx, dy) {
    this.hide();
    this.x += dx;
    this.y += dy;
    this.show();
  }
}

class PassiveActor extends Actor {
  show() {
    control.world[this.x][this.y] = this;
    this.draw(this.x, this.y);
  }
  hide() {
    control.world[this.x][this.y] = empty;
    empty.draw(this.x, this.y);
  }
}

class ActiveActor extends Actor {
  constructor(x, y, imageName) {
    super(x, y, imageName);
    this.time = 0; // timestamp used in the control of the animations
  }
  show() {
    control.worldActive[this.x][this.y] = this;
    this.draw(this.x, this.y);
  }
  hide() {
    control.worldActive[this.x][this.y] = empty;
    control.world[this.x][this.y].draw(this.x, this.y);
  }
  animation() {
    var k = control.getKey();
    switch (k) {
      case " ":
        shoot();
        break;
      case null:
        fall();
        break;
      default: {
        let [dx, dy] = k;
        switch (dx) {
          case 0:
            switch (dy) {
              // player goes up
              case -1:
                goUp();
                break;
              // player goes down
              case 1:
                goDown();
                break;
            }
            break;
          //player goes right
          case 1:
            goRight();
            break;
          //player goes left
          case -1:
            goLeft();
            break;
        }
      }
    }
  }
}

class Brick extends PassiveActor {
  constructor(x, y) {
    super(x, y, "brick");
  }
}

class Chimney extends PassiveActor {
  constructor(x, y) {
    super(x, y, "chimney");
  }
}

class Empty extends PassiveActor {
  constructor() {
    super(-1, -1, "empty");
  }
  show() {}
  hide() {}
}

class Gold extends PassiveActor {
  constructor(x, y) {
    super(x, y, "gold");
  }
}

class Invalid extends PassiveActor {
  constructor(x, y) {
    super(x, y, "invalid");
  }
}

class Ladder extends PassiveActor {
  constructor(x, y) {
    super(x, y, "empty");
  }
  makeVisible() {
    this.imageName = "ladder";
    this.show();
  }
}

class Rope extends PassiveActor {
  constructor(x, y) {
    super(x, y, "rope");
  }
}

class Stone extends PassiveActor {
  constructor(x, y) {
    super(x, y, "stone");
  }
}

//-----------------------------------------------------------HERO--------------------------------------------------------

class Hero extends ActiveActor {
  constructor(x, y) {
    super(x, y, "hero_runs_left");
    let verification;
    this.verification = 0;
    hero = this;
  }
  animation() {
    super.animation();
    //recolha do ouro
    if (control.world[this.x][this.y].imageName == "gold") {
      control.world[this.x][this.y].hide();
      hero.show();
    }
    if (isGoldCollected() && this.verification == 0) {
      this.verification = 1;
      let x = firstEmptyX();
      for (
        let j = 0;
        control.world[firstEmptyX()][j].imageName != "brick";
        j++
      ) {
        GameFactory.actorFromCode("e", x, j);
      }
    }
    //da um nivel novo depois dos requesitos anteriores
    if (
      isGoldCollected() &&
      this.y == 0 &&
      control.world[this.x][this.y].imageName == "ladder"
    ) {
      control.level++;
      this.hide();
      control.loadLevel(control.level);
    }
  }
}

//------------------------------------------------ROBOT--------------------------------------------------------

class Robot extends ActiveActor {
  constructor(x, y) {
    super(x, y, "robot_runs_right");
    this.dx = 1;
    this.dy = 0;
  }
  animation() {}
}

// GAME CONTROL

class GameControl {
  constructor() {
    control = this;
    this.key = 0;
    this.time = 0;
    this.ctx = document.getElementById("canvas1").getContext("2d");
    empty = new Empty(); // only one empty actor needed
    this.world = this.createMatrix();
    this.worldActive = this.createMatrix();
    let level;
    this.level = 1;
    this.loadLevel(this.level);
    this.setupEvents();
  }
  createMatrix() {
    // stored by columns
    let matrix = new Array(WORLD_WIDTH);
    for (let x = 0; x < WORLD_WIDTH; x++) {
      let a = new Array(WORLD_HEIGHT);
      for (let y = 0; y < WORLD_HEIGHT; y++) a[y] = empty;
      matrix[x] = a;
    }
    return matrix;
  }
  loadLevel(level) {
    if (level < 1 || level > MAPS.length) fatalError("Invalid level " + level);
    let map = MAPS[level - 1]; // -1 because levels start at 1
    for (let x = 0; x < WORLD_WIDTH; x++)
      for (let y = 0; y < WORLD_HEIGHT; y++) {
        // x/y reversed because map stored by lines
        GameFactory.actorFromCode(map[y][x], x, y);
      }
  }
  getKey() {
    let k = control.key;
    control.key = 0;
    switch (k) {
      case 37:
      case 79:
      case 74:
        return [-1, 0]; //  LEFT, O, J
      case 38:
      case 81:
      case 73:
        return [0, -1]; //    UP, Q, I
      case 39:
      case 80:
      case 76:
        return [1, 0]; // RIGHT, P, L
      case 40:
      case 65:
      case 75:
        return [0, 1]; //  DOWN, A, K
      case 0:
        return null;
      default:
        return String.fromCharCode(k);
      // http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
    }
  }
  setupEvents() {
    addEventListener("keydown", this.keyDownEvent, false);
    addEventListener("keyup", this.keyUpEvent, false);
    setInterval(this.animationEvent, 1000 / ANIMATION_EVENTS_PER_SECOND);
  }
  animationEvent() {
    control.time++;
    for (let x = 0; x < WORLD_WIDTH; x++)
      for (let y = 0; y < WORLD_HEIGHT; y++) {
        let a = control.worldActive[x][y];
        if (a.time < control.time) {
          a.time = control.time;
          a.animation();
        }
      }
  }
  keyDownEvent(k) {
    control.key = k.keyCode;
  }
  keyUpEvent(k) {}
}

// Active Actor functions
function shoot() {
  if (control.world[hero.x - 1][hero.y + 1].imageName == "brick") {
    hero.imageName = "hero_shoots_left";
    control.world[hero.x - 1][hero.y + 1].hide();
    setTimeout(GameFactory.actorFromCode, 5000, "t", hero.x - 1, hero.y + 1);
  }
}

function fall() {
  if (
    (control.world[hero.x][hero.y + 1] == empty ||
      control.world[hero.x][hero.y + 1].imageName == "gold") &&
    control.world[hero.x][hero.y].imageName != "rope" &&
    control.world[hero.x][hero.y].imageName != "ladder" &&
    control.worldActive[hero.x][hero.y + 1] == empty
  ) {
    hero.hide();
    if (hero.y % 2 == 0) hero.imageName = "hero_falls_left";
    else hero.imageName = "hero_falls_right";
    hero.y += 1;
    hero.show();
  }
  if (control.world[hero.x][hero.y + 1].imageName == "rope") {
    hero.hide();
    hero.y += 1;
    hero.show();
  }
}

function goUp() {
  if (
    control.world[hero.x][hero.y].imageName == "ladder" &&
    (control.world[hero.x][hero.y - 1] == empty ||
      control.world[hero.x][hero.y - 1].imageName == "ladder" ||
      control.world[hero.x][hero.y - 1].imageName == "rope")
  ) {
    hero.hide();
    if (hero.y % 2 == 0) {
      hero.imageName = "hero_on_ladder_right";
    } else {
      hero.imageName = "hero_on_ladder_left";
    }
    hero.y += -1;
    hero.show();
  }
}

function goDown() {
  if (
    (control.world[hero.x][hero.y].imageName == "ladder" ||
      control.world[hero.x][hero.y + 1].imageName == "ladder" ||
      control.world[hero.x][hero.y].imageName == "rope" ||
      control.world[hero.x][hero.y + 1].imageName == "chimney" ||
      control.world[hero.x][hero.y + 1] == empty) &&
    control.world[hero.x][hero.y + 1].imageName != "brick" &&
    control.world[hero.x][hero.y + 1].imageName != "stone"
  ) {
    hero.hide();
    if (hero.y % 2 == 0) {
      hero.imageName = "hero_on_ladder_right";
    } else {
      hero.imageName = "hero_on_ladder_left";
    }
    hero.y += 1;
    hero.show();
  }
}

function goRight() {
  if (
    hero.x + 1 < WORLD_WIDTH &&
    control.world[hero.x + 1][hero.y].imageName != "brick" &&
    control.world[hero.x + 1][hero.y].imageName != "stone" &&
    (control.world[hero.x][hero.y + 1] != empty ||
      control.world[hero.x][hero.y].imageName == "rope") &&
    (control.world[hero.x + 1][hero.y + 1].imageName == "brick" ||
      control.world[hero.x + 1][hero.y].imageName == "rope" ||
      control.world[hero.x + 1][hero.y] == empty ||
      control.world[hero.x + 1][hero.y].imageName == "ladder" ||
      control.world[hero.x + 1][hero.y].imageName == "gold" ||
      control.worldActive[hero.x + 1][hero.y + 1] != empty)
  ) {
    hero.hide();
    if (control.world[hero.x + 1][hero.y].imageName == "rope") {
      if (hero.x % 2 == 0) {
        hero.imageName = "hero_on_rope_left";
      } else {
        hero.imageName = "hero_on_rope_right";
      }
    } else {
      hero.imageName = "hero_runs_right";
    }
    hero.x += 1;
    hero.show();
  }
}

function goLeft() {
  if (
    hero.x - 1 >= 0 &&
    control.world[hero.x - 1][hero.y].imageName != "brick" &&
    control.world[hero.x - 1][hero.y].imageName != "stone" &&
    (control.world[hero.x][hero.y + 1] != empty ||
      control.world[hero.x][hero.y].imageName == "rope") &&
    (control.world[hero.x - 1][hero.y + 1].imageName == "brick" ||
      control.world[hero.x - 1][hero.y].imageName == "rope" ||
      control.world[hero.x - 1][hero.y] == empty ||
      control.world[hero.x - 1][hero.y].imageName == "ladder" ||
      control.world[hero.x - 1][hero.y].imageName == "gold" ||
      control.worldActive[hero.x][hero.y + 1] != empty)
  ) {
    if (control.world[hero.x - 1][hero.y].imageName == "rope") {
      if (hero.x % 2 == 0) {
        hero.imageName = "hero_on_rope_left";
      } else {
        hero.imageName = "hero_on_rope_right";
      }
    } else {
      hero.imageName = "hero_runs_left";
    }
    hero.hide();
    hero.x -= 1;
    hero.show();
  }
}

//aux functions
function timeHandler(robo) {
  robo.hide();
  robo.x++;
  robo.y--;
  robo.show();
}
function robotMovement(heroActor, robotActor) {
  if (heroActor.y > robotActor.y) {
    if (canGoUp(robotActor)) {
      goUp(robotActor);
    } else {
      if (heroActor.x > robotActor.x) {
        if (canGoRight(robotActor)) {
          goRight(robotActor);
        } else goLeft(robotActor);
      } else if (heroActor.x < robotActor.y) {
        goLeft(robotActor);
      } else {
        goLeft(robotActor);
      }
    }
  } else {
    if (heroActor.y < robotActor.y) {
      if (canGoDown(robotActor)) {
        goDown(robotActor);
      } else {
        if (heroActor.x > robotActor.x) {
          if (canGoRight(robotActor)) {
            goRight(robotActor);
          } else goLeft(robotActor);
        } else if (heroActor.x < robotActor.y) {
          goLeft(robotActor);
        } else {
          goLeft(robotActor);
        }
      }
    }
  }
}
function canGoUp(robot) {
  if (
    control.world[robot.x][robot.y].imageName == "ladder" &&
    (control.world[robot.x][robot.y - 1] == empty ||
      control.world[robot.x][robot.y - 1].imageName == "ladder" ||
      control.world[robot.x][robot.y - 1].imageName == "rope")
  )
    return true;
  return false;
}
function canGoDown(robot) {
  if (
    (control.world[this.x][this.y].imageName == "ladder" ||
      control.world[this.x][this.y + 1].imageName == "ladder" ||
      control.world[this.x][this.y].imageName == "rope" ||
      control.world[this.x][this.y + 1].imageName == "chimney" ||
      control.world[this.x][this.y + 1] == empty) &&
    control.world[this.x][this.y + 1].imageName != "brick" &&
    control.world[this.x][this.y + 1].imageName != "stone"
  )
    return true;
  return false;
}
function canGoLeft(robot) {
  if (
    this.x + dx >= 0 &&
    dx == -1 &&
    control.world[this.x - 1][this.y].imageName != "brick" &&
    control.world[this.x - 1][this.y].imageName != "stone" &&
    (control.world[this.x][this.y + 1] != empty ||
      control.world[this.x][this.y].imageName == "rope") &&
    (control.world[this.x - 1][this.y + 1].imageName == "brick" ||
      control.world[this.x - 1][this.y].imageName == "rope" ||
      control.world[this.x - 1][this.y] == empty ||
      control.world[this.x - 1][this.y].imageName == "ladder" ||
      control.world[this.x - 1][this.y].imageName == "gold" ||
      control.worldActive[this.x][this.y + 1] != empty)
  )
    return true;
  return false;
}
function canGoRight(robot) {
  if (
    this.x + dx < WORLD_WIDTH &&
    dx == 1 &&
    control.world[this.x + 1][this.y].imageName != "brick" &&
    control.world[this.x + 1][this.y].imageName != "stone" &&
    (control.world[this.x][this.y + 1] != empty ||
      control.world[this.x][this.y].imageName == "rope") &&
    (control.world[this.x + 1][this.y + 1].imageName == "brick" ||
      control.world[this.x + 1][this.y].imageName == "rope" ||
      control.world[this.x + 1][this.y] == empty ||
      control.world[this.x + 1][this.y].imageName == "ladder" ||
      control.world[this.x + 1][this.y].imageName == "gold" ||
      control.worldActive[this.x + 1][this.y + 1] != empty)
  ) {
    return true;
  }
  return false;
}
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}
function isGoldCollected() {
  for (let i = 0; i < WORLD_WIDTH; i++) {
    for (let j = 0; j < WORLD_HEIGHT; j++) {
      if (control.world[i][j].imageName == "gold") return false;
    }
  }
  return true;
}
function firstEmptyX() {
  for (let i = 0; i < WORLD_WIDTH; i++) {
    if (control.world[i][0] == empty) return i;
  }
}

// HTML FORM

function onLoad() {
  // Asynchronously load the images an then run the game
  GameImages.loadAll(function () {
    new GameControl();
  });
}

function b1() {
  mesg("button1");
}
function b2() {
  mesg("button2");
}
