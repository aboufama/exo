// The foot of the page: the top line of the drawing behind the tabs draws in from the left as you scroll down to it.
// Its tip is not a straight cut: each grain of the line has its own moment to appear, spread over the last stretch
// before the tip, so the line thins into grain where it is still being drawn, the way a pencil stroke starts. Progress
// runs from 0, when the drawing's top comes on screen, to 1 at the bottom of the page. The line is the image in the
// page (shown whole without scripts); it is redrawn grain by grain on a canvas. Under reduced motion it is simply there.
const foot = document.querySelector('.tabs'), img = foot?.querySelector('.stroke');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const TIP = .06; // the stretch over which the line breaks into grain, as a fraction of its width

if (foot && img && !reduced.matches) img.decode().then(() => {
  const w = img.naturalWidth, h = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const g = canvas.getContext('2d', {willReadFrequently: true});
  g.drawImage(img, 0, 0);
  const source = g.getImageData(0, 0, w, h), shown = g.createImageData(w, h);
  g.clearRect(0, 0, w, h);
  // The line's inks are the page's (--ink, --accent): the image is printed in black and pink, and is repainted in the
  // page's inks when they differ (debug mode's palettes).
  const rgb = colour => { // hex or rgb() (the page's inks are written so)
    let m = colour.match(/^#([0-9a-f]{3,8})$/i);
    if (m) { let h = m[1]; if (h.length <= 4) h = [...h].map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); }
    m = colour.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
    return m ? [m[1], m[2], m[3]].map(n => Math.round(+n)) : [0, 0, 0];
  };
  let ink = source;
  const repaint = () => {
    const css = getComputedStyle(document.documentElement), k = rgb(css.getPropertyValue('--ink').trim() || '#000'), p = rgb(css.getPropertyValue('--accent').trim() || '#ec7aa4');
    if (k.join() === '0,0,0' && p.join() === '236,122,164') ink = source;
    else {
      ink = new ImageData(new Uint8ClampedArray(source.data), w, h);
      const d = ink.data;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { const to = d[i] + d[i + 1] + d[i + 2] < 180 ? k : p; d[i] = to[0]; d[i + 1] = to[1]; d[i + 2] = to[2]; }
    }
  };
  repaint();

  // Every grain, ordered by when it appears: left to right, with a random share of the tip.
  const grains = [];
  for (let i = 3; i < source.data.length; i += 4) if (source.data[i]) {
    const x = (i >> 2) % w;
    grains.push([x / w * (1 - TIP) + Math.random() * TIP, i - 3]);
  }
  grains.sort((a, b) => a[0] - b[0]);

  canvas.className = img.className;
  canvas.setAttribute('aria-hidden', 'true');
  img.replaceWith(canvas);

  let drawn = 0, frame = 0;
  const update = () => {
    frame = 0;
    const start = foot.getBoundingClientRect().top + scrollY - innerHeight, end = document.documentElement.scrollHeight - innerHeight;
    const progress = end > start ? Math.min(1, Math.max(0, (scrollY - start) / (end - start))) : 1;
    let n = drawn;
    while (n < grains.length && grains[n][0] < progress) n++;
    while (n > 0 && grains[n - 1][0] >= progress) n--;
    if (n === drawn) return;
    // Copy in, or clear, only the grains that changed, and repaint just the columns they span.
    const [from, to] = n > drawn ? [drawn, n] : [n, drawn];
    let x0 = w, x1 = 0;
    for (let k = from; k < to; k++) {
      const i = grains[k][1], x = (i >> 2) % w;
      for (let c = 0; c < 4; c++) shown.data[i + c] = n > drawn ? ink.data[i + c] : 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
    }
    g.putImageData(shown, 0, 0, x0, 0, x1 - x0 + 1, h);
    drawn = n;
  };
  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update); }, {passive: true});
  addEventListener('resize', update);
  // New inks: repaint the grains already drawn.
  addEventListener('lithe:palette', () => {
    repaint();
    for (let k = 0; k < drawn; k++) { const i = grains[k][1]; for (let c = 0; c < 4; c++) shown.data[i + c] = ink.data[i + c]; }
    g.putImageData(shown, 0, 0);
  });
  update();
}).catch(() => {}); // if the image can't be read, it stays as it is, whole
