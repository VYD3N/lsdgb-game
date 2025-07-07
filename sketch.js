let player;
let vials = [];
let enemies = [];
let lifeGummies = [];
let score = 0;
const SLOGANS = ["Flower Power", "Groovy", "Far Out", "Cowabunga", "Trippy", "Gummy"];
let gameState = 'start'; // 'start', 'playing', 'gameOver', 'win'
let enemySpawnCounter = 0;
let nextLifeSpawnThreshold = 25;
let shootingSounds = [];
const SHOOTING_POOL_SIZE = 8;
let shootingSoundIndex = 0;
let soundtrack;
let soundtrack2;
let gummyBearSound;
let playerImg;
let suitFrames = [];
let hippieFrames = [];
let copFrames = [];
let angrySuitFrames = [];
let bgImg;
let lifeGummyFrames = [];
let difficulty = 'normal'; // 'normal' or 'hard'
let selectedMode = 0; // 0 = normal, 1 = hard
let parkinglotImg;
let convictFrames = [];
let formerCopFrames = [];
const FORMER_COP_SLOGANS = ["Werk It", "Rainbow!", "Out Loud", "True Colors", "Love Wins", "Proud!"];
let slowedSuits = new Map(); // suit instance -> slowUntil timestamp
let audioContextResumed = false; // Track if we've resumed audio context
let lsdgbLogo;
let grassLeftImg, grassRightImg, grassCenterImg;
let parkinglotLeftImg, parkinglotRightImg, parkinglotCenterImg;


// --- VIRTUAL CANVAS & PLAYABLE AREA SETUP ---
const VIRTUAL_WIDTH = 1280;
const VIRTUAL_HEIGHT = 720;
const PLAYABLE_WIDTH = 960;
const PLAYABLE_OFFSET_X = (VIRTUAL_WIDTH - PLAYABLE_WIDTH) / 2;
let scaleFactor, offsetX, offsetY;
let isMobile = false;
let touchControls = {};

function preload() {
  for (let i = 0; i < SHOOTING_POOL_SIZE; i++) {
    shootingSounds[i] = loadSound('shooting.mp3');
  }
  soundtrack = loadSound('soundtrack.mp3');
  soundtrack2 = loadSound('soundtrack2.mp3');
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
  grassLeftImg = loadImage('grass-left.png');
  grassRightImg = loadImage('grass-right.png');
  grassCenterImg = loadImage('grass-center.png');
  parkinglotLeftImg = loadImage('parkinglot-left.png');
  parkinglotRightImg = loadImage('parkinglot-right.png');
  parkinglotCenterImg = loadImage('parkinglot-center.png');
  lifeGummyFrames[0] = loadImage('lifegummy1.png');
  lifeGummyFrames[1] = loadImage('lifegummy2.png');
  parkinglotImg = loadImage('parkinglot.png');
  convictFrames[0] = loadImage('convict1.png');
  convictFrames[1] = loadImage('convict2.png');
  formerCopFrames[0] = loadImage('formercop1.png');
  formerCopFrames[1] = loadImage('formercop2.png');
  lsdgbLogo = loadImage('lsdgb-logo.png');
}

function setup() {
  calculateScaling();
  createCanvas(windowWidth, windowHeight);
  isMobile = ('ontouchstart' in window);
  setupTouchControls();
  rectMode(CENTER);
  textFont('monospace');
  player = new GummyBear();
  
  // Resume audio context on first user interaction
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
  // Fix: force recalculation after a short delay to ensure centering
  setTimeout(() => {
    windowResized();
  }, 100);
}

