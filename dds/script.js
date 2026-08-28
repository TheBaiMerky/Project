let isReadyToEnter = false;
let inFontaine = false;
let inInazuma = false;
let inLiyue = false;

// ==========================================
// 1. GENSHIN LOADING SCREEN & TELEPORT
// ==========================================
(function runGenshinLoader() {
  const bar = document.getElementById('genshin-bar');
  const doorway = document.getElementById('loader-doorway');
  const tipText = document.getElementById('genshin-tip');
  const startBtn = document.getElementById('tap-start-btn');

  const tips = [
    "Tip: Tap skills in the constellation matrix to inspect technical proficiencies.",
    "Tip: Cross the border section to switch weather between regions.",
    "Tip: Weigh project evidence on the Oratrice Scales of Justice in Fontaine.",
    "Tip: Invoke Delusion Mode in the header to overclock the portfolio theme."
  ];

  const elements = [
    { id: 'elem-anemo', class: 'active-anemo', target: 14 },
    { id: 'elem-geo', class: 'active-geo', target: 28 },
    { id: 'elem-electro', class: 'active-electro', target: 42 },
    { id: 'elem-dendro', class: 'active-dendro', target: 56 },
    { id: 'elem-hydro', class: 'active-hydro', target: 70 },
    { id: 'elem-pyro', class: 'active-pyro', target: 84 },
    { id: 'elem-cryo', class: 'active-cryo', target: 98 }
  ];

  let progress = 0;
  let tipIdx = 0;

  setInterval(() => {
    if (!isReadyToEnter && tipText) {
      tipText.textContent = tips[tipIdx];
      tipIdx = (tipIdx + 1) % tips.length;
    }
  }, 2800);

  function step() {
    progress += Math.random() * 4 + 2;
    if (progress > 100) progress = 100;

    if (bar) bar.style.width = progress + '%';

    elements.forEach(elem => {
      const el = document.getElementById(elem.id);
      if (el && progress >= elem.target && !el.classList.contains(elem.class)) {
        el.classList.add(elem.class);
      }
    });

    if (progress < 100) {
      setTimeout(step, 30);
    } else {
      isReadyToEnter = true;
      if (doorway) doorway.classList.add('ready');
      if (tipText) tipText.textContent = "Server Connection Established.";
      if (startBtn) startBtn.classList.remove('opacity-0');
    }
  }

  setTimeout(step, 200);
})();

function triggerTeleport() {
  const loader = document.getElementById('genshin-loader');
  const flash = document.getElementById('genshin-flash');

  if (!loader || loader.classList.contains('teleport-zoom')) return;

  if (flash) flash.style.opacity = '1';

  setTimeout(() => {
    loader.classList.add('teleport-zoom');
    document.body.classList.remove('loading');

    setTimeout(() => {
      if (flash) flash.style.opacity = '0';
      setTimeout(() => { if (loader) loader.remove(); }, 800);
    }, 300);
  }, 250);
}

// ==========================================
// 2. CANVAS INITIALIZATION & RESIZING
// ==========================================
const snowCanvas = document.getElementById('snow-canvas');
const rainCanvas = document.getElementById('rain-canvas');
const lightningCanvas = document.getElementById('lightning-canvas');
const geoCanvas = document.getElementById('geo-canvas');

const ctxSnow = snowCanvas ? snowCanvas.getContext('2d') : null;
const ctxRain = rainCanvas ? rainCanvas.getContext('2d') : null;
const ctxLightning = lightningCanvas ? lightningCanvas.getContext('2d') : null;
const ctxGeo = geoCanvas ? geoCanvas.getContext('2d') : null;

function resizeCanvases() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (snowCanvas) { snowCanvas.width = w; snowCanvas.height = h; }
  if (rainCanvas) { rainCanvas.width = w; rainCanvas.height = h; }
  if (lightningCanvas) { lightningCanvas.width = w; lightningCanvas.height = h; }
  if (geoCanvas) { geoCanvas.width = w; geoCanvas.height = h; }
}
resizeCanvases();
window.addEventListener('resize', resizeCanvases);

