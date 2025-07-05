let player;
let vials = [];
let enemies = [];
let lifeGummies = [];
let score = 0;
const SLOGANS = ["Flower Power", "Groovy", "Far Out", "Cowabunga", "Trippy", "Gummy"];
let gameState = 'start'; // 'start', 'playing', 'gameOver', 'win'
let enemySpawnCounter = 0;
let nextLifeSpawnThreshold = 25;
let shootingSound;
let soundtrack;
let gummyBearSound;
let playerImg;
let suitFrames = [];
let hippieFrames = [];
let copFrames = [];
let angrySuitFrames = [];
let bgImg;
let lifeGummyFrames = [];

// --- VIRTUAL CANVAS & PLAYABLE AREA SETUP ---
const VIRTUAL_WIDTH = 1280;
const VIRTUAL_HEIGHT = 720;
const PLAYABLE_WIDTH = 960;
const PLAYABLE_OFFSET_X = (VIRTUAL_WIDTH - PLAYABLE_WIDTH) / 2;
let scaleFactor, offsetX, offsetY;
let isMobile = false;
let touchControls = {};

function preload() {
  shootingSound = loadSound('shooting.mp3');
  soundtrack = loadSound('soundtrack.mp3');
  gummyBearSound = loadSound('gummybear.mp3');
  playerImg = loadImage('gummy.png');
  suitFrames[0] = loadImage('suit1.png');
  suitFrames[1] = loadImage('suit2.png');
  hippieFrames[0] = loadImage('hippie1.png');
  hippieFrames[1] = loadImage('hippie2.png');
  copFrames[0] = loadImage('cop1.png');
  copFrames[1] = loadImage('cop2.png');
  angrySuitFrames[0] = loadImage('angrysuit1.png');
  angrySuitFrames[1] = loadImage('angrysuit2.png');
  bgImg = loadImage('grass.png');
  lifeGummyFrames[0] = loadImage('lifegummy1.png');
  lifeGummyFrames[1] = loadImage('lifegummy2.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  isMobile = ('ontouchstart' in window);
  calculateScaling();
  setupTouchControls();
  rectMode(CENTER);
  textFont('monospace');
  player = new GummyBear();
}

function draw() {
  // Draw background to fill the entire browser canvas (before scaling/translation)
  if (bgImg) {
    for (let y = 0; y < height; y += bgImg.height) {
      image(bgImg, 0, y, width, bgImg.height);
    }
  } else {
    background(10, 5, 15);
  }

  push();
  translate(offsetX, offsetY);
  scale(scaleFactor);
  if (gameState === 'start') { drawStartScreen(); }
  else if (gameState === 'playing') { runGame(); }
  else if (gameState === 'gameOver') { drawGameOverScreen(); }
  else if (gameState === 'win') { drawWinScreen(); }
  pop();
}

function calculateScaling() {
  scaleFactor = min(windowWidth / VIRTUAL_WIDTH, windowHeight / VIRTUAL_HEIGHT);
  offsetX = (windowWidth - VIRTUAL_WIDTH * scaleFactor) / 2;
  offsetY = (windowHeight - VIRTUAL_HEIGHT * scaleFactor) / 2;
}
function windowResized() { resizeCanvas(windowWidth, windowHeight); calculateScaling(); }

function setupTouchControls() {
    let dpadRadius = 160; let fireRadius = 140; let padding = 10;
    touchControls = {
        dpad: { x: dpadRadius + padding, y: VIRTUAL_HEIGHT - dpadRadius - padding, radius: dpadRadius, isUp: false, isDown: false, isLeft: false, isRight: false },
        fireButton: { x: VIRTUAL_WIDTH - fireRadius - padding, y: VIRTUAL_HEIGHT - fireRadius - padding, r: fireRadius, active: false }
    };
}

function handleTouchInput() {
    let dpad = touchControls.dpad;
    dpad.isUp = dpad.isDown = dpad.isLeft = dpad.isRight = false;
    touchControls.fireButton.active = false;
    if (!isMobile) return;
    for (let touch of touches) {
        let touchX = (touch.x - offsetX) / scaleFactor;
        let touchY = (touch.y - offsetY) / scaleFactor;
        if (dist(touchX, touchY, touchControls.fireButton.x, touchControls.fireButton.y) < touchControls.fireButton.r) { touchControls.fireButton.active = true; }
        if (dist(touchX, touchY, dpad.x, dpad.y) < dpad.radius) {
            let vec = createVector(touchX - dpad.x, touchY - dpad.y);
            let angle = vec.heading();
            if (angle > -PI * 0.75 && angle < -PI * 0.25) dpad.isUp = true;
            if (angle > PI * 0.25 && angle < PI * 0.75) dpad.isDown = true;
            if (angle > PI * 0.75 || angle < -PI * 0.75) dpad.isLeft = true;
            if (angle > -PI * 0.25 && angle < PI * 0.25) dpad.isRight = true;
        }
    }
}

function drawTouchControls() {
    if (!isMobile) return;
    noStroke(); let dpad = touchControls.dpad; let arrowSize = 35;
    fill(255, 255, 255, 20); ellipse(dpad.x, dpad.y, dpad.radius * 2);
    fill(255, 255, 255, 25); ellipse(dpad.x, dpad.y, 40);
    let arrowDist = dpad.radius * 0.55;
    fill(255, 255, 255, dpad.isUp ? 80 : 40); triangle(dpad.x, dpad.y - arrowDist - arrowSize/2, dpad.x - arrowSize, dpad.y - arrowDist + arrowSize/2, dpad.x + arrowSize, dpad.y - arrowDist + arrowSize/2);
    fill(255, 255, 255, dpad.isDown ? 80 : 40); triangle(dpad.x, dpad.y + arrowDist + arrowSize/2, dpad.x - arrowSize, dpad.y + arrowDist - arrowSize/2, dpad.x + arrowSize, dpad.y + arrowDist - arrowSize/2);
    fill(255, 255, 255, dpad.isLeft ? 80 : 40); triangle(dpad.x - arrowDist - arrowSize/2, dpad.y, dpad.x - arrowDist + arrowSize/2, dpad.y - arrowSize, dpad.x - arrowDist + arrowSize/2, dpad.y + arrowSize);
    fill(255, 255, 255, dpad.isRight ? 80 : 40); triangle(dpad.x + arrowDist + arrowSize/2, dpad.y, dpad.x + arrowDist - arrowSize/2, dpad.y - arrowSize, dpad.x + arrowDist - arrowSize/2, dpad.y + arrowSize);
    let fireBtn = touchControls.fireButton; fill(255, 0, 0, fireBtn.active ? 100 : 50); ellipse(fireBtn.x, fireBtn.y, fireBtn.r * 2);
}

function runGame() {
  // background(40, 35, 50); // Removed to allow bgImg to show
  handleTouchInput(); player.update();
  stroke(255, 255, 255, 20); strokeWeight(4); line(PLAYABLE_OFFSET_X, 0, PLAYABLE_OFFSET_X, VIRTUAL_HEIGHT); line(PLAYABLE_OFFSET_X + PLAYABLE_WIDTH, 0, PLAYABLE_OFFSET_X + PLAYABLE_WIDTH, VIRTUAL_HEIGHT);
  let spawnDelay = floor(map(player.shootCooldown, player.fastestShootCooldown, player.baseShootCooldown, 20, 90));
  if (frameCount % spawnDelay === 0) { enemySpawnCounter++; enemies.push(enemySpawnCounter > 0 && enemySpawnCounter % 25 === 0 ? new Cop() : new Suit()); }
  if (score >= nextLifeSpawnThreshold) {
    lifeGummies.push(new LifeGummy());
    nextLifeSpawnThreshold += 25;
    if (gummyBearSound && gummyBearSound.isLoaded()) gummyBearSound.play();
  }
  player.move(); player.display();
  if (keyIsDown(32) || touchControls.fireButton.active) { player.splash(); }
  for (let i = vials.length - 1; i >= 0; i--) { vials[i].update(); vials[i].display(); if (vials[i].isOffscreen()) vials.splice(i, 1); }
  for (let i = enemies.length - 1; i >= 0; i--) { enemies[i].update(player); enemies[i].display(); if (enemies[i].shouldBeRemoved()) { enemies.splice(i, 1); continue; } if (enemies[i].isOffscreen()) { if (enemies[i].state !== 'hippie') score--; enemies.splice(i, 1); } }
  for (let i = lifeGummies.length - 1; i >= 0; i--) { lifeGummies[i].update(); lifeGummies[i].display(); if (lifeGummies[i].toBeRemoved) { lifeGummies.splice(i,1); continue; } if (lifeGummies[i].isOffscreen()) lifeGummies.splice(i, 1); }
  handleCollisions();
  if (score < -5) gameState = 'gameOver';
  drawHUD();
  drawTouchControls();
}

function handleCollisions() {
  for (let i = vials.length - 1; i >= 0; i--) {
    for (let j = enemies.length - 1; j >= 0; j--) { if (vials[i] && enemies[j] && enemies[j].state !== 'hippie' && enemies[j].isHitBy(vials[i])) { enemies[j].takeHit(); if(enemies[j].state === 'hippie') score++; vials.splice(i, 1); break; } }
  }
  for (let i = vials.length - 1; i >= 0; i--) {
    for (let j = lifeGummies.length - 1; j >= 0; j--) {
        if (vials[i] && lifeGummies[j] && lifeGummies[j].isHitBy(vials[i])) {
            lifeGummies[j].takeHit();
            vials.splice(i, 1);
            break;
        }
    }
  }
  for (let i = enemies.length - 1; i >= 0; i--) { let enemy = enemies[i]; if (enemy.state !== 'hippie' && player.isCollidingWith(enemy)) { player.takeDamage(); enemies.splice(i, 1); if (player.lives <= 0) { gameState = 'gameOver'; return; } } }
  for (let i = enemies.length - 1; i >= 0; i--) { let enemy = enemies[i]; if (enemy && enemy.state === 'cop') { for (let j = enemies.length - 1; j >= 0; j--) { if (i === j) continue; let other = enemies[j]; /* Only revert hippies that are Suits, not Cops or others. This could be adapted for an ultra boss scenario in the future. */ if (other && other.state === 'hippie' && enemy.isCollidingWith(other) && other instanceof Suit) { other.revertToAngrySuit(player); break; } } } }
  for (let i = lifeGummies.length - 1; i >= 0; i--) { if (player.isCollidingWith(lifeGummies[i])) { player.gainLife(); lifeGummies.splice(i, 1); if (player.lives >= player.maxLives) { gameState = 'win'; } } }
}

function advanceGameState() {
  let vX, vY;
  if(touches.length > 0) { vX = (touches[0].x - offsetX) / scaleFactor; vY = (touches[0].y - offsetY) / scaleFactor; }
  else { vX = getVirtualMouseX(); vY = getVirtualMouseY(); }
  if (gameState === 'start') {
    let btnX = VIRTUAL_WIDTH / 2, btnY = VIRTUAL_HEIGHT / 2 + 100, btnW = 400, btnH = 90;
    if (vX > btnX - btnW / 2 && vX < btnX + btnW / 2 && vY > btnY - btnH / 2 && vY < btnY + btnH / 2) {
      resetGame();
      gameState = 'playing';
      if (soundtrack && soundtrack.isLoaded()) {
        soundtrack.setLoop(true);
        soundtrack.play();
      }
    }
  }
  else if (gameState === 'gameOver' || gameState === 'win') {
    if (soundtrack && soundtrack.isPlaying()) soundtrack.stop();
    resetGame();
    gameState = 'start';
  }
}
function keyPressed() {
  if (keyCode === ENTER) {
    if (gameState === 'start') {
      resetGame();
      gameState = 'playing';
      if (soundtrack && soundtrack.isLoaded()) {
        soundtrack.setLoop(true);
        soundtrack.play();
      }
    } else if (gameState === 'gameOver' || gameState === 'win') {
      if (soundtrack && soundtrack.isPlaying()) soundtrack.stop();
      resetGame();
      gameState = 'start';
    }
  }
}
function mousePressed() { advanceGameState(); }
function touchStarted() { advanceGameState(); return false; }
function resetGame() { score = 0; vials = []; enemies = []; lifeGummies = []; player = new GummyBear(); enemySpawnCounter = 0; nextLifeSpawnThreshold = 25; frameCount = 0; }

function drawStartScreen() { background(20, 10, 30); textAlign(CENTER, CENTER); fill(50, 255, 150); textSize(120); text("LSDGB", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 200); fill(255); textSize(24); text("Desktop: Use ARROW/WASD to move, HOLD SPACE to shoot.", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 90); text("Mobile: Use on-screen controls to move and shoot.", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 50); text("Collect 3 lives to win!", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 10); let btnX = VIRTUAL_WIDTH / 2, btnY = VIRTUAL_HEIGHT / 2 + 100, btnW = 400, btnH = 90; let pulse = sin(frameCount * 0.05) * 5; stroke(255, 0, 255); strokeWeight(4); fill(20, 10, 30, 200); rect(btnX, btnY, btnW + pulse, btnH + pulse/2, 10); noStroke(); fill(255, 0, 255); textSize(36); text("START REVOLUTION", btnX, btnY); fill(255); textSize(20); text("(Tap button or press ENTER)", btnX, btnY + 70); }
function drawWinScreen() { background(20, 100, 80); textAlign(CENTER, CENTER); fill(255, 255, 0); textSize(72); text("REVOLUTION SUCCEEDS!", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 80); fill(255); textSize(40); text(`Final Score: ${score}`, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 20); textSize(30); text("Tap or press ENTER to play again", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 100); }
function drawGameOverScreen() { background(20, 10, 30); textAlign(CENTER, CENTER); fill(255, 0, 0); textSize(72); text("THE MAN WINS", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 80); fill(255); textSize(40); text(`Final Score: ${score}`, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 20); textSize(30); text("Tap or press ENTER to try again", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 100); }
function drawHUD() { fill(255, 0, 255); textSize(40); textAlign(LEFT, TOP); text(`SCORE: ${score}`, PLAYABLE_OFFSET_X + 20, 20); text(`LIVES: ${player.lives}`, PLAYABLE_OFFSET_X + 20, 70); }

class GummyBear {
  constructor() { this.x = VIRTUAL_WIDTH / 2; this.y = VIRTUAL_HEIGHT - 80; this.w = 50; this.h = 60; this.speed = 8; this.hue = random(360); this.lives = 1; this.maxLives = 3; this.baseShootCooldown = 35; this.fastestShootCooldown = 5; this.scoreForMaxSpeed = 50; this.shootCooldown = this.baseShootCooldown; this.lastShotFrame = 0; }
  update() { let effectiveScore = max(0, score); this.shootCooldown = map(effectiveScore, 0, this.scoreForMaxSpeed, this.baseShootCooldown, this.fastestShootCooldown); this.shootCooldown = constrain(this.shootCooldown, this.fastestShootCooldown, this.baseShootCooldown); }
  move() { if (keyIsDown(LEFT_ARROW) || keyIsDown(65) || (isMobile && touchControls.dpad.isLeft)) this.x -= this.speed; if (keyIsDown(RIGHT_ARROW) || keyIsDown(68) || (isMobile && touchControls.dpad.isRight)) this.x += this.speed; if (keyIsDown(UP_ARROW) || keyIsDown(87) || (isMobile && touchControls.dpad.isUp)) this.y -= this.speed; if (keyIsDown(DOWN_ARROW) || keyIsDown(83) || (isMobile && touchControls.dpad.isDown)) this.y += this.speed; this.x = constrain(this.x, PLAYABLE_OFFSET_X + this.w/2, PLAYABLE_OFFSET_X + PLAYABLE_WIDTH - this.w/2); this.y = constrain(this.y, this.h / 2, VIRTUAL_HEIGHT - this.h / 2); this.hue = (this.hue + 1) % 360; }
  display() {
    if (playerImg) {
      image(playerImg, this.x - this.w/2, this.y - this.h/2, this.w, this.h);
    } else {
      push(); colorMode(HSB, 360, 100, 100, 1); noStroke(); fill(this.hue, 80, 100, 0.8); ellipse(this.x, this.y, this.w, this.h); ellipse(this.x - this.w * 0.3, this.y - this.h * 0.4, this.w * 0.4); ellipse(this.x + this.w * 0.3, this.y - this.h * 0.4, this.w * 0.4); pop();
    }
  }
  splash() { if (frameCount - this.lastShotFrame > this.shootCooldown) { vials.push(new AcidVile(this.x, this.y - this.h / 4)); this.lastShotFrame = frameCount; if (shootingSound && shootingSound.isLoaded()) shootingSound.play(); } }
  takeDamage() { this.lives--; }
  gainLife() { if (this.lives < this.maxLives) this.lives++; }
  isCollidingWith(other) { return dist(this.x, this.y, other.x, other.y) < this.w / 2 + other.w / 2; }
}
class LifeGummy {
    constructor() { this.x = random(PLAYABLE_OFFSET_X + 20, PLAYABLE_OFFSET_X + PLAYABLE_WIDTH - 20); this.y = -50; this.w = 40; this.h = 50; this.speed = 2.5; this.hue = random(360); this.hits = 3; this.toBeRemoved = false; this.lastHitTime = 0; this.animFrame = 0; }
    update() { this.y += this.speed; this.hue = (this.hue + 2) % 360; if (frameCount % 10 === 0) { this.animFrame = (this.animFrame + 1) % lifeGummyFrames.length; } }
    takeHit() { this.hits--; this.lastHitTime = millis(); if (this.hits <= 0) { this.toBeRemoved = true; } }
    display() {
        if (lifeGummyFrames.length > 0 && lifeGummyFrames[this.animFrame]) {
            image(lifeGummyFrames[this.animFrame], this.x - this.w/2, this.y - this.h/2, this.w, this.h);
            if (millis() - this.lastHitTime < 100) { push(); noStroke(); fill(255, 150); ellipse(this.x, this.y, this.w + 10, this.h + 10); pop(); }
        } else {
            push(); colorMode(HSB, 360, 100, 100, 1); noStroke(); fill(this.hue, 90, 100, 0.9);
            ellipse(this.x, this.y, this.w, this.h);
            ellipse(this.x - this.w * 0.3, this.y - this.h * 0.4, this.w * 0.4);
            ellipse(this.x + this.w * 0.3, this.y - this.h * 0.4, this.w * 0.4);
            pop();
            if (millis() - this.lastHitTime < 100) { push(); noStroke(); fill(255, 150); ellipse(this.x, this.y, this.w + 10, this.h + 10); pop(); }
        }
    }
    isHitBy(vile) { return dist(this.x, this.y, vile.x, vile.y) < this.w / 2 + vile.r; }
    isOffscreen() { return this.y > VIRTUAL_HEIGHT + this.h; }
}
class AcidVile { constructor(x, y) { this.x = x; this.y = y; this.r = 12; this.speed = 10; this.hue = random(360); } update() { this.y -= this.speed; this.hue = (this.hue + 5) % 360; } display() { push(); colorMode(HSB, 360, 100, 100, 100); noStroke(); for (let i = 0; i < 3; i++) { let f = random(-2, 2), a = random(60, 90), s = this.r * 2 * random(0.8, 1.2); fill(this.hue, 90, 100, a); ellipse(this.x + f, this.y + f, s); } pop(); } isOffscreen() { return this.y < -this.r; } }
class Enemy { constructor() { this.x = random(PLAYABLE_OFFSET_X + 20, PLAYABLE_OFFSET_X + PLAYABLE_WIDTH - 20); this.y = -50; this.w = 40; this.h = 70; this.speed = random(1.5, 4); this.hue = random(360); this.transformTime = 0; this.slogan = ""; this.hippieSolidDuration = 7500; this.hippieFadeDuration = 2500; } update(target) { if (this.state === 'angry_suit') { this.x += this.chaseVector.x * this.speed; this.y += this.chaseVector.y * this.speed; } else if (this.state === 'hippie') { this.y += 0.5; this.hue = (this.hue + 1) % 360; } else { this.y += this.speed; } } isHitBy(vile) { return dist(this.x, this.y, vile.x, vile.y) < this.w / 2 + vile.r; } isCollidingWith(other) { return dist(this.x, this.y, other.x, other.y) < this.w / 2 + other.w / 2; } transform() { this.state = 'hippie'; this.transformTime = millis(); this.slogan = SLOGANS[floor(this.hue / (360 / SLOGANS.length))]; } shouldBeRemoved() { if (this.state !== 'hippie') return false; return millis() - this.transformTime > this.hippieSolidDuration + this.hippieFadeDuration; } isOffscreen() { return this.y > VIRTUAL_HEIGHT + this.h || this.y < -this.h || this.x < PLAYABLE_OFFSET_X - this.w || this.x > PLAYABLE_OFFSET_X + PLAYABLE_WIDTH + this.w; } displayAsHippie() { let timeSinceTransform = millis() - this.transformTime; let alpha = 255; if (timeSinceTransform > this.hippieSolidDuration) { alpha = map(timeSinceTransform, this.hippieSolidDuration, this.hippieSolidDuration + this.hippieFadeDuration, 255, 0); } push(); colorMode(HSB, 360, 100, 100, 100); fill(this.hue, 90, 90, map(alpha, 0, 255, 0, 100)); rect(this.x, this.y, this.w, this.h, 5); pop(); stroke(255, alpha); strokeWeight(2); noFill(); ellipse(this.x, this.y - 10, 15); line(this.x, this.y - 17.5, this.x, this.y - 2.5); line(this.x, this.y - 10, this.x - 6, this.y - 4); line(this.x, this.y - 10, this.x + 6, this.y - 4); noStroke(); fill(250, 220, 200, alpha); ellipse(this.x, this.y - this.h / 2 - 15, 30); stroke(139, 69, 19, alpha); strokeWeight(3); line(this.x - 15, this.y - this.h / 2 - 15, this.x - 20, this.y - this.h / 2 + 5); line(this.x + 15, this.y - this.h / 2 - 15, this.x + 20, this.y - this.h / 2 + 5); if (timeSinceTransform < 2500) { push(); let bubbleY = this.y - 70; textSize(16); textAlign(CENTER, CENTER); let sloganWidth = textWidth(this.slogan) + 25; noStroke(); fill(255, 255, 255, 200); rect(this.x, bubbleY, sloganWidth, 35, 15); fill(0); text(this.slogan, this.x, bubbleY); pop(); } } }
class Suit extends Enemy {
  constructor() {
    super();
    this.state = 'suit';
    this.animFrame = 0;
  }
  display() {
    if (this.state === 'hippie') {
      if (frameCount % 10 === 0) {
        this.animFrame = (this.animFrame + 1) % hippieFrames.length;
      }
      if (hippieFrames[this.animFrame]) {
        image(hippieFrames[this.animFrame], this.x - this.w/2, this.y - this.h/2, this.w, this.h);
        let timeSinceTransform = millis() - this.transformTime;
        if (timeSinceTransform < 2500) {
          let bubbleY = this.y - 70;
          textSize(16);
          textAlign(CENTER, CENTER);
          let sloganWidth = textWidth(this.slogan) + 25;
          noStroke();
          fill(255, 255, 255, 200);
          rect(this.x, bubbleY, sloganWidth, 35, 15);
          fill(0);
          text(this.slogan, this.x, bubbleY);
        }
      } else {
        this.displayAsHippie();
      }
    } else if (this.state === 'angry_suit') {
      if (frameCount % 10 === 0) {
        this.animFrame = (this.animFrame + 1) % angrySuitFrames.length;
      }
      if (angrySuitFrames[this.animFrame]) {
        image(angrySuitFrames[this.animFrame], this.x - this.w/2, this.y - this.h/2, this.w, this.h);
      } else {
        this.displayAsSuit();
      }
    } else {
      if (frameCount % 10 === 0) {
        this.animFrame = (this.animFrame + 1) % suitFrames.length;
      }
      if (suitFrames[this.animFrame]) {
        image(suitFrames[this.animFrame], this.x - this.w/2, this.y - this.h/2, this.w, this.h);
      } else {
        this.displayAsSuit();
      }
    }
  }
  revertToAngrySuit(target) { this.state = 'angry_suit'; this.speed = 5; let dx = target.x - this.x; let dy = VIRTUAL_HEIGHT; let direction = createVector(dx, dy); direction.normalize(); this.chaseVector = direction; }
  displayAsSuit() {
    noStroke();
    if (this.state === 'angry_suit') {
      fill(255, 255, 0);
    } else {
      fill(200, 0, 0);
    }
    rect(this.x, this.y, this.w, this.h, 5);
    fill(240);
    triangle(this.x, this.y - this.h * 0.3, this.x - 10, this.y - this.h * 0.5, this.x + 10, this.y - this.h * 0.5);
    if (this.state === 'angry_suit') {
      fill(255, 255, 0);
    } else {
      fill(200, 0, 0);
    }
    triangle(this.x, this.y, this.x - 5, this.y - 25, this.x + 5, this.y - 25);
    fill(220);
    ellipse(this.x, this.y - this.h / 2 - 15, 30);
  }
  takeHit() { this.transform(); }
}
class Cop extends Enemy {
  constructor() {
    super();
    this.state = 'cop';
    this.speed = random(2, 4.5);
    this.hits = 3;
    this.lastHitTime = 0;
    this.animFrame = 0;
  }
  display() {
    if (this.state === 'cop') {
      if (frameCount % 10 === 0) {
        this.animFrame = (this.animFrame + 1) % copFrames.length;
      }
      if (copFrames[this.animFrame]) {
        image(copFrames[this.animFrame], this.x - this.w/2, this.y - this.h/2, this.w, this.h);
      } else {
        this.displayAsCop();
      }
      if (millis() - this.lastHitTime < 100) {
        fill(255, 0, 0, 150);
        rect(this.x, this.y, this.w + 5, this.h + 5, 8);
      }
    } else if (this.state === 'hippie') {
      if (frameCount % 10 === 0) {
        this.animFrame = (this.animFrame + 1) % hippieFrames.length;
      }
      if (hippieFrames[this.animFrame]) {
        image(hippieFrames[this.animFrame], this.x - this.w/2, this.y - this.h/2, this.w, this.h);
        // Draw text bubble for the first 2.5 seconds after transform
        let timeSinceTransform = millis() - this.transformTime;
        if (timeSinceTransform < 2500) {
          let bubbleY = this.y - 70;
          textSize(16);
          textAlign(CENTER, CENTER);
          let sloganWidth = textWidth(this.slogan) + 25;
          noStroke();
          fill(255, 255, 255, 200);
          rect(this.x, bubbleY, sloganWidth, 35, 15);
          fill(0);
          text(this.slogan, this.x, bubbleY);
        }
      } else {
        this.displayAsHippie();
      }
    }
  }
  takeHit() { this.hits--; this.lastHitTime = millis(); if (this.hits <= 0) this.transform(); }
  displayAsCop() { noStroke(); fill(20, 30, 120); rect(this.x, this.y, this.w, this.h, 5); fill(220); ellipse(this.x, this.y - this.h / 2 - 15, 30); fill(20, 30, 120); rect(this.x, this.y - this.h / 2 - 25, 40, 10, 2); rect(this.x, this.y - this.h / 2 - 30, 25, 10, 2); fill(255, 215, 0); ellipse(this.x - 10, this.y - 15, 8, 10); }
}
