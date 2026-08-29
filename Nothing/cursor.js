// Custom SVG Anime Cursor + Elemental Slash on Click

// Falls back to a sensible gold if script.js's themeColors isn't loaded yet
const CURSOR_FALLBACK_COLOR = '#ffe175';

function getActiveThemeColor() {
  if (typeof themeColors === 'object' && typeof currentMode === 'string') {
    return themeColors[currentMode] || CURSOR_FALLBACK_COLOR;
  }
  const themeAttr = document.body.getAttribute('data-theme');
  const staticMap = {
    genshin: '#ffe175', hsr: '#c084fc', wuwa: '#00f2fe',
    tensura: '#ef4444', rezero: '#e879f9', mushoku: '#34d399'
  };
  return staticMap[themeAttr] || CURSOR_FALLBACK_COLOR;
}

/* Builds a tiny SVG data-URI cursor (crosshair diamond) tinted to a hex color */
function buildCursorDataUri(hex, hovered) {
  const c = encodeURIComponent(hex);
  const size = hovered ? 30 : 22;
  const svg = hovered
    ? `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 30 30'>
         <circle cx='15' cy='15' r='10' fill='none' stroke='${c}' stroke-width='2' opacity='0.9'/>
         <path d='M15 2 L17 12 L15 15 L13 12 Z' fill='${c}'/>
         <path d='M15 28 L17 18 L15 15 L13 18 Z' fill='${c}'/>
         <path d='M2 15 L12 13 L15 15 L12 17 Z' fill='${c}'/>
         <path d='M28 15 L18 13 L15 15 L18 17 Z' fill='${c}'/>
         <circle cx='15' cy='15' r='2.4' fill='${c}'/>
       </svg>`
    : `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 22 22'>
         <path d='M11 1 L12.6 9.4 L11 11 L9.4 9.4 Z' fill='${c}'/>
         <path d='M11 21 L12.6 12.6 L11 11 L9.4 12.6 Z' fill='${c}' opacity='0.8'/>
         <path d='M1 11 L9.4 9.4 L11 11 L9.4 12.6 Z' fill='${c}' opacity='0.8'/>
         <path d='M21 11 L12.6 9.4 L11 11 L12.6 12.6 Z' fill='${c}' opacity='0.8'/>
         <circle cx='11' cy='11' r='1.8' fill='${c}'/>
       </svg>`;
  return `url("data:image/svg+xml,${svg}") ${size / 2} ${size / 2}, auto`;
}

let cursorStyleTag = null;
let lastCursorColor = null;

function applyCursorForCurrentTheme(force) {
  // Skip entirely on touch-only devices — no pointer to render a cursor for
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

  const color = getActiveThemeColor();
  if (!force && color === lastCursorColor) return;
  lastCursorColor = color;

  if (!cursorStyleTag) {
    cursorStyleTag = document.createElement('style');
    cursorStyleTag.id = 'anime-cursor-style';
    document.head.appendChild(cursorStyleTag);
  }

  const defaultCursor = buildCursorDataUri(color, false);
  const hoverCursor = buildCursorDataUri(color, true);

  cursorStyleTag.textContent = `
    html, body { cursor: ${defaultCursor}; }
    a, button, [role="button"], input, textarea, select, .vision-badge,
    .circuit-io-btn, .circuit-gate-btn, [data-sfx-click], .wuwa-terminal,
    .hsr-social-card, .genshin-card [onclick] {
      cursor: ${hoverCursor};
    }
  `;
}

/* ------------------------------------------------------------------
   Click slash + particle trail — a dedicated full-viewport canvas
   layered above everything (pointer-events: none) so it never
   interferes with real clicks on the page underneath.
------------------------------------------------------------------- */
let slashCanvas, slashCtx;
let slashes = [];
let slashParticles = [];

function buildSlashCanvas() {
  slashCanvas = document.createElement('canvas');
  slashCanvas.id = 'anime-slash-canvas';
  slashCanvas.style.cssText = 'position:fixed;inset:0;z-index:9998;pointer-events:none;';
  document.body.appendChild(slashCanvas);
  slashCtx = slashCanvas.getContext('2d');

  const resize = () => {
    slashCanvas.width = window.innerWidth;
    slashCanvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);
}

function spawnSlash(x, y, color) {
  const angle = Math.random() * Math.PI - Math.PI / 2; // roughly diagonal, varies per click
  slashes.push({
    x, y, angle,
    length: 70,
    progress: 0,
    color,
    life: 1
  });

  // radial particle burst alongside the slash
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3.5 + 1.5;
    slashParticles.push({
      x, y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      size: Math.random() * 2.5 + 1,
      alpha: 1,
      color
    });
  }
}

function drawSlashFrame() {
  requestAnimationFrame(drawSlashFrame);
  if (!slashCtx) return;
  slashCtx.clearRect(0, 0, slashCanvas.width, slashCanvas.height);

  // slash streaks
  for (let i = slashes.length - 1; i >= 0; i--) {
    const s = slashes[i];
    s.progress += 0.14;
    s.life -= 0.05;
    if (s.life <= 0) { slashes.splice(i, 1); continue; }

    const len = s.length * Math.min(s.progress, 1);
    const dx = Math.cos(s.angle) * len;
    const dy = Math.sin(s.angle) * len;

    slashCtx.save();
    slashCtx.globalAlpha = Math.max(s.life, 0);
    slashCtx.strokeStyle = s.color;
    slashCtx.lineWidth = 3;
    slashCtx.shadowBlur = 14;
    slashCtx.shadowColor = s.color;
    slashCtx.lineCap = 'round';
    slashCtx.beginPath();
    slashCtx.moveTo(s.x - dx / 2, s.y - dy / 2);
    slashCtx.lineTo(s.x + dx / 2, s.y + dy / 2);
    slashCtx.stroke();
    slashCtx.restore();
  }

  // particle burst
  for (let i = slashParticles.length - 1; i >= 0; i--) {
    const p = slashParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.94;
    p.vy *= 0.94;
    p.alpha -= 0.03;
    if (p.alpha <= 0) { slashParticles.splice(i, 1); continue; }

    slashCtx.save();
    slashCtx.globalAlpha = Math.max(p.alpha, 0);
    slashCtx.fillStyle = p.color;
    slashCtx.shadowBlur = 8;
    slashCtx.shadowColor = p.color;
    slashCtx.beginPath();
    slashCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    slashCtx.fill();
    slashCtx.restore();
  }
}

document.addEventListener('click', (e) => {
  spawnSlash(e.clientX, e.clientY, getActiveThemeColor());
});

/* Re-tint the cursor whenever the active section changes — polls
   currentMode cheaply rather than hooking script.js's observer directly,
   matching the same low-coupling approach used elsewhere in these files. */
let lastKnownCursorMode = null;
setInterval(() => {
  const mode = typeof currentMode === 'string' ? currentMode : document.body.getAttribute('data-theme');
  if (mode !== lastKnownCursorMode) {
    lastKnownCursorMode = mode;
    applyCursorForCurrentTheme(true);
  }
}, 400);

document.addEventListener('DOMContentLoaded', () => {
  buildSlashCanvas();
  applyCursorForCurrentTheme(true);
  drawSlashFrame();
});