// ==========================================
// 3. WEATHER, LIGHTNING & GEO ROCKS LOOPS
// ==========================================
const snowFlakes = Array.from({ length: 80 }, () => ({
  x: Math.random() * window.innerWidth,
  y: Math.random() * window.innerHeight,
  r: Math.random() * 2.5 + 1,
  speed: Math.random() * 1.5 + 0.5
}));

const rainDrops = Array.from({ length: 90 }, () => ({
  x: Math.random() * window.innerWidth,
  y: Math.random() * window.innerHeight,
  len: Math.random() * 15 + 10,
  speed: Math.random() * 14 + 9
}));

const geoRocks = Array.from({ length: 45 }, () => ({
  x: Math.random() * window.innerWidth,
  y: Math.random() * window.innerHeight,
  size: Math.random() * 8 + 4,
  speedY: Math.random() * 2 + 1,
  speedX: (Math.random() - 0.5) * 0.8,
  rotation: Math.random() * Math.PI * 2,
  rotSpeed: (Math.random() - 0.5) * 0.04
}));

function renderSnow() {
  if (!inFontaine && !inInazuma && !inLiyue && ctxSnow && snowCanvas) {
    ctxSnow.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
    ctxSnow.fillStyle = 'rgba(184, 228, 240, 0.7)';
    ctxSnow.beginPath();
    snowFlakes.forEach(p => {
      ctxSnow.moveTo(p.x, p.y);
      ctxSnow.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      p.y += p.speed;
      p.x += Math.sin(p.y * 0.01) * 0.5;
      if (p.y > snowCanvas.height) { p.y = -10; p.x = Math.random() * snowCanvas.width; }
    });
    ctxSnow.fill();
  } else if (ctxSnow && snowCanvas) {
    ctxSnow.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
  }
  requestAnimationFrame(renderSnow);
}

function renderRain() {
  if (inFontaine && !inInazuma && !inLiyue && ctxRain && rainCanvas) {
    ctxRain.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
    ctxRain.strokeStyle = 'rgba(168, 255, 244, 0.45)';
    ctxRain.lineWidth = 1;
    ctxRain.beginPath();
    rainDrops.forEach(p => {
      ctxRain.moveTo(p.x, p.y);
      ctxRain.lineTo(p.x, p.y + p.len);
      p.y += p.speed;
      if (p.y > rainCanvas.height) { p.y = -20; p.x = Math.random() * rainCanvas.width; }
    });
    ctxRain.stroke();
  } else if (ctxRain && rainCanvas) {
    ctxRain.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
  }
  requestAnimationFrame(renderRain);
}

let currentBolt = null;
function createLightningBolt() {
  if (!lightningCanvas) return null;
  let x = Math.random() * lightningCanvas.width;
  let y = 0;
  const segments = [];
  while (y < lightningCanvas.height * 0.85) {
    const nextX = x + (Math.random() - 0.5) * 80;
    const nextY = y + Math.random() * 45 + 15;
    segments.push({ x1: x, y1: y, x2: nextX, y2: nextY });
    x = nextX;
    y = nextY;
  }
  return { segments, alpha: 1.0 };
}

function renderLightning() {
  if (inInazuma && !inLiyue && ctxLightning && lightningCanvas) {
    ctxLightning.clearRect(0, 0, lightningCanvas.width, lightningCanvas.height);

    if (!currentBolt && Math.random() < 0.03) {
      currentBolt = createLightningBolt();
    }

    if (currentBolt) {
      ctxLightning.lineWidth = 2.5;
      ctxLightning.strokeStyle = `rgba(211, 118, 255, ${currentBolt.alpha})`;
      ctxLightning.shadowBlur = 18;
      ctxLightning.shadowColor = '#D376FF';

      ctxLightning.beginPath();
      currentBolt.segments.forEach(seg => {
        ctxLightning.moveTo(seg.x1, seg.y1);
        ctxLightning.lineTo(seg.x2, seg.y2);
      });
      ctxLightning.stroke();

      currentBolt.alpha -= 0.07;
      if (currentBolt.alpha <= 0) currentBolt = null;
    }
  } else if (ctxLightning && lightningCanvas) {
    ctxLightning.clearRect(0, 0, lightningCanvas.width, lightningCanvas.height);
  }
  requestAnimationFrame(renderLightning);
}

