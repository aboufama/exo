// Debug mode (?debug in the address): a panel, top right, that tunes the whole page live: its type (five font packs
// besides the site's own Plex), its colours (ten palettes, or any three inks), its spacing, its drawings and its motion,
// with ten presets of combinations. None of it runs without ?debug, and none of it changes the site: settings are kept
// in this browser while debugging (localStorage), and the Settings section gives them as JSON, to be baked into the site.
// Keys: ` shows or hides the panel, 1–9 and 0 pick a preset. Double-click a control's name to reset it.
//
// Everything the panel touches is a custom property on <html> (see style.css): a font pack (data-type) and a palette
// (data-palette) each set a group of them, and a control sets one inline, which wins over both. Picking a pack or a
// palette clears the inline values in its group. The drawings are images printed in the site's inks (white, black and
// pink), so under any other inks they are repainted here, pixel by pixel, and swapped in.
const params = new URLSearchParams(location.search);

const PACKS = [
  {id: 'plex', name: 'Plex', note: 'IBM Plex Sans. Mankind and machine; the site’s own.', css: 'IBM+Plex+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700'},
  {id: 'anybody', name: 'Anybody', note: 'Will. One face from ultra-condensed to ultra-expanded.', css: 'Anybody:ital,wdth,wght@0,50..150,100..900;1,50..150,100..900'},
  {id: 'grenze', name: 'Grenze', note: 'Gothic. A modern blackletter over its Roman sibling; the Faustian soul was Gothic.', css: 'Grenze+Gotisch:wght@100..900&family=Grenze:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400'},
  {id: 'martian', name: 'Martian', note: 'Machine. A monospace superfamily, set like an engineering log.', css: 'Martian+Mono:wdth,wght@75..112.5,100..800'},
  {id: 'shoulders', name: 'Shoulders', note: 'Industry. Big Shoulders: Chicago steel, condensed and monumental.', css: 'Big+Shoulders:opsz,wght@10..72,100..900'},
  {id: 'syne', name: 'Syne', note: 'Avant-garde. A forceful extra-bold over a sharp text weight.', css: 'Syne:wght@400..800'},
];
const PALETTES = [
  {id: 'lithe', name: 'Lithe', note: 'Black and pink on white; the site’s own.'},
  {id: 'riso', name: 'Riso', note: 'Federal blue and fluorescent pink on newsprint.'},
  {id: 'ibm', name: 'IBM', note: 'Gray 100 and Blue 60 on white: the report’s colours.'},
  {id: 'signal', name: 'Signal', note: 'International Orange, the colour of aerospace and safety gear, on warm grey.'},
  {id: 'klein', name: 'Klein', note: 'International Klein Blue on white.'},
  {id: 'oxblood', name: 'Oxblood', note: 'Oxblood and black on bone, like a bound manuscript.'},
  {id: 'faust', name: 'Faust', note: 'Ember on black: the bargain’s fire.'},
  {id: 'blueprint', name: 'Blueprint', note: 'White and cyan on blue: an engineer’s drawing.'},
  {id: 'phosphor', name: 'Phosphor', note: 'Green on black: the first terminals.'},
  {id: 'mono', name: 'Mono', note: 'Black and grey on white: no colour at all.'},
];
// Ten combinations, on keys 1–9 and 0.
const PRESETS = [
  {name: 'Lithe', note: 'The site as it is.', type: 'plex', palette: 'lithe', vars: {}},
  {name: 'Report', note: 'IBM’s annual report: Plex, light and open, in Gray and Blue.', type: 'plex', palette: 'ibm',
    vars: {'--title-w': '300', '--title-t': '-0.02em', '--title-x': '1.08', '--lead-w': '600', '--text-w': '300', '--text-lh': '1.55', '--para': '0.9em', '--measure': '31'}},
  {name: 'Engine', note: 'Industrial: Big Shoulders in International Orange.', type: 'shoulders', palette: 'signal', vars: {}},
  {name: 'Faust', note: 'Gothic in ember on black.', type: 'grenze', palette: 'faust', vars: {}},
  {name: 'Riso', note: 'Expanded Anybody, printed in fluorescent pink and federal blue.', type: 'anybody', palette: 'riso', vars: {}},
  {name: 'Telemetry', note: 'A terminal log: Martian Mono in phosphor green.', type: 'martian', palette: 'phosphor',
    vars: {'--title-case': 'uppercase', '--title-x': '0.6'}},
  {name: 'Blueprint', note: 'An engineer’s drawing: hairline Plex on blue.', type: 'plex', palette: 'blueprint',
    vars: {'--title-w': '200', '--title-x': '1.15', '--title-t': '-0.01em', '--lead-w': '500', '--text-w': '300', '--label-case': 'uppercase', '--label-t': '0.08em'}},
  {name: 'Klein', note: 'Avant-garde: Syne in International Klein Blue.', type: 'syne', palette: 'klein', vars: {}},
  {name: 'Manuscript', note: 'Blackletter and oxblood on bone.', type: 'grenze', palette: 'oxblood', vars: {'--text-x': '1.12', '--text-lh': '1.4', '--measure': '30'}},
  {name: 'Monolith', note: 'Condensed, black, capitals, no colour.', type: 'anybody', palette: 'mono',
    vars: {'--title-s': '75%', '--title-w': '900', '--title-x': '1.3', '--title-case': 'uppercase', '--lead-s': '75%', '--lead-w': '900', '--lead-x': '1.05', '--lead-measure': '12.5em', '--text-s': '85%', '--text-w': '500'}},
];

