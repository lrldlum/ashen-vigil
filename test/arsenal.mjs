// Arsenal checks (arsenal.js): every melee moveset, shields (guard/absorb/parry window/guard break/magic FP), bows + crossbows,
// throwables (knife, fire/frost/storm jars), guns (mag, ammo, reload, recoil, spread, pierce, blast, rune FP + element, DEX scaling,
// smith upgrade, infusion), drops/merchant/save, co-op mirrored shots; r2: gamepad throw/cycle/guard, touch THR/GRD/RLD, smith infusion menu,
// distinct swing arcs, co-op partner guard; r3: Artist art, ON by default (?arsart=0 = off). usage: node test/arsenal.mjs (server :8171; TMPV=frame dir).
// Writes screenshots/arsenal/*.png, clips/arsenal.mp4 and one clip per category clips/arsenal_<cat>.mp4
import { chromium } from 'playwright';import {execSync} from 'child_process';import fs from 'fs';
const B='http://127.0.0.1:8171/',SH='screenshots/arsenal/';
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const errs=[],ext=new Set();let pass=0,fail=0;const ok=(n,c,v)=>{c?pass++:fail++;console.error((c?'PASS ':'FAIL ')+n+' '+JSON.stringify(v).slice(0,500))};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const VD=''+(process.env.TMPV||'/tmp/arsenalvid')+'';fs.rmSync(VD,{recursive:true,force:true});const FR=[];
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
fs.mkdirSync(SH,{recursive:true});const MARK={};const mark=(k,end)=>{MARK[k]=MARK[k]||[0,0];MARK[k][end?1:0]=FR.length};
const A=await mk(true);const{ev,go,shot}=A;
await A.pg.goto(B+'assets/README.md');await ev(()=>localStorage.clear());
await go('?play&mute&novideo&slot=1&class=knight&stage=ramparts');
const setup=()=>ev(()=>{const s=S(),sv=s.sv;clear();for(const k of Object.keys(sv.stats))sv.stats[k]=Math.max(sv.stats[k],30);s.applyBuild(true);s.player.inv=0;
 window.dummy=(dx=40,hp=999)=>{const P=S().player;const e=S().spawnEnemy('acolyte',P.x+dx,150);e.hp=hp;e.temp=1;e.cd=99;e.state='idle';e.b.setPosition(P.x+dx,149);e.b.setVelocity(0,0);e.b.body.moves=false;return e};// pinned standing on the floor (centre y149)
 window.equip=(id,slot='main')=>{const s=S(),sv=s.sv;if(!sv.inv.includes(id))sv.inv.push(id);sv.eq[slot]=id;s.applyBuild(false);s.player.st=s.player.stMax;s.player.fp=s.player.fpMax};
 window.act=(o,ms)=>new Promise(r=>{let n=0;window.__inp=()=>(n++===0?o:{});setTimeout(()=>{window.__inp=()=>({});r()},ms)});
 window.kill=()=>{for(const e of S().enemies)if(e.temp){e.dead=true;e.b.body.enable=false}};tp(400)});
await setup();
// ---------- 1. data
const D=await ev(()=>{const need={melee:['dagger','spear','katana','warhalberd','axe','whip','scythe','twinblade','staff','catalyst'],shields:['buckler','kite','towershield','magicshield'],bows:['bow','longbow','lightxbow','heavyxbow'],thrown:['tknife','firebomb','frostjar','boltjar'],guns:['flintlock','blunderbuss','handcannon','longrifle','runepistol']};
 const o={};for(const[k,L]of Object.entries(need))o[k]=L.filter(i=>k==='thrown'?!THROWN[i]:!WEAPONS[i]);o.types=need.guns.every(i=>WEAPONS[i].type==='gun')&&need.shields.every(i=>WEAPONS[i].hand==='off'&&WEAPONS[i].shield);
 o.pool=[...need.melee.slice(2,8),...need.guns,...need.shields,'longbow','lightxbow','heavyxbow'].filter(i=>!GEAR_POOL.includes(i));o.merch=['ammo','tknife','firebomb','flintlock'].filter(i=>!MERCH_STOCK.some(r=>r[0]===i));
 o.drops=['ammo','firebomb'].filter(i=>!Object.values(DROP_TABLES).some(t=>t.some(r=>r[0]===i)));o.desc=[...need.guns,...need.shields,'tknife'].filter(i=>!DESC[i]);o.smith=need.guns.filter(i=>!S().smithList||false);return o});
ok('arsenal_items_defined_and_obtainable',['melee','shields','bows','thrown','guns','pool','merch','drops','desc'].every(k=>!D[k].length)&&D.types,D);
// ---------- 2. melee movesets: light + heavy each land
mark('melee');const ML={};
for(const id of['dagger','spear','katana','warhalberd','axe','whip','scythe','twinblade','staff','catalyst']){
 const r=await ev(async id=>{equip(id);const P=S().player;P.f=1;P.state='idle';await new Promise(r=>setTimeout(r,150));const reach=WEAPONS[id].light.reach||0;let e=dummy(Math.max(10,reach+4));const h0=e.hp;await act({atkP:1},700);const l=+(h0-e.hp).toFixed(2);kill();tp(400);P.f=1;P.state='idle';S().player.st=S().player.stMax;await new Promise(r=>setTimeout(r,150));const H=WEAPONS[id].heavy;e=dummy(Math.max(10,(H.reach||0)+(H.lunge||0)*.15+4));const h1=e.hp;await act({heavyP:1},1100);const hv=+(h1-e.hp).toFixed(2);kill();tp(400);return{l,hv,move:WEAPONS[id].light.t}},id);ML[id]=r;}
