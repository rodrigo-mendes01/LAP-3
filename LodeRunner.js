/*     Lode Runner

01234567890123456789012345678901234567890123456789012345678901234567890123456789
*/

// GLOBAL VARIABLES

// tente não definir mais nenhuma variável global

// Autores: Rodrigo Mendes (55308), Tomás Silva (55749)
/* 
Funcionalidades implementadas:
      HTML:
        - Página web melhorada com fundo diferente, elementos centrados na
        página, título do jogo e informações relevantes.
        - Botão pause/play da música do jogo
        - Selecionador de níveis/reset do nível
              - Selecionamos o nível no elemento radio e clicamos no botão
              "Select Level" para carregar esse nível. Também serve como reset
              do nível uma vez que podemos selecionar o nível atual.
        - Contador de quantos "golds" apanhou o jogador com o número atual
          e quantos existem no nível, imagem para simbolizar o seu
          significado e font dos valores apropriada.

      JavaScript (todas as funcionalidades foram implementadas):
        Hero:
          - Hero pode subir/descer escadas.
          - Hero pode usar as cordas.
          - Hero pode usar as chaminés.
          - Hero cai com animação alternada.
          - Hero pode partir tijolos (segundo as regras estipuladas no 
            enunciado) acompanhado com um som de disparo.
                - Hero parte o tijolo para o lado que está virado.
                    - No caso que tenha acabado de sair de uma escada ou corda,
                    dispara para o útimo lado para que estava virado.
                - Tijolos regeneram após 4s.
                - Hero muda de imagem consoante o lado do seu tiro.
                - Hero é projetado um bloco para trás quando dispara (quando
                  a sua posição o permite).
          - Hero pode apanhar os ouros acompanhado por um som.
          - Quando todos os ouros são apanhados as escadas finais aparecem.
        
        Robots:
          - Velocidade dos robots metade da do Hero.
          - Robots movimentam-se tentando reduzir a sua distãncia em relação
          ao Hero.
          - Robots podem usar escadas, cordas e chaminés.
          - Robots podem apanhar 1 ouro de cada vez.
                - Robots carregam o ouro durante 3 segundos, depois tentam
                largá-lo, se não conseguirem, esperam mais 2 segundos.
          - Robots caem nos buracos criados pelo Hero.
                - Caem num buraco criado pelo Hero, não atravessam.
                - Largam o ouro na casa acima deles.
                - Regeneram 4s depois.
                - Se tocarem no Hero, o mapa reinicia e recebemos uma mensagem
                do site.

*/

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
  constructor(x, y, imageName) {
    super(x, y, imageName);
    let traversable = false; //bloco atravessável
    let climbable = false; //bloco subível (eg. escadas)
    let grabable = false; //bloco agarrável (eg. cordas)
    let walkable = false; //bloco andável
    let breakable = false; //bloco destruível
    let collectable = false; //bloco apanhável
    let broken = false; //bloco destruído
  }
  show() {
    control.world[this.x][this.y] = this;
    this.draw(this.x, this.y);
  }
  hide() {
    control.world[this.x][this.y] = empty;
    empty.draw(this.x, this.y);
  }
  isTraversable() {
    return this.traversable;
  }
  isClimbable() {
    return this.climbable;
  }
  isGrabable() {
    return this.grabable;
  }
  isWalkable() {
    return this.walkable;
  }
  isBreakable() {
    return this.breakable;
  }
  isCollectable() {
    return this.collectable;
  }
  isBroken() {
    return this.broken;
  }
}