function draw() {
  // Debug logging for objkt.com iframe sizing
  if (frameCount % 60 === 0) { // Log every 60 frames (once per second)
    let clientW = document.documentElement.clientWidth;
    let clientH = document.documentElement.clientHeight;
    console.log('clientW:', clientW, 'clientH:', clientH, 'canvas.width:', width, 'canvas.height:', height);
  }

  // Draw background using left, center, and right images for current mode
  let leftImg = grassLeftImg;
  let rightImg = grassRightImg;
  let centerImg = grassCenterImg;
  if (difficulty === 'hard') {
    leftImg = parkinglotLeftImg;
    rightImg = parkinglotRightImg;
    centerImg = parkinglotCenterImg;
  }
  if (leftImg && rightImg && centerImg) {
    // Dynamically scale barriers to max 15% of canvas width each
    let barrierFrac = 0.15;
    let leftW = Math.min(leftImg.width, width * barrierFrac);
    let rightW = Math.min(rightImg.width, width * barrierFrac);
    let playY = 0;
    let playH = height;
    // Draw left border at canvas edge
    image(leftImg, 0, playY, leftW, playH);
    // Draw right border at canvas edge
    image(rightImg, width - rightW, playY, rightW, playH);
    // Tile center horizontally between borders
    let centerStart = leftW;
    let centerEnd = width - rightW;
    let x = centerStart;
    while (x < centerEnd) {
      let tileW = min(centerImg.width, centerEnd - x);
      image(centerImg, x, playY, tileW, playH, 0, 0, tileW, centerImg.height);
      x += tileW;
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
  // Get actual client dimensions (works better in iframes)
  let clientW = document.documentElement.clientWidth;
  let clientH = document.documentElement.clientHeight;
  
  // Force 4:3 aspect ratio with integer dimensions
  let targetAspect = 4 / 3;
  let clientAspect = clientW / clientH;
  let canvasW, canvasH;

  if (clientAspect > targetAspect) {
    // Client is too wide, limit width
    canvasH = clientH;
    canvasW = Math.floor(canvasH * targetAspect);
  } else {
    // Client is too tall, limit height
    canvasW = clientW;
    canvasH = Math.floor(canvasW / targetAspect);
  }
  
  // Ensure minimum size and integer dimensions
  canvasW = Math.max(canvasW, 400);
  canvasH = Math.max(canvasH, 300);
  
  resizeCanvas(canvasW, canvasH);
  scaleFactor = min(canvasW / VIRTUAL_WIDTH, canvasH / VIRTUAL_HEIGHT);
  offsetX = (canvasW - VIRTUAL_WIDTH * scaleFactor) / 2;
  offsetY = (canvasH - VIRTUAL_HEIGHT * scaleFactor) / 2;
}

function windowResized() {
  calculateScaling();
}

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
  handleTouchInput(); 
  player.update();
  
  // Auto-restart soundtrack if it should be playing but isn't
  if (gameState === 'playing') {
    let currentSoundtrack = (difficulty === 'hard') ? soundtrack2 : soundtrack;
    if (currentSoundtrack && currentSoundtrack.isLoaded() && !currentSoundtrack.isPlaying()) {
      currentSoundtrack.setLoop(true);
      currentSoundtrack.play();
    }
  }
  
  // Remove play area boundary lines (now handled by tree barriers)
  // stroke(255, 255, 255, 20); strokeWeight(4);
  // line(PLAYABLE_OFFSET_X, 0, PLAYABLE_OFFSET_X, VIRTUAL_HEIGHT);
  // line(PLAYABLE_OFFSET_X + PLAYABLE_WIDTH, 0, PLAYABLE_OFFSET_X + PLAYABLE_WIDTH, VIRTUAL_HEIGHT);
  let spawnDelay;
  if (difficulty === 'hard') {
    spawnDelay = floor(map(player.shootCooldown, player.fastestShootCooldown, player.baseShootCooldown, 10, 40));
  } else {
    spawnDelay = floor(map(player.shootCooldown, player.fastestShootCooldown, player.baseShootCooldown, 20, 90));
  }
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
  if (score < (difficulty === 'hard' ? -3 : -5)) gameState = 'gameOver';
  drawHUD();
  drawTouchControls();
}

function handleCollisions() {
  // Vials vs. enemies: allow vials to pass through hippies and formercops
  for (let i = vials.length - 1; i >= 0; i--) {
    let hitUnfriendly = false;
    for (let j = enemies.length - 1; j >= 0; j--) {
      if (
        vials[i] && enemies[j] &&
        enemies[j].state !== 'hippie' &&
        enemies[j].state !== 'formercop' &&
        enemies[j].isHitBy(vials[i])
      ) {
        enemies[j].takeHit();
        if (enemies[j].state === 'hippie') score++;
        vials.splice(i, 1);
        hitUnfriendly = true;
        break;
      }
    }
    if (hitUnfriendly) continue;
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
  for (let i = enemies.length - 1; i >= 0; i--) { 
    let enemy = enemies[i]; 
    if (enemy.state !== 'hippie' && enemy.state !== 'formercop' && player.isCollidingWith(enemy)) { 
      player.takeDamage(); 
      enemies.splice(i, 1); 
      if (player.lives <= 0) { gameState = 'gameOver'; return; } 
    } 
  }
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    if (enemy && enemy.state === 'cop') {
      for (let j = enemies.length - 1; j >= 0; j--) {
        if (i === j) continue;
        let other = enemies[j];
        if (other && other.state === 'hippie' && enemy.isCollidingWith(other)) {
          if (other.origin === 'suit' && other instanceof Suit) {
            other.revertToAngrySuit(player);
          } else if (other.origin === 'cop') {
            // Transform hippie (was cop) into Convict
            enemies[j] = new Convict(other.x, other.y);
          }
          break;
        }
      }
    }
  }
  // Convict vs. LifeGummy
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    if (enemy && enemy.state === 'convict' && lifeGummies.length > 0) {
      for (let j = lifeGummies.length - 1; j >= 0; j--) {
        if (dist(enemy.x, enemy.y, lifeGummies[j].x, lifeGummies[j].y) < enemy.w/2 + lifeGummies[j].w/2) {
          lifeGummies.splice(j, 1);
        break; 
        }
      }
    }
  }
  for (let i = lifeGummies.length - 1; i >= 0; i--) { if (player.isCollidingWith(lifeGummies[i])) { player.gainLife(); lifeGummies.splice(i, 1); if (player.lives >= (difficulty === 'hard' ? 4 : player.maxLives)) { gameState = 'win'; } } }
  // Suit vs. FormerCop
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    if (enemy && enemy.state === 'suit') {
      for (let j = enemies.length - 1; j >= 0; j--) {
        if (i === j) continue;
        let other = enemies[j];
        if (other && other.state === 'formercop' && enemy.isCollidingWith(other)) {
          slowedSuits.set(enemy, millis() + 3000); // slow for 3 seconds
        }
      }
    }
  }
}