await shot('ars01_melee');mark('melee',1);
ok('melee_movesets_light_and_heavy_hit',Object.values(ML).every(r=>r.l>0&&r.hv>0)&&new Set(Object.values(ML).map(r=>r.move)).size>=7,ML);
// ---------- 3. shields
mark('shields');const SHD={};
for(const id of['buckler','kite','towershield','magicshield']){
 SHD[id]=await ev(async id=>{equip('longsword');equip(id,'off');const s=S(),P=s.player;P.f=1;P.state='idle';P.inv=0;P.hp=P.hpMax;P.fp=0;window.__inp=()=>({guard:1});await new Promise(r=>setTimeout(r,200));
  const g=P.guard,h0=P.hp,st0=P.st;s.hurtPlayer(20,P.x+20);const lost=h0-P.hp,stc=+(st0-P.st).toFixed(1),fp=+P.fp.toFixed(1);P.inv=0;const back=(()=>{const h=P.hp;s.hurtPlayer(20,P.x-20);return h-P.hp})();P.inv=0;P.state='idle';
  window.__inp=()=>({});await new Promise(r=>setTimeout(r,300));return{g,lost,stc,fp,back,win:TUNE.parryWin}},id)}
await ev(async()=>{equip('kite','off');window.__inp=()=>({guard:1});await new Promise(r=>setTimeout(r,200));const s=S(),P=s.player;P.st=2;P.inv=0;window.__gb=P.hp;s.hurtPlayer(20,P.x+20);window.__gb=window.__gb-P.hp;window.__inp=()=>({})});
const gb=await ev(()=>window.__gb);await wait(900);// r6: guard break staggers 0.7 s and keeps the guard down until V is re-pressed
await ev(async()=>{window.__inp=()=>({});await new Promise(r=>setTimeout(r,100));const P=S().player;P.st=P.stMax;equip('towershield','off');window.__inp=()=>({guard:1});S().player.f=1});await wait(300);await shot('ars02_tower_guard');await ev(()=>{window.__inp=()=>({})});mark('shields',1);
ok('shields_block_absorb_and_parry_windows',SHD.buckler.g&&SHD.buckler.lost>0&&SHD.buckler.lost<20&&SHD.kite.lost<SHD.buckler.lost&&SHD.towershield.lost===0&&SHD.magicshield.fp>0&&SHD.towershield.stc<SHD.buckler.stc&&SHD.buckler.back>0
 &&SHD.buckler.win>SHD.kite.win&&SHD.towershield.win===0&&gb>0,{SHD,gb});
await ev(()=>{const sv=S().sv;sv.eq.off=null;S().applyBuild(false)});
// ---------- 4. bows + crossbows
mark('bows');const BW={};
for(const id of['bow','longbow','lightxbow','heavyxbow'])BW[id]=await ev(async id=>{equip(id);const P=S().player;P.f=1;P.state='idle';const e=dummy(120);const h=e.hp;await act({atkP:1},1500);const d=+(h-e.hp).toFixed(2);kill();return{d,t:WEAPONS[id].light.t}},id);
await ev(async()=>{equip('heavyxbow');S().player.f=1;dummy(150);await act({atkP:1},250)});await shot('ars03_crossbow');await ev(()=>kill());mark('bows',1);
ok('bows_and_crossbows_shoot',Object.values(BW).every(r=>r.d>0)&&BW.lightxbow.t>BW.bow.t,BW);
// ---------- 5. throwables
mark('thrown');
const TH=await ev(async()=>{const s=S(),sv=s.sv,P=s.player,o={};equip('longsword');for(const k of['tknife','firebomb','frostjar','boltjar'])s.takeDrop({kind:k,x:P.x,y:P.y});o.counts={...sv.thr};o.q2=sv.eq.q2;P.f=1;
 let e=dummy(70);let h=e.hp;sv.eq.q2='tknife';await act({throwP:1},900);o.knife=+(h-e.hp).toFixed(2);o.kLeft=sv.thr.tknife;kill();
 const e1=dummy(88),e2=dummy(102);const h1=e1.hp,h2=e2.hp;sv.eq.q2='firebomb';o.pos=[Math.round(P.x),Math.round(e1.b.x),Math.round(e2.b.x)];const ob=s.arsBlast.bind(s);s.arsBlast=p=>{o.bx=[Math.round(p.x),Math.round(p.y)];o.ex=[Math.round(e1.b.body.center.x),Math.round(e1.b.body.center.y),e1.dead];ob(p)};await act({throwP:1},1400);o.bomb=[+(h1-e1.hp).toFixed(1),+(h2-e2.hp).toFixed(1)];o.burn=(e1.burn||0)>0||e1.hp<h1-1;kill();
 e=dummy(95);sv.eq.q2='frostjar';await act({throwP:1},1400);o.slow=(e.slowT||0)>0;kill();
 e=dummy(95);sv.eq.q2='boltjar';await act({throwP:1},1200);o.stag=e.state==='stag'||e.hp<999;kill();
 sv.eq.q2='tknife';await act({thrCyc:1},200);o.cyc=sv.eq.q2;sv.thr={};o.empty=s.throwItem();return o});
await shot('ars04_throwables');mark('thrown',1);
ok('throwables_thrown_counted_and_elemental',TH.counts.tknife>=5&&TH.counts.firebomb>=3&&TH.knife>0&&TH.kLeft===4&&TH.bomb[0]>0&&TH.bomb[1]>0&&TH.slow&&TH.stag&&TH.cyc!=='tknife'&&TH.empty===false,TH);
// ---------- 6. guns
mark('guns');const GN={};
for(const id of['flintlock','blunderbuss','handcannon','longrifle','runepistol'])GN[id]=await ev(async id=>{const s=S(),sv=s.sv,P=s.player;equip(id);sv.ammo=10;delete sv.gmag[id];P.f=1;P.state='idle';
 const e=dummy(46),e2=dummy(70);const h=e.hp,h2=e2.hp,fp0=P.fp,x0=P.x;await act({atkP:1},160);const vx=s.pb.body.velocity.x;await new Promise(r=>setTimeout(r,500));
 const o={d:+(h-e.hp).toFixed(2),d2:+(h2-e2.hp).toFixed(2),recoil:vx<0||P.x<x0,mag:sv.gmag[id],fp:+(fp0-P.fp).toFixed(1),hits:e.flash};
 await new Promise(r=>setTimeout(r,(WEAPONS[id].gun.reload+.8)*1000));o.mag2=sv.gmag[id];o.ammo=sv.ammo;kill();return o},id);
