const $ = id => document.getElementById(id);
const wait = ms => new Promise(r => setTimeout(r, ms));
const url = (folder, file) => encodeURIComponent(folder) + "/" + encodeURIComponent(file);
const MUSIC_START_SECONDS = 13;
const MUSIC_END_SECONDS = 50;
const FADE_MS = 800;
const MUSIC_DURATION_MS = (MUSIC_END_SECONDS - MUSIC_START_SECONDS) * 1000;
const SLIDE_MS = (MUSIC_DURATION_MS - FADE_MS) / Math.max(PHOTOS.length, 1);
const music = $("music");
const musicStart = $("musicStart");
music.src = url(MUSIC_FOLDER, MUSIC_FILE);
music.volume = 0.6;

/* ---------- Title letters + confetti ---------- */
const colors = ["#ffc857", "#ff7eb6", "#7fd6ff", "#7ff0c4", "#ffffff"];
let n = 0;
document.querySelectorAll(".word").forEach(w => {
  const text = w.textContent;
  w.textContent = "";
  [...text].forEach(ch => {
    const s = document.createElement("span");
    s.className = "letter";
    s.textContent = ch;
    s.setAttribute("aria-hidden", "true");
    s.style.setProperty("--i", n);
    s.style.setProperty("--c", colors[n % colors.length]);
    w.appendChild(s);
    n++;
  });
});
const confettiCount = matchMedia("(max-width: 640px)").matches ? 30 : 60;
for (let i = 0; i < confettiCount; i++) {
  const d = document.createElement("i");
  d.className = "conf";
  d.style.left = Math.random() * 100 + "%";
  d.style.setProperty("--s", 6 + Math.random() * 8 + "px");
  d.style.setProperty("--c", colors[i % colors.length]);
  d.style.setProperty("--d", 5 + Math.random() * 6 + "s");
  d.style.setProperty("--dl", -Math.random() * 8 + "s");
  d.style.setProperty("--x", Math.random() * 160 - 80 + "px");
  $("confetti").appendChild(d);
}

/* ---------- Slideshow (plays once, then disappears) ---------- */
function loadImg(src) {
  return new Promise(res => {
    const i = new Image();
    i.onload = () => res({ src, width: i.naturalWidth, height: i.naturalHeight });
    i.onerror = () => res(null); // a missing photo is skipped
    i.src = src;
  });
}

async function runSlideshow() {
  const urls = PHOTOS.map(f => url(PHOTO_FOLDER, f));
  if (!urls.length) return;
  const box = $("slideshow");
  box.classList.remove("hidden");
  let cur = $("slideA"), next = $("slideB");
  let pending = loadImg(urls[0]);

  for (let i = 0; i < urls.length; i++) {
    const ok = await pending;
    if (i + 1 < urls.length) pending = loadImg(urls[i + 1]); // preload the next photo
    if (!ok) continue;
    next.src = ok.src;
    $("frame").classList.toggle("portrait", ok.height > ok.width);
    next.classList.add("on");
    cur.classList.remove("on");
    [cur, next] = [next, cur];
    $("barFill").style.width = ((i + 1) / urls.length) * 100 + "%";
    await wait(SLIDE_MS);
  }
  box.classList.add("out");
  await wait(FADE_MS);
  box.classList.add("hidden");
}

/* ---------- Videos (each one appears below the last and plays) ---------- */
async function playVideo(file) {
  const wrap = document.createElement("div");
  wrap.className = "vid";
  const v = document.createElement("video");
  v.controls = true;
  v.playsInline = true;
  v.preload = "auto";
  v.src = url(VIDEO_FOLDER, file);
  wrap.appendChild(v);
  $("videos").appendChild(wrap);
  wrap.scrollIntoView({ behavior: "smooth", block: "center" });

  let failed = false;
  const finished = new Promise(res => {
    v.addEventListener("ended", res, { once: true });
    v.addEventListener("error", () => { failed = true; wrap.remove(); res(); }, { once: true });
  });

  try {
    await v.play(); // with sound
  } catch (e) {
    if (failed) return;
    // Browser wants a tap before it plays sound: show a button
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = "▶ Tap to play";
    wrap.appendChild(b);
    v.addEventListener("play", () => b.remove(), { once: true });
    b.addEventListener("click", () => v.play());
  }
  await finished;
}

async function runVideos() {
  for (const f of VIDEOS) await playVideo(f);
}

async function startMusic() {
  if (music.readyState < 1) {
    await new Promise(resolve => {
      music.addEventListener("loadedmetadata", resolve, { once: true });
      music.addEventListener("error", resolve, { once: true });
    });
  }
  music.currentTime = MUSIC_START_SECONDS;
  await music.play();
}

async function warmFirstPhoto() {
  if (PHOTOS.length) await loadImg(url(PHOTO_FOLDER, PHOTOS[0]));
}

(async function main() {
  await wait(2200); // let the title finish dropping in
  await warmFirstPhoto();
  try {
    await startMusic();
  } catch (e) {
    musicStart.classList.remove("hidden");
    musicStart.textContent = "▶ Tap to start the slideshow with music";
    await new Promise(resolve => musicStart.addEventListener("click", resolve, { once: true }));
    musicStart.classList.add("hidden");
    try {
      await startMusic();
    } catch (retryError) {
      musicStart.classList.remove("hidden");
      musicStart.textContent = "▶ Tap to start the slideshow";
      await new Promise(resolve => musicStart.addEventListener("click", resolve, { once: true }));
      musicStart.classList.add("hidden");
    }
  }

  const stopAtEnd = () => {
    if (music.currentTime >= MUSIC_END_SECONDS) {
      music.pause();
      music.currentTime = MUSIC_END_SECONDS;
      music.removeEventListener("timeupdate", stopAtEnd);
    }
  };
  music.addEventListener("timeupdate", stopAtEnd);
  await runSlideshow();
  await runVideos();
})();
