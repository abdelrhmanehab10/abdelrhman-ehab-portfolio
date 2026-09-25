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
const port = server.address().port;
const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-background-networking', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank'], { stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function retry(fn) { for (let i=0;i<100;i++) { try { return await fn(); } catch { await delay(100); } } throw Error('Chrome CDP unavailable'); }
let ws;
const pending = new Map();
let seq = 0;
try {
  const { readFileSync } = await import('node:fs');
  const debugPort = await retry(() => Number(readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]) || (()=>{throw Error('port')})());
  const page = await retry(async () => (await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(t => t.type === 'page'));
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  ws.onmessage = ({ data }) => { const msg=JSON.parse(data); if (msg.id && pending.has(msg.id)) { const {resolve,reject}=pending.get(msg.id); pending.delete(msg.id); msg.error ? reject(Error(JSON.stringify(msg.error))) : resolve(msg.result); } };
  function c(method, params={}) { return new Promise((resolve,reject) => { const id=++seq; pending.set(id,{resolve,reject}); ws.send(JSON.stringify({id,method,params})); }); }
  async function evalJs(expression) { const r=await c('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true}); if (r.exceptionDetails) throw Error(r.exceptionDetails.text + ': ' + r.exceptionDetails.exception?.description); return r.result.value; }
  async function go(path='/', js=true, width=1440, height=900, reduced=false) {
    await c('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:width<500?3:1,mobile:width<500});
    await c('Emulation.setScriptExecutionDisabled',{value:!js});
    await c('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion', value:reduced?'reduce':'no-preference'}]});
    await c('Page.navigate',{url:`http://127.0.0.1:${port}${path}`});
    for (let i=0;i<100;i++) { if (await evalJs(`!!document.querySelector('#graph-index-wrap') && (!${js} || document.querySelector('#graph-status')?.textContent.includes('nodes') || document.querySelector('#graph-status')?.textContent.includes('unavailable'))`)) break; await delay(200); }
    await delay(500);
  }
  async function screenshot(name) { const {data}=await c('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}); const file=join(evidence,name); writeFileSync(file,Buffer.from(data,'base64')); console.log('SCREENSHOT',file); }
  // Where the callout's arrow points (30px from the card edge), whether the selected node's
  // cyan fill is actually drawn there on the canvas, and whether the card fits the stage.
  const callout = `(()=>{const p=document.querySelector('#graph-panel'),a=p.querySelector('.graph-panel-arrow'),side=p.dataset.side;if(!side||p.hidden||a.hidden)return {side,hidden:p.hidden,arrow:!a.hidden,title:document.querySelector('#graph-panel-title')?.textContent};const L=parseFloat(p.style.left),T=parseFloat(p.style.top),w=p.offsetWidth,h=p.offsetHeight,off=parseFloat(side==='right'||side==='left'?a.style.top:a.style.left);const x=side==='right'?L-30:side==='left'?L+w+30:L+off,y=side==='below'?T-30:side==='above'?T+h+30:T+off;const c=document.querySelector('#graph-canvas-host canvas'),k=c.width/c.clientWidth,d=c.getContext('2d').getImageData(Math.round(x*k)-3,Math.round(y*k)-3,7,7).data;let cyan=0;for(let i=0;i<d.length;i+=4)if(d[i]<150&&d[i+1]>200&&d[i+2]>220)cyan++;const s=document.querySelector('#graph-stage').getBoundingClientRect(),r=p.getBoundingClientRect();return {side,x:Math.round(x),y:Math.round(y),cyan,arrow:!a.hidden,inside:r.left>=s.left-1&&r.right<=s.right+1&&r.top>=s.top-1&&r.bottom<=s.bottom+1}})()`;
  const onNode = r => ['right','left','below','above'].includes(r.side) && r.arrow && r.inside && r.cyan >= 30;
  async function check(label, expression, pred) { const result=await evalJs(expression); assert.ok(pred(result), `${label}: ${JSON.stringify(result)}`); console.log(label,JSON.stringify(result)); return result; }
  await c('Page.enable'); await c('Runtime.enable'); await c('Network.enable'); await c('Network.setCacheDisabled',{cacheDisabled:true});
  await go();
  await check('desktop first paint, content and SEO', `({canvas:!!document.querySelector('#graph-canvas-host canvas'),status:document.querySelector('#graph-status').textContent,index:document.querySelectorAll('#graph-index [data-node]').length,links:document.querySelectorAll('#graph-index .graph-index-connections a').length,graphOnly:!document.querySelector('header,nav,footer,section'),fits:document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth,cta:!!document.querySelector('a[href="./assets/abdelrhmanehab_resume.pdf"][download]'),title:document.title,ld:JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)['@type'],og:document.querySelector('meta[property="og:title"]')?.content,canonical:document.querySelector('link[rel="canonical"]')?.href,bg:getComputedStyle(document.querySelector('#graph-stage')).backgroundColor})`, r=>r.canvas&&r.status.includes('52 nodes')&&r.status.includes('104 connections')&&r.index===52&&r.links===208&&r.graphOnly&&r.fits&&r.cta&&r.ld==='Person'&&r.og&&r.canonical);
  await screenshot('live-desktop.png');
  await evalJs(`document.querySelector('#graph-stage').scrollIntoView({block:'center'})`); await delay(500); await screenshot('live-desktop-stage.png');
  const rect = await evalJs(`document.querySelector('#graph-stage').getBoundingClientRect().toJSON()`);
  await c('Input.dispatchMouseEvent',{type:'mouseMoved',x:rect.left+rect.width/2,y:rect.top+rect.height/2}); await delay(300);
  await evalJs(`document.querySelector('#btn-motion').click()`);
  let hit;
  for (let y=rect.top+125;y<rect.top+230&&!hit;y+=6) for (let x=rect.left+330;x<rect.left+700&&!hit;x+=6) {
    await c('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});
    const title=await evalJs(`(()=>{const t=document.querySelector('[class*=float-tooltip]');return t && getComputedStyle(t).display!=='none' ? t.textContent.trim() : ''})()`);
    if (title) hit={x,y,title};
  }
  assert.ok(hit,'paused canvas hover should reveal a node tooltip'); console.log('PAUSED HOVER',hit);
  await c('Input.dispatchMouseEvent',{type:'mousePressed',x:hit.x,y:hit.y,button:'left',clickCount:1});
  await c('Input.dispatchMouseEvent',{type:'mouseReleased',x:hit.x,y:hit.y,button:'left',clickCount:1});
  await check('paused canvas click opens hovered visible node',`({title:document.querySelector('#graph-panel-title')?.textContent,hidden:document.querySelector('#graph-panel').hidden})`,r=>!r.hidden&&r.title===hit.title);
  await screenshot('live-paused-canvas-detail.png');
  await evalJs(`document.querySelector('#graph-panel-close').click()`);
  const panStart={x:rect.left+75,y:rect.top+545};
  await c('Input.dispatchMouseEvent',{type:'mouseMoved',...panStart});
  await c('Input.dispatchMouseEvent',{type:'mousePressed',...panStart,button:'left',clickCount:1});
  for (let step=1;step<=7;step++) await c('Input.dispatchMouseEvent',{type:'mouseMoved',x:panStart.x+step*10,y:panStart.y+step*4,button:'left',buttons:1});
  await c('Input.dispatchMouseEvent',{type:'mouseReleased',x:panStart.x+70,y:panStart.y+28,button:'left',clickCount:1});
  await delay(300);
  await screenshot('live-paused-pan-stage.png');
  let pannedHit;
  for(let y=hit.y-90;y<hit.y+105&&!pannedHit;y+=6) for(let x=hit.x-90;x<hit.x+145&&!pannedHit;x+=6) {
    await c('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});
    const title=await evalJs(`(()=>{const t=document.querySelector('[class*=float-tooltip]');return t && getComputedStyle(t).display!=='none'?t.textContent.trim():''})()`);
    if(title===hit.title) pannedHit={x,y,title};
  }
  assert.ok(pannedHit,'paused pan should preserve the visible node and picking');
  await c('Input.dispatchMouseEvent',{type:'mousePressed',x:pannedHit.x,y:pannedHit.y,button:'left',clickCount:1});
  await c('Input.dispatchMouseEvent',{type:'mouseReleased',x:pannedHit.x,y:pannedHit.y,button:'left',clickCount:1});
  await check('paused pan preserves precise canvas click',`document.querySelector('#graph-panel-title')?.textContent`,r=>r===pannedHit.title);
  await screenshot('live-paused-pan-detail.png');
  await evalJs(`document.querySelector('#graph-panel-close').click();document.querySelector('#btn-motion').click();document.querySelector('#btn-list').click()`);
  await check('List view exposes the index', `({visible:getComputedStyle(document.querySelector('#graph-index-wrap')).clip === 'auto',expanded:document.querySelector('#btn-list').getAttribute('aria-expanded'),entries:document.querySelectorAll('#graph-index [data-node]').length})`, r=>r.visible&&r.expanded==='true'&&r.entries===52);
  await evalJs(`document.querySelector('#graph-index-wrap').scrollIntoView({block:'start'})`); await delay(250); await screenshot('live-list-view.png');
  await check('list links navigate to another entry', `(()=>{let a=document.querySelector('#graph-node-proj-efa .graph-index-connections a[href="#graph-node-craft-performance"]');a.click();return {hash:location.hash,target:document.querySelector(location.hash)?.querySelector('button')?.textContent,listVisible:getComputedStyle(document.querySelector('#graph-index-wrap')).clip}})()`,r=>r.hash==='#graph-node-craft-performance'&&r.target==='Performance & Quality');
  await evalJs(`document.querySelector('[data-node="proj-efa"]').focus()`);
  await delay(350);
  await c('Page.bringToFront');
  await c('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13});
  await c('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await check('keyboard Enter opens focused list entry',`({title:document.querySelector('#graph-panel-title')?.textContent,focus:document.activeElement?.id})`,r=>r.title==='EFA'&&r.focus==='graph-panel');
  await c('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});
  await c('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await check('keyboard Escape restores origin',`({hidden:document.querySelector('#graph-panel').hidden,focus:document.activeElement?.dataset.node})`,r=>r.hidden&&r.focus==='proj-efa');
  await evalJs(`document.querySelector('[data-node="proj-virtuwa-hv"]').click()`);
  await check('list details and privacy', `({title:document.querySelector('#graph-panel-title').textContent,visible:!document.querySelector('#graph-panel').hidden,private:document.querySelector('#graph-panel').textContent,hash:location.hash})`,r=>r.title.includes('VirtuWa HV')&&r.visible&&r.private.includes('session-based bootstrap')&&!/sensitive VM\/connection data|browser URLs/i.test(r.private)&&r.hash==='#node/proj-virtuwa-hv');
  await delay(300); await screenshot('live-desktop-detail.png');
  await evalJs(`document.querySelector('[data-node="link-email"]').click()`);
  await check('Connect email detail provides mail action', `({title:document.querySelector('#graph-panel-title').textContent,href:document.querySelector('#graph-panel .graph-action')?.getAttribute('href')})`,r=>r.title==='Email'&&r.href==='mailto:abdelrhmanehab047@gmail.com');
  await delay(300); await screenshot('live-connect-email.png');
  await evalJs(`document.querySelector('[data-node="link-resume"]').click()`);
  await check('Connect resume detail serves PDF download', `(async()=>{const a=document.querySelector('#graph-panel .graph-action');const response=await fetch(a.href);const bytes=new Uint8Array(await response.arrayBuffer());return {title:document.querySelector('#graph-panel-title').textContent,download:a.hasAttribute('download'),status:response.status,signature:String.fromCharCode(...bytes.slice(0,5)),length:bytes.length}})()`,r=>r.title==='Resume (PDF)'&&r.download&&r.status===200&&r.signature==='%PDF-'&&r.length>1000);
  await delay(300); await screenshot('live-connect-resume.png');
  await evalJs(`document.querySelector('[data-node="proj-virtuwa-hv"]').click();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);
  await check('Escape returns focus', `({hidden:document.querySelector('#graph-panel').hidden,focused:document.activeElement?.dataset.node,hash:location.hash})`,r=>r.hidden&&r.focused==='proj-virtuwa-hv'&&r.hash==='');
  await evalJs(`document.querySelector('#btn-list').click()`);
  await check('Hide list conceals index without hiding the graph', `({hidden:document.querySelector('#graph-index-wrap').classList.contains('graph-index-hidden'),expanded:document.querySelector('#btn-list').getAttribute('aria-expanded'),canvas:!!document.querySelector('#graph-canvas-host canvas')})`, r=>r.hidden&&r.expanded==='false'&&r.canvas);
  await evalJs(`location.hash='#node/proj-virtuwa-hv'`); await delay(1500);
  const pointed = await check('desktop callout arrow points at the selected node', callout, onNode);
  await screenshot('live-callout-desktop.png');
  const frames = await evalJs(`new Promise(done=>{const p=document.querySelector('#graph-panel'),seen=[];const step=()=>{seen.push([parseFloat(p.style.left),parseFloat(p.style.top)]);seen.length<40?requestAnimationFrame(step):done(seen)};requestAnimationFrame(step)})`);
  const jump = Math.max(...frames.slice(1).map(([x, y], i) => Math.hypot(x - frames[i][0], y - frames[i][1])));
  assert.ok(jump <= 3, `callout jitters with motion on: ${jump}px between frames`); console.log('CALLOUT FRAMES', { frames: frames.length, largestStep: jump });
  const stageRect = await evalJs(`document.querySelector('#graph-stage').getBoundingClientRect().toJSON()`);
  await c('Input.dispatchMouseEvent',{type:'mouseWheel',x:stageRect.left+pointed.x-150,y:stageRect.top+pointed.y+100,deltaX:0,deltaY:-240}); await delay(700);
  await check('callout follows its node after zoom', callout, onNode);
  const dragFrom = { x: stageRect.left + 40, y: stageRect.bottom - 40 };
  await c('Input.dispatchMouseEvent',{type:'mouseMoved',...dragFrom});
  await c('Input.dispatchMouseEvent',{type:'mousePressed',...dragFrom,button:'left',clickCount:1});
  for (let step=1;step<=8;step++) await c('Input.dispatchMouseEvent',{type:'mouseMoved',x:dragFrom.x+step*12,y:dragFrom.y-step*6,button:'left',buttons:1});
  await c('Input.dispatchMouseEvent',{type:'mouseReleased',x:dragFrom.x+96,y:dragFrom.y-48,button:'left',clickCount:1}); await delay(500);
  await check('callout follows its node after pan', `({open:!document.querySelector('#graph-panel').hidden,...${callout}})`, r => r.open && onNode(r));
  await screenshot('live-callout-desktop-panned.png');
  await check('Read more expands the clamped card', `(()=>{const b=document.querySelector('#graph-panel-more'),before=b.getAttribute('aria-expanded');b.click();const after=b.getAttribute('aria-expanded'),clamped=document.querySelector('#graph-panel-body').classList.contains('is-clamped');b.click();return {before,after,clamped,back:b.getAttribute('aria-expanded'),text:b.textContent}})()`, r => r.before==='false'&&r.after==='true'&&!r.clamped&&r.back==='false'&&r.text==='Read more');
  await go('/#node/proj-efa');
  await check('deep link opens on load', `({title:document.querySelector('#graph-panel-title')?.textContent,hidden:document.querySelector('#graph-panel').hidden})`,r=>r.title==='EFA'&&!r.hidden);
  await evalJs(`location.hash='#node/proj-virtuwa-hv'`); await delay(200);
  await check('hashchange selects new detail', `document.querySelector('#graph-panel-title')?.textContent`,r=>r.includes('VirtuWa HV'));
  await go('/',true,390,844);
  await check('mobile has all nodes and stage', `({stage:document.querySelector('#graph-stage').getBoundingClientRect().toJSON(),canvas:!!document.querySelector('canvas'),list:document.querySelectorAll('#graph-index [data-node]').length,overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight})`,r=>r.canvas&&r.list===52&&!r.overflow&&r.stage.width>300);
  await screenshot('live-mobile.png');
  await evalJs(`document.querySelector('#graph-stage').scrollIntoView({block:'center'})`); await delay(500); await screenshot('live-mobile-stage.png');
  await evalJs(`document.querySelector('#btn-motion').click()`);
  await check('pause and reset after wheel', `(()=>{const btn=document.querySelector('#btn-motion');return {pressed:btn.getAttribute('aria-pressed'),text:btn.textContent}})()`,r=>r.pressed==='true'&&r.text==='Resume motion');
  await delay(1200);
  const before=await evalJs(`window.initialCanvas=document.querySelector('#graph-canvas-host canvas').toDataURL()`);
  const mobileRect=await evalJs(`document.querySelector('#graph-stage').getBoundingClientRect().toJSON()`);
  await c('Input.dispatchMouseEvent',{type:'mouseWheel',x:mobileRect.left+180,y:mobileRect.top+200,deltaY:-220,deltaX:0}); await delay(550);
  const zoomed=await evalJs(`document.querySelector('#graph-canvas-host canvas').toDataURL()`);
  assert.notEqual(zoomed,before,'real paused canvas changes on wheel zoom');
  await screenshot('live-mobile-zoom.png');
  await evalJs(`document.querySelector('#btn-reset').click()`); await delay(800);
  const restored=await evalJs(`document.querySelector('#graph-canvas-host canvas').toDataURL()`);
  const fraction=await evalJs(`(async()=>{const picture=async(src)=>{const image=new Image();image.src=src;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const context=canvas.getContext('2d');context.drawImage(image,0,0);return context.getImageData(0,0,image.width,image.height).data};const first=await picture(window.initialCanvas);const second=(()=>{const c=document.querySelector('#graph-canvas-host canvas');return c.getContext('2d').getImageData(0,0,c.width,c.height).data})();let count=0,total=0;for(let i=0;i<Math.min(first.length,second.length);i+=64){total++;if(Math.abs(first[i]-second[i])+Math.abs(first[i+1]-second[i+1])+Math.abs(first[i+2]-second[i+2])>60)count++}return count/total})()`);
  assert.ok(fraction<0.08,`Reset view left too much of the opening canvas changed: ${fraction}`);
  console.log('MOBILE RESET', {zoomChanged:zoomed!==before, pixelsRestored:restored===before, changedPixelFraction:fraction});
  await screenshot('live-mobile-reset.png');
  await evalJs(`location.hash='#node/me'`); await delay(800);
  await check('phone callout sits above or below its node inside the stage', callout, r => onNode(r) && (r.side === 'below' || r.side === 'above'));
  await screenshot('live-callout-phone.png');
  for (const id of ['role-pro-event', 'link-resume']) { await evalJs(`location.hash='#node/${id}'`); await delay(500); await screenshot(`live-callout-phone-${id}.png`); }
  await evalJs(`document.querySelector('#graph-panel-close').click()`);
  await go('/',true,390,844,true);
  await check('reduced motion settled graph', `({pressed:document.querySelector('#btn-motion').getAttribute('aria-pressed'),canvas:!!document.querySelector('canvas'),status:document.querySelector('#graph-status').textContent})`,r=>r.pressed==='true'&&r.canvas&&r.status.includes('52 nodes'));
  const stillCanvas=await evalJs(`document.querySelector('#graph-canvas-host canvas').toDataURL()`);
  await delay(1100);
  assert.equal(await evalJs(`document.querySelector('#graph-canvas-host canvas').toDataURL()`),stillCanvas,'reduced-motion graph should not animate while idle');
  console.log('REDUCED MOTION', 'idle canvas unchanged after 1100 ms');
  await evalJs(`document.querySelector('#graph-stage').scrollIntoView({block:'center'})`); await delay(300);
  await screenshot('live-mobile-reduced.png');
  const reducedRect=await evalJs(`document.querySelector('#graph-stage').getBoundingClientRect().toJSON()`);
  let reducedHit;
  for (let y=reducedRect.top+155;y<reducedRect.top+305&&!reducedHit;y+=8) for (let x=reducedRect.left+110;x<reducedRect.left+280&&!reducedHit;x+=8) {
    await c('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});
    const title=await evalJs(`(()=>{const t=document.querySelector('[class*=float-tooltip]');return t && getComputedStyle(t).display!=='none' ? t.textContent.trim() : ''})()`);
    if(title) reducedHit={x,y,title};
  }
  assert.ok(reducedHit,'reduced-motion hover should reveal a node');
  await c('Input.dispatchMouseEvent',{type:'mousePressed',x:reducedHit.x,y:reducedHit.y,button:'left',clickCount:1});
  await c('Input.dispatchMouseEvent',{type:'mouseReleased',x:reducedHit.x,y:reducedHit.y,button:'left',clickCount:1});
  await check('reduced-motion canvas click opens exactly hovered node',`({title:document.querySelector('#graph-panel-title')?.textContent,hidden:document.querySelector('#graph-panel').hidden})`,r=>!r.hidden&&r.title===reducedHit.title);
  await check('reduced-motion callout points at its node without animating', `({animation:getComputedStyle(document.querySelector('#graph-panel')).animationName,...${callout}})`, r => r.animation === 'none' && onNode(r));
  await screenshot('live-mobile-reduced-detail.png');
  failVendor=true; await go('/?fail=1#node/proj-efa',true,390,844);
  await check('vendor failure deep link visible', `({stage:document.querySelector('#graph-stage').hidden,index:getComputedStyle(document.querySelector('#graph-index-wrap')).display,panel:document.querySelector('#graph-panel').textContent,title:document.querySelector('#graph-panel-title')?.textContent,hidden:document.querySelector('#graph-panel').hidden})`,r=>r.stage&&r.title==='EFA'&&!r.hidden);
  await screenshot('live-vendor-failure.png');
  await evalJs(`location.hash='#node/proj-virtuwa-hv'`); await delay(200);
  await check('vendor failure hashchange and Escape', `(()=>{let title=document.querySelector('#graph-panel-title').textContent;document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return {title,hidden:document.querySelector('#graph-panel').hidden,focus:document.activeElement?.dataset.node}})()`,r=>r.title.includes('VirtuWa HV')&&r.hidden&&r.focus==='proj-virtuwa-hv');
  await check('vendor failure connection link reaches its list entry',`(()=>{document.querySelector('#graph-node-proj-efa .graph-index-connections a[href="#graph-node-craft-performance"]').click();return {hash:location.hash,title:document.querySelector(location.hash)?.querySelector('button')?.textContent,visible:getComputedStyle(document.querySelector('#graph-index-wrap')).display}})()`,r=>r.hash==='#graph-node-craft-performance'&&r.title==='Performance & Quality'&&r.visible!=='none');
  failVendor=false; await go('/',false,390,844);
  await check('Chrome JavaScript disabled shows complete readable index and no blank stage', `({html:document.documentElement.className,stage:getComputedStyle(document.querySelector('#graph-stage')).display,index:getComputedStyle(document.querySelector('#graph-index-wrap')).display,entries:document.querySelectorAll('#graph-index [data-node]').length,links:document.querySelectorAll('#graph-index .graph-index-connections a').length,first:document.querySelector('#graph-index').innerText.slice(0,120)})`,r=>r.stage==='none'&&r.index!=='none'&&r.entries===52&&r.links===208&&r.first.includes('Abdelrhman'));
  await screenshot('live-no-javascript.png');
  await check('no-JS index includes role dates, contributions, skills and Connect actions', `(()=>{const role=document.querySelector('#graph-node-role-smartly-fse');const project=document.querySelector('#graph-node-proj-virtuwa-hv');const resume=document.querySelector('#graph-node-link-resume .graph-index-link');return {roleDate:role.querySelector('.graph-index-meta')?.textContent,roleBullets:role.querySelectorAll('.graph-index-bullets li').length,projectBullets:project.querySelectorAll('.graph-index-bullets li').length,projectTags:[...project.querySelectorAll('.graph-index-tags span')].map(t=>t.textContent),links:['email','linkedin','github','resume'].map(id=>document.querySelector('#graph-node-link-'+id+' .graph-index-link')?.getAttribute('href')),resumeDownload:resume?.hasAttribute('download'),graphOnly:!document.querySelector('header,nav,footer,section')}})()`,r=>r.roleDate?.includes('Jun 2025 - Present')&&r.roleBullets>0&&r.projectBullets>0&&r.projectTags.includes('React')&&r.links[0]?.startsWith('mailto:')&&r.links[1]?.startsWith('https://www.linkedin.com/')&&r.links[2]?.startsWith('https://github.com/')&&r.links[3]==='./assets/abdelrhmanehab_resume.pdf'&&r.resumeDownload&&r.graphOnly);
  await evalJs(`document.querySelector('#graph-node-role-smartly-fse').scrollIntoView()`);
  await screenshot('live-no-javascript-role.png');
} finally { ws?.close(); chrome.kill(); server.close(); await delay(250); rmSync(profile,{recursive:true,force:true}); }
