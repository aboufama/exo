// Muybridge's plate walks as you scroll: every few pixels, each of the twelve boxes shows
// the frame after it, so the sequence plays in every box at once, each at its own phase.
// A faint motion-capture trace cuts in on the first scroll and follows each frame to the
// box it lands in. It leads with the feet, since they are what changes: an ankle marker on
// each foot, a stride line between them, a trail to where the swinging foot was one frame
// earlier, and its pixel coordinates. The head gets a lighter marker.
// At the top of the page the plate is exactly as supplied; reduced motion keeps the frames still.
const plate = document.getElementById('plate');
const img = plate?.querySelector('img');
const reel = plate?.querySelector('.reel');
const trace = plate?.querySelector('.trace');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const STEP = 24; // px of scroll per frame
const PINK = '#ec7aa4', WHITE = 'rgba(255,255,255,.78)', BLOCK = 'rgba(236,122,164,.22)';

// Frame boxes in the 1200 × 713 source as [x0, y0, x1, y1], in printed order (1–6 top, 7–12 bottom).
// Widths differ by a few pixels, so each frame is fitted to the box it lands in.
const BOXES = [
  [23, 16, 202, 343], [209, 16, 400, 343], [410, 16, 593, 343],
  [604, 16, 793, 343], [803, 16, 990, 343], [999, 16, 1181, 343],
  [23, 370, 205, 697], [216, 370, 401, 697], [412, 370, 591, 697],
  [602, 370, 794, 697], [804, 370, 991, 697], [1002, 370, 1181, 697],
];
// Tracked points per frame, in source pixels, measured by eye to within a few pixels. Both rows
// cover the same half-stride, so frames 1 and 7, 2 and 8 and so on share a phase.
// SWING is the ankle that lifts and passes; PLANT is the ankle on the ground.
const HEADS = [[105, 55], [307, 58], [512, 55], [714, 50], [905, 48], [1095, 48],
  [108, 408], [300, 410], [505, 410], [710, 408], [900, 405], [1095, 405]];
const SWING = [[52, 304], [233, 299], [434, 295], [648, 285], [857, 283], [1082, 300],
  [69, 658], [242, 660], [432, 660], [633, 643], [838, 638], [1056, 648]];
const PLANT = [[138, 304], [350, 304], [543, 305], [725, 307], [903, 307], [1068, 308],
  [135, 663], [353, 660], [541, 663], [730, 663], [908, 665], [1071, 665]];

// 3 × 5 bitmap digits for the coordinate readouts.
const GLYPHS = {
  0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111',
  4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001001001',
  8: '111101111101111', 9: '111101111001111', ',': '000000000010100',
};

