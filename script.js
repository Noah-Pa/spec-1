/* ============================================================
    FULL JS — FINAL VERSION (Responsive + Custom Cursor)
    Team: Maciawa
    Features:
    - Responsive Scaling based on 1920x1080 reference
    - Dark Blue Death Color (#05288C)
    - Ambient Sound Toggle
    - Signature: Lerp from Blue #0033FF to Red when chaotic
    - Custom Cursor:
        + Normal: asset/cursor.svg
        + Hover/Pointer: asset/pointer.svg
        + Warning (click shark): asset/cursorWarning.svg
============================================================ */

// [GLOBAL CONFIG] Base dimensions used as the design reference
const BASE_W = 1920;
const BASE_H = 1080;
let scaleRatio = 1; // [CORE VARIABLE] Global scale factor used to resize all elements dynamically

// Audio & UI variables
let sndAmbient, sndChaos, sndClick, sndCut;
let musicIcons = {};
let isMuted = true; // Default state: Muted

// Size multipliers to adjust asset sizes relative to the screen scale
const BODY_SIZE_MULT = 2.0;
const FIN_SIZE_MULT = 0.35;

/* -----------------------------
    CURSOR SYSTEM (STATE MACHINE)
    Logic: Determines which cursor to display based on hover/click state
------------------------------ */
const CURSOR_ASSETS = {
  normal: "asset/cursor.svg",       // IDLE state
  pointer: "asset/pointer.svg",     // INTERACTIVE state (Hovering UI/Shark)
  warn: "asset/cursorWarning.svg",  // WARNING state (Chaos mode active)
};

let canvasEl = null;
let cursorMode = "normal";
let warnCursorTimer = 0; // Countdown timer for the warning cursor
const CURSOR_HOTSPOT = { x: 16, y: 16 }; // Offset to align the cursor tip

// [RENDER LOGIC] Applies CSS cursor style to the canvas element
function applyCanvasCursor(mode) {
  if (!canvasEl) return;
  if (cursorMode === mode) return; // Optimization: Avoid DOM updates if state hasn't changed
  cursorMode = mode;

  const url = CURSOR_ASSETS[mode] || CURSOR_ASSETS.normal;
  canvasEl.style.cursor = `url("${url}") ${CURSOR_HOTSPOT.x} ${CURSOR_HOTSPOT.y}, auto`;
}

// [HITBOX LOGIC] Check if mouse is within the Mute Button area (Bottom-Right)
function isHoverMuteArea() {
  return mouseX > width - 120 && mouseY > height - 120;
}

// [INTERACTION LOGIC] Iterate through sharks to check for mouse hover
function isHoverLiveShark() {
  // Loop backwards is safer when we might modify the array, though here we just check
  for (let i = sharks.length - 1; i >= 0; i--) {
    const s = sharks[i];
    // Only detect hover if the shark is still alive
    if (!s.isDead && s.isMouseOver()) return true;
  }
  return false;
}

/* -----------------------------
    COLOR SYSTEM (INTERPOLATION)
    Manages the smooth transition between Blue (Normal) and Red (Chaos)
------------------------------ */
const PALETTE_NORMAL = { fg: "#FFFFFF", blue: "#0022FF" };
const PALETTE_CHAOS = { fg: "#FF0000", blue: "#880000" };
let CUR_PALETTE = { fg: 0, blue: 0 }; // Holds the currently calculated color

// Reserved UI area to prevent objects from spawning under the buttons
let RESERVED = { x: 0, y: 0, w: 0, h: 0 };
const OVERFLOW = 100; // Buffer zone: Spawn objects slightly outside the viewport

/* -----------------------------
    RUNTIME GAME STATE
------------------------------ */
let killedCount = 0;        // Counter for user actions
let chaosFactor = 0.0;      // [IMPORTANT] Normalized value (0.0 - 1.0) driving the visual/audio intensity
let timeSinceLastKill = 0.0; // Timer to track "healing" phase
let domBtnMore;

