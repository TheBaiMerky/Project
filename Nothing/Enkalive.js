// Enka.network DEEP fetch — character stats, weapon, artifacts

// Human-readable labels for the fightProp keys Enka returns per character.
// (Enka doesn't ship EN name strings for these — they're documented IDs.)
const ENKA_FIGHT_PROPS = {
  2001: { label: 'HP', pct: false },
  2000: { label: 'ATK', pct: false },
  2002: { label: 'DEF', pct: false },
  28: { label: 'Elemental Mastery', pct: false },
  20: { label: 'CRIT Rate', pct: true },
  22: { label: 'CRIT DMG', pct: true },
  23: { label: 'Energy Recharge', pct: true },
  26: { label: 'Healing Bonus', pct: true }
};

function enkaIconUrl(iconName) {
  return iconName ? `https://enka.network/ui/${iconName}.png` : '';
}

function formatFightPropValue(id, value) {
  const meta = ENKA_FIGHT_PROPS[id];
  if (!meta) return null;
  return meta.pct ? `${(value * 100).toFixed(1)}%` : Math.round(value).toLocaleString();
}

/* Renders one character card: portrait, level/constellation, equipped
   weapon (name + refinement), 5 artifacts (icon + main stat), and the
   handful of combat stats visitors actually care about. */
function renderEnkaCharacterCard(avatar) {
  const level = avatar.propMap?.[4001]?.val ?? '?';
  const constellations = (avatar.talentIdList || []).length;

  const equipList = avatar.equipList || [];
  const weapon = equipList.find((e) => e.weapon);
  const artifacts = equipList.filter((e) => e.reliquary);

  const weaponName = weapon?.flat?.nameTextMapHash ? 'Weapon' : (weapon?.flat?.icon ? weapon.flat.icon.replace(/^UI_EquipIcon_/, '').replace(/_Awaken$/, '') : 'Weapon');
  const refinement = (weapon?.weapon?.affixMap && Object.values(weapon.weapon.affixMap)[0] != null)
    ? Object.values(weapon.weapon.affixMap)[0] + 1
    : 1;
  const weaponLevel = weapon?.weapon?.level ?? '?';

  const statRows = Object.entries(avatar.fightPropMap || {})
    .filter(([id]) => ENKA_FIGHT_PROPS[id])
    .map(([id, val]) => {
      const formatted = formatFightPropValue(Number(id), val);
      return formatted ? `<div class="flex items-center justify-between"><span class="text-[#6fa8c4]">${ENKA_FIGHT_PROPS[id].label}</span><span class="text-[#ffe8ad] font-bold">${formatted}</span></div>` : '';
    })
    .join('');

  const artifactChips = artifacts.map((a) => `
    <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden border border-[#e8c97a]/40 bg-[#0b132b] shrink-0" title="${a.flat?.setNameTextMapHash ? 'Artifact piece' : ''}">
      ${a.flat?.icon ? `<img src="${enkaIconUrl(a.flat.icon)}" alt="Artifact piece" class="w-full h-full object-cover" loading="lazy">` : ''}
    </div>
  `).join('');

  return `
    <div class="bg-[#0b132b]/80 border border-[#e8c97a]/25 rounded-xl p-3.5 text-left">
      <div class="flex items-center justify-between mb-2.5">
        <div>
          <div class="text-[#ffe8ad] font-bold text-xs sm:text-sm">Character #${avatar.avatarId}</div>
          <div class="text-[#6fa8c4] text-[10px] uppercase">Lv. ${level} &bull; C${constellations}</div>
        </div>
        ${weapon?.flat?.icon ? `<img src="${enkaIconUrl(weapon.flat.icon)}" alt="Equipped weapon" class="w-9 h-9 rounded-lg border border-[#e8c97a]/40 bg-[#0b132b] object-cover" loading="lazy">` : ''}
      </div>

      <div class="text-[10px] font-mono text-[#c3e0e5] mb-2">
        <span class="text-[#e8c97a] font-bold">R${refinement}</span> weapon &bull; Lv. ${weaponLevel}
      </div>

      ${artifactChips ? `<div class="flex gap-1.5 mb-2.5">${artifactChips}</div>` : ''}

      ${statRows ? `<div class="space-y-1 font-mono text-[10px] sm:text-[11px] border-t border-[#e8c97a]/15 pt-2">${statRows}</div>` : ''}
    </div>
  `;
}

/* Overrides the lightweight renderer from script.js with a deep-detail
   version. Falls back to the original summary card when Enka only
   returns showAvatarInfoList (no per-character equip/stat detail). */