class ActiveActor extends Actor {
  constructor(x, y, imageName) {
    super(x, y, imageName);
    let character;
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

  // Verifica se é possível a subida
  canGoUp() {
    let curBlock = control.getWorld(this.x, this.y);
    let blockAbove = control.getWorld(this.x, this.y - 1);
    if (
      curBlock != null &&
      blockAbove != null &&
      !control.alreadyOcupied(this.x, this.y - 1)
    )
      return (
        curBlock.isClimbable() &&
        (blockAbove.isClimbable() ||
          blockAbove.isGrabable() ||
          blockAbove.isTraversable()) &&
        !control.alreadyOcupied(this.x, this.y - 1)
      );
    return false;
  }

  // Verifica se é possível a descida
  canGoDown() {
    let blockBelow = control.getWorld(this.x, this.y + 1);
    if (blockBelow != null && !control.alreadyOcupied(this.x, this.y + 1))
      return (
        blockBelow.isTraversable() &&
        !control.alreadyOcupied(this.x, this.y + 1)
      );
    return false;
  }

  // Verifica se é possível ir para a esquerda
  canGoLeft() {
    let curBlock = control.getWorld(this.x, this.y);
    let leftBlock = control.getWorld(this.x - 1, this.y);
    let belowBlock = control.getWorld(this.x, this.y + 1);
    let belowBlockActive = control.getWorldActive(this.x, this.y + 1);
    if (
      curBlock != null &&
      leftBlock != null &&
      belowBlock != null &&
      belowBlockActive != null &&
      !control.alreadyOcupied(this.x - 1, this.y)
    ) {
      if (belowBlock.isWalkable() || belowBlockActive.character == "Villain") {
        if (leftBlock.isTraversable() || leftBlock.isGrabable()) return true;
      } else if (
        (curBlock.isGrabable() &&
          (leftBlock.isTraversable() || leftBlock.isGrabable())) ||
        curBlock.isClimbable()
      )
        return true;
      return false;
    }
    return false;
  }

  // Verifica se é possível ir para a direita
  canGoRight() {
    let curBlock = control.getWorld(this.x, this.y);
    let rightBlock = control.getWorld(this.x + 1, this.y);
    let belowBlock = control.getWorld(this.x, this.y + 1);
    let belowBlockActive = control.getWorldActive(this.x, this.y + 1);
    if (
      curBlock != null &&
      rightBlock != null &&
      belowBlock != null &&
      belowBlockActive != null &&
      !control.alreadyOcupied(this.x + 1, this.y)
    ) {
      if (belowBlock.isWalkable() || belowBlockActive.character == "Villain") {
        if (rightBlock.isTraversable() || rightBlock.isGrabable()) return true;
      } else if (
        (curBlock.isGrabable() &&
          (rightBlock.isTraversable() || rightBlock.isGrabable())) ||
        curBlock.isClimbable()
      )
        return true;
      return false;
    }
    return false;
  }
  isFalling() {
    let curBlock = control.getWorld(this.x, this.y);
    let belowBlock = control.getWorld(this.x, this.y + 1);
    if (
      this.y + 1 < WORLD_HEIGHT &&
      belowBlock.isTraversable() &&
      !belowBlock.isWalkable() &&
      !belowBlock.isGrabable() &&
      !belowBlock.isClimbable() &&
      !curBlock.isGrabable() &&
      !curBlock.isClimbable() &&
      !control.alreadyOcupied(this.x, this.y + 1)
    )
      return true;
    return false;
  }

  // Função que simula a gravidade
  fall() {
    if (this.isFalling()) {
      if (this.y % 2 == 0)
        if (this.character == "Hero") this.imageName = "hero_falls_left";
        else this.imageName = "robot_falls_left";
      else if (this.character == "Hero") this.imageName = "hero_falls_right";
      else this.imageName = "robot_falls_right";
      this.move(0, 1);
    }
    if (
      this.character == "Villain" &&
      this.y + 1 < WORLD_HEIGHT &&
      !control.alreadyOcupied(this.x, this.y + 1) &&
      //Vilão(Robot) não se pode movimentar num bloco partido pelo Hero
      !control.getWorld(this.x, this.y).isBroken() &&
      control.getWorld(this.x, this.y + 1).isGrabable()
    ) {
      this.move(0, 1);
    }
    if (
      this.character == "Hero" &&
      this.y + 1 < WORLD_HEIGHT &&
      !control.alreadyOcupied(this.x, this.y + 1) &&
      control.getWorld(this.x, this.y + 1).isGrabable()
    ) {
      this.move(0, 1);
    }
  }

  // Movimenta o ator para cima
  goUp() {
    if (
      this.canGoUp(this) &&
      control.getWorld(this.x, this.y).imageName != "empty"
    ) {
      if (this.y % 2 == 0) {
        if (this.character == "Hero") this.imageName = "hero_on_ladder_right";
        else this.imageName = "robot_on_ladder_right";
      } else {
        if (this.character == "Hero") this.imageName = "hero_on_ladder_left";
        else this.imageName = "robot_on_ladder_left";
      }
      this.move(0, -1);
    }
  }

  // Movimenta o ator para baixo
  goDown() {
    if (this.canGoDown(this)) {
      if (this.y % 2 == 0) {
        if (this.character == "Hero") this.imageName = "hero_on_ladder_right";
        else this.imageName = "robot_on_ladder_right";
      } else {
        if (this.character == "Hero") this.imageName = "hero_on_ladder_left";
        else this.imageName = "robot_on_ladder_left";
      }
      this.move(0, 1);
    }
  }

  // Movimenta o ator para a direita
  goRight() {
    if (this.canGoRight(this)) {
      if (control.getWorld(this.x + 1, this.y).isGrabable()) {
        if (this.x % 2 == 0) {
          if (this.character == "Hero") this.imageName = "hero_on_rope_left";
          else this.imageName = "robot_on_rope_left";
        } else {
          if (this.character == "Hero") this.imageName = "hero_on_rope_right";
          else this.imageName = "robot_on_rope_right";
        }
      } else {
        if (this.character == "Hero") this.imageName = "hero_runs_right";
        else this.imageName = "robot_runs_right";
      }
      this.move(1, 0);
      this.lastPosition = "right";
    }
  }

  // Movimenta o ator para a esquerda
  goLeft() {
    if (this.canGoLeft(this)) {
      if (control.getWorld(this.x - 1, this.y).isGrabable()) {
        if (this.x % 2 == 0) {
          if (this.character == "Hero") hero.imageName = "hero_on_rope_left";
          else this.imageName = "robot_on_rope_left";
        } else {
          if (this.character == "Hero") hero.imageName = "hero_on_rope_right";
          else this.imageName = "robot_on_rope_right";
        }
      } else {
        if (this.character == "Hero") this.imageName = "hero_runs_left";
        else this.imageName = "robot_runs_left";
      }
      this.move(-1, 0);
      this.lastPosition = "left";
    }
  }

  animation(k) {
    switch (k) {
      case " ":
        this.shoot(this.x, this.y);
        break;
      case null:
        this.fall(this);
        break;
      default: {
        let [dx, dy] = k;
        switch (dx) {
          case 0:
            switch (dy) {
              // actor goes up
              case -1:
                this.goUp(this);
                break;
              // actor goes down
              case 1:
                this.goDown(this);
                break;
            }
            break;
          //actor goes right
          case 1:
            this.goRight(this);
            break;
          //actor goes left
          case -1:
            this.goLeft(this);
            break;
        }
      }
    }
  }
}

// Pode ser destruído e andável
class Brick extends PassiveActor {
  constructor(x, y) {
    super(x, y, "brick");
    this.breakable = true;
    this.walkable = true;
  }
  makeInvisible() {
    // Partir o bloco
    this.hide();
    this.imageName = "empty";
    this.breakable = false;
    this.walkable = false;
    this.traversable = true;
    this.broken = true;
    this.show();
  }
  makeBrickVisible() {
    this.hide();
    this.imageName = "brick";
    this.breakable = true;
    this.walkable = true;
    this.broke = false;
    this.traversable = false;
    this.show();
  }
}

// Pode ser atravessado
class Chimney extends PassiveActor {
  constructor(x, y) {
    super(x, y, "chimney");
    this.traversable = true;
  }
}

// Pode ser atravessado
class Empty extends PassiveActor {
  constructor() {
    super(-1, -1, "empty");
    this.traversable = true;
  }
  show() {}
  hide() {}
}

// Pode ser atravessado e apanhado
class Gold extends PassiveActor {
  constructor(x, y) {
    super(x, y, "gold");
    this.traversable = true;
    this.collectable = true;
  }
}

class Invalid extends PassiveActor {
  constructor(x, y) {
    super(x, y, "invalid");
  }
}

// Pode ser atravessado e subido
class Ladder extends PassiveActor {
  constructor(x, y) {
    super(x, y, "empty");
    this.traversable = true;
  }
  makeVisible() {
    // Caso das escadas finais começam escondidas
    this.imageName = "ladder";
    this.show();
    this.climbable = true;
    this.walkable = true;
  }
}

// Pode ser agarrável
class Rope extends PassiveActor {
  constructor(x, y) {
    super(x, y, "rope");
    this.grabable = true;
  }
}

//Pode ser andável
class Stone extends PassiveActor {
  constructor(x, y) {
    super(x, y, "stone");
    this.walkable = true;
  }
}

//-----------------------------------------------------------HERO--------------------------------------------------------

class Hero extends ActiveActor {
  constructor(x, y) {
    super(x, y, "hero_runs_left");
    let verification;
    this.verification = 0;
    hero = this;
    this.character = "Hero";
    let lastPosition = "left";
    let died = false;
    let initialGold;
    this.initialGold = 0;
    let goldCollected;
    this.goldCollected = 0;
  }
  makeBVisibleL(i, j) {
    control.getWorld(i - 1, j + 1).makeBrickVisible();
  }
  makeBVisibleR(i, j) {
    control.getWorld(i + 1, j + 1).makeBrickVisible();
  }