// The controls, in groups. `owner` says which choice clears it: a font pack ('type') or a palette ('palette').
// Ranges show their value and set it with `unit`; `read` measures the page for values given as clamp() in the CSS.
const measure = (selector, property) => () => parseFloat(getComputedStyle(document.querySelector(selector))[property]) || 0;
const T = 'type';
const GROUPS = [
  {title: 'Title', items: [
    {key: '--title-x', label: 'Size', min: .4, max: 2, step: .01, def: 1, owner: T},
    {key: '--title-w', label: 'Weight', min: 100, max: 900, step: 10, def: 500, owner: T},
    {key: '--title-s', label: 'Width', min: 50, max: 150, step: 1, unit: '%', def: 100, owner: T},
    {key: '--title-t', label: 'Tracking', min: -.12, max: .12, step: .005, unit: 'em', def: -.035, owner: T},
    {key: '--title-lh', label: 'Leading', min: .7, max: 1.6, step: .01, def: 1, owner: T},
    {key: '--title-case', label: 'Capitals', kind: 'toggle', on: 'uppercase', off: 'none', owner: T},
  ]},
  {title: 'Statement', items: [
    {key: '--lead-x', label: 'Size', min: .4, max: 2, step: .01, def: 1, owner: T},
    {key: '--lead-w', label: 'Weight', min: 100, max: 900, step: 10, def: 700, owner: T},
    {key: '--lead-s', label: 'Width', min: 50, max: 150, step: 1, unit: '%', def: 100, owner: T},
    {key: '--lead-t', label: 'Tracking', min: -.12, max: .12, step: .005, unit: 'em', def: -.03, owner: T},
    {key: '--lead-lh', label: 'Leading', min: .7, max: 1.8, step: .01, def: 1.08, owner: T},
    {key: '--lead-measure', label: 'Measure', min: 6, max: 30, step: .5, unit: 'em', def: 16, owner: T},
    {key: '--lead-case', label: 'Capitals', kind: 'toggle', on: 'uppercase', off: 'none', owner: T},
    {key: '--lead-align', label: 'Align', kind: 'select', options: ['center', 'left', 'right'], def: 'center'},
  ]},
  {title: 'Text', items: [
    {key: '--text-x', label: 'Size', min: .5, max: 1.8, step: .01, def: 1, owner: T},
    {key: '--text-w', label: 'Weight', min: 100, max: 900, step: 10, def: 400, owner: T},
    {key: '--text-s', label: 'Width', min: 50, max: 150, step: 1, unit: '%', def: 100, owner: T},
    {key: '--text-t', label: 'Tracking', min: -.08, max: .12, step: .002, unit: 'em', def: 0, owner: T},
    {key: '--text-lh', label: 'Leading', min: .9, max: 2.4, step: .01, def: 1.42, owner: T},
  ]},
  {title: 'Labels', items: [
    {key: '--label', label: 'Size', min: 8, max: 22, step: .5, unit: 'px', def: 13, owner: T},
    {key: '--label-w', label: 'Weight', min: 100, max: 900, step: 10, def: 500, owner: T},
    {key: '--label-t', label: 'Tracking', min: -.05, max: .2, step: .005, unit: 'em', def: .01, owner: T},
    {key: '--label-case', label: 'Capitals', kind: 'toggle', on: 'uppercase', off: 'none', owner: T},
    {key: '--note', label: 'Notes', min: 7, max: 18, step: .5, unit: 'px', def: 11, owner: T},
  ]},
  {title: 'Inks', items: [
    {key: '--paper', label: 'Paper', kind: 'color', owner: 'palette'},
    {key: '--ink', label: 'Ink', kind: 'color', owner: 'palette'},
    {key: '--accent', label: 'Accent', kind: 'color', owner: 'palette'},
  ]},
  {title: 'Space', items: [
    {key: '--gutter', label: 'Margins', min: 0, max: 200, step: 1, unit: 'px', read: measure('.sheet', 'paddingLeft')},
    {key: '--title-above', label: 'Over title', min: 0, max: 240, step: 1, unit: 'px', read: measure('.title-page', 'paddingTop')},
    {key: '--title-below', label: 'Under title', min: 0, max: 320, step: 1, unit: 'px', read: measure('.title-page', 'paddingBottom')},
    {key: '--measure', label: 'Column', min: 16, max: 60, step: 1, def: 33},
    {key: '--para', label: 'Paragraphs', min: 0, max: 3, step: .05, unit: 'em', def: .7},
    {key: '--lead-gap', label: 'Statement', min: 0, max: 6, step: .05, unit: 'em', def: 1.25},
    {key: '--essay-below', label: 'Before foot', min: 0, max: 600, step: 1, unit: 'px', read: measure('.sheet', 'paddingBottom')},
  ]},
  {title: 'Drawings', items: [
    {key: '--cover-o', label: 'Cover', min: 0, max: 1, step: .01, def: 1},
    {key: '--plate-display', label: 'Plate', kind: 'toggle', on: 'block', off: 'none', def: 'block'},
    {key: '--plate-scale', label: 'Plate size', min: .3, max: 1.8, step: .01, def: 1},
    {key: '--nexus-display', label: 'Nexus', kind: 'toggle', on: 'block', off: 'none', def: 'block'},
    {key: '--nexus-o', label: 'Nexus lines', min: 0, max: 1, step: .01, def: 0},
    {key: '--nexus-w', label: 'Nexus width', min: 20, max: 100, step: .5, unit: 'em', def: 50},
    {key: '--braille-display', label: 'Braille', kind: 'toggle', on: 'block', off: 'none', def: 'block'},
    {key: '--braille-density', label: 'Density', min: 0, max: 5, step: .05, def: 2.5},
    {key: '--braille-dot', label: 'Dot', min: 1, max: 4, step: 1, unit: 'px', def: 3},
    {key: '--braille-o', label: 'Braille ink', min: 0, max: 1, step: .01, def: 1},
    {key: '--foot-display', label: 'Foot', kind: 'toggle', on: 'block', off: 'none', def: 'block'},
    {key: '--foot-o', label: 'Foot ink', min: 0, max: 1, step: .01, def: 1},
    {key: '--founder-dither', label: 'Portrait dither', min: 0, max: 2.5, step: .05, def: 1},
  ]},
  {title: 'Founders', items: [
    {key: '--portrait', label: 'Portraits', min: 50, max: 280, step: 1, unit: 'px', read: measure('.portrait', 'width')},
    {key: '--card-pad', label: 'Padding', min: 0, max: 40, step: 1, unit: 'px', read: measure('.founder', 'paddingLeft')},
    {key: '--shadow-display', label: 'Shadow', kind: 'toggle', on: 'block', off: 'none', def: 'block'},
    {key: '--shadow-off', label: 'Offset', min: 0, max: 24, step: 1, unit: 'px', def: 5},
  ]},
  {title: 'Motion', items: [
    {key: '--plate-step', label: 'Plate step', min: 4, max: 120, step: 1, unit: 'px', def: 24, write: v => `${v}`},
    {key: '--loader-step', label: 'Loader', min: 60, max: 800, step: 10, unit: 'ms', def: 210, write: v => `${v}`},
  ]},
];
const CONTROLS = GROUPS.flatMap(g => g.items);

