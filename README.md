# Lithe

The Lithe site: an essay, *Scaling the Human Experience: An Essay Against Brute Force*, followed by a scroll-driven unfold of Suit 1 in black silhouette.

The page opens on Muybridge's walking plate (top right, as supplied), with the essay title under it. The essay follows in two blocks, Problem and Solution, each hanging from a black rule. It is set on a solid white sheet over the silhouette, which stays hidden while you read. Two phrases carry a static pale pink marker through the x-height. As the last line reaches the upper part of the screen, the sheet dissolves and the silhouette appears.

From there, the six-second CAD animation follows scroll progress in both directions. The camera gradually opens its framing as the arms extend. At the bottom, the title **Suit 1** appears, followed by **Full body strength enhancement and data collection – coming soon**. The company name, **Lithe** (pink, `#ec7aa4`), sits top-left. It shows on load, cuts out while the essay is read, and cuts back in as the machine appears. There is no navigation.

Type is Helvetica Neue Medium for everything read, in two sizes (display and text), small labels included. No serif or mono is used.

## Domain

Live at https://lithe.site, hosted on Vercel (project `lithe` in Andre Boufama's projects), which deploys `dist/` from `aboufama/exo` on every push to `main` (preset Other, no build command, output directory `dist`). `www.lithe.site` redirects to it with a 308. DNS is at Squarespace Domains: A `@` → `216.150.1.1` and CNAME `www` → `2e760cc15adb55c0.vercel-dns-016.com`. GitHub Pages is off: the `Deploy to GitHub Pages` workflow is disabled, and aboufama.github.io/exo returns 404.

## Preview

Serve `dist` with any static HTTP server. All runtime assets are local; no external CDN is required.

```sh
python3 -m http.server 4188 --directory dist
```

## Assets and behavior

- `dist/assets/exo.glb` contains the verified v3 motion, reduced to an unlit silhouette asset without changing triangle positions, transforms, or animation values.
- Three.js 0.186.0 is vendored under `dist/vendor`; its license is included.
- The essay layer (`dist/manifesto.js`) is independent of Three.js. It dissolves the sheet as the last line reaches `data-reveal`, cuts the Lithe mark out and back in, and paints a static film-grain tile. The palette is black, white, one very light pink (`#f8cbda`) for highlights and the brand pink (`#ec7aa4`).
- The Muybridge plate walks on scroll (`dist/plate.js`). Every 24 px of scroll, each of the twelve boxes shows the next frame, so the sequence plays in all twelve at once, each at its own phase. A second canvas carries a faint motion-capture trace that cuts in on the first scroll, with no fade, and moves with the frames. It leads with the feet: an ankle marker on each foot, a pink stride line between them, a dotted trail from the swing foot's previous position, and its coordinates in a 3 × 5 pixel font. The head gets a lighter marker. Ankle and head points were measured by eye to within a few pixels. At the top of the page the plate is shown untouched. Under reduced motion the frames hold still.
- The data-gap figure (`dist/gap.js`) sits beside the large line on wide screens and under it on narrow ones. Circle areas are hours of human experience (internet text, human task video, public humanoid data), drawn live on a canvas with 1 px ordered dithering in black and pink, with small HTML labels.
- Link previews use `dist/assets/og.jpg` (1200 × 630), rendered from `og-card.html`: the plate at full height on its dark border, with the Lithe mark centred over it. To re-render it, run headless Chrome or Brave with `--window-size=1200,630 --screenshot` on that file.
- The silhouette stage is a sticky layer spanning the whole page (not a fixed one, which iPhone Safari misplaces). `app.js` maps the unfold from the essay's last line to the end of the page, and skips re-rendering while the pose is unchanged.
- Native page scrolling works with touch, trackpads, wheels, and keyboard navigation.
- Reduced-motion preferences replace the continuous animation with standing/spread states and shorten the scroll track.
- Static silhouette posters provide an immediate loading image and a fallback if WebGL cannot initialize.