function advanceGameState() {
  // Resume audio context on any user interaction
  if (!audioContextResumed && getAudioContext().state !== 'running') {
    getAudioContext().resume();
    audioContextResumed = true;
  }
  
  let vX, vY;
  if(touches.length > 0) { vX = (touches[0].x - offsetX) / scaleFactor; vY = (touches[0].y - offsetY) / scaleFactor; }
  else { vX = mouseX !== undefined ? (mouseX - offsetX) / scaleFactor : 0; vY = mouseY !== undefined ? (mouseY - offsetY) / scaleFactor : 0; }
  if (gameState === 'start') {
    let btnX = VIRTUAL_WIDTH / 2, btnW = 400, btnH = 90;
    let btnNormalY = VIRTUAL_HEIGHT / 2;
    let btnHardY = VIRTUAL_HEIGHT / 2 + 120;
    // Check which button is pressed
    if (vX > btnX - btnW / 2 && vX < btnX + btnW / 2 && vY > btnNormalY - btnH / 2 && vY < btnNormalY + btnH / 2) {
      difficulty = 'normal';
      selectedMode = 0;
      resetGame();
      gameState = 'playing';
      if (soundtrack && soundtrack.isLoaded()) {
        soundtrack.setLoop(true);
        soundtrack.play();
      }
    } else if (vX > btnX - btnW / 2 && vX < btnX + btnW / 2 && vY > btnHardY - btnH / 2 && vY < btnHardY + btnH / 2) {
      difficulty = 'hard';
      selectedMode = 1;
      resetGame();
      gameState = 'playing';
      if (soundtrack2 && soundtrack2.isLoaded()) {
        soundtrack2.setLoop(true);
        soundtrack2.play();
      }
    }
  }
  else if (gameState === 'gameOver' || gameState === 'win') {
    if (soundtrack && soundtrack.isPlaying()) soundtrack.stop();
    if (soundtrack2 && soundtrack2.isPlaying()) soundtrack2.stop();
    resetGame();
    gameState = 'start';
  }
}

