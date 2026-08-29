// Interactive "Honor Mark" (Like Counter) Button

const HONOR_MARK_KEY = 'msc_portfolio_honor_marks';

function getHonorMarks() {
  const raw = localStorage.getItem(HONOR_MARK_KEY);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

function buildHonorMarkDOM() {
  const footer = document.querySelector('#mushoku footer');
  if (!footer || document.getElementById('honor-mark-wrap')) return;

  const wrap = document.createElement('div');
  wrap.id = 'honor-mark-wrap';
  wrap.innerHTML = `
    <button id="honor-mark-btn" type="button" aria-label="Leave an Honor Mark">
      <span class="honor-mark-icon"><i class="fa-solid fa-star-of-life"></i></span>
      <span class="honor-mark-label">Leave an Honor Mark</span>
      <span id="honor-mark-count" class="honor-mark-count">0</span>
    </button>
    <canvas id="honor-mark-canvas"></canvas>
  `;
  footer.parentNode.insertBefore(wrap, footer.nextSibling);
}

let honorCanvas, honorCtx;
let honorParticles = [];

function honorThemeColor() {
  if (typeof themeColors === 'object' && typeof currentMode === 'string') {
    return themeColors[currentMode] || '#34d399';
  }
  return '#34d399'; // mushoku green — footer lives in the Mushoku section
}

function resizeHonorCanvas() {
  const btn = document.getElementById('honor-mark-btn');
  if (!honorCanvas || !btn) return;
  const rect = btn.getBoundingClientRect();
  honorCanvas.width = rect.width + 120;
  honorCanvas.height = rect.height + 120;
  honorCanvas.style.left = `${-60}px`;
  honorCanvas.style.top = `${-60}px`;
}

function fireHonorBurst() {
  const btn = document.getElementById('honor-mark-btn');
  if (!honorCanvas || !btn) return;
  resizeHonorCanvas();

  const cx = honorCanvas.width / 2;
  const cy = honorCanvas.height / 2;
  const color = honorThemeColor();

  for (let i = 0; i < 26; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4 + 1.5;
    honorParticles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 3 + 1.5,
      alpha: 1,
      color: Math.random() > 0.6 ? '#ffe175' : color
    });
  }
}

function drawHonorFrame() {
  requestAnimationFrame(drawHonorFrame);
  if (!honorCtx || !honorCanvas) return;
  honorCtx.clearRect(0, 0, honorCanvas.width, honorCanvas.height);

  for (let i = honorParticles.length - 1; i >= 0; i--) {
    const p = honorParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05;
    p.alpha -= 0.025;
    if (p.alpha <= 0) { honorParticles.splice(i, 1); continue; }

    honorCtx.save();
    honorCtx.globalAlpha = Math.max(p.alpha, 0);
    honorCtx.fillStyle = p.color;
    honorCtx.shadowBlur = 8;
    honorCtx.shadowColor = p.color;
    honorCtx.beginPath();
    honorCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    honorCtx.fill();
    honorCtx.restore();
  }
}

function handleHonorMarkClick() {
  const next = getHonorMarks() + 1;
  localStorage.setItem(HONOR_MARK_KEY, String(next));

  const countEl = document.getElementById('honor-mark-count');
  const btn = document.getElementById('honor-mark-btn');
  if (countEl) {
    countEl.textContent = next.toLocaleString();
    countEl.classList.remove('honor-count-pulse');
    void countEl.offsetWidth; // restart animation
    countEl.classList.add('honor-count-pulse');
  }
  btn?.classList.remove('honor-btn-pulse');
  void btn?.offsetWidth;
  btn?.classList.add('honor-btn-pulse');

  fireHonorBurst();
  if (typeof playAppraiseBeep === 'function') playAppraiseBeep('complete');
  else if (typeof playClickSFX === 'function') playClickSFX();
}

function initHonorMark() {
  buildHonorMarkDOM();
  const btn = document.getElementById('honor-mark-btn');
  const canvas = document.getElementById('honor-mark-canvas');
  const countEl = document.getElementById('honor-mark-count');
  if (!btn || !canvas) return;

  honorCanvas = canvas;
  honorCtx = canvas.getContext('2d');
  countEl.textContent = getHonorMarks().toLocaleString();

  resizeHonorCanvas();
  window.addEventListener('resize', resizeHonorCanvas);
  btn.addEventListener('click', handleHonorMarkClick);

  drawHonorFrame();
}

document.addEventListener('DOMContentLoaded', initHonorMark);