  shoot() {
    let shootAudio = new Audio(
      "http://www.flashkit.com/imagesvr_ce/flashkit/soundfx/Electronic/Arcade/PulseSho-Mark_E_B-8071/PulseSho-Mark_E_B-8071_hifi.mp3"
    );
    //shoot left
    if (
      this.x - 1 >= 0 &&
      this.y + 1 < WORLD_HEIGHT &&
      this.lastPosition == "left"
    ) {
      if (
        control.getWorld(this.x - 1, this.y).isTraversable() &&
        control.getWorld(this.x - 1, this.y + 1).isBreakable()
      ) {
        this.imageName = "hero_shoots_left";
        control.getWorld(this.x - 1, this.y + 1).makeInvisible();
        shootAudio.play();
        setTimeout(this.makeBVisibleL, 4000, this.x, this.y);
        if (
          this.canGoRight() &&
          (control.getWorld(this.x + 1, this.y + 1).isClimbable() ||
            !control.getWorld(this.x + 1, this.y + 1).isTraversable())
        ) {
          this.move(1, 0);
        }
      }
    }
    //shoot right
    else {
      if (
        this.x + 1 < WORLD_WIDTH &&
        this.y + 1 < WORLD_HEIGHT &&
        this.lastPosition == "right"
      ) {
        if (
          control.getWorld(this.x + 1, this.y).isTraversable() &&
          control.getWorld(this.x + 1, this.y + 1).isBreakable()
        ) {
          this.imageName = "hero_shoots_right";
          control.getWorld(this.x + 1, this.y + 1).makeInvisible();
          shootAudio.play();
          setTimeout(this.makeBVisibleR, 4000, this.x, this.y);
          if (
            this.canGoLeft() &&
            (control.getWorld(this.x - 1, this.y + 1).isClimbable() ||
              !control.getWorld(this.x - 1, this.y + 1).isTraversable())
          ) {
            this.move(-1, 0);
          }
        }
      }
    }
  }

