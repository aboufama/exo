// The product page's aura: the exoskeleton gives off a field of braille in the brand pink. Cells sit on the braille grid
// (dots on a 2-dot pitch within a cell, cells 5 dots apart across and 7 down, as on a braille page), centred on the
// silhouette. Each dot is raised where the field is strong enough against an ordered (Bayer) threshold, roughened a
// little so the thin outer field scatters rather than falling into a lattice; the field is
// strongest against the frame and falls away with distance from it, so the braille is dense round the exo, never a
// solid block, and thins out into scattered single dots. Every cell is a real braille character. The silhouette sits
// over it in black, so the field shows round it and through its gaps. As the pointer passes near, a cell turns to
// another of the same weight, a dot at a time, and settles back once it has gone; now and then a cell does so on its
// own, so the field is never quite still. Under reduced motion it holds still. Its dot size is the page's
// --braille-dot (3 px, 2 px on phones).
const BAYER = [0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,
  3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21].map(n => n / 64 + 1 / 128);
// The field's strength at the frame, its falloff (a share of the exo's width), the weakest field that raises a dot, how
// far the threshold is roughened, and the page's edge clearance in px.
const PEAK = .8, FALL = .075, FLOOR = .02, GRAIN = .35, EDGE = 4;
const hash = (x, y) => { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) | 0; h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967296; };
const root = document.documentElement, exo = document.querySelector('.exo'), img = exo?.querySelector('img');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const MASKS = [...Array(64).keys()].slice(1), bits = m => [0, 1, 2, 3, 4, 5].filter(i => m >> i & 1).length;
const BY_WEIGHT = [0, 1, 2, 3, 4, 5, 6].map(n => MASKS.filter(m => bits(m) === n)); // the 63 braille cells, by dots raised
const canvas = document.createElement('canvas'), g = canvas.getContext('2d');
canvas.className = 'aura';
canvas.setAttribute('aria-hidden', 'true');
let cells = [], dot = 3, dpr = 1, reach = 33, width = 0, height = 0;

const paint = (cell, n, on) => {
  const x = (cell.x + (n > 2 ? 2 * dot : 0)) * dpr, y = (cell.y + (n % 3) * 2 * dot) * dpr;
  on ? g.fillRect(x, y, dot * dpr, dot * dpr) : g.clearRect(x, y, dot * dpr, dot * dpr);
};
const show = (cell, mask) => {
  for (let n = 0; n < 6; n++) {
    const on = !!(mask >> n & 1);
    if (!!(cell.mask >> n & 1) === on) continue;
    const flip = () => { paint(cell, n, on); cell.mask = on ? cell.mask | 1 << n : cell.mask & ~(1 << n); };
    reduced.matches ? flip() : setTimeout(flip, Math.random() * 160);
  }
};

