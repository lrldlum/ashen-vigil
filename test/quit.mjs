// Quit to Main Menu from the pause screen: keyboard, touch, pad, co-op host/guest (relay as in milestoneF.mjs).
import { chromium } from './node_modules/playwright/index.mjs';import {execSync} from 'child_process';import fs from 'fs';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`,PX=process.env.PEERHOST?`&peerhost=${process.env.PEERHOST}&peerport=${process.env.PEERPORT||9000}`:'';
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const errs=[],ext=new Set(),R={};let pass=0,fail=0;const ok=(n,c,v)=>{R[n]={pass:!!c,v};c?pass++:fail++;console.error((c?'PASS ':'FAIL ')+n+' '+String(JSON.stringify(v)).slice(0,400))};

const cast=async(pg,name)=>{fs.mkdirSync(VD+'/'+name,{recursive:true});FR[name]=[];const s=await pg.context().newCDPSession(pg);
 s.on('Page.screencastFrame',f=>{const n=FR[name].length;fs.writeFileSync(`${VD}/${name}/${String(n).padStart(5,'0')}.jpg`,Buffer.from(f.data,'base64'));FR[name].push(Date.now());s.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{})});
 await s.send('Page.startScreencast',{format:'jpeg',quality:80,maxWidth:640,maxHeight:360,everyNthFrame:2})};
// The box's managed Chrome policy (WebRtcIPHandling: disable_non_proxied_udp) yields zero ICE candidates, so a real WebRTC data channel cannot
// open between two headless contexts here. Rooms still register on, and offers/answers still travel through, the real public broker (checked
// below); the data channel itself is carried by this test-only relay (node forwards the same JSON messages between the pages). RELAY=0 disables it.
const RELAY=process.env.RELAY!=='0',pages={},q={};
const relayInit=()=>{const h=new Map();window.__fake=(remote)=>{const ev={};const c={open:false,peer:remote,
  on(e,f){(ev[e]=ev[e]||[]).push(f);return c},emit(e,a){(ev[e]||[]).forEach(f=>f(a))},
  send(m){if(c.open)__relaySend(JSON.stringify({to:remote,from:NET.peer.id,m}))},close(){if(!c.open)return;c.open=false;__relaySend(JSON.stringify({to:remote,from:NET.peer.id,close:1}));c.emit('close')}};h.set(remote,c);return c};
 window.__relayRecv=d=>{let c=h.get(d.from);if(d.conn){c=__fake(d.from);NET.peer.emit('connection',c);c.open=true;__relaySend(JSON.stringify({to:d.from,from:NET.peer.id,opened:1}));c.emit('open');return}
  if(!c)return;if(d.opened){c.open=true;c.emit('open')}else if(d.close){if(c.open){c.open=false;c.emit('close')}}else if(d.m&&c.open)c.emit('data',d.m)};
 const patch=()=>{if(!window.Peer)return setTimeout(patch,20);Peer.prototype.connect=function(id){const c=__fake(id);__relaySend(JSON.stringify({to:id,from:this.id,conn:1}));return c}};patch()};
const mk=async(touch,rec)=>{const ctx=await br.newContext({viewport:{width:1280,height:720},hasTouch:touch,});
 if(RELAY){await ctx.exposeBinding('__relaySend',(src,s)=>{const d=JSON.parse(s);pages[d.from]=src.page;const p=pages[d.to];if(!p)return;q[d.to]=(q[d.to]||Promise.resolve()).then(()=>p.evaluate(x=>window.__relayRecv&&__relayRecv(x),d)).catch(()=>{})});await ctx.addInitScript(relayInit)}
 const pg=await ctx.newPage();if(rec)await cast(pg,rec);pg.on('close',()=>{for(const[id,p] of Object.entries(pages))if(p===pg){delete pages[id];for(const[o,op] of Object.entries(pages))op.evaluate(x=>window.__relayRecv&&__relayRecv(x),{from:id,close:1}).catch(()=>{})}});
 pg.on('pageerror',e=>errs.push(e.message));pg.on('request',r=>{const u=r.url();if(!u.startsWith(B)&&!/^(data|blob):/.test(u))ext.add(new URL(u).host)});
 await pg.goto(B+'assets/README.md');await pg.evaluate(()=>localStorage.clear());return{ctx,pg,ev:(f,a)=>pg.evaluate(f,a)}};
const helpers=()=>{window.S=()=>__G.scene.getScene('stage');window.tp=(x,y=156)=>{const s=S();s.pb.setPosition(x,y-8);s.pb.setVelocity(0,0);s.player.state='idle';s.player.inv=99;s.camY=s.camTY=y-156};window.idle=()=>{window.__inp=()=>({})}};
const inStage=async p=>{await p.pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await p.pg.waitForTimeout(500);await p.ev(helpers)};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const tapG=async(p,x,y)=>{const bb=await p.pg.locator('canvas').boundingBox();await p.pg.touchscreen.tap(bb.x+(x+.5)*bb.width/320,bb.y+(y+.5)*bb.height/180);await wait(160)};
// 1. keyboard: pause -> Enter -> confirm, Esc cancels, Enter+Left+Enter quits to title with a save
const A=await mk(true);await A.pg.goto(B+'?play&mute&slot=1&class=knight&stage=ramparts&seed=0');await inStage(A);
await A.ev(()=>{const s=S();s.msg=null;s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false});s.souls=4321;s.bonfire.lit=true;s.sv.bonfire=true;s.sv.lords.push('warden')});
const K=async(p,k)=>{await p.pg.keyboard.press(k);await wait(120)};
await K(A,'Escape');await K(A,'Enter');ok('kb_confirm_opens',await A.ev(()=>!!S().quitQ&&S().quitQ.sel===1),await A.ev(()=>S().quitQ));
await A.pg.screenshot({path:'screenshots/quit_confirm.png'});
await K(A,'Escape');ok('kb_esc_cancels_stays_paused',await A.ev(()=>!S().quitQ&&S().paused));
await K(A,'Enter');await K(A,'Enter');ok('kb_no_is_default',await A.ev(()=>!S().quitQ&&S().paused));
await K(A,'Enter');await K(A,'ArrowLeft');await K(A,'Enter');await wait(600);
const t1=await A.ev(()=>({title:__G.scene.getScene('title').sys.isActive(),sv:JSON.parse(localStorage.getItem('ashenVigil.save.v1.s1')||'null')||JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>/save/.test(k))))}));
ok('kb_yes_saves_and_goes_to_title',t1.title&&t1.sv.souls===4321&&t1.sv.lords.includes('warden')&&t1.sv.bonfire,{title:t1.title,souls:t1.sv&&t1.sv.souls,lords:t1.sv&&t1.sv.lords,bf:t1.sv&&t1.sv.bonfire});
// 2. touch: tap the quit row, tap YES
await A.pg.goto(B+'?play&mute&slot=1&class=knight&stage=ramparts&seed=0&touch');await inStage(A);
await A.ev(()=>{S().togglePause()});await wait(200);const tap=(x,y)=>tapG(A,x,y);
{const q=await A.ev(()=>({x:QUIT_ROW.x+QUIT_ROW.w/2,y:QUIT_ROW.y+3}));await tap(q.x,q.y)}ok('touch_opens_confirm',await A.ev(()=>!!S().quitQ));await tap(128,104);await wait(600);ok('touch_yes_to_title',await A.ev(()=>__G.scene.getScene('title').sys.isActive()));
// 3. pad (Chrome-like getGamepads mock): START pauses, A opens, D-pad left, A confirms
const P=await mk(false);await P.pg.addInitScript(()=>{const st={b:Array(17).fill(0),a:[0,0,0,0],ts:1};window.btn=(i,on)=>{st.b[i]=on?1:0;st.ts=performance.now()};
 navigator.getGamepads=()=>[Object.freeze({id:'Xbox Wireless Controller (STANDARD GAMEPAD)',index:0,connected:true,mapping:'standard',timestamp:st.ts,axes:Object.freeze(st.a.slice()),buttons:Object.freeze(st.b.map(v=>Object.freeze({pressed:v>.5,value:v,touched:v>0})))}),null,null,null]});
await P.pg.goto(B+'?play&mute&slot=2&class=knight&stage=ramparts&seed=0');await inStage(P);await P.ev(()=>{const s=S();s.msg=null;s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false})});
const tb=async b=>{await P.ev(b=>btn(b,1),b);await wait(120);await P.ev(b=>btn(b,0),b);await wait(200)};
await tb(9);ok('pad_start_pauses',await P.ev(()=>S().paused));await tb(0);ok('pad_A_opens_confirm',await P.ev(()=>!!S().quitQ));await tb(1);ok('pad_B_cancels',await P.ev(()=>!S().quitQ&&S().paused));
await tb(0);await tb(14);await tb(0);await wait(600);ok('pad_yes_to_title',await P.ev(()=>__G.scene.getScene('title').sys.isActive()));
// 4. co-op: host quits -> guest sees "Host left" + title; guest quits -> just disconnects (host keeps playing)
const coop=async()=>{const H=await mk(false);await H.pg.goto(B+'?host&mute&stage=ramparts&class=knight'+PX);await H.pg.waitForFunction(()=>NET.peer&&NET.peer.open,null,{timeout:20000});const code=await H.ev(()=>NET.code);pages[await H.ev(()=>NET.peer.id)]=H.pg;await inStage(H);
 const G=await mk(false);await G.pg.goto(B+'?seed=0&mute&class=pyromancer&join='+code+PX);await inStage(G);await G.pg.waitForFunction(()=>NET.linked(),null,{timeout:30000});await wait(800);return{H,G}};
let c=await coop();ok('coop_linked',await c.G.ev(()=>NET.linked())&&await c.H.ev(()=>NET.linked()));
await c.H.ev(()=>{S().togglePause();S().quitOpen();S().quitPick(true)});await wait(1500);
const g1=await c.G.ev(()=>({left:!!window.__hostLeft,title:__G.scene.getScene('title').sys.isActive(),toast:(document.getElementById('quitToast')||{}).textContent}));ok('host_quit_guest_gets_host_left_and_title',g1.left&&g1.title&&g1.toast==='Host left',g1);
await c.G.pg.screenshot({path:'screenshots/quit_host_left.png'});
c=await coop();await c.G.ev(()=>{S().togglePause();S().quitOpen();S().quitPick(true)});await wait(1500);
const h2=await c.H.ev(()=>({linked:NET.linked(),stage:S().sys.isActive(),title:__G.scene.getScene('title').sys.isActive()})),g2=await c.G.ev(()=>({title:__G.scene.getScene('title').sys.isActive(),peer:!!NET.peer}));
ok('guest_quit_just_disconnects',!h2.linked&&h2.stage&&!h2.title&&g2.title&&!g2.peer,{h2,g2});
ok('no_errors',errs.length===0,errs);console.error(JSON.stringify({pass,fail}));await br.close();process.exit(fail?1:0);