/* -----------------------------
    TEXT CLUSTERS CONFIG
    Data structure defining the circular text elements
------------------------------ */
const CLUSTERS = [
  { text: "If  the  ocean  dies.  we  die", isTitle: true, spacingPct: 30, fontSize: 68, diameter: 570.06 },
  { text: "Cut  loose, thrown  overboard,  left  to  sink  in  silence.", isTitle: false, spacingPct: 65, fontSize: 32, diameter: 663 },
  { text: "Sharks are tossed back alive, left to sink and bleed until they stop moving.", isTitle: false, spacingPct: 27, fontSize: 19, diameter: 371 },
  { text: "Every missing fin leaves a silent ring in the sea.", isTitle: false, spacingPct: 17, fontSize: 26, diameter: 313 },
  { text: "Each vanished shark is one less heartbeat in the water.", isTitle: false, spacingPct: 26, fontSize: 32, diameter: 443 },
  { text: "Say no to shark fin", isTitle: true, spacingPct: 40, fontSize: 36, diameter: 243 },
];

const SIGNATURE_CFG = {
  text: "Phan Ngoc Ha - s4042007    maciawa team",
  isTitle: true,
  spacingPct: 30,
  fontSize: 19,
  color: "#0033FF",
  isSignature: true,
  diameter: 230
};

// [MEMORY MANAGEMENT] Object Pools to store active game entities
let systems = [];         // Circular text systems
let blobs = [];           // Background particles
let sharks = [];          // Shark entities
let floatingEffects = []; // Severed fin particles
let sharkAssets = {};
let hammerAssets = {};
let sharkBodyDead = null; // Processed image data for dead sharks
let hammerBodyDead = null;

// Asset paths configuration
const SHARK_FILES_CONFIG = {
  body: "shark asset/shark/sharkbody.svg",
  fin1: "shark asset/shark/sharkfin1.svg",
  fin2: "shark asset/shark/sharkfin2.svg",
  fin3: "shark asset/shark/sharkfin3.svg",
  fin4: "shark asset/shark/sharkfin4.svg",
  tail: "shark asset/shark/sharktail.svg"
};

const HAMMER_FILES_CONFIG = {
  body: "shark asset/hamhead/hamhead-body.svg",
  fin1: "shark asset/hamhead/hamhead-fin1.svg",
  fin2: "shark asset/hamhead/hamhead-fin2.svg",
  fin3: "shark asset/hamhead/hamhead-fin3.svg",
  fin4: "shark asset/hamhead/hamhead-fin4.svg",
  tail: "shark asset/hamhead/hamhead-tail.svg"
};

/* ============================================================
    p5 LIFECYCLE METHODS
============================================================ */

function preload() {
  // [ASYNCHRONOUS LOAD] Ensure all assets are ready before the game starts
  for (const [key, path] of Object.entries(SHARK_FILES_CONFIG)) {
    sharkAssets[key] = loadImage(path, () => { }, () => console.error("ERR LOAD SHARK: " + path));
  }
  for (const [key, path] of Object.entries(HAMMER_FILES_CONFIG)) {
    hammerAssets[key] = loadImage(path, () => { }, () => console.error("ERR LOAD HAMMER: " + path));
  }
  musicIcons.on = loadImage("asset/musicon.svg");
  musicIcons.off = loadImage("asset/musicoff.svg");
  
  // Load Sound Assets
  sndAmbient = loadSound('sound/ambient-music-with-noise.wav');
  sndChaos = loadSound('sound/chaos.wav');
  sndClick = loadSound('sound/click.wav');
  sndCut = loadSound('sound/cut.wav');
}

function setup() {
  // Create a canvas that fills the browser window
  const c = createCanvas(windowWidth, windowHeight);
  c.parent("p5-holder");

  canvasEl = c.elt;
  applyCanvasCursor("normal");

  calculateLayoutMetrics(); // Perform initial responsive calculation

  frameRate(30); // [PERFORMANCE] Cap FPS at 30 to save resources
  textAlign(CENTER, CENTER);
  angleMode(RADIANS);
  imageMode(CENTER);

  CUR_PALETTE.fg = color(PALETTE_NORMAL.fg);
  CUR_PALETTE.blue = color(PALETTE_NORMAL.blue);

  // [PIXEL PROCESSING] Create "Dead" color versions of shark bodies programmatically
  if (sharkAssets["body"]) sharkBodyDead = makeImageDeadColor(sharkAssets["body"]);
  if (hammerAssets["body"]) hammerBodyDead = makeImageDeadColor(hammerAssets["body"]);

  if (sndAmbient) sndAmbient.setVolume(0);
  if (sndChaos) sndChaos.setVolume(0);

  domBtnMore = document.getElementById("btnMore");

  // Populate the scene with initial objects
  buildScene();
}