const RN=await ev(async()=>{const s=S(),sv=s.sv;equip('runepistol');sv.rune='fire';await act({heavyP:1},300);const a=sv.rune;await act({heavyP:1},300);return[a,sv.rune,s.arsElem('runepistol')]});
const SC=await ev(()=>{const s=S(),sv=s.sv;equip('longrifle');const st={...sv.stats};sv.stats.dex=10;s.applyBuild(false);const lo=s.build.ar;sv.stats.dex=40;s.applyBuild(false);const hi=s.build.ar;
 sv.embers=99;s.souls=sv.souls=99999;const r=s.smithUp('longrifle');const up=s.build.ar;sv.wup.longrifle.inf='fire';const el=s.arsElem('longrifle');Object.assign(sv.stats,st);s.applyBuild(false);return{lo,hi,r,up,el,inList:s.smithList().includes('longrifle')}});
await ev(async()=>{equip('blunderbuss');S().sv.ammo=5;delete S().sv.gmag.blunderbuss;S().player.f=1;dummy(60);await act({atkP:1},40)});await shot('ars05_blunderbuss_flash');await wait(600);
await ev(async()=>{equip('handcannon');S().sv.ammo=5;delete S().sv.gmag.handcannon;S().player.f=1;await act({atkP:1},40)});await shot('ars06_handcannon_flash');await wait(700);await ev(()=>kill());mark('guns',1);
ok('guns_fire_recoil_and_reload',['flintlock','blunderbuss','handcannon','longrifle'].every(i=>GN[i].d>0&&GN[i].recoil&&GN[i].mag===0&&GN[i].mag2===1)&&GN.longrifle.d2>0&&GN.handcannon.d2>=0&&GN.runepistol.d>0&&GN.runepistol.fp>=2&&GN.runepistol.mag==null,GN);
ok('gun_blunderbuss_spread_beats_pistol_up_close',GN.blunderbuss.d>GN.flintlock.d*.8,{b:GN.blunderbuss.d,f:GN.flintlock.d});
ok('gun_rune_elements_dex_scaling_smith_infusion',RN[0]==='frost'&&RN[1]==='lightning'&&SC.hi>SC.lo*1.3&&SC.r==='OK'&&SC.up>SC.lo&&SC.el==='fire'&&SC.inList,{RN,SC});
// ---------- 7. no ammo: click; merchant sells powder + throwables + a gun; save keeps it all
await wait(3000);const NA=await ev(async()=>{const s=S(),sv=s.sv;s.ars.reload=0;equip('flintlock');sv.ammo=0;sv.gmag.flintlock=0;await act({atkP:1},300);return{mag:sv.gmag.flintlock,reload:!!(s.ars.reload>0)}});
const MB=await ev(()=>{const s=S(),sv=s.sv;s.souls=sv.souls=9999;const a0=sv.ammo;s.menu={mode:'lmerch',sel:0,t:1,prev:{}};const buy=id=>{s.menu.sel=s.merchRows().findIndex(r=>r[0]===id);s.menuKey('ok')};
 sv.inv=sv.inv.filter(i=>i!=='flintlock');buy('ammo');buy('firebomb');buy('flintlock');const o={ammo:sv.ammo-a0,fb:sv.thr.firebomb,gun:sv.inv.includes('flintlock'),gone:!s.merchRows().some(r=>r[0]==='flintlock'),souls:9999-s.souls};s.menu=null;sv.gmag.flintlock=1;Save.write(sv);return o});
await go('?play&mute&novideo&slot=1&continue');const SV=await ev(()=>{const sv=S().sv;return{ammo:sv.ammo,fb:sv.thr&&sv.thr.firebomb,mag:sv.gmag&&sv.gmag.flintlock,gun:sv.inv.includes('flintlock')}});
ok('no_shot_clicks_merchant_and_save',NA.mag===0&&!NA.reload&&MB.ammo===12&&MB.fb===3&&MB.gun&&MB.gone&&MB.souls===3400&&SV.ammo>=12&&SV.fb===3&&SV.mag===1&&SV.gun,{NA,MB,SV});
await go('?play&mute&novideo&slot=1&continue');await setup();
// ---------- 9. gamepad: D-pad down tap = throw, hold = cycle; LB = guard
mark('pad');const PD=await ev(async()=>{const s=S(),sv=s.sv,P=s.player;window.__inp=null;equip('longsword');equip('kite','off');sv.thr={tknife:5,firebomb:3};sv.eq.q2='tknife';P.f=1;
 const pad=b=>({connected:true,buttons:Array.from({length:17},(_,i)=>({pressed:b.includes(i),value:b.includes(i)?1:0})),axes:[0,0,0,0]});const sl=ms=>new Promise(r=>setTimeout(r,ms));const o={};
 window.__fakePad=pad([13]);await sl(120);window.__fakePad=pad([]);await sl(500);o.thrown=5-(sv.thr.tknife||0);
 window.__fakePad=pad([13]);await sl(700);window.__fakePad=pad([]);await sl(200);o.cyc=sv.eq.q2;
 window.__fakePad=pad([4]);await sl(250);o.guard=!!P.guard;window.__fakePad=null;await sl(200);o.after=!!P.guard;window.__inp=()=>({});return o});
ok('gamepad_throw_cycle_guard',PD.thrown===1&&PD.cyc!=='tknife'&&PD.guard&&!PD.after,PD);
// ---------- 10. touch THR / GRD / RLD
const TC=await ev(async()=>{const s=S(),sv=s.sv,P=s.player;window.__inp=null;const sl=ms=>new Promise(r=>setTimeout(r,ms));const o={btn:['thr','grd','rld'].every(k=>TBTN.some(b=>b.k===k))};const t0=s.touch,ts0=s.touchState;s.touch=true;window.__th={};s.touchState=function(){const o=ts0.call(this);this.tHeld=Object.assign({},this.tHeld,window.__th);return o};// fake fingers on the new buttons
 sv.eq.q2='tknife';sv.thr.tknife=3;window.__th={thr:1};await sl(120);window.__th={};await sl(400);o.thrown=3-sv.thr.tknife;
 window.__th={grd:1};await sl(200);o.guard=!!P.guard;window.__th={};await sl(150);
 equip('flintlock');sv.ammo=5;sv.gmag.flintlock=0;s.ars.reload=0;window.__th={rld:1};await sl(120);window.__th={};o.reload=s.ars.reload>0;await sl(1700);o.mag=sv.gmag.flintlock;s.touchState=ts0;s.touch=t0;window.__inp=()=>({});return o});
