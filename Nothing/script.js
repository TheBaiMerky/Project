// Gamified Achievement System (localStorage-backed)
const ACHIEVEMENTS_KEY = 'msc_portfolio_achievements';

const ACHIEVEMENTS = {
  'elemental-master': {
    title: 'Elemental Master',
    desc: 'Clicked all 7 Genshin Vision badges',
    icon: 'fa-solid fa-hat-wizard'
  },
  'five-star-luck': {
    title: '5-Star Luck',
    desc: 'Opened the 5-Star Wish Pull',
    icon: 'fa-solid fa-star'
  },
  'full-appraisal': {
    title: 'Full Appraisal',
    desc: 'Completed a Great Sage status scan',
    icon: 'fa-solid fa-magnifying-glass'
  },
  'dimensional-traveler': {
    title: 'Dimensional Traveler',
    desc: 'Scrolled through all 6 section realms',
    icon: 'fa-solid fa-earth-asia'
  }
};

function getUnlockedAchievements() {
  try {
    return JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY)) || {};
  } catch (err) {
    return {};
  }
}

function saveUnlockedAchievements(unlocked) {
  try {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
  } catch (err) {
    /* localStorage unavailable (e.g. private mode) — fail silently */
  }
}

function unlockAchievement(id) {
  const meta = ACHIEVEMENTS[id];
  if (!meta) return;

  const unlocked = getUnlockedAchievements();
  if (unlocked[id]) return; // already earned — no duplicate toast

  unlocked[id] = true;
  saveUnlockedAchievements(unlocked);
  showAchievementToast(meta);
}

function showAchievementToast(meta) {
  const stack = document.getElementById('achievement-toast-stack');
  if (!stack) return;

  const toast = document.createElement('div');
  toast.className = 'achievement-toast';
  toast.innerHTML = `
    <div class="achievement-icon"><i class="${meta.icon}"></i></div>
    <div>
      <div class="achievement-eyebrow">✦ Achievement Unlocked</div>
      <div class="achievement-title">${meta.title}</div>
      <div class="font-mono text-[10px] text-[#c3e0e5] mt-0.5">${meta.desc}</div>
    </div>
  `;
  stack.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('toast-in'));

  setTimeout(() => {
    toast.classList.remove('toast-in');
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 450);
  }, 4200);
}

function showMiniToast(message, iconClass) {
  const stack = document.getElementById('achievement-toast-stack');
  if (!stack) return;

  const toast = document.createElement('div');
  toast.className = 'mini-toast';
  toast.innerHTML = `<i class="${iconClass || 'fa-solid fa-check'}"></i><span>${message}</span>`;
  stack.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('toast-in'));

  setTimeout(() => {
    toast.classList.remove('toast-in');
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 400);
  }, 2400);
}

// Web Audio API Synthesized Sound FX Engine
const AUDIO_MUTE_KEY = 'msc_portfolio_audio_muted';
let audioCtx = null;
let masterGain = null;
let audioMuted = localStorage.getItem(AUDIO_MUTE_KEY) === 'true';

function ensureAudioContext() {
  if (audioCtx) return audioCtx;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  audioCtx = new AudioContextClass();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = audioMuted ? 0 : 0.5;
  masterGain.connect(audioCtx.destination);
  return audioCtx;
}

// Schedules a single synthesized tone. type: oscillator waveform.
function playTone({ freq = 440, duration = 0.15, type = 'sine', gain = 0.2, delay = 0, glideTo = null }) {
  const ctx2 = ensureAudioContext();
  if (!ctx2 || audioMuted) return;
  if (ctx2.state === 'suspended') ctx2.resume();

  const osc = ctx2.createOscillator();
  const g = ctx2.createGain();
  osc.type = type;

  const startTime = ctx2.currentTime + delay;
  osc.frequency.setValueAtTime(freq, startTime);
  if (glideTo) {
    osc.frequency.exponentialRampToValueAtTime(glideTo, startTime + duration);
  }

  g.gain.setValueAtTime(0, startTime);
  g.gain.linearRampToValueAtTime(gain, startTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(g);
  g.connect(masterGain);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

// Subtle synth click — used on general button presses via [data-sfx-click]
function playClickSFX() {
  playTone({ freq: 720, duration: 0.06, type: 'triangle', gain: 0.12 });
}

// Golden chime arpeggio — fired when the 5-Star Wish Pull is triggered
function playWishChime() {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    playTone({ freq, duration: 0.55, type: 'triangle', gain: 0.16, delay: i * 0.12 });
    playTone({ freq: freq * 2, duration: 0.4, type: 'sine', gain: 0.05, delay: i * 0.12 }); // shimmer octave
  });
}

// Digital "appraise" beep — used by the Great Sage status scan
function playAppraiseBeep(stage = 'scan') {
  if (stage === 'scan') {
    playTone({ freq: 880, duration: 0.07, type: 'square', gain: 0.1, delay: 0 });
    playTone({ freq: 1046.5, duration: 0.07, type: 'square', gain: 0.1, delay: 0.12 });
  } else if (stage === 'complete') {
    playTone({ freq: 660, duration: 0.12, type: 'square', gain: 0.14, delay: 0, glideTo: 990 });
  }
}

function toggleAudioMute() {
  ensureAudioContext();
  audioMuted = !audioMuted;
  localStorage.setItem(AUDIO_MUTE_KEY, String(audioMuted));

  if (masterGain) {
    masterGain.gain.value = audioMuted ? 0 : 0.5;
  }

  const icon = document.getElementById('audio-toggle-icon');
  const btn = document.getElementById('audio-toggle-btn');
  if (icon) icon.className = `fa-solid ${audioMuted ? 'fa-volume-xmark' : 'fa-volume-high'} text-xs sm:text-sm`;
  if (btn) btn.setAttribute('aria-pressed', String(!audioMuted));

  if (!audioMuted) playClickSFX(); // small confirmation blip when unmuting
}

// Apply the persisted mute state to the header icon on load
document.addEventListener('DOMContentLoaded', () => {
  const icon = document.getElementById('audio-toggle-icon');
  const btn = document.getElementById('audio-toggle-btn');
  if (icon) icon.className = `fa-solid ${audioMuted ? 'fa-volume-xmark' : 'fa-volume-high'} text-xs sm:text-sm`;
  if (btn) btn.setAttribute('aria-pressed', String(!audioMuted));
});

// Global delegated click SFX — any element with [data-sfx-click] plays the
// subtle synth click. A one-time listener also "warms up" the AudioContext
// on the very first interaction, satisfying browser autoplay policies.
document.addEventListener('click', (e) => {
  ensureAudioContext();
  const sfxEl = e.target.closest('[data-sfx-click]');
  if (sfxEl) playClickSFX();
}, { capture: true });

// Eco Mode Performance Toggle
const ECO_MODE_KEY = 'msc_portfolio_eco_mode';
let ecoModeActive = localStorage.getItem(ECO_MODE_KEY) === 'true';
let ecoFrameCounter = 0;
const ECO_FRAME_SKIP = 4; // only render every 4th frame while Eco Mode is on

function applyEcoModeUI() {
  document.querySelectorAll('#eco-mode-btn, #eco-mode-btn-mobile').forEach((btn) => {
    if (!btn) return;
    btn.setAttribute('aria-pressed', String(ecoModeActive));
    btn.classList.toggle('eco-mode-active', ecoModeActive);
  });
}

