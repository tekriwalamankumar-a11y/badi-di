/* ============================================================
   🔖 BOOKMARK 1 — VIDEO: type your video file name below.
   The video must be in the same folder as index.html.
   ============================================================ */
const VIDEO_FILE = "video1.mp4";

/* ============================================================
   🔖 BOOKMARK 2 — PHOTO: paste your photo link below.
   ============================================================ */
const PHOTO_URL = "photo1.png";

const NEXT_PAGE = "next.html";

const video = document.getElementById("introVideo");
const playBtn = document.getElementById("playBtn");
const videoStage = document.getElementById("videoStage");
const mainStage = document.getElementById("mainStage");
const photo = document.getElementById("photo");
const boxes = document.querySelectorAll("#qualities input");
const water = document.getElementById("water");
const stream = document.getElementById("stream");
const jugLink = document.getElementById("jugLink");
const hint = document.getElementById("hint");

/* ---------- Video stage ---------- */
video.src = VIDEO_FILE;
photo.src = PHOTO_URL;

function showMain() {
  videoStage.classList.add("fadeout");
  setTimeout(() => {
    videoStage.classList.add("hidden");
    mainStage.classList.remove("hidden");
  }, 600);
}

video.addEventListener("ended", showMain);
video.addEventListener("error", showMain); // if the file is missing, don't get stuck

// Sound is always on. If the browser blocks autoplay-with-sound, the video waits
// on a "Tap to begin" button (a tap is what lets the browser play sound).
video.muted = false;
video.play().catch(() => playBtn.classList.remove("hidden"));
playBtn.addEventListener("click", () => {
  video.muted = false;
  video.play();
  playBtn.classList.add("hidden");
});

/* ---------- Sound effects (made with the browser's Web Audio, no files needed) ---------- */
let ac, noiseBuf, fullNodes = [], wasFull = false;

function audio() {
  if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
  if (ac.state === "suspended") ac.resume();
  return ac;
}
function noise(a) {
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}
function tone(a, type, f1, f2, start, len, vol) {
  const o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f1, start);
  if (f2 !== f1) o.frequency.exponentialRampToValueAtTime(f2, start + len);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + len);
  o.connect(g).connect(a.destination);
  o.start(start); o.stop(start + len + 0.03);
}

// Water pouring: a rushing stream plus "glug" bubbles; the pitch rises as the jug fills.
function playPour(fill) {
  const a = audio(), t = a.currentTime, dur = 1;
  const src = a.createBufferSource();
  src.buffer = noise(a); src.loop = true;
  const bp = a.createBiquadFilter();
  bp.type = "bandpass"; bp.Q.value = 1.2;
  const base = 700 + 900 * fill;
  bp.frequency.setValueAtTime(base * 0.8, t);
  bp.frequency.linearRampToValueAtTime(base * 1.3, t + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.3, t + 0.1);
  g.gain.setValueAtTime(0.3, t + 0.8);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp).connect(g).connect(a.destination);
  src.start(t); src.stop(t + dur + 0.05);
  for (let i = 0; i < 7; i++) {
    const st = t + 0.08 + i * 0.12 + Math.random() * 0.04;
    const f = 300 + fill * 500 + Math.random() * 200;
    tone(a, "sine", f, f * 1.8, st, 0.1, 0.16);
  }
}