await shot('ars08_touch');mark('pad',1);
ok('touch_throw_guard_reload',TC.btn&&TC.thrown===1&&TC.guard&&TC.reload&&TC.mag===1,TC);
// ---------- 11. smith infusion menu
mark('infuse');const IF=await ev(async()=>{const s=S(),sv=s.sv,o={};equip('katana');sv.embers=5;s.souls=sv.souls=9000;delete (sv.wup||{}).katana;s.applyBuild(false);const ar0=s.build.ar;
 s.menu={mode:'smith',sel:0,t:1,prev:{}};s.menu.sel=s.smithList().indexOf('katana');s.menuKey('right');o.mode=s.menu&&s.menu.mode;const L=[null,...Object.keys(INF)];s.menu.sel=L.indexOf('fire');s.menuKey('ok');
 o.inf=(sv.wup.katana||{}).inf;o.embers=sv.embers;o.souls=s.souls;s.applyBuild(false);o.ar=[ar0,s.build.ar];o.poor=(sv.embers=0,s.arsInfuse('katana','dark'));s.menu=null;Save.write(sv);
 const P=s.player;P.f=1;P.state='idle';const e=dummy(20);s.stats.infHits=0;await act({atkP:1},700);o.burn=(e.burn||0)>0;o.hits=s.stats.infHits;kill();return o});
await shot('ars09_infused');mark('infuse',1);
ok('smith_infusion_menu_cost_and_element',IF.mode==='infuse'&&IF.inf==='fire'&&IF.embers===3&&IF.souls===7000&&IF.poor==='SHARDS'&&IF.burn&&IF.hits>0&&Math.abs(IF.ar[1]-IF.ar[0]-.15)<.01,IF);
// ---------- 12. distinct swing arcs
mark('swings');const SW=await ev(async()=>{const s=S(),o={};for(const id of['katana','warhalberd','whip','scythe','twinblade','catalyst']){equip(id);s.stats.arsSwing={};const P=s.player;P.state='idle';P.f=1;await act({atkP:1},700);o[id]=Object.keys(s.stats.arsSwing)}return o});
mark('swings',1);
ok('distinct_swing_arcs',Object.values(SW).every(k=>k.length===1)&&new Set(Object.values(SW).map(k=>k[0])).size===6,SW);

// ---------- 14. Tester r15 fixes
mark('r15');
const T15=await ev(async()=>{const s=S(),sv=s.sv,P=s.player,o={},sl=ms=>new Promise(r=>setTimeout(r,ms));window.__fakePad=null;
 // P1-1 throwable on the weapon AR scale: one knife <= ~1x a light attack
 equip('longsword');tp(400);P.f=1;let e=dummy(20);let h=e.hp;await act({atkP:1},700);o.light=+(h-e.hp).toFixed(2);kill();
 sv.thr={tknife:3};sv.eq.q2='tknife';e=dummy(60);h=e.hp;await act({throwP:1},700);o.knife=+(h-e.hp).toFixed(2);kill();
 o.ar=s.build.ar;o.prices=Object.fromEntries(MERCH_STOCK.filter(r=>ARS.THROWN[r[0]]).map(r=>[r[0],r[1]]));
 // P1-2 fire infusion total <= 1.5x plain; lightning stagger uptime < 30%; projectiles never riposte
 const tot=async inf=>{sv.wup=sv.wup||{};sv.wup.longsword={...(sv.wup.longsword||{}),inf};if(!inf)delete sv.wup.longsword.inf;s.applyBuild(false);tp(400);P.f=1;const e=dummy(20);const h=e.hp;await act({atkP:1},700);await sl(2600);const d=h-e.hp;kill();return+d.toFixed(2)};
 o.plain=await tot(null);o.fire=await tot('fire');sv.wup.longsword={};s.applyBuild(false);
 equip('runepistol');sv.rune='lightning';tp(400);P.f=1;e=dummy(40);let st=0,fr=0;for(let i=0;i<40;i++){P.fp=P.fpMax;s.ars.reload=0;await act({atkP:1},150);if(e.state==='stag')st++;fr++}o.uptime=+(st/fr).toFixed(2);kill();
 e=dummy(40);e.state='stag';e.t=0;h=e.hp;s.arsHitE(e,1,1,null);o.projOnStag=+(h-e.hp).toFixed(2);kill();
 // P2-3 parked / other-room enemies are out of reach; shots end at the room cut
 equip('longrifle');sv.ammo=9;const r=s.room;o.room=r&&[r.x0,r.x1];tp(r.x1-30);await sl(150);P.f=1;e=dummy(60);o.ex=Math.round(e.b.x);h=e.hp;delete sv.gmag.longrifle;await act({atkP:1},600);o.otherRoom=+(h-e.hp).toFixed(2);kill();
 tp(400);P.f=1;e=dummy(60);e.parked=1;h=e.hp;delete sv.gmag.longrifle;s.ars.reload=0;await act({atkP:1},600);o.parked=+(h-e.hp).toFixed(2);e.parked=0;kill();
 // P2-4 environment ignores the guard
 equip('longsword');equip('towershield','off');window.__inp=()=>({guard:1});await sl(200);P.inv=0;P.hp=P.hpMax;const b0=s.stats.blocks||0;const a0=P.air;P.air=0;let h0=P.hp;s.hurtPlayer(8,P.x,'env');o.drown=h0-P.hp;P.air=a0;P.inv=0;P.state='idle';
 h0=P.hp;s.hurtPlayer(15,P.x-1,'env');o.spike=h0-P.hp;P.inv=0;P.state='idle';await sl(100);h0=P.hp;s.hurtPlayer(20,P.x+20*P.f);o.front=h0-P.hp;o.envBlocks=(s.stats.blocks||0)-b0;P.inv=0;P.state='idle';
 // P2-5 guard break: full hit, hurt stagger, guard stays down while held
 window.__inp=()=>({});sv.eq.off=null;s.applyBuild(false);await sl(150);P.inv=0;P.hp=P.hpMax;h0=P.hp;s.hurtPlayer(16,P.x+20*P.f,{});const base=h0-P.hp;await sl(900);P.state='idle';P.inv=0;equip('kite','off');window.__inp=()=>({guard:1});P.hp=P.hpMax;await sl(200);P.st=1;P.inv=0;h0=P.hp;s.hurtPlayer(16,P.x+20*P.f,{});o.gb={lost:h0-P.hp,base,state:P.state};await sl(300);o.gb.heldGuard=!!P.guard;window.__inp=()=>({});await sl(150);P.st=P.stMax;window.__inp=()=>({guard:1});await sl(1000);o.gb.again=!!P.guard;window.__inp=()=>({});
 P.hp=P.hpMax;sv.eq.off=null;s.applyBuild(false);
 // P2-6 HUD: fresh gun shows a full magazine, top-right
 delete sv.gmag.flintlock;equip('flintlock');await sl(150);o.hud=s.stats.arsHud;
 // P2-7 balance data
 o.bal={rune:[WEAPONS.runepistol.gun.mul,WEAPONS.runepistol.gun.fp],bb:[WEAPONS.blunderbuss.gun.mul,WEAPONS.blunderbuss.gun.spread],fl:WEAPONS.flintlock.gun.reload,whip:[WEAPONS.whip.light.reach,WEAPONS.whip.light.cost],hal:WEAPONS.warhalberd.base,scy:WEAPONS.scythe.sc};
 // P3-8 / 9 / 12 / 13
 o.keys=Object.values(MIRACLES).map(m=>m.key);const g=s.add.graphics();s.drawPause(g);o.pause=s.stats.pauseArs;o.pauseR=s.stats.pauseArsR;o.W=W;
 s.menu={mode:'lmerch',sel:s.merchRows().findIndex(r=>r[0]==='ammo'),t:1,prev:{}};s.drawMenu0(g,g);o.merch=s.stats.merchTxt;
 s.menu={mode:'infuse',id:'longsword',sel:1,t:1,prev:null};s.drawMenu0(g,g);o.inf=s.stats.infText;s.menu=null;g.destroy();o.desc=DESC.ammo[0];
 // P3-10 D-pad Down while moving does not throw
 window.__inp=null;sv.thr={tknife:3};sv.eq.q2='tknife';const pad=b=>({connected:true,buttons:Array.from({length:17},(_,i)=>({pressed:b.includes(i),value:b.includes(i)?1:0})),axes:[0,0,0,0]});
 s.pb.setVelocityX(120);window.__fakePad=pad([13]);await sl(80);s.pb.setVelocityX(120);window.__fakePad=pad([]);await sl(200);o.padMoving=3-sv.thr.tknife;window.__fakePad=null;window.__inp=()=>({});tp(400);
 // P3-11 reload cancelled by a weapon change
 equip('flintlock');sv.ammo=5;sv.gmag.flintlock=0;s.ars.reload=0;s.gunReload('flintlock');await sl(100);equip('runepistol');o.reloadAfterSwap=s.ars.reload;P.fp=P.fpMax;const sh0=s.stats.shots||0;await act({atkP:1},300);o.runeFired=(s.stats.shots||0)-sh0;
 return o});