function place() {
  if (!img.naturalWidth) return;
  const W = root.clientWidth, H = Math.max(root.scrollHeight, innerHeight);
  if (W === width && H === height) return;
  width = W; height = H;
  dot = Math.max(1, Math.round(parseFloat(getComputedStyle(root).getPropertyValue('--braille-dot')) || 3));
  dpr = Math.max(1, Math.round(devicePixelRatio || 1));
  const PX = 5 * dot, PY = 7 * dot, CW = 3 * dot, CH = 5 * dot;
  reach = 2.2 * PX;
  canvas.width = W * dpr; canvas.height = H * dpr;
  Object.assign(canvas.style, {width: `${W}px`, height: `${H}px`});
  g.fillStyle = getComputedStyle(root).getPropertyValue('--accent').trim() || '#ec7aa4';

  // The silhouette, read on a grid one dot across, and each grid point's distance from it (a two-pass chamfer
  // transform, in dots).
  const b = exo.getBoundingClientRect(), left = b.left + scrollX, top = b.top + scrollY;
  const gw = Math.ceil(W / dot), gh = Math.ceil(H / dot);
  const read = document.createElement('canvas');
  read.width = gw; read.height = gh;
  const rg = read.getContext('2d', {willReadFrequently: true});
  rg.drawImage(img, left / dot, top / dot, b.width / dot, b.height / dot);
  const alpha = rg.getImageData(0, 0, gw, gh).data, D = new Float32Array(gw * gh);
  for (let i = 0; i < gw * gh; i++) D[i] = alpha[i * 4 + 3] > 60 ? 0 : 1e9;
  const R2 = Math.SQRT2;
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    const i = y * gw + x; let d = D[i];
    if (x) d = Math.min(d, D[i - 1] + 1);
    if (y) { d = Math.min(d, D[i - gw] + 1); if (x) d = Math.min(d, D[i - gw - 1] + R2); if (x < gw - 1) d = Math.min(d, D[i - gw + 1] + R2); }
    D[i] = d;
  }
  for (let y = gh - 1; y >= 0; y--) for (let x = gw - 1; x >= 0; x--) {
    const i = y * gw + x; let d = D[i];
    if (x < gw - 1) d = Math.min(d, D[i + 1] + 1);
    if (y < gh - 1) { d = Math.min(d, D[i + gw] + 1); if (x < gw - 1) d = Math.min(d, D[i + gw + 1] + R2); if (x) d = Math.min(d, D[i + gw - 1] + R2); }
    D[i] = d;
  }
  const fall = FALL * b.width / dot;

  // Clear of the words: the caption and the tabs.
  const words = [...document.querySelectorAll('.product figcaption, .tabs .tab')].map(e => e.getBoundingClientRect()).filter(q => q.width)
    .map(q => ({x0: q.left + scrollX - dot * 3, x1: q.right + scrollX + dot * 3, y0: q.top + scrollY - dot * 2, y1: q.bottom + scrollY + dot * 2}));
  // The grid is centred on the exo, so the field sits the same way about it at every size.
  const cx = Math.round((left + b.width / 2 - CW / 2) / dot) * dot, cy = Math.round((top + b.height / 2 - CH / 2) / dot) * dot;
  g.clearRect(0, 0, canvas.width, canvas.height);
  cells = [];
  for (let row = Math.ceil((EDGE - cy) / PY); cy + row * PY + CH < H - EDGE; row++) for (let col = Math.ceil((EDGE - cx) / PX); cx + col * PX + CW < W - EDGE; col++) {
    const x = cx + col * PX, y = cy + row * PY;
    if (words.some(r => x + CW > r.x0 && x < r.x1 && y + CH > r.y0 && y < r.y1)) continue;
    let mask = 0;
    for (let n = 0; n < 6; n++) {
      const gx = x / dot + (n > 2 ? 2 : 0), gy = y / dot + (n % 3) * 2, d = D[gy * gw + gx];
      const tone = PEAK * Math.exp(-d / fall), bx = col * 2 + (n > 2 ? 1 : 0), by = row * 3 + n % 3;
      const t = (1 - GRAIN) * BAYER[(((by % 8) + 8) % 8) * 8 + ((bx % 8) + 8) % 8] + GRAIN * hash(bx, by);
      if (tone > FLOOR && tone > t) mask |= 1 << n;
    }
    if (!mask) continue;
    const cell = {x, y, home: mask, mask: 0, weight: bits(mask), out: false, timer: 0};
    for (let n = 0; n < 6; n++) if (mask >> n & 1) paint(cell, n, true);
    cell.mask = mask;
    cells.push(cell);
  }
}

// The pointer turns a cell to another of the same weight when it comes near; it settles back once it has gone.
const turn = cell => { const same = BY_WEIGHT[cell.weight].filter(m => m !== cell.home); if (same.length) show(cell, same[Math.floor(Math.random() * same.length)]); };
let pointer = null, frame = 0;
const near = () => {
  frame = 0;
  for (const cell of cells) {
    const d = Math.hypot(cell.x + 1.5 * dot - pointer.x, cell.y + 2.5 * dot - pointer.y);
    if (d < reach && !cell.out) { cell.out = true; clearTimeout(cell.timer); turn(cell); }
    else if (d > reach * 1.7 && cell.out) { cell.out = false; cell.timer = setTimeout(() => show(cell, cell.home), 700 + Math.random() * 500); }
  }
};
// Now and then a cell turns on its own, and settles back a moment later.
const drift = () => {
  if (!reduced.matches && !document.hidden && cells.length) for (let k = 0; k < 2; k++) {
    const cell = cells[Math.floor(Math.random() * cells.length)];
    if (cell.out) continue;
    cell.out = true; turn(cell);
    cell.timer = setTimeout(() => { cell.out = false; show(cell, cell.home); }, 500 + Math.random() * 900);
  }
  setTimeout(drift, 120);
};

if (exo && img) {
  document.body.prepend(canvas);
  const start = () => { place(); drift(); };
  img.complete && img.naturalWidth ? start() : img.addEventListener('load', start, {once: true});
  document.fonts?.ready.then(() => { width = 0; place(); });
  let timer = 0;
  addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(place, 150); });
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    pointer = {x: e.pageX, y: e.pageY};
    if (!frame) frame = requestAnimationFrame(near);
  }, {passive: true});
}