function windowResized() {
  // [EVENT LISTENER] Triggered when browser is resized
  resizeCanvas(windowWidth, windowHeight);
  calculateLayoutMetrics();
  buildScene(); // Re-calculate positions for the new size
}

// [ALGORITHM] Responsive Scaling Logic
function calculateLayoutMetrics() {
  // Determine the scale based on the smallest dimension ratio
  let rawScale = min(width / BASE_W, height / BASE_H);
  scaleRatio = max(rawScale, 0.45); // Clamp: Don't let it get smaller than 45%

  // Reserve 25% of the screen corner for UI buttons
  let reservedW = width * 0.25;
  let reservedH = height * 0.25;

  // Mobile adjustment: Fixed pixel size for small screens
  if (width < 600) {
    reservedW = 120;
    reservedH = 120;
  }

  RESERVED = {
    x: width - reservedW,
    y: height - reservedH,
    w: reservedW,
    h: reservedH
  };
}

function mousePressed() {
  userStartAudio(); // Initialize audio context on first click

  const overlay = document.getElementById("overlay");
  if (overlay && !overlay.classList.contains("hidden")) return; // Block input if overlay is active

  // [CHAOS LOGIC] If game is chaotic, show warning cursor anywhere
  if (chaosFactor > 0) {
    warnCursorTimer = 0.35;
    applyCanvasCursor("warn");
  }

  // Mute Button Check
  if (mouseX > width - 100 && mouseY > height - 100) {
    toggleMute();
    return;
  }

  // Play Click SFX (Panned to mouse position)
  if (sndClick && sndClick.isLoaded()) {
    sndClick.pan(map(mouseX, 0, width, -1, 1));
    sndClick.play();
  }

  // [GAMEPLAY LOGIC] Check for Shark hits
  for (let i = sharks.length - 1; i >= 0; i--) {
    const s = sharks[i];
    if (s.isMouseOver() && !s.isDead) {
      playGenerativeCut();
      s.cutFins(); // Trigger the "Cut" action on the specific shark object
      break;
    }
  }
}


function toggleMute() {
  isMuted = !isMuted;
  if (!isMuted) {
    if (!sndAmbient.isPlaying()) {
      sndAmbient.loop();
      sndChaos.loop();
    }
    sndAmbient.setVolume(0.4);
  } else {
    if (sndAmbient) sndAmbient.setVolume(0);
    if (sndChaos) sndChaos.setVolume(0);
  }
}

function playGenerativeCut() {
  if (sndCut && sndCut.isLoaded()) {
    sndCut.rate(random(0.8, 1.4)); // Randomize pitch for variety
    sndCut.pan(map(mouseX, 0, width, -1, 1)); // Stereo panning
    sndCut.play();
  }
}

/* ============================================================
    MAIN DRAW LOOP (RENDERING & LOGIC)
    Runs 30 times per second
============================================================ */