  // Conta quantos blocos apanháveis existem no mapa
  countInitialGold() {
    let amount = 0;
    for (let i = 0; i < WORLD_WIDTH; i++) {
      for (let j = 0; j < WORLD_HEIGHT; j++) {
        if (control.getWorld(i, j).isCollectable()) amount++;
      }
    }
    return amount;
  }

  isGoldCollected() {
    return this.initialGold == this.goldCollected;
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
    if (control.getWorld(this.x, this.y).isCollectable()) {
      control.getWorld(this.x, this.y).hide();
      this.show();
      let goldCollectAudio = new Audio(
        "http://www.flashkit.com/imagesvr_ce/flashkit/soundfx/Electronic/Arcade/RewardSo-Mark_E_B-8078/RewardSo-Mark_E_B-8078_hifi.mp3"
      );
      goldCollectAudio.play();
      this.goldCollected++;
      updateGoldInfo(this.goldCollected);
    }
    if (this.isGoldCollected() && this.verification == 0) {
      let allGoldCollectedAudio = new Audio(
        "http://www.flashkit.com/imagesvr_ce/flashkit/soundfx/Electronic/Arcade/RewardSo-Mark_E_B-8078/RewardSo-Mark_E_B-8078_hifi.mp3"
      );
      this.verification = 1;
      control.appearFinalLadder();
      allGoldCollectedAudio.play();
    }
    if (
      !this.canGoUp() &&
      !this.canGoDown() &&
      !this.canGoLeft() &&
      !this.canGoRight() &&
      !this.isFalling() &&
      !control.getWorld(this.x, this.y + 1).isGrabable()
    )
      this.isDead = true;
    control.endGameVerification();
  }
}

//------------------------------------------------ROBOT--------------------------------------------------------

class Robot extends ActiveActor {
  constructor(x, y) {
    super(x, y, "robot_runs_right");
    this.dx = 1;
    this.dy = 0;
    let hasGold;
    this.hasGold = false;
    let stop;
    this.stop = false;
    this.character = "Villain";
    let reinitialized = false;
    let dropGold = -1;
    let robotRespawn = -1;
  }

