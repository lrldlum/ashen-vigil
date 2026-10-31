// Headless checks for milestone F (online co-op over PeerJS, room code). Two (then three) browser contexts on the box connect through the
// public PeerJS cloud broker (0.peerjs.com) when reachable; set PEERHOST=127.0.0.1 PEERPORT=9000 to use a local PeerServer instead.
// usage: node test/milestoneF.mjs   (server on :8171). Also records clips/F.mp4 (host | guest side by side).
import { chromium } from 'playwright';import {execSync} from 'child_process';import fs from 'fs';
const B='http://127.0.0.1:8171/',S='screenshots/F/after/',PX=process.env.PEERHOST?`&peerhost=${process.env.PEERHOST}&peerport=${process.env.PEERPORT||9000}`:'';
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const errs=[],ext=new Set(),R={};let pass=0,fail=0;const ok=(n,c,v)=>{R[n]={pass:!!c,v};c?pass++:fail++;console.error((c?'PASS ':'FAIL ')+n+' '+JSON.stringify(v).slice(0,400))};
const VD='/tmp/fvid';fs.rmSync(VD,{recursive:true,force:true});const FR={};
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
// ---- 1. host a room (title flow by keyboard)
const H=await mk(false,'host');await H.pg.goto(B+'?mute&class=knight'+PX);await H.pg.waitForTimeout(1200);
for(const k of['ArrowDown','ArrowDown','ArrowDown','Enter']){await H.pg.keyboard.press(k);await wait(200)}await H.pg.screenshot({path:S+'title_coop.png'});await H.pg.keyboard.press('Enter');
await inStage(H);await H.pg.waitForFunction(()=>NET.peer&&NET.peer.open,null,{timeout:20000}).catch(()=>{});
const code=await H.ev(()=>NET.code);pages[await H.ev(()=>NET.peer.id)]=H.pg;ok('host_room_code',/^[A-Z0-9]{4}$/.test(code)&&await H.ev(()=>NET.host()&&NET.peer.open),{code,status:await H.ev(()=>NET.status)});
// real broker: a raw PeerJS client (no relay) gets the host's SDP answer back through 0.peerjs.com
{const X=await br.newContext();const xp=await X.newPage();await xp.goto(B+'?mute'+PX);await xp.waitForTimeout(800);
 const sig=await xp.evaluate(id=>new Promise(r=>{const p=new Peer(undefined,NET.opts());p.on('error',e=>r({err:e.type}));p.on('open',()=>{const c=p.connect(id,{serialization:'json'});const t0=performance.now(),g=()=>{const pc=c.peerConnection,rd=pc&&pc.remoteDescription;if(rd)r({broker:p.options.host,answer:rd.type,me:p.id.slice(0,8)});else if(performance.now()-t0>12000)r({timeout:1});else setTimeout(g,100)};g()})}),'ashenvigil-'+code.toLowerCase());
 ok('signaling_through_broker',sig.answer==='answer',sig);await X.close();await wait(500);}
