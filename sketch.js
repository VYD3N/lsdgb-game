
let player;
let vials = [];
let enemies = [];
let lifeGummies = [];
let score = 0;
const SLOGANS = ["Flower Power", "Groovy", "Far Out", "Cowabunga", "Trippy", "Gummy"];
let gameState = 'start'; // 'start', 'playing', 'gameOver', 'win'
let enemySpawnCounter = 0;
let nextLifeSpawnThreshold = 25;

// --- VIRTUAL CANVAS & PLAYABLE AREA SETUP ---
const VIRTUAL_WIDTH = 1280;
const VIRTUAL_HEIGHT = 720;
const PLAYABLE_WIDTH = 960; // 4:3 aspect ratio with 720 height
const PLAYABLE_OFFSET_X = (VIRTUAL_WIDTH - PLAYABLE_WIDTH) / 2; // 160px on each side
let scaleFactor, offsetX, offsetY;
let isMobile = false;
let touchControls = {};

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
  background(10, 5, 15);
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
    touchControls = {
        dpad: {
            x: PLAYABLE_OFFSET_X / 2, y: VIRTUAL_HEIGHT / 2 + 100,
            radius: 120,
            isUp: false, isDown: false, isLeft: false, isRight: false
        },
        fireButton: { x: VIRTUAL_WIDTH - PLAYABLE_OFFSET_X / 2, y: VIRTUAL_HEIGHT / 2 + 100, r: 100, active: false }
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
        if (dist(touchX, touchY, touchControls.fireButton.x, touchControls.fireButton.y) < touchControls.fireButton.r) {
            touchControls.fireButton.active = true;
        }
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
    noStroke();
    let dpad = touchControls.dpad;
    let arrowSize = 30;
    fill(255, 255, 255, 20);
    ellipse(dpad.x, dpad.y, dpad.radius * 2);
    fill(255, 255, 255, 25);
    ellipse(dpad.x, dpad.y, 40);
    let arrowDist = dpad.radius * 0.5;
    fill(255, 255, 255, dpad.isUp ? 80 : 40);
    triangle(dpad.x, dpad.y - arrowDist - arrowSize/2, dpad.x - arrowSize, dpad.y - arrowDist + arrowSize/2, dpad.x + arrowSize, dpad.y - arrowDist + arrowSize/2);
    fill(255, 255, 255, dpad.isDown ? 80 : 40);
    triangle(dpad.x, dpad.y + arrowDist + arrowSize/2, dpad.x - arrowSize, dpad.y + arrowDist - arrowSize/2, dpad.x + arrowSize, dpad.y + arrowDist - arrowSize/2);
    fill(255, 255, 255, dpad.isLeft ? 80 : 40);
    triangle(dpad.x - arrowDist - arrowSize/2, dpad.y, dpad.x - arrowDist + arrowSize/2, dpad.y - arrowSize, dpad.x - arrowDist + arrowSize/2, dpad.y + arrowSize);
    fill(255, 255, 255, dpad.isRight ? 80 : 40);
    triangle(dpad.x + arrowDist + arrowSize/2, dpad.y, dpad.x + arrowDist - arrowSize/2, dpad.y - arrowSize, dpad.x + arrowDist - arrowSize/2, dpad.y + arrowSize);
    let fireBtn = touchControls.fireButton;
    fill(255, 0, 0, fireBtn.active ? 100 : 50);
    ellipse(fireBtn.x, fireBtn.y, fireBtn.r * 2);
}