function toggleEcoMode() {
  ecoModeActive = !ecoModeActive;
  localStorage.setItem(ECO_MODE_KEY, String(ecoModeActive));
  applyEcoModeUI();
  showMiniToast(
    ecoModeActive ? 'Eco Mode on — particle FX throttled' : 'Eco Mode off — full particle FX restored',
    ecoModeActive ? 'fa-solid fa-bolt' : 'fa-solid fa-bolt-lightning'
  );
}

document.addEventListener('DOMContentLoaded', applyEcoModeUI);

/* Cursor trail + ambient particle canvas */
const canvas = document.getElementById('universe-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

let currentMode = 'genshin';
const cursorParticles = [];

const themeColors = {
  genshin: '#ffe175',
  hsr: '#c084fc',
  wuwa: '#00f2fe',
  tensura: '#ef4444',
  rezero: '#e879f9',
  mushoku: '#34d399'
};

document.addEventListener('mousemove', (e) => {
  // Eco Mode — skip spawning new cursor-trail particles
  if (ecoModeActive) return;
  for (let i = 0; i < 2; i++) {
    cursorParticles.push({
      x: e.clientX + (Math.random() - 0.5) * 6,
      y: e.clientY + (Math.random() - 0.5) * 6,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5 - 0.5,
      size: Math.random() * 3 + 2,
      alpha: 1,
      color: themeColors[currentMode] || themeColors.genshin
    });
  }
});

/* ------------------------------------------------------------------
   GACHA BURST — one-shot particle explosion used by triggerWishPull().
   Lives outside the main cursor/bg particle arrays so it can be fired
   independently and cleans itself up once every particle has faded.
------------------------------------------------------------------- */
const burstParticles = [];

function fireGachaBurst() {
  if (!canvas) return;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const colors = ['#FFE175', '#FFF8E7', '#E8C97A', '#FFD700'];

  // radial meteor burst
  for (let i = 0; i < 140; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 9 + 3;
    burstParticles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 4 + 2,
      alpha: 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      gravity: 0.06
    });
  }

  // a few streaking "meteors" that shoot further and fall faster
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 14 + 10;
    burstParticles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 2 + 2,
      alpha: 1,
      color: '#FFF8E7',
      gravity: 0.15,
      isStreak: true,
      trail: []
    });
  }
}

