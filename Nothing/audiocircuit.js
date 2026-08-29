// Web Audio Crossfading Soundscape
const AMBIENT_TRACKS = {
  genshin: { name: 'columbina', src: 'audio/genshin.mp3' },
  hsr: { name: 'Hope Is the Thing With Feathers', src: 'audio/Hope Is the Thing With Feathers.mp3' },
};

const MUSIC_MUTE_KEY = 'msc_portfolio_music_muted';
const CROSSFADE_SECONDS = 1.6;

const musicState = {
  muted: localStorage.getItem(MUSIC_MUTE_KEY) === 'true',
  playing: false,
  currentSection: null,
  elements: {}, // sectionId -> { audio, source, gain }
  ready: false
};

function buildMusicGraph() {
  const ctx = typeof ensureAudioContext === 'function' ? ensureAudioContext() : null;
  if (!ctx || musicState.ready) return;

  Object.entries(AMBIENT_TRACKS).forEach(([sectionId, track]) => {
    const audio = new Audio(track.src);
    audio.loop = true;
    audio.crossOrigin = 'anonymous';
    audio.preload = 'none'; // don't hammer the network for 6 tracks on load

    const source = ctx.createMediaElementSource(audio);
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(gain).connect(ctx.destination);

    musicState.elements[sectionId] = { audio, source, gain };
  });

  musicState.ready = true;
}

function crossfadeToSection(sectionId) {
  if (!musicState.playing || !musicState.ready) return;
  const ctx = typeof ensureAudioContext === 'function' ? ensureAudioContext() : null;
  if (!ctx) return;

  const incoming = musicState.elements[sectionId];
  const outgoingId = musicState.currentSection;
  const outgoing = outgoingId && outgoingId !== sectionId ? musicState.elements[outgoingId] : null;
  if (!incoming || sectionId === musicState.currentSection) return;

  const now = ctx.currentTime;
  const targetVol = musicState.muted ? 0 : 0.35;

  if (incoming.audio.paused) incoming.audio.play().catch(() => {});
  incoming.gain.gain.cancelScheduledValues(now);
  incoming.gain.gain.setValueAtTime(incoming.gain.gain.value, now);
  incoming.gain.gain.linearRampToValueAtTime(targetVol, now + CROSSFADE_SECONDS);

  if (outgoing) {
    outgoing.gain.gain.cancelScheduledValues(now);
    outgoing.gain.gain.setValueAtTime(outgoing.gain.gain.value, now);
    outgoing.gain.gain.linearRampToValueAtTime(0, now + CROSSFADE_SECONDS);
    setTimeout(() => { if (!outgoing.audio.paused) outgoing.audio.pause(); }, CROSSFADE_SECONDS * 1000 + 100);
  }

  musicState.currentSection = sectionId;
  updateMusicBarUI();
}

function toggleMusicPlayback() {
  buildMusicGraph();
  musicState.playing = !musicState.playing;

  if (musicState.playing) {
    const target = musicState.currentSection || currentMode || 'genshin';
    musicState.currentSection = null; // force crossfadeToSection to actually start it
    crossfadeToSection(target);
  } else {
    Object.values(musicState.elements).forEach(({ audio, gain }) => {
      gain.gain.linearRampToValueAtTime(0, (typeof audioCtx !== 'undefined' && audioCtx ? audioCtx.currentTime : 0) + 0.4);
      setTimeout(() => audio.pause(), 450);
    });
  }
  updateMusicBarUI();
}

function toggleMusicMute() {
  musicState.muted = !musicState.muted;
  localStorage.setItem(MUSIC_MUTE_KEY, String(musicState.muted));
  const active = musicState.elements[musicState.currentSection];
  if (active && musicState.playing) {
    const ctx = typeof ensureAudioContext === 'function' ? ensureAudioContext() : null;
    const now = ctx ? ctx.currentTime : 0;
    active.gain.gain.linearRampToValueAtTime(musicState.muted ? 0 : 0.35, now + 0.3);
  }
  updateMusicBarUI();
}

