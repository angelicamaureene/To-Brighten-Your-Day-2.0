/***********************************************************************
 * 3‑Minute “image firework” rotation: 9 bursts × 20 s
 **********************************************************************/
const bursts   = Array.from(document.querySelectorAll(".burst"));
const overlay  = document.getElementById("overlay");
const replayBtn = document.getElementById("replay");

const SHOW_INTERVAL = 20_000;  // 20 seconds
const BURST_COUNT   = bursts.length;     // 9
const SHOW_DURATION = SHOW_INTERVAL * BURST_COUNT;  // 180 s

let current = -1;
let timerId  = null;
let startTime = null;

function showNext() {
  // Hide previous
  if (current >= 0) bursts[current].classList.remove("show");

  current += 1;
  if (current < BURST_COUNT) {
    bursts[current].classList.add("show");
  } else {
    endShow();
  }
}

function startShow() {
  // Reset state
  bursts.forEach(b => b.classList.remove("show"));
  overlay.classList.remove("show");
  current = -1;
  startTime = performance.now();
  showNext();  // show first immediately
  timerId = setInterval(showNext, SHOW_INTERVAL);
}

function endShow() {
  clearInterval(timerId);
  overlay.classList.add("show");
}

/* -------------- Kick everything off -------------- */
startShow();

/* -------------- Replay -------------- */
replayBtn.addEventListener("click", startShow);