// Jug full: a rising chime, then a low rumbling hum with a shimmer, for as long as it shakes.
function startFullSound() {
  const a = audio(), now = a.currentTime, t = now + 0.9; // wait for the last pour to finish
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(a, "sine", f, f, t + i * 0.1, 0.9, 0.18));

  const rumble = a.createOscillator();
  rumble.type = "sawtooth"; rumble.frequency.value = 55;
  const lp = a.createBiquadFilter();
  lp.type = "lowpass"; lp.frequency.value = 180;
  const rg = a.createGain();
  rg.gain.setValueAtTime(0, now);
  rg.gain.linearRampToValueAtTime(0.14, t + 0.4);
  const trem = a.createOscillator(), td = a.createGain();
  trem.frequency.value = 14; td.gain.value = 0.09; // fast tremolo = "vibrating"
  trem.connect(td).connect(rg.gain);
  rumble.connect(lp).connect(rg).connect(a.destination);

  const shimmer = a.createOscillator();
  shimmer.type = "sine"; shimmer.frequency.value = 1318.5;
  const sg = a.createGain();
  sg.gain.setValueAtTime(0, now);
  sg.gain.linearRampToValueAtTime(0.035, t + 0.5);
  const vib = a.createOscillator(), vd = a.createGain();
  vib.frequency.value = 6; vd.gain.value = 0.03;
  vib.connect(vd).connect(sg.gain);
  shimmer.connect(sg).connect(a.destination);

  [rumble, trem, shimmer, vib].forEach(o => o.start(now));
  fullNodes = [rumble, trem, shimmer, vib];
  fullNodes.gains = [rg, sg];
}
function stopFullSound() {
  if (!ac || !fullNodes.length) return;
  const t = ac.currentTime;
  (fullNodes.gains || []).forEach(g => { g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, 0.05); });
  const nodes = fullNodes;
  setTimeout(() => nodes.forEach(o => { try { o.stop(); } catch (e) {} }), 400);
  fullNodes = [];
}

// Explosion: a low thump plus a burst of noise.
function playBoom() {
  const a = audio(), t = a.currentTime;
  tone(a, "sine", 140, 30, t, 0.6, 0.6);
  const src = a.createBufferSource();
  src.buffer = noise(a);
  const lp = a.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(4000, t);
  lp.frequency.exponentialRampToValueAtTime(200, t + 0.7);
  const g = a.createGain();
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
  src.connect(lp).connect(g).connect(a.destination);
  src.start(t); src.stop(t + 0.85);
}

/* ---------- Jug ---------- */
const TOP = 20, BOTTOM = 245, RANGE = BOTTOM - TOP; // matches the SVG jug shape
let exploded = false;

function updateJug() {
  const checked = [...boxes].filter(b => b.checked).length;
  const fill = checked / boxes.length;
  const surface = BOTTOM - RANGE * fill; // y of the water surface

  water.style.transform = `translateY(${RANGE * (1 - fill)}px)`;

  // pour animation: a stream from above the jug down to the surface
  stream.setAttribute("height", surface + 75);
  stream.classList.remove("pouring");
  void stream.getBoundingClientRect(); // restart animation
  if (checked > 0) stream.classList.add("pouring");

  const full = checked === boxes.length;
  jugLink.classList.toggle("full", full);
  if (full && !wasFull) startFullSound();
  if (!full && wasFull) stopFullSound();
  wasFull = full;
  hint.textContent = full ? "Now tap the jug!" : "Tick every box to fill the jug";
}
boxes.forEach(b => b.addEventListener("change", () => {
  updateJug();
  if (b.checked) playPour([...boxes].filter(x => x.checked).length / boxes.length);
}));

/* ---------- Explosion, then go to next page ---------- */
function explode() {
  const rect = jugLink.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const colors = ["#7fd6ff", "#1c7fd6", "#ffc857", "#ffffff"];

  for (let i = 0; i < 48; i++) {
    const p = document.createElement("div");
    const angle = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * 260;
    p.className = "particle";
    p.style.left = cx + "px";
    p.style.top = cy + "px";
    p.style.background = colors[i % colors.length];
    p.style.setProperty("--dx", Math.cos(angle) * dist + "px");
    p.style.setProperty("--dy", Math.sin(angle) * dist + "px");
    document.body.appendChild(p);
  }
}

jugLink.addEventListener("click", (e) => {
  e.preventDefault();
  if (!jugLink.classList.contains("full")) {
    jugLink.classList.remove("nudge");
    void jugLink.offsetWidth;
    jugLink.classList.add("nudge");
    return;
  }
  if (exploded) return;
  exploded = true;
  stopFullSound();
  playBoom();
  jugLink.classList.add("boom");
  explode();
  setTimeout(() => { window.location.href = NEXT_PAGE; }, 1100);
});
