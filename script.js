/***********************************************************************
 * Firework‑Shape Image Show  (script.js)
 * – Every 20 s a new picture is drawn as thousands of spark particles.
 * – Background fireworks pop continuously.
 ***********************************************************************/

/* ----------------------------------------------------------- */
/* 1. Canvas setup                                             */
/* ----------------------------------------------------------- */
const canvas = document.getElementById("fireCanvas");
const ctx    = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

console.log("🔧 script.js loaded");

/* ----------------------------------------------------------- */
/* 2. Helper functions                                         */
/* ----------------------------------------------------------- */
const TWO_PI = Math.PI * 2;
const rand   = (a, b) => Math.random() * (b - a) + a;
const rgbStr = (r, g, b) => `rgb(${r},${g},${b})`;

/* ----------------------------------------------------------- */
/* 3. Particle & background firework classes                   */
/* ----------------------------------------------------------- */
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
    if (this.gravity) this.vy += 0.02;  // simple gravity pull
    this.vx *= 0.98;                    // air drag
    this.vy *= 0.98;
    this.x += this.vx;
    this.y += this.vy;
  }
  draw() {
    const alpha = Math.max(0, 1 - this.life / this.lifeSpan);
    if (alpha <= 0) return false;
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2, 0, TWO_PI);
    ctx.fill();
    return true;
  }
}

class Firework {                       // background random pops
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
        // explode
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
        // draw rising spark
        ctx.globalAlpha = 1;
        ctx.fillStyle   = "#fff";
        ctx.fillRect(this.x, this.y, 2, 2);
      }
    }
    // update exploded particles
    this.parts = this.parts.filter((p) => {
      p.update();
      return p.draw();
    });
  }
  dead() {
    return !this.spark && this.parts.length === 0;
  }
}

/* ----------------------------------------------------------- */
/* 4. Image‑to‑firework helper                                 */
/* ----------------------------------------------------------- */
let imageParticles = [];   // particles that form the current image

function imageFireworks(imgPath, scale = 0.6) {
  const img = new Image();
  img.src = imgPath;
  img.crossOrigin = "anonymous";   // avoids CORS taint if hosted elsewhere
  img.onload = () => {
    const off = document.createElement("canvas");
    off.width  = img.width;
    off.height = img.height;
    const oCtx = off.getContext("2d");
    oCtx.drawImage(img, 0, 0);

    const { data, width, height } = oCtx.getImageData(0, 0, off.width, off.height);
    const gap   = 7;                            // sampling step (smaller = denser)
    const baseX = canvas.width  / 2 - (width  * scale) / 2;
    const baseY = canvas.height / 2 - (height * scale) / 2;

    for (let y = 0; y < height; y += gap) {
      for (let x = 0; x < width; x += gap) {
        const idx = (y * width + x) * 4;
        const alpha = data[idx + 3];
        if (alpha > 128) {
          const r = data[idx], g = data[idx + 1], b = data[idx + 2];
          const px = baseX + x * scale;
          const py = baseY + y * scale;
          imageParticles.push(
            new Particle(
              px,
              py,
              rand(0, TWO_PI),
              rand(0.5, 2),
              rgbStr(r, g, b),
              120,
              false    // no gravity → shape stays in place
            )
          );
        }
      }
    }
    console.log("🖼️  Rendered fireworks for:", imgPath);
  };
  img.onerror = () => console.error("❌ Failed to load image:", imgPath);
}

/* ----------------------------------------------------------- */
/* 5. Animation loop                                           */
/* ----------------------------------------------------------- */
let bgFireworks = [];  // array of background Firework objects
let lastPop     = 0;   // ms since last random firework
let showOver    = false;

function animate(timestamp) {
  // fade previous frame (trail effect)
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "lighter";

  // background pops every 200 ms
  if (timestamp - lastPop > 200) {
    bgFireworks.push(new Firework());
    lastPop = timestamp;
  }
  bgFireworks = bgFireworks.filter((fw) => {
    fw.update();
    return !fw.dead();
  });

  // draw image-shape particles
  imageParticles = imageParticles.filter((p) => {
    p.update();
    return p.draw();
  });

  if (!showOver) requestAnimationFrame(animate);
}

/* ----------------------------------------------------------- */
/* 6. Sequence control (9 pictures × 20 s)                     */
/* ----------------------------------------------------------- */
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

const IMG_INTERVAL = 20_000;   // 20 seconds
let imgIndex = -1;
let intervalId;

function nextImage() {
  imgIndex++;
  if (imgIndex < imageSequence.length) {
    imageFireworks(imageSequence[imgIndex], 0.6);
  } else {
    endShow();
  }
}

/* ----------------------------------------------------------- */
/* 7. Overlay / replay                                         */
/* ----------------------------------------------------------- */
const overlay   = document.getElementById("overlay");
const replayBtn = document.getElementById("replay");
replayBtn.addEventListener("click", startShow);

function endShow() {
  showOver = true;
  clearInterval(intervalId);
  overlay.classList.add("show");
  console.log("🏁 Show finished");
}

function startShow() {
  console.log("▶️ start() triggered, beginning show");

  overlay.classList.remove("show");
  showOver       = false;
  imgIndex       = -1;
  bgFireworks    = [];
  imageParticles = [];
  lastPop        = 0;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  requestAnimationFrame(animate);  // kick off animation loop
  nextImage();                     // show first image immediately
  intervalId = setInterval(nextImage, IMG_INTERVAL);
}

/* ----------------------------------------------------------- */
/* 8. Kick everything off                                      */
/* ----------------------------------------------------------- */
startShow();