if (canvas && ctx) {
  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const bgParticles = Array.from({ length: 50 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    radius: Math.random() * 2 + 1,
    speedY: Math.random() * 0.8 + 0.2,
    angle: Math.random() * Math.PI * 2,
    pulseSpeed: Math.random() * 0.05 + 0.02
  }));

  // per-theme drift + draw so each section's ambient particles feel distinct
  const bgStyles = {
    genshin: (p) => {
      p.y -= p.speedY * 0.6;
      p.x += Math.sin(p.angle) * 0.4;
      p.angle += p.pulseSpeed;
      ctx.fillStyle = 'rgba(255, 225, 117, 0.5)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    },
    hsr: (p) => {
      p.x -= p.speedY * 2;
      p.y += p.speedY;
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
      ctx.lineWidth = p.radius * 0.8;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + 10, p.y - 5);
      ctx.stroke();
    },
    wuwa: (p) => {
      p.y -= p.speedY * 0.8;
      ctx.fillStyle = 'rgba(0, 242, 254, 0.6)';
      ctx.fillRect(p.x, p.y, p.radius * 2, p.radius * 2);
    },
    tensura: (p) => {
      p.y -= p.speedY * 1.2;
      p.x += Math.cos(p.angle) * 0.5;
      p.angle += p.pulseSpeed;
      ctx.fillStyle = p.radius > 2 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(56, 189, 248, 0.6)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 1.8, 0, Math.PI * 2);
      ctx.fill();
    },
    rezero: (p) => {
      p.y += p.speedY * 0.5;
      p.x += Math.sin(p.angle) * 0.8;
      ctx.fillStyle = 'rgba(217, 70, 239, 0.5)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
      ctx.fill();
    },
    mushoku: (p) => {
      p.y -= p.speedY * 1.5;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.6)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  function animateCanvas() {
    requestAnimationFrame(animateCanvas);

    // Eco Mode — throttle rendering to ~1/4 frame rate to
    // cut CPU/GPU usage; skipped frames simply leave the canvas as-is.
    if (ecoModeActive) {
      ecoFrameCounter++;
      if (ecoFrameCounter % ECO_FRAME_SKIP !== 0) return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    bgParticles.forEach((p) => {
      ctx.save();
      (bgStyles[currentMode] || bgStyles.genshin)(p);
      ctx.restore();

      if (p.y < -20 || p.y > canvas.height + 20) {
        p.y = currentMode === 'rezero' ? -10 : canvas.height + 10;
        p.x = Math.random() * canvas.width;
      }
    });

    for (let i = cursorParticles.length - 1; i >= 0; i--) {
      const p = cursorParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.025;
      p.size *= 0.96;

      if (p.alpha <= 0 || p.size <= 0.2) {
        cursorParticles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // draw + advance the one-shot gacha burst, if active
    for (let i = burstParticles.length - 1; i >= 0; i--) {
      const p = burstParticles[i];
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.isStreak ? 0.012 : 0.018;

      if (p.alpha <= 0) {
        burstParticles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(p.alpha, 0);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = p.isStreak ? 16 : 10;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  animateCanvas();
}

/* Reveal sections as they scroll into view, direction-aware */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const el = entry.target;
    if (entry.isIntersecting) {
      el.classList.add('is-visible');
      el.classList.remove('scroll-above', 'scroll-below');
    } else {
      el.classList.remove('is-visible');
      if (entry.boundingClientRect.top < 0) {
        el.classList.add('scroll-above');
        el.classList.remove('scroll-below');
      } else {
        el.classList.add('scroll-below');
        el.classList.remove('scroll-above');
      }
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal-on-scroll').forEach((el) => revealObserver.observe(el));

/* Swap theme + header label as each anime section comes into view */
const universeNames = {
  genshin: 'Genshin Impact',
  hsr: 'Honkai: Star Rail',
  wuwa: 'Wuthering Waves',
  tensura: 'That Time I Got Reincarnated as a Slime',
  rezero: 'Re:Zero',
  mushoku: 'Mushoku Tensei'
};

const universeTag = document.getElementById('active-universe-tag');

/* ------------------------------------------------------------------
   SCROLLSPY — highlights the matching desktop + mobile nav link as
   its section scrolls into view. Nav links carry data-nav-for="<id>"
   so this stays decoupled from the theme/canvas logic above.
------------------------------------------------------------------- */
const navLinks = document.querySelectorAll('[data-nav-for]');

function setActiveNavLink(sectionId) {
  navLinks.forEach((link) => {
    const isActive = link.dataset.navFor === sectionId;
    link.classList.toggle('nav-link-active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'true');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

// tracks distinct section realms visited, for "Dimensional Traveler"
const visitedSections = new Set();

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const sectionId = entry.target.id;
    document.body.setAttribute('data-theme', sectionId);
    currentMode = sectionId;
    if (universeTag && universeNames[sectionId]) {
      universeTag.textContent = universeNames[sectionId];
    }
    setActiveNavLink(sectionId);

    // "Dimensional Traveler" achievement — unlock once all
    // 6 section realms have been scrolled through at least once.
    const isFirstVisit = !visitedSections.has(sectionId);
    visitedSections.add(sectionId);
    if (visitedSections.size >= Object.keys(universeNames).length) {
      unlockAchievement('dimensional-traveler');
    }

    // Gacha economy — small Primogem reward the first time
    // each realm is scrolled into view.
    if (isFirstVisit) {
      awardPrimogems(30, `Explored ${universeNames[sectionId]}`);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.universe-section').forEach((sec) => sectionObserver.observe(sec));

/* ------------------------------------------------------------------
   MOBILE NAV — hamburger toggle + auto-close on link tap.
------------------------------------------------------------------- */
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const mobileMenuIconOpen = document.getElementById('mobile-menu-icon-open');
const mobileMenuIconClose = document.getElementById('mobile-menu-icon-close');

function openMobileMenu() {
  if (!mobileMenu) return;
  mobileMenu.classList.remove('hidden');
  mobileMenuIconOpen?.classList.add('hidden');
  mobileMenuIconClose?.classList.remove('hidden');
  mobileMenuBtn?.setAttribute('aria-expanded', 'true');
}

function closeMobileMenu() {
  if (!mobileMenu) return;
  mobileMenu.classList.add('hidden');
  mobileMenuIconOpen?.classList.remove('hidden');
  mobileMenuIconClose?.classList.add('hidden');
  mobileMenuBtn?.setAttribute('aria-expanded', 'false');
}

if (mobileMenuBtn && mobileMenu) {
  mobileMenuBtn.addEventListener('click', () => {
    const isOpen = !mobileMenu.classList.contains('hidden');
    isOpen ? closeMobileMenu() : openMobileMenu();
  });

  // close the menu once a link is tapped, so it doesn't linger over the next section
  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMobileMenu);
  });
}

/* Great Sage panel — a lighthearted "status readout" about me, Tensura-style */
const sageLines = [
  "Been playing Genshin since launch. Currently AR 60 with 36-star Abyss clears.",
  "Main dev stack right now: Godot 4.7 for a 2D survival game, plus some Roblox builds on the side.",
  "Been posting gameplay guides and highlights on YouTube — mostly Genshin and whatever I'm grinding that week.",
  "Studying Computer Engineering. Been building small games and web projects on the side for a while now.",
  "Open to collabs — hit the contact form below if you've got an idea."
];

let sageIndex = 0;
let isSageAnalyzing = false;

function triggerSageAnalysis() {
  if (isSageAnalyzing) return;
  isSageAnalyzing = true;

  const sageText = document.getElementById('sage-text');
  const sageProgress = document.getElementById('sage-progress');
  const sageStatusTag = document.getElementById('sage-status-tag');
  const scanline = document.getElementById('sage-scanline');
  if (!sageText || !sageProgress || !sageStatusTag || !scanline) return;

  scanline.classList.remove('hidden');
  sageStatusTag.textContent = '[GREAT SAGE: APPRAISING...]';
  sageStatusTag.classList.remove('text-red-400');
  sageStatusTag.classList.add('text-amber-400');

  // digital "appraise" beep at scan start (Web Audio SFX)
  playAppraiseBeep('scan');

  let progress = 0;
  sageProgress.textContent = '0%';

  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 15) + 5;

    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);

      scanline.classList.add('hidden');
      sageStatusTag.textContent = '[GREAT SAGE: ANALYSIS COMPLETE]';
      sageStatusTag.classList.remove('text-amber-400');
      sageStatusTag.classList.add('text-cyan-400');

      sageIndex = (sageIndex + 1) % sageLines.length;
      typeWriterMessage(sageText, sageLines[sageIndex], () => {
        isSageAnalyzing = false;
      });

      // "Full Appraisal" achievement — unlocked on scan completion
      unlockAchievement('full-appraisal');
      // confirmation beep once the appraisal finishes
      playAppraiseBeep('complete');
      // Gacha economy — gems for running a scan
      awardPrimogems(20, 'Great Sage status scan');
    }

    sageProgress.textContent = `${progress}%`;
  }, 80);
}

function typeWriterMessage(element, text, onComplete) {
  element.textContent = '';
  let i = 0;
  (function typeNextChar() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(typeNextChar, 18);
    } else if (onComplete) {
      onComplete();
    }
  })();
}

/* ------------------------------------------------------------------
   VISION SWITCHER — updates the description text (as before) and now
   also toggles a "ring-active" state onto whichever badge was clicked,
   so there's a persistent visual indicator of the active element, AND
   re-tints the 3D Vision Viewer's gem + particle aura (see part 5).
------------------------------------------------------------------- */
const visionDescriptions = {
  anemo: "Quick to jump between projects — games, streams, whatever's fun that week.",
  geo: "Steady grind on the content side — consistent uploads over big swings.",
  electro: "Chasing high-FPS gameplay clips and fast-paced highlight reels.",
  dendro: "Spreads across YouTube, Instagram, and Facebook rather than picking one lane.",
  hydro: "Edits video the way water finds its path — whatever gets the clip out fastest.",
  pyro: "Streams with energy and likes a chatty, high-engagement community.",
  cryo: "Prefers slower, analytical breakdowns of game mechanics and builds."
};

// tracks distinct Vision badges clicked, for "Elemental Master"
const clickedVisions = new Set();

function setVision(element, btn) {
  const visionDesc = document.getElementById('vision-desc');
  if (visionDesc && visionDescriptions[element]) {
    visionDesc.textContent = `"${visionDescriptions[element]}"`;
  }

  // clear the active state off every badge, then apply it to the one clicked
  document.querySelectorAll('.vision-badge').forEach((b) => b.classList.remove('vision-badge-active'));
  const target = btn || document.querySelector(`.vision-badge.active-${element}`);
  target?.classList.add('vision-badge-active');

  // retint the Three.js Vision Viewer gem + aura particles
  if (typeof setVisionViewerElement === 'function') {
    setVisionViewerElement(element);
  }

  // "Elemental Master" achievement — unlock once all 7
  // distinct vision badges have been clicked at least once.
  const isFirstClickOfThisElement = !clickedVisions.has(element);
  clickedVisions.add(element);
  if (clickedVisions.size >= Object.keys(visionDescriptions).length) {
    unlockAchievement('elemental-master');
  }

  // Gacha economy — small reward the first time each
  // element badge is tried.
  if (isFirstClickOfThisElement) {
    awardPrimogems(10, `Tried the ${element} Vision`);
  }
}

/* Lightbox */
function openLightbox(imageSrc) {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  if (!lightbox || !lightboxImg) return;
  lightboxImg.src = imageSrc;
  lightbox.classList.remove('hidden');
  lightbox.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  lightbox.classList.add('hidden');
  lightbox.classList.remove('flex');
  document.body.style.overflow = 'auto';
}

/* ------------------------------------------------------------------
   WISH PULL MODAL — now driven by the Gacha Pull Simulator (part 2
   below). triggerWishPull() spends gems, rolls a result, fires the
   canvas particle burst, then reveals the card with that result.
------------------------------------------------------------------- */
function closeWishModal() {
  const modal = document.getElementById('wish-modal');
  const card = document.getElementById('wish-card');
  if (card) {
    card.style.opacity = '0';
    card.style.transform = 'scale(0.5)';
  }
  setTimeout(() => {
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }, 250);
}

// Copies the UID to the clipboard and shows a brief confirmation toast
function copyUID(btn) {
  const uidEl = document.getElementById('genshin-uid');
  const uid = uidEl ? uidEl.textContent.trim() : '';
  if (!uid) return;

  const finish = () => {
    showMiniToast('UID Copied to Clipboard!', 'fa-solid fa-clipboard-check');
    if (btn) {
      btn.classList.add('copy-btn-pulse');
      setTimeout(() => btn.classList.remove('copy-btn-pulse'), 500);
    }
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(uid).then(finish).catch(() => {
      showMiniToast('Could not copy UID — copy it manually.', 'fa-solid fa-triangle-exclamation');
    });
  } else {
    // Fallback for browsers without the async Clipboard API
    const tmp = document.createElement('textarea');
    tmp.value = uid;
    tmp.style.position = 'fixed';
    tmp.style.opacity = '0';
    document.body.appendChild(tmp);
    tmp.select();
    try {
      document.execCommand('copy');
      finish();
    } catch (err) {
      showMiniToast('Could not copy UID — copy it manually.', 'fa-solid fa-triangle-exclamation');
    }
    document.body.removeChild(tmp);
  }
}

// Interactive YouTube preview modal (HSR social card)
function openVideoModal(videoId) {
  const modal = document.getElementById('video-modal');
  const frame = document.getElementById('video-modal-frame');
  if (!modal || !frame) return;

  frame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
  const modal = document.getElementById('video-modal');
  const frame = document.getElementById('video-modal-frame');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  if (frame) frame.src = ''; // stop playback on close
  document.body.style.overflow = 'auto';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLightbox();
    closeWishModal();
    closeMobileMenu();
    closeVideoModal();
    closeInventory();
    if (typeof closeSageChatIfOpen === 'function') closeSageChatIfOpen();
  }
});