function renderGeo() {
  if (inLiyue && ctxGeo && geoCanvas) {
    ctxGeo.clearRect(0, 0, geoCanvas.width, geoCanvas.height);
    ctxGeo.fillStyle = 'rgba(255, 225, 117, 0.75)';
    ctxGeo.strokeStyle = 'rgba(232, 201, 122, 0.9)';
    ctxGeo.lineWidth = 1;

    geoRocks.forEach(r => {
      ctxGeo.save();
      ctxGeo.translate(r.x, r.y);
      ctxGeo.rotate(r.rotation);

      ctxGeo.beginPath();
      ctxGeo.moveTo(0, -r.size);
      ctxGeo.lineTo(r.size * 0.7, 0);
      ctxGeo.lineTo(0, r.size);
      ctxGeo.lineTo(-r.size * 0.7, 0);
      ctxGeo.closePath();
      ctxGeo.fill();
      ctxGeo.stroke();

      ctxGeo.restore();

      r.y += r.speedY;
      r.x += r.speedX;
      r.rotation += r.rotSpeed;

      if (r.y > geoCanvas.height + 20) {
        r.y = -20;
        r.x = Math.random() * geoCanvas.width;
      }
    });
  } else if (ctxGeo && geoCanvas) {
    ctxGeo.clearRect(0, 0, geoCanvas.width, geoCanvas.height);
  }
  requestAnimationFrame(renderGeo);
}

renderSnow();
renderRain();
renderLightning();
renderGeo();

// ==========================================
// 4. CURSOR, PARTICLES & SPOTLIGHT ENGINE
// ==========================================
const cursorDot = document.getElementById('cursor-dot');
const crossingEl = document.getElementById('crossing');
const regionTag = document.getElementById('region-tag');
const spotlight = document.getElementById('ambient-spotlight');
let lastParticleTime = 0;

document.addEventListener('mousemove', (e) => {
  if (cursorDot) {
    cursorDot.style.left = e.clientX + 'px';
    cursorDot.style.top = e.clientY + 'px';
  }

  if (spotlight) {
    spotlight.style.setProperty('--mouse-x', `${e.clientX}px`);
    spotlight.style.setProperty('--mouse-y', `${e.clientY}px`);
  }

  const now = Date.now();
  if (now - lastParticleTime > 45) {
    lastParticleTime = now;
    const particle = document.createElement('div');

    // Select Particle Effect Based on Active Region
    if (inInazuma) {
      particle.className = 'electro-spark';
    } else if (inLiyue) {
      particle.className = 'geo-shard';
    } else if (inFontaine) {
      particle.className = 'bubble-particle';
      const sz = Math.random() * 6 + 3;
      particle.style.width = sz + 'px';
      particle.style.height = sz + 'px';
    } else {
      particle.className = 'frost-shard'; // Snezhnaya default
    }

    particle.style.left = (e.clientX + (Math.random() * 12 - 6)) + 'px';
    particle.style.top = (e.clientY + (Math.random() * 12 - 6)) + 'px';
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 800);
  }
});

document.addEventListener('click', (e) => {
  const ring = document.createElement('div');
  ring.className = 'burst-ring';
  if (inFontaine) ring.classList.add('fontaine-ring');

  ring.style.left = `${e.clientX}px`;
  ring.style.top = `${e.clientY}px`;

  document.body.appendChild(ring);
  setTimeout(() => ring.remove(), 500);
});