function runGame() {
  background(40, 35, 50);
  handleTouchInput();
  player.update();
  
  // Draw faint boundary lines
  stroke(255, 255, 255, 20);
  strokeWeight(4);
  line(PLAYABLE_OFFSET_X, 0, PLAYABLE_OFFSET_X, VIRTUAL_HEIGHT);
  line(PLAYABLE_OFFSET_X + PLAYABLE_WIDTH, 0, PLAYABLE_OFFSET_X + PLAYABLE_WIDTH, VIRTUAL_HEIGHT);

  let spawnDelay = floor(map(player.shootCooldown, player.fastestShootCooldown, player.baseShootCooldown, 20, 90));
  if (frameCount % spawnDelay === 0) { enemySpawnCounter++; enemies.push(enemySpawnCounter > 0 && enemySpawnCounter % 25 === 0 ? new Cop() : new Suit()); }
  if (score >= nextLifeSpawnThreshold) { lifeGummies.push(new LifeGummy()); nextLifeSpawnThreshold += 25; }
  player.move(); player.display();
  if (keyIsDown(32) || touchControls.fireButton.active) { player.splash(); }
  for (let i = vials.length - 1; i >= 0; i--) { vials[i].update(); vials[i].display(); if (vials[i].isOffscreen()) vials.splice(i, 1); }
  for (let i = enemies.length - 1; i >= 0; i--) { enemies[i].update(player); enemies[i].display(); if (enemies[i].shouldBeRemoved()) { enemies.splice(i, 1); continue; } if (enemies[i].isOffscreen()) { if (enemies[i].state !== 'hippie') score--; enemies.splice(i, 1); } }
  for (let i = lifeGummies.length - 1; i >= 0; i--) { lifeGummies[i].update(); lifeGummies[i].display(); if (lifeGummies[i].isOffscreen()) lifeGummies.splice(i, 1); }
  handleCollisions();
  if (score < -5) gameState = 'gameOver';
  drawHUD();
  drawTouchControls();
}

function advanceGameState() {
  let vX, vY;
  if(touches.length > 0) { vX = (touches[0].x - offsetX) / scaleFactor; vY = (touches[0].y - offsetY) / scaleFactor; }
  else { vX = getVirtualMouseX(); vY = getVirtualMouseY(); }
  if (gameState === 'start') {
    let btnX = VIRTUAL_WIDTH / 2, btnY = VIRTUAL_HEIGHT / 2 + 100, btnW = 400, btnH = 90;
    if (vX > btnX - btnW / 2 && vX < btnX + btnW / 2 && vY > btnY - btnH / 2 && vY < btnY + btnH / 2) {
      resetGame(); gameState = 'playing';
    }
  } else if (gameState === 'gameOver' || gameState === 'win') { resetGame(); gameState = 'start'; }
}

function keyPressed() {
  if (keyCode === ENTER) {
    if (gameState === 'start') { resetGame(); gameState = 'playing'; }
    else if (gameState === 'gameOver' || gameState === 'win') { resetGame(); gameState = 'start'; }
  }
}
function mousePressed() { advanceGameState(); }
function touchStarted() { advanceGameState(); return false; }
function resetGame() {
  score = 0; vials = []; enemies = []; lifeGummies = []; player = new GummyBear();
  enemySpawnCounter = 0; nextLifeSpawnThreshold = 25; frameCount = 0;
}