await shot('ars12_r15_hud');mark('r15',1);
ok('p1_1_throwable_on_weapon_scale',T15.knife>0&&T15.knife<=T15.ar*1.2&&T15.prices.tknife>=600,T15);
ok('p1_2_status_curve',T15.fire<=T15.plain*1.5&&T15.fire>T15.plain&&T15.uptime<.3&&T15.projOnStag===1,{plain:T15.plain,fire:T15.fire,up:T15.uptime,rip:T15.projOnStag});
ok('p2_3_no_hits_in_other_rooms_or_parked',T15.otherRoom===0&&T15.parked===0,{room:T15.room,o:T15.otherRoom,p:T15.parked});
ok('p2_4_env_ignores_guard',T15.drown>0&&T15.spike>0&&T15.front===0&&T15.envBlocks===1,{d:T15.drown,s:T15.spike,f:T15.front,b:T15.envBlocks});
ok('p2_5_guard_break_punishes',T15.gb.lost===T15.gb.base&&T15.gb.base>0&&T15.gb.state==='hurt'&&!T15.gb.heldGuard&&T15.gb.again,T15.gb);
ok('p2_6_hud_full_mag_top_right',T15.hud&&/MAG 1\/1/.test(T15.hud.s)&&T15.hud.y===22,T15.hud);
ok('p2_7_balance',JSON.stringify(T15.bal)===JSON.stringify({rune:[.6,7],bb:[.9,.22],fl:1,whip:[22,20],hal:1.6,scy:{str:'B',dex:'C'}}),T15.bal);
ok('p3_labels_pause_merch_infuse_pad_reload',T15.keys.every(k=>!/^[GTR]$/.test(k))&&T15.pause===3&&T15.pauseR<=T15.W&&/PISTOL SHOT/.test(T15.merch)&&T15.inf&&T15.inf.x+T15.inf.w<=312&&/12 PISTOL/.test(T15.desc)&&T15.padMoving===0&&T15.reloadAfterSwap===0&&T15.runeFired===1,{k:T15.keys,p:T15.pause,m:T15.merch,i:T15.inf,pm:T15.padMoving,r:T15.reloadAfterSwap,rf:T15.runeFired});

