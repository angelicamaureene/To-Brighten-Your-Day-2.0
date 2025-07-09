/***********************************************************************
 *  Firework‑love show controller
 **********************************************************************/

/* ---------------- Fireworks canvas ---------------- */
const canvas = document.getElementById("fireCanvas");
const ctx    = canvas.getContext("2d");

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

const TWO_PI = Math.PI * 2;
function rand(min, max) { return Math.random() * (max - min) + min; }
function hsvToRgb(h, s, v) {
  let f = (n, k = (n + h / 60) % 6) =>
    v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return `rgb(${[f(5), f(3), f(1)].map(x=>Math.floor(x*255)).join(",")})`;
}

class Particle {
  constructor(x, y, angle, speed, hue) {
    this.x = x; this.y = y;
    this.vx = Math.cos(angle)*speed;
    this.vy = Math.sin(angle)*speed;
    this.life = 0;
    this.hue = hue;
    this.opacity = 1;
  }
  update() {
    this.life++;
    this.vy += 0.02;       // gravity
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.x += this.vx;
    this.y += this.vy;
    this.opacity = Math.max(0, 1 - this.life/80);
  }
  draw() {
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = hsvToRgb(this.hue, 1, 1);
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2, 0, TWO_PI);
    ctx.fill();
  }
  dead() { return this.opacity <= 0.02; }
}

class Firework {
  constructor() {
    this.x = rand(canvas.width*0.2, canvas.width*0.8);
    this.y = canvas.height;
    this.targetY = rand(canvas.height*0.2, canvas.height*0.45);
    this.hue = rand(0, 360);
    this.spark = true;
    this.particles = [];
  }
  update() {
    if (this.spark) {
      this.y -= 4;
      if (this.y <= this.targetY) {
        for (let i=0;i<60;i++){
          const angle = rand(0,TWO_PI);
          const speed = rand(1,4);
          this.particles.push(
            new Particle(this.x,this.y,angle,speed,this.hue)
          );
        }
        this.spark = false;
      } else {
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#fff";
        ctx.fillRect(this.x,this.y,2,2);
      }
    }
    this.particles.forEach(p=>{p.update();p.draw();});
    this.particles = this.particles.filter(p=>!p.dead());
  }
  dead() { return !this.spark && this.particles.length===0; }
}

let fireworks = [];
let lastLaunch = 0;
const LAUNCH_INTERVAL = 200; // ms (random pops)

function animate(t) {
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.globalCompositeOperation = "lighter";

  if (t - lastLaunch > LAUNCH_INTERVAL) {
    fireworks.push(new Firework());
    lastLaunch = t;
  }
  fireworks.forEach(fw=>fw.update());
  fireworks = fireworks.filter(fw=>!fw.dead());

  if (!showOver) requestAnimationFrame(animate);
}

/* ---------------- Timed burst‑images (first 3 min) ---------------- */
const bursts = Array.from(document.querySelectorAll(".burst"));
const IMG_INTERVAL = 20_000;  // 20 s
let burstIndex = -1;

function showNextBurst() {
  if (burstIndex >= 0) bursts[burstIndex].classList.remove("show");
  burstIndex++;
  if (burstIndex < bursts.length) {
    bursts[burstIndex].classList.add("show");
  } else {
    startMessages(); // after 9 bursts switch to text sequence
  }
}

/* ---------------- Bubble‑letter finale ---------------- */
const messages = [
  "My Varada",
  "You are so…",
  "AMAZING",
  "SMART",
  "AWESOME",
  "CLEVER",
  "BREATH TAKING",
  "INTELLIGENT",
  "MAJESTIC",
  "MINDBLOWING",
  "BEAUTIFUL",
  "ABSOLUTELY THE PRETTIEST GIRL IN THE WORLD",
  "THESE FIREWORKS SHINE BRIGHT",
  "BUT YOU…",
  "You my Varada, shine the brightest"
];
const msgBox = document.getElementById("message");
let msgIndex = -1;

function showNextMessage() {
  // hide previous
  msgBox.classList.remove("show");
  setTimeout(()=>{
    msgIndex++;
    if (msgIndex < messages.length) {
      msgBox.textContent = messages[msgIndex];
      msgBox.classList.add("show");
      // random 2‑5 s pause after DISPLAY_TIME
      const DISPLAY_TIME = 2500;
      const pause = rand(2000,5000);
      setTimeout(showNextMessage, DISPLAY_TIME + pause);
    } else {
      endShow();
    }
  }, 300); // brief fade‑out gap
}

function startMessages() {
  clearInterval(burstTimer);
  showNextMessage();
}

/* ---------------- Show control + replay ---------------- */
const overlay   = document.getElementById("overlay");
const replayBtn = document.getElementById("replay");
let burstTimer, showOver = false;

function startShow() {
  // reset state
  showOver = false;
  overlay.classList.remove("show");
  bursts.forEach(b=>b.classList.remove("show"));
  msgBox.classList.remove("show");
  burstIndex = -1;
  msgIndex   = -1;
  fireworks  = [];
  lastLaunch = 0;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // kick things off
  requestAnimationFrame(animate);
  showNextBurst(); // show first immediately
  burstTimer = setInterval(showNextBurst, IMG_INTERVAL);
}

function endShow() {
  showOver = true;
  overlay.classList.add("show");
}

replayBtn.addEventListener("click", startShow);

/* ----------------  GO! ---------------- */
startShow();

