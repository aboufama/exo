// Braille on the page: "move" as the loader, and a dither of tiny cells in the nexus. A braille letter is a cell of six
// dot places, two across and three down (dots 1–3 down the left, 4–6 down the right). Their inks, sizes and timing come
// from the page's tokens (style.css), so debug mode can tune them.
const WORD = 'move', LETTERS = {a: [1], b: [1, 2], c: [1, 4], d: [1, 4, 5], e: [1, 5], f: [1, 2, 4], g: [1, 2, 4, 5],
  h: [1, 2, 5], i: [2, 4], j: [2, 4, 5], k: [1, 3], l: [1, 2, 3], m: [1, 3, 4], n: [1, 3, 4, 5], o: [1, 3, 5], p: [1, 2, 3, 4],
  q: [1, 2, 3, 4, 5], r: [1, 2, 3, 5], s: [2, 3, 4], t: [2, 3, 4, 5], u: [1, 3, 6], v: [1, 2, 3, 6], w: [2, 4, 5, 6],
  x: [1, 3, 4, 6], y: [1, 3, 4, 5, 6], z: [1, 3, 5, 6]};
const ALPHABET = Object.keys(LETTERS);
const BAYER = [0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,
  3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21].map(n => n / 64 + 1 / 128);
const root = document.documentElement;
const token = (name, fallback) => { const v = getComputedStyle(root).getPropertyValue(name).trim(); return v === '' ? fallback : v; };
let loaded = document.readyState === 'complete';
addEventListener('load', () => { loaded = true; }, {once: true});

