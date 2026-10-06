// The nexus: lines that come in wide from the left, gather into the statement, stop short of its words as a pencil
// would, and leave on the right to spread wide again, like an hourglass on its side. Drawn in the statement's em (80 px
// to the em, 50 × 22 em, centred on the statement), so it fits its words at every size: the page sets the statement in
// the same three lines everywhere (a 16em measure), and these are their boxes, measured from the page.
// The neck is thin: where the lines meet the words they are gathered within 0.4em of the middle, so they all go into
// the middle line (the data engine to solve). From there they open slowly, staying within 1em of the middle across the
// text column (which reaches at most 9.2em out, at a 1000 px window; the paragraphs start 2.87em above and below), then
// a little faster toward the page's edges.
render({w: 4000, h: 1760, paper: null, grain: 2, misregister: [4, 3], seed: 23,
  avoid: {gap: 22, jitter: .4, taper: 36, seed: 5, rects: [
    [1549, 739, 2451, 846],   // A powered exoskeleton is
    [1582, 826, 2418, 932],   // the data engine to solve
    [1539, 912, 2461, 1018],  // the embodiment problem.
  ]},
  rivers: [{
    curve: [[0, .47], [1 / 3, .5], [2 / 3, .5], [1, .53]], ends: {inner: 96, taper: 72, jitter: .4},
    // Half the river's height (em) at each distance from the middle (em), joined by a monotone cubic.
    span: (() => {
      const X = [0, 5.6, 8, 10, 14, 17.2, 21, 25], Y = [.3, .42, .75, 1.1, 2.1, 3.1, 4.1, 4.8];
      const d = X.slice(1).map((x, i) => (Y[i + 1] - Y[i]) / (x - X[i]));
      const m = Y.map((_, i) => i === 0 ? 0 : i === Y.length - 1 ? d[i - 1] : d[i - 1] * d[i] <= 0 ? 0 : 3 * (X[i + 1] - X[i - 1]) / ((2 * X[i + 1] - X[i] - X[i - 1]) / d[i - 1] + (X[i + 1] + X[i] - 2 * X[i - 1]) / d[i]));
      const half = x => {
        if (x >= X.at(-1)) return Y.at(-1);
        const i = X.findIndex((_, k) => x < X[k + 1]), h = X[i + 1] - X[i], t = (x - X[i]) / h;
        return (2 * t ** 3 - 3 * t ** 2 + 1) * Y[i] + (t ** 3 - 2 * t ** 2 + t) * h * m[i] + (-2 * t ** 3 + 3 * t ** 2) * Y[i + 1] + (t ** 3 - t ** 2) * h * m[i + 1];
      };
      return u => 2 * half(Math.abs(u - .5) * 50) * 80;
    })(),
    // Few lines, drawn as a hand would: many narrow strokes are laid out and only a sparse, uneven few are inked, so
    // each line is a thin pencil stroke and the gaps between them vary; each has its own weight, now and then black,
    // and drifts a little on its own, so neighbours sometimes touch.
    families: [
      {ref: 'pelvis', from: -.516, to: .484, m: 57, damp: 1.4, wobble: [.016, 1.4], tail: 'dither',
        pattern: j => {
          const r = k => { let n = Math.imul(j * 2654435761 + k * 40503, 0x45d9f3b); n ^= n >>> 15; n = Math.imul(n, 0x45d9f3b); return ((n ^ n >>> 13) >>> 0) / 4294967296; };
          if (r(1) > .3) return null;
          return r(2) < .15 ? {ink: 'k', solid: .3 + .25 * r(3)} : {ink: 'p', solid: .3 + .35 * r(3)};
        }},
    ],
  }]})
