var ctx;
var smallWidth = 260;
var smallHeight = 200;
float IS = 1;

Player p1, p2;
Game game;
Referee refe;
var bgm;
var touch;

void setup(){
  size(smallWidth * 2, smallHeight);
  ctx = externals.context;
  noStroke();
  imageMode(CENTER);
  ellipseMode(CENTER);
  ctx.font = "30px 'Comic Sans MS'";
  ctx.textAlign = 'center';
  ctx.fillStyle = "white";
  ctx.strokeStyle = 'yellow';
  initAll();
}

void line(int fx, int fy, int ex, int ey) {
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(ex, ey);
  ctx.lineWidth = 20;
  ctx.lineCap = 'square';
  ctx.stroke();
}

void initAll() {
  p1 = new Player(smallWidth / 2, 0);
  p2 = new Player(smallWidth + smallWidth / 2, 0);
  refe = new Referee();
  game = new Game();
  p1.attend = true;
  p2.attend = true;
  bgm = new Audio("resources/bgm.mp3");
  touch = new Audio("resources/touch.mp3");
  goodSound = new Audio("resources/good.mp3");
  badSound = new Audio("resources/bad.mp3");
}

// TODO:
// 2. Replace result image

void draw(){
  drawSmallVideo(localVideo);
  drawSmallVideo(remoteVideo);
  /*
  p1.update();
  p1.show();
  game.update();
  game.show();
  game.sound();
  refe.update();
  refe.show();
  */
  if (ready()) {
    if (isFirst()) {
      p1.update();
      if (game.players() == 2) {
        refe.update();
        game.update();
      }
    } else {
      p2.update();
    }
    sendSync();
    recvSync();
    p1.show();
    p2.show();
    // p1.sound();
    // p2.sound();
    refe.show();
    game.show();
    game.sound();
  }
}

boolean ready() {
  return localId && remoteId && isChannelOpen();
}

boolean isChannelOpen() {
  return dataChannel && dataChannel.readyState == 'open';
}

function sendSync() {
  var msg = {}
  if (isFirst()) {
    msg = {
      'game_time':game.time,
      'game_mode':game.mode,
      'p1_point':p1.point,
      'p1_attend':p1.attend,
      'p1_power':p1.power,
      'p1_correct':p1.correct,
      'p2_correct':p2.correct,
      'p2_point':p2.point,
      'refe_shita':refe.shita
    }
  } else {
    msg = {
      'p2_attend':p2.attend,
      'p2_power':p2.power
    }
  }
  dataChannel.send(JSON.stringify(msg));
}

function recvSync() {
  if (isFirst()) {
    p2.attend = remoteData.p2_attend;
    p2.power = remoteData.p2_power;
  } else {
    p1.attend = remoteData.p1_attend;
    p1.point = remoteData.p1_point;
    p1.power = remoteData.p1_power;
    p1.correct = remoteData.p1_correct;
    p2.correct = remoteData.p2_correct;
    p2.point = remoteData.p2_point;
    game.mode = remoteData.game_mode;
    game.time = remoteData.game_time;
    refe.shita = remoteData.refe_shita;
  }
}

class Flag {
  int x, y, prev, thre;
  PImage nega, posi;
  boolean d;
  Flag(int _x, int _y, String negaSrc, String posiSrc) {
    x = _x;
    y = _y;
    // for debugging
    thre = 20;
    nega = loadImage(negaSrc);
    posi = loadImage(posiSrc);
  }
  void update() {
    int crr = get(x, y);
    d = detected(prev, crr);
    prev = crr;
  }
  boolean detected(int prev, int crr) {
    return abs(green(prev) - green(crr)) > thre;
  }
  void showPosi() {
    image(posi, x, y, 100 * IS, 100 * IS);
  }
  void showNega() {
    image(nega, x, y, 100 * IS, 100 * IS);
  }
}

class PPImage {
  int x, y;
  PImamge face;
  PPImage (String src, int _x, int _y) {
    x = _x;
    y = _y;
    face = loadImage(src);
  }
}

class Player {
  int x, y, point, handi;
  boolean attend;
  Flag leftFlag, rightFlag;
  int power;
  PImage ball;
  boolean correct;
  Player(int _x, int _y) {
    x = _x;
    y = _y;
    leftFlag = new Flag(x - 100, smallHeight / 2, "resources/leftNega.png", "resources/leftPosi.png");
    rightFlag = new Flag(x + 100, smallHeight / 2, "resources/rightNega.png", "resources/rightPosi.png");
    ball = loadImage("resources/egg.png");
    handi = 10;
  }
  boolean practiced() {
    return leftFlag.firstRise && rightFlag.firstRize;
  }
  void update() {
    leftFlag.update();
    rightFlag.update();
    if (leftFlag.d) {
      rise('left');
    }
    if (rightFlag.d) {
      rise('right');
    }
  }
  void moveToZero() {
    power += -power / 20;
    if (abs(power) < 0.1) {
      power = 0;
    }
  }
  void rise(String which) {
    if (which == 'left') {
      if (side() != which) {
        touch.play();
      }
      power = 10;
    }
    if (which == 'right') {
      if (side() != which) {
        touch.play();
      }
      power = -10;
    }
    if (which == 'none') {
      power = 0;
    }
  }
  void down() {
    rise('none');
  }
  String side() {
    if (power == 0) {
      return 'none';
    } else if (power > 0) {
      return 'left';
    } else {
      return 'right';
    }
  }
  void show() {
    if (side() == 'left') {
      leftFlag.showPosi();
      rightFlag.showNega();
    }
    if (side() == 'right') {
      leftFlag.showNega();
      rightFlag.showPosi();
    }
    if (side() == 'none') {
      leftFlag.showNega();
      rightFlag.showNega();
    }
    showPoint();
  }
  void sound() {
  }
  void showPoint() {
    for (int i = 0; i < point; i++) {
      image(ball, x - smallWidth / 3 + i * 20, 30, 50 * IS, 50 * IS);
    }
  }
}

