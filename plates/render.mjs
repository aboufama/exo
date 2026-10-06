// Renders the site's generated plates: node plates/render.mjs  (from exo-site/; needs Node 22+ and Brave or Chrome).
// Each plate's spec is a call to render() in plates/<name>.js; the result is written losslessly to dist/assets/<name>.webp
// (cwebp, from Homebrew's webp). The drawing itself is in plates.html, gait.js (the walk) and riso.js (the inks).
import {spawn, execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname), assets = path.join(here, '../dist/assets');
const BROWSERS = ['/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
const browser = BROWSERS.find(b => fs.existsSync(b));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const names = process.argv.slice(2).length ? process.argv.slice(2) : ['walk', 'walk-tall', 'foot', 'nexus', 'nexus-tall'];
const port = 9600 + Math.floor(Math.random() * 300), profile = fs.mkdtempSync(path.join(os.tmpdir(), 'plates-'));
const proc = spawn(browser, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run',
  '--allow-file-access-from-files', 'about:blank'], {stdio: 'ignore'});
let target;
for (let i = 0; i < 60 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
await new Promise(r => ws.onopen = r);
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({id: i, method, params})); });
await send('Page.enable');
await send('Page.navigate', {url: 'file://' + path.join(here, 'plates.html')});
await sleep(800);
for (const name of names) {
  const spec = fs.readFileSync(path.join(here, `${name}.js`), 'utf8');
  const r = await send('Runtime.evaluate', {expression: spec, awaitPromise: true, returnByValue: true});
  if (r.result.exceptionDetails) { console.error(name, r.result.exceptionDetails.exception?.description); continue; }
  // A spec with `line` gives two images: <name>.webp, the drawing without that line, and <name>-line.webp, the line.
  const value = r.result.result.value, parts = typeof value === 'string' ? {[name]: value} : {[name]: value.base, [`${name}-line`]: value.line};
  for (const [file, data] of Object.entries(parts)) {
    const png = path.join(profile, `${file}.png`), out = path.join(assets, `${file}.webp`);
    fs.writeFileSync(png, Buffer.from(data, 'base64'));
    execFileSync('cwebp', ['-quiet', '-lossless', '-exact', '-z', '9', png, '-o', out]);
    console.log(out, fs.statSync(out).size, 'bytes');
  }
}
ws.close(); proc.kill();
await new Promise(r => proc.once('exit', r));
fs.rmSync(profile, {recursive: true, force: true, maxRetries: 5, retryDelay: 200});
