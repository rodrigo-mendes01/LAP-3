/*     Lode Runner

01234567890123456789012345678901234567890123456789012345678901234567890123456789
*/

// GLOBAL VARIABLES

// tente não definir mais nenhuma variável global
/*
-------------------------------------------||-------------------------------------------
TODO:
  Bugs:
    - Queda ladrão extremidades, impede feature do ouro
    - Ladrões em cima uns dos outros, impede choque de atores
  
  Refactors:
    - Mudar transição de nível de Hero para GameControl

  Features:
    - Imagem shoot
    - HTML melhorado
      - Pontos
      - Botão reset
      - Select level
    - Sons variados
-------------------------------------------||----------------------------------------------
*/

// Autores: Rodrigo Mendes (55308), Tomás Silva (55749)

let empty, hero, control, audio;

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

  canGoUp() {
    if (
      this.y - 1 >= 0 &&
      control.world[this.x][this.y].imageName == "ladder" &&
      (control.world[this.x][this.y - 1] == empty ||
        control.world[this.x][this.y - 1].imageName == "ladder" ||
        control.world[this.x][this.y - 1].imageName == "rope") &&
      !control.alreadyOcupied(this.x, this.y - 1)
    )
      return true;
    return false;
  }

  canGoDown() {
    if (
      this.y + 1 < WORLD_HEIGHT &&
      (control.world[this.x][this.y].imageName == "ladder" ||
        control.world[this.x][this.y + 1].imageName == "ladder" ||
        control.world[this.x][this.y].imageName == "rope" ||
        control.world[this.x][this.y + 1].imageName == "chimney" ||
        control.world[this.x][this.y + 1] == empty) &&
      control.world[this.x][this.y + 1].imageName != "brick" &&
      control.world[this.x][this.y + 1].imageName != "stone" &&
      !control.alreadyOcupied(this.x, this.y + 1)
    )
      return true;
    return false;
  }

  canGoLeft() {
    if (
      this.x - 1 >= 0 &&
      control.world[this.x - 1][this.y].imageName != "brick" &&
      control.world[this.x - 1][this.y].imageName != "stone" &&
      (control.world[this.x][this.y + 1] != empty ||
        control.world[this.x][this.y].imageName == "rope" ||
        control.worldActive[this.x][this.y + 1] != empty) &&
      (control.world[this.x - 1][this.y + 1].imageName == "brick" ||
        control.world[this.x - 1][this.y].imageName == "rope" ||
        control.world[this.x - 1][this.y] == empty ||
        control.world[this.x - 1][this.y].imageName == "ladder" ||
        control.world[this.x - 1][this.y].imageName == "gold" ||
        control.worldActive[this.x][this.y + 1] != empty) &&
      !control.alreadyOcupied(this.x - 1, this.y)
    )
      return true;
    return false;
  }

  canGoRight() {
    if (
      this.x + 1 < WORLD_WIDTH &&
      control.world[this.x + 1][this.y].imageName != "brick" &&
      control.world[this.x + 1][this.y].imageName != "stone" &&
      (control.world[this.x][this.y + 1] != empty ||
        control.world[this.x][this.y].imageName == "rope" ||
        control.worldActive[this.x][this.y + 1] != empty) &&
      (control.world[this.x + 1][this.y + 1].imageName == "brick" ||
        control.world[this.x + 1][this.y].imageName == "rope" ||
        control.world[this.x + 1][this.y] == empty ||
        control.world[this.x + 1][this.y].imageName == "ladder" ||
        control.world[this.x + 1][this.y].imageName == "gold" ||
        control.worldActive[this.x + 1][this.y + 1] != empty) &&
      !control.alreadyOcupied(this.x + 1, this.y)
    ) {
      return true;
    }
    return false;
  }

  fall() {
    if (
      this.y + 1 < WORLD_HEIGHT &&
      (control.world[this.x][this.y + 1] == empty ||
        control.world[this.x][this.y + 1].imageName == "gold") &&
      control.world[this.x][this.y].imageName != "rope" &&
      control.world[this.x][this.y].imageName != "ladder" &&
      control.worldActive[this.x][this.y + 1] == empty
    ) {
      if (this.y % 2 == 0)
        if (this instanceof Hero) this.imageName = "hero_falls_left";
        else this.imageName = "robot_falls_left";
      else if (this instanceof Hero) this.imageName = "hero_falls_right";
      else this.imageName = "robot_falls_right";
      this.move(0, 1);
    }
    if (control.world[this.x][this.y + 1].imageName == "rope") {
      this.move(0, 1);
    }
  }

  goUp() {
    if (this.canGoUp(this)) {
      if (this.y % 2 == 0) {
        if (this instanceof Hero) this.imageName = "hero_on_ladder_right";
        else this.imageName = "robot_on_ladder_right";
      } else {
        if (this instanceof Hero) this.imageName = "hero_on_ladder_left";
        else this.imageName = "robot_on_ladder_left";
      }
      this.move(0, -1);
    }
  }

  goDown() {
    if (this.canGoDown(this)) {
      if (this.y % 2 == 0) {
        if (this instanceof Hero) this.imageName = "hero_on_ladder_right";
        else this.imageName = "robot_on_ladder_right";
      } else {
        if (this instanceof Hero) this.imageName = "hero_on_ladder_left";
        else this.imageName = "robot_on_ladder_left";
      }
      this.move(0, 1);
    }
  }

  goRight() {
    if (this.canGoRight(this)) {
      if (control.world[this.x + 1][this.y].imageName == "rope") {
        if (this.x % 2 == 0) {
          if (this instanceof Hero) this.imageName = "hero_on_rope_left";
          else this.imageName = "robot_on_rope_left";
        } else {
          if (this instanceof Hero) this.imageName = "hero_on_rope_right";
          else this.imageName = "robot_on_rope_right";
        }
      } else {
        if (this instanceof Hero) this.imageName = "hero_runs_right";
        else this.imageName = "robot_runs_right";
      }
      this.move(1, 0);
    }
  }

  goLeft() {
    if (this.canGoLeft(this)) {
      if (control.world[this.x - 1][this.y].imageName == "rope") {
        if (this.x % 2 == 0) {
          if (this instanceof Hero) hero.imageName = "hero_on_rope_left";
          else this.imageName = "robot_on_rope_left";
        } else {
          if (this instanceof Hero) hero.imageName = "hero_on_rope_right";
          else this.imageName = "robot_on_rope_right";
        }
      } else {
        if (this instanceof Hero) this.imageName = "hero_runs_left";
        else this.imageName = "robot_runs_left";
      }
      this.move(-1, 0);
    }
  }

  animation(k) {
    switch (k) {
      case " ":
        this.shoot(this);
        break;
      case null:
        this.fall(this);
        break;
      default: {
        let [dx, dy] = k;
        switch (dx) {
          case 0:
            switch (dy) {
              // player goes up
              case -1:
                this.goUp(this);
                break;
              // player goes down
              case 1:
                this.goDown(this);
                break;
            }
            break;
          //player goes right
          case 1:
            this.goRight(this);
            break;
          //player goes left
          case -1:
            this.goLeft(this);
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

  shoot(hero) {
    if (control.world[hero.x - 1][hero.y + 1].imageName == "brick") {
      hero.imageName = "hero_shoots_left";
      control.world[hero.x - 1][hero.y + 1].hide();
      setTimeout(GameFactory.actorFromCode, 5000, "t", hero.x - 1, hero.y + 1);
    }
  }

  animation() {
    var k = control.getKey();
    if (k != null && audio == null) {
      audio = new Audio(
        "http://ctp.di.fct.unl.pt/miei/lap/projs/proj2020-3/files/louiscole.m4a"
      );
      audio.loop = true;
      audio.play();
    }
    super.animation(k);
    //recolha do ouro
    if (control.world[this.x][this.y].imageName == "gold") {
      control.world[this.x][this.y].hide();
      this.show();
    }
    if (control.isGoldCollected() && this.verification == 0) {
      this.verification = 1;
      control.appearFinalLadder();
    }
    //da um nivel novo depois dos requisitos anteriores
    // mudar para game control
    if (
      control.isGoldCollected() &&
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
    var hasGold;
    this.hasGold = false;
    var stop;
    this.stop = false;
  }

  robotMovement() {
    if (hero.y > this.y) {
      if (super.canGoDown(this)) {
        if (
          control.world[this.x][this.y + 1] == empty &&
          control.world[this.x][this.y].imageName != "rope" &&
          control.world[this.x][this.y].imageName != "ladder"
        )
          return null;
        else return [0, 1];
      } else {
        if (hero.x > this.x) {
          if (super.canGoRight(this)) {
            return [1, 0];
          }
        } else if (hero.x < this.x) {
          if (super.canGoLeft(this)) return [-1, 0];
        }
      }
    } else {
      if (hero.y < this.y) {
        if (super.canGoUp(this)) {
          return [0, -1];
        } else {
          if (hero.x > this.x) {
            if (super.canGoRight(this)) {
              return [1, 0];
            }
          } else if (hero.x < this.x) {
            if (super.canGoLeft(this)) return [-1, 0];
          }
        }
      } else {
        if (hero.y == this.y) {
          if (hero.x > this.x) {
            if (super.canGoRight(this)) {
              return [1, 0];
            }
          } else if (hero.x < this.x) {
            if (super.canGoLeft(this)) return [-1, 0];
          }
        }
      }
    }
    return null;
  }

  animation() {
    if (this.time % 2 == 0) return;
    if (
      this.x > 0 &&
      this.x < WORLD_WIDTH - 1 &&
      control.world[this.x][this.y] == empty &&
      control.world[this.x + 1][this.y].imageName == "brick" &&
      control.world[this.x - 1][this.y].imageName == "brick" &&
      this.stop == false
    ) {
      if (this.hasGold) {
        GameFactory.actorFromCode("o", this.x, this.y - 1);
        this.hasGold = false;
      }
      this.stop = true;
      control.world[this.x][this.y] == empty;
      setTimeout(this.rearrangeRobot, 5000, this);
    }
    if (this.stop == false) {
      var k = this.robotMovement(hero, this);
      super.animation(k);
      if (control.world[this.x][this.y].imageName == "gold" && !this.hasGold) {
        control.world[this.x][this.y].hide();
        this.hasGold = true;
        this.show();
      }
    }
  }

  rearrangeRobot(robot) {
    this.stop = false;
    robot.move(1, -1);
    GameFactory.actorFromCode("t", robot.x - 1, robot.y + 1);
  }
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
    this.loadLevel(3);
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
  getWorld(x, y) {
    return this.world[x][y];
  }
  getWorldActive(x, y) {
    return this.worldActive[x][y];
  }
  keyDownEvent(k) {
    control.key = k.keyCode;
  }
  keyUpEvent(k) {}

  isGoldCollected() {
    for (let i = 0; i < WORLD_WIDTH; i++) {
      for (let j = 0; j < WORLD_HEIGHT; j++) {
        if (
          this.worldActive[i][j] instanceof Robot &&
          this.worldActive[i][j].hasGold
        )
          return false;
      }
    }
    for (let i = 0; i < WORLD_WIDTH; i++) {
      for (let j = 0; j < WORLD_HEIGHT; j++) {
        if (this.world[i][j].imageName == "gold") return false;
      }
    }
    return true;
  }

  alreadyOcupied(x, y) {
    if (
      this.worldActive[x][y] == empty ||
      this.worldActive[x][y] instanceof Hero
    )
      return false;
    return true;
  }

  appearFinalLadder() {
    for (let i = 0; i < WORLD_WIDTH; i++) {
      for (let j = 0; j < WORLD_HEIGHT; j++) {
        if (this.world[i][j] instanceof Ladder) this.world[i][j].makeVisible();
      }
    }
  }
}

// HTML FORM

function onLoad() {
  // Asynchronously load the images an then run the game
  GameImages.loadAll(function () {
    new GameControl();
  });
}

function toggleMusic() {
  if (audio != null)
    if (audio.paused == false) audio.pause();
    else audio.play();
}

function b2() {
  mesg("button2");
}