function draw() {
  background(0); // Clear screen
  const dt = min(0.05, (deltaTime || 33.33) / 1000); // Calculate Delta Time for smooth animation

  warnCursorTimer = max(0, warnCursorTimer - dt);

  // [COMPLEX LOGIC] Calculate 'Chaos Factor'
  // Drives the environment redness and sound intensity based on player actions
  timeSinceLastKill += dt;
  // Map: 4-7 kills converts to 0.0-1.0 chaos intensity
  let rawChaos = constrain(map(killedCount, 4, 7, 0, 1), 0, 1);
  
  // Healing Mechanic: Chaos reduces over time if no sharks are killed
  let healingMult = 1.0;
  if (killedCount >= 5) {
    if (timeSinceLastKill > 9.0) { killedCount = 0; healingMult = 0; }
    else if (timeSinceLastKill > 6.0) healingMult = map(timeSinceLastKill, 6, 9, 1, 0);
  }
  chaosFactor = rawChaos * healingMult; // Final Chaos Value

  // [AUDIO MIXING] Dynamic volume blending based on chaosFactor
  if (!isMuted && sndAmbient && sndAmbient.isLoaded()) {
    sndAmbient.setVolume(map(chaosFactor, 0, 1, 0.4, 0)); // Decrease Ambient
    sndChaos.setVolume(map(chaosFactor, 0, 1, 0, 0.7));   // Increase Noise
  } else if (isMuted) {
    sndAmbient.setVolume(0);
    sndChaos.setVolume(0);
  }

  // [VISUAL INTERPOLATION] Smoothly transition global colors (Blue <-> Red)
  CUR_PALETTE.fg = lerpColor(color(PALETTE_NORMAL.fg), color(PALETTE_CHAOS.fg), chaosFactor);
  CUR_PALETTE.blue = lerpColor(color(PALETTE_NORMAL.blue), color(PALETTE_CHAOS.blue), chaosFactor);

  if (domBtnMore) {
    const cssColor = CUR_PALETTE.blue.toString();
    domBtnMore.style.color = domBtnMore.matches(":hover") ? "#FFFFFF" : cssColor;
    domBtnMore.style.borderColor = domBtnMore.matches(":hover") ? "#FFFFFF" : cssColor;
  }

  // [ENTITY MANAGEMENT] Blobs (Background Particles)
  // More chaos = More blobs
  let targetBlobs = map(chaosFactor, 0, 1, 15, 75);
  if (blobs.length < targetBlobs) blobs.push(new BlobSwimmer(blobs.length));
  else if (blobs.length > targetBlobs && blobs.length > 15) blobs.pop();
  for (const b of blobs) { b.update(dt); b.draw(); }

  // [ENTITY MANAGEMENT] Sharks
  // Limit max sharks based on kill count (Simulate extinction)
  let maxSharks = (killedCount >= 7) ? 0 : (killedCount >= 6 ? 2 : (killedCount >= 5 ? 3 : 6));
  for (let i = sharks.length - 1; i >= 0; i--) {
    const s = sharks[i];
    s.update(dt);
    s.draw();
    if (s.readyToRemove) { sharks.splice(i, 1); continue; }
    if (!s.isDead) {
      // Collision Detection: Sharks eat blobs
      const mouthX = s.x + (s.dir > 0 ? 120 : -120) * s.scale * BODY_SIZE_MULT * scaleRatio;
      for (const b of blobs) {
        if (dist(mouthX, s.y, b.x, b.y) < 90 * s.scale * BODY_SIZE_MULT * scaleRatio) b.reset(false);
      }
    }
  }

  // Spawning Logic: Randomly add sharks
  if (sharks.length < maxSharks && random() < 0.08) {
    sharks.push(new Shark(0, random() < 0.5 ? "shark" : "hammerhead", true));
  }
  // Initial Spawn: Add 5 sharks immediately at start
  if (sharks.length === 0 && killedCount === 0 && frameCount < 10) {
    for (let i = 0; i < 5; i++) sharks.push(new Shark(i, random() < 0.5 ? "shark" : "hammerhead", false));
  }

  // Render Effects & Text Systems
  for (let i = floatingEffects.length - 1; i >= 0; i--) {
    floatingEffects[i].update(dt);
    floatingEffects[i].draw();
    if (floatingEffects[i].isDone) floatingEffects.splice(i, 1);
  }
  for (const sys of systems) { sys.update(dt); sys.draw(); }

  drawMuteButton();

  // Update Cursor State Machine
  let desired = "normal";
  if (warnCursorTimer > 0) desired = "warn";
  else if (isHoverLiveShark() || isHoverMuteArea()) desired = "pointer";
  applyCanvasCursor(desired);
}

function drawMuteButton() {
  push();
  let icon = isMuted ? musicIcons.off : musicIcons.on;
  let posX = width - 70;
  let posY = height - 70;

  let isHover = (mouseX > width - 120 && mouseY > height - 120);
  let s = (isHover ? 60 : 50);

  tint(255, 255);
  imageMode(CENTER);
  image(icon, posX, posY, s, s);
  pop();
}

/* ============================================================
    HELPERS & CLASSES
============================================================ */

