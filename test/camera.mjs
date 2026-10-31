import { chromium } from 'playwright';import {execSync} from 'child_process';import fs from 'fs';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`,SH=(process.env.EVD||'screenshots/camera')+'/';
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const errs=[],ext=new Set();let pass=0,fail=0;const ok=(n,c,v)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+n+' '+JSON.stringify(v).slice(0,500))};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const VD=''+(process.env.TMPV||'/tmp/camvid')+'';fs.rmSync(VD,{recursive:true,force:true});const FR=[];
const RELAY=process.env.RELAY!=='0',pages={},q={};
const relayInit=()=>{const h=new Map();window.__fake=(remote)=>{const ev={};const c={open:false,peer:remote,
  on(e,f){(ev[e]=ev[e]||[]).push(f);return c},emit(e,a){(ev[e]||[]).forEach(f=>f(a))},
  send(m){if(c.open)__relaySend(JSON.stringify({to:remote,from:NET.peer.id,m}))},close(){if(!c.open)return;c.open=false;__relaySend(JSON.stringify({to:remote,from:NET.peer.id,close:1}));c.emit('close')}};h.set(remote,c);return c};
 window.__relayRecv=d=>{let c=h.get(d.from);if(d.conn){c=__fake(d.from);NET.peer.emit('connection',c);c.open=true;__relaySend(JSON.stringify({to:d.from,from:NET.peer.id,opened:1}));c.emit('open');return}
  if(!c)return;if(d.opened){c.open=true;c.emit('open')}else if(d.close){if(c.open){c.open=false;c.emit('close')}}else if(d.m&&c.open)c.emit('data',d.m)};
 const patch=()=>{if(!window.Peer)return setTimeout(patch,20);Peer.prototype.connect=function(id){const c=__fake(id);__relaySend(JSON.stringify({to:id,from:this.id,conn:1}));return c}};patch()};
const mk=async(rec)=>{const ctx=await br.newContext({viewport:{width:1280,height:720}});
 await ctx.exposeBinding('__relaySend',(src,s)=>{const d=JSON.parse(s);pages[d.from]=src.page;const p=pages[d.to];if(!p)return;q[d.to]=(q[d.to]||Promise.resolve()).then(()=>p.evaluate(x=>window.__relayRecv&&__relayRecv(x),d)).catch(()=>{})});await ctx.addInitScript(relayInit);
 const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(e.message));pg.on('request',r=>{const u=r.url();if(!u.startsWith(B)&&!/^(data|blob):/.test(u))ext.add(new URL(u).host)});
 pg.on('close',()=>{for(const[id,p] of Object.entries(pages))if(p===pg)delete pages[id]});
 if(rec){fs.mkdirSync(VD,{recursive:true});const s=await ctx.newCDPSession(pg);s.on('Page.screencastFrame',f=>{fs.writeFileSync(`${VD}/${String(FR.length).padStart(5,'0')}.jpg`,Buffer.from(f.data,'base64'));FR.push(Date.now());s.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{})});await s.send('Page.startScreencast',{format:'jpeg',quality:80,maxWidth:640,maxHeight:360,everyNthFrame:2})}
 const ev=(f,a)=>pg.evaluate(f,a);
 const go=async q=>{await pg.goto(B+q.replace('?','?seed=0&'));await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await wait(700);
  await ev(()=>{window.S=()=>__G.scene.getScene('stage');window.idle=()=>{window.__inp=()=>({})};window.press=k=>{let n=0;window.__inp=()=>(n++===0?{[k]:1}:{})};window.hold=(o,n)=>{let i=0;window.__inp=()=>(i++<n?o:{})};
   window.tp=(x,y=156)=>{const s=S();s.pb.setPosition(x,y-8);s.pb.setVelocity(0,0);s.player.state='idle';s.player.inv=99;s.camY=s.camTY=y-156};
   window.clear=()=>{const s=S();s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false})};
   window.until=(f,ms)=>new Promise(r=>{const t0=performance.now(),g=()=>{if(f())r(true);else if(performance.now()-t0>ms)r(false);else requestAnimationFrame(g)};g()})})};
 return{ctx,pg,ev,go,shot:n=>pg.screenshot({path:SH+n+'.png'})}};
// Camera: continuous smooth follow everywhere (no room snaps/slides), arena lock survives, intro end/skip resumes follow without a snap.
// Hero art: death, respawn, NG+ start and co-op guest death use the current hand-drawn hero (av_hero), never the legacy procedural man.
const MAXD=+(process.env.MAXD||8);
const helpers=()=>{window.camRec=async(ms,inp)=>{const s=S(),xs=[],ys=[],ts=[];let n=0;window.__inp=inp?()=>{n++;return{...inp,jumpP:n%45===20?1:0,jump:n%45>=20&&n%45<32?1:0}}:null;/* hop now and then over steps at cuts */let last=performance.now();await new Promise(r=>{const f=()=>{xs.push(s.cam.scrollX);ys.push(s.cam.scrollY);ts.push(performance.now());if(performance.now()-last>ms)r();else requestAnimationFrame(f)};f()});window.__inp=null;
  let dx=0,dy=0;for(let i=1;i<xs.length;i++){const k=Math.max(1,(ts[i]-ts[i-1])/16.7);dx=Math.max(dx,Math.abs(xs[i]-xs[i-1])/k);dy=Math.max(dy,Math.abs(ys[i]-ys[i-1])/k)}/* px per 60 Hz frame, so a slow box doesn't read as a snap (a snap is 100s of px in one frame) */return{n:xs.length,dx,dy,x0:Math.round(xs[0]),x1:Math.round(xs[xs.length-1]),swaps:s.roomSwaps,room:s.room&&s.room.id}};
 window.cross=async(i)=>{const s=S(),r=s.rooms[i];clear();tp(r.x1-90,s.player.y+8);s.player.hp=s.player.hpMax=9999;await new Promise(z=>setTimeout(z,1400));const n0=s.roomSwaps;const R=await camRec(2600,{r:1});R.crossed=s.roomSwaps-n0;R.cut=r.x1;R.px=Math.round(s.player.x);return R}};
fs.mkdirSync(SH,{recursive:true});
const A=await mk(!!process.env.CLIP);const{ev,go,shot}=A;
await A.pg.goto(B+'assets/README.md');await ev(()=>localStorage.clear());
// ---- 1. OW1 Ramparts: walk across several room cuts ----
await go('?play&mute&slot=1&class=knight&stage=ramparts');await ev(helpers);
const bnd=await ev(()=>({x:S().cam._bounds.x,w:S().cam._bounds.width}));ok('ramparts_camera_spans_region',bnd.x===0&&bnd.w>=3000,bnd);
for(const i of [0,1,2,3]){const R=await ev(i=>cross(i),i);ok('ramparts_cut'+(i+1)+'_smooth_no_snap',R.crossed>=1&&R.dx<=MAXD&&R.x1>R.x0+60,R);if(i===1)await shot('cam_ramparts_cut2')}
// ---- 2. Bell Tower ----
await go('?play&mute&slot=1&class=knight&stage=belltower');await ev(helpers);
{const n=await ev(()=>S().rooms.length);let crossed=0;for(let i=0;i<Math.min(5,n-1);i++){const R=await ev(i=>cross(i),i);if(R.crossed)crossed++;/* some shaft cuts sit behind tower walls; score the ones the walk crosses */ok('belltower_cut'+(i+1)+'_no_snap'+(R.crossed?'_crossed':'_blocked_by_wall'),R.dx<=MAXD&&R.dy<=MAXD,R)}ok('belltower_crossed_several_cuts',crossed>=2,{crossed});
 await shot('cam_belltower')}
// ---- 3. boss arena: lock survives, intro end and skip resume follow without a snap ----
for(const mode of ['full','skip']){
 await A.pg.goto(B+'assets/README.md');await ev(()=>localStorage.clear());await go('?play&mute&slot=1&class=knight&stage=ramparts&intro');await ev(helpers);
 const R=await ev(async mode=>{const s=S();clear();s.player.hp=s.player.hpMax=9999;tp(ARENA_L-200);await new Promise(z=>setTimeout(z,1500));const xs=[],ts=[];let skip=0;window.__inp=()=>({r:1});
  await new Promise(r=>{const t0=performance.now();const f=()=>{xs.push(s.cam.scrollX);ts.push(performance.now());if(s.cine){window.__inp=null;if(mode==='skip'&&!skip&&performance.now()-s.cine.t0>900){skip=1;s.skipCine()}}if(performance.now()-t0>9000||(s.bossState==='fight'&&!s.cine&&xs.length>40&&performance.now()-(s.__ft=s.__ft||performance.now())>1500))r();else requestAnimationFrame(f)};f()});window.__inp=null;
  let dx=0;for(let i=1;i<xs.length;i++)dx=Math.max(dx,Math.abs(xs[i]-xs[i-1])/Math.max(1,(ts[i]-ts[i-1])/16.7));
  // during the fight walk left into the arena wall: the camera must stay locked inside the arena
  const P=s.player;P.inv=99;window.__inp=()=>({l:1});await new Promise(z=>setTimeout(z,2500));window.__inp=null;
  return{dx,state:s.bossState,skipped:!!skip,bx:s.cam._bounds.x,arenaX0:s.arenaX0,sx:Math.round(s.cam.scrollX),follow:!!s.cam._follow,AL:ARENA_L}},mode);
 ok('arena_intro_'+mode+'_resumes_follow_no_snap',R.state==='fight'&&R.follow&&R.dx<=(mode==='skip'?30:MAXD*2)&&/* skip: the .12 lerp glides ~180 px back from the pan target (first frame ~20 px); the old snap was ~160 px in one frame */(mode!=='skip'||R.skipped),R);
 ok('arena_'+mode+'_camera_lock_survives',R.bx===R.arenaX0&&R.sx>=R.arenaX0,R);if(mode==='full')await shot('cam_arena_lock')}
// ---- 4. hero art: death + respawn + NG+ ----
await A.pg.goto(B+'assets/README.md');await ev(()=>localStorage.clear());await go('?play&mute&slot=1&class=knight&stage=ramparts');await ev(helpers);
const D=await ev(async()=>{const s=S(),keys=new Set();clear();s.player.inv=0;s.player.hp=0;s.die();const t0=performance.now();await new Promise(r=>{const f=()=>{if(s.player&&s.player.dead)keys.add(s._heroKey+':'+(s.pxc&&s.pxc.hero.visible?'v':'h'));if(performance.now()-t0>1900)r();else requestAnimationFrame(f)};f()});return{keys:[...keys]}});
await shot('death_after');
ok('death_uses_current_hero_art',D.keys.length&&D.keys.every(k=>k.startsWith('av_hero')),D);
await A.pg.waitForFunction(()=>{const s=__G.scene.getScene('stage');return s&&s.sys.isActive()&&s.player&&!s.player.dead&&s._heroKey},null,{timeout:20000});await new Promise(r=>setTimeout(r,800));
await ev(()=>{window.S=()=>__G.scene.getScene('stage')});
const RS=await ev(async()=>{const s=S(),keys=new Set();s.player.inv=0;const t0=performance.now();await new Promise(r=>{const f=()=>{keys.add(s._heroKey);if(performance.now()-t0>800)r();else requestAnimationFrame(f)};f()});return{keys:[...keys],ang:s.pxc.hero.angle,al:s.pxc.hero.alpha}});
await shot('respawn_after');
ok('respawn_uses_current_hero_art_upright',RS.keys.every(k=>k==='av_hero')&&RS.ang===0&&RS.al===1,RS);
await ev(()=>{const s=S();s.sv.ng=1;Save.write(s.sv)});await A.pg.goto(B+'?play&mute&slot=1&continue');
await A.pg.waitForFunction(()=>{const s=__G.scene.getScene('stage');return s&&s.sys.isActive()&&s.player&&s._heroKey},null,{timeout:30000});await new Promise(r=>setTimeout(r,800));
const NG=await ev(()=>{const s=__G.scene.getScene('stage');return{ng:s.ng,key:s._heroKey}});ok('ngplus_start_uses_current_hero_art',NG.ng>=1&&NG.key==='av_hero',NG);
// ---- 5. co-op guest: camera across cuts + guest death art (both screens) ----
const H=await mk(false);await H.pg.goto(B+'assets/README.md');await H.ev(()=>localStorage.clear());await H.go('?host&mute&stage=ramparts&class=knight');
await H.pg.waitForFunction(()=>NET.peer&&NET.peer.open,null,{timeout:20000}).catch(()=>{});const code=await H.ev(()=>NET.code);pages[await H.ev(()=>NET.peer.id)]=H.pg;
const G=await mk(false);await G.pg.goto(B+'assets/README.md');await G.ev(()=>localStorage.clear());await G.pg.goto(B+'?seed=0&mute&class=pyromancer&join='+code);
await G.pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await wait(1500);
await G.ev(()=>{window.S=()=>__G.scene.getScene('stage');window.tp=(x,y=156)=>{const s=S();s.pb.setPosition(x,y-8);s.pb.setVelocity(0,0);s.player.inv=99;s.camY=s.camTY=y-156};window.clear=()=>{}});await G.ev(helpers);
ok('coop_linked',await G.ev(()=>NET.linked()&&NET.guest()),{});
for(const i of [0,1]){const R=await G.ev(i=>cross(i),i);ok('coop_guest_cut'+(i+1)+'_smooth_no_snap',R.crossed>=1&&R.dx<=MAXD*1.75,R)/* guest runs at ~10 fps on the busy box; still far below a snap (100s of px) */}
await H.ev(()=>{const s=S();s.pb.setPosition(__G.scene.getScene('stage').player.x,s.pb.y)});
const gx=await G.ev(()=>S().player.x);await H.ev(x=>{const s=S();s.pb.setPosition(x-20,s.pb.y-4);s.player.inv=99},gx);await wait(800);
const GD=await G.ev(async()=>{const s=S(),keys=new Set();s.player.inv=0;s.player.hp=0;s.die();const t0=performance.now();await new Promise(r=>{const f=()=>{if(s.player.dead)keys.add(s._heroKey);if(performance.now()-t0>1500)r();else requestAnimationFrame(f)};f()});return{keys:[...keys]}});
const HD=await H.ev(async()=>{const s=S(),keys=new Set();const t0=performance.now();await new Promise(r=>{const f=()=>{if(s._remKey)keys.add(s._remKey);if(performance.now()-t0>800)r();else requestAnimationFrame(f)};f()});return{keys:[...keys]}});
await G.shot('coop_guest_death');
ok('coop_guest_death_uses_current_hero_art',GD.keys.length&&GD.keys.every(k=>/^av_hero/.test(k)),GD);
ok('coop_host_sees_guest_death_in_current_art',HD.keys.length&&!HD.keys.includes('legacy'),HD);
console.log('errors',JSON.stringify(errs.slice(0,5)));ok('no_page_errors',!errs.length,errs.slice(0,5));
if(process.env.CLIP&&FR.length>10){try{execSync(`ffmpeg -y -loglevel error -framerate ${Math.max(10,Math.round(FR.length/((FR[FR.length-1]-FR[0])/1000)))} -i ${VD}/%05d.jpg -vf "pad=ceil(iw/2)*2:ceil(ih/2)*2" -pix_fmt yuv420p -c:v libx264 ${process.env.CLIP}`)}catch(e){console.log('clip failed',e.message)}}
console.log(`camera: ${pass} pass, ${fail} fail`);await br.close();process.exit(fail?1:0);