function keyPressed() {
  // Resume audio context on any key press
  if (!audioContextResumed && getAudioContext().state !== 'running') {
    getAudioContext().resume();
    audioContextResumed = true;
  }
  
  if (gameState === 'start') {
    if (keyCode === UP_ARROW || keyCode === 87) selectedMode = 0;
    if (keyCode === DOWN_ARROW || keyCode === 83) selectedMode = 1;
    if (keyCode === ENTER) {
      difficulty = selectedMode === 0 ? 'normal' : 'hard';
      resetGame();
      gameState = 'playing';
      if (difficulty === 'hard') {
        if (soundtrack2 && soundtrack2.isLoaded()) {
          soundtrack2.setLoop(true);
          soundtrack2.play();
        }
      } else {
        if (soundtrack && soundtrack.isLoaded()) {
          soundtrack.setLoop(true);
          soundtrack.play();
        }
      }
    }
  } else if (keyCode === ENTER && (gameState === 'gameOver' || gameState === 'win')) {
    if (soundtrack && soundtrack.isPlaying()) soundtrack.stop();
    if (soundtrack2 && soundtrack2.isPlaying()) soundtrack2.stop();
    resetGame();
    gameState = 'start';
  }
}

function mousePressed() { 
  // Resume audio context on mouse press
  if (!audioContextResumed && getAudioContext().state !== 'running') {
    getAudioContext().resume();
    audioContextResumed = true;
  }
  advanceGameState(); 
}

function touchStarted() { 
  // Resume audio context on touch
  if (!audioContextResumed && getAudioContext().state !== 'running') {
    getAudioContext().resume();
    audioContextResumed = true;
  }
  advanceGameState(); 
  return false; 
}

function resetGame() { score = 0; vials = []; enemies = []; lifeGummies = []; player = new GummyBear(); enemySpawnCounter = 0; nextLifeSpawnThreshold = 25; frameCount = 0; }

