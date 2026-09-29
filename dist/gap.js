// The data gap, in the manifesto: three balls whose areas are hours of human-equivalent experience —
// internet text at reading speed (~30T tokens × 0.75 words/token ÷ 238 wpm), human task video (~10% of
// ~3B hours of YouTube, as if egocentric) and public humanoid robot data (AgiBot World, Galaxea, others).
// Each ball is shaded as a sphere and ordered-dithered on a 2px grid, redrawn at device resolution on resize.
const figure = document.getElementById('gap');
if (figure) {
  const canvas = figure.querySelector('canvas'), context = canvas.getContext('2d');
  const TEXT = 1.575e9, VIDEO = 3e8, HUMANOID = 5e3;
  // Geometry as fractions of the figure's width; style.css places the labels on the same numbers.
  const RT = .22, RV = RT * Math.sqrt(VIDEO / TEXT), RH = RT * Math.sqrt(HUMANOID / TEXT);
  const XT = RT, XV = .51 + RV, XH = .97, LABEL = .52;
  const INK = [0, 0, 0], BRAND = [0xec, 0x7a, 0xa4];
  const BAYER = [0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,
    3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21].map(n => n / 64 + 1 / 128);
  const light = [-.55, -.6, .58], norm = Math.hypot(...light);
  const [lx, ly, lz] = light.map(n => n / norm);

  function ball(image, cx, cy, r, [red, green, blue], cell) {
    const {width, height, data} = image;
    const i0 = Math.max(0, Math.floor((cx - r) / cell)), i1 = Math.min(Math.ceil(width / cell), Math.ceil((cx + r) / cell));
    const j0 = Math.max(0, Math.floor((cy - r) / cell)), j1 = Math.min(Math.ceil(height / cell), Math.ceil((cy + r) / cell));
    for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
      const nx = ((i + .5) * cell - cx) / r, ny = ((j + .5) * cell - cy) / r, rr = nx * nx + ny * ny;
      if (rr > 1) continue;
      const lit = Math.max(0, nx * lx + ny * ly + Math.sqrt(1 - rr) * lz);
      if (.06 + .84 * (1 - lit) ** 1.3 <= BAYER[(j % 8) * 8 + i % 8]) continue;
      for (let y = j * cell, ye = Math.min(height, y + cell); y < ye; y++)
        for (let x = i * cell, xe = Math.min(width, x + cell); x < xe; x++) {
          const p = (y * width + x) * 4;
          data[p] = red; data[p + 1] = green; data[p + 2] = blue; data[p + 3] = 255;
        }
    }
  }

  function draw() {
    const dpr = Math.min(devicePixelRatio || 1, 3), w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    const W = canvas.width = Math.round(w * dpr), H = canvas.height = Math.round(h * dpr);
    const image = context.createImageData(W, H), cell = Math.max(1, Math.round(2 * dpr)), base = H;
    ball(image, XT * W, base - RT * W, RT * W, INK, cell);
    ball(image, XV * W, base - RV * W, RV * W, BRAND, cell);
    context.putImageData(image, 0, 0);
    // Humanoid data, true to scale (under a pixel), found by a ring and a hairline from its label.
    const x = Math.round(XH * W) + .5, ring = 7 * dpr, r = Math.max(RH * W, .75);
    context.fillStyle = '#000';
    context.beginPath(); context.arc(x, base - ring, r, 0, Math.PI * 2); context.fill();
    context.strokeStyle = '#000'; context.lineWidth = dpr;
    context.beginPath(); context.arc(x, base - ring, ring - dpr / 2, 0, Math.PI * 2); context.stroke();
    context.beginPath(); context.moveTo(x, H * (1 - LABEL) + 6 * dpr); context.lineTo(x, base - ring * 2); context.stroke();
  }

  new ResizeObserver(draw).observe(canvas);
}
