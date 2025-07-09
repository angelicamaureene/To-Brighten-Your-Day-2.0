/********************************************************************
 * 3‑Minute Firework‑SHAPE Image Show
 * – every 20 s one picture is “painted” with spark particles.
 ********************************************************************/

/* -------- CANVAS SETUP -------- */
const canvas = document.getElementById("fireCanvas");
const ctx = canvas.getContext("2d");
function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
addEventListener("resize", resize);
resize();

/* -------- UTILITIES -------- */
const TWO_PI = Math.PI * 2;
const rand   = (a, b) => Math.random() * (b - a) + a;
const rgbStr = (r, g, b) => `rgb(${r},${g},${b})`;

/* -------- PARTICLE CLASS -------- */
class Particle {
  constructor(x, y, angle, speed, color, life = 80, gravity = true) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.color = color;
    this.life = 0;
    this.lifeSpan = life;
    this.gravity = gravity;
  }
  update() {
    this.life++;
    if (this.gravity) this.vy += 0.02; // gravity
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.x += this.vx;
    this.y += this.vy;
  }
  draw() {
    const alpha = Math.max(0, 1 - this.life / this.lifeSpan);
    if (alpha <= 0) return false;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2, 0, TWO_PI);
    ctx.fill();
    return true;
  }
}

/* -------- RANDOM BACKGROUND FIREWORK -------- */
class Firework {
  constructor() {
    this.x = rand(canvas.width * 0.2, canvas.width * 0.8);
    this.y = canvas.height;
    this.targetY = rand(canvas.height * 0.2, canvas.height * 0.45);
    this.color = `hsl(${rand(0, 360)}deg,100%,60%)`;
    this.spark = true;
    this.parts = [];
  }
  update() {
    if (this.spark) {
      this.y -= 4;
      if (this.y <= this.targetY) {
        for (let i = 0; i < 60; i++) {
          this.parts.push(
            new Particle(
              this.x,
              this.y,
              rand(0, TWO_PI),
              rand(1, 4),
              this.color
            )
          );
        }
        this.spark = false;
      } else {
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#fff";
        ctx.fillRect(this.x, this.y, 2, 2);
      }
    }
    this.parts = this.parts.filter((p) => {
      p.update();
      return p.draw();
    });
  }
  dead() {
    return !this.spark && this.parts.length === 0;
  }
}

/* -------- ARRAYS -------- */
let bgFireworks   = [];  // background pops
let imageParticles = []; // particles forming each picture

/* -------- IMAGE → PARTICLES -------- */
function imageFireworks(imgPath, scale = 0.6) {
  const img = new Image();
  img.src = imgPath;
  img.onload = () => {
    const off = document.createElement("canvas");
    off.width  = img.width;
    off.height = img.height;
    const oCtx = off.getContext("2d");
    oCtx.drawImage(img, 0, 0);

    const { data, width, height } = oCtx.getImageData(0, 0, off.width, off.height);
    const gap = 7;                             // pixel sampling step
    const baseX = canvas.width  / 2 - (width  * scale) / 2;
    const baseY = canvas.height / 2 - (height * scale) / 2;

    for (let y = 0; y < height; y += gap) {
      for (let x = 0; x < width; x += gap) {
        const i = (y * width + x) * 4;
        const alpha = data[i + 3];
        if (alpha > 128) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const px = baseX + x * scale;
          const py = baseY + y * scale;
          imageParticles.push(
            new Particle(
              px,
              py,
              rand(0, TWO_PI),
              rand(0.5, 2),
              rgbStr(r, g, b),
              120,      // life span
              false     // no gravity → the shape lingers
            )
          );
        }
      }
    }
  };
}

/* -------- ANIMATION LOOP -------- */
let lastPop = 0;
let showOver = false;
function animate(t) {
  // Fade previous frame for trails
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "lighter";

  /* background pops */
  if (t - lastPop > 200) {               // pop every 200 ms
    bgFireworks.push(new Firework());
    lastPop = t;
  }
  bgFireworks = bgFireworks.filter((fw) => {
    fw.update();
    return !fw.dead();
  });

  /* picture particles */
  imageParticles = imageParticles.filter((p) => {
    p.update();
    return p.draw();
  });

  if (!showOver) requestAnimationFrame(animate);
}

/* -------- IMAGE SEQUENCE (9 × 20 s) -------- */
const imageSequence = [
  "images/cherry-blossom.png",
  "images/rainbow.png",
  "images/flower-bouquet-1.png",
  "images/moomin.png",
  "images/strawberry.png",
  "images/flower-bouquet-2.png",
  "images/personal-1.jpg",
  "images/personal-2.jpg",
  "images/personal-3.jpg",
];
const IMG_INTERVAL = 20_000;  // 20 seconds
let imgIndex = -1;
let timerId;

function nextImage() {
  imgIndex++;
  if (imgIndex < imageSequence.length) {
    imageFireworks(imageSequence[imgIndex], 0.6);
  } else {
    endShow();
  }
}

/* -------- OVERLAY / REPLAY -------- */
const overlay   = document.getElementById("overlay");
const replayBtn = document.getElementById("replay");
replayBtn.addEventListener("click", startShow);

function endShow() {
  showOver = true;
  clearInterval(timerId);
  overlay.classList.add("show");
}

function startShow() {
  overlay.classList.remove("show");
  showOver       = false;
  imgIndex       = -1;
  bgFireworks    = [];
  imageParticles = [];
  lastPop        = 0;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  requestAnimationFrame(animate);
  nextImage();                          // first immediately
  timerId = setInterval(nextImage, IMG_INTERVAL);
}

/* -------- GO! -------- */
startShow();