// The loader: one cell at the centre of a white screen, the letters in turn in the same place. Each raised dot is a
// small disc in a fine ordered (Bayer) dither at half tone, every dot the same stamp. Between letters the old dots go
// and the new ones come through that same dither, so for a moment two letters overlap. It spells the word at least
// once, then the white screen fades quickly away as soon as the page has loaded (style.css; the gate in index.html
// also removes it after 8 s). Each letter takes 210 ms (--loader-step), 45% of it changing and the rest held.
function loader() {
  const canvas = document.querySelector('.loader canvas');
  if (!canvas || !root.classList.contains('loading')) return;
  const step = parseFloat(token('--loader-step', '210')) || 210;
  const R = 4.5, PITCH = 15, TONE = .5, SWAP = step * .45, HOLD = step * .55; // dot radius and spacing in CSS px; times in ms
  const dpr = Math.max(1, Math.round(devicePixelRatio || 1)), w = Math.ceil(PITCH + 2 * R), h = Math.ceil(2 * PITCH + 2 * R);
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
  const g = canvas.getContext('2d');
  g.fillStyle = token('--ink', '#000');
  const draw = raised => {
    g.clearRect(0, 0, canvas.width, canvas.height);
    for (let n = 0; n < 6; n++) {
      if (!raised[n]) continue;
      const cx = R + (n < 3 ? 0 : PITCH), cy = R + (n % 3) * PITCH, x0 = Math.floor(cx - R), y0 = Math.floor(cy - R);
      for (let y = y0; y < Math.ceil(cy + R); y++) for (let x = x0; x < Math.ceil(cx + R); x++) {
        const dx = x + .5 - cx, dy = y + .5 - cy;
        if (dx * dx + dy * dy <= R * R && TONE * raised[n] > BAYER[((y - y0) % 8) * 8 + (x - x0) % 8]) g.fillRect(x * dpr, y * dpr, dpr, dpr);
      }
    }
  };
  let start = 0, shown = '', words = 0;
  const frame = now => {
    if (!root.classList.contains('loading')) return;
    start ||= now; // from the first frame on screen, so a page opened in a background tab still spells the word
    const t = now - start, k = Math.floor(t / (SWAP + HOLD)), p = Math.min(1, (t - k * (SWAP + HOLD)) / SWAP);
    // Done at the end of a word, once the page has loaded. Frames can be slow, so any frame past the end counts.
    if (Math.floor(k / WORD.length) > words) {
      words = Math.floor(k / WORD.length);
      if (loaded) { root.classList.remove('loading'); return; }
    }
    const to = LETTERS[WORD[k % WORD.length]], from = k ? LETTERS[WORD[(k - 1) % WORD.length]] : [];
    const raised = [1, 2, 3, 4, 5, 6].map(n => (from.includes(n) ? 1 - p : 0) + (to.includes(n) ? p : 0));
    const key = raised.map(a => a.toFixed(3)).join();
    if (key !== shown) { draw(raised); shown = key; }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// The nexus in braille: the lines drawn through the statement are set as a braille halftone. Cells sit on the braille
// grid (dots on a 2-dot pitch within a cell, cells 5 dots apart across and 7 down, as on a braille page), and each of a
// cell's six dots is raised where the lines run under it, so every strand of the drawing is written out in braille,
// following its curve, and every cell is a real braille character. The tone comes from the drawing as printed, read
// small and softened a little so its thin lines carry onto the grid, and dots are raised against an ordered (Bayer)
// threshold, so even tones fall in an even pattern; each cell takes the ink of the line it sits on. The drawing itself
// isn't shown (--nexus-o is 0): the braille alone draws it. As the pointer passes near, a cell turns to another of the
// same weight, a dot at a time, and settles back once it has gone. Its dot size (--braille-dot) and density
// (--braille-density) are the page's tokens; it is placed again when the fonts arrive, the page's width changes, or
// debug mode tunes it.
function gather() {
  const nexus = document.querySelector('.nexus'), statement = document.querySelector('.copy .lead');
  if (!nexus || !statement) return;
  const EDGE = 4, NS = 'http://www.w3.org/2000/svg';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const MASKS = [...Array(64).keys()].slice(1), bits = m => [0, 1, 2, 3, 4, 5].filter(i => m >> i & 1).length;
  const BY_WEIGHT = [0, 1, 2, 3, 4, 5, 6].map(n => MASKS.filter(m => bits(m) === n)); // the 63 braille cells, by dots raised
  const layer = document.createElement('div');
  layer.className = 'braille';
  layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);
  let cells = [], width = 0, map = null, reach = 33;

  // The drawing's two inks, read small (500 samples across: one per 0.1em, about 4 px on a large screen, 0.7 of the
  // dots' spacing), and softened by two passes of a 3-sample box blur so a line a few pixels wide reaches the dots
  // around it. The phone drawing is shown far smaller, in finer dots, so it says how many samples to read it at
  // (data-samples on its <source>), keeping each one the same share of the dots' spacing. Read from the drawing as
  // printed (debug mode may show it repainted).
  const read = (source, w = 500) => {
    const c = document.createElement('canvas'), h = Math.round(w * source.naturalHeight / source.naturalWidth);
    c.width = w; c.height = h;
    const g = c.getContext('2d', {willReadFrequently: true});
    g.imageSmoothingQuality = 'high';
    g.drawImage(source, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data, K = new Float32Array(w * h), P = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) { const a = d[i * 4 + 3] / 255; if (d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2] < 300) K[i] = a; else P[i] = a; }
    const blur = A => {
      const T = new Float32Array(w * h);
      for (let pass = 0; pass < 2; pass++) {
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0, n = 0; for (let k = -1; k <= 1; k++) { const xx = x + k; if (xx >= 0 && xx < w) { s += A[y * w + xx]; n++; } } T[y * w + x] = s / n; }
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0, n = 0; for (let k = -1; k <= 1; k++) { const yy = y + k; if (yy >= 0 && yy < h) { s += T[yy * w + x]; n++; } } A[y * w + x] = s / n; }
      }
    };
    blur(K); blur(P);
    const at = (A, u, v) => { // bilinear
      const x = Math.min(w - 1.001, Math.max(0, u * w - .5)), y = Math.min(h - 1.001, Math.max(0, v * h - .5)), x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, i = y0 * w + x0;
      return (A[i] * (1 - fx) + A[i + 1] * fx) * (1 - fy) + (A[i + w] * (1 - fx) + A[i + w + 1] * fx) * fy;
    };
    map = {tone: (u, v) => Math.min(1, (at(K, u, v) + at(P, u, v)) * 1.6), black: (u, v) => at(K, u, v) > at(P, u, v)};
  };

  const show = (cell, mask) => cell.dots.forEach((dot, i) => {
    const on = !!(mask >> i & 1);
    if ((dot.getAttribute('opacity') === '1') === on) return;
    const flip = () => dot.setAttribute('opacity', on ? 1 : 0);
    reduced.matches ? flip() : setTimeout(flip, Math.random() * 160);
  });

  const place = force => {
    if (!map || (!force && root.clientWidth === width)) return;
    width = root.clientWidth;
    layer.replaceChildren();
    cells = [];
    const DOT = Math.max(1, Math.round(parseFloat(token('--braille-dot', '3')) || 3)), STEP = 2 * DOT, CW = 3 * DOT, CH = 5 * DOT, PX = 5 * DOT, PY = 7 * DOT;
    reach = 2.2 * PX;
    const density = Math.max(0, parseFloat(token('--braille-density', '1.6')));
    const b = nexus.getBoundingClientRect();
    if (!density || !b.width) return;
    const left = b.left + scrollX, top = b.top + scrollY;
    // Clear of the statement's words (its text only: the drawing is inside it too).
    const range = document.createRange(), boxes = [];
    for (const node of statement.childNodes) if (node.nodeType === Node.TEXT_NODE) { range.selectNodeContents(node); boxes.push(...range.getClientRects()); }
    const words = boxes.filter(q => q.width).map(q => ({x0: q.left + scrollX - DOT * 3, x1: q.right + scrollX + DOT * 3, y0: q.top + scrollY - DOT * 2, y1: q.bottom + scrollY + DOT * 2}));
    const svg = document.createElementNS(NS, 'svg'), y0 = Math.round(top), h = Math.round(b.height);
    svg.setAttribute('width', width); svg.setAttribute('height', h); svg.setAttribute('viewBox', `0 0 ${width} ${h}`);
    svg.setAttribute('shape-rendering', 'crispEdges');
    Object.assign(svg.style, {left: '0px', top: `${y0}px`});
    // The grid starts from the nexus's centre, so it sits the same way about the statement at every width.
    const cx = left + b.width / 2, cy = top + b.height / 2;
    const col0 = Math.ceil((EDGE - cx) / PX), row0 = Math.ceil((y0 - cy) / PY);
    for (let row = row0; cy + row * PY + CH < y0 + h; row++) for (let col = col0; cx + col * PX + CW < width - EDGE; col++) {
      const x = Math.round(cx + col * PX), y = Math.round(cy + row * PY);
      if (words.some(r => x + CW > r.x0 && x < r.x1 && y + CH > r.y0 && y < r.y1)) continue;
      let mask = 0, kVotes = 0;
      for (let n = 0; n < 6; n++) {
        const dx = n > 2 ? STEP : 0, dy = (n % 3) * STEP, u = (x + dx + DOT / 2 - left) / b.width, v = (y + dy + DOT / 2 - top) / b.height;
        const tone = map.tone(u, v) * density, gx = col * 2 + (n > 2 ? 1 : 0), gy = row * 3 + n % 3;
        if (tone > BAYER[(((gy % 8) + 8) % 8) * 8 + ((gx % 8) + 8) % 8]) { mask |= 1 << n; if (map.black(u, v)) kVotes++; }
      }
      if (!mask) continue;
      const fill = kVotes * 2 > bits(mask) ? 'k' : 'p'; // ink or accent, set in style.css
      const dots = [0, 1, 2, 3, 4, 5].map(n => {
        const r = document.createElementNS(NS, 'rect');
        r.setAttribute('x', x + (n > 2 ? STEP : 0)); r.setAttribute('y', y - y0 + (n % 3) * STEP);
        r.setAttribute('width', DOT); r.setAttribute('height', DOT); r.setAttribute('class', fill);
        r.setAttribute('opacity', mask >> n & 1 ? 1 : 0);
        svg.append(r);
        return r;
      });
      cells.push({x: x + CW / 2, y: y + CH / 2, home: mask, weight: bits(mask), dots, out: false, timer: 0});
    }
    layer.append(svg);
  };

  // The pointer turns a cell to another of the same weight when it comes near; it settles back once it has gone.
  let pointer = null, frame = 0;
  const near = () => {
    frame = 0;
    for (const cell of cells) {
      const d = Math.hypot(cell.x - pointer.x, cell.y - pointer.y);
      if (d < reach && !cell.out) {
        cell.out = true;
        clearTimeout(cell.timer);
        const same = BY_WEIGHT[cell.weight].filter(m => m !== cell.home);
        if (same.length) show(cell, same[Math.floor(Math.random() * same.length)]);
      } else if (d > reach * 1.7 && cell.out) {
        cell.out = false;
        cell.timer = setTimeout(() => show(cell, cell.home), 700 + Math.random() * 500);
      }
    }
  };
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    pointer = {x: e.pageX, y: e.pageY};
    if (!frame) frame = requestAnimationFrame(near);
  }, {passive: true});
  let timer = 0;
  addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(() => place(false), 150); });
  // Read once the drawing has loaded (on load, not decode(): browsers hold decode() back in a hidden tab). Phones have a
  // drawing of their own (a <source> in the nexus's <picture>), read again whenever the screen crosses over to it.
  const sources = [...(nexus.closest('picture')?.querySelectorAll('source') ?? [])];
  const chosen = () => sources.find(s => matchMedia(s.media).matches);
  let url = '';
  const load = () => {
    const s = chosen(), next = s ? s.dataset.original || s.getAttribute('srcset') : nexus.dataset.original || nexus.getAttribute('src');
    if (next === url) return;
    url = next;
    const printed = new Image(), start = () => { if (url === next && printed.naturalWidth && map?.from !== printed) { read(printed, +s?.dataset.samples || undefined); map.from = printed; place(true); } };
    printed.addEventListener('load', start, {once: true});
    printed.src = next;
    if (printed.complete) start();
  };
  load();
  for (const s of sources) matchMedia(s.media).addEventListener('change', load);
  document.fonts?.ready.then(() => place(true));
  for (const type of ['lithe:type', 'lithe:tune']) addEventListener(type, () => place(true)); // debug mode changed the page
}

loader();
gather();
// Debug mode can play the loader again.
addEventListener('lithe:replay', () => {
  root.classList.add('loading');
  setTimeout(() => root.classList.remove('loading'), 8000);
  loader();
});
