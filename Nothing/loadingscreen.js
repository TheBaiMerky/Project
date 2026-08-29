// "Omniverse Launcher" Loading Screen (HSR-style)

function buildDomainDOM() {
  if (document.getElementById('domain-expansion-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'domain-expansion-overlay';
  overlay.className = 'domain-overlay';
  overlay.innerHTML = `
    <canvas id="domain-starfield" aria-hidden="true"></canvas>
    <div class="domain-nebula" aria-hidden="true"></div>

    <div class="domain-train-wrap" aria-hidden="true">
      <div class="domain-train-track"></div>
      <svg class="domain-train" viewBox="0 0 460 130" xmlns="http://www.w3.org/2000/svg">
        <!-- light trail -->
        <path class="domain-train-trail" d="M0 88 L140 88" />

        <!-- rear carriage: flat roof, small raised skylight, undercarriage skirt -->
        <g class="domain-train-carriage">
          <path d="M40 96
                   L40 62
                   Q40 56 46 56
                   L150 56
                   Q156 56 156 62
                   L156 96 Z" class="domain-train-body" />
          <!-- roofline skylight bump -->
          <path d="M64 56 Q64 48 72 48 L124 48 Q132 48 132 56 Z" class="domain-train-body" />
          <!-- windows -->
          <rect x="52" y="66" width="20" height="18" rx="3" class="domain-train-window" />
          <rect x="80" y="66" width="20" height="18" rx="3" class="domain-train-window" />
          <rect x="108" y="66" width="20" height="18" rx="3" class="domain-train-window" />
          <!-- undercarriage skirt tapering down -->
          <path d="M40 96 L34 108 L162 108 L156 96 Z" class="domain-train-skirt" />
          <circle cx="60" cy="112" r="8" class="domain-train-wheel" />
          <line x1="60" y1="104" x2="60" y2="120" class="domain-train-wheel-spoke" style="transform-origin: 60px 112px" />
          <circle cx="136" cy="112" r="8" class="domain-train-wheel" />
          <line x1="136" y1="104" x2="136" y2="120" class="domain-train-wheel-spoke" style="transform-origin: 136px 112px" />
        </g>

        <!-- coupling gap -->
        <rect x="160" y="90" width="6" height="6" class="domain-train-coupling" />

        <!-- engine car: sloped streamlined nose, raised driver's cab, chimney/vent -->
        <g class="domain-train-engine">
          <path d="M170 96
                   L170 60
                   Q170 54 176 54
                   L296 54
                   Q306 54 312 62
                   L344 92
                   Q348 96 342 98
                   L170 98 Z" class="domain-train-body-main" />

          <!-- raised cab section -->
          <path d="M184 54 Q184 44 194 44 L246 44 Q254 44 254 54 Z" class="domain-train-body-main" />

          <!-- small chimney/vent -->
          <rect x="212" y="34" width="10" height="12" rx="2" class="domain-train-chimney" />

          <!-- cab windows -->
          <rect x="194" y="62" width="18" height="16" rx="3" class="domain-train-window-glow" />
          <rect x="222" y="62" width="18" height="16" rx="3" class="domain-train-window-glow" />

          <!-- sloped nose window (single, angled feel via trapezoid) -->
          <path d="M256 66 L282 66 L296 80 L270 82 Z" class="domain-train-window-glow" />

          <!-- undercarriage skirt -->
          <path d="M170 96 L164 110 L348 110 L340 96 Z" class="domain-train-skirt" />
          <circle cx="196" cy="114" r="9" class="domain-train-wheel" />
          <line x1="196" y1="105" x2="196" y2="123" class="domain-train-wheel-spoke" style="transform-origin: 196px 114px" />
          <circle cx="248" cy="114" r="9" class="domain-train-wheel" />
          <line x1="248" y1="105" x2="248" y2="123" class="domain-train-wheel-spoke" style="transform-origin: 248px 114px" />
          <circle cx="300" cy="114" r="8" class="domain-train-wheel" />
          <line x1="300" y1="106" x2="300" y2="122" class="domain-train-wheel-spoke" style="transform-origin: 300px 114px" />

          <!-- headlight beam at the very front of the nose -->
          <ellipse cx="340" cy="82" rx="28" ry="9" class="domain-train-headlight" />
          <circle cx="316" cy="84" r="4" class="domain-train-headlight-dot" />
        </g>
      </svg>
    </div>

    <div class="domain-title">
      <span class="domain-title-main">OMNIVERSE</span>
      <span class="domain-title-sub">ALL ABOARD THE ASTRAL EXPRESS</span>
    </div>

    <div class="domain-version" aria-hidden="true">MSC_Portfolio_v1.0.5_Build_2026</div>

    <button id="domain-start-btn" type="button" class="domain-start-bar">
      <span class="domain-start-label">Click to Start</span>
    </button>
  `;
  document.body.appendChild(overlay);

  const replayBtn = document.createElement('button');
  replayBtn.id = 'domain-replay-btn';
  replayBtn.type = 'button';
  replayBtn.title = 'Replay launcher intro';
  replayBtn.setAttribute('aria-label', 'Replay loading intro');
  replayBtn.innerHTML = '<i class="fa-solid fa-torii-gate"></i>';
  replayBtn.addEventListener('click', () => playDomainExpansion());
  document.body.appendChild(replayBtn);
}

/* ------------------------------------------------------------------
   Starfield — small drifting points, twinkling at varied rates.
------------------------------------------------------------------- */
let domainStars = [];
let domainStarCtx = null;

function initDomainStarfield() {
  const canvas = document.getElementById('domain-starfield');
  if (!canvas) return;
  domainStarCtx = canvas.getContext('2d');

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  domainStars = Array.from({ length: 160 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: Math.random() * 1.4 + 0.3,
    baseAlpha: Math.random() * 0.6 + 0.2,
    twinkleSpeed: Math.random() * 0.02 + 0.005,
    twinklePhase: Math.random() * Math.PI * 2,
    driftX: (Math.random() - 0.5) * 0.05,
    driftY: (Math.random() - 0.5) * 0.05
  }));

  (function drawStars() {
    requestAnimationFrame(drawStars);
    const overlay = document.getElementById('domain-expansion-overlay');
    if (!overlay || !overlay.classList.contains('domain-active')) return;
    if (!domainStarCtx) return;

    domainStarCtx.clearRect(0, 0, canvas.width, canvas.height);
    domainStars.forEach((s) => {
      s.twinklePhase += s.twinkleSpeed;
      s.x += s.driftX;
      s.y += s.driftY;
      if (s.x < 0) s.x = canvas.width;
      if (s.x > canvas.width) s.x = 0;
      if (s.y < 0) s.y = canvas.height;
      if (s.y > canvas.height) s.y = 0;

      const alpha = s.baseAlpha + Math.sin(s.twinklePhase) * 0.25;
      domainStarCtx.save();
      domainStarCtx.globalAlpha = Math.max(alpha, 0);
      domainStarCtx.fillStyle = '#dbeeff';
      domainStarCtx.shadowBlur = 4;
      domainStarCtx.shadowColor = '#8ad9ff';
      domainStarCtx.beginPath();
      domainStarCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      domainStarCtx.fill();
      domainStarCtx.restore();
    });
  })();
}

/* ------------------------------------------------------------------
   Show / hide sequence — no auto-dismiss timer; a real click on the
   "Click to Start" bar is what closes it and unlocks the page.
------------------------------------------------------------------- */
function playDomainExpansion() {
  const overlay = document.getElementById('domain-expansion-overlay');
  if (!overlay) return;

  overlay.classList.remove('domain-exit');
  overlay.classList.add('domain-active');
  document.body.style.overflow = 'hidden';
}

function dismissDomainExpansion() {
  const overlay = document.getElementById('domain-expansion-overlay');
  if (!overlay) return;

  overlay.classList.add('domain-exit');
  setTimeout(() => {
    overlay.classList.remove('domain-active', 'domain-exit');
    document.body.style.overflow = '';
  }, 700);

  if (typeof playClickSFX === 'function') playClickSFX();
}

document.addEventListener('DOMContentLoaded', () => {
  buildDomainDOM();
  initDomainStarfield();
  document.getElementById('domain-start-btn')?.addEventListener('click', dismissDomainExpansion);

  // Gate the page behind the launcher on every fresh load.
  requestAnimationFrame(() => playDomainExpansion());
});