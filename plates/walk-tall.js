// The cover on tall screens. `avoid` is where the Muybridge plate sits over it on the page (style.css: centred, 86% of
// the width, 1200:713): the pencil stops short of it. If the plate moves or this drawing's height changes, move the rect with it.
render({w: 1200, h: 3200, trim: true, avoid: {rect: [84, 308.91, 1116, 922.09], gap: 26, jitter: .35, taper: 34, seed: 3}, grain: 2, misregister: [3, 2], seed: 11, rivers: [
  {frame: 1250, extend: 1, curve: [[-.5, .5], [.35, .3], [.65, .75], [1.5, .5]], width: 1250, swell: .15, families: [
    {ref: 'head', from: .04, to: 2.4, m: 90, damp: 2, pattern: 'sky', tail: 'dither'},
    {ref: 'pelvis', from: -.03, to: -1.0, m: 28, damp: 1.4, pattern: 'ground', tail: 'dither'},
    {chain: 'farLeg', m: 28, pattern: 'pinkStripes'},
    {chain: 'farArm', m: 16, pattern: 'pinkStripes'},
    {chain: 'torso', m: 32, pattern: 'torso'},
    {chain: 'nearLeg', m: 28, pattern: 'inkStripes'},
    {chain: 'nearArm', m: 16, pattern: 'inkStripes'},
  ]},
]})
