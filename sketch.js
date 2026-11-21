// ===================================================================
// PROCESSING FEE  _  Project B
// Creative Coding Lab F26  ·  Shruthi Swaminathan
//
// A camera with no viewfinder. You take a picture of yourself and you
// cannot see it. To see it you mix the chemistry and develop it, and
// every development damages the negative a little more.
//
// The class this project is built around is NEGATIVE.
// ===================================================================

let neg;              // Negative  _ the hard class
let dials = [];       // Dial      _ the four chemicals
let receipt;          // Receipt   _ only printed if you keep the picture

let cam;
let camReady = false;

// "STANDBY" / "EXPOSED" / "DEVELOPED" / "SAVED"
let stage = "STANDBY";

// ---------- layout, all centred ----------
let SHEET_W = 1200;
let SHEET_H = 900;
let ox = 0;
let oy = 0;
let fit = 1;          // shrinks the whole sheet so it always fits the window

let FRAME_W = 675;
let FRAME_H = 450;
let FRAME_X = 262;    // (1200 - 675) / 2
let FRAME_Y = 110;

let DIAL_Y = 672;
let BTN_Y = 782;
let BTN_W = 170;
let BTN_H = 46;

let flash = 0;
let idle = 0;
let hoverNote = "";

let INK = "#F2F0E8";
let RED = "#DA1C26";
let BLUE = "#5B6BFF";
let GRN = "#95FF30";
let DIM = "#55604C";
let LINE = "#222B1C";


function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("monospace");

  cam = createCapture(VIDEO);
  cam.size(640, 480);
  cam.hide();

  neg = new Negative();
  receipt = new Receipt();

  // four dials in one centred row
  let startX = 330;
  let gap = 180;
  dials.push(new Dial(startX, DIAL_Y, "DEVELOPER", 0.60, 1.70, 1.10,
    "TIME IN THE TANK. LONGER MEANS BRIGHTER AND FLATTER."));
  dials.push(new Dial(startX + gap, DIAL_Y, "TEMPERATURE", 0.50, 1.70, 1.05,
    "WARM CHEMISTRY WORKS HARDER. IT PUSHES CONTRAST UP."));
  dials.push(new Dial(startX + gap * 2, DIAL_Y, "AGITATION", 0, 34, 10,
    "HOW HARD YOU SHAKE THE TANK. MORE SHAKING, MORE GRAIN."));
  dials.push(new Dial(startX + gap * 3, DIAL_Y, "FIXER AGE", 0, 1, 0.45,
    "OLD CHEMISTRY LEAKS. HIGHLIGHTS GO RED, SHADOWS GO BLUE."));
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}


function draw() {
  // the sheet is 1200 x 900. on a shorter window it is scaled down to
  // fit rather than running off the top and bottom.
  fit = min(width / SHEET_W, height / SHEET_H);
  if (fit > 1) {
    fit = 1;
  }
  ox = floor((width - SHEET_W * fit) / 2);
  oy = floor((height - SHEET_H * fit) / 2);

  if (cam.width > 0) {
    camReady = true;
  }

  background(6, 7, 10);

  // ---- THE INVISIBLE CAPTURE -------------------------------------
  // the webcam is painted into the frame and read straight back with
  // get() in the SAME pass, then covered before this frame reaches
  // the screen. the picture is taken. nobody sees it.
  if (flash === 2) {
    image(cam, ox + FRAME_X * fit, oy + FRAME_Y * fit, FRAME_W * fit, FRAME_H * fit);
    neg.expose(get(ox + FRAME_X * fit, oy + FRAME_Y * fit, FRAME_W * fit, FRAME_H * fit));
    stage = "EXPOSED";
  }
  if (flash > 0) {
    flash = flash - 1;
  }

  push();
  translate(ox, oy);
  scale(fit);

  drawHeader();
  drawFrame();
  drawChemistry();
  drawButtons();
  if (stage === "SAVED") {
    receipt.display(262, 848, 675);
  }

  pop();

  drawScanlines();

  idle = idle + 1;
  if (idle > 2400 && stage !== "STANDBY") {
    reset();
  }
}


// ===================================================================
// NEGATIVE
// ===================================================================
class Negative {
  constructor() {
    this.latent = null;   // what the camera caught. never altered.
    this.image = null;    // what came out of the tank this time
    this.wear = 0;        // permanent damage, grows every run
    this.runs = 0;
  }

  expose(shot) {
    this.latent = shot;
    this.image = null;
    this.wear = 0;
    this.runs = 0;
  }

