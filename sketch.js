
let player;
let vials = [];
let enemies = [];
let lifeGummies = [];
let score = 0;
const SLOGANS = ["Flower Power", "Groovy", "Far Out", "Cowabunga", "Trippy", "Gummy"];
let gameState = 'start'; // 'start', 'playing', 'gameOver', 'win'
let enemySpawnCounter = 0;
let nextLifeSpawnThreshold = 25;

function setup() {
  createCanvas(windowWidth, windowHeight);
  rectMode(CENTER);
  textFont('monospace');
  player = new GummyBear();
}

function draw() {
  if (gameState === 'start') {
    drawStartScreen();
  } else if (gameState === 'playing') {
    runGame();
  } else if (gameState === 'gameOver') {
    drawGameOverScreen();
  } else if (gameState === 'win') {
    drawWinScreen();
  }
}

// --- Game State Functions ---

function drawStartScreen() {
  background(20, 10, 30);
  textAlign(CENTER, CENTER);
  fill(50, 255, 150);
  textSize(120);
  text("LSDGB", width / 2, height / 2 - 200);

  fill(255);
  textSize(22);
  text("Use ARROW KEYS or WASD to move.", width / 2, height / 2 - 90);
  text("HOLD SPACEBAR to auto-shoot vibes.", width / 2, height / 2 - 60);
  text("Collect 3 lives to win! Extra lives spawn every 25 points.", width / 2, height / 2 - 30);

  let btnX = width / 2, btnY = height / 2 + 100, btnW = 350, btnH = 80;
  let pulse = sin(frameCount * 0.05) * 5;
  stroke(255, 0, 255); strokeWeight(4); fill(20, 10, 30, 200);
  rect(btnX, btnY, btnW + pulse, btnH + pulse/2, 10);
  noStroke(); fill(255, 0, 255); textSize(32);
  text("START REVOLUTION", btnX, btnY);
  
  fill(255); textSize(18);
  text("(Click button or press ENTER)", btnX, btnY + 60);
}

function runGame() {
  background(40, 35, 50);

  // *** NEW SPAWN LOGIC HERE ***
  // Spawn rate is now tied to the player's fire rate for dynamic difficulty.
  let spawnDelay = floor(map(player.shootCooldown, player.minShootCooldown, player.maxShootCooldown, 15, 75));
  if (frameCount % spawnDelay === 0) {
    enemySpawnCounter++;
    enemies.push(enemySpawnCounter > 0 && enemySpawnCounter % 25 === 0 ? new Cop() : new Suit());
  }
  
  if (score >= nextLifeSpawnThreshold) {
    lifeGummies.push(new LifeGummy());
    nextLifeSpawnThreshold += 25;
  }

  player.move();
  player.display();
  if (keyIsDown(32)) player.splash();

  for (let i = vials.length - 1; i >= 0; i--) {
    vials[i].update(); vials[i].display();
    if (vials[i].isOffscreen()) vials.splice(i, 1);
  }
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].update(player); 
    enemies[i].display();
    
    if (enemies[i].shouldBeRemoved()) {
        enemies.splice(i, 1);
        continue;
    }

    if (enemies[i].isOffscreen()) {
      if (enemies[i].state !== 'hippie') { score--; player.decreaseFireRate(); }
      enemies.splice(i, 1);
    }
  }
  for (let i = lifeGummies.length - 1; i >= 0; i--) {
    lifeGummies[i].update(); lifeGummies[i].display();
    if (lifeGummies[i].isOffscreen()) lifeGummies.splice(i, 1);
  }
  
  handleCollisions();
  
  if (score < 0) gameState = 'gameOver';
  drawHUD();
}