// ---- 2. guest joins by TOUCH: taps CO-OP row, JOIN, then the keypad
const G=await mk(true,'guest');await G.pg.goto(B+'?mute&class=pyromancer'+PX);await G.pg.waitForTimeout(1200);
await tapG(G,160,133);await tapG(G,160,133);await tapG(G,160,111);await tapG(G,160,111);
const keys=await G.ev(()=>__G.scene.getScene('title').keypad());for(const c of code){const b=keys.find(k=>k.c===c);await tapG(G,b.x+4,b.y+2)}
await G.pg.screenshot({path:S+'join_keypad_touch.png'});const typed=await G.ev(()=>__G.scene.getScene('title').code);
const jb=keys.find(k=>k.c==='JOIN');await tapG(G,jb.x+6,jb.y+2);
await inStage(G);await wait(1500);
ok('touch_join_connects',typed===code&&await G.ev(()=>NET.guest()&&NET.linked())&&await H.ev(()=>NET.linked()&&!!NET.remote),{typed,gs:await G.ev(()=>[NET.role,NET.status,S().sid]),hs:await H.ev(()=>[NET.status,NET.remote&&NET.remote.cls])});
ok('guest_own_character',await G.ev(()=>S().sv.cls)==='pyromancer'&&await H.ev(()=>NET.remote.cls)==='pyromancer',{});
// both visible: put players side by side
await H.ev(()=>tp(260));await G.ev(()=>tp(300));await wait(900);
const vis=await H.ev(()=>{const r=NET.remote;return{rx:Math.round(r.rx),sid:r.sid,tint:NET.TINT}});const visG=await G.ev(()=>({rx:Math.round(NET.remote.rx),sid:NET.remote.sid}));
await H.pg.screenshot({path:S+'host_sees_guest.png'});await G.pg.screenshot({path:S+'guest_sees_host.png'});
// r6: colour by role (P2 guest teal on BOTH screens, P1 host in its own colours on both)
const hook=()=>{window.__hc=[];const o=window.drawHero;window.drawHero=function(g,x,...a){__hc.push([Math.round(x),HC.b]);return o.call(this,g,x,...a)}};await H.ev(hook);await G.ev(hook);await wait(500);
const roleCol=async(p)=>p.ev(()=>{const s=S(),lx=Math.round(s.player.x),rx=Math.round(NET.remote.rx),L=__hc.slice(-40);const px=s.pxc&&s.pxc.hero&&s.pxc.hero.visible;return{local:px?[s.pxc.hero.isTinted?s.pxc.hero.tintTopLeft:'base']:[...new Set(L.filter(c=>Math.abs(c[0]-lx)<3).map(c=>c[1]))],remote:px&&s.pxc.rem.visible?[s.pxc.rem.isTinted?s.pxc.rem.tintTopLeft:'base']:[...new Set(L.filter(c=>Math.abs(c[0]-rx)<3).map(c=>c[1]))],teal:NET.TINT.b}});
const ch=await roleCol(H),cg=await roleCol(G);require_shots:{await H.pg.screenshot({path:'screenshots/r6/host_view_roles.png'});await G.pg.screenshot({path:'screenshots/r6/guest_view_roles.png'})}
ok('r6_role_colours',ch.remote.length&&ch.remote.every(c=>c===ch.teal)&&ch.local.length&&ch.local.every(c=>c!==ch.teal)&&cg.local.length&&cg.local.every(c=>c===cg.teal)&&cg.remote.length&&cg.remote.every(c=>c!==cg.teal),{ch,cg});
ok('players_visible_tinted',Math.abs(vis.rx-300)<12&&Math.abs(visG.rx-260)<12&&vis.tint&&vis.tint.b===0x3ab0a0,{vis,visG});
// ---- 3. host-authoritative enemies: guest hit -> host kills -> guest sees death
const kill=await G.ev(()=>{const s=S();const i=s.enemies.findIndex(e=>!e.dead);if(i<0)return null;s.damageEnemy(s.enemies[i],999,1);return i});await wait(1200);
ok('guest_hit_resolved_by_host',kill!=null&&await H.ev(i=>S().enemies[i].dead,kill)&&await G.ev(i=>S().enemies[i].dead,kill),{kill});
// enemy positions follow the host
await wait(600);const ep=await H.ev(()=>S().enemies.filter(e=>!e.dead).slice(0,3).map(e=>Math.round(e.b.x)));const eg=await G.ev(()=>S().enemies.filter(e=>!e.dead).slice(0,3).map(e=>Math.round(e.b.x)));
ok('enemy_state_mirrored',ep.length&&ep.every((x,i)=>Math.abs(x-eg[i])<30),{ep,eg});
// ---- 4. shared progress: cage freed by guest, souls shared, loot to both
const cid=await G.ev(()=>{const s=S(),c=s.cages.find(c=>!c.freed);s.freeCage(c);return c.id});await wait(1200);
ok('cage_shared',await H.ev(id=>S().sv.freed.includes(id),cid)&&await G.ev(id=>S().cages.find(c=>c.id===id).freed&&S().sv.freed.includes(id),cid),{cid});
const g0=await G.ev(()=>S().souls);await H.ev(()=>S().gainSouls(123));await wait(800);const g1=await G.ev(()=>S().souls);
ok('souls_shared',g1-g0===123,{g0,g1});
// ---- 5. boss sync (host walks into the Frost Warden arena)
await H.ev(()=>{const s=S();s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false});s.pb.setPosition(3020,140);s.player.inv=999});await G.ev(()=>{S().pb.setPosition(2990,140);S().player.inv=999});
await H.pg.waitForFunction(()=>S().bossState==='fight',null,{timeout:15000}).catch(()=>{});await wait(1500);
const bh=await G.ev(()=>[S().bossState,S().boss&&S().boss.kind,S().boss&&S().boss.hp]);await G.ev(()=>S().damageBoss(10));await wait(800);
const hp=[await H.ev(()=>S().boss.hp),await G.ev(()=>S().boss.hp)];await H.pg.screenshot({path:S+'boss_host.png'});await G.pg.screenshot({path:S+'boss_guest.png'});
ok('boss_synced_and_guest_damage',bh[0]==='fight'&&bh[1]==='warden'&&hp[0]<bh[2]&&Math.abs(hp[0]-hp[1])<5,{bh,hp});
await H.ev(()=>{S().boss.hp=1;S().damageBoss(50)});await G.pg.waitForFunction(()=>S().sv.bossDown,null,{timeout:12000}).catch(()=>{});
ok('boss_death_shared',await G.ev(()=>S().sv.bossDown)&&await H.ev(()=>S().sv.bossDown),{});
// ---- 6. guest can't lead; host travel -> guest follows to the shrine
await wait(4000);await H.ev(()=>S().travel('shrine',{next:'ramparts',bonfire:true}));await G.pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage').sid==='shrine'&&__G.scene.getScene('stage').player,null,{timeout:15000}).catch(()=>{});await wait(1500);await G.ev(helpers);
ok('stage_follow',await G.ev(()=>S().sid)==='shrine'&&await H.ev(()=>S().sid)==='shrine'&&await H.ev(()=>NET.remote&&NET.remote.sid)==='shrine',{});
await H.ev(()=>tp(250));await G.ev(()=>tp(280));await wait(1000);await H.pg.screenshot({path:S+'shrine_both.png'});
// ---- 7. a third player is refused
const T=await mk(false);await T.pg.goto(B+'?mute&join='+code+PX);await T.pg.waitForFunction(()=>__G.scene.getScene('title').joinErr,null,{timeout:15000}).catch(()=>{});
const terr=await T.ev(()=>__G.scene.getScene('title').joinErr);await T.pg.screenshot({path:S+'room_full.png'});await wait(1500);const tst=await T.ev(()=>({st:NET.status,role:NET.role,err:__G.scene.getScene('title').joinErr}));await T.pg.screenshot({path:'screenshots/r6/room_full_status.png'});
ok('room_full',/FULL/.test(terr||''),{terr});ok('r6_room_full_status_stays',tst.st==='ROOM IS FULL'&&tst.role===null&&/FULL/.test(tst.err),tst);await T.ctx.close();
await wait(1000);ok('host_kept_guest_after_refusal',await H.ev(()=>NET.linked()),{});
// ---- 8. disconnects: guest leaves -> host waits; new guest joins; host leaves -> guest walks alone
await G.ctx.close();await H.pg.waitForFunction(()=>!NET.remote&&/WAITING/.test(NET.status),null,{timeout:12000}).catch(()=>{});
const hs=await H.ev(()=>({st:NET.status,r:!!NET.remote,ok:S().sys.isActive()}));await H.pg.screenshot({path:S+'host_after_guest_left.png'});ok('guest_disconnect_handled',!hs.r&&/WAITING/.test(hs.st)&&hs.ok,hs);
const G2=await mk(false,'guest2');await G2.pg.goto(B+'?mute&join='+code+PX);await inStage(G2);await wait(1200);
ok('rejoin_after_drop',await G2.ev(()=>NET.linked()&&S().sid)==='shrine',{});
await H.ctx.close();await G2.pg.waitForFunction(()=>NET.role==='lost',null,{timeout:12000}).catch(()=>{});await wait(800);
const ls=await G2.ev(()=>({role:NET.role,st:NET.status,moves:S().enemies.every(e=>e.dead||e.b.body.moves),active:S().sys.isActive()}));
await G2.ev(()=>{let n=0;window.__inp=()=>(n++<30?{r:1}:{})});const x0=await G2.ev(()=>S().player.x);await wait(900);const x1=await G2.ev(()=>S().player.x);
await G2.pg.screenshot({path:S+'guest_after_host_left.png'});ok('host_disconnect_handled',ls.role==='lost'&&ls.active&&ls.moves&&x1>x0,{ls,x0,x1});
await G2.ctx.close();
ok('no_errors',errs.length===0,errs);const hosts=[...ext];ok('only_peer_broker_traffic',hosts.every(h=>/peerjs|^127\.0\.0\.1/.test(h)),hosts);
// ---- solo play makes no outside requests at all
const P=await mk(false);await P.pg.goto(B+'?play&mute');await inStage(P);await wait(1500);const ext2=new Set(ext);ok('solo_no_network',[...ext2].length===hosts.length,{});await P.ctx.close();
await br.close();
// clip: host | guest side by side
try{const T0=Math.min(...FR.host.slice(0,1),...FR.guest.slice(0,1));
 for(const n of['host','guest']){const L=FR[n];let s=`file '${VD}/${n}/00000.jpg'\nduration ${((L[0]-T0)/1000).toFixed(3)}\n`;L.forEach((t,i)=>{s+=`file '${VD}/${n}/${String(i).padStart(5,'0')}.jpg'\nduration ${(((L[i+1]||t+100)-t)/1000).toFixed(3)}\n`});fs.writeFileSync(`${VD}/${n}.txt`,s);
  execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i ${VD}/${n}.txt -vf "scale=640:360,fps=30,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${n==='host'?'P1 HOST':'P2 GUEST (TOUCH)'}':x=8:y=8:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.5" -pix_fmt yuv420p ${VD}/${n}.mp4`)}
 execSync(`ffmpeg -y -loglevel error -i ${VD}/host.mp4 -i ${VD}/guest.mp4 -filter_complex "[0:v][1:v]hstack=shortest=0" -c:v libx264 -pix_fmt yuv420p -crf 26 ${process.env.CLIP||'clips/F.mp4'}`);console.error('clip ok')}catch(e){console.error('clip fail',e.message)}
console.log(JSON.stringify({pass,fail}));process.exit(fail?1:0);
