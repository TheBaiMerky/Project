// Paimon Mascot Companion

const PAIMON_HIDE_KEY = 'msc_portfolio_paimon_hidden';

const paimonState = {
  hidden: localStorage.getItem(PAIMON_HIDE_KEY) === 'true',
  mouse: { x: window.innerWidth - 100, y: window.innerHeight - 100 },
  eye: { x: 0, y: 0 },       // current lerped pupil offset
  eyeTarget: { x: 0, y: 0 },
  tilt: 0,                   // current lerped head tilt (deg)
  tiltTarget: 0,
  blink: 1,                  // 1 = open, 0 = closed
  mood: 'idle',               // idle | happy | surprised | talking
  bounce: 0,                 // click-reaction bounce progress (0..1, -1 = inactive)
  spin: 0,                   // click-reaction spin in degrees
  idleTimer: null,
  lastMessageAt: 0,
  typing: false,
  canvas: null,
  ctx: null
};

const paimonLines = {
  wish: ["Ooh! Feeling lucky today?", "160 gems well spent, hehe!"],
  tensura: ["Great Sage is appraising your status...", "Ehh, a talking slime AI? Weird world."],
  gameCard: ["Merky is the Best Bai though!", "Ooh, tell me more about this one!"],
  idle: ["Need a hint? Try clicking the Vision badges!", "Paimon is getting bored, nyah~", "Psst, have you tried the Wish Pull?"],
  click: ["Hey! Don't poke me!", "Wah! What was that for?!", "Paimon is ticklish, stop it!"],
  greeting: ["Paimon's here to help!", "Hello, traveler!"]
};

let paimonMessageQueue = [];
let paimonTypewriterHandle = null;

/* ------------------------------------------------------------------
   DOM scaffold — injected once so this file has zero HTML dependency
------------------------------------------------------------------- */
function buildPaimonDOM() {
  if (document.getElementById('paimon-root')) return;

  const root = document.createElement('div');
  root.id = 'paimon-root';
  root.innerHTML = `
    <div id="paimon-bubble" class="paimon-bubble hidden" role="status" aria-live="polite">
      <span id="paimon-bubble-text"></span>
    </div>
    <button id="paimon-toggle" type="button" aria-label="Show Paimon" class="paimon-toggle hidden" title="Show Paimon">
      <i class="fa-solid fa-wand-magic-sparkles"></i>
    </button>
    <div id="paimon-wrap" class="paimon-wrap">
      <button id="paimon-hide-btn" type="button" aria-label="Minimize Paimon" title="Minimize Paimon" class="paimon-hide-btn">
        <i class="fa-solid fa-minus"></i>
      </button>
      <canvas id="paimon-canvas" width="140" height="140" aria-label="Paimon, your floating companion"></canvas>
    </div>
  `;
  document.body.appendChild(root);
}