function handleCollisions() {
  for (let i = vials.length - 1; i >= 0; i--) {
    for (let j = enemies.length - 1; j >= 0; j--) {
      if (vials[i] && enemies[j] && enemies[j].state !== 'hippie' && enemies[j].isHitBy(vials[i])) {
        enemies[j].takeHit();
        if(enemies[j].state === 'hippie') { score++; player.increaseFireRate(); }
        vials.splice(i, 1);
        break; 
      }
    }
  }

  for (let i = vials.length - 1; i >= 0; i--) {
    for (let j = lifeGummies.length - 1; j >= 0; j--) {
        if (vials[i] && lifeGummies[j] && lifeGummies[j].isHitBy(vials[i])) {
            vials.splice(i, 1);
            lifeGummies.splice(j, 1);
            break;
        }
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    if (enemy.state !== 'hippie' && player.isCollidingWith(enemy)) {
      player.takeDamage();
      enemies.splice(i, 1);
      if (player.lives <= 0) {
        gameState = 'gameOver';
        return;
      }
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    if (enemy && enemy.state === 'cop') {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (i === j) continue;
            let other = enemies[j];
            if (other && other.state === 'hippie' && enemy.isCollidingWith(other)) {
                other.revertToAngrySuit(player);
                break;
            }
        }
    }
  }

  for (let i = lifeGummies.length - 1; i >= 0; i--) {
    if (player.isCollidingWith(lifeGummies[i])) {
      player.gainLife();
      lifeGummies.splice(i, 1);
      if (player.lives >= player.maxLives) {
        gameState = 'win';
      }
    }
  }
}

function drawWinScreen() {
    background(20, 100, 80);
    textAlign(CENTER, CENTER);
    fill(255, 255, 0); textSize(64);
    text("REVOLUTION SUCCEEDS!", width / 2, height / 2 - 80);
    fill(255); textSize(32);
    text(`Final Score: ${score}`, width / 2, height / 2);
    textSize(24);
    text("Click or press ENTER to play again", width / 2, height / 2 + 60);
}

function drawGameOverScreen() {
  background(20, 10, 30);
  textAlign(CENTER, CENTER);
  fill(255, 0, 0); textSize(64);
  text("THE MAN WINS", width / 2, height / 2 - 80);
  fill(255); textSize(32);
  text(`Final Score: ${score}`, width / 2, height / 2);
  textSize(24);
  text("Click or press ENTER to try again", width / 2, height / 2 + 60);
}


function drawHUD() {
  fill(255, 0, 255); textSize(32); textAlign(LEFT, TOP);
  text(`SCORE: ${score}`, 20, 20);
  text(`LIVES: ${player.lives}`, 20, 60);
}

function keyPressed() {
  if (keyCode === ENTER) {
    if (gameState === 'start' || gameState === 'gameOver' || gameState === 'win') {
      let wasStart = gameState === 'start';
      resetGame();
      gameState = wasStart ? 'playing' : 'start';
    }
  }
}

function mousePressed() {
  if (gameState === 'start' || gameState === 'gameOver' || gameState === 'win') {
    let wasStart = gameState === 'start';
    resetGame();
    gameState = wasStart ? 'playing' : 'start';
  }
}

function resetGame() {
  score = 0; vials = []; enemies = []; lifeGummies = [];
  player = new GummyBear();
  enemySpawnCounter = 0;
  nextLifeSpawnThreshold = 25;
  frameCount = 0;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    if(player) {
      player.x = constrain(player.x, player.w / 2, width - player.w / 2);
      player.y = constrain(player.y, player.h / 2, height - player.h / 2);
    }
}

// --- CLASSES ---

class GummyBear {
  constructor() {
    this.x = width / 2; this.y = height - 80;
    this.w = 50; this.h = 60;
    this.speed = 6; this.hue = random(360);
    this.lives = 1; this.maxLives = 3;
    this.shootCooldown = 30; this.minShootCooldown = 5; this.maxShootCooldown = 60;
    this.lastShotFrame = 0;
  }
  move() {
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) this.x -= this.speed;
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) this.x += this.speed;
    if (keyIsDown(UP_ARROW) || keyIsDown(87)) this.y -= this.speed;
    if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) this.y += this.speed;
    this.x = constrain(this.x, this.w / 2, width - this.w / 2);
    this.y = constrain(this.y, this.h / 2, height - this.h / 2);
    this.hue = (this.hue + 1) % 360;
  }
  display() {
    push(); colorMode(HSB, 360, 100, 100, 1); noStroke();
    fill(this.hue, 80, 100, 0.8);
    ellipse(this.x, this.y, this.w, this.h);
    ellipse(this.x - this.w * 0.3, this.y - this.h * 0.4, this.w * 0.4);
    ellipse(this.x + this.w * 0.3, this.y - this.h * 0.4, this.w * 0.4);
    pop();
  }
  splash() {
    if (frameCount - this.lastShotFrame > this.shootCooldown) {
      vials.push(new AcidVile(this.x, this.y - this.h / 4));
      this.lastShotFrame = frameCount;
    }
  }
  increaseFireRate() { this.shootCooldown = constrain(this.shootCooldown - 2, this.minShootCooldown, this.maxShootCooldown); }
  decreaseFireRate() { this.shootCooldown = constrain(this.shootCooldown + 3, this.minShootCooldown, this.maxShootCooldown); }
  takeDamage() { this.lives--; }
  gainLife() { if (this.lives < this.maxLives) this.lives++; }
  isCollidingWith(other) { return dist(this.x, this.y, other.x, other.y) < this.w / 2 + other.w / 2; }
}