  hasFrame() {
    if (this.latent === null) {
      return false;
    }
    return true;
  }

  develop(dev, temp, agit, age) {
    let out = this.latent.get();    // a COPY. the original survives.
    out.loadPixels();

    let grain = agit + this.wear * 16;
    let soft = 1 - this.wear * 0.17;
    if (soft < 0.35) {
      soft = 0.35;
    }

    for (let i = 0; i < out.pixels.length; i = i + 4) {
      let r = out.pixels[i];
      let g = out.pixels[i + 1];
      let b = out.pixels[i + 2];

      // 1. DEVELOPER _ time in the tank, so exposure
      r = r * dev;
      g = g * dev;
      b = b * dev;

      // 2. TEMPERATURE _ contrast, pushed away from mid grey
      r = (r - 128) * temp * soft + 128;
      g = (g - 128) * temp * soft + 128;
      b = (b - 128) * temp * soft + 128;

      // 3. FIXER AGE _ the chemical leak
      let lum = (r + g + b) / 3;
      let leak = map(lum, 0, 255, -1, 1);
      r = r + leak * 78 * age;
      b = b - leak * 78 * age;
      if (leak > 0) {
        g = g - leak * 38 * age;   // pulling green down turns yellow into red
      }

      // 4. AGITATION _ grain. this is why no two runs match.
      let n = random(-grain, grain);
      r = r + n;
      g = g + n;
      b = b + n;

      out.pixels[i] = r;
      out.pixels[i + 1] = g;
      out.pixels[i + 2] = b;
      out.pixels[i + 3] = 255;
    }

    out.updatePixels();
    this.image = out;
    this.runs = this.runs + 1;
    this.wear = this.wear + 0.20;   // cannot be undone
  }
}


// ===================================================================
// DIAL
// ===================================================================
class Dial {
  constructor(x, y, label, lo, hi, start, note) {
    this.x = x;
    this.y = y;
    this.label = label;
    this.lo = lo;
    this.hi = hi;
    this.value = start;
    this.note = note;
    this.r = 34;
  }

  over() {
    if (dist(sheetX(), sheetY(), this.x, this.y) < this.r + 16) {
      return true;
    }
    return false;
  }

  update() {
    if (mouseIsPressed === true) {
      if (this.over() === true) {
        this.value = map(sheetX(), this.x - 50, this.x + 50, this.lo, this.hi);
        if (this.value < this.lo) {
          this.value = this.lo;
        }
        if (this.value > this.hi) {
          this.value = this.hi;
        }
        idle = 0;
      }
    }
    if (this.over() === true) {
      hoverNote = this.note;
    }
  }

  display() {
    let a = map(this.value, this.lo, this.hi, 140, 400);

    noFill();
    stroke(RED);
    strokeWeight(1.6);
    circle(this.x, this.y, this.r * 2);

    stroke(BLUE);
    strokeWeight(2.6);
    line(this.x, this.y,
      this.x + cos(radians(a)) * (this.r - 7),
      this.y + sin(radians(a)) * (this.r - 7));

    noStroke();
    fill(RED);
    circle(this.x, this.y, 5);

    fill(DIM);
    textAlign(CENTER);
    textSize(10);
    text(this.label, this.x, this.y + this.r + 24);

    fill(GRN);
    textSize(14);
    text(this.readout(), this.x, this.y + this.r + 44);
  }

  readout() {
    return "" + (floor(this.value * 100) / 100);
  }
}


// ===================================================================
// RECEIPT  _ only built if someone keeps the picture
// ===================================================================
class Receipt {
  constructor() {
    this.labels = [];
    this.values = [];
  }

  clear() {
    this.labels = [];
    this.values = [];
  }

  addLine(label, value) {
    this.labels.push(label);
    this.values.push(value);
  }

  // every number here already existed
  build(n, d) {
    this.clear();
    this.addLine("DEV", "" + (floor(d[0].value * 100) / 100));
    this.addLine("TEMP", "" + (floor(d[1].value * 100) / 100));
    this.addLine("AGIT", "" + floor(d[2].value));
    this.addLine("FIXER", "" + (floor(d[3].value * 100) / 100));
    this.addLine("RUNS", "" + n.runs);
    this.addLine("LOST", floor(n.wear * 100) + "%");
  }

