# EXO

A white, scroll-driven presentation of the original EXO mechanism in black silhouette.

The page opens on the manifesto, set on a solid white sheet over the standing silhouette, which stays hidden while you read. Six key phrases get a pale pink marker stroke as the reader reaches them. After the last line, the sheet dissolves and the silhouette appears.

From there, the six-second CAD animation follows scroll progress in both directions. The camera gradually opens its framing as the arms extend. At the bottom, the title **Suit 1** appears, followed by **Full body strength enhancement and data collection**. The company name, **Lithe** (pink, `#ec7aa4`), sits top-left. It shows on load, hides while the manifesto is read, and returns as the machine appears. There is no navigation.

Type is Helvetica Neue Medium for everything read, in two sizes (display and text), small labels included. No serif or mono is used.

## Domain

Live at https://lithe.site, hosted on Vercel (project `lithe` in Andre Boufama's projects), which deploys `dist/` from `aboufama/exo` on every push to `main` (preset Other, no build command, output directory `dist`). `www.lithe.site` redirects to it with a 308. DNS is at Squarespace Domains: A `@` → `216.150.1.1` and CNAME `www` → `2e760cc15adb55c0.vercel-dns-016.com`. The GitHub Pages workflow still publishes a copy at aboufama.github.io/exo.

## Preview

Serve `dist` with any static HTTP server. All runtime assets are local; no external CDN is required.

```sh
python3 -m http.server 4188 --directory dist
```

## Assets and behavior

- `dist/assets/exo.glb` contains the verified v3 motion, reduced to an unlit silhouette asset without changing triangle positions, transforms, or animation values.
- Three.js 0.186.0 is vendored under `dist/vendor`; its license is included.
- `dist/assets/InstrumentSerif-Regular.ttf` (SIL Open Font License) is no longer referenced by the page. It is kept only in case the serif returns.
- The manifesto layer (`dist/manifesto.js`) is independent of Three.js. It fades the sheet, draws the highlights (stroke time scales with phrase length) and paints a static film-grain tile. The palette is black, white and one very light pink (`#f8cbda`).
- The Muybridge plate walks on scroll (`dist/plate.js`). Every 24 px of scroll, each of the twelve boxes shows the next frame, so the sequence plays in all twelve at once, each at its own phase. A second canvas carries a faint motion-capture trace that cuts in on the first scroll, with no fade and moves with the frames. It leads with the feet: an ankle marker on each foot, a pink stride line between them, a dotted trail from the swing foot's previous position, and its coordinates in a 3 × 5 pixel font. The head gets a lighter marker. Ankle and head points were measured by eye to within a few pixels. At the top of the page the plate is shown untouched. Under reduced motion the frames hold still.
- Link previews use `dist/assets/og.jpg` (1200 × 630), rendered from `og-card.html`: the opening screen in miniature (Lithe, the plate as supplied, the Manifesto rule and lede). To re-render it, run headless Chrome or Brave with `--window-size=1200,630 --screenshot` on that file.
- The silhouette stage is fixed behind the manifesto. `app.js` maps the unfold to the `#journey` track that follows it, and skips re-rendering while the pose is unchanged.
- The silhouette is centered horizontally and vertically when the unfold begins, with no visible scroll arrow. Native page scrolling works with touch, trackpads, wheels, and keyboard navigation.
- Reduced-motion preferences replace the continuous animation with standing/spread states, show the highlights without drawing them, and disable reveal transitions.
- Static silhouette posters provide an immediate loading image and a fallback if WebGL cannot initialize.

Verified on desktop and a 390 × 844 mobile viewport: start, intermediate movement, final reveal, reverse scrolling, font loading, no horizontal overflow, and no browser errors.