// ---------- 15. PixelFX (MIT, vendored subset): loads, bakes per stage palette, renders on shots / blasts / impacts / spells
mark('pfx');
const PF=await ev(async()=>{const s=S(),sv=s.sv,P=s.player,o={},sl=ms=>new Promise(r=>setTimeout(r,ms));await until(()=>ARS.pfx||ARS.pfxErr,5000);o.mod=!!ARS.pfx;o.err=ARS.pfxErr;
 tp(400);s.stats.pfx={};equip('flintlock');sv.ammo=9;delete sv.gmag.flintlock;s.ars.reload=0;P.f=1;let e=dummy(50);await act({atkP:1},120);o.live=s.pfxLive?s.pfxLive.size:0;await sl(500);kill();
 s.arsBlast({x:P.x+60,y:150,blast:30,dmg:.1,elem:'frost'});s.arsBlast({x:P.x+60,y:150,blast:30,dmg:.1,elem:'lightning'});s.arsBlast({x:P.x+60,y:150,blast:30,dmg:.1});
 o.sp0=s.stats.spFired||0;o.pfx={...s.stats.pfx};
 // helper API for other code: impact / explosion / burst with names, hex and numbers
 s.stats.pfx={};o.api=[typeof ArsFX,ArsFX.ready(),ArsFX.on()];o.ret=[!!ArsFX.impact(P.x+30,P.y-12,'holy'),!!ArsFX.impact(P.x+30,P.y-12,'#40c0ff'),!!ArsFX.explosion(P.x+40,150,'frost'),!!ArsFX.explosion(P.x+40,150,'fire',0x80ff80),!!ArsFX.burst(P.x,P.y-8,'arcane')];
 o.apiPfx={...s.stats.pfx};o.calls=s.stats.arsFxApi;o.spellHooks=String(Stage.prototype.spBurst).includes('pfxPlay')||String(Stage.prototype.spFire).includes('pfxPlay');
 const tk=Object.keys(ARS.PFXMETA||{}).find(k=>k.startsWith('pfx_muzzle_base_'));let lit=0;if(tk){const src=s.textures.get(tk).getSourceImage(),d=src.getContext('2d').getImageData(0,0,src.width,src.height).data;for(let i=3;i<d.length;i+=4)if(d[i]>40)lit++}o.tk=tk;o.lit=lit;
 const a=ARS.pfx.bake('spark',{theme:'ramparts'}).data,b=ARS.pfx.bake('spark',{theme:'cinderdeep'}).data;let diff=0;for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1])diff++;o.themeDiff=diff;o.bake=s.stats.pfxBake;return o});
await shot('ars13_pfx');mark('pfx',1);
ok('pixelfx_loads_bakes_and_renders',PF.mod&&!PF.err&&PF.live>0&&PF.pfx.muzzle>=1&&PF.pfx.spark>=1&&PF.pfx.snow>=1&&PF.pfx.plasma>=1&&PF.pfx.boom>=1&&PF.lit>50&&PF.themeDiff>50&&PF.bake.ms/PF.bake.n<80,{...PF,apiPfx:undefined,ret:undefined});
ok('arsfx_helper_api_and_no_spell_hooks',PF.api[0]==='object'&&PF.api[1]&&PF.ret.every(Boolean)&&PF.apiPfx.spark===2&&PF.apiPfx.snow===1&&PF.apiPfx.boom===1&&PF.apiPfx.mana===1&&PF.calls>=5&&!PF.spellHooks,{api:PF.api,ret:PF.ret,p:PF.apiPfx,c:PF.calls,h:PF.spellHooks});

// ---------- 16. Tester r16
mark('r16');
const T16=await ev(async()=>{const s=S(),sv=s.sv,P=s.player,o={},sl=ms=>new Promise(r=>setTimeout(r,ms));kill();tp(400);P.hp=P.hpMax;
 // P1: front shots / shards / boss charge into a tower-shield guard deal 0; tagged hazards (drowning) go through
 equip('longsword');equip('towershield','off');P.f=1;window.__inp=()=>({guard:1});await sl(250);P.inv=0;let h=P.hp;
 for(let i=0;i<3;i++){s.shots.push({x:P.x+60,y:P.y-7,vx:-200,vy:0,dmg:12,t:0,r:6});await sl(500);P.inv=0}o.shots=h-P.hp;
 h=P.hp;s.hurtPlayer(16,P.x+3);P.inv=0;o.shard=h-P.hp;h=P.hp;s.hurtPlayer(20,P.x+4,'boss');P.inv=0;o.charge=h-P.hp;P.st=P.stMax;
 h=P.hp;s.hurtPlayer(8,P.x,'env');o.drown=h-P.hp;P.inv=0;P.state='idle';
 window.__inp=()=>({});sv.eq.off=null;s.applyBuild(false);await sl(200);h=P.hp;P.inv=0;s.hurtPlayer(8,P.x,'env');o.drownBare=h-P.hp;P.inv=0;P.state='idle';
 const src=await (await fetch('game.js')).text(),bt=await (await fetch('btenemies.js')).text(),br=await (await fetch('btregion.js')).text();
 o.tags=["hurtPlayer(8,P.x,'env')","hurtPlayer(12,P.x-away*8,'env')","hurtPlayer(18,x,'env')","hurtPlayer(15,cx-P.f,'env')","b+10:a-10,'env')"].filter(t=>!src.includes(t)).concat(bt.includes("hurtPlayer(14,c.x,'env')")?[]:['bt34'],br.includes("hurtPlayer(10,c.x,'env')")?[]:['br40']);
 o.bossTags=(src.match(/hurtPlayer\(20,B\.x,'boss'\)/g)||[]).length;
 // P2-4: tower shield vs boss heavies: 25% chip, two slams break the guard
 equip('towershield','off');P.hp=P.hpMax;P.st=P.stMax;window.__inp=()=>({guard:1});await sl(250);const B0=s.boss;s.boss={state:'slam',x:P.x+20,y:P.y};const gb0=s.stats.guardBreaks||0;
 P.inv=0;h=P.hp;s.hurtPlayer(24,P.x+20,'boss');o.chip=h-P.hp;o.st1=Math.round(P.st);P.inv=0;s.hurtPlayer(24,P.x+20,'boss');o.broke=(s.stats.guardBreaks||0)-gb0;s.boss=B0;window.__inp=()=>({});await sl(900);P.state='idle';P.inv=0;P.hp=P.hpMax;sv.eq.off=null;s.applyBuild(false);
 // P2-2/3: ladder + whip (light-chain DPS = AR x light.mul / light.t), and each ladder weapon's light actually lands
 const st0={...sv.stats},dps=(id,b)=>{Object.assign(sv.stats,b);sv.eq.main=id;s.applyBuild(false);const L=WEAPONS[id].light;return+(s.build.ar*L.mul/L.t).toFixed(2)};
 const STR={str:40,dex:14,int:10,fth:10},DEX={str:14,dex:40,int:10,fth:10};o.ladder=ARS.STR_LADDER.map(id=>dps(id,STR));
 o.whip={str:[dps('whip',STR),dps('longsword',STR)],dex:[dps('whip',DEX),dps('longsword',DEX)]};Object.assign(sv.stats,STR);o.lands={};
 for(const id of ARS.STR_LADDER){equip(id);tp(400);await sl(120);P.f=1;const e=dummy(Math.max(10,(WEAPONS[id].light.reach||0)+4));const h0=e.hp;await act({atkP:1},1000);o.lands[id]=+(h0-e.hp).toFixed(2);kill()}
 // P3-5: throw AR from DEX only
 const knife=async(dex,main)=>{sv.stats.dex=dex;equip(main);tp(400);await sl(120);P.f=1;sv.thr={tknife:2};sv.eq.q2='tknife';const e=dummy(60);const h0=e.hp;await act({throwP:1},700);kill();return+(h0-e.hp).toFixed(2)};
 o.knife=[await knife(10,'dagger'),await knife(10,'hollowbrand'),await knife(40,'dagger')];Object.assign(sv.stats,st0);equip('longsword');
 // P3-6: shot pouch text fits the merchant panel (x 202..316)
 o.pouch=ARS.MTXT.ammo.map(t=>textW(t));return o});