// ... (draw...Screen, drawHUD, and Class definitions are largely the same, but with updated coordinates) ...
function drawStartScreen() { background(20, 10, 30); textAlign(CENTER, CENTER); fill(50, 255, 150); textSize(120); text("LSDGB", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 200); fill(255); textSize(24); text("Desktop: Use ARROW/WASD to move, HOLD SPACE to shoot.", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 90); text("Mobile: Use on-screen controls to move and shoot.", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 50); text("Collect 3 lives to win!", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 10); let btnX = VIRTUAL_WIDTH / 2, btnY = VIRTUAL_HEIGHT / 2 + 100, btnW = 400, btnH = 90; let pulse = sin(frameCount * 0.05) * 5; stroke(255, 0, 255); strokeWeight(4); fill(20, 10, 30, 200); rect(btnX, btnY, btnW + pulse, btnH + pulse/2, 10); noStroke(); fill(255, 0, 255); textSize(36); text("START REVOLUTION", btnX, btnY); fill(255); textSize(20); text("(Tap button or press ENTER)", btnX, btnY + 70); }
function handleCollisions() { for (let i = vials.length - 1; i >= 0; i--) { for (let j = enemies.length - 1; j >= 0; j--) { if (vials[i] && enemies[j] && enemies[j].state !== 'hippie' && enemies[j].isHitBy(vials[i])) { enemies[j].takeHit(); if(enemies[j].state === 'hippie') score++; vials.splice(i, 1); break; } } } for (let i = vials.length - 1; i >= 0; i--) { for (let j = lifeGummies.length - 1; j >= 0; j--) { if (vials[i] && lifeGummies[j] && lifeGummies[j].isHitBy(vials[i])) { vials.splice(i, 1); lifeGummies.splice(j, 1); break; } } } for (let i = enemies.length - 1; i >= 0; i--) { let enemy = enemies[i]; if (enemy.state !== 'hippie' && player.isCollidingWith(enemy)) { player.takeDamage(); enemies.splice(i, 1); if (player.lives <= 0) { gameState = 'gameOver'; return; } } } for (let i = enemies.length - 1; i >= 0; i--) { let enemy = enemies[i]; if (enemy && enemy.state === 'cop') { for (let j = enemies.length - 1; j >= 0; j--) { if (i === j) continue; let other = enemies[j]; if (other && other.state === 'hippie' && enemy.isCollidingWith(other)) { other.revertToAngrySuit(player); break; } } } } for (let i = lifeGummies.length - 1; i >= 0; i--) { if (player.isCollidingWith(lifeGummies[i])) { player.gainLife(); lifeGummies.splice(i, 1); if (player.lives >= player.maxLives) { gameState = 'win'; } } } }
function drawWinScreen() { background(20, 100, 80); textAlign(CENTER, CENTER); fill(255, 255, 0); textSize(72); text("REVOLUTION SUCCEEDS!", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 80); fill(255); textSize(40); text(`Final Score: ${score}`, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 20); textSize(30); text("Tap or press ENTER to play again", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 100); }
function drawGameOverScreen() { background(20, 10, 30); textAlign(CENTER, CENTER); fill(255, 0, 0); textSize(72); text("THE MAN WINS", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 80); fill(255); textSize(40); text(`Final Score: ${score}`, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 20); textSize(30); text("Tap or press ENTER to try again", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 100); }
function drawHUD() { fill(255, 0, 255); textSize(40); textAlign(LEFT, TOP); text(`SCORE: ${score}`, PLAYABLE_OFFSET_X + 20, 20); text(`LIVES: ${player.lives}`, PLAYABLE_OFFSET_X + 20, 70); }