/* ------------------------------------------------------------------
   CONTACT FORM — Formspree submission with basic validation and
   inline feedback states (sending / success / error), replacing the
   old inline alert(). Swap YOUR_FORM_ID for a real Formspree endpoint.
------------------------------------------------------------------- */
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';

const scrollForm = document.getElementById('scroll-form');
const formStatus = document.getElementById('form-status');
const formSubmitBtn = document.getElementById('form-submit-btn');

function setFormStatus(message, tone) {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.classList.remove('hidden', 'text-emerald-400', 'text-red-400', 'text-amber-300');
  const toneClass = tone === 'success' ? 'text-emerald-400' : tone === 'error' ? 'text-red-400' : 'text-amber-300';
  formStatus.classList.add(toneClass);
}

function validateScrollForm(data) {
  const errors = [];
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Enter your name (at least 2 characters).');
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailPattern.test(data.email)) {
    errors.push('Enter a valid email address.');
  }
  if (!data.message || data.message.trim().length < 10) {
    errors.push('Message should be at least 10 characters.');
  }
  return errors;
}

if (scrollForm) {
  scrollForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(scrollForm);
    const data = Object.fromEntries(formData.entries());

    const errors = validateScrollForm(data);
    if (errors.length > 0) {
      setFormStatus(errors[0], 'error');
      return;
    }

    if (formSubmitBtn) {
      formSubmitBtn.disabled = true;
      formSubmitBtn.textContent = 'Sending...';
    }
    setFormStatus('Sending your message...', 'pending');

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData
      });

      if (response.ok) {
        setFormStatus("Message sent — I'll get back to you soon.", 'success');
        scrollForm.reset();
      } else {
        const result = await response.json().catch(() => null);
        const message = result?.errors?.map((err) => err.message).join(', ')
          || 'Something went wrong sending that. Try again in a bit.';
        setFormStatus(message, 'error');
      }
    } catch (err) {
      setFormStatus('Network error — check your connection and try again.', 'error');
    } finally {
      if (formSubmitBtn) {
        formSubmitBtn.disabled = false;
        formSubmitBtn.textContent = 'Dispatch Scroll to Mark Sandler →';
      }
    }
  });
}

// Real-Time Discord Presence Widget (Lanyard API)
const DISCORD_USER_ID = 'YOUR_DISCORD_ID';
const LANYARD_POLL_INTERVAL = 30000; // 30s — keep polite to the free public API

const discordStatusColors = {
  online: '#22c55e',
  idle: '#f59e0b',
  dnd: '#ef4444',
  offline: '#64748b'
};

async function fetchDiscordPresence() {
  const dot = document.getElementById('discord-status-dot');
  const ping = document.getElementById('discord-status-ping');
  const text = document.getElementById('discord-status-text');
  if (!dot || !ping || !text) return;

  if (!DISCORD_USER_ID || DISCORD_USER_ID === 'YOUR_DISCORD_ID') {
    text.textContent = 'Not configured';
    dot.style.background = discordStatusColors.offline;
    ping.style.background = discordStatusColors.offline;
    ping.classList.add('hidden');
    return;
  }

  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`);
    if (!res.ok) throw new Error('Lanyard request failed');
    const payload = await res.json();
    if (!payload.success) throw new Error('Lanyard returned unsuccessful payload');

    const data = payload.data;
    const status = data.discord_status || 'offline';
    const color = discordStatusColors[status] || discordStatusColors.offline;

    dot.style.background = color;
    ping.style.background = color;
    ping.classList.toggle('hidden', status === 'offline');

    // Prefer a live Spotify listening activity, then a game/app activity,
    // falling back to a plain status label.
    if (data.listening_to_spotify && data.spotify) {
      text.textContent = `🎵 ${data.spotify.song} — ${data.spotify.artist}`;
    } else {
      const activity = (data.activities || []).find((a) => a.type === 0); // type 0 = "Playing"
      if (activity) {
        text.textContent = `🎮 Playing ${activity.name}`;
      } else {
        const statusLabels = { online: 'Online', idle: 'Idle', dnd: 'Do Not Disturb', offline: 'Offline' };
        text.textContent = statusLabels[status] || 'Offline';
      }
    }
  } catch (err) {
    text.textContent = 'Unavailable';
    dot.style.background = discordStatusColors.offline;
    ping.style.background = discordStatusColors.offline;
    ping.classList.add('hidden');
  }
}

if (document.getElementById('discord-presence')) {
  fetchDiscordPresence();
  setInterval(fetchDiscordPresence, LANYARD_POLL_INTERVAL);
}

// Interactive "Great Sage" Developer CLI / Terminal
const terminalPanel = document.getElementById('great-sage-terminal');
const terminalLauncher = document.getElementById('terminal-launcher');
const terminalOutput = document.getElementById('terminal-output');
const terminalForm = document.getElementById('terminal-form');
const terminalInput = document.getElementById('terminal-input');

function terminalPrint(html, tone = 'default') {
  if (!terminalOutput) return;
  const toneClass = {
    default: 'text-cyan-100',
    system: 'text-emerald-400',
    error: 'text-red-400',
    dim: 'text-slate-500'
  }[tone] || 'text-cyan-100';

  const line = document.createElement('div');
  line.className = toneClass;
  line.innerHTML = html;
  terminalOutput.appendChild(line);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function toggleTerminal(forceOpen) {
  if (!terminalPanel) return;
  const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : terminalPanel.classList.contains('hidden');

  if (shouldOpen) {
    terminalPanel.classList.remove('hidden');
    terminalLauncher?.classList.add('hidden');
    setTimeout(() => terminalInput?.focus(), 50);
  } else {
    terminalPanel.classList.add('hidden');
    terminalLauncher?.classList.remove('hidden');
  }
}

const terminalCommands = {
  help: () => {
    terminalPrint('Available commands:', 'system');
    terminalPrint('&nbsp;&nbsp;<span class="text-cyan-300">help</span> — list commands');
    terminalPrint('&nbsp;&nbsp;<span class="text-cyan-300">projects</span> — recent builds & side projects');
    terminalPrint('&nbsp;&nbsp;<span class="text-cyan-300">stats</span> — quick creator/dev stat readout');
    terminalPrint('&nbsp;&nbsp;<span class="text-cyan-300">wish</span> — trigger the 5★ Wish Pull');
    terminalPrint('&nbsp;&nbsp;<span class="text-cyan-300">inventory</span> — open the collectibles drawer');
    terminalPrint('&nbsp;&nbsp;<span class="text-cyan-300">ask [question]</span> — open Great Sage chat with a question');
    terminalPrint('&nbsp;&nbsp;<span class="text-cyan-300">clear</span> — clear this terminal');
  },
  projects: () => {
    terminalPrint('Recent projects:', 'system');
    terminalPrint('&nbsp;&nbsp;• 2D survival game — Godot 4.7');
    terminalPrint('&nbsp;&nbsp;• Roblox side-builds — Luau scripting');
    terminalPrint('&nbsp;&nbsp;• This portfolio — Tailwind + vanilla JS + Three.js + Web Audio/Canvas API');
    terminalPrint('&nbsp;&nbsp;• Gameplay guides & shorts — YouTube');
  },
  stats: () => {
    terminalPrint('Creator / dev stat readout:', 'system');
    terminalPrint('&nbsp;&nbsp;AR 60 &bull; 36★ Spiral Abyss clears');
    terminalPrint('&nbsp;&nbsp;Studying Computer Engineering');
    terminalPrint('&nbsp;&nbsp;Currently building with Godot 4.7');
  },
  wish: () => {
    terminalPrint('Summoning 5★ Wish Pull…', 'system');
    if (typeof triggerWishPull === 'function') triggerWishPull();
  },
  inventory: () => {
    terminalPrint('Opening inventory…', 'system');
    if (typeof openInventory === 'function') openInventory();
  },
  clear: () => {
    if (terminalOutput) terminalOutput.innerHTML = '';
  }
};

if (terminalForm && terminalInput) {
  terminalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = terminalInput.value.trim();
    if (!raw) return;

    terminalPrint(`<span class="text-slate-500">&gt;</span> ${raw}`);
    const cmd = raw.toLowerCase();

    if (terminalCommands[cmd]) {
      terminalCommands[cmd]();
    } else if (cmd.startsWith('ask ')) {
      const question = raw.slice(4);
      terminalPrint('Routing to Great Sage chat…', 'system');
      if (typeof toggleSageChat === 'function') {
        toggleSageChat(true);
        if (typeof askGreatSage === 'function') askGreatSage(question);
      }
    } else {
      terminalPrint(`Unknown command: "${raw}". Type <span class="text-cyan-300">help</span> for options.`, 'error');
    }

    terminalInput.value = '';
  });
}

// `~` toggles the terminal from anywhere, unless the user is typing in a
// text field (so it doesn't interfere with normal form input elsewhere).
document.addEventListener('keydown', (e) => {
  if (e.key !== '`' && e.key !== '~') return;
  const tag = document.activeElement?.tagName;
  const isTypingElsewhere = (tag === 'INPUT' || tag === 'TEXTAREA') && document.activeElement !== terminalInput;
  if (isTypingElsewhere) return;
  e.preventDefault();
  toggleTerminal();
});