class LifeGummy {
    constructor() { this.x = random(20, width - 20); this.y = -50; this.w = 40; this.h = 50; this.speed = 2.5; this.hue = random(360); }
    update() { this.y += this.speed; this.hue = (this.hue + 2) % 360; }
    display() {
        push(); colorMode(HSB, 360, 100, 100, 1); noStroke();
        fill(this.hue, 90, 100, 0.9);
        ellipse(this.x, this.y, this.w, this.h);
        ellipse(this.x - this.w * 0.3, this.y - this.h * 0.4, this.w * 0.4);
        ellipse(this.x + this.w * 0.3, this.y - this.h * 0.4, this.w * 0.4);
        pop();
    }
    isHitBy(vile) { return dist(this.x, this.y, vile.x, vile.y) < this.w / 2 + vile.r; }
    isOffscreen() { return this.y > height + this.h; }
}

class AcidVile {
  constructor(x, y) { this.x = x; this.y = y; this.r = 12; this.speed = 8; this.hue = random(360); }
  update() { this.y -= this.speed; this.hue = (this.hue + 5) % 360; }
  display() {
    push(); colorMode(HSB, 360, 100, 100, 100); noStroke();
    for (let i = 0; i < 3; i++) {
      let f = random(-2, 2), a = random(60, 90), s = this.r * 2 * random(0.8, 1.2);
      fill(this.hue, 90, 100, a); ellipse(this.x + f, this.y + f, s);
    }
    pop();
  }
  isOffscreen() { return this.y < -this.r; }
}