  display(x, y, w) {
    noStroke();
    textSize(10);
    fill(RED);
    textAlign(LEFT);
    text("KEPT " + nowStamp(), x, y);
    textAlign(CENTER);
    for (let i = 0; i < this.labels.length; i++) {
      let cx = x + 120 + i * 95;
      fill(DIM);
      text(this.labels[i], cx, y);
      fill(GRN);
      text(this.values[i], cx, y + 16);
    }
    textAlign(LEFT);
  }
}


// ===================================================================
// INTERFACE
// ===================================================================

function drawHeader() {
  noStroke();
  fill(RED);
  textSize(30);
  textAlign(CENTER);
  text("PROCESSING FEE", SHEET_W / 2, 62);
  textAlign(LEFT);

  // camera state as a dot, not a sentence
  noStroke();
  if (camReady === true) {
    fill(GRN);
  } else {
    fill(RED);
  }
  circle(FRAME_X + 8, 70, 7);
}

function drawFrame() {
  noStroke();
  fill(10, 12, 18);
  rect(FRAME_X, FRAME_Y, FRAME_W, FRAME_H);

  if (stage === "DEVELOPED" || stage === "SAVED") {
    if (neg.image !== null) {
      image(neg.image, FRAME_X, FRAME_Y, FRAME_W, FRAME_H);
    }
  } else {
    drawBlindViewfinder();
  }

  // corner brackets only
  stroke(RED);
  strokeWeight(2);
  noFill();
  let L = 20;
  line(FRAME_X, FRAME_Y + L, FRAME_X, FRAME_Y);
  line(FRAME_X, FRAME_Y, FRAME_X + L, FRAME_Y);
  line(FRAME_X + FRAME_W - L, FRAME_Y, FRAME_X + FRAME_W, FRAME_Y);
  line(FRAME_X + FRAME_W, FRAME_Y, FRAME_X + FRAME_W, FRAME_Y + L);
  line(FRAME_X + FRAME_W, FRAME_Y + FRAME_H - L, FRAME_X + FRAME_W, FRAME_Y + FRAME_H);
  line(FRAME_X + FRAME_W, FRAME_Y + FRAME_H, FRAME_X + FRAME_W - L, FRAME_Y + FRAME_H);
  line(FRAME_X + L, FRAME_Y + FRAME_H, FRAME_X, FRAME_Y + FRAME_H);
  line(FRAME_X, FRAME_Y + FRAME_H, FRAME_X, FRAME_Y + FRAME_H - L);
  noStroke();

  // one short line, centred
  fill(DIM);
  textSize(11);
  textAlign(CENTER);
  if (stage === "STANDBY") {
    text("NO VIEWFINDER", SHEET_W / 2, FRAME_Y + FRAME_H + 30);
  }
  if (stage === "EXPOSED") {
    text("LATENT _ NOBODY HAS SEEN IT, INCLUDING YOU", SHEET_W / 2, FRAME_Y + FRAME_H + 30);
  }
  if (stage === "DEVELOPED" || stage === "SAVED") {
    text("DEVELOPED " + neg.runs + "x _ AGAIN IS DIFFERENT AND WORSE", SHEET_W / 2, FRAME_Y + FRAME_H + 30);
  }
  textAlign(LEFT);
}

function drawBlindViewfinder() {
  let cx = FRAME_X + FRAME_W / 2;
  let cy = FRAME_Y + FRAME_H / 2;

  // slow chemical fog
  noStroke();
  for (let i = 0; i < 60; i++) {
    let n = noise(i * 0.7, frameCount * 0.006);
    let m = noise(i * 0.7 + 40, frameCount * 0.006);
    let x = FRAME_X + n * FRAME_W;
    let y = FRAME_Y + m * FRAME_H;
    let s = 30 + noise(i, frameCount * 0.01) * 90;
    if (i % 2 === 0) {
      fill(40, 20, 70, 13);
    } else {
      fill(70, 18, 26, 11);
    }
    circle(x, y, s);
  }

  if (stage === "EXPOSED") {
    noStroke();
    fill(26, 28, 34, 190);
    rect(FRAME_X, FRAME_Y, FRAME_W, FRAME_H);
    fill(DIM);
    textAlign(CENTER);
    textSize(18);
    text("LATENT", cx, cy + 6);
    textAlign(LEFT);
    return;
  }

  stroke(GRN);
  strokeWeight(1.2);
  noFill();
  circle(cx, cy, 48);
  line(cx - 40, cy, cx - 14, cy);
  line(cx + 14, cy, cx + 40, cy);
  line(cx, cy - 40, cx, cy - 14);
  line(cx, cy + 14, cx, cy + 40);
  noStroke();
}