// Genshin/WuWa "5★ Artifact Substat Reroller" mini-game
const artifactSubstatPool = [
  { key: 'crit-rate', label: 'CRIT Rate', min: 2.7, max: 3.9, suffix: '%' },
  { key: 'crit-dmg', label: 'CRIT DMG', min: 5.4, max: 7.8, suffix: '%' },
  { key: 'atk-pct', label: 'ATK%', min: 4.1, max: 5.8, suffix: '%' },
  { key: 'em', label: 'Elemental Mastery', min: 16, max: 23, suffix: '' },
  { key: 'er', label: 'Energy Recharge', min: 4.5, max: 6.5, suffix: '%' }
];

function rollSubstatValue(stat) {
  // simulate 1–6 sub-rolls, like real Genshin artifact substat upgrades
  const rolls = Math.floor(Math.random() * 6) + 1;
  let total = 0;
  for (let i = 0; i < rolls; i++) {
    total += stat.min + Math.random() * (stat.max - stat.min);
  }
  return total;
}

function animateSubstatValue(el, targetValue, suffix, decimals) {
  const duration = 550;
  const start = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = targetValue * eased;
    el.textContent = `+${current.toFixed(decimals)}${suffix}`;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function rerollArtifactSubstats() {
  const container = document.getElementById('artifact-substats');
  const critValueLabel = document.getElementById('artifact-crit-value');
  if (!container) return;

  // pick 4 distinct random substats out of the pool of 5
  const shuffled = [...artifactSubstatPool].sort(() => Math.random() - 0.5);
  const chosen = shuffled.slice(0, 4);

  const slots = container.querySelectorAll('.artifact-substat-slot');
  let critRateRolled = 0;
  let critDmgRolled = 0;

  chosen.forEach((stat, i) => {
    const slot = slots[i];
    if (!slot) return;
    const labelEl = slot.querySelector('.substat-label');
    const valueEl = slot.querySelector('.substat-value');
    const decimals = stat.key === 'em' ? 1 : 1;
    const value = rollSubstatValue(stat);

    if (stat.key === 'crit-rate') critRateRolled = value;
    if (stat.key === 'crit-dmg') critDmgRolled = value;

    labelEl.textContent = stat.label;
    slot.classList.add('artifact-slot-rolling');
    setTimeout(() => slot.classList.remove('artifact-slot-rolling'), 550);
    animateSubstatValue(valueEl, value, stat.suffix, decimals);
  });

  // rough "CRIT Value" readout — standard Genshin formula: CritRate*2 + CritDMG
  const critValue = critRateRolled * 2 + critDmgRolled;
  if (critValueLabel) {
    setTimeout(() => {
      critValueLabel.textContent = `CRIT Value: ${critValue.toFixed(1)}`;
    }, 200);
  }
}

// Interactive 3D Vision Viewer (Three.js)
const visionElementColors = {
  anemo: 0x72e2c4,
  geo: 0xffe175,
  electro: 0xd376ff,
  dendro: 0xa5e847,
  hydro: 0x4bcaff,
  pyro: 0xff7200,
  cryo: 0x99ffff
};

let visionScene, visionCamera, visionRenderer, visionGem, visionAuraPoints, visionAuraGeometry;
let visionDragging = false;
let visionPrevPointer = { x: 0, y: 0 };
let visionRotationVelocity = { x: 0, y: 0.004 };
let visionCurrentColor = visionElementColors.anemo;
let visionTargetColor = visionElementColors.anemo;
let visionAnimHandle = null;

function initVisionViewer() {
  const container = document.getElementById('vision-3d-container');
  const canvasEl = document.getElementById('vision-3d-canvas');
  const fallback = document.getElementById('vision-3d-fallback');
  if (!container || !canvasEl) return;

  if (typeof THREE === 'undefined') {
    canvasEl.classList.add('hidden');
    fallback?.classList.remove('hidden');
    fallback?.classList.add('flex');
    return;
  }

  try {
    visionScene = new THREE.Scene();

    const width = container.clientWidth;
    const height = container.clientHeight;
    visionCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    visionCamera.position.set(0, 0, 6);

    visionRenderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: true });
    visionRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    visionRenderer.setSize(width, height);

    // Lighting — a soft key light plus ambient fill so the gem's facets read clearly
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    visionScene.add(ambient);
    const keyLight = new THREE.PointLight(0xffffff, 1.1, 20);
    keyLight.position.set(3, 4, 5);
    visionScene.add(keyLight);
    const rimLight = new THREE.PointLight(visionCurrentColor, 1.4, 20);
    rimLight.position.set(-3, -2, -4);
    visionScene.add(rimLight);
    visionGem = null; // set below, rimLight referenced in animate via closure

    // Low-poly gem: an icosahedron reads as a faceted "Vision" crystal
    const gemGeometry = new THREE.IcosahedronGeometry(1.5, 0);
    const gemMaterial = new THREE.MeshStandardMaterial({
      color: visionCurrentColor,
      emissive: visionCurrentColor,
      emissiveIntensity: 0.35,
      metalness: 0.3,
      roughness: 0.25,
      flatShading: true
    });
    visionGem = new THREE.Mesh(gemGeometry, gemMaterial);
    visionScene.add(visionGem);

    // A thin wireframe shell slightly larger than the gem, for a "vision case" look
    const shellGeometry = new THREE.IcosahedronGeometry(1.62, 0);
    const shellMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.18 });
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    visionGem.add(shell);

    // Elemental aura — a ring of small points orbiting the gem
    const auraCount = 90;
    visionAuraGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(auraCount * 3);
    for (let i = 0; i < auraCount; i++) {
      const angle = (i / auraCount) * Math.PI * 2;
      const radius = 2.2 + Math.random() * 0.6;
      const tilt = (Math.random() - 0.5) * 1.2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius * 0.4 + tilt;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    visionAuraGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const auraMaterial = new THREE.PointsMaterial({
      color: visionCurrentColor,
      size: 0.06,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    visionAuraPoints = new THREE.Points(visionAuraGeometry, auraMaterial);
    visionScene.add(visionAuraPoints);

    // Drag-to-rotate — plain pointer events, no OrbitControls dependency
    const onPointerDown = (x, y) => {
      visionDragging = true;
      visionPrevPointer = { x, y };
    };
    const onPointerMove = (x, y) => {
      if (!visionDragging) return;
      const dx = x - visionPrevPointer.x;
      const dy = y - visionPrevPointer.y;
      visionRotationVelocity.y = dx * 0.005;
      visionRotationVelocity.x = dy * 0.005;
      visionGem.rotation.y += dx * 0.01;
      visionGem.rotation.x += dy * 0.01;
      visionPrevPointer = { x, y };
    };
    const onPointerUp = () => { visionDragging = false; };

    canvasEl.addEventListener('mousedown', (e) => onPointerDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onPointerUp);

    canvasEl.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      onPointerDown(t.clientX, t.clientY);
    }, { passive: true });
    canvasEl.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      onPointerMove(t.clientX, t.clientY);
    }, { passive: true });
    canvasEl.addEventListener('touchend', onPointerUp);

    window.addEventListener('resize', () => {
      if (!container || !visionRenderer || !visionCamera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      visionCamera.aspect = w / h;
      visionCamera.updateProjectionMatrix();
      visionRenderer.setSize(w, h);
    });

    function animateVision() {
      visionAnimHandle = requestAnimationFrame(animateVision);
      if (!visionGem) return;

      // gentle auto-rotation + inertia decay from the last drag gesture
      if (!visionDragging) {
        visionGem.rotation.y += visionRotationVelocity.y * 0.6 + 0.0035;
        visionGem.rotation.x += visionRotationVelocity.x * 0.6;
        visionRotationVelocity.x *= 0.94;
        visionRotationVelocity.y *= 0.94;
      }

      // orbit the aura points slowly around the gem, independent of drag
      if (visionAuraPoints) visionAuraPoints.rotation.y += 0.006;

      // smoothly lerp the gem/aura/rim-light color toward the active element
      visionCurrentColor = lerpHexColor(visionCurrentColor, visionTargetColor, 0.06);
      visionGem.material.color.setHex(visionCurrentColor);
      visionGem.material.emissive.setHex(visionCurrentColor);
      if (visionAuraPoints) visionAuraPoints.material.color.setHex(visionCurrentColor);
      rimLight.color.setHex(visionCurrentColor);

      visionRenderer.render(visionScene, visionCamera);
    }
    animateVision();
  } catch (err) {
    // WebGL context creation failed or Three.js threw — fall back to text notice
    canvasEl.classList.add('hidden');
    fallback?.classList.remove('hidden');
    fallback?.classList.add('flex');
  }
}