// A point on frame f, carried into box i.
function place([x, y], f, i) {
  const a = BOXES[f], b = BOXES[i];
  return [b[0] + (x - a[0]) * (b[2] - b[0]) / (a[2] - a[0]), b[1] + (y - a[1]) * (b[3] - b[1]) / (a[3] - a[1])];
}
function seeded(n) {
  return () => { n = (n + 0x6d2b79f5) | 0; let t = Math.imul(n ^ (n >>> 15), 1 | n);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

if (plate && img && reel && trace) {
  const frames = reel.getContext('2d'), marks = trace.getContext('2d');
  let shown = -1, frame = 0, dpr = 1, wide = 0;

  function drawFrames(k) {
    const s = img.naturalWidth / 1200, u = reel.width / img.naturalWidth;
    frames.setTransform(u, 0, 0, u, 0, 0);
    frames.imageSmoothingQuality = 'high';
    frames.drawImage(img, 0, 0); // gutters and edges
    for (let i = 0; i < 12; i++) {
      const [sx0, sy0, sx1, sy1] = BOXES[(i + k) % 12], [dx0, dy0, dx1, dy1] = BOXES[i];
      frames.drawImage(img, sx0 * s, sy0 * s, (sx1 - sx0) * s, (sy1 - sy0) * s,
        dx0 * s, dy0 * s, (dx1 - dx0) * s, (dy1 - dy0) * s);
    }
  }

  function drawTrace(k) {
    const c = trace.width / 1200, d = dpr, g = marks, half = .5 * (d % 2);
    const at = ([x, y]) => [Math.round(x * c) + half, Math.round(y * c) + half];
    const heads = [], swing = [], plant = [], trail = [];
    for (let i = 0; i < 12; i++) {
      const f = (i + k) % 12, before = (f + 11) % 12;
      heads.push(place(HEADS[f], f, i));
      swing.push(place(SWING[f], f, i));
      plant.push(place(PLANT[f], f, i));
      trail.push(place(SWING[before], before, i));
    }
    g.clearRect(0, 0, trace.width, trace.height);

    // Pink blocks on a coarse grid near the feet, seeded per frame so they travel with it.
    const grid = 14 * c;
    g.fillStyle = BLOCK;
    for (let i = 0; i < 12; i++) {
      const f = (i + k) % 12, rnd = seeded(f + 1);
      for (const p of [SWING[f], PLANT[f], SWING[f], HEADS[f]]) {
        if (rnd() > .4) continue;
        const [x, y] = place([p[0] + (rnd() - .5) * 80, p[1] + (rnd() - .5) * 60], f, i);
        g.fillRect(Math.floor(x * c / grid) * grid, Math.floor(y * c / grid) * grid,
          grid * [1, 1, 2, 3][rnd() * 4 | 0], grid * [1, 1, 2][rnd() * 3 | 0]);
      }
    }

    g.lineWidth = d;
    const path = (pts, color, alpha, dash = []) => {
      g.globalAlpha = alpha; g.strokeStyle = color; g.setLineDash(dash.map(n => n * d)); g.beginPath();
      pts.forEach((p, n) => g[n ? 'lineTo' : 'moveTo'](...at(p)));
      g.stroke(); g.setLineDash([]);
    };
    const marker = (p, color, box, arm, alpha = 1) => {
      const [x, y] = at(p);
      g.globalAlpha = alpha; g.strokeStyle = color;
      g.strokeRect(x - box * d, y - box * d, box * 2 * d, box * 2 * d);
      g.beginPath();
      g.moveTo(x - arm * d, y); g.lineTo(x + arm * d, y);
      g.moveTo(x, y - arm * d); g.lineTo(x, y + arm * d);
      g.stroke();
    };
    const px = Math.max(2, Math.round(1.5 * d));
    const readout = (p, color) => {
      const [x, y] = at(p);
      const text = `${String(Math.round(p[0])).padStart(4, '0')},${String(Math.round(p[1])).padStart(3, '0')}`;
      g.globalAlpha = 1; g.fillStyle = color;
      let cx = Math.round(x - text.length * 2 * px), top = Math.round(y - 7 * d - 5 * px);
      for (const ch of text) {
        const bits = GLYPHS[ch];
        for (let b = 0; b < 15; b++) if (bits[b] === '1') g.fillRect(cx + (b % 3) * px, top + (b / 3 | 0) * px, px, px);
        cx += 4 * px;
      }
    };

    // Head: a faint line along each row and a small marker.
    path(heads.slice(0, 6), PINK, .4); path(heads.slice(6), PINK, .4);
    heads.forEach(p => marker(p, PINK, 2, 4, .7));

    // Feet: each foot's path along the row, the stride between them, and the swing foot's last step.
    path(swing.slice(0, 6), WHITE, .45); path(swing.slice(6), WHITE, .45);
    path(plant.slice(0, 6), WHITE, .25, [2, 2]); path(plant.slice(6), WHITE, .25, [2, 2]);
    for (let i = 0; i < 12; i++) {
      path([swing[i], plant[i]], PINK, .9);
      path([trail[i], swing[i]], PINK, .5, [1, 2]);
      const [tx, ty] = at(trail[i]);
      g.globalAlpha = .5; g.fillStyle = PINK; g.fillRect(tx - d, ty - d, 2 * d, 2 * d);
      marker(plant[i], WHITE, 2.5, 5, .8);
      marker(swing[i], WHITE, 3, 7);
      if (wide) readout(swing[i], WHITE); // only where the plate is large enough to hold them
    }
    g.globalAlpha = 1;
  }

  function update(force) {
    frame = 0;
    plate.classList.toggle('tracking', scrollY > 0);
    const k = reduced.matches ? 0 : Math.floor(Math.max(0, scrollY) / STEP) % 12;
    if (k === shown && !force) return;
    shown = k;
    if (k) drawFrames(k);
    drawTrace(k);
    plate.classList.toggle('moving', k !== 0);
  }
  function size() {
    const box = plate.getBoundingClientRect();
    dpr = Math.min(Math.round(devicePixelRatio || 1), 2);
    wide = box.width >= 640;
    for (const canvas of [reel, trace]) {
      canvas.width = Math.round(box.width * dpr);
      canvas.height = Math.round(box.height * dpr);
    }
    update(true);
  }

  img.decode().catch(() => {}).then(() => {
    if (!img.naturalWidth) return;
    new ResizeObserver(size).observe(plate);
    addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(() => update()); }, { passive: true });
    reduced.addEventListener?.('change', () => update(true));
  });
}
