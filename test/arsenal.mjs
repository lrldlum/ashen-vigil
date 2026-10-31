// Arsenal checks (arsenal.js): every melee moveset, shields (guard/absorb/parry window/guard break/magic FP), bows + crossbows,
// throwables (knife, fire/frost/storm jars), guns (mag, ammo, reload, recoil, spread, pierce, blast, rune FP + element, DEX scaling,
// smith upgrade, infusion), drops/merchant/save, co-op mirrored shots. usage: node test/arsenal.mjs (server :8171; TMPV=frame dir).
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
await ev(()=>{const s=S(),sv=s.sv;clear();for(const k of Object.keys(sv.stats))sv.stats[k]=Math.max(sv.stats[k],30);s.applyBuild(true);s.player.inv=0;
 window.dummy=(dx=40,hp=999)=>{const P=S().player;const e=S().spawnEnemy('acolyte',P.x+dx,150);e.hp=hp;e.temp=1;e.cd=99;e.state='idle';e.b.setPosition(P.x+dx,149);e.b.setVelocity(0,0);e.b.body.moves=false;return e};// pinned standing on the floor (centre y149)
 window.equip=(id,slot='main')=>{const s=S(),sv=s.sv;if(!sv.inv.includes(id))sv.inv.push(id);sv.eq[slot]=id;s.applyBuild(false);s.player.st=s.player.stMax;s.player.fp=s.player.fpMax};
 window.act=(o,ms)=>new Promise(r=>{let n=0;window.__inp=()=>(n++===0?o:{});setTimeout(()=>{window.__inp=()=>({});r()},ms)});
 window.kill=()=>{for(const e of S().enemies)if(e.temp){e.dead=true;e.b.body.enable=false}};tp(400)});
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
const gb=await ev(()=>window.__gb);await ev(async()=>{equip('towershield','off');window.__inp=()=>({guard:1});S().player.f=1});await wait(300);await shot('ars02_tower_guard');await ev(()=>{window.__inp=()=>({})});mark('shields',1);
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
ok('no_shot_clicks_merchant_and_save',NA.mag===0&&!NA.reload&&MB.ammo===12&&MB.fb===3&&MB.gun&&MB.gone&&MB.souls===3050&&SV.ammo>=12&&SV.fb===3&&SV.mag===1&&SV.gun,{NA,MB,SV});
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
await H.ctx.close();await G.ctx.close();
ok('no_errors',errs.length===0,errs);
const clip=(out,a,b)=>{let s='';for(let i=a;i<b;i++)s+=`file '${VD}/${String(i).padStart(5,'0')}.jpg'\nduration ${Math.min(.5,((FR[i+1]||FR[i]+100)-FR[i])/1000).toFixed(3)}\n`;fs.writeFileSync(VD+'/l.txt',s);
 execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i ${VD}/l.txt -vf "scale=640:360,fps=30" -c:v libx264 -pix_fmt yuv420p -crf 27 ${out}`)};
try{clip('clips/arsenal.mp4',0,FR.length);for(const[k,[a,b]]of Object.entries(MARK))if(b>a)clip(`clips/arsenal_${k}.mp4`,a,b);console.error('clips ok')}catch(e){console.error('clip fail',e.message)}
console.log(JSON.stringify({pass,fail}));process.exit(fail?1:0);