function lerpHexColor(fromHex, toHex, t) {
  const fr = (fromHex >> 16) & 255, fg = (fromHex >> 8) & 255, fb = fromHex & 255;
  const tr = (toHex >> 16) & 255, tg = (toHex >> 8) & 255, tb = toHex & 255;
  const r = Math.round(fr + (tr - fr) * t);
  const g = Math.round(fg + (tg - fg) * t);
  const b = Math.round(fb + (tb - fb) * t);
  return (r << 16) | (g << 8) | b;
}

// Called from setVision() above whenever a new Vision badge is clicked
function setVisionViewerElement(element) {
  if (visionElementColors[element] !== undefined) {
    visionTargetColor = visionElementColors[element];
  }
}

document.addEventListener('DOMContentLoaded', initVisionViewer);

// Full Gacha Pull Simulator & Visitor Inventory System
const GACHA_GEMS_KEY = 'msc_portfolio_primogems';
const GACHA_INVENTORY_KEY = 'msc_portfolio_inventory';
const WISH_COST = 160;

const gachaPool = [
  // 5★ — rare pulls (character-card flavor, themed on Mark himself + mains)
  { rarity: 5, type: 'Character', name: 'Mark Sandler, the Traveler', desc: 'C6 Traveler skin. CE student by day, content creator by night.', weight: 3 },
  { rarity: 5, type: 'Character', name: 'The Great Sage', desc: '"A quick readout on what I\'m up to lately." Status panel incarnate.', weight: 3 },
  { rarity: 5, type: 'Lore Note', name: 'Developer Secret #1', desc: 'This entire site\'s particle engine runs on a single 2D canvas — no WebGL needed for the background.', weight: 2 },
  // 4★ — common pulls (project + fandom flavor)
  { rarity: 4, type: 'Character', name: 'Godot Survivor', desc: 'Built from scratch in Godot 4.7 — bullet-hell wave spawners and all.', weight: 10 },
  { rarity: 4, type: 'Character', name: 'Roblox Builder', desc: 'Player and developer across anime battlegrounds and sandbox realms.', weight: 10 },
  { rarity: 4, type: 'Character', name: 'Astral Express Passenger', desc: '"May This Journey Lead Us Starward." HSR social hub unlocked.', weight: 10 },
  { rarity: 4, type: 'Lore Note', name: 'Developer Secret #2', desc: 'The Great Sage scan progress bar is genuinely random each time — no scripted sequence.', weight: 8 },
  { rarity: 4, type: 'Lore Note', name: 'Developer Secret #3', desc: 'Every section\'s ambient particle drift uses its own hand-tuned motion function.', weight: 8 },
  { rarity: 4, type: 'Badge', name: 'Spiral Abyss Badge', desc: '36★ Abyss clears, AR 60. A small trophy for the dossier.', weight: 8 },
  { rarity: 4, type: 'Badge', name: 'Eco Mode Badge', desc: 'Awarded for caring about visitors\' battery life.', weight: 8 }
];

