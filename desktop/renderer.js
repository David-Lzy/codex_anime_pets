'use strict';
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
let current, start = performance.now(), displayedKey = '', state, down, dragging = false;
const cache = new Map();
let loadingId = 0;

async function update(next) {
  state = next;
  const clipName = next.look == null ? next.state : 'look';
  const clip = next.model.clips[clipName];
  const key = `${next.model.id}:${clipName}`;
  if (displayedKey === key) return;
  const request = ++loadingId;
  try {
    let image = cache.get(key);
    if (!image) {
      image = new Image(); image.src = clip.url; await image.decode();
      cache.set(key, image);
      while (cache.size > 4) cache.delete(cache.keys().next().value);
    }
    if (request !== loadingId) return;
    current = {image, clip, width: next.model.cellWidth, height: next.model.cellHeight};
    displayedKey = key; start = performance.now(); window.pet.loaded(true);
  } catch { if (request === loadingId) { current = null; window.pet.loaded(false); } }
}

let pausedAt = null, pausedDuration = 0;
function draw(now) {
  requestAnimationFrame(draw);
  if (!state || !current) return;
  if (state.paused && pausedAt == null) pausedAt = now;
  if (!state.paused && pausedAt != null) { pausedDuration += now - pausedAt; pausedAt = null; }
  const {image, clip, width, height} = current;
  const elapsed = Math.max(0, (pausedAt ?? now) - start - pausedDuration);
  const durations = clip.durations;
  let index = 0, t = elapsed % durations.reduce((a, b) => a + b, 0);
  for (; index < durations.length - 1 && t >= durations[index]; index++) t -= durations[index];
  if (state.look != null && displayedKey.endsWith(':look')) index = state.look;
  const dpr = window.devicePixelRatio || 1;
  const w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, (index % clip.columns) * width, Math.floor(index / clip.columns) * height, width, height, 0, 0, w, h);
}
window.pet.onUpdate(next => {
  if (!state || state.state !== next.state || state.model.id !== next.model.id || (state.look == null) !== (next.look == null)) {
    pausedDuration = 0; pausedAt = null;
  }
  update(next);
});
window.pet.ready().then(update);
requestAnimationFrame(draw);
canvas.addEventListener('contextmenu', e => { e.preventDefault(); window.pet.menu(); });
canvas.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  down = {x: e.screenX, y: e.screenY}; dragging = false;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if (down && !dragging && Math.hypot(e.screenX - down.x, e.screenY - down.y) > 4) {
    dragging = true; window.pet.drag({phase: 'start', x: down.x, y: down.y});
  }
  if (dragging) window.pet.drag({phase: 'move', x: e.screenX, y: e.screenY});
});
function finish(e) {
  if (!down) return;
  if (dragging) window.pet.drag({phase: 'end'}); else if (e.type === 'pointerup') window.pet.gesture('waving');
  down = null; dragging = false;
}
canvas.addEventListener('pointerup', finish);
canvas.addEventListener('pointercancel', finish);
canvas.addEventListener('lostpointercapture', finish);
canvas.addEventListener('dblclick', () => window.pet.gesture('jumping'));
canvas.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.pet.gesture('waving'); }
  if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) { e.preventDefault(); window.pet.menu(); }
});
