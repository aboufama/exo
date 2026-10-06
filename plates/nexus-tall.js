// The nexus on phones. A phone is only about 15 em of the statement wide, so the page's nexus (50 em) would show just
// its thin neck, hidden behind the words. This is the same hourglass drawn for that width (24 × 14 em, at 80 px to the
// em, centred on the statement): its neck is the statement itself, so the lines spread over its whole height where they
// meet its ends, the outer ones pass over and under its corners and stop short of its words, and the river opens to
// about 4.3 em either side of the middle at a 390 px screen's edges, and little more beyond (a wider phone shows more
// of it). The page sets the statement in the screen's width on phones, so this fits its words on every phone. The
// statement's three line boxes are the page's (nexus.js), centred here; the pencil stops a little closer to them than
// on the page's nexus, as the lines are shown smaller.
render({w: 1920, h: 1120, paper: null, grain: 2, misregister: [4, 3], seed: 23,
  avoid: {gap: 16, jitter: .4, taper: 28, seed: 5, rects: [
    [509, 419, 1411, 526],   // A powered exoskeleton is
    [542, 506, 1378, 612],   // the data engine to solve
    [499, 592, 1421, 698],   // the embodiment problem.
  ]},
  rivers: [{
    curve: [[0, .47], [1 / 3, .5], [2 / 3, .5], [1, .53]], ends: {inner: 96, taper: 72, jitter: .4},
    // Half the river's height (em) at each distance from the middle (em), joined by a monotone cubic.
    span: (() => {
      const X = [0, 1.5, 3, 4.5, 5.8, 7.8, 9.5, 12], Y = [1.8, 2.4, 2.9, 3.3, 3.7, 4.3, 4.45, 4.55];
      const d = X.slice(1).map((x, i) => (Y[i + 1] - Y[i]) / (x - X[i]));
      const m = Y.map((_, i) => i === 0 ? 0 : i === Y.length - 1 ? d[i - 1] : d[i - 1] * d[i] <= 0 ? 0 : 3 * (X[i + 1] - X[i - 1]) / ((2 * X[i + 1] - X[i] - X[i - 1]) / d[i - 1] + (X[i + 1] + X[i] - 2 * X[i - 1]) / d[i]));
      const half = x => {
        if (x >= X.at(-1)) return Y.at(-1);
        const i = X.findIndex((_, k) => x < X[k + 1]), h = X[i + 1] - X[i], t = (x - X[i]) / h;
        return (2 * t ** 3 - 3 * t ** 2 + 1) * Y[i] + (t ** 3 - 2 * t ** 2 + t) * h * m[i] + (-2 * t ** 3 + 3 * t ** 2) * Y[i + 1] + (t ** 3 - t ** 2) * h * m[i + 1];
      };
      return u => 2 * half(Math.abs(u - .5) * 24) * 80;
    })(),
    // The page's lines (nexus.js): a sparse, uneven few of many narrow strokes inked, each with its own weight.
    families: [
      {ref: 'pelvis', from: -.516, to: .484, m: 57, damp: 1.4, wobble: [.016, 1.4], tail: 'dither',
        pattern: j => {
          const r = k => { let n = Math.imul(j * 2654435761 + k * 40503, 0x45d9f3b); n ^= n >>> 15; n = Math.imul(n, 0x45d9f3b); return ((n ^ n >>> 13) >>> 0) / 4294967296; };
          if (r(1) > .3) return null;
          return r(2) < .15 ? {ink: 'k', solid: .3 + .25 * r(3)} : {ink: 'p', solid: .3 + .35 * r(3)};
        }},
    ],
  }]})