// ==========================================
// 5. SCROLL TRACKER & AVATAR SWAP
// ==========================================
const walkingAvatar = document.getElementById('walking-avatar');
const walkerSprite = document.getElementById('walker-sprite');
const walkerImg = document.getElementById('walker-img');
const walkerLocation = document.getElementById('walker-location');

const tsaritsaPic = 'tsaritsa.png';
const furinaPic = 'furina.png';

window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));

  if (walkingAvatar) walkingAvatar.style.left = scrollPercent + '%';

  if (crossingEl) {
    const rect = crossingEl.getBoundingClientRect();
    inFontaine = rect.top < window.innerHeight * 0.4;
  }

  // Update Region Name
  if (regionTag) {
    if (inLiyue) regionTag.textContent = 'Liyue';
    else if (inInazuma) regionTag.textContent = 'Inazuma';
    else regionTag.textContent = inFontaine ? 'Fontaine' : 'Snezhnaya';
  }

  if (walkerLocation) {
    if (inLiyue) walkerLocation.textContent = 'Liyue Harbor';
    else if (inInazuma) walkerLocation.textContent = 'Plane of Eternity';
    else walkerLocation.textContent = inFontaine ? 'Fontaine Waters' : 'Snezhnaya Frost';
  }

  // Cursor Dot Color Shift Per Region
  if (cursorDot) {
    cursorDot.classList.toggle('in-fontaine', inFontaine && !inInazuma && !inLiyue);
    cursorDot.classList.toggle('in-inazuma', inInazuma);
    cursorDot.classList.toggle('in-liyue', inLiyue);
  }

  // Avatar Portrait Switch
  if (walkerSprite && walkerImg) {
    if (inFontaine && !inInazuma && !inLiyue) {
      if (!walkerSprite.classList.contains('fontaine-avatar')) {
        walkerImg.src = furinaPic;
        walkerImg.alt = "Furina";
        walkerSprite.classList.remove('snezhnaya-avatar');
        walkerSprite.classList.add('fontaine-avatar');
      }
    } else {
      if (!walkerSprite.classList.contains('snezhnaya-avatar')) {
        walkerImg.src = tsaritsaPic;
        walkerImg.alt = "Tsaritsa";
        walkerSprite.classList.remove('fontaine-avatar');
        walkerSprite.classList.add('snezhnaya-avatar');
      }
    }
  }

  // Weather Canvas Visibility Toggles
  if (rainCanvas) rainCanvas.classList.toggle('opacity-0', !inFontaine || inInazuma || inLiyue);
  if (snowCanvas) snowCanvas.classList.toggle('opacity-0', inFontaine || inInazuma || inLiyue);
  if (lightningCanvas) lightningCanvas.classList.toggle('opacity-0', !inInazuma || inLiyue);
  if (geoCanvas) geoCanvas.classList.toggle('opacity-0', !inLiyue);
}, { passive: true });

// ==========================================
// 6. REGION OBSERVERS (INAZUMA & LIYUE)
// ==========================================
const hobbiesSection = document.getElementById('hobbies');
if (hobbiesSection) {
  const inazumaObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      inInazuma = entry.isIntersecting;
      document.body.classList.toggle('inazuma-mode', inInazuma);
      if (lightningCanvas) lightningCanvas.classList.toggle('opacity-0', !inInazuma);
    });
  }, { threshold: 0.15 });

  inazumaObserver.observe(hobbiesSection);
}

const liyueSection = document.getElementById('liyue');
if (liyueSection) {
  const liyueObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      inLiyue = entry.isIntersecting;
      document.body.classList.toggle('liyue-mode', inLiyue);
      if (geoCanvas) geoCanvas.classList.toggle('opacity-0', !inLiyue);
    });
  }, { threshold: 0.15 });

  liyueObserver.observe(liyueSection);
}