function updateMusicBarUI() {
  const playIcon = document.getElementById('music-play-icon');
  const muteIcon = document.getElementById('music-mute-icon');
  const trackName = document.getElementById('music-track-name');
  if (playIcon) playIcon.className = `fa-solid ${musicState.playing ? 'fa-pause' : 'fa-play'}`;
  if (muteIcon) muteIcon.className = `fa-solid ${musicState.muted ? 'fa-volume-xmark' : 'fa-volume-low'}`;
  if (trackName) {
    trackName.textContent = musicState.playing && musicState.currentSection
      ? AMBIENT_TRACKS[musicState.currentSection]?.name || '—'
      : 'Paused';
  }
}

// Hook into the section scrollspy that already exists in script.js: whenever
// currentMode changes because a new .universe-section scrolled into view,
// crossfade the soundscape to match — without touching the original observer.
let lastKnownMusicSection = null;
setInterval(() => {
  if (typeof currentMode !== 'undefined' && currentMode !== lastKnownMusicSection) {
    lastKnownMusicSection = currentMode;
    crossfadeToSection(currentMode);
  }
}, 400);

document.addEventListener('DOMContentLoaded', updateMusicBarUI);

// Computer Engineering Logic Circuit Sandbox
const circuitState = { inputA: 0, inputB: 0, gate: 'AND' };
const solvedGates = new Set();

const gateFns = {
  AND: (a, b) => a & b,
  OR: (a, b) => a | b,
  XOR: (a, b) => a ^ b
};

function circuitToggleInput(which) {
  circuitState[which] = circuitState[which] ? 0 : 1;
  evaluateCircuit();
}

function circuitSetGate(gate) {
  circuitState.gate = gate;
  document.querySelectorAll('.circuit-gate-btn').forEach((btn) => {
    btn.classList.toggle('circuit-gate-active', btn.dataset.gate === gate);
  });
  evaluateCircuit();
}

function onCircuitSuccess(gate) {
  // Success callback — customize freely. Defaults: SFX + achievement once
  // all three gate types have been solved at least once.
  if (typeof playAppraiseBeep === 'function') playAppraiseBeep('complete');
  solvedGates.add(gate);
  if (solvedGates.size >= 3 && typeof unlockAchievement === 'function') {
    unlockAchievement('logic-master');
  }
}

function evaluateCircuit() {
  const { inputA, inputB, gate } = circuitState;
  const output = gateFns[gate](inputA, inputB);

  const btnA = document.getElementById('circuit-input-a');
  const btnB = document.getElementById('circuit-input-b');
  const led = document.getElementById('circuit-output-led');
  const outputLabel = document.getElementById('circuit-output-label');

  if (btnA) { btnA.textContent = inputA; btnA.classList.toggle('circuit-input-on', !!inputA); }
  if (btnB) { btnB.textContent = inputB; btnB.classList.toggle('circuit-input-on', !!inputB); }
  if (led) led.classList.toggle('circuit-led-on', !!output);
  if (outputLabel) outputLabel.textContent = output ? '1' : '0';

  if (output) onCircuitSuccess(gate);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('circuit-input-a')?.addEventListener('click', () => circuitToggleInput('inputA'));
  document.getElementById('circuit-input-b')?.addEventListener('click', () => circuitToggleInput('inputB'));
  document.querySelectorAll('.circuit-gate-btn').forEach((btn) => {
    btn.addEventListener('click', () => circuitSetGate(btn.dataset.gate));
  });
  evaluateCircuit();
});

// Register the new achievement alongside the existing ones defined in script.js.
if (typeof ACHIEVEMENTS === 'object') {
  ACHIEVEMENTS['logic-master'] = {
    title: 'Logic Master',
    desc: 'Lit the output LED on all 3 logic gates',
    icon: 'fa-solid fa-microchip'
  };
}