function drawStartScreen() {
  background(20, 10, 30);
  textAlign(CENTER, CENTER);
  // Draw the logo image instead of text
  let logoW = 480; // 600 * 0.8
  let logoH = 208; // 260 * 0.8
  let logoY = VIRTUAL_HEIGHT / 2 - 340;
  if (typeof lsdgbLogo !== 'undefined' && lsdgbLogo) {
    imageMode(CENTER);
    image(lsdgbLogo, VIRTUAL_WIDTH / 2, logoY + logoH/2, logoW, logoH);
    imageMode(CORNER);
  } else {
    fill(50, 255, 150);
    textSize(120);
    text("LSDGB", VIRTUAL_WIDTH / 2, logoY);
  }
  fill(255);
  textSize(28);
  let diffLabelY = logoY + logoH + 20;
  text("Select Your Difficulty", VIRTUAL_WIDTH / 2, diffLabelY);

  // Make buttons about 10% smaller
  let btnW = 306; // 340 * 0.9
  let btnH = 68;  // 76 * 0.9
  let btnNormalY = diffLabelY + 70;
  let btnHardY = btnNormalY + 85; // slightly less vertical gap for smaller buttons

  let pulse = sin(frameCount * 0.05) * 5;
  strokeWeight(4);
  stroke(255, 0, 255);
  fill(20, 10, 30, 200);
  rect(VIRTUAL_WIDTH / 2, btnNormalY, btnW + (selectedMode === 0 ? pulse : 0), btnH + (selectedMode === 0 ? pulse/2 : 0), 16);
  rect(VIRTUAL_WIDTH / 2, btnHardY, btnW + (selectedMode === 1 ? pulse : 0), btnH + (selectedMode === 1 ? pulse/2 : 0), 16);

  noStroke();
  fill(selectedMode === 0 ? [0,255,0] : [255,0,255]);
  textSize(36);
  text("NORMAL MODE", VIRTUAL_WIDTH / 2, btnNormalY);
  fill(selectedMode === 1 ? [255,0,0] : [255,0,255]);
  text("HARD MODE", VIRTUAL_WIDTH / 2, btnHardY);

  // HOW TO PLAY panel (keep at 185px gap)
  let instructionsY = btnHardY + 178;
  let panelW = 700, panelH = 260;
  let panelX = VIRTUAL_WIDTH / 2;
  
  // Panel background
  noStroke();
  fill(255, 255, 255, 180);
  rect(panelX, instructionsY, panelW, panelH, 28);
  
  stroke(120, 0, 255, 120);
  strokeWeight(3);
  noFill();
  rect(panelX, instructionsY, panelW, panelH, 28);
    noStroke();

  fill(30, 10, 40);
  textSize(24);
  textAlign(CENTER, TOP);
  let currentY = instructionsY - panelH / 2 + 22;
  text("HOW TO PLAY", panelX, currentY);
  currentY += 38;
  textSize(18);
  textAlign(LEFT, TOP);
  let leftX = panelX - panelW/2 + 36;
  let rightX = panelX + 30;
  text("MOVE  :  Arrow keys / WASD", leftX, currentY);
  text("• drag the on-screen D-pad (touch)", rightX, currentY);
  currentY += 28;
  text("FIRE  :  Hold SPACEBAR", leftX, currentY);
  text("• tap the red button (touch)", rightX, currentY);
  currentY += 36;
  textAlign(CENTER, TOP);
  text("Flip SUITS & COPS into HIPPIES with acid vials.", panelX, currentY);
  currentY += 26;
  text("Grab LIFE-GUMMY bears for extra lives.", panelX, currentY);
  currentY += 32;
  text("WIN  :  3 lives (Normal) •  4 lives (Hard)", panelX, currentY);
  currentY += 26;
  text("LOSE :  Score ≤ -5 (Normal) • ≤ -3 (Hard)", panelX, currentY);
}

function drawWinScreen() { background(20, 100, 80); textAlign(CENTER, CENTER); fill(255, 255, 0); textSize(72); text("REVOLUTION SUCCEEDS!", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 80); fill(255); textSize(40); text(`Final Score: ${score}`, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 20); textSize(30); text("Tap or press ENTER to play again", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 100); }
function drawGameOverScreen() { background(20, 10, 30); textAlign(CENTER, CENTER); fill(255, 0, 0); textSize(72); text("THE MAN WINS", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 80); fill(255); textSize(40); text(`Final Score: ${score}`, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 20); textSize(30); text("Tap or press ENTER to try again", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 100); }
function drawHUD() {
  if (difficulty === 'hard') {
    fill(255, 0, 0); // Red for danger in hard mode
  } else {
    fill(255, 0, 255);
  }
  textSize(40);
  textAlign(LEFT, TOP);
  text(`SCORE: ${score}`, PLAYABLE_OFFSET_X + 20, 20);
  text(`LIVES: ${player.lives}`, PLAYABLE_OFFSET_X + 20, 70);
}

function playShootingSound() {
  let sound = shootingSounds[shootingSoundIndex];
  if (sound && sound.isLoaded()) {
    sound.play();
    shootingSoundIndex = (shootingSoundIndex + 1) % SHOOTING_POOL_SIZE;
  }
}