function getPrimogems() {
  const raw = localStorage.getItem(GACHA_GEMS_KEY);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

function setPrimogems(value) {
  localStorage.setItem(GACHA_GEMS_KEY, String(Math.max(0, value)));
  updateGemDisplays();
}

function updateGemDisplays() {
  const n = getPrimogems();
  const headerEl = document.getElementById('primogem-count');
  const drawerEl = document.getElementById('inventory-gem-count');
  if (headerEl) headerEl.textContent = n.toLocaleString();
  if (drawerEl) drawerEl.textContent = n.toLocaleString();
}

function awardPrimogems(amount, reason) {
  setPrimogems(getPrimogems() + amount);
  showMiniToast(`+${amount} Primogems — ${reason}`, 'fa-solid fa-gem');
}

function getInventory() {
  try {
    return JSON.parse(localStorage.getItem(GACHA_INVENTORY_KEY)) || [];
  } catch (err) {
    return [];
  }
}

function saveInventory(items) {
  localStorage.setItem(GACHA_INVENTORY_KEY, JSON.stringify(items));
}

function weightedRollFromPool() {
  const totalWeight = gachaPool.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const item of gachaPool) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return gachaPool[gachaPool.length - 1];
}

function renderInventory() {
  const list = document.getElementById('inventory-list');
  if (!list) return;
  const items = getInventory();

  if (items.length === 0) {
    list.innerHTML = `<div class="text-slate-500 text-center py-10">No pulls yet — spend Primogems on a Wish above.</div>`;
    return;
  }

  // newest first
  const sorted = [...items].reverse();
  list.innerHTML = sorted.map((item) => {
    const rarityColor = item.rarity === 5 ? 'text-[#FFE175] border-[#FFE175]/50' : 'text-[#a855f7] border-[#a855f7]/40';
    const stars = '★'.repeat(item.rarity);
    return `
      <div class="rounded-xl border ${rarityColor} bg-[#0b132b]/60 p-3">
        <div class="flex items-center justify-between mb-1">
          <span class="text-[10px] uppercase tracking-wider ${item.rarity === 5 ? 'text-[#FFE175]' : 'text-[#a855f7]'}">${item.type}</span>
          <span class="${item.rarity === 5 ? 'text-[#FFE175]' : 'text-[#a855f7]'} text-[10px]">${stars}</span>
        </div>
        <div class="text-slate-100 font-bold text-xs sm:text-sm mb-1">${item.name}</div>
        <div class="text-slate-400 text-[11px] leading-relaxed">${item.desc}</div>
      </div>
    `;
  }).join('');
}

function openInventory() {
  const drawer = document.getElementById('inventory-drawer');
  if (!drawer) return;
  updateGemDisplays();
  renderInventory();
  drawer.classList.remove('hidden');
  drawer.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

function closeInventory() {
  const drawer = document.getElementById('inventory-drawer');
  if (!drawer) return;
  drawer.classList.add('hidden');
  drawer.classList.remove('flex');
  document.body.style.overflow = 'auto';
}

/* triggerWishPull() — spends WISH_COST gems, rolls a card, and reuses
   the existing wish-modal markup to reveal the result. If the visitor
   doesn't have enough gems, it still opens the modal but shows a
   "not enough gems" notice instead of spending anything. */
function triggerWishPull() {
  const modal = document.getElementById('wish-modal');
  const card = document.getElementById('wish-card');
  if (!modal || !card) return;

  const gems = getPrimogems();
  const canAfford = gems >= WISH_COST;

  const rarityEl = document.getElementById('wish-result-rarity');
  const nameEl = document.getElementById('wish-result-name');
  const typeEl = document.getElementById('wish-result-type');
  const starsEl = document.getElementById('wish-result-stars');
  const descEl = document.getElementById('wish-result-desc');

  if (canAfford) {
    setPrimogems(gems - WISH_COST);
    const result = weightedRollFromPool();

    const inventory = getInventory();
    inventory.push(result);
    saveInventory(inventory);

    if (rarityEl) rarityEl.textContent = `✦ ${result.rarity}-STAR ${result.type.toUpperCase()} ✦`;
    if (nameEl) nameEl.textContent = result.name;
    if (typeEl) typeEl.textContent = result.type;
    if (starsEl) starsEl.textContent = '★ '.repeat(result.rarity).trim();
    if (descEl) descEl.textContent = `"${result.desc}"`;

    fireGachaBurst();
    playWishChime();
    unlockAchievement('five-star-luck');
  } else {
    if (rarityEl) rarityEl.textContent = '✦ NOT ENOUGH PRIMOGEMS ✦';
    if (nameEl) nameEl.textContent = 'Come back later!';
    if (typeEl) typeEl.textContent = `You have ${gems} / ${WISH_COST} gems`;
    if (starsEl) starsEl.textContent = '';
    if (descEl) descEl.textContent = '"Scroll through a few more realms, try some Vision badges, or run a Great Sage scan to earn more."';
    playClickSFX();
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  setTimeout(() => {
    card.style.opacity = '1';
    card.style.transform = 'scale(1)';
  }, canAfford ? 350 : 0);

  updateGemDisplays();
  renderInventory();
}

document.addEventListener('DOMContentLoaded', updateGemDisplays);

// "Great Sage" Rule-Based Chat + Web Speech API voice
const SAGE_VOICE_KEY = 'msc_portfolio_sage_voice_on';
let sageVoiceOn = localStorage.getItem(SAGE_VOICE_KEY) !== 'false'; // defaults to on

const sageKnowledge = [
  {
    keywords: ['study', 'studying', 'school', 'college', 'university', 'course', 'ce', 'computer engineering', 'major'],
    response: "I'm studying Computer Engineering. Between coursework I build small games and web projects on the side — this site included."
  },
  {
    keywords: ['project', 'projects', 'building', 'build', 'godot', 'roblox', 'game dev', 'gamedev', 'code', 'coding'],
    response: "Current builds: a 2D survival game in Godot 4.7 with bullet-hell wave spawners, plus some Roblox side-projects with Luau scripting. This portfolio itself is vanilla JS, Tailwind, Three.js, and the Web Audio/Canvas APIs — no frameworks."
  },
  {
    keywords: ['genshin', 'build', 'abyss', 'ar', 'adventure rank', 'vision', 'artifact', 'weapon'],
    response: "On Genshin I'm AR 60 with 36-star Spiral Abyss clears, C6 Traveler. Check the live showcase card in the Genshin section for real-time character and artifact data pulled from Enka.network."
  },
  {
    keywords: ['channel', 'youtube', 'video', 'instagram', 'facebook', 'social', 'follow', 'subscribe', 'content'],
    response: "You can find my gameplay guides and shorts on YouTube, behind-the-scenes on Instagram, and community/stream updates on Facebook — all linked in the Honkai: Star Rail section."
  },
  {
    keywords: ['contact', 'email', 'message', 'hire', 'collab', 'collaboration', 'reach'],
    response: "Best way to reach me is the Dispatch Scroll contact form near the bottom of the site — I read every message."
  },
  {
    keywords: ['gem', 'primogem', 'wish', 'gacha', 'pull', 'inventory'],
    response: "You earn Primogems by exploring realms, trying Vision badges, and running Great Sage scans. Spend 160 on a Wish Pull from the header button, and check your haul in the Inventory drawer bottom-right."
  },
  {
    keywords: ['who are you', 'what are you', 'great sage', 'sage'],
    response: "I'm the Great Sage — a status-panel assistant modeled after Tensura's Great Sage, running entirely in your browser. No external AI service, just keyword matching and a synthesized voice."
  },
  {
    keywords: ['hello', 'hi', 'hey', 'greetings'],
    response: "Greetings, traveler. Ask me about Mark's Computer Engineering studies, his game dev projects, his Genshin build, or where to find his channels."
  }
];

const sageFallbackResponses = [
  "That's outside my current appraisal parameters. Try asking about studies, projects, Genshin, or channels.",
  "Unable to parse that query fully — I'm a simple keyword-matched assistant, not a full AI. Ask me something about Mark's work or games.",
  "Query not recognized. Try: \"what are you building\", \"genshin build\", or \"how do I contact you\"."
];

function getGreatSageResponse(userText) {
  const text = userText.toLowerCase();
  for (const entry of sageKnowledge) {
    if (entry.keywords.some((kw) => text.includes(kw))) {
      return entry.response;
    }
  }
  return sageFallbackResponses[Math.floor(Math.random() * sageFallbackResponses.length)];
}

function speakAsSage(text) {
  if (!sageVoiceOn) return;
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel(); // interrupt anything currently speaking
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 0.55;   // lower pitch — more "status panel" than human
    utterance.rate = 1.02;
    utterance.volume = audioMuted ? 0 : 0.9;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    /* speechSynthesis unavailable or blocked — fail silently */
  }
}

function toggleSageVoice() {
  sageVoiceOn = !sageVoiceOn;
  localStorage.setItem(SAGE_VOICE_KEY, String(sageVoiceOn));
  const icon = document.querySelector('#sage-voice-toggle i');
  if (icon) icon.className = `fa-solid ${sageVoiceOn ? 'fa-volume-high' : 'fa-volume-xmark'}`;
  const btn = document.getElementById('sage-voice-toggle');
  if (btn) btn.setAttribute('aria-pressed', String(sageVoiceOn));
  if (!sageVoiceOn && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}

function appendSageChatLine(role, text) {
  const log = document.getElementById('sage-chat-log');
  if (!log) return;
  const bubble = document.createElement('div');
  if (role === 'sage') {
    bubble.className = 'great-sage-notice rounded-xl px-3.5 py-2.5 border border-red-500/40 text-cyan-100 max-w-[85%]';
    bubble.innerHTML = `<span class="text-red-400 font-bold text-[10px] uppercase tracking-wider block mb-1">Great Sage</span>${text}`;
  } else {
    bubble.className = 'rounded-xl px-3.5 py-2.5 bg-cyan-950/40 border border-cyan-500/30 text-slate-100 max-w-[85%] ml-auto';
    bubble.innerHTML = `<span class="text-cyan-400 font-bold text-[10px] uppercase tracking-wider block mb-1">You</span>${text}`;
  }
  log.appendChild(bubble);
  log.scrollTop = log.scrollHeight;
}

function askGreatSage(question) {
  const trimmed = question.trim();
  if (!trimmed) return;
  appendSageChatLine('user', trimmed);
  playAppraiseBeep('scan');

  setTimeout(() => {
    const response = getGreatSageResponse(trimmed);
    appendSageChatLine('sage', response);
    speakAsSage(response);
  }, 400); // brief "thinking" delay for feel
}

function toggleSageChat(forceOpen) {
  const modal = document.getElementById('sage-chat-modal');
  if (!modal) return;
  const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : modal.classList.contains('hidden');

  if (shouldOpen) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';

    const log = document.getElementById('sage-chat-log');
    if (log && log.children.length === 0) {
      appendSageChatLine('sage', "Greetings, traveler. Ask me about Mark's Computer Engineering studies, game dev projects, Genshin build, or channel links.");
    }
    setTimeout(() => document.getElementById('sage-chat-input')?.focus(), 60);
  } else {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = 'auto';
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }
}

function closeSageChatIfOpen() {
  const modal = document.getElementById('sage-chat-modal');
  if (modal && !modal.classList.contains('hidden')) toggleSageChat(false);
}

document.addEventListener('DOMContentLoaded', () => {
  const icon = document.querySelector('#sage-voice-toggle i');
  if (icon) icon.className = `fa-solid ${sageVoiceOn ? 'fa-volume-high' : 'fa-volume-xmark'}`;
  const btn = document.getElementById('sage-voice-toggle');
  if (btn) btn.setAttribute('aria-pressed', String(sageVoiceOn));

  const sageChatForm = document.getElementById('sage-chat-form');
  const sageChatInput = document.getElementById('sage-chat-input');
  if (sageChatForm && sageChatInput) {
    sageChatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = sageChatInput.value;
      sageChatInput.value = '';
      askGreatSage(val);
    });
  }
});

