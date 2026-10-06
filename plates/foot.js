// The foot of the page: a sliver of the walk drawing rising from the bottom edge, on a transparent ground, behind the
// tabs. Its lines run off the bottom and both sides.
// `line` splits off the topmost line into foot-line.webp; the page draws it in (as you scroll to the foot).
render({line: {family: 0, band: 12}, w: 2800, h: 700, trim: 'top', pad: 4, paper: null, grain: 2, misregister: [4, 3], seed: 31, rivers: [
  {frame: 700, extend: 1, curve: [[-.12, 1.29], [.4, 1.0], [.62, 1.3], [1.12, 1.2]], width: 470, swell: .2, phase: .2, families: [
    {ref: 'head', from: .04, to: .4, m: 16, damp: 2, pattern: 'skyPale', tail: 'dither'},
    {chain: 'farArm', m: 18, pattern: 'pinkStripes'},
    {chain: 'torso', m: 36, pattern: 'torso'},
    {chain: 'nearArm', m: 18, pattern: 'inkStripes'},
  ]},
]})
