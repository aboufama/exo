// Rebuilds the founders' portraits: node portraits/make.mjs (from exo-site/). Needs macOS (the Vision framework, through
// the swift scripts), Node 22+, Brave or Chrome, and dwebp / cwebp from Homebrew's webp.
// For each founder: the CUPI team photo is cropped square around the face (2.6 face widths, eyes 42% down, so the heads
// match); lift.swift finds the subject in the full photo, masks.swift a fine person matte for the crop, and matte.html
// combines them: the fine matte for the hair, bounded by the subject so no background is taken for hair, with the
// background's colour solved out of the soft edge. The result is written to dist/assets/<name>.webp at 600 × 600.
import {spawn, execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname), assets = path.join(here, '../dist/assets');
const PHOTOS = path.join(os.homedir(), 'Documents/CUPI/Website-CUPI/photos/full');
// crop as w:h:x:y in the full photo; options for matte.html (Andre: a dark band of background behind his hair tips,
// left of the jaw, faded out by hand)
const PEOPLE = [
  {name: 'andre', photo: 'Andre.webp', crop: '551:551:270:179', opts: {cutBelow: {y: 330, until: 353, feather: 7, skin: 90}}},
  {name: 'nigel', photo: 'Nigel.webp', crop: '710:710:948:306', opts: {}},
];
const BROWSERS = ['/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'portraits-'));
const run = (cmd, args) => execFileSync(cmd, args, {cwd: work, stdio: ['ignore', 'pipe', 'pipe']}).toString();

for (const p of PEOPLE) {
  const full = path.join(work, `${p.name}-full.png`), sq = path.join(work, `${p.name}-sq.png`);
  run('dwebp', ['-quiet', path.join(PHOTOS, p.photo), '-o', full]);
  run('ffmpeg', ['-loglevel', 'error', '-y', '-i', full, '-vf', `crop=${p.crop}`, sq]);
  run('swift', [path.join(here, 'lift.swift'), full, path.join(work, `${p.name}-cut-full.png`)]);
  run('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(work, `${p.name}-cut-full.png`), '-vf', `alphaextract,crop=${p.crop},format=rgb24`, path.join(work, `${p.name}-subject.png`)]);
  run('swift', [path.join(here, 'masks.swift'), sq, path.join(work, p.name)]);
}

const port = 9500 + Math.floor(Math.random() * 300), profile = fs.mkdtempSync(path.join(os.tmpdir(), 'portraits-browser-'));
const proc = spawn(BROWSERS.find(b => fs.existsSync(b)), ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--allow-file-access-from-files', 'about:blank'], {stdio: 'ignore'});
let target;
for (let i = 0; i < 60 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
await new Promise(r => ws.onopen = r);
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({id: i, method, params})); });
await send('Page.enable');
await send('Page.navigate', {url: 'file://' + path.join(here, 'matte.html')});
await sleep(800);
for (const p of PEOPLE) {
  const f = n => `file://${path.join(work, n)}`;
  const opts = {...p.opts, bound: f(`${p.name}-subject.png`)};
  const r = await send('Runtime.evaluate', {expression: `render(${JSON.stringify(f(`${p.name}-sq.png`))}, ${JSON.stringify(f(`${p.name}-person.png`))}, 600, ${JSON.stringify(opts)})`, awaitPromise: true, returnByValue: true});
  if (r.result.exceptionDetails) { console.error(p.name, r.result.exceptionDetails.exception?.description); continue; }
  const png = path.join(work, `${p.name}.png`), out = path.join(assets, `${p.name}.webp`);
  fs.writeFileSync(png, Buffer.from(r.result.result.value, 'base64'));
  execFileSync('cwebp', ['-quiet', '-q', '88', '-alpha_q', '100', '-exact', '-m', '6', png, '-o', out]);
  console.log(out, fs.statSync(out).size, 'bytes');
}
ws.close(); proc.kill();
await new Promise(r => proc.once('exit', r));
for (const d of [profile, work]) fs.rmSync(d, {recursive: true, force: true, maxRetries: 5, retryDelay: 200});
