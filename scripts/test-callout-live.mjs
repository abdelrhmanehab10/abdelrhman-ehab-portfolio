// Focused end-to-end check of the anchored callout at normal and cramped phone sizes.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const evidence = process.env.HERO_GRAPH_EVIDENCE_DIR;
assert.ok(evidence, 'Set HERO_GRAPH_EVIDENCE_DIR');
mkdirSync(evidence, { recursive: true });
const profile = mkdtempSync(join(process.cwd(), '.chrome-callout-'));
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (path.includes('..')) return res.writeHead(403).end();
    const data = await readFile(join(process.cwd(), path === '/' ? 'index.html' : path.slice(1)));
    const ext = path.split('.').pop();
    res.writeHead(200, { 'Content-Type': { js: 'text/javascript', css: 'text/css', svg: 'image/svg+xml' }[ext] || 'text/html' }).end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const chrome = spawn('google-chrome', ['--headless=new','--no-sandbox','--disable-gpu','--disable-background-networking',`--user-data-dir=${profile}`,'--remote-debugging-port=0','about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function retry(fn) { for (let i=0; i<100; i++) { try { return await fn(); } catch { await sleep(100); } } throw Error('Chrome CDP unavailable'); }
let ws, seq=0;
const pending = new Map();
try {
  const port = await retry(() => Number(readFileSync(join(profile,'DevToolsActivePort'),'utf8').split('\n')[0]) || (()=>{throw Error('port')})());
  const page = await retry(async () => (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type==='page'));
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve,reject) => { ws.onopen=resolve; ws.onerror=reject; });
  ws.onmessage = ({data}) => { const msg=JSON.parse(data); if (pending.has(msg.id)) { const {resolve,reject}=pending.get(msg.id); pending.delete(msg.id); msg.error ? reject(Error(JSON.stringify(msg.error))) : resolve(msg.result); } };
  const c = (method,params={}) => new Promise((resolve,reject) => { const id=++seq; pending.set(id,{resolve,reject}); ws.send(JSON.stringify({id,method,params})); });
  async function run(expression) { const r=await c('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true}); if(r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description); return r.result.value; }
  async function capture(label) { const {data}=await c('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}); const path=join(evidence,label+'.png'); writeFileSync(path,Buffer.from(data,'base64')); console.log('SCREENSHOT',path); }
  async function visit(height,id) {
    await c('Emulation.setDeviceMetricsOverride',{width:390,height,deviceScaleFactor:2,mobile:true});
    await c('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await c('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/?viewport=${height}#node/${id}`});
    await retry(async()=>{const ready=await run(`document.documentElement.dataset.graphReady === 'true' && document.querySelector('#graph-panel-title')?.textContent.length > 0`); if(!ready)throw Error('not ready'); return true;});
    await sleep(350);
  }
  const geometry = `(()=>{const s=document.querySelector('#graph-stage'),p=document.querySelector('#graph-panel'),sc=p.querySelector('.graph-panel-scroll'),a=p.querySelector('.graph-panel-arrow'),body=p.querySelector('#graph-panel-body');const sr=s.getBoundingClientRect(),pr=p.getBoundingClientRect();const side=p.dataset.side,L=parseFloat(p.style.left),T=parseFloat(p.style.top),offset=parseFloat(['left','right'].includes(side)?a.style.top:a.style.left);const x=side==='right'?L-30:side==='left'?L+p.offsetWidth+30:L+offset,y=side==='below'?T-30:side==='above'?T+p.offsetHeight+30:T+offset;let cyan=0;if(!a.hidden){const c=s.querySelector('canvas'),k=c.width/c.clientWidth,d=c.getContext('2d').getImageData(Math.round(x*k)-3,Math.round(y*k)-3,7,7).data;for(let i=0;i<d.length;i+=4)if(d[i]<150&&d[i+1]>200&&d[i+2]>220)cyan++}return {stageHeight:s.clientHeight,side,arrow:!a.hidden,x,y,cyan,width:p.offsetWidth,stageWidth:s.clientWidth,panelHeight:p.offsetHeight,scrollMax:parseFloat(sc.style.maxHeight),scrollHeight:sc.scrollHeight,scrollClient:sc.clientHeight,inside:pr.left>=sr.left-1&&pr.right<=sr.right+1&&pr.top>=sr.top-1&&pr.bottom<=sr.bottom+1,expanded:p.querySelector('#graph-panel-more')?.getAttribute('aria-expanded'),clamped:body.classList.contains('is-clamped'),title:p.querySelector('h2')?.textContent}})()`;
  await c('Page.enable'); await c('Runtime.enable');
  await visit(844,'me');
  let r=await run(geometry); assert.ok(r.inside && r.side==='below' && r.arrow && r.cyan>=30 && r.width>=r.stageWidth-25,JSON.stringify(r));
  console.log('PHONE ROOT',JSON.stringify(r));
  await capture('focused-phone-root');
  r=await run(`(()=>{document.querySelector('#graph-panel-more').click();return ${geometry}})()`);
  assert.ok(r.expanded==='true' && !r.clamped && r.scrollHeight>r.scrollClient && r.inside && r.arrow && r.cyan>=30, JSON.stringify(r));
  console.log('EXPANDED PHONE',JSON.stringify(r));
  await capture('focused-phone-expanded');
  await run(`(()=>{const s=document.querySelector('.graph-panel-scroll');s.scrollTop=s.scrollHeight;return s.scrollTop})()`);
  const scrolled=await run(`({top:document.querySelector('.graph-panel-scroll').scrollTop,foot:document.querySelector('.graph-panel-foot').getBoundingClientRect().bottom,panel:document.querySelector('#graph-panel').getBoundingClientRect().bottom})`);
  assert.ok(scrolled.top>0 && scrolled.foot<=scrolled.panel+1,JSON.stringify(scrolled));
  console.log('SCROLL TO FOOT',JSON.stringify(scrolled));
  await capture('focused-phone-expanded-scrolled');
  await visit(400,'me');
  r=await run(geometry); console.log('SHORT PHONE ROOT',JSON.stringify(r));
  assert.ok(r.stageHeight===400 && r.inside && r.panelHeight<=r.stageHeight && (!r.arrow || r.cyan>=30),JSON.stringify(r));
  await capture('focused-phone-short');
  await visit(270,'me');
  r=await run(geometry); console.log('CRAMPED PHONE ROOT',JSON.stringify(r));
  assert.ok(r.stageHeight===270 && (!r.arrow || r.cyan>=30),JSON.stringify(r));
  await capture('focused-phone-cramped');
} finally { ws?.close(); chrome.kill(); server.close(); await sleep(250); rmSync(profile,{recursive:true,force:true}); }