// [IMAGE PROCESSING] Pixel Manipulation
// Manually iterates through image pixels to shift color channels (RGB)
// Converts the texture to a "dead/bruised" color scheme without loading a new file
function makeImageDeadColor(sourceImg) {
  try {
    const img = sourceImg.get(); // Create a copy
    img.loadPixels();
    // Loop through pixels array: [R, G, B, A, R, G, B, A...]
    for (let i = 0; i < img.pixels.length; i += 4) {
      if (img.pixels[i + 3] > 0) { // If pixel is not transparent
        img.pixels[i] = 5;      // Set Red channel
        img.pixels[i + 1] = 40; // Set Green channel
        img.pixels[i + 2] = 140;// Set Blue channel
      }
    }
    img.updatePixels();
    return img;
  } catch (e) { return sourceImg; }
}



class FloatingFin {
  constructor(originalImg, x, y, rotation, scaleVal, dir, vx, vy) {
    this.x = x; this.y = y; this.rot = rotation; this.baseScale = scaleVal;
    this.dir = dir; this.vx = vx; this.vy = vy; this.img = originalImg;
    this.life = 1.0; this.decay = 0.5; this.currentScaleMult = 1.0; this.isDone = false;
  }
  update(dt) {
    this.life -= this.decay * dt; this.currentScaleMult += 2.0 * dt;
    // Apply physics (gravity & velocity) scaled by ratio
    this.x += this.vx * scaleRatio * dt;
    this.y += (this.vy - 80) * scaleRatio * dt;
    if (this.life <= 0) this.isDone = true;
  }
  draw() {
    if (this.isDone) return;
    push(); translate(this.x, this.y); rotate(-HALF_PI + this.rot);
    if (this.dir > 0) scale(1, -1);
    scale(this.baseScale * this.currentScaleMult * FIN_SIZE_MULT * scaleRatio);
    tint(255, this.life * 255); image(this.img, 0, 0); pop();
  }
}

class Shark {
  constructor(index, type, spawnOutside) {
    this.type = type; this.setupParts();
    this.availableFins = ["fin1", "fin2", "fin3", "fin4", "tail"];
    this.removedParts = []; this.isDead = false; this.deathTimer = 1.0; this.deadScale = 1.0; this.readyToRemove = false;
    this.reset(spawnOutside);
  }
  // Configuration for attaching fin images relative to the body center
  setupParts() {
    this.partsConfig = (this.type === "shark") ?
      { body: { key: "body", x: 0, y: 0 }, fin1: { key: "fin1", x: -50, y: -60 }, fin2: { key: "fin2", x: 45, y: -20 }, fin3: { key: "fin3", x: -30, y: 0 }, fin4: { key: "fin4", x: 27, y: 85 }, tail: { key: "tail", x: 30, y: 165 } } :
      { body: { key: "body", x: 0, y: 0 }, fin1: { key: "fin1", x: -30, y: -10 }, fin2: { key: "fin2", x: 80, y: -35 }, fin3: { key: "fin3", x: 9, y: 105 }, fin4: { key: "fin4", x: 20, y: 140 }, tail: { key: "tail", x: 10, y: 168 } };
  }
  reset(spawnOutside) {
    this.scale = random(0.8, 1.2);
    this.w = 450 * this.scale * BODY_SIZE_MULT * scaleRatio;
    this.y = random(height * 0.15, height * 0.85);
    this.dir = random() < 0.5 ? -1 : 1;
    this.baseSpeed = random(80, 130) * this.dir * scaleRatio;
    this.currentSmoothSpeed = this.baseSpeed;

    let boundary = OVERFLOW * scaleRatio;
    this.x = !spawnOutside ? random(0, width) : (this.dir > 0 ? -boundary - this.w : width + boundary + this.w);
    this.phase = random(TWO_PI);
  }
  isMouseOver() { return dist(mouseX, mouseY, this.x, this.y) < (this.w * 0.4); }
  