await shot('ars14_r16');mark('r16',1);
ok('r16_p1_guard_blocks_shots_shards_charge_not_hazards',T16.shots===0&&T16.shard===0&&T16.charge===0&&T16.drown>0&&T16.drown===T16.drownBare&&!T16.tags.length&&T16.bossTags===2,{s:T16.shots,sh:T16.shard,c:T16.charge,d:[T16.drown,T16.drownBare],tags:T16.tags,b:T16.bossTags});
ok('r16_p2_str_boss_ladder',T16.ladder.every((v,i)=>!i||v>=T16.ladder[i-1]*1.1)&&Object.values(T16.lands).every(v=>v>0),{ladder:T16.ladder,lands:T16.lands});
ok('r16_p2_whip_at_most_1_5x_longsword',T16.whip.str[0]<=T16.whip.str[1]*1.5&&T16.whip.dex[0]<=T16.whip.dex[1]*1.5,T16.whip);
ok('r16_p2_tower_boss_chip_and_two_slams_break',T16.chip>0&&T16.broke===1,{chip:T16.chip,st1:T16.st1,broke:T16.broke});
ok('r16_p3_throw_dex_ar_and_pouch_text',T16.knife[0]===T16.knife[1]&&T16.knife[2]>T16.knife[0]*1.5&&T16.pouch.every(w=>w<=112),{k:T16.knife,p:T16.pouch});
await A.ctx.close();
// ---------- 8. co-op: a guest's shot is mirrored on the host and its damage lands host-side
const H=await mk(false);await H.pg.goto(B+'assets/README.md');await H.ev(()=>localStorage.clear());await H.go('?host&mute&novideo&stage=ramparts&class=knight');
await H.pg.waitForFunction(()=>NET.peer&&NET.peer.open,null,{timeout:20000}).catch(()=>{});const code=await H.ev(()=>NET.code);pages[await H.ev(()=>NET.peer.id)]=H.pg;
const G=await mk(false);await G.pg.goto(B+'assets/README.md');await G.ev(()=>localStorage.clear());await G.pg.goto(B+'?seed=0&mute&novideo&class=knight&join='+code);
await G.pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await wait(1500);
await G.ev(()=>{window.S=()=>__G.scene.getScene('stage')});
const linked=await G.ev(()=>NET.linked());
await H.ev(()=>{clear();const s=S();s.pb.setPosition(400,148);s.player.inv=99});
await G.ev(()=>{const s=S(),sv=s.sv;sv.stats.dex=30;sv.inv.push('flintlock');sv.eq.main='flintlock';sv.ammo=6;s.applyBuild(false);s.pb.setPosition(360,148);s.pb.setVelocity(0,0);s.player.f=1;s.player.inv=99});await wait(900);
const eh=await H.ev(()=>{const s=S(),e=s.spawnEnemy('acolyte',400,156);e.hp=200;e.temp=1;e.cd=99;e.state='idle';window.__e=e;return s.enemies.indexOf(e)});await wait(800);
await G.ev(()=>{let n=0;window.__inp=()=>(n++===0?{atkP:1}:{})});await wait(1500);
const CO=[await H.ev(()=>({hp:+window.__e.hp.toFixed(1),net:S().stats.arsNet||0})),await G.ev(()=>({shots:S().stats.shots||0,mag:S().sv.gmag.flintlock}))];await H.shot('ars07_coop_host_sees_guest_shot');
ok('coop_guest_gun_shot_mirrored_and_damages',linked&&CO[0].net>=1&&CO[0].hp<200&&CO[1].shots===1,{linked,CO});
await G.ev(()=>{const s=S(),sv=s.sv;sv.inv.push('kite');sv.eq.main='longsword';sv.eq.off='kite';s.applyBuild(false);window.__inp=()=>({guard:1})});await H.ev(()=>{S().stats.arsRemoteGuard=0});await wait(1200);
const RG=[await H.ev(()=>({n:S().stats.arsRemoteGuard||0,gd:NET.remote&&NET.remote.gd,off:NET.remote&&NET.remote.off})),await G.ev(()=>!!S().player.guard)];await H.shot('ars10_coop_partner_guard');
await G.ev(()=>{window.__inp=()=>({})});
// r16: co-op guest's tower-shield guard takes the 25% chip from the boss charge (net.js guest path tagged 'boss')
const GC=await G.ev(async()=>{const s=S(),sv=s.sv,P=s.player,sl=ms=>new Promise(r=>setTimeout(r,ms));sv.inv.push('towershield');sv.eq.main='longsword';sv.eq.off='towershield';s.applyBuild(false);P.f=1;P.hp=P.hpMax;P.st=P.stMax;window.__inp=()=>({guard:1});await sl(300);
 const B0=s.boss;s.boss={state:'charge',x:P.x+4,y:P.y};P.inv=0;const h=P.hp;s.hurtPlayer(20,P.x+4,'boss');const chip=h-P.hp;window.__inp=()=>({});P.inv=0;P.state='idle';P.hp=P.hpMax;sv.eq.off=null;s.applyBuild(false);await sl(300);const h2=P.hp;s.hurtPlayer(20,P.x+4,'boss');const bare=h2-P.hp;s.boss=B0;P.inv=0;P.state='idle';P.hp=P.hpMax;
 const src=await (await fetch('net.js')).text();return{chip,bare,tag:src.includes("S.hurtPlayer(20,B.x,'boss')")}});
