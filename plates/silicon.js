render({w: 2600, h: 1548, grain: 2, misregister: [4, 3], seed: 5, rivers: [
  {curve: [[-.1, .3], [.3, .05], [.5, .62], [1.12, .48]], width: 430, swell: .15, phase: 0, families: [
    {ref: 'head', from: .04, to: 1.1, m: 40, damp: 2, pattern: 'sky'},
    {chain: 'farLeg', m: 26, pattern: 'pinkStripes'},
    {chain: 'torso', m: 30, pattern: 'torso'},
    {chain: 'nearLeg', m: 26, pattern: 'inkStripes'},
    {chain: 'nearArm', m: 16, pattern: 'inkStripes'},
    {ref: 'pelvis', from: -.03, to: -1.0, m: 26, damp: 1.4, pattern: 'groundSparse'},
  ]},
  {curve: [[-.1, .92], [.32, 1.0], [.48, .5], [1.12, .56]], width: 300, swell: .2, phase: .37, families: [
    {ref: 'head', from: .04, to: 1.2, m: 34, damp: 2, pattern: 'skyPale'},
    {chain: 'farLeg', m: 22, pattern: 'pinkStripes'},
    {chain: 'torso', m: 24, pattern: 'pinkTorso'},
    {chain: 'nearLeg', m: 22, pattern: 'pinkStripes'},
    {ref: 'pelvis', from: -.03, to: -1.2, m: 30, damp: 1.4, pattern: 'ground'},
  ]},
], wafer: {cx: .7, cy: .5, r: .47, columns: 17, glow: {ink: 'p', base: .05, lit: .25}}})