class Enemy {
   constructor() {
    this.x = random(20, width - 20); this.y = -50; this.w = 40; this.h = 70;
    this.speed = random(1, 3); this.hue = random(360); this.transformTime = 0; this.slogan = "";
    this.hippieSolidDuration = 7500; this.hippieFadeDuration = 2500;
  }
  update(target) {
    if (this.state === 'angry_suit') { this.x += this.chaseVector.x * this.speed; this.y += this.chaseVector.y * this.speed; }
    else if (this.state === 'hippie') { this.y += 0.5; this.hue = (this.hue + 1) % 360; }
    else { this.y += this.speed; }
  }
  isHitBy(vile) { return dist(this.x, this.y, vile.x, vile.y) < this.w / 2 + vile.r; }
  isCollidingWith(other) { return dist(this.x, this.y, other.x, other.y) < this.w / 2 + other.w / 2; }
  transform() {
    this.state = 'hippie'; this.transformTime = millis();
    this.slogan = SLOGANS[floor(this.hue / (360 / SLOGANS.length))];
  }
  shouldBeRemoved() {
    if (this.state !== 'hippie') return false;
    return millis() - this.transformTime > this.hippieSolidDuration + this.hippieFadeDuration;
  }
  isOffscreen() { return this.y > height + this.h || this.y < -this.h || this.x < -this.w || this.x > width + this.w; }
  displayAsHippie() {
    let timeSinceTransform = millis() - this.transformTime;
    let alpha = 255;
    if (timeSinceTransform > this.hippieSolidDuration) {
        alpha = map(timeSinceTransform, this.hippieSolidDuration, this.hippieSolidDuration + this.hippieFadeDuration, 255, 0);
    }
    push(); colorMode(HSB, 360, 100, 100, 100); fill(this.hue, 90, 90, map(alpha, 0, 255, 0, 100)); rect(this.x, this.y, this.w, this.h, 5); pop();
    stroke(255, alpha); strokeWeight(2); noFill(); ellipse(this.x, this.y - 10, 15);
    line(this.x, this.y - 17.5, this.x, this.y - 2.5); line(this.x, this.y - 10, this.x - 6, this.y - 4); line(this.x, this.y - 10, this.x + 6, this.y - 4);
    noStroke(); fill(250, 220, 200, alpha); ellipse(this.x, this.y - this.h / 2 - 15, 30);
    stroke(139, 69, 19, alpha); strokeWeight(3);
    line(this.x - 15, this.y - this.h / 2 - 15, this.x - 20, this.y - this.h / 2 + 5); line(this.x + 15, this.y - this.h / 2 - 15, this.x + 20, this.y - this.h / 2 + 5);
    if (timeSinceTransform < 2500) {
      push(); let bubbleY = this.y - 70; textSize(14); textAlign(CENTER, CENTER); let sloganWidth = textWidth(this.slogan) + 20;
      noStroke(); fill(255, 255, 255, 200); rect(this.x, bubbleY, sloganWidth, 30, 15);
      fill(0); text(this.slogan, this.x, bubbleY); pop();
    }
  }
}

class Suit extends Enemy {
  constructor() { super(); this.state = 'suit'; }
  display() { (this.state === 'suit' || this.state === 'angry_suit') ? this.displayAsSuit() : this.displayAsHippie(); }
  revertToAngrySuit(target) {
    this.state = 'angry_suit'; this.speed = 4;
    let dx = target.x - this.x; let dy = height;
    let direction = createVector(dx, dy);
    direction.normalize(); this.chaseVector = direction;
  }
  takeHit() { this.transform(); }
  displayAsSuit() {
    noStroke(); fill(80); rect(this.x, this.y, this.w, this.h, 5);
    fill(240); triangle(this.x, this.y - this.h * 0.3, this.x - 10, this.y - this.h * 0.5, this.x + 10, this.y - this.h * 0.5);
    if (this.state === 'angry_suit') { fill(255, 255, 0); } else { fill(200, 0, 0); }
    triangle(this.x, this.y, this.x - 5, this.y - 25, this.x + 5, this.y - 25);
    fill(220); ellipse(this.x, this.y - this.h / 2 - 15, 30);
  }
}

class Cop extends Enemy {
  constructor() { super(); this.state = 'cop'; this.speed = random(1.5, 3.5); this.hits = 3; this.lastHitTime = 0; }
  display() { this.state === 'cop' ? this.displayAsCop() : this.displayAsHippie(); }
  takeHit() { this.hits--; this.lastHitTime = millis(); if (this.hits <= 0) this.transform(); }
  displayAsCop() {
    noStroke(); fill(20, 30, 120); rect(this.x, this.y, this.w, this.h, 5);
    fill(220); ellipse(this.x, this.y - this.h / 2 - 15, 30);
    fill(20, 30, 120); rect(this.x, this.y - this.h / 2 - 25, 40, 10, 2); rect(this.x, this.y - this.h / 2 - 30, 25, 10, 2);
    fill(255, 215, 0); ellipse(this.x - 10, this.y - 15, 8, 10);
    if (millis() - this.lastHitTime < 100) { fill(255, 0, 0, 150); rect(this.x, this.y, this.w + 5, this.h + 5, 8); }
  }
}
