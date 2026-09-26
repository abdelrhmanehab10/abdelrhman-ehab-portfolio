import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const evidence = process.env.HERO_GRAPH_EVIDENCE_DIR;
if (!evidence) throw Error('Set HERO_GRAPH_EVIDENCE_DIR to an evidence directory before running');
mkdirSync(evidence, { recursive: true });
const profile = mkdtempSync(join(process.cwd(), '.chrome-live-'));
let failVendor = false;
const server = (await import('node:http')).createServer(async (req, res) => {
  try {
    const file = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (file.includes('..')) { res.writeHead(403).end(); return; }
    if (failVendor && file === '/assets/vendor/force-graph-1.51.4.min.js') { res.writeHead(503).end(); return; }
    const data = await (await import('node:fs/promises')).readFile(join(process.cwd(), file === '/' ? 'index.html' : file.slice(1)));
    const ext = file === '/' ? 'html' : file.split('.').pop();
    res.writeHead(200, { 'Content-Type': ({ html: 'text/html', js: 'text/javascript', css: 'text/css', svg: 'image/svg+xml' })[ext] || 'application/octet-stream' }).end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-background-networking', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank'], { stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function retry(fn) { for (let i = 0; i < 100; i++) { try { return await fn(); } catch { await delay(100); } } throw Error('Chrome CDP unavailable'); }
let ws;
const pending = new Map();
let seq = 0;
try {
  const { readFileSync } = await import('node:fs');
  const debugPort = await retry(() => Number(readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]) || (() => { throw Error('port'); })());
  const page = await retry(async () => (await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(t => t.type === 'page'));
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  ws.onmessage = ({ data }) => { const msg = JSON.parse(data); if (msg.id && pending.has(msg.id)) { const { resolve, reject } = pending.get(msg.id); pending.delete(msg.id); msg.error ? reject(Error(JSON.stringify(msg.error))) : resolve(msg.result); } };
  function c(method, params = {}) { return new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); }); }
  async function evaluate(expression) {
    const result = await c('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.text + ': ' + result.exceptionDetails.exception?.description);
    return result.result.value;
  }
  async function go(path = '/', js = true, width = 1440, height = 900, reduced = false) {
    await c('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: width < 500 ? 3 : 1, mobile: width < 500 });
    await c('Emulation.setScriptExecutionDisabled', { value: !js });
    await c('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
    await c('Page.navigate', { url: `http://127.0.0.1:${server.address().port}${path}` });
    for (let i = 0; i < 100; i++) {
      const ready = await evaluate(`!!document.querySelector('#graph-index-wrap') && (!${js} || document.documentElement.dataset.graphReady === 'true' || document.querySelector('#graph-status')?.textContent.includes('unavailable'))`);
      if (ready) break;
      await delay(200);
    }
    await delay(500);
  }
  async function screenshot(name) {
    const { data } = await c('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const file = join(evidence, name);
    writeFileSync(file, Buffer.from(data, 'base64'));
    console.log('SCREENSHOT', file);
  }
  async function check(label, expression, predicate) {
    const result = await evaluate(expression);
    assert.ok(predicate(result), `${label}: ${JSON.stringify(result)}`);
    console.log(label, JSON.stringify(result));
    return result;
  }
  async function key(key, code, virtualKey, modifiers = 0) {
    const text = key === 'Enter' ? '\r' : undefined;
    await c('Input.dispatchKeyEvent', { type: 'keyDown', key, code, modifiers, text, unmodifiedText: text, windowsVirtualKeyCode: virtualKey, nativeVirtualKeyCode: virtualKey });
    await c('Input.dispatchKeyEvent', { type: 'keyUp', key, code, modifiers, windowsVirtualKeyCode: virtualKey, nativeVirtualKeyCode: virtualKey });
  }
  async function compareCanvas(source) {
    return evaluate(`(async()=>{const first=await (async()=>{const image=new Image();image.src=${JSON.stringify(source)};await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const context=canvas.getContext('2d');context.drawImage(image,0,0);return context.getImageData(0,0,image.width,image.height).data})();const c=document.querySelector('#graph-canvas-host canvas'),second=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let count=0,total=0;for(let i=0;i<Math.min(first.length,second.length);i+=64){total++;if(Math.abs(first[i]-second[i])+Math.abs(first[i+1]-second[i+1])+Math.abs(first[i+2]-second[i+2])>60)count++}return count/total})()`);
  }
  await c('Page.enable'); await c('Runtime.enable'); await c('Network.enable'); await c('Network.setCacheDisabled', { cacheDisabled: true });

  await go();
  await check('desktop fills viewport with a solid background and no chrome controls', `(()=>{const stage=document.querySelector('#graph-stage'),index=document.querySelector('#graph-index-wrap'),body=getComputedStyle(document.body),s=getComputedStyle(stage),r=stage.getBoundingClientRect();return {canvas:!!stage.querySelector('canvas'),rect:{x:r.x,y:r.y,width:r.width,height:r.height},viewport:{width:innerWidth,height:innerHeight},pageOverflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,bodyColor:body.backgroundColor,bodyImage:body.backgroundImage,stageColor:s.backgroundColor,stageImage:s.backgroundImage,stageBorder:s.borderWidth,indexBorder:getComputedStyle(index).borderWidth,controls:!!document.querySelector('#graph-controls,.graph-buttons,#btn-list,#btn-reset,#btn-motion'),caption:!!document.querySelector('#graph-caption'),panelBorder:getComputedStyle(document.querySelector('#graph-panel')).borderWidth,nodes:document.querySelectorAll('#graph-index [data-node]').length,links:document.querySelectorAll('#graph-index .graph-index-connections a').length,graphOnly:!document.querySelector('header,nav,footer,section'),status:document.querySelector('#graph-status').textContent,statusOutside:!stage.contains(document.querySelector('#graph-status')),description:stage.getAttribute('aria-describedby')}})()`, r => r.canvas && r.rect.x === 0 && r.rect.y === 0 && r.rect.width === r.viewport.width && r.rect.height === r.viewport.height && !r.pageOverflow && r.bodyColor === 'rgb(6, 12, 23)' && r.bodyImage === 'none' && r.stageColor === 'rgb(6, 12, 23)' && r.stageImage === 'none' && r.stageBorder === '0px' && r.indexBorder === '0px' && !r.controls && !r.caption && r.panelBorder === '1px' && r.nodes === 52 && r.links === 208 && r.graphOnly && r.status === 'Explore the profile graph' && r.statusOutside && r.description === 'graph-instructions');
  await screenshot('desktop-default.png');

  await c('Page.bringToFront');
  await key('Tab', 'Tab', 9);
  await check('keyboard skip link appears with visible focus', `(()=>{const a=document.activeElement,s=getComputedStyle(a),r=a.getBoundingClientRect();return {class:a.className,text:a.textContent.trim(),top:r.top,outline:s.outlineStyle,outlineWidth:s.outlineWidth,outlineColor:s.outlineColor}})()`, r => r.class === 'skip-link' && r.text === 'Skip to profile list' && r.top >= 0 && r.outlineStyle !== 'none' && r.outlineWidth === '3px');
  await key('Enter', 'Enter', 13);
  await check('keyboard opens the list and focuses its return link first', `({focus:document.activeElement.id,visible:getComputedStyle(document.querySelector('#graph-index-wrap')).clip==='auto',nodes:document.querySelectorAll('#graph-index [data-node]').length,returnLink:document.querySelector('#graph-index-return').textContent.trim()})`, r => r.focus === 'graph-index-wrap' && r.visible && r.nodes === 52 && r.returnLink === 'Return to graph');
  await screenshot('desktop-list-view.png');
  await key('Tab', 'Tab', 9);
  await check('list has keyboard path back to graph', `({focus:document.activeElement.id,text:document.activeElement.textContent.trim(),outline:getComputedStyle(document.activeElement).outlineStyle})`, r => r.focus === 'graph-index-return' && r.text === 'Return to graph');
  await key('Enter', 'Enter', 13);
  await check('return link restores graph focus', `({focus:document.activeElement.id,listClip:getComputedStyle(document.querySelector('#graph-index-wrap')).clip})`, r => r.focus === 'graph-stage' && r.listClip !== 'auto');
  await key('Tab', 'Tab', 9, 8);
  await key('Enter', 'Enter', 13);
  await key('Tab', 'Tab', 9);
  await key('Tab', 'Tab', 9);
  await check('keyboard reaches a node from the profile list', `({focus:document.activeElement.dataset.node,label:document.activeElement.textContent.trim()})`, r => r.focus === 'me' && r.label === 'Abdelrhman Ehab');
  await key('Enter', 'Enter', 13);
  await check('keyboard opens focused list detail and Escape restores its origin', `({title:document.querySelector('#graph-panel-title')?.textContent,focus:document.activeElement.id})`, r => !!r.title && r.focus === 'graph-panel');
  await key('Escape', 'Escape', 27);
  await check('Escape closes detail and restores the list entry focus', `({hidden:document.querySelector('#graph-panel').hidden,node:document.activeElement.dataset.node})`, r => r.hidden && r.node === 'me');
  await key('Escape', 'Escape', 27);
  await check('Escape returns keyboard focus from the index to the graph', `({focus:document.activeElement.id,listClip:getComputedStyle(document.querySelector('#graph-index-wrap')).clip})`, r => r.focus === 'graph-stage' && r.listClip !== 'auto');

  await go('/?reset-check=1', true, 1440, 900, true);
  const desktopStart = await evaluate(`document.querySelector('#graph-canvas-host canvas').toDataURL()`);
  const desktopRect = await evaluate(`document.querySelector('#graph-stage').getBoundingClientRect().toJSON()`);
  await c('Input.dispatchMouseEvent', { type: 'mouseWheel', x: desktopRect.width / 2, y: desktopRect.height / 2, deltaX: 0, deltaY: -240 }); await delay(400);
  const desktopZoomed = await evaluate(`document.querySelector('#graph-canvas-host canvas').toDataURL()`);
  assert.notEqual(desktopZoomed, desktopStart, 'wheel zoom should change the canvas');
  await key('Escape', 'Escape', 27); await delay(500);
  assert.ok(await compareCanvas(desktopStart) < 0.08, 'Escape should reset the graph view');
  console.log('keyboard Escape resets the graph view');
  await check('reduced-motion graph is settled without manual controls', `({preference:matchMedia('(prefers-reduced-motion: reduce)').matches,controls:!!document.querySelector('#graph-controls,#btn-motion'),status:document.querySelector('#graph-status').textContent})`, r => r.preference && !r.controls && r.status === 'Explore the profile graph');
  const stable = await evaluate(`document.querySelector('#graph-canvas-host canvas').toDataURL()`); await delay(1100);
  assert.equal(await evaluate(`document.querySelector('#graph-canvas-host canvas').toDataURL()`), stable, 'reduced-motion canvas should remain still while idle');
  console.log('reduced-motion canvas remains still while idle');

  await go('/#node/me', true, 1440, 900, true);
  await check('desktop callout retains card styling and remains inside the fullscreen stage', `(()=>{const s=document.querySelector('#graph-stage').getBoundingClientRect(),p=document.querySelector('#graph-panel'),r=p.getBoundingClientRect();return {title:document.querySelector('#graph-panel-title')?.textContent,hidden:p.hidden,inside:r.left>=s.left&&r.top>=s.top&&r.right<=s.right&&r.bottom<=s.bottom,border:getComputedStyle(p).borderWidth,stage:s.toJSON()}})()`, r => r.title === 'Abdelrhman Ehab' && !r.hidden && r.inside && r.border === '1px');
  await screenshot('desktop-callout.png');

  await go('/', true, 390, 844);
  await check('390px graph fills the viewport without scrollbars or decorative borders', `(()=>{const s=document.querySelector('#graph-stage'),r=s.getBoundingClientRect();return {canvas:!!s.querySelector('canvas'),rect:{x:r.x,y:r.y,width:r.width,height:r.height},viewport:{width:innerWidth,height:innerHeight},pageOverflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,body:getComputedStyle(document.body).backgroundColor,bodyImage:getComputedStyle(document.body).backgroundImage,stage:getComputedStyle(s).backgroundColor,border:getComputedStyle(s).borderWidth,indexBorder:getComputedStyle(document.querySelector('#graph-index-wrap')).borderWidth,controls:!!document.querySelector('#graph-controls,.graph-buttons,#btn-list,#btn-reset,#btn-motion'),nodes:document.querySelectorAll('#graph-index [data-node]').length}})()`, r => r.canvas && r.rect.x === 0 && r.rect.y === 0 && r.rect.width === 390 && r.rect.height === 844 && r.viewport.width === 390 && r.viewport.height === 844 && !r.pageOverflow && r.body === 'rgb(6, 12, 23)' && r.bodyImage === 'none' && r.stage === 'rgb(6, 12, 23)' && r.border === '0px' && r.indexBorder === '0px' && !r.controls && r.nodes === 52);
  await screenshot('mobile-default.png');
  await go('/#node/me', true, 390, 844, true);
  await check('phone callout remains clamped inside the fullscreen graph', `(()=>{const s=document.querySelector('#graph-stage').getBoundingClientRect(),p=document.querySelector('#graph-panel'),r=p.getBoundingClientRect();return {title:document.querySelector('#graph-panel-title')?.textContent,hidden:p.hidden,width:r.width,stageWidth:s.width,inside:r.left>=s.left&&r.top>=s.top&&r.right<=s.right&&r.bottom<=s.bottom,border:getComputedStyle(p).borderWidth}})()`, r => r.title === 'Abdelrhman Ehab' && !r.hidden && r.inside && r.width >= r.stageWidth - 25 && r.border === '1px');
  await screenshot('mobile-callout-profile.png');

  for (const [width, height, name] of [[1440, 900, 'desktop-no-javascript.png'], [390, 844, 'mobile-no-javascript.png']]) {
    await go('/', false, width, height);
    await check(`${width}px no-JavaScript list fallback fills the viewport`, `(()=>{const stage=document.querySelector('#graph-stage'),index=document.querySelector('#graph-index-wrap'),r=index.getBoundingClientRect();return {stage:getComputedStyle(stage).display,rect:{x:r.x,y:r.y,width:r.width,height:r.height},viewport:{width:innerWidth,height:innerHeight},pageOverflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,bg:getComputedStyle(document.body).backgroundColor,bgImage:getComputedStyle(document.body).backgroundImage,indexBg:getComputedStyle(index).backgroundColor,indexBorder:getComputedStyle(index).borderWidth,controls:!!document.querySelector('#graph-controls,.graph-buttons,#btn-list,#btn-reset,#btn-motion'),nodes:document.querySelectorAll('#graph-index [data-node]').length,links:document.querySelectorAll('#graph-index .graph-index-connections a').length,interactiveHint:getComputedStyle(document.querySelector('.graph-index-interactive-hint')).display}})()`, r => r.stage === 'none' && r.rect.x === 0 && r.rect.y === 0 && r.rect.width === width && r.rect.height === height && r.viewport.width === width && r.viewport.height === height && !r.pageOverflow && r.bg === 'rgb(6, 12, 23)' && r.bgImage === 'none' && r.indexBg === 'rgb(6, 12, 23)' && r.indexBorder === '0px' && !r.controls && r.nodes === 52 && r.links === 208 && r.interactiveHint === 'none');
    await screenshot(name);
  }

  failVendor = true;
  await go('/?vendor-failure=1#node/proj-efa', true, 390, 844);
  await check('graph-library failure keeps its status and full-list fallback', `({stage:document.querySelector('#graph-stage').hidden,status:document.querySelector('#graph-status').textContent,role:document.querySelector('#graph-status').getAttribute('role'),statusOutside:!document.querySelector('#graph-stage').contains(document.querySelector('#graph-status')),nodes:document.querySelectorAll('#graph-index [data-node]').length,title:document.querySelector('#graph-panel-title')?.textContent,panelHidden:document.querySelector('#graph-panel').hidden,controls:!!document.querySelector('#graph-controls,#btn-list,#btn-reset,#btn-motion')})`, r => r.stage && r.status === 'Graph unavailable — showing profile list' && r.role === 'status' && r.statusOutside && r.nodes === 52 && r.title === 'EFA' && !r.panelHidden && !r.controls);
  await screenshot('mobile-library-fallback.png');
} finally {
  ws?.close(); chrome.kill(); server.close(); await delay(250); rmSync(profile, { recursive: true, force: true });
}