class GummyBear {
  constructor() { this.x = VIRTUAL_WIDTH / 2; this.y = VIRTUAL_HEIGHT - 80; this.w = 50; this.h = 60; this.speed = 8; this.hue = random(360); this.lives = 1; this.maxLives = 3; this.baseShootCooldown = 35; this.fastestShootCooldown = 5; this.scoreForMaxSpeed = 50; this.shootCooldown = this.baseShootCooldown; this.lastShotFrame = 0; }
  update() { let effectiveScore = max(0, score); this.shootCooldown = map(effectiveScore, 0, this.scoreForMaxSpeed, this.baseShootCooldown, this.fastestShootCooldown); this.shootCooldown = constrain(this.shootCooldown, this.fastestShootCooldown, this.baseShootCooldown); }
  move() {
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65) || (isMobile && touchControls.dpad.isLeft)) this.x -= this.speed;
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68) || (isMobile && touchControls.dpad.isRight)) this.x += this.speed;
    if (keyIsDown(UP_ARROW) || keyIsDown(87) || (isMobile && touchControls.dpad.isUp)) this.y -= this.speed;
    if (keyIsDown(DOWN_ARROW) || keyIsDown(83) || (isMobile && touchControls.dpad.isDown)) this.y += this.speed;
    this.x = constrain(this.x, PLAYABLE_OFFSET_X + this.w/2, PLAYABLE_OFFSET_X + PLAYABLE_WIDTH - this.w/2); 
    this.y = constrain(this.y, this.h / 2, VIRTUAL_HEIGHT - this.h / 2); this.hue = (this.hue + 1) % 360;
  }
  display() { push(); colorMode(HSB, 360, 100, 100, 1); noStroke(); fill(this.hue, 80, 100, 0.8); ellipse(this.x, this.y, this.w, this.h); ellipse(this.x - this.w * 0.3, this.y - this.h * 0.4, this.w * 0.4); ellipse(this.x + this.w * 0.3, this.y - this.h * 0.4, this.w * 0.4); pop(); }
  splash() { if (frameCount - this.lastShotFrame > this.shootCooldown) { vials.push(new AcidVile(this.x, this.y - this.h / 4)); this.lastShotFrame = frameCount; } }
  takeDamage() { this.lives--; }
  gainLife() { if (this.lives < this.maxLives) this.lives++; }
  isCollidingWith(other) { return dist(this.x, this.y, other.x, other.y) < this.w / 2 + other.w / 2; }
}
class LifeGummy { constructor() { this.x = random(PLAYABLE_OFFSET_X + 20, PLAYABLE_OFFSET_X + PLAYABLE_WIDTH - 20); this.y = -50; this.w = 40; this.h = 50; this.speed = 2.5; this.hue = random(360); } update() { this.y += this.speed; this.hue = (this.hue + 2) % 360; } display() { push(); colorMode(HSB, 360, 100, 100, 1); noStroke(); fill(this.hue, 90, 100, 0.9); ellipse(this.x, this.y, this.w, this.h); ellipse(this.x - this.w * 0.3, this.y - this.h * 0.4, this.w * 0.4); ellipse(this.x + this.w * 0.3, this.y - this.h * 0.4, this.w * 0.4); pop(); } isHitBy(vile) { return dist(this.x, this.y, vile.x, vile.y) < this.w / 2 + vile.r; } isOffscreen() { return this.y > VIRTUAL_HEIGHT + this.h; } }
class AcidVile { constructor(x, y) { this.x = x; this.y = y; this.r = 12; this.speed = 10; this.hue = random(360); } update() { this.y -= this.speed; this.hue = (this.hue + 5) % 360; } display() { push(); colorMode(HSB, 360, 100, 100, 100); noStroke(); for (let i = 0; i < 3; i++) { let f = random(-2, 2), a = random(60, 90), s = this.r * 2 * random(0.8, 1.2); fill(this.hue, 90, 100, a); ellipse(this.x + f, this.y + f, s); } pop(); } isOffscreen() { return this.y < -this.r; } }
class Enemy { constructor() { this.x = random(PLAYABLE_OFFSET_X + 20, PLAYABLE_OFFSET_X + PLAYABLE_WIDTH - 20); this.y = -50; this.w = 40; this.h = 70; this.speed = random(1.5, 4); this.hue = random(360); this.transformTime = 0; this.slogan = ""; this.hippieSolidDuration = 7500; this.hippieFadeDuration = 2500; } update(target) { if (this.state === 'angry_suit') { this.x += this.chaseVector.x * this.speed; this.y += this.chaseVector.y * this.speed; } else if (this.state === 'hippie') { this.y += 0.5; this.hue = (this.hue + 1) % 360; } else { this.y += this.speed; } } isHitBy(vile) { return dist(this.x, this.y, vile.x, vile.y) < this.w / 2 + vile.r; } isCollidingWith(other) { return dist(this.x, this.y, other.x, other.y) < this.w / 2 + other.w / 2; } transform() { this.state = 'hippie'; this.transformTime = millis(); this.slogan = SLOGANS[floor(this.hue / (360 / SLOGANS.length))]; } shouldBeRemoved() { if (this.state !== 'hippie') return false; return millis() - this.transformTime > this.hippieSolidDuration + this.hippieFadeDuration; } isOffscreen() { return this.y > VIRTUAL_HEIGHT + this.h || this.y < -this.h || this.x < PLAYABLE_OFFSET_X - this.w || this.x > PLAYABLE_OFFSET_X + PLAYABLE_WIDTH + this.w; } displayAsHippie() { let timeSinceTransform = millis() - this.transformTime; let alpha = 255; if (timeSinceTransform > this.hippieSolidDuration) { alpha = map(timeSinceTransform, this.hippieSolidDuration, this.hippieSolidDuration + this.hippieFadeDuration, 255, 0); } push(); colorMode(HSB, 360, 100, 100, 100); fill(this.hue, 90, 90, map(alpha, 0, 255, 0, 100)); rect(this.x, this.y, this.w, this.h, 5); pop(); stroke(255, alpha); strokeWeight(2); noFill(); ellipse(this.x, this.y - 10, 15); line(this.x, this.y - 17.5, this.x, this.y - 2.5); line(this.x, this.y - 10, this.x - 6, this.y - 4); line(this.x, this.y - 10, this.x + 6, this.y - 4); noStroke(); fill(250, 220, 200, alpha); ellipse(this.x, this.y - this.h / 2 - 15, 30); stroke(139, 69, 19, alpha); strokeWeight(3); line(this.x - 15, this.y - this.h / 2 - 15, this.x - 20, this.y - this.h / 2 + 5); line(this.x + 15, this.y - this.h / 2 - 15, this.x + 20, this.y - this.h / 2 + 5); if (timeSinceTransform < 2500) { push(); let bubbleY = this.y - 70; textSize(16); textAlign(CENTER, CENTER); let sloganWidth = textWidth(this.slogan) + 25; noStroke(); fill(255, 255, 255, 200); rect(this.x, bubbleY, sloganWidth, 35, 15); fill(0); text(this.slogan, this.x, bubbleY); pop(); } } }
class Suit extends Enemy { constructor() { super(); this.state = 'suit'; } display() { (this.state === 'suit' || this.state === 'angry_suit') ? this.displayAsSuit() : this.displayAsHippie(); } revertToAngrySuit(target) { this.state = 'angry_suit'; this.speed = 5; let dx = target.x - this.x; let dy = VIRTUAL_HEIGHT; let direction = createVector(dx, dy); direction.normalize(); this.chaseVector = direction; } takeHit() { this.transform(); } displayAsSuit() { noStroke(); fill(80); rect(this.x, this.y, this.w, this.h, 5); fill(240); triangle(this.x, this.y - this.h * 0.3, this.x - 10, this.y - this.h * 0.5, this.x + 10, this.y - this.h * 0.5); if (this.state === 'angry_suit') { fill(255, 255, 0); } else { fill(200, 0, 0); } triangle(this.x, this.y, this.x - 5, this.y - 25, this.x + 5, this.y - 25); fill(220); ellipse(this.x, this.y - this.h / 2 - 15, 30); } }
class Cop extends Enemy { constructor() { super(); this.state = 'cop'; this.speed = random(2, 4.5); this.hits = 3; this.lastHitTime = 0; } display() { this.state === 'cop' ? this.displayAsCop() : this.displayAsHippie(); } takeHit() { this.hits--; this.lastHitTime = millis(); if (this.hits <= 0) this.transform(); } displayAsCop() { noStroke(); fill(20, 30, 120); rect(this.x, this.y, this.w, this.h, 5); fill(220); ellipse(this.x, this.y - this.h / 2 - 15, 30); fill(20, 30, 120); rect(this.x, this.y - this.h / 2 - 25, 40, 10, 2); rect(this.x, this.y - this.h / 2 - 30, 25, 10, 2); fill(255, 215, 0); ellipse(this.x - 10, this.y - 15, 8, 10); if (millis() - this.lastHitTime < 100) { fill(255, 0, 0, 150); rect(this.x, this.y, this.w + 5, this.h + 5, 8); } } }