function drawChemistry() {
  hoverNote = "";
  for (let i = 0; i < dials.length; i++) {
    dials[i].update();
    dials[i].display();
  }

  // the teaching line, centred, only when you hover
  textAlign(CENTER);
  textSize(10);
  if (hoverNote === "") {
    fill(LINE);
    text("HOVER A DIAL", SHEET_W / 2, DIAL_Y - 52);
  } else {
    fill(BLUE);
    text(hoverNote, SHEET_W / 2, DIAL_Y - 52);
  }
  textAlign(LEFT);
}

function drawButtons() {
  let gap = 14;
  let total = BTN_W * 4 + gap * 3;
  let x0 = (SHEET_W - total) / 2;

  drawButton(x0, BTN_Y, "SHUTTER", stage === "STANDBY");
  drawButton(x0 + (BTN_W + gap), BTN_Y, "DEVELOP", stage === "EXPOSED" || stage === "DEVELOPED");
  drawButton(x0 + (BTN_W + gap) * 2, BTN_Y, "KEEP IT", stage === "DEVELOPED");
  drawButton(x0 + (BTN_W + gap) * 3, BTN_Y, "NEW FRAME", stage !== "STANDBY");
}

function buttonX(i) {
  let gap = 14;
  let total = BTN_W * 4 + gap * 3;
  let x0 = (SHEET_W - total) / 2;
  return x0 + (BTN_W + gap) * i;
}

function drawButton(x, y, label, on) {
  noFill();
  if (on === true) {
    stroke(RED);
    strokeWeight(1.6);
  } else {
    stroke(LINE);
    strokeWeight(1);
  }
  rect(x, y, BTN_W, BTN_H);
  noStroke();
  if (on === true) {
    fill(RED);
  } else {
    fill(DIM);
  }
  textAlign(CENTER);
  textSize(13);
  text(label, x + BTN_W / 2, y + BTN_H / 2 + 5);
  textAlign(LEFT);
}

function drawScanlines() {
  stroke(0, 0, 0, 70);
  strokeWeight(1);
  for (let y = 0; y < height; y = y + 3) {
    line(0, y, width, y);
  }
  noStroke();
}


// ===================================================================
// INPUT
// ===================================================================

function mousePressed() {
  idle = 0;
  let mx = sheetX();
  let my = sheetY();

  if (inside(mx, my, buttonX(0), BTN_Y, BTN_W, BTN_H) === true) {
    if (stage === "STANDBY") {
      shoot();
    }
  }
  if (inside(mx, my, buttonX(1), BTN_Y, BTN_W, BTN_H) === true) {
    if (stage === "EXPOSED" || stage === "DEVELOPED") {
      runDevelop();
    }
  }
  if (inside(mx, my, buttonX(2), BTN_Y, BTN_W, BTN_H) === true) {
    if (stage === "DEVELOPED") {
      keepIt();
    }
  }
  if (inside(mx, my, buttonX(3), BTN_Y, BTN_W, BTN_H) === true) {
    if (stage !== "STANDBY") {
      reset();
    }
  }
}

function keyPressed() {
  idle = 0;
  if (key === " ") {
    if (stage === "STANDBY") {
      shoot();
    }
  }
  if (key === "r" || key === "R") {
    reset();
  }
}

// the mouse in sheet coordinates, undoing the translate and the scale
function sheetX() {
  return (mouseX - ox) / fit;
}

function sheetY() {
  return (mouseY - oy) / fit;
}

function inside(px, py, x, y, w, h) {
  if (px > x && px < x + w && py > y && py < y + h) {
    return true;
  }
  return false;
}

function shoot() {
  flash = 3;
}

function runDevelop() {
  if (neg.hasFrame() === true) {
    neg.develop(dials[0].value, dials[1].value, dials[2].value, dials[3].value);
    stage = "DEVELOPED";
  }
}

function keepIt() {
  receipt.build(neg, dials);
  stage = "SAVED";
  save(neg.image, "processing-fee-" + floor(random(10000)) + ".png");
}

function reset() {
  stage = "STANDBY";
  neg = new Negative();
  receipt.clear();
  idle = 0;
}

function nowStamp() {
  return hour() + ":" + twoDigits(minute()) + ":" + twoDigits(second());
}

function twoDigits(n) {
  if (n < 10) {
    return "0" + n;
  }
  return "" + n;
