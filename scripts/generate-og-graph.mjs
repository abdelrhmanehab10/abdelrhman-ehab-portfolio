import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const profile = mkdtempSync(join(process.cwd(), '.chrome-og-'));
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.includes('..')) { res.writeHead(403).end(); return; }
    const file = pathname === '/' ? 'index.html' : pathname.slice(1);
    const data = await readFile(join(process.cwd(), file));
    res.writeHead(200, { 'Content-Type': file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'text/javascript' : file.endsWith('.html') ? 'text/html' : 'application/octet-stream' }).end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-background-networking', '--no-first-run', `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank'], { stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function retry(fn) { for (let i = 0; i < 100; i++) { try { return await fn(); } catch { await delay(100); } } throw Error('Chrome CDP unavailable'); }
let ws;
try {
  const port = await retry(() => Number(readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]) || (() => { throw Error('port'); })());
  const page = await retry(async () => (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page'));
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  const pending = new Map();
  let seq = 0;
  ws.onmessage = ({ data }) => {
    const msg = JSON.parse(data);
    if (!pending.has(msg.id)) return;
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(Error(JSON.stringify(msg.error))) : resolve(msg.result);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` });
  await retry(async () => {
    const result = await send('Runtime.evaluate', { expression: `document.documentElement.dataset.graphReady === 'true' && !!document.querySelector('#graph-canvas-host canvas')`, returnByValue: true });
    if (!result.result.value) throw Error('graph not ready');
  });
  await delay(1000);
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile('assets/images/og-graph.png', Buffer.from(data, 'base64'));
} finally {
  ws?.close(); chrome.kill(); server.close(); await delay(250); rmSync(profile, { recursive: true, force: true });
}