function renderEnkaData(data) {
  const playerInfo = data.playerInfo || {};
  document.getElementById('enka-ar').textContent = playerInfo.level ?? '—';
  document.getElementById('enka-nickname').textContent = playerInfo.nickname ?? '—';
  document.getElementById('enka-wl').textContent = playerInfo.worldLevel ?? '—';
  document.getElementById('enka-achievements').textContent = playerInfo.finishAchievementNum ?? '—';

  const charContainer = document.getElementById('enka-characters');
  if (!charContainer) return;

  const detailed = data.avatarInfoList; // full detail — only present on a cache miss
  const summary = playerInfo.showAvatarInfoList || [];

  if (detailed && detailed.length > 0) {
    charContainer.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3';
    charContainer.innerHTML = detailed.map(renderEnkaCharacterCard).join('');
    return;
  }

  if (summary.length === 0) {
    charContainer.innerHTML = `<div class="col-span-full text-center text-[#6fa8c4] text-xs py-4">Character Showcase is off for this UID — enable it in-game (Character Details) to display builds here.</div>`;
    return;
  }

  // Degrade gracefully to the lightweight card when Enka served a cached, summary-only response.
  charContainer.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3';
  charContainer.innerHTML = summary.map((c) => `
    <div class="bg-[#0b132b]/80 border border-[#e8c97a]/25 rounded-xl p-3 text-center">
      <div class="text-[#ffe8ad] font-bold text-xs sm:text-sm mb-0.5">Character #${c.avatarId}</div>
      <div class="text-[#6fa8c4] text-[10px] uppercase">Level ${c.level ?? '?'}</div>
      <div class="text-[#6fa8c4] text-[9px] mt-1">Full build hidden — Enka served a cached summary. Hit Refresh in a moment.</div>
    </div>
  `).join('');
}

// Live Stream Header Indicator (YouTube + Twitch)
const YOUTUBE_API_KEY = 'YOUR_YOUTUBE_API_KEY';
const YOUTUBE_CHANNEL_ID = 'YOUR_YOUTUBE_CHANNEL_ID';
const TWITCH_CLIENT_ID = 'YOUR_TWITCH_CLIENT_ID';
const TWITCH_ACCESS_TOKEN = 'YOUR_TWITCH_APP_ACCESS_TOKEN'; // see note above — proxy this server-side
const TWITCH_LOGIN = 'your_twitch_username';
const LIVE_CHECK_INTERVAL = 120000; // 2 min — keep YouTube quota usage sane

let liveState = { platform: null, videoId: null };

async function checkYouTubeLive() {
  if (YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY') return null;
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${YOUTUBE_CHANNEL_ID}&eventType=live&type=video&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const item = (data.items || [])[0];
    return item ? { platform: 'youtube', videoId: item.id.videoId, title: item.snippet.title } : null;
  } catch (err) {
    return null;
  }
}

async function checkTwitchLive() {
  if (TWITCH_CLIENT_ID === 'YOUR_TWITCH_CLIENT_ID') return null;
  try {
    const res = await fetch(`https://api.twitch.tv/helix/streams?user_login=${TWITCH_LOGIN}`, {
      headers: {
        'Client-Id': TWITCH_CLIENT_ID,
        Authorization: `Bearer ${TWITCH_ACCESS_TOKEN}`
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const stream = (data.data || [])[0];
    return stream ? { platform: 'twitch', title: stream.title } : null;
  } catch (err) {
    return null;
  }
}

function showLiveBadge(result) {
  const badge = document.getElementById('live-badge');
  const label = document.getElementById('live-badge-platform');
  if (!badge) return;
  liveState = { platform: result.platform, videoId: result.videoId || null };
  if (label) label.textContent = result.platform === 'youtube' ? 'YouTube' : 'Twitch';
  badge.classList.remove('hidden');
}

function hideLiveBadge() {
  const badge = document.getElementById('live-badge');
  if (badge) badge.classList.add('hidden');
  liveState = { platform: null, videoId: null };
}

async function pollLiveStatus() {
  const [yt, twitch] = await Promise.all([checkYouTubeLive(), checkTwitchLive()]);
  const result = yt || twitch; // YouTube takes priority if both are live
  if (result) {
    showLiveBadge(result);
  } else {
    hideLiveBadge();
  }
}

function openLiveModal() {
  const modal = document.getElementById('live-modal');
  const frame = document.getElementById('live-modal-frame');
  if (!modal || !frame || !liveState.platform) return;

  if (liveState.platform === 'youtube') {
    const src = liveState.videoId
      ? `https://www.youtube.com/embed/${liveState.videoId}?autoplay=1`
      : `https://www.youtube.com/embed/live_stream?channel=${YOUTUBE_CHANNEL_ID}&autoplay=1`;
    frame.src = src;
  } else if (liveState.platform === 'twitch') {
    // NOTE: `parent` must exactly match the domain the page is served from.
    frame.src = `https://player.twitch.tv/?channel=${TWITCH_LOGIN}&parent=${window.location.hostname}&autoplay=true`;
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

function closeLiveModal() {
  const modal = document.getElementById('live-modal');
  const frame = document.getElementById('live-modal-frame');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  if (frame) frame.src = '';
  document.body.style.overflow = 'auto';
}

document.addEventListener('DOMContentLoaded', () => {
  const badge = document.getElementById('live-badge');
  if (badge) badge.addEventListener('click', openLiveModal);
  pollLiveStatus();
  setInterval(pollLiveStatus, LIVE_CHECK_INTERVAL);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLiveModal();
});