  // Logic to detach fins and spawn particles
  cutFins() {
    if (this.isDead) return;
    timeSinceLastKill = 0;
    const dropCount = floor(random(2, 5));
    const assets = (this.type === "shark") ? sharkAssets : hammerAssets;
    for (let i = 0; i < dropCount && this.availableFins.length > 0; i++) {
      const rIdx = floor(random(this.availableFins.length));
      const pName = this.availableFins.splice(rIdx, 1)[0];
      this.removedParts.push(pName); // Track removed part to stop drawing it
      if (assets[pName]) floatingEffects.push(new FloatingFin(assets[pName], this.x, this.y, 0, this.scale, this.dir, random(-50, 50), random(-20, 20)));
    }
    if (this.availableFins.length === 0) { this.isDead = true; killedCount++; }
  }
  update(dt) {
    if (this.isDead) {
      this.deathTimer -= dt * 0.5; this.deadScale -= dt * 0.8;
      if (this.deathTimer <= 0) this.readyToRemove = true; return;
    }
    // Smoothly interpolate speed (Slow down when hovered)
    this.currentSmoothSpeed = lerp(this.currentSmoothSpeed, this.isMouseOver() ? this.baseSpeed * 0.1 : this.baseSpeed, 0.05);
    
    // [OSCILLATION] Use Sine Wave to create organic swimming motion
    // y = sin(time) creates smooth up/down movement
    this.x += (this.currentSmoothSpeed + sin(this.phase * 1.5) * 1.2 * scaleRatio) * dt;
    this.phase += dt;
    
    if (abs(this.x) > width + (1500 * scaleRatio)) this.readyToRemove = true;
  }
  draw() {
    // Apply transformations (Translate, Rotate, Scale)
    push(); translate(this.x, this.y + sin(this.phase * 2) * 3 * scaleRatio); rotate(-HALF_PI + sin(this.phase) * 0.03);
    if (this.dir > 0) scale(1, -1); // Flip image if swimming left

    let finalScale = this.scale * max(0, this.deadScale) * scaleRatio;
    scale(finalScale);

    let alpha = this.isDead ? this.deathTimer * 255 : 255;
    let assets = (this.type === "shark") ? sharkAssets : hammerAssets;
    tint(255, alpha);
    let bImg = this.isDead ? (this.type === "shark" ? sharkBodyDead : hammerBodyDead) : assets.body;

    if (bImg) image(bImg, 0, 0, bImg.width * BODY_SIZE_MULT, bImg.height * BODY_SIZE_MULT);
    // Draw only attached fins
    for (let k in this.partsConfig) {
      if (k === "body" || this.removedParts.includes(k)) continue;
      let img = assets[this.partsConfig[k].key];
      if (img) image(img, this.partsConfig[k].x, this.partsConfig[k].y, img.width * FIN_SIZE_MULT, img.height * FIN_SIZE_MULT);
    }
    pop();
  }
}



class BlobSwimmer {
  constructor(index) { this.reset(true); this.noiseOff = random(1000); }
  reset(init = false) {
    let baseH = random(15, 35);
    this.h = baseH * scaleRatio;
    this.w = this.h * random(2, 5);
    this.opacity = random(0.2, 0.9);

    let boundary = OVERFLOW * scaleRatio;
    this.x = init ? random(width) : (random() < 0.5 ? -boundary : width + boundary);
    this.y = init ? random(height) : random(height);
    this.baseSpeedVal = random(100, 180) * scaleRatio;
    this.angle = random(TWO_PI);
  }
  update(dt) {
    // [PERLIN NOISE] Use noise() for organic, unpredictable movement direction
    this.noiseOff += dt * 0.5; this.angle += (noise(this.noiseOff) - 0.5) * 4 * dt;
    let spd = this.baseSpeedVal * (1 + chaosFactor * 8);
    this.x += cos(this.angle) * spd * dt; this.y += sin(this.angle) * spd * dt;

    let boundary = 200 * scaleRatio;
    if (this.x < -boundary || this.x > width + boundary || this.y < -boundary || this.y > height + boundary) this.reset();
  }
  draw() {
    push(); translate(this.x, this.y); rotate(this.angle); noStroke();
    let c = color(CUR_PALETTE.blue); c.setAlpha(this.opacity * 255); fill(c); rect(0, 0, this.w, this.h, this.h / 2); pop();
  }
}

class RippleParticle {
  constructor(maxR, dur, chaos) { this.life = 0; this.dur = dur; this.maxR = maxR; this.chaos = chaos; this.noiseOff = random(1000); }
  update(dt) { this.life += dt / this.dur; this.isDone = this.life >= 1; }
  draw(cx, cy) {
    // Easing function for smooth expansion
    let r = this.maxR * (1 - pow(1 - this.life, 3));
    let alphaBase = map(this.chaos, 0, 1, 150, 30);
    let c = color(CUR_PALETTE.blue);
    c.setAlpha(alphaBase * pow(1 - this.life, 1.5));
    stroke(c); strokeWeight(map(this.life, 0, 1, 3.5, 0.5) * (1 + this.chaos) * scaleRatio); noFill();
    circle(cx, cy, r * 2);
  }
}

