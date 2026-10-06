// Behind each founder's cut-out portrait, a layered dither, drawn at the screen's resolution one CSS pixel per cell so
// it stays crisp: wavy pink bands that echo the drawing the portraits sit on, solid at one edge and thinning out like
// its bands, gathered in a soft mound round the shoulders that fades out toward the head and the sides; over them, a
// sparser black layer printed a pixel out of register, as a two-ink print would be. The two portraits get different
// waves.
const BAYER = [0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,
  3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21].map(n => n / 64 + 1 / 128);
// Its inks and strength come from the page's tokens (--accent, --ink, --founder-dither), so debug mode can tune them.
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function draw(canvas, seed) {
  const size = canvas.clientWidth, dpr = Math.max(1, Math.round(devicePixelRatio || 1)), css = getComputedStyle(document.documentElement);
  const PINK = css.getPropertyValue('--accent').trim() || '#ec7aa4', INK = css.getPropertyValue('--ink').trim() || '#000';
  const sv = css.getPropertyValue('--founder-dither').trim(), strength = sv === '' ? 1 : parseFloat(sv) || 0;
  if (!size) return;
  canvas.width = canvas.height = size * dpr;
  const g = canvas.getContext('2d'), gap = Math.max(4, size / 26); // band spacing, in CSS px
  // Where a band is at (x, y), and how far through it: bands run across, bending in two slow waves.
  const band = (x, y) => (y + size * (.05 * Math.sin(2 * Math.PI * (x / size * .8 + seed)) + .025 * Math.sin(2 * Math.PI * (x / size * 2.1 + seed * 1.7)))) / gap;
  // The mound: full at the shoulders (bottom centre), fading to nothing a little above them and toward the sides.
  const mound = (x, y) => { const dx = (x / size - .5) / .62, dy = (y / size - 1.02) / .62; return smooth(1, .35, Math.hypot(dx, dy)); };
  // Each layer: its ink, its offset (the black is a pixel out of register), and its tone given which band of three this
  // is (n), how far through the band (f) and the mound (m). Black prints a thin line on one band in three.
  for (const [ink, dx, tone] of [[PINK, 0, (n, f, m) => .72 * m * (f < .42 ? 1 : Math.max(0, 1 - (f - .42) / .58))],
                                  [INK, 1, (n, f, m) => n === 1 && f < .22 ? .45 * m * m : 0]]) {
    g.fillStyle = ink;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const b = band(x - dx, y - dx), k = Math.floor(b), t = tone(((k % 3) + 3) % 3, b - k, mound(x - dx, y - dx));
      if (t * strength > BAYER[(y % 8) * 8 + (x % 8)]) g.fillRect(x * dpr, y * dpr, dpr, dpr);
    }
  }
}

const canvases = [...document.querySelectorAll('.portrait canvas')];
const paint = () => canvases.forEach((c, i) => draw(c, .17 + i * .41));
new ResizeObserver(paint).observe(document.querySelector('.founders') || document.body);
for (const type of ['lithe:tune', 'lithe:palette']) addEventListener(type, paint);
