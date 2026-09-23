# EXO

A white, scroll-driven presentation of the original EXO mechanism in black silhouette.

The six-second CAD animation follows scroll progress in both directions. The camera gradually opens its framing as the arms extend. At the bottom, the name **EXO** appears in Instrument Serif, followed by **Full body strength enhancement and data collection**. No other visible copy or navigation is added.

## Preview

Serve `dist` with any static HTTP server. All runtime assets are local; no external CDN is required.

```sh
python3 -m http.server 4188 --directory dist
```

## Assets and behavior

- `dist/assets/exo.glb` contains the verified v3 motion, reduced to an unlit silhouette asset without changing triangle positions, transforms, or animation values.
- Three.js 0.186.0 is vendored under `dist/vendor`; its license is included.
- Instrument Serif Regular is self-hosted with its SIL Open Font License. Source: https://github.com/google/fonts/tree/main/ofl/instrumentserif
- The opening silhouette is centered horizontally and vertically, with no visible scroll arrow. Native page scrolling works with touch, trackpads, wheels, and keyboard navigation.
- Reduced-motion preferences replace the continuous animation with standing/spread states and disable reveal transitions.
- Static silhouette posters provide an immediate loading image and a fallback if WebGL cannot initialize.

Verified on desktop and a 390 × 844 mobile viewport: start, intermediate movement, final reveal, reverse scrolling, font loading, no horizontal overflow, and no browser errors.