class CircleTextSystem {
  constructor(cfg) {
    Object.assign(this, cfg);
    this.tracking = 1 + (cfg.spacingPct / 100);
    this.rot = 0; this.ripples = []; this.spawnTimer = random(3);
    this.r = (cfg.diameter / 2) * scaleRatio;
    this.scaledFontSize = cfg.fontSize * scaleRatio;
    this.spd = (this.isTitle ? 0.1 : 0.14) * (random() < 0.5 ? -1 : 1);
  }
  update(dt) {
    this.rot += this.spd * (1 + chaosFactor * 25) * dt; // Rotational speed increases with chaos
    if (this.isSignature) return;
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.ripples.push(new RippleParticle(this.r * 2, random(3, 6), chaosFactor));
      this.spawnTimer = map(chaosFactor, 0, 1, 5.0, 40.0);
    }
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      this.ripples[i].update(dt);
      if (this.ripples[i].isDone) this.ripples.splice(i, 1);
    }
  }
  draw() {
    push(); translate(this.cx, this.cy);
    for (let r of this.ripples) r.draw(0, 0);

    if (this.isSignature) {
      let sigColor = lerpColor(color(this.color), color(PALETTE_CHAOS.fg), chaosFactor);
      fill(sigColor);
    } else {
      fill(CUR_PALETTE.fg);
    }

    noStroke(); textFont(this.isTitle ? "Notable" : "Atkinson Hyperlegible Mono");
    textSize(this.scaledFontSize);
    drawTextOnCircle(this.text, 0, 0, this.r, this.startAngle + this.rot, this.tracking); pop();
  }
}

function buildScene() {
  systems = [];
  let placed = [];

  // Sort clusters by size to place largest items first (Better packing)
  [...CLUSTERS].sort((a, b) => b.diameter - a.diameter).forEach(cfg => {
    let r = (cfg.diameter / 2) * scaleRatio;
    let pad = (cfg.isTitle ? 90 : 70) * scaleRatio;

    // Algorithm: Random position check (Attempt 2000 times to find a free spot)
    for (let i = 0; i < 2000; i++) {
      let x = random(r, width - r);
      let y = random(r, height - r);

      if (!placed.some(p => dist(x, y, p.cx, p.cy) < r + p.packR + pad) && !circleIntersectsRect(x, y, r + pad, RESERVED)) {
        let entry = { ...cfg, cx: x, cy: y, packR: r, startAngle: random(TWO_PI) };
        placed.push(entry);
        systems.push(new CircleTextSystem(entry));
        break;
      }
    }
  });

  if (systems.length > 0) {
    let p = systems[floor(random(systems.length))];
    systems.push(new CircleTextSystem({ ...SIGNATURE_CFG, cx: p.cx, cy: p.cy, r: (SIGNATURE_CFG.diameter / 2) * scaleRatio, startAngle: random(TWO_PI) }));
  }
}

function circleIntersectsRect(cx, cy, cr, rect) {
  let cX = constrain(cx, rect.x, rect.x + rect.w), cY = constrain(cy, rect.y, rect.y + rect.h);
  return dist(cx, cy, cX, cY) <= cr;
}

// [TRIGONOMETRY] Calculate character positions along a circle
function drawTextOnCircle(str, x, y, r, start, track) {
  let totalW = 0;
  let charW = str.split('').map(c => { let w = max(2, textWidth(c)) * track; totalW += w; return w; });
  let theta = start - (totalW / (2 * r));
  for (let i = 0; i < str.length; i++) {
    // Convert linear width to angular position (theta)
    let angle = theta + (charW[i] / (2 * r));
    push(); translate(cos(angle) * r, sin(angle) * r); rotate(angle + HALF_PI); text(str[i], 0, 0); pop();
    theta += charW[i] / r;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const ov = document.getElementById("overlay"),
    btnM = document.getElementById("btnMore"),
    btnB = document.getElementById("btnBack");
  if (btnM) btnM.onclick = () => ov.classList.remove("hidden");
  if (btnB) btnB.onclick = () => ov.classList.add("hidden");
});