/* ------------------------------------------------------------------
   Canvas rendering — simple chibi "Paimon" built from primitives so
   there's no external sprite/Live2D dependency.
------------------------------------------------------------------- */
function drawPaimon() {
  const { ctx, canvas } = paimonState;
  if (!ctx || !canvas) return;
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.save();
  ctx.translate(w / 2, h / 2 + 6);
  ctx.rotate((paimonState.tilt * Math.PI) / 180);

  // click-reaction spin/bounce
  if (paimonState.bounce >= 0) {
    ctx.rotate((paimonState.spin * Math.PI) / 180);
    ctx.translate(0, -Math.sin(paimonState.bounce * Math.PI) * 14);
  }

  // floating "cape" / body (teardrop)
  ctx.fillStyle = '#f4ecd8';
  ctx.strokeStyle = '#2b2440';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 30);
  ctx.quadraticCurveTo(-30, 26, -26, 0);
  ctx.quadraticCurveTo(-22, -20, 0, -26);
  ctx.quadraticCurveTo(22, -20, 26, 0);
  ctx.quadraticCurveTo(30, 26, 0, 30);
  ctx.fill();
  ctx.stroke();

  // gold trim
  ctx.strokeStyle = '#e8c97a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -2, 20, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();

  // hood shadow (head)
  ctx.fillStyle = '#2b2440';
  ctx.beginPath();
  ctx.ellipse(0, -6, 24, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // face
  ctx.fillStyle = '#fff3e0';
  ctx.beginPath();
  ctx.ellipse(0, -2, 17, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // blush
  ctx.fillStyle = 'rgba(255,150,170,0.55)';
  ctx.beginPath();
  ctx.ellipse(-11, 2, 3.2, 2, 0, 0, Math.PI * 2);
  ctx.ellipse(11, 2, 3.2, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // eyes (track cursor via paimonState.eye, blink via paimonState.blink)
  const eyeY = -3;
  const blinkScale = paimonState.blink;
  [-7, 7].forEach((ex) => {
    ctx.save();
    ctx.translate(ex, eyeY);
    ctx.scale(1, Math.max(blinkScale, 0.08));

    // sclera
    ctx.fillStyle = '#241b35';
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // pupil highlight — moves toward cursor, clamped to a small radius
    ctx.fillStyle = paimonState.mood === 'happy' ? '#ffe175' : '#8ad9ff';
    ctx.beginPath();
    ctx.ellipse(paimonState.eye.x * 2.2, paimonState.eye.y * 2.2, 2, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(paimonState.eye.x * 2.2 - 1, paimonState.eye.y * 2.2 - 1.4, 0.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });

  // mouth — changes with mood
  ctx.strokeStyle = '#2b2440';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  if (paimonState.mood === 'happy' || paimonState.mood === 'talking') {
    ctx.arc(0, 6, 4, 0.15 * Math.PI, 0.85 * Math.PI);
  } else if (paimonState.mood === 'surprised') {
    ctx.ellipse(0, 7, 2.2, 3, 0, 0, Math.PI * 2);
  } else {
    ctx.moveTo(-3, 7);
    ctx.quadraticCurveTo(0, 9, 3, 7);
  }
  ctx.stroke();

  // small floating side-tails (Paimon's signature side bits)
  ctx.fillStyle = '#f4ecd8';
  ctx.strokeStyle = '#2b2440';
  ctx.lineWidth = 2;
  [[-26, -8, -1], [26, -8, 1]].forEach(([tx, ty, dir]) => {
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(dir * 0.3 + Math.sin(Date.now() / 500) * 0.08);
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });

  ctx.restore();
}

/* ------------------------------------------------------------------
   Particle burst on click — small theme-colored puff using its own
   lightweight canvas overlay (kept separate from the universe canvas
   in script.js so this file has no coupling to it).
------------------------------------------------------------------- */
let paimonParticles = [];
function firePaimonBurst() {
  const colors = ['#ffe175', '#8ad9ff', '#e8c97a', '#ffffff'];
  for (let i = 0; i < 18; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2.2 + 0.8;
    paimonParticles.push({
      x: 70, y: 70,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 2.5 + 1.5,
      alpha: 1,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
}

function drawPaimonParticles() {
  const { ctx } = paimonState;
  if (!ctx) return;
  for (let i = paimonParticles.length - 1; i >= 0; i--) {
    const p = paimonParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.03;
    p.alpha -= 0.02;
    if (p.alpha <= 0) { paimonParticles.splice(i, 1); continue; }
    ctx.save();
    ctx.globalAlpha = Math.max(p.alpha, 0);
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/* ------------------------------------------------------------------
   Animation loop — lerps eyes/tilt toward targets, handles blinking,
   click-bounce progress, and redraws each frame.
------------------------------------------------------------------- */
function lerp(a, b, t) { return a + (b - a) * t; }

let nextBlinkAt = performance.now() + 2000 + Math.random() * 3000;

function paimonTick() {
  requestAnimationFrame(paimonTick);
  if (paimonState.hidden) return;

  paimonState.eye.x = lerp(paimonState.eye.x, paimonState.eyeTarget.x, 0.12);
  paimonState.eye.y = lerp(paimonState.eye.y, paimonState.eyeTarget.y, 0.12);
  paimonState.tilt = lerp(paimonState.tilt, paimonState.tiltTarget, 0.08);

  // blink cycle
  const now = performance.now();
  if (now > nextBlinkAt) {
    paimonState.blink = 0;
    setTimeout(() => { paimonState.blink = 1; }, 110);
    nextBlinkAt = now + 2500 + Math.random() * 3500;
  }

  // click-reaction bounce/spin decay
  if (paimonState.bounce >= 0) {
    paimonState.bounce += 0.045;
    paimonState.spin = Math.sin(paimonState.bounce * Math.PI * 2) * 12 * (1 - paimonState.bounce);
    if (paimonState.bounce >= 1) {
      paimonState.bounce = -1;
      paimonState.spin = 0;
      if (paimonState.mood === 'surprised') paimonState.mood = 'idle';
    }
  }

  drawPaimon();
  drawPaimonParticles();
}

/* ------------------------------------------------------------------
   Cursor tracking — updates eye/head targets toward the pointer,
   relative to Paimon's on-screen position.
------------------------------------------------------------------- */
function updatePaimonTargetFromPointer(clientX, clientY) {
  const wrap = document.getElementById('paimon-wrap');
  if (!wrap) return;
  const rect = wrap.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const dx = clientX - cx;
  const dy = clientY - cy;
  const dist = Math.hypot(dx, dy) || 1;
  const maxPupil = 2.6;

  paimonState.eyeTarget.x = (dx / dist) * Math.min(maxPupil, dist / 40);
  paimonState.eyeTarget.y = (dy / dist) * Math.min(maxPupil, dist / 40);
  paimonState.tiltTarget = Math.max(-10, Math.min(10, dx / 60));
}

document.addEventListener('mousemove', (e) => {
  paimonState.mouse = { x: e.clientX, y: e.clientY };
  updatePaimonTargetFromPointer(e.clientX, e.clientY);
  resetPaimonIdleTimer();
});

/* ------------------------------------------------------------------
   Speech bubble + typewriter dialogue engine
------------------------------------------------------------------- */
function showPaimonMessage(text, { mood = 'talking', duration = 3600 } = {}) {
  const bubble = document.getElementById('paimon-bubble');
  const textEl = document.getElementById('paimon-bubble-text');
  if (!bubble || !textEl || paimonState.hidden) return;

  clearTimeout(paimonTypewriterHandle);
  paimonState.mood = mood;
  bubble.classList.remove('hidden');
  bubble.classList.add('paimon-bubble-in');
  textEl.textContent = '';

  let i = 0;
  paimonState.typing = true;
  (function typeNext() {
    if (i < text.length) {
      textEl.textContent += text.charAt(i);
      i++;
      paimonTypewriterHandle = setTimeout(typeNext, 22);
    } else {
      paimonState.typing = false;
      setTimeout(() => {
        bubble.classList.remove('paimon-bubble-in');
        bubble.classList.add('paimon-bubble-out');
        setTimeout(() => {
          bubble.classList.add('hidden');
          bubble.classList.remove('paimon-bubble-out');
          if (paimonState.mood === 'talking') paimonState.mood = 'idle';
        }, 300);
      }, duration);
    }
  })();
}

function paimonSay(key) {
  const pool = paimonLines[key];
  if (!pool) return;
  const line = pool[Math.floor(Math.random() * pool.length)];
  showPaimonMessage(line, { mood: key === 'click' ? 'surprised' : 'talking' });
}

/* Idle-for-10-seconds hint */
function resetPaimonIdleTimer() {
  clearTimeout(paimonState.idleTimer);
  paimonState.idleTimer = setTimeout(() => {
    if (!paimonState.hidden && !paimonState.typing) paimonSay('idle');
  }, 10000);
}

/* ------------------------------------------------------------------
   Contextual triggers — wired to existing site elements. Each is
   optional-chained so missing elements just no-op.
------------------------------------------------------------------- */
function wirePaimonContextTriggers() {
  // 5★ Wish button (matches onclick="triggerWishPull()" in header + inventory drawer)
  document.querySelectorAll('button[onclick*="triggerWishPull"]').forEach((btn) => {
    btn.addEventListener('mouseenter', () => paimonSay('wish'));
  });

  // Tensura section entry — reuse the existing sectionObserver's target via a
  // dedicated lightweight observer so we don't touch script.js's internals.
  const tensuraSection = document.getElementById('tensura');
  if (tensuraSection) {
    let announced = false;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !announced) {
          announced = true;
          paimonSay('tensura');
        } else if (!entry.isIntersecting) {
          announced = false;
        }
      });
    }, { threshold: 0.4 });
    obs.observe(tensuraSection);
  }

  // Game cards in the Wuthering Waves "Games I Play" grid
  document.querySelectorAll('.wuwa-terminal').forEach((card) => {
    card.addEventListener('mouseenter', () => paimonSay('gameCard'));
  });
}

/* ------------------------------------------------------------------
   Click reaction — bounce/spin + happy-then-surprised expression +
   speech bubble + particle burst.
------------------------------------------------------------------- */
function handlePaimonClick() {
  paimonState.bounce = 0;
  paimonState.mood = 'surprised';
  firePaimonBurst();
  paimonSay('click');
  if (typeof playClickSFX === 'function') playClickSFX();
}

/* ------------------------------------------------------------------
   Minimize / restore toggle — persists to localStorage
------------------------------------------------------------------- */
function setPaimonHidden(hidden) {
  paimonState.hidden = hidden;
  localStorage.setItem(PAIMON_HIDE_KEY, String(hidden));

  const wrap = document.getElementById('paimon-wrap');
  const bubble = document.getElementById('paimon-bubble');
  const toggle = document.getElementById('paimon-toggle');

  wrap?.classList.toggle('hidden', hidden);
  toggle?.classList.toggle('hidden', !hidden);
  if (hidden) bubble?.classList.add('hidden');
}

/* ------------------------------------------------------------------
   Init
------------------------------------------------------------------- */
function initPaimon() {
  buildPaimonDOM();

  const canvas = document.getElementById('paimon-canvas');
  if (!canvas) return;
  paimonState.canvas = canvas;
  paimonState.ctx = canvas.getContext('2d');

  document.getElementById('paimon-hide-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    setPaimonHidden(true);
  });
  document.getElementById('paimon-toggle')?.addEventListener('click', () => setPaimonHidden(false));
  canvas.addEventListener('click', handlePaimonClick);

  setPaimonHidden(paimonState.hidden);
  wirePaimonContextTriggers();
  resetPaimonIdleTimer();
  paimonTick();

  // Friendly greeting shortly after load
  setTimeout(() => { if (!paimonState.hidden) paimonSay('greeting'); }, 1500);
}

document.addEventListener('DOMContentLoaded', initPaimon);