// ==========================================
// 7. UTILITY & MODAL HELPERS
// ==========================================
function toggleDelusionMode() { document.body.classList.toggle('delusion-mode'); }

const decrees = [
  "> Tsaritsa Decree: 'Let no system compile with warnings.'",
  "> Tsaritsa Decree: 'Architect with winter strength.'",
  "> Tsaritsa Decree: 'Your resolve in full-stack dev is acknowledged.'"
];
let dIdx = 0;
function petitionTsaritsa() {
  const box = document.getElementById('tsaritsa-box');
  if (box) box.textContent = decrees[dIdx];
  dIdx = (dIdx + 1) % decrees.length;
  const overlay = document.getElementById('cryo-overlay');
  if (overlay) {
    overlay.style.opacity = '0.8';
    setTimeout(() => overlay.style.opacity = '0', 600);
  }
}

function grantCryoBuff() {
  const stats = document.getElementById('buff-stats');
  if (stats) stats.style.opacity = '1';
  alert("Her Imperial Majesty grants Cryo Delusion Buff!");
}

function setOratriceBalance(type) {
  const arm = document.getElementById('scale-arm');
  if (arm) {
    if (type === 'web') arm.style.transform = 'rotate(-12deg)';
    if (type === 'game') arm.style.transform = 'rotate(12deg)';
  }
}

function openExhibitModal(title, desc, tags) {
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const tagBox = document.getElementById('modal-tags');
  const modal = document.getElementById('exhibit-modal');

  if (modalTitle) modalTitle.textContent = title;
  if (modalDesc) modalDesc.textContent = desc;
  if (tagBox) {
    tagBox.innerHTML = tags.map(t => `<span class="font-mono text-[10px] px-2.5 py-1 rounded bg-cyan-950 border border-cyan-400/40 text-cyan-300">${t}</span>`).join('');
  }
  if (modal) modal.classList.add('active');
}

function closeExhibitModal() {
  const modal = document.getElementById('exhibit-modal');
  if (modal) modal.classList.remove('active');
} 


// ==========================================
// 8. GENSHIN ACCURATE 5-STAR WISH ENGINE (3.0s)
// ==========================================
function triggerWishPull() {
  const modal = document.getElementById('wish-modal');
  const meteor = document.getElementById('wish-meteor');
  const starburst = document.getElementById('wish-starburst');
  const rainbowRing = document.getElementById('wish-rainbow-ring');
  const flash = document.getElementById('wish-flash');
  const card = document.getElementById('wish-card');

  if (!modal || !meteor || !card) return;

  // 1. Reset Modal & Layers
  modal.classList.add('active');
  meteor.classList.remove('animate-genshin-meteor');
  if (starburst) starburst.classList.remove('animate-starburst');
  if (rainbowRing) rainbowRing.classList.remove('animate-rainbow-halo');
  if (flash) flash.style.opacity = '0';
  card.style.opacity = '0';
  card.style.transform = 'scale(0.5)';

  // 2. Launch 3.0s Meteor Flight
  void meteor.offsetWidth; // Force Reflow
  meteor.classList.add('animate-genshin-meteor');

  // 3. Detonate Starburst precisely as meteor holds center (50% = 1.5s)
  setTimeout(() => {
    if (starburst) {
      void starburst.offsetWidth;
      starburst.classList.add('animate-starburst');
    }
    if (rainbowRing) {
      void rainbowRing.offsetWidth;
      rainbowRing.classList.add('animate-rainbow-halo');
    }
  }, 1500);

  // 4. Whiteout Impact Flash (1.9s)
  setTimeout(() => {
    if (flash) {
      flash.style.opacity = '1';
      setTimeout(() => { flash.style.opacity = '0'; }, 450);
    }
  }, 1900);

  // 5. Reveal 5-Star Character Card (2.2s)
  setTimeout(() => {
    card.style.opacity = '1';
    card.style.transform = 'scale(1)';
  }, 2200);
}

function closeWishModal() {
  const modal = document.getElementById('wish-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}