class Referee {
  PImage face, good, bad;
  float shita, target, easy;
  Referee() {
    face = loadImage("resources/kotori.png");
    good = loadImage("resources/good.png");
    bad = loadImage("resources/bad.png");
    side = 'none';
    easy = 1.2;
  }
  void update() {
    shita += (target - shita) / easy;
  }
  void judge(Player p) {
    p.correct = (p.side() == side);
    if (p.correct) {
      goodSound.play();
      p.point++;
    } else {
      badSound.play();
    }
  }
  void rise(String _side) {
    side = _side;
    if (side == 'right') {
      target = -PI / 4;
    } else if (side == 'left') {
      target = PI / 4;
    } else if (side == 'none') {
      target = 0;
    } else if (side == 'halfRight') {
      target = -PI / 10;
    } else if (side == 'halfLeft') {
      target = PI / 10;
    }
  }
  void down() {
    rise('none');
    p1.rise('none');
    p2.rise('none');
  }
  boolean settle() {
    return (side == 'left' || side == 'right') && abs(target - shita) < 0.001;
  }
  void show() {
    pushMatrix();
    translate(smallWidth, smallHeight);
    rotate(shita);
    image(face, 0, 0, 400 * IS, 200 * IS);
    popMatrix();
  }
  void feint() {
    if (side == 'none') {
      if ((int)random(1) == 0) {
        rise('halfRight');
      } else {
        rise('halfLeft');
      }
    } else {
      if (side == 'halfLeft') {
        rise('halfRight');
      } else {
        rise('halfLeft');
      }
    }
  }
  void playBGM() {
    if (bgm.ended) {
      bgm.play();
    }
  }
  void stopBGM() {
    // bgm.duration is not available
    bgm.currentTime = 100;
  }
  void next() {
    if ((int)random(2)) {
      rise('left');
    } else {
      rise('right');
    }
  }
  void showJudge(Player p) {
    if (p.correct) {
      image(good, p.x, 50, 50 * IS, 50 * IS);
    } else {
      image(bad, p.x, 50, 50 * IS, 50 * IS);
    }
  }
}

class Game {
  int time;
  int cx, cy;
  String mode;
  PImage celeb = loadImage("resources/celeb.png");
  int easy = 120;
  Game() {
    cx = width / 2;
    cy = height / 2;
    mode = 'stay';
  }
  void update() {
    time++;
    if (mode == 'stay') {
      if (time > 100) {
        refe.feint();
        mode = 'feint';
      }
    } else if (mode == 'feint') {
      if (time > 50) {
        if ((int)random(4) == 0) {
          refe.next();
          mode = 'settle';
        } else {
          refe.feint();
          time = 0;
        }
      }
    } else if (mode == 'settle') {
      if (time > easy) {
        refe.judge(p1);
        refe.judge(p2);
        mode = 'resume';
        time = 0;
      }
    } else if (mode == 'resume') {
      if (time > 100) {
        time = 0;
        refe.down();
        if (p1.point > 1 || p2.point > 1) {
          mode = 'result';
        } else {
          mode = 'stay';
        }
      }
    } else if (mode == 'result') {
      if (time > 200) {
        end();
      }
    }
  }
  void end() {
    initAll();
  }
  int players() {
    if (p1.attend != p2.attend) {
      return 1;
    } else if (p1.attend && p2.attend) {
      return 2;
    } else {
      return 0;
    }
  }
  void show() {
    if (mode == 'resume') {
      refe.showJudge(p1);
      refe.showJudge(p2);
    } else if (mode == 'result') {
      if (p1.point > 1) {
          image(celeb, p1.x, smallHeight / 2, 100 * IS, 100 * IS);
      }
      if (p2.point > 1) {
          image(celeb, p2.x, smallHeight / 2, 100 * IS, 100 * IS);
      }
    } else if (mode == 'settle') {
      line(0, smallHeight - 10, map(time, 0, easy, 0, smallWidth * 2), smallHeight - 10);
    }
  }
  void sound() {
    if (mode == 'feint') {
      refe.playBGM();
    } else {
      refe.stopBGM();
    }
  }
}

void keyPressed() {
  if (key == 'a') {
    p1.rise('left');
  } else if (key == 'b') {
    p1.rise('right');
  } else if (key == 'f') {
    fullscreen();
  } else if (key == 'm') {
    bgm.play();
  }
}

void drawSmallVideo(video) {
  pushMatrix();
  scale(-1, 1);
  if (video.id === 'localVideo') {
    translate(-smallWidth, 0);
  } else if (video.id === 'remoteVideo'){
    translate(-smallWidth * 2, 0);
  }
  ctx.drawImage(video, 0, 0, smallWidth, smallHeight);
  popMatrix();
} 

function fullscreen(){
  var el = document.querySelector('#mergedCanvas');
  el.webkitRequestFullScreen();
}