  // Pathfinding do Robot
  robotMovement() {
    if (hero.y > this.y) {
      if (super.canGoDown(this)) {
        if (
          control.getWorld(this.x, this.y + 1) == empty &&
          !control.getWorld(this.x, this.y).isClimbable() &&
          !control.getWorld(this.x, this.y).isGrabable()
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
    // Largar ouro após algum tempo
    if (this.dropGold == this.time && this.hasGold) {
      let curBlock = control.getWorld(this.x, this.y);
      if (
        control.getWorld(this.x, this.y + 1).isWalkable() &&
        curBlock == empty
      ) {
        GameFactory.actorFromCode("o", this.x, this.y);
        this.hasGold = false;
      } else this.dropGold += 8; // não conseguiu largar, + 2s
    }
    if (this.robotRespawn == this.time) {
      this.rearrangeRobot(this);
    }
    // Queda num buraco do Hero
    if (
      this.x >= 0 &&
      this.x < WORLD_WIDTH &&
      control.getWorld(this.x, this.y).isBroken() &&
      this.stop == false
    ) {
      if (this.hasGold) {
        GameFactory.actorFromCode("o", this.x, this.y - 1);
        this.hasGold = false;
      }
      this.stop = true;
      control.world[this.x][this.y] = empty;
      this.robotRespawn = this.time + 32;
    }
    if (this.stop == false) {
      super.animation(this.robotMovement(hero, this));
      if (control.getWorld(this.x, this.y).isCollectable() && !this.hasGold) {
        control.getWorld(this.x, this.y).hide();
        this.hasGold = true;
        this.dropGold = this.time + 20;
        this.show();
      }
      this.checkSurroudings();
    }
  }

  // Verifica se Hero está adjacente ao Robot
  checkSurroudings() {
    let leftBlockActive = control.getWorldActive(this.x - 1, this.y);
    let rightBlockActive = control.getWorldActive(this.x + 1, this.y);
    let topBlockActive = control.getWorldActive(this.x, this.y - 1);
    let bottomBlockActive = control.getWorldActive(this.x, this.y + 1);
    let bottomBlock = control.getWorld(this.x, this.y + 1);
    let topBlock = control.getWorld(this.x, this.y - 1);
    let curBlock = control.getWorldActive(this.x, this.y);
    if (
      ((leftBlockActive != null && leftBlockActive.character == "Hero") ||
        (rightBlockActive != null && rightBlockActive.character == "Hero") ||
        (topBlockActive != null &&
          topBlockActive.character == "Hero" &&
          !topBlock.isGrabable()) ||
        (bottomBlockActive != null && bottomBlockActive.character == "Hero") ||
        curBlock.character == "Hero") &&
      !bottomBlock.isBroken()
    ) {
      hero.isDead = true;
      this.reinitialized = true;
    }
  }

  rearrangeRobot(robot) {
    robot.stop = false;
    GameFactory.actorFromCode("t", robot.x, robot.y);
    robot.move(0, -1);
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
    hero.initialGold = hero.countInitialGold();
    updateGoldInfo(0);
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
        let a = control.getWorldActive(x, y);
        if (a.time < control.time) {
          a.time = control.time;
          a.animation();
        }
      }
  }

  getWorld(x, y) {
    if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT)
      return this.world[x][y];
    else return null;
  }

  getWorldActive(x, y) {
    if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT)
      return this.worldActive[x][y];
    else return null;
  }

  keyDownEvent(k) {
    control.key = k.keyCode;
  }

  keyUpEvent(k) {}

  alreadyOcupied(x, y) {
    if (
      this.getWorldActive(x, y).character == "Villain" ||
      this.getWorldActive(x, y).character == "Hero"
    )
      return true;
    return false;
  }

  appearFinalLadder() {
    for (let i = 0; i < WORLD_WIDTH; i++) {
      for (let j = 0; j < WORLD_HEIGHT; j++) {
        if (this.getWorld(i, j) instanceof Ladder)
          this.getWorld(i, j).makeVisible();
      }
    }
  }

  resetMap() {
    for (let i = 0; i < WORLD_WIDTH; i++) {
      for (let j = 0; j < WORLD_HEIGHT; j++) {
        this.getWorld(i, j).hide();
        this.getWorldActive(i, j).hide();
      }
    }
  }

  endGameVerification() {
    if (hero.isDead) {
      this.resetMap();
      this.loadLevel(this.level);
    } else if (
      hero.isGoldCollected() &&
      hero.y == 0 &&
      this.getWorld(hero.x, hero.y).isClimbable()
    ) {
      this.level++;
      hero.hide();
      this.resetMap();
      this.loadLevel(this.level);
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

function selectLevel() {
  let selection = document.getElementsByName("levelSelector");
  let lvl = null;
  for (let i = 0; i <= 15; i++)
    if (selection[i].checked) lvl = selection[i].value;
  control.resetMap();
  control.loadLevel(lvl);
  control.level = lvl;
}

function updateGoldInfo(amount) {
  let score = document.getElementById("goldAmount");
  score.innerHTML = amount + "/" + hero.initialGold;
}
