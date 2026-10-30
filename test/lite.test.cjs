const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const read = name => fs.readFileSync('src/js/' + name, 'utf8');
class Element {
  constructor(name = 'div') { this.name = name; this.children = []; this.attrs = new Map(); this.style = { setProperty(k,v) { this[k]=v; }, removeProperty(k) { delete this[k]; } }; this.isConnected = true; this.textContent = ''; }
  append(...nodes) { for (const n of nodes) { n.remove(); this.children.push(n); n.parentNode = this; } }
  prepend(n) { n.remove(); this.children.unshift(n); n.parentNode = this; }
  insertBefore(n, next) { n.remove(); const i=this.children.indexOf(next); this.children.splice(i<0?this.children.length:i,0,n); n.parentNode=this; }
  after(n) { this.parentNode.insertBefore(n, this.nextSibling); }
  remove() { if(this.parentNode){const i=this.parentNode.children.indexOf(this); if(i>=0)this.parentNode.children.splice(i,1);} this.parentNode=null; }
  setAttribute(k,v) { this.attrs.set(k,String(v)); }
  getAttribute(k) { return this.attrs.get(k) ?? null; }
  removeAttribute(k) { this.attrs.delete(k); }
  toggleAttribute(k,on) { if(on)this.setAttribute(k,'');else this.removeAttribute(k); }
  get firstChild() { return this.children[0]; }
  get lastChild() { return this.children.at(-1); }
  get firstElementChild() { return this.firstChild || null; }
  get nextSibling() { return this.parentNode?.children[this.parentNode.children.indexOf(this)+1] || null; }
  querySelector(selector) {
    const s=selector.replace(':scope > ','');
    const match = n => s.startsWith('#') ? n.id===s.slice(1) : s.startsWith('.') ? (n.className||n.getAttribute('class')||'').split(' ').includes(s.slice(1)) : false;
    const find = node => { for(const n of node.children) { if(match(n))return n; const nested=find(n);if(nested)return nested; } return null; };
    return find(this);
  }
}
function environment(extra = {}) {
  const cleanups=[], events=new Map(), observers=[];
  const root=new Element();
  const document={createElementNS:(_,tag)=>new Element(tag),getElementById:()=>null};
  const context=vm.createContext({root,document,cleanups,XHTML_NS:'xhtml',SVG_NS:'svg',disposed:false,
    queueFrame: fn=>fn, listen:(target,type,fn)=>events.set(type,fn),
    observe:(target,fn,options)=>observers.push({target,fn,options}), text:(node,value)=>{if(node.textContent!==value)node.textContent=value;},
    noteError:(_,e)=>{throw e;}, ...extra});
  return {context,events,observers,cleanups,root,document};
}
test('runtime does not ship captures, polling, drag overrides or full-Zia resource paths', () => {
  const runtime=fs.readFileSync('zia-flat.uc.js','utf8');
  for(const banned of ['setInterval(', 'drawSnapshot', 'getImageData', 'dragover', 'watchRightEdges', 'Multiview', 'tidy-downloads', 'chrome://sine/content/zia/']) assert.equal(runtime.includes(banned),false,banned);
  assert.ok(Buffer.byteLength(runtime)<30000);
  const css=fs.readFileSync('chrome.css','utf8');
  assert.equal(/-moz-pref\("zia\./.test(css),false);
  for(const [,asset] of css.matchAll(/chrome:\/\/sine\/content\/zia-flat\/([^"'\s)]+\.svg)/g)) assert.ok(fs.existsSync(asset),asset);
});
test('address title follows active tab and falls back on internal/edited URLs', () => {
  const input=new Element('input'), box=new Element();box.append(input);
  const bar=new Element();bar.setAttribute('pageproxystate','valid');
  const browser={currentURI:{scheme:'https',displayHost:'www.example.com',pathQueryRef:'/article'},contentTitle:'Article'};
  const gBrowser={selectedBrowser:browser,tabContainer:{},addTabsProgressListener(){},removeTabsProgressListener(){}};
  const gURLBar={inputField:input};
  const e=environment({window:{gURLBar},gURLBar,gBrowser}); e.document.getElementById=()=>bar;
  vm.runInContext(read('20-address.js')+'\nwatchAddressTitle();',e.context);
  const title=box.querySelector('#zia-url-title');
  assert.equal(title.firstChild.textContent,'example.com');
  assert.equal(title.lastChild.textContent,' / Article');
  bar.setAttribute('pageproxystate','invalid'); e.events.get('TabSelect')();
  assert.equal(bar.getAttribute('zia-has-title'),null);
  for(const cleanup of e.cleanups)cleanup();
  assert.equal(box.children.length,1);
});
test('workspace indicator moves once and returns home when switching or unloading', () => {
  const top=new Element(), a=new Element(), b=new Element();
  const ia=new Element(),ib=new Element();a.append(ia);b.append(ib);a.indicator=ia;b.indicator=ib;
  let space=a; const manager={get activeWorkspaceElement(){return space;},getActiveWorkspace:()=>({name:space===a?'A':'B',icon:'🏯'})};
  const e=environment({window:{gZenWorkspaces:manager},Services:{prefs:{addObserver(){},removeObserver(){}}}});
  e.document.getElementById=()=>top;
  vm.runInContext(read('10-sidebar.js')+'\nwatchWorkspaceLabel();',e.context);
  assert.equal(ia.parentNode.id,'zia-workspace-slot');
  space=b;e.events.get('ZenWorkspacesUIUpdate')();
  assert.equal(ia.parentNode,a);assert.equal(ib.parentNode.id,'zia-workspace-slot');
  for(const cleanup of e.cleanups)cleanup();
  assert.equal(ib.parentNode,b);assert.equal(top.children.length,0);
});
test('media metadata is used without fetching pixels and square progress is updated', () => {
  const toolbar=new Element(),button=new Element(),element=new Element();toolbar.append(element);element.append(button);
  const artwork=[{src:'https://example.com/small.png',sizes:'16x16'},{src:'https://example.com/large.png',sizes:'512x512'}];
  const card={element,focusButton:button,controller:{getMetadata:()=>({artwork})},duration:100,progressBar:{value:25}};
  const e=environment({window:{gZenMediaController:{frontCard:card}}});e.document.getElementById=()=>toolbar;
  vm.runInContext(read('30-media.js')+'\nwatchMedia();',e.context);
  assert.equal(button.getAttribute('zia-art'),'https://example.com/large.png');
  assert.equal(artwork[0].sizes,'16x16');
  const path=button.querySelector('.zia-ring-fill');assert.equal(path.getAttribute('d'),'M23 1 L45 1 L45 45 L1 45 L1 1 Z');
  assert.equal(path.style.strokeDasharray,'25.00 100');
  card.progressBar.value=50;e.observers[0].fn();
  assert.equal(path.style.strokeDasharray,'50.00 100');
  assert.equal(button.children.length,1);
  card.duration=Infinity;e.observers[0].fn();assert.equal(path.style.strokeOpacity,'0');
});
test('downloads do not animate startup history and unregister their native view', async () => {
  let view,removed=0,flights=0;
  const button=new Element();
  const old={succeeded:true,startTime:new Date()};
  const list={async addView(v){view=v;v.onDownloadAdded(old);},removeView(v){assert.equal(v,view);removed++;}};
  const window={Downloads:{ALL:0,getList:async()=>list}};
  const e=environment({window,Date,Services:{focus:{activeWindow:window},prefs:{getBoolPref:()=>true}},
    matchMedia:()=>({matches:false}),flightTarget:()=>({}),flyDownloadRow:()=>{flights++;}});
  e.document.getElementById=()=>button;
  vm.runInContext(read('50-downloads.js')+'\nwatchDownloads();',e.context);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(flights,0);
  e.events.get('click')({button:0,clientX:10,clientY:20});
  const fresh={startTime:new Date(),hasProgress:true,totalBytes:100,currentBytes:10};view.onDownloadAdded(fresh);
  assert.equal(flights,1);assert.equal(button.getAttribute('zia-downloading'),'');
  fresh.succeeded=true;view.onDownloadChanged(fresh);assert.equal(button.getAttribute('zia-downloading'),null);
  for(const cleanup of e.cleanups)cleanup();assert.equal(removed,1);
});

test('hover compatibility follows active stylesheet rather than stale preferences', () => {
  let width = 'clamp(160px, 250px, 9999px)';
  const e = environment({ getComputedStyle: () => ({getPropertyValue: () => width}) });
  vm.runInContext(read('15-autoexpand.js')+'\nwatchAutoExpandCompatibility();',e.context);
  assert.equal(e.root.getAttribute('zia-flat-autoexpand'),'');
  width = ''; // Mod disabled or a compact/fullscreen mode where it is inactive.
  e.observers[0].fn();
  assert.equal(e.root.getAttribute('zia-flat-autoexpand'),null);
  width = '250px';e.observers[0].fn();
  assert.equal(e.root.getAttribute('zia-flat-autoexpand'),'');
  for (const cleanup of e.cleanups) cleanup();
  assert.equal(e.root.getAttribute('zia-flat-autoexpand'),null);
});
