// Fleet vs internet, in the Solution: cumulative hours from a million suits against internet text in
// reading-hours (~30T tokens at 238 wpm, growing ~10% a year). The fleet ramps linearly to 1M suits over two
// years, then holds. Workers wear theirs 8 h a shift, 250 days a year; everyday wearers 3 h a day. The areas are
// ordered-dithered on a fine 1px grid, and the labels are placed on the plot from the same model.
const figure = document.getElementById('fleet');
if (figure) {
  const canvas = figure.querySelector('canvas'), context = canvas.getContext('2d');
  const SUITS = 1e6, RAMP = 2, WORKER = 8 * 250, EVERYDAY = 3 * 365;
  const TEXT = 1.575e9, GROWTH = .1, YEARS = 5, YMAX = 8.4e9;
  const INK = [0, 0, 0], BRAND = [0xec, 0x7a, 0xa4];
  const BAYER = [0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,
    3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21].map(n => n / 64 + 1 / 128);
  const text = t => TEXT * (1 + GROWTH) ** t;
  const fleet = (t, perSuit) => SUITS * perSuit * (t <= RAMP ? t * t / (2 * RAMP) : RAMP / 2 + t - RAMP);
  const cross = perSuit => {let t = 0; while (fleet(t, perSuit) < text(t)) t += .001; return t;};
  const LINES = {worker: WORKER, everyday: EVERYDAY};
  const crossings = {worker: cross(WORKER), everyday: cross(EVERYDAY)};
  const pct = n => `${(n * 100).toFixed(3)}%`;

  // Labels: positions as fractions of the plot, so they only need setting once.
  for (const el of figure.querySelectorAll('[data-end]')) {
    const line = el.dataset.end, v = line === 'text' ? text(YEARS) : fleet(YEARS, LINES[line]);
    el.style.top = pct(1 - v / YMAX);
  }
  for (const el of figure.querySelectorAll('[data-cross]')) {
    const t = crossings[el.dataset.cross];
    el.textContent = `${Math.round(t * 12)} months`;
    el.style.left = pct(t / YEARS);
    el.style.top = pct(1 - text(t) / YMAX);
  }
  for (const el of figure.querySelectorAll('[data-v]')) el.style.bottom = pct(el.dataset.v / YMAX);
  for (const el of figure.querySelectorAll('[data-t]')) el.style.left = pct(el.dataset.t / YEARS);

  function draw() {
    const dpr = Math.min(devicePixelRatio || 1, 3), w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    const W = canvas.width = Math.round(w * dpr), H = canvas.height = Math.round(h * dpr);
    const X = t => t / YEARS * W, Y = v => H - v / YMAX * H;

    // Rules first, so the dither covers them.
    context.strokeStyle = '#e1e1e1'; context.lineWidth = dpr;
    for (const k of [4, 8]) {
      const y = Math.round(Y(k * 1e9)) + .5;
      context.beginPath(); context.moveTo(0, y); context.lineTo(W, y); context.stroke();
    }

    // Internet text gathers under its line and thins toward zero; the fleet's band is densest along the
    // workers' curve and fades toward the everyday wearers'.
    const image = context.getImageData(0, 0, W, H), data = image.data, cell = Math.max(1, Math.round(dpr));
    for (let j = 0, rows = Math.ceil(H / cell); j < rows; j++) {
      const v = (H - (j + .5) * cell) / H * YMAX;
      for (let i = 0, cols = Math.ceil(W / cell); i < cols; i++) {
        const t = (i + .5) * cell / W * YEARS, lo = fleet(t, EVERYDAY), hi = fleet(t, WORKER), tx = text(t);
        let density, color;
        if (v >= lo && v <= hi) { density = .08 + .85 * Math.min(1, (v - lo) / Math.max(hi - lo, 1)) ** 1.6; color = BRAND; }
        else if (v <= tx) { density = .02 + .62 * (v / tx) ** 3; color = INK; }
        else continue;
        if (density <= BAYER[(j % 8) * 8 + i % 8]) continue;
        for (let y = j * cell, ye = Math.min(H, y + cell); y < ye; y++)
          for (let x = i * cell, xe = Math.min(W, x + cell); x < xe; x++) {
            const p = (y * W + x) * 4;
            data[p] = color[0]; data[p + 1] = color[1]; data[p + 2] = color[2]; data[p + 3] = 255;
          }
      }
    }
    context.putImageData(image, 0, 0);

    // The fleet reaches a million at the end of the ramp.
    context.strokeStyle = 'rgba(0,0,0,.5)'; context.lineWidth = dpr; context.setLineDash([2 * dpr, 3 * dpr]);
    const xr = Math.round(X(RAMP)) + .5;
    context.beginPath(); context.moveTo(xr, 0); context.lineTo(xr, H); context.stroke();
    context.setLineDash([]);

    context.lineWidth = dpr; context.lineJoin = context.lineCap = 'round';
    const curve = (f, style) => {
      context.strokeStyle = style; context.beginPath();
      for (let k = 0; k <= 240; k++) { const t = k / 240 * YEARS; context[k ? 'lineTo' : 'moveTo'](X(t), Y(f(t))); }
      context.stroke();
    };
    curve(text, '#000');
    curve(t => fleet(t, WORKER), '#ec7aa4');
    curve(t => fleet(t, EVERYDAY), '#ec7aa4');

    context.fillStyle = '#fff'; context.strokeStyle = '#000'; context.lineWidth = dpr;
    for (const t of Object.values(crossings)) {
      context.beginPath(); context.arc(X(t), Y(text(t)), 3.5 * dpr, 0, Math.PI * 2); context.fill(); context.stroke();
    }
  }

  new ResizeObserver(draw).observe(canvas);
}
