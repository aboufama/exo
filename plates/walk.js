// The cover. `avoid` is where the Muybridge plate sits over it on the page (style.css: centred, 50% of the width,
// 1200:713): the pencil stops short of it. If the plate moves or this drawing's height changes, move the rect with it.
render({w: 2800, h: 3000, trim: true, avoid: {rect: [700, 168.58, 2100, 1000.42], gap: 16, jitter: .35, taper: 24, seed: 3}, grain: 2, misregister: [4, 3], seed: 7, rivers: [
  {frame: 1150, extend: 1, curve: [[-.12, .52], [.36, .08], [.56, .98], [1.14, .52]], width: 430, swell: .2, families: [
    {ref: 'head', from: .04, to: 2.8, m: 104, damp: 2, pattern: 'sky', tail: 'dither'},
    {ref: 'pelvis', from: -.03, to: -1.0, m: 28, damp: 1.4, pattern: 'ground', tail: 'dither'},
    {chain: 'farLeg', m: 30, pattern: 'pinkStripes'},
    {chain: 'farArm', m: 18, pattern: 'pinkStripes'},
    {chain: 'torso', m: 36, pattern: 'torso'},
    {chain: 'nearLeg', m: 30, pattern: 'inkStripes'},
    {chain: 'nearArm', m: 18, pattern: 'inkStripes'},
  ]},
]})