ok('r16_coop_guest_tower_boss_charge_chip_25',GC.chip>0&&Math.abs(GC.chip-GC.bare*.25)<=1&&GC.tag,GC);
ok('coop_partner_sees_shield_guard',RG[1]&&RG[0].n>0&&RG[0].off==='kite',RG);
await H.ctx.close();await G.ctx.close();

// ---------- 13. Artist art: ?arsart=0 loads nothing; default (ON) loads the manifest, wields overlays, guns never on attack frames
const AO=await mk(false);await AO.pg.goto(B+'assets/README.md');await AO.ev(()=>localStorage.clear());await AO.go('?play&mute&novideo&slot=1&class=knight&stage=ramparts&arsart=0');
const OFF=await AO.ev(()=>({m:!!ARS.ART,t:S().textures.exists('arsw_katana')}));await AO.ctx.close();
ok('art_flag_off_switch_arsart0',!OFF.m&&!OFF.t,OFF);
const AR=await mk(true);FR.length&&0;mark('art');await AR.pg.goto(B+'assets/README.md');await AR.ev(()=>localStorage.clear());await AR.go('?play&mute&novideo&slot=1&class=knight&stage=ramparts');// art ON by default
const ART=await AR.ev(async()=>{const s=S(),sv=s.sv,P=s.player,o={};clear();for(const k of Object.keys(sv.stats))sv.stats[k]=Math.max(sv.stats[k],30);s.applyBuild(true);
 window.dummy=(dx=40)=>{const e=s.spawnEnemy('acolyte',P.x+dx,150);e.hp=999;e.temp=1;e.cd=99;e.state='idle';e.b.setPosition(P.x+dx,149);e.b.setVelocity(0,0);e.b.body.moves=false;return e};
 window.equip=(id,slot='main')=>{if(!sv.inv.includes(id))sv.inv.push(id);sv.eq[slot]=id;s.applyBuild(false);P.st=P.stMax;P.fp=P.fpMax};const sl=ms=>new Promise(r=>setTimeout(r,ms));
 const act=async(x,ms)=>{let n=0;window.__inp=()=>(n++===0?x:{});await sl(ms);window.__inp=()=>({})};tp(400);
 o.manifest=!!ARS.ART;const ids=[...Object.keys(ARS.MELEE),...Object.keys(ARS.GUNS),...Object.keys(ARS.RANGED),'dagger','spear','axe','staff','bow'];o.missing=ids.filter(i=>!s.textures.exists('arsw_'+i)).concat(Object.keys(ARS.SHIELDS).filter(i=>!s.textures.exists('arss_'+i)),Object.keys(ARS.THROWN).filter(i=>!s.textures.exists('arst_'+i)));
 const R=s.pxc.rig;o.bowArt=null;o.melee={};for(const id of['katana','whip','scythe','dagger','axe']){equip(id);P.f=1;await act({atkP:1},700);o.melee[id]=!!(R.arsW&&R.arsW.texture.key==='arsw_'+id)}
 o.gunFrames=[];for(const id of['flintlock','blunderbuss','handcannon','runepistol','lightxbow','longbow','bow']){equip(id);sv.ammo=9;delete sv.gmag[id];s.ars.reload=0;P.f=1;P.state='idle';dummy(60);let n=0;window.__inp=()=>(n++===0?{atkP:1}:{});
  for(let i=0;i<25;i++){await sl(30);o.gunFrames.push(+R.base.frame.name)}window.__inp=()=>({});await sl(900);for(const e of s.enemies)if(e.temp){e.dead=true;e.b.body.enable=false}}
 o.runeMuzzle=s.stats.arsMuzzle;o.edge=s.stats.arsEdgeSync||0;o.rim=s.stats.arsRim||0;o.badFrames=o.gunFrames.filter(f=>f>=16&&f<24).length;o.fx=s.stats.arsFxArt||0;
 equip('flintlock');sv.ammo=5;sv.gmag.flintlock=0;s.gunReload('flintlock');await sl(150);o.reloadOverlay=R.arsW&&R.arsW.texture.key;await sl(1500);
 equip('longsword');equip('towershield','off');window.__inp=()=>({guard:1});await sl(400);o.guardArt=R.arsS&&R.arsS.visible&&R.arsS.texture.key;window.__inp=()=>({});
 sv.thr={firebomb:3};sv.eq.q2='firebomb';P.f=1;dummy(95);await act({throwP:1},250);o.spin=(s.arsSpr&&s.arsSpr.size)||0;await sl(1200);
 const g=s.add.graphics();o.icon=WEAPART.icon(s,g,'blunderbuss',0,0,24);g.destroy();return o});
await AR.shot('ars11_art_on');mark('art',1);await AR.ctx.close();
ok('art_on_by_default_loads_artist_manifest',ART.manifest&&!ART.missing.length&&Object.values(ART.melee).every(Boolean)&&ART.badFrames===0&&ART.edge>0&&ART.rim>0&&ART.runeMuzzle==='muzzle_rune'&&ART.fx>0&&ART.reloadOverlay==='arsfx_gun_reload'&&ART.guardArt==='arsg_towershield'&&ART.spin>0&&ART.icon===true,{...ART,gunFrames:undefined});
ok('no_errors',errs.length===0,errs);
const clip=(out,a,b)=>{let s='';for(let i=a;i<b;i++)s+=`file '${VD}/${String(i).padStart(5,'0')}.jpg'\nduration ${Math.min(.5,((FR[i+1]||FR[i]+100)-FR[i])/1000).toFixed(3)}\n`;fs.writeFileSync(VD+'/l.txt',s);
 execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i ${VD}/l.txt -vf "scale=640:360,fps=30" -c:v libx264 -pix_fmt yuv420p -crf 27 ${out}`)};
try{clip('clips/arsenal.mp4',0,FR.length);for(const[k,[a,b]]of Object.entries(MARK))if(b>a)clip(`clips/arsenal_${k}.mp4`,a,b);console.error('clips ok')}catch(e){console.error('clip fail',e.message)}
console.log(JSON.stringify({pass,fail}));process.exit(fail?1:0);