class GummyBear {
  constructor() {
    this.x = VIRTUAL_WIDTH / 2;
    this.w = 50;
    this.h = 60;
    this.y = VIRTUAL_HEIGHT - this.h / 2; // Start at very bottom of play area
    this.speed = 8;
    this.hue = random(360);
    this.lives = difficulty === 'hard' ? 1 : 1;
    this.maxLives = difficulty === 'hard' ? 2 : 3;
    this.baseShootCooldown = 35;
    this.fastestShootCooldown = 5;
    this.scoreForMaxSpeed = 50;
    this.shootCooldown = this.baseShootCooldown;
    this.lastShotFrame = 0;
  }
  update() { let effectiveScore = max(0, score); this.shootCooldown = map(effectiveScore, 0, this.scoreForMaxSpeed, this.baseShootCooldown, this.fastestShootCooldown); this.shootCooldown = constrain(this.shootCooldown, this.fastestShootCooldown, this.baseShootCooldown); }
  move() { if (keyIsDown(LEFT_ARROW) || keyIsDown(65) || (isMobile && touchControls.dpad.isLeft)) this.x -= this.speed; if (keyIsDown(RIGHT_ARROW) || keyIsDown(68) || (isMobile && touchControls.dpad.isRight)) this.x += this.speed; if (keyIsDown(UP_ARROW) || keyIsDown(87) || (isMobile && touchControls.dpad.isUp)) this.y -= this.speed; if (keyIsDown(DOWN_ARROW) || keyIsDown(83) || (isMobile && touchControls.dpad.isDown)) this.y += this.speed; this.x = constrain(this.x, PLAYABLE_OFFSET_X + this.w/2, PLAYABLE_OFFSET_X + PLAYABLE_WIDTH - this.w/2); this.y = constrain(this.y, this.h / 2, VIRTUAL_HEIGHT - this.h / 2); this.hue = (this.hue + 1) % 360; }
  display() {
    if (playerImg) {
      image(playerImg, this.x - this.w/2, this.y - this.h/2, this.w, this.h);
    } else {
      push(); colorMode(HSB, 360, 100, 100, 1); noStroke(); fill(this.hue, 80, 100, 0.8); ellipse(this.x, this.y, this.w, this.h); ellipse(this.x - this.w * 0.3, this.y - this.h * 0.4, this.w * 0.4); ellipse(this.x + this.w * 0.3, this.y - this.h * 0.4, this.w * 0.4); pop();
    }
  }
  splash() { if (frameCount - this.lastShotFrame > this.shootCooldown) { vials.push(new AcidVile(this.x, this.y - this.h / 4)); this.lastShotFrame = frameCount; playShootingSound(); } }
  takeDamage() { this.lives--; }
  gainLife() { if (this.lives < this.maxLives) this.lives++; }
  isCollidingWith(other) { return dist(this.x, this.y, other.x, other.y) < this.w / 2 + other.w / 2; }
}
class LifeGummy {
    constructor() { this.x = random(PLAYABLE_OFFSET_X + 20, PLAYABLE_OFFSET_X + PLAYABLE_WIDTH - 20); this.y = -50; this.w = 40; this.h = 50; this.speed = 2.5; this.hue = random(360); this.hits = difficulty === 'hard' ? 5 : 3; this.toBeRemoved = false; this.lastHitTime = 0; this.animFrame = 0; }
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
class Enemy {
  constructor() {
    this.x = random(PLAYABLE_OFFSET_X + 20, PLAYABLE_OFFSET_X + PLAYABLE_WIDTH - 20);
    this.y = -50;
    this.w = 40;
    this.h = 70;
    this.speed = random(1.5, 4);
    this.hue = random(360);
    this.transformTime = 0;
    this.slogan = "";
    this.hippieSolidDuration = 7500;
    this.hippieFadeDuration = 2500;
    this.origin = null; // 'suit' or 'cop'
  }
  update(target) {
    if (this.state === 'angry_suit') {
      this.x += this.chaseVector.x * this.speed;
      this.y += this.chaseVector.y * this.speed;
    } else if (this.state === 'hippie') {
      this.y += 0.5;
      this.hue = (this.hue + 1) % 360;
    } else {
      this.y += this.speed;
    }
  }
  isHitBy(vile) { return dist(this.x, this.y, vile.x, vile.y) < this.w / 2 + vile.r; }
  isCollidingWith(other) { return dist(this.x, this.y, other.x, other.y) < this.w / 2 + other.w / 2; }
  transform() {
    this.state = 'hippie';
    this.transformTime = millis();
    this.slogan = SLOGANS[floor(this.hue / (360 / SLOGANS.length))];
    if (!this.origin) {
      if (this instanceof Suit) this.origin = 'suit';
      else if (this instanceof Cop) this.origin = 'cop';
    }
  }
  shouldBeRemoved() { if (this.state !== 'hippie') return false; return millis() - this.transformTime > this.hippieSolidDuration + this.hippieFadeDuration; }
  isOffscreen() { return this.y > VIRTUAL_HEIGHT + this.h || this.y < -this.h || this.x < PLAYABLE_OFFSET_X - this.w || this.x > PLAYABLE_OFFSET_X + PLAYABLE_WIDTH + this.w; }
  displayAsHippie() {
    let timeSinceTransform = millis() - this.transformTime;
    let alpha = 255;
    if (timeSinceTransform > this.hippieSolidDuration) {
      alpha = map(timeSinceTransform, this.hippieSolidDuration, this.hippieSolidDuration + this.hippieFadeDuration, 255, 0);
    }
    push(); colorMode(HSB, 360, 100, 100, 100); fill(this.hue, 90, 90, map(alpha, 0, 255, 0, 100)); rect(this.x, this.y, this.w, this.h, 5); pop();
    stroke(255, alpha); strokeWeight(2); noFill(); ellipse(this.x, this.y - 10, 15); line(this.x, this.y - 17.5, this.x, this.y - 2.5); line(this.x, this.y - 10, this.x - 6, this.y - 4); line(this.x, this.y - 10, this.x + 6, this.y - 4);
    noStroke(); fill(250, 220, 200, alpha); ellipse(this.x, this.y - this.h / 2 - 15, 30);
    stroke(139, 69, 19, alpha); strokeWeight(3); line(this.x - 15, this.y - this.h / 2 - 15, this.x - 20, this.y - this.h / 2 + 5); line(this.x + 15, this.y - this.h / 2 - 15, this.x + 20, this.y - this.h / 2 + 5);
    if (timeSinceTransform < 2500) {
      push(); let bubbleY = this.y - 70; textSize(16); textAlign(CENTER, CENTER); let sloganWidth = textWidth(this.slogan) + 25; noStroke(); fill(255, 255, 255, 200); rect(this.x, bubbleY, sloganWidth, 35, 15); fill(0); text(this.slogan, this.x, bubbleY); pop();
    }
  }
}
class Suit extends Enemy {
  constructor() {
    super();
    this.state = 'suit';
    this.animFrame = 0;
  }
  update() {
    let slow = slowedSuits.has(this) && millis() < slowedSuits.get(this);
    let speedMod = slow ? 0.3 : 1;
    if (this.state === 'angry_suit') {
      this.x += this.chaseVector.x * this.speed * speedMod;
      this.y += this.chaseVector.y * this.speed * speedMod;
    } else if (this.state === 'hippie') {
      this.y += 0.5;
      this.hue = (this.hue + 1) % 360;
    } else {
      this.y += this.speed * speedMod;
    }
    if (slow && millis() >= slowedSuits.get(this)) slowedSuits.delete(this);
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
  revertToAngrySuit(target) {
    this.state = 'angry_suit';
    this.speed = difficulty === 'hard' ? 7 : 5; // Faster in hard mode
    let dx = target.x - this.x;
    let dy = VIRTUAL_HEIGHT;
    let direction = createVector(dx, dy);
    direction.normalize();
    this.chaseVector = direction;
  }
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
    this.hits = 3; // Always 3 hits, even in hard mode
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
    } else if (this.state === 'formercop') {
      // Should never be called, but fallback
      (new FormerCop(this.x, this.y)).display();
    }
    else if (this.state === 'hippie') {
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
  transform() {
    // Replace this cop with a FormerCop in the enemies array
    let idx = enemies.indexOf(this);
    if (idx !== -1) {
      enemies[idx] = new FormerCop(this.x, this.y);
    }
  }
  displayAsCop() { noStroke(); fill(20, 30, 120); rect(this.x, this.x, this.w, this.h, 5); fill(220); ellipse(this.x, this.y - this.h / 2 - 15, 30); fill(20, 30, 120); rect(this.x, this.y - this.h / 2 - 25, 40, 10, 2); rect(this.x, this.y - this.h / 2 - 30, 25, 10, 2); fill(255, 215, 0); ellipse(this.x - 10, this.y - 15, 8, 10); }
}
class Convict extends Enemy {
  constructor(x, y) {
    super();
    this.x = x;
    this.y = y;
    this.state = 'convict';
    this.hits = 3;
    this.animFrame = 0;
    this.target = null;
    this.w = 40;
    this.h = 70;
  }
  update() {
    // Find target: LifeGummy if present, else player
    if (lifeGummies.length > 0) {
      // Chase nearest LifeGummy
      let closest = null;
      let minDist = Infinity;
      for (let lg of lifeGummies) {
        let d = dist(this.x, this.y, lg.x, lg.y);
        if (d < minDist) { minDist = d; closest = lg; }
      }
      this.target = closest;
    } else {
      this.target = player;
    }
    // Move toward target
    if (this.target) {
      let dx = this.target.x - this.x;
      let dy = this.target.y - this.y;
      let mag = sqrt(dx*dx + dy*dy);
      let speed = difficulty === 'hard' ? 6 : 4.5;
      if (mag > 0) {
        this.x += (dx / mag) * speed;
        this.y += (dy / mag) * speed;
      }
    }
    // Animate
    if (frameCount % 10 === 0) {
      this.animFrame = (this.animFrame + 1) % convictFrames.length;
    }
  }
  display() {
    if (convictFrames[this.animFrame]) {
      image(convictFrames[this.animFrame], this.x - this.w/2, this.y - this.h/2, this.w, this.h);
    } else {
      // fallback: orange rectangle
      fill(255, 120, 0);
      rect(this.x, this.y, this.w, this.h, 5);
    }
  }
  takeHit() { this.hits--; if (this.hits <= 0) this.toBeRemoved = true; }
  isOffscreen() { return this.y > VIRTUAL_HEIGHT + this.h || this.y < -this.h || this.x < PLAYABLE_OFFSET_X - this.w || this.x > PLAYABLE_OFFSET_X + PLAYABLE_WIDTH + this.w; }
}
class FormerCop extends Enemy {
  constructor(x, y) {
    super();
    this.x = x;
    this.y = y;
    this.state = 'formercop';
    this.animFrame = 0;
    this.slogan = random(FORMER_COP_SLOGANS);
    this.w = 40;
    this.h = 70;
    this.transformTime = millis(); // Track when it was created
  }
  update() {
    this.y += 0.5;
    if (frameCount % 10 === 0) {
      this.animFrame = (this.animFrame + 1) % formerCopFrames.length;
    }
  }
  display() {
    if (formerCopFrames[this.animFrame]) {
      image(formerCopFrames[this.animFrame], this.x - this.w/2, this.y - this.h/2, this.w, this.h);
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
      // fallback: blue rectangle
      fill(80, 180, 255);
      rect(this.x, this.y, this.w, this.h, 5);
    }
  }
  takeHit() { this.toBeRemoved = true; }
  isOffscreen() { return this.y > VIRTUAL_HEIGHT + this.h || this.y < -this.h || this.x < PLAYABLE_OFFSET_X - this.w || this.x > PLAYABLE_OFFSET_X + PLAYABLE_WIDTH + this.w; }
}