if (params.has('debug')) {
  const root = document.documentElement, KEY = 'lithe-tune', PRINTED = {paper: [255, 255, 255], ink: [0, 0, 0], accent: [236, 122, 164]};
  const DERIVED = ['--foot-bg']; // set here, never saved
  const store = {
    get: () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; } },
    set: v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} },
  };

  // Colours: a CSS colour to [r, g, b] (hex and rgb() read directly; anything else through a canvas, which may be off
  // by a level), and back to #rrggbb.
  const probe = document.createElement('canvas').getContext('2d', {willReadFrequently: true});
  probe.canvas.width = probe.canvas.height = 1;
  const rgb = colour => {
    const s = colour.trim();
    let m = s.match(/^#([0-9a-f]{3,8})$/i);
    if (m) { let h = m[1]; if (h.length <= 4) h = [...h].map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); }
    m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
    if (m) return [m[1], m[2], m[3]].map(n => Math.round(+n));
    probe.clearRect(0, 0, 1, 1); probe.fillStyle = '#000'; probe.fillStyle = s; probe.fillRect(0, 0, 1, 1);
    return [...probe.getImageData(0, 0, 1, 1).data.slice(0, 3)];
  };
  const hex = colour => '#' + rgb(colour).map(n => n.toString(16).padStart(2, '0')).join('');

  // ── State: the pack, the palette, and the inline values. ──
  const state = () => {
    const vars = {};
    for (let i = 0; i < root.style.length; i++) { const k = root.style[i]; if (k.startsWith('--') && !DERIVED.includes(k)) vars[k] = root.style.getPropertyValue(k).trim(); }
    return {type: root.dataset.type || 'plex', palette: root.dataset.palette || 'lithe', vars};
  };
  const valueOf = c => {
    const inline = root.style.getPropertyValue(c.key).trim();
    const computed = inline || getComputedStyle(root).getPropertyValue(c.key).trim();
    if (c.kind === 'color') return hex(computed);
    if (c.kind === 'toggle' || c.kind === 'select') return computed || c.def || c.off;
    if (computed && !/[a-z]\(/i.test(computed)) return parseFloat(computed);
    return c.read ? c.read() : c.def;
  };
  const write = (c, v) => c.write ? c.write(v) : `${+(+v).toFixed(4)}${c.unit && c.unit !== 'ms' ? c.unit : ''}`;

  // ── Fonts: each pack's families, loaded from Google Fonts when first used. ──
  const fonts = pack => new Promise(resolve => {
    if (!pack.css || document.querySelector(`link[data-pack="${pack.id}"]`)) return resolve();
    const link = Object.assign(document.createElement('link'), {rel: 'stylesheet', href: `https://fonts.googleapis.com/css2?family=${pack.css}&display=swap`});
    link.dataset.pack = pack.id;
    link.onload = link.onerror = () => resolve();
    document.head.append(link);
  });

  // ── Drawings: repainted in the current inks. Each pixel is paper, ink or accent as printed; it takes the new one. ──
  const cache = new Map();
  const repaint = (url, inks) => {
    const key = `${url}|${inks.paper}|${inks.ink}|${inks.accent}`;
    if (!cache.has(key)) cache.set(key, (async () => {
      const img = new Image(); img.src = url; await img.decode();
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const g = c.getContext('2d', {willReadFrequently: true}); g.drawImage(img, 0, 0);
      const data = g.getImageData(0, 0, c.width, c.height), p = data.data;
      for (let i = 0; i < p.length; i += 4) {
        if (!p[i + 3]) continue;
        const r = p[i], gg = p[i + 1], b = p[i + 2];
        const to = r > 240 && gg > 240 && b > 240 ? inks.paper : r + gg + b < 180 ? inks.ink : inks.accent;
        p[i] = to[0]; p[i + 1] = to[1]; p[i + 2] = to[2];
      }
      g.putImageData(data, 0, 0);
      return new Promise(res => c.toBlob(blob => res(URL.createObjectURL(blob)), 'image/png'));
    })());
    return cache.get(key);
  };
  let paintTimer = 0, paintRun = 0;
  const repaintAll = () => {
    clearTimeout(paintTimer);
    paintTimer = setTimeout(async () => {
      const run = ++paintRun, css = getComputedStyle(root);
      const inks = {paper: rgb(css.getPropertyValue('--paper').trim()), ink: rgb(css.getPropertyValue('--ink').trim()), accent: rgb(css.getPropertyValue('--accent').trim())};
      const printed = ['paper', 'ink', 'accent'].every(k => inks[k].join() === PRINTED[k].join());
      const targets = [
        [document.querySelector('.cover picture img'), 'src'],
        [document.querySelector('.cover picture source'), 'srcset'],
        [document.querySelector('.nexus'), 'src'],
        [document.querySelector('.lead picture source'), 'srcset'],
      ].filter(([el]) => el);
      for (const [el, attr] of targets) el.dataset.original ||= el.getAttribute(attr);
      if (printed) {
        for (const [el, attr] of targets) el.setAttribute(attr, el.dataset.original);
        root.style.removeProperty('--foot-bg');
        return;
      }
      for (const [el, attr] of targets) { const url = await repaint(el.dataset.original, inks); if (run !== paintRun) return; el.setAttribute(attr, url); }
      const foot = await repaint('./assets/foot.webp', inks);
      if (run === paintRun) root.style.setProperty('--foot-bg', `url("${foot}")`);
    }, 120);
  };

  // ── Changes: tell the page (its scripts re-read their tokens), keep the state, refresh the panel. ──
  let frame = 0, saveTimer = 0;
  const changed = ({inks = false, type = false} = {}) => {
    if (inks) { repaintAll(); dispatchEvent(new Event('lithe:palette')); }
    if (type) { const pack = PACKS.find(p => p.id === (root.dataset.type || 'plex')); fonts(pack).then(() => document.fonts.ready).then(() => { dispatchEvent(new Event('lithe:type')); refresh(); }); }
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; dispatchEvent(new Event('lithe:tune')); refresh(); });
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => store.set(state()), 200);
  };
  const setType = id => {
    if (id === 'plex') delete root.dataset.type; else root.dataset.type = id;
    for (const c of CONTROLS) if (c.owner === T) root.style.removeProperty(c.key);
    changed({type: true});
  };
  const setPalette = id => {
    root.dataset.palette = id; // set even for the site's own, so the tint and soft ink follow tuned inks
    for (const c of CONTROLS) if (c.owner === 'palette') root.style.removeProperty(c.key);
    changed({inks: true});
  };
  const apply = s => {
    root.removeAttribute('style');
    if (!s.type || s.type === 'plex') delete root.dataset.type; else root.dataset.type = s.type;
    root.dataset.palette = s.palette || 'lithe';
    for (const [k, v] of Object.entries(s.vars || {})) root.style.setProperty(k, v);
    changed({inks: true, type: true});
  };

  // ── The panel. ──
  const el = (tag, props = {}, ...children) => { const n = Object.assign(document.createElement(tag), props); n.append(...children); return n; };
  const panel = el('div', {className: 'tune'});
  panel.setAttribute('aria-label', 'Tune the page (debug)');
  const presetNote = el('span', {textContent: 'Tune'});
  const toggle = el('button', {type: 'button', textContent: '–', title: 'Hide the panel ( ` )'});
  const head = el('div', {className: 'tune-head'}, presetNote, toggle);
  const body = el('div', {className: 'tune-body'});
  panel.append(head, body);
  const setOpen = open => { panel.classList.toggle('closed', !open); toggle.textContent = open ? '–' : '+'; toggle.title = open ? 'Hide the panel ( ` )' : 'Show the panel ( ` )'; };
  toggle.addEventListener('click', () => setOpen(panel.classList.contains('closed')));
  const section = (title, open, ...children) => { const d = el('details', {open}, el('summary', {textContent: title}), el('div', {className: 'tune-group'}, ...children)); body.append(d); return d; };
  const buttons = (items, onPick, label) => { const row = el('div', {className: 'tune-buttons'}); row.setAttribute('aria-label', label); const list = items.map((it, i) => { const b = el('button', {type: 'button', textContent: it.name, title: it.note}); b.addEventListener('click', () => onPick(it, i)); row.append(b); return b; }); return {row, list}; };
  const note = () => el('p', {className: 'tune-note'});

  // Presets
  const presetText = note();
  const presets = buttons(PRESETS.map((p, i) => ({...p, name: `${(i + 1) % 10} ${p.name}`})), (p, i) => { apply(PRESETS[i]); presetText.textContent = PRESETS[i].note; }, 'Presets');
  const misc = el('div', {className: 'tune-buttons'});
  const random = el('button', {type: 'button', textContent: 'Random', title: 'A random font pack and palette'});
  random.addEventListener('click', () => { const pick = a => a[Math.floor(Math.random() * a.length)]; apply({type: pick(PACKS).id, palette: pick(PALETTES).id, vars: {}}); presetText.textContent = 'A random pack and palette.'; });
  const reset = el('button', {type: 'button', textContent: 'Reset', title: 'Back to the site as it is'});
  reset.addEventListener('click', () => { apply(PRESETS[0]); presetText.textContent = PRESETS[0].note; });
  const replay = el('button', {type: 'button', textContent: 'Replay loader'});
  replay.addEventListener('click', () => dispatchEvent(new Event('lithe:replay')));
  misc.append(random, reset, replay);
  section('Presets', true, presets.row, misc, presetText);

  // Type: packs, then the controls of each role
  const packText = note();
  const packs = buttons(PACKS, p => setType(p.id), 'Font packs');
  const rows = new Map();
  const control = c => {
    const id = `tune${c.key}`, label = el('label', {htmlFor: id, textContent: c.label, title: `${c.key} · double-click to reset`});
    let input, out = el('output');
    if (c.kind === 'toggle') {
      input = el('input', {type: 'checkbox', id});
      input.addEventListener('change', () => { root.style.setProperty(c.key, input.checked ? c.on : c.off); changed(); });
    } else if (c.kind === 'select') {
      input = el('select', {id}, ...c.options.map(o => el('option', {value: o, textContent: o})));
      input.addEventListener('change', () => { root.style.setProperty(c.key, input.value); changed(); });
    } else if (c.kind === 'color') {
      input = el('input', {type: 'color', id});
      input.addEventListener('input', () => { root.dataset.palette ||= 'lithe'; root.style.setProperty(c.key, input.value); changed({inks: true}); });
    } else {
      input = el('input', {type: 'range', id, min: c.min, max: c.max, step: c.step});
      input.addEventListener('input', () => { root.style.setProperty(c.key, write(c, input.value)); changed({inks: false}); });
    }
    label.addEventListener('dblclick', () => { root.style.removeProperty(c.key); changed({inks: c.kind === 'color'}); });
    const row = el('div', {className: 'tune-row'}, label, input, out);
    rows.set(c.key, {c, row, input, out});
    return row;
  };
  const typeSection = section('Type', true, packs.row, packText);
  const typeGroup = typeSection.querySelector('.tune-group');
  for (const g of GROUPS.slice(0, 4)) typeGroup.append(el('p', {className: 'tune-note', textContent: g.title}), ...g.items.map(control));

  // Colour: palettes, then the three inks
  const paletteText = note();
  const palettes = buttons(PALETTES, p => setPalette(p.id), 'Palettes');
  section('Colour', false, palettes.row, paletteText, ...GROUPS[4].items.map(control));

  for (const g of GROUPS.slice(5)) {
    const s = section(g.title, false, ...g.items.map(control));
    if (g.title === 'Motion') s.querySelector('.tune-group').append(el('p', {className: 'tune-note', textContent: 'The loader plays on Replay loader, in Presets.'}));
  }

  // Settings: the state as JSON, to copy, or to paste and apply
  const json = el('textarea', {spellcheck: false});
  json.setAttribute('aria-label', 'Settings as JSON');
  const copy = el('button', {type: 'button', textContent: 'Copy'});
  copy.addEventListener('click', async () => { json.value = JSON.stringify(state(), null, 2); json.select(); try { await navigator.clipboard.writeText(json.value); copy.textContent = 'Copied'; } catch { document.execCommand?.('copy'); copy.textContent = 'Selected'; } setTimeout(() => (copy.textContent = 'Copy'), 1200); });
  const paste = el('button', {type: 'button', textContent: 'Apply'});
  paste.addEventListener('click', () => { try { apply(JSON.parse(json.value)); } catch { paste.textContent = 'Not JSON'; setTimeout(() => (paste.textContent = 'Apply'), 1200); } });
  section('Settings', false, el('div', {className: 'tune-buttons'}, copy, paste), json, el('p', {className: 'tune-note', textContent: 'Send these to bake a look into the site. Paste settings here and Apply to load them.'}));

  // Show each control's value, and which choices are in use.
  const refresh = () => {
    const s = state();
    packs.list.forEach((b, i) => b.setAttribute('aria-pressed', PACKS[i].id === s.type));
    palettes.list.forEach((b, i) => b.setAttribute('aria-pressed', PALETTES[i].id === s.palette));
    packText.textContent = PACKS.find(p => p.id === s.type)?.note || '';
    paletteText.textContent = PALETTES.find(p => p.id === s.palette)?.note || 'Custom inks.';
    const match = PRESETS.findIndex(p => p.type === s.type && p.palette === s.palette && JSON.stringify(Object.entries(p.vars).sort()) === JSON.stringify(Object.entries(s.vars).sort()));
    presets.list.forEach((b, i) => b.setAttribute('aria-pressed', i === match));
    presetNote.textContent = match >= 0 ? `Tune · ${PRESETS[match].name}` : 'Tune · custom';
    for (const {c, row, input, out} of rows.values()) {
      const v = valueOf(c), set = root.style.getPropertyValue(c.key) !== '';
      row.classList.toggle('set', set);
      if (c.kind === 'toggle') { input.checked = v === c.on; out.textContent = ''; }
      else if (c.kind === 'select') { input.value = v; out.textContent = ''; }
      else if (c.kind === 'color') { if (document.activeElement !== input) input.value = v; out.textContent = v; }
      else { if (document.activeElement !== input) input.value = v; out.textContent = `${+(+v).toFixed(c.step < .01 ? 3 : c.step < 1 ? 2 : 0)}${c.unit || ''}`; }
    }
  };

  document.body.append(panel);
  setOpen(innerWidth >= 700 && params.get('tune') !== 'closed');
  addEventListener('keydown', e => {
    // Not while typing: in the settings box, a menu, or a text field (sliders, ticks and buttons are fine).
    const typing = /^(textarea|select)$/i.test(e.target.tagName) || e.target.isContentEditable || (e.target.tagName === 'INPUT' && !/^(range|checkbox|color|button)$/.test(e.target.type));
    if (e.metaKey || e.ctrlKey || e.altKey || typing) return;
    if (e.key === '`') setOpen(panel.classList.contains('closed'));
    const i = '1234567890'.indexOf(e.key);
    if (i >= 0 && e.key.length === 1) { apply(PRESETS[i]); presetText.textContent = PRESETS[i].note; }
  });

  // Start: a preset, pack or palette named in the address; else the last settings; else the site as it is.
  const named = params.get('preset'), preset = PRESETS.find(p => p.name.toLowerCase() === named?.toLowerCase());
  const start = preset || {...(store.get() || PRESETS[0]), ...(params.get('type') && {type: params.get('type'), vars: {}}), ...(params.get('palette') && {palette: params.get('palette')})};
  apply(start);
  if (preset) presetText.textContent = preset.note;
}