// Live Enka.network Genshin Showcase
const GENSHIN_UID = '855112830';
const ENKA_CACHE_KEY = `msc_enka_cache_${GENSHIN_UID}`;
const ENKA_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function showEnkaState(state) {
  document.getElementById('enka-loading')?.classList.toggle('hidden', state !== 'loading');
  document.getElementById('enka-error')?.classList.toggle('hidden', state !== 'error');
  document.getElementById('enka-content')?.classList.toggle('hidden', state !== 'content');
}

function renderEnkaData(data) {
  const playerInfo = data.playerInfo || {};
  document.getElementById('enka-ar').textContent = playerInfo.level ?? '—';
  document.getElementById('enka-nickname').textContent = playerInfo.nickname ?? '—';
  document.getElementById('enka-wl').textContent = playerInfo.worldLevel ?? '—';
  document.getElementById('enka-achievements').textContent = playerInfo.finishAchievementNum ?? '—';

  const charContainer = document.getElementById('enka-characters');
  if (!charContainer) return;

  const showcaseList = playerInfo.showAvatarInfoList || [];
  if (showcaseList.length === 0) {
    charContainer.innerHTML = `<div class="col-span-full text-center text-[#6fa8c4] text-xs py-4">Character Showcase is off for this UID — enable it in-game (Character Details) to display builds here.</div>`;
    return;
  }

  charContainer.innerHTML = showcaseList.map((c) => `
    <div class="bg-[#0b132b]/80 border border-[#e8c97a]/25 rounded-xl p-3 text-center">
      <div class="text-[#ffe8ad] font-bold text-xs sm:text-sm mb-0.5">Character #${c.avatarId}</div>
      <div class="text-[#6fa8c4] text-[10px] uppercase">Level ${c.level ?? '?'} &bull; C${c.talentLevel ? '' : '0'}</div>
    </div>
  `).join('');
}

async function fetchEnkaShowcase(forceRefresh = false) {
  showEnkaState('loading');

  // serve from cache when fresh, unless the visitor explicitly hit Refresh
  if (!forceRefresh) {
    try {
      const cached = JSON.parse(localStorage.getItem(ENKA_CACHE_KEY) || 'null');
      if (cached && Date.now() - cached.timestamp < ENKA_CACHE_TTL) {
        renderEnkaData(cached.data);
        showEnkaState('content');
        return;
      }
    } catch (err) {
      /* corrupt cache — ignore and refetch */
    }
  }

  try {
    const res = await fetch(`https://enka.network/api/uid/${GENSHIN_UID}`, {
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`Enka responded ${res.status}`);
    const data = await res.json();

    localStorage.setItem(ENKA_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
    renderEnkaData(data);
    showEnkaState('content');
  } catch (err) {
    // fall back to a stale cache if we have one, otherwise show the error state
    try {
      const cached = JSON.parse(localStorage.getItem(ENKA_CACHE_KEY) || 'null');
      if (cached) {
        renderEnkaData(cached.data);
        showEnkaState('content');
        return;
      }
    } catch (e2) { /* no cache either */ }
    showEnkaState('error');
  }
}

document.addEventListener('DOMContentLoaded', () => fetchEnkaShowcase(false));