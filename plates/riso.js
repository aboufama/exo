// A two-ink riso plate: each ink is drawn as a density map (white with alpha on a transparent canvas), then
// screened into a grain of single-pixel dots and laid on paper, pink first, black over it, the pink a touch
// out of register. An ink can also be screened with an ordered (Bayer) dither instead of grain, for the regular,
// printed-tone look of the data figures.
const PINK = [236, 122, 164], BLACK = [0, 0, 0];

class Plate {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.layers = {};
    for (const name of ['k', 'p']) this.layer(name);
  }
  // Grain inks are 'k' and 'p'; their dithered counterparts, 'kd' and 'pd', are made when first used.
  layer(name) {
    if (!this.layers[name]) {
      const c = document.createElement('canvas'); c.width = this.w; c.height = this.h;
      this.layers[name] = c.getContext('2d', {willReadFrequently: true});
    }
    return this.layers[name];
  }
  ink(name) { return this.layer(name); }

  // Fill a quad with a ramp: full ink at edge a (p0,p1) for `solid` of the way, thinning to nothing at edge b.
  // `screen: 'dither'` prints the whole band in ordered dither; `tail: 'dither'` keeps the solid edge in grain, like
  // a pencil line, and prints only the part that thins out in ordered dither.
  band(name, [p0, p1, p2, p3], {solid = .45, density = 1, floor = 0, screen = 'grain', tail = 'grain'} = {}) {
    const m0 = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2], m1 = [(p2[0] + p3[0]) / 2, (p2[1] + p3[1]) / 2];
    const fill = (g, stops) => {
      const gr = g.createLinearGradient(m0[0], m0[1], m1[0], m1[1]);
      for (const [at, a] of stops) gr.addColorStop(at, `rgba(255,255,255,${a})`);
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.lineTo(...p2); g.lineTo(...p3); g.closePath(); g.fill();
    };
    const edge = Math.min(.98, solid);
    if (screen === 'dither') fill(this.layer(name + 'd'), [[0, density], [edge, density], [1, density * floor]]);
    else if (tail === 'dither') {
      fill(this.layer(name), [[0, density], [edge, density], [Math.min(1, edge + .02), 0]]);
      fill(this.layer(name + 'd'), [[0, 0], [Math.max(0, edge - .02), 0], [edge, density], [1, density * floor]]);
    } else fill(this.layer(name), [[0, density], [edge, density], [1, density * floor]]);
  }
  line(name, a, b, width = 1, alpha = 1) {
    const g = this.layers[name];
    g.strokeStyle = `rgba(255,255,255,${alpha})`; g.lineWidth = width; g.lineCap = 'round';
    g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke();
  }

  // Screen both inks (grain, and ordered dither where used) and composite. Returns a canvas.
  print({misregister = [3, 2], paper = null, seed = 1, grain = 1, dither = grain} = {}) {
    const {w, h} = this, out = document.createElement('canvas'); out.width = w; out.height = h;
    const o = out.getContext('2d'), img = o.createImageData(w, h), d = img.data;
    const K = this.layers.k.getImageData(0, 0, w, h).data, P = this.layers.p.getImageData(0, 0, w, h).data;
    const KD = this.layers.kd?.getImageData(0, 0, w, h).data, PD = this.layers.pd?.getImageData(0, 0, w, h).data;
    const BAYER = [0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,
      3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21].map(n => n / 64 + 1 / 128);
    const order = (x, y) => BAYER[((y / dither | 0) % 8) * 8 + (x / dither | 0) % 8];
    let s1 = seed * 2654435761 >>> 0 || 1, s2 = (seed * 40503 + 7) >>> 0 || 3;
    const rand = () => { s1 ^= s1 << 13; s1 ^= s1 >>> 17; s1 ^= s1 << 5; return (s1 >>> 0) / 4294967296; };
    const rand2 = () => { s2 ^= s2 << 13; s2 ^= s2 >>> 17; s2 ^= s2 << 5; return (s2 >>> 0) / 4294967296; };
    const [mx, my] = misregister;
    // grain cells: one threshold per `grain`-sized cell
    const cw = Math.ceil(w / grain), chh = Math.ceil(h / grain);
    const tk = new Float32Array(cw * chh), tp = new Float32Array(cw * chh);
    for (let i = 0; i < tk.length; i++) { tk[i] = rand(); tp[i] = rand2(); }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, cell = ((y / grain) | 0) * cw + ((x / grain) | 0);
      const kd = K[i + 3] / 255;
      const px = x - mx, py = y - my, inside = px >= 0 && py >= 0 && px < w && py < h, j = (py * w + px) * 4;
      const pd = inside ? P[j + 3] / 255 : 0;
      let c = null;
      if (kd > tk[cell] || (KD && KD[i + 3] / 255 > order(x, y))) c = BLACK;
      else if (pd > tp[cell] || (PD && inside && PD[j + 3] / 255 > order(px, py))) c = PINK;
      if (c) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; }
      else if (paper) { d[i] = paper[0]; d[i + 1] = paper[1]; d[i + 2] = paper[2]; d[i + 3] = 255; }
    }
    o.putImageData(img, 0, 0);
    return out;
  }
}
window.Plate = Plate;
