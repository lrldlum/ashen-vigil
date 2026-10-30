// Headless checks for milestone L: THE BLIGHTED CLOISTER — poison spore clouds (pulsing; can't kill, build blight), thorn brakes, overgrown vines,
// branching high/low routes, secrets, chests + mimics, lore, four blighted blooms cut back (collectible) unseal the reliquary cage,
// the Thorned Prioress (cinematic, 3 phases, vine lashes, bramble eruptions, rot spores, loft, phase-3 rot rolling across the arena), her
// PRIORESS'S THORNBRAND (special balanced vs FROSTBRAND), story ties (Overgrown Arch after the Astronomer, keeper, ending) and co-op.
// usage: node test/L.mjs   (server on :8171). Writes screenshots/L/after/*.png and clips/L.mp4
import { chromium } from 'playwright';import {execSync} from 'child_process';import fs from 'fs';
const B='http://127.0.0.1:8171/',SH='screenshots/L/after/';
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const errs=[],ext=new Set();let pass=0,fail=0;const ok=(n,c,v)=>{c?pass++:fail++;console.error((c?'PASS ':'FAIL ')+n+' '+JSON.stringify(v).slice(0,500))};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const VD='/tmp/lvid';fs.rmSync(VD,{recursive:true,force:true});const FR=[];
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
 const go=async q=>{await pg.goto(B+q);await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await wait(700);
  await ev(()=>{window.S=()=>__G.scene.getScene('stage');window.idle=()=>{window.__inp=()=>({})};window.press=k=>{let n=0;window.__inp=()=>(n++===0?{[k]:1}:{})};window.hold=(o,n)=>{let i=0;window.__inp=()=>(i++<n?o:{})};
   window.tp=(x,y=156)=>{const s=S();s.pb.setPosition(x,y-8);s.pb.setVelocity(0,0);s.player.state='idle';s.player.inv=99;s.camY=s.camTY=y-156};
   window.clear=()=>{const s=S();s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false})};
   window.until=(f,ms)=>new Promise(r=>{const t0=performance.now(),g=()=>{if(f())r(true);else if(performance.now()-t0>ms)r(false);else requestAnimationFrame(g)};g()})})};
 return{ctx,pg,ev,go,shot:n=>pg.screenshot({path:SH+n+'.png'})}};
const A=await mk(true);const{ev,go,shot}=A;
fs.mkdirSync(SH,{recursive:true});
await A.pg.goto(B+'assets/README.md');await ev(()=>localStorage.clear());
// ---------- 1. thornbrand special vs FROSTBRAND, and fired by a real heavy
await go('?play&mute&slot=3&class=knight&stage=ramparts');
const iso=await ev(async W=>{const s=S(),P=s.player,o={};clear();for(const w of W){const r=[];for(let k=0;k<3;k++){s.pb.setPosition(400,148);s.pb.setVelocity(0,0);P.f=1;P.fp=99;await new Promise(q=>setTimeout(q,250));
  const e=s.spawnEnemy('acolyte',430,156);e.hp=999;e.temp=1;e.cd=99;e.state='idle';await new Promise(q=>setTimeout(q,150));const h=e.hp;s.weaponSpecial(WEAPONS[w]);await new Promise(q=>setTimeout(q,800));r.push(h-e.hp);e.dead=true;e.b.body.enable=false}
  o[w]=+(r.reduce((a,b)=>a+b,0)/r.length).toFixed(2)}return o},['frostbrand','thornbrand','starlance']);
ok('thornbrand_special_balanced_vs_frostbrand',iso.frostbrand>0&&iso.thornbrand>=iso.frostbrand*.7&&iso.thornbrand<=iso.frostbrand*1.3,iso);
const realF=async()=>{const s=S(),P=s.player;if(!s.sv.inv.includes('thornbrand'))s.sv.inv.push('thornbrand');s.menu={mode:'equip',sel:0,t:1,prev:{}};for(let i=0;i<40&&s.sv.eq.main!=='thornbrand';i++)s.menuKey('right');s.menu=null;
  s.pb.setPosition(400,148);s.pb.setVelocity(0,0);await new Promise(q=>setTimeout(q,300));P.st=999;P.fp=P.fpMax=99;P.state='idle';P.f=1;s.stats.specials=0;const e=s.spawnEnemy('acolyte',430,156);e.hp=999;e.temp=1;e.cd=99;e.state='idle';e.kbImmune=1;if(e.b.body)e.b.body.moves=false;await new Promise(q=>setTimeout(q,200));const h=e.hp;
  let n=0;window.__inp=()=>(n++===0?{heavyP:1}:{});await new Promise(q=>setTimeout(q,1500));window.__inp=()=>({});const o={eq:s.sv.eq.main,sp:s.stats.specials,dmg:+(h-e.hp).toFixed(2)};e.dead=true;e.b.body.enable=false;return o};let real=await ev(realF);for(let k=0;k<2&&!(real.eq==='thornbrand'&&real.sp===1&&real.dmg>=iso.thornbrand);k++)real=await ev(realF);
ok('thornbrand_heavy_fires_its_special',real.eq==='thornbrand'&&real.sp===1&&real.dmg>=iso.thornbrand,real);
// ---------- 2. stage data
await go('?play&mute&slot=1&class=knight&stage=cloister');
const D=await ev(()=>{const d=STAGE_DEFS.cloister;return{name:d.name,side:d.side,spores:d.spores.length,thorns:d.thorns.length,mas:d.vines.length,bal:d.bells.length,kind:d.bellKind,ch:CHESTS.cloister.length,hidden:CHESTS.cloister.filter(c=>c.hidden).length,
 mimic:CHESTS.cloister.filter(c=>c.mimic).length,lock:d.cages.filter(c=>c.lock==='cl_blooms').length,lore:['g1','g2','g3'].every(i=>LORE[i]),high:d.oneway.filter(r=>r[1]===-60).length,
 boss:d.boss.kind,phases:d.boss.phases.length+1,sig:SIGNATURE.prioress,desc:!!(DESC.thornbrand&&DESC.thornbrand.length>=2),hint:/BLOOM/.test(LORE.g2.join(' '))}});
ok('cloister_stage_defined',D.name==='THE BLIGHTED CLOISTER'&&D.side&&D.spores>=2&&D.thorns>=2&&D.mas>=3&&D.bal===4&&D.kind==='bloom'&&D.ch>=6&&D.hidden>=2&&D.mimic>=2&&D.lock===1&&D.high>=2&&D.boss==='prioress'&&D.phases===3&&D.sig==='thornbrand'&&D.desc&&D.lore&&D.hint,D);
await shot('l01_cloister_start');
// ---------- 3. thorn brakes on the walks hurt and bounce you
await ev(()=>{clear();const s=S(),th=STAGE_DEFS.cloister.thorns[0];s.player.hp=s.player.hpMax=999;s.stats.thorned=0;tp(th[0]+14);s.player.inv=0});await wait(500);
const th=await ev(()=>({n:S().stats.thorned,hp:S().player.hp}));await shot('l02_thorn_brake');ok('thorn_brakes_hurt',th.n>=1&&th.hp<999,th);
// ---------- 4. routes: high battlement by chain, low crypt
await ev(()=>{clear();tp(1003)});await wait(500);await ev(()=>hold({up:1},260));await wait(4200);await ev(()=>hold({up:1,r:1},40));await wait(1200);
const hi=await ev(()=>Math.round(S().player.y));await ev(()=>idle());ok('high_route_gallery_by_chain',hi<=-56&&hi>-70,{hi});
await ev(()=>tp(470,300));await wait(500);const lo=await ev(()=>Math.round(S().player.y));ok('low_route_cloister_crypt',lo>250,{lo});
// ---------- 5. spore clouds poison only while blooming (and never kill)
const z0=await ev(()=>STAGE_DEFS.cloister.spores[0]);
const sp=await ev(async z=>{const s=S();clear();s.player.hp=s.player.hpMax=200;await until(()=>((s.t+(z.off||0))%z.period)<.2,9000);s.stats.poisoned=0;tp((z.r[0]+z.r[2])/2);idle();const h0=s.player.hp;await new Promise(r=>setTimeout(r,1500));
  const on={hp:Math.round(s.player.hp),h0,bl:+(s.player.blight||0).toFixed(2),p:s.stats.poisoned};await until(()=>((s.t+(z.off||0))%z.period)>z.period*.5+.2,9000);const h1=s.player.hp;await new Promise(r=>setTimeout(r,1000));
  const off={dh:+(h1-s.player.hp).toFixed(2)};s.player.hp=1.5;await until(()=>((s.t+(z.off||0))%z.period)<.2,9000);await new Promise(r=>setTimeout(r,1500));return{on,off,low:s.player.hp,dead:s.player.dead}},z0);
await shot('l03_spore_cloud');ok('spores_poison_while_blooming_but_never_kill',sp.on.hp<sp.on.h0-3&&sp.on.bl>0&&sp.on.p>0&&sp.off.dh<.5&&sp.low>=1&&!sp.dead,sp);
const vn=await ev(()=>STAGE_DEFS.cloister.vines.length);await ev(()=>{clear();tp(1003,156)});await wait(300);await shot('l04_vines_overgrowth');ok('vines_overgrow_the_chains',vn>=3,{vn});
// ---------- 6. cutting back the four blighted blooms unseals the reliquary cage
const wreck=async id=>{const b=await ev(id=>{const b=S().bells.find(q=>q.id===id);return{x:b.x,y:b.y}},id);for(let i=0;i<4;i++){await ev(b=>{clear();tp(b.x-10,b.y);S().player.f=1;S().player.st=999;S().player.hp=S().player.hpMax=999},b);await wait(250);await ev(()=>press('atkP'));await wait(600);if(await ev(id=>S().bells.find(q=>q.id===id).rung,id))break}};
for(const id of ['bl1','bl2','bl3'])await wreck(id);const w3=await ev(()=>({n:S().bells.filter(q=>q.rung).length,cage:S().sv.chDone.includes('cl_blooms')}));
await wreck('bl4');await wait(500);const w4=await ev(()=>({n:S().bells.filter(q=>q.rung).length,cage:S().sv.chDone.includes('cl_blooms'),locked:S().cages.find(c=>c.id==='cl_reliquary').locked}));await shot('l05_blooms_cut');
ok('four_blooms_cut_unseal_reliquary_cage',w3.n===3&&!w3.cage&&w4.n===4&&w4.cage&&!w4.locked,{w3,w4});
// ---------- 7. chests, hidden loft, mimic, persistence
await ev(()=>{clear();tp(808)});await wait(300);await ev(()=>press('restP'));await wait(900);const c1=await ev(()=>S().chests.find(c=>c.id==='ch_c1').st);
const loft=await ev(()=>!!S().chests.find(c=>c.id==='ch_c2'&&c.hidden));
await ev(()=>{clear();tp(2688);S().player.hp=S().player.hpMax=999});await wait(400);await ev(()=>press('restP'));await wait(1500);const mst=await ev(()=>S().chests.find(c=>c.id==='ch_c6').st);await shot('l06_cloister_mimic');
for(let i=0;i<16;i++){const done=await ev(()=>{const s=S(),c=s.chests.find(c=>c.id==='ch_c6');if(c.st==='dead')return 1;tp(c.hx-20);s.player.f=1;s.player.st=999;press('atkP')});if(done)break;await wait(650)}
const md=await ev(()=>S().chests.find(c=>c.id==='ch_c6').st);
ok('cloister_chests_secret_and_mimic',c1==='open'&&loft&&mst==='awake'&&md==='dead',{c1,loft,mst,md});
await ev(()=>{S().sv.souls=S().souls;Save.write(S().sv)});await go('?play&continue&mute&slot=1');
const per=await ev(()=>({sid:S().sid,k1:S().chests.find(c=>c.id==='ch_c1').st,k6:S().chests.find(c=>c.id==='ch_c6').st,bal:S().bells.filter(b=>b.rung).length,cage:S().sv.chDone.includes('cl_blooms')}));
ok('cloister_progress_persists',per.sid==='cloister'&&per.k1==='open'&&per.k6==='dead'&&per.bal===4&&per.cage,per);
// ---------- 8. the Thorned Prioress
await ev(()=>{clear();const s=S();s.player.hp=s.player.hpMax=9999;s.pb.setPosition(3020,140);s.player.inv=999});
await A.pg.waitForFunction(()=>S().cine,null,{timeout:15000}).catch(()=>{});await wait(1300);await shot('l07_prioress_intro_cinematic');const cine=await ev(()=>({c:!!S().cine,kind:S().boss&&S().boss.kind}));
await wait(1000);await shot('l08_prioress_name_card');
await A.pg.waitForFunction(()=>S().bossState==='fight',null,{timeout:15000}).catch(()=>{});await wait(400);
const atk=await ev(async()=>{const s=S(),B=s.boss,o={};const force=async(n,ms=1400)=>{B.state='walk';B.cd=-1;B.y=GY;B.loftCd=99;s.pickLord=()=>n;await new Promise(r=>setTimeout(r,ms))};
  let sh=[];const os=s.shots.push.bind(s.shots);s.shots.push=(...a)=>{sh.push(...a.map(q=>({...q})));return os(...a)};
  await force('lash',1800);o.lash=sh.filter(q=>q.c==='thorn').length;
  B.hp=B.hpMax*.6;await new Promise(r=>setTimeout(r,400));o.p2=B.phase;await new Promise(r=>setTimeout(r,1500));sh=[];await force('bramble',1600);o.bramble=sh.filter(q=>q.c==='thorn'&&q.vy<0).length;
  B.loftCd=-1;B.cd=-1;delete s.pickLord;B.state='walk';await new Promise(r=>setTimeout(r,1200));o.loft=B.state==='glide'||B.state==='perch'||B.y<GY;await new Promise(r=>setTimeout(r,1000));
  B.hp=B.hpMax*.3;await new Promise(r=>setTimeout(r,400));o.p3=B.phase;await new Promise(r=>setTimeout(r,1500));sh=[];await force('rot',1500);o.rot=sh.filter(q=>q.c==='spore'&&q.delay>0).length;
  s.shots.push=os;delete s.pickLord;B.state='walk';B.cd=99;s.stats.poisoned=0;const sides=new Set();const t0=performance.now();while(performance.now()-t0<6000){for(const x of[3060,3260]){s.pb.setPosition(x,140);await new Promise(r=>setTimeout(r,250));if(s.sporeAt(s.player.x,s.player.y-8))sides.add(x)}}o.rotSides=[...sides];o.poisoned=s.stats.poisoned;return o});
await shot('l09_prioress_rot_phase3');
ok('prioress_cinematic_and_three_phases',cine.c&&cine.kind==='prioress'&&atk.p2===2&&atk.p3===3,{cine,atk});
ok('prioress_attacks_lash_bramble_loft_rot',atk.lash>=3&&atk.bramble>=5&&atk.loft&&atk.rot>=5,atk);
ok('phase3_rot_rolls_across_the_arena',atk.rotSides.length===2&&atk.poisoned>0,atk);
await ev(()=>{const s=S();s.boss.state='walk';s.boss.hp=1;s.damageBoss(5)});await A.pg.waitForFunction(()=>S().victory,null,{timeout:40000}).catch(()=>{});await wait(1200);await shot('l10_prioress_slain_thornbrand');
const vic=await ev(()=>({lords:S().sv.lords,inv:S().sv.inv.includes('thornbrand'),opts:S().victoryOpts(),hub:S().sv.hubNext}));
ok('prioress_drops_signature_thornbrand',vic.lords.includes('prioress')&&vic.inv,vic);
await ev(()=>{S().victory.t=2;S().victory.sel=0;S().victoryGo()});await A.pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage').sid==='shrine'&&__G.scene.getScene('stage').player,null,{timeout:12000}).catch(()=>{});await wait(900);
const back=await ev(()=>({sid:S().sid}));ok('cloister_returns_to_shrine',vic.opts[0]==='RETURN TO THE ASH SHRINE'&&back.sid==='shrine',{opts:vic.opts,back});
// ---------- 9. story ties
const keeper=await ev(()=>{const s=S(),sv=s.sv,keep=[...sv.lords],o={};sv.lords=['warden','cantor','toller','smith','abbess','marshal'];o.sealed=s.keeperLines().join(' ');sv.lords=['warden','cantor','toller','smith','abbess','marshal','astronomer'];o.open=s.keeperLines().join(' ');sv.lords=keep;o.slain=s.keeperLines().join(' ');return o});
ok('keeper_speaks_of_the_cloister',/PRIORESS PLANTED THORNS/.test(keeper.sealed)&&/THE THORNS HAVE PARTED/.test(keeper.open)&&/THE GARDEN WITHERS/.test(keeper.slain),keeper);
const keep=await ev(()=>[...S().sv.lords]);
await ev(()=>{const s=S();s.sv.lords=['warden','cantor','toller','smith','abbess','marshal'];tp(STAGE_DEFS.shrine.arch.x);idle()});await wait(500);await shot('l11_arch_thorned');await ev(()=>press('restP'));await wait(900);const sealed=await ev(()=>S().sid);
await ev(k=>{S().sv.lords=[...new Set([...k,'warden','cantor','toller','smith','abbess','marshal','astronomer'])]},keep);await wait(300);await shot('l12_arch_open');await ev(()=>press('restP'));
await A.pg.waitForFunction(()=>__G.scene.getScene('stage').sid==='cloister'&&__G.scene.getScene('stage').player,null,{timeout:12000}).catch(()=>{});await wait(600);
const opened=await ev(()=>({sid:S().sid,bossDead:S().bossState==='dead'}));
ok('arch_thorned_then_opens_after_astronomer',sealed==='shrine'&&opened.sid==='cloister'&&opened.bossDead,{sealed,opened});
await A.pg.goto(B+'?mute&slot=1&ending=rekindle');await wait(9000);const endL=await ev(()=>__G.scene.getScene('ending').lines);await shot('l13_ending_cloister_line');
ok('ending_mentions_the_cloister',endL.some(s=>/BLIGHTED CLOISTER, ONE WHITE ROSE/.test(s)),endL);
await A.ctx.close();
// ---------- 10. co-op in the cloister
const H=await mk(false);await H.pg.goto(B+'assets/README.md');await H.ev(()=>localStorage.clear());await H.go('?host&mute&stage=cloister&class=knight');
await H.pg.waitForFunction(()=>NET.peer&&NET.peer.open,null,{timeout:20000}).catch(()=>{});const code=await H.ev(()=>NET.code);pages[await H.ev(()=>NET.peer.id)]=H.pg;
const G=await mk(false);await G.pg.goto(B+'assets/README.md');await G.ev(()=>localStorage.clear());await G.pg.goto(B+'?mute&class=pyromancer&join='+code);
await G.pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await wait(1500);
await G.ev(()=>{window.S=()=>__G.scene.getScene('stage');window.tp=(x,y=156)=>{const s=S();s.pb.setPosition(x,y-8);s.pb.setVelocity(0,0);s.player.inv=99;s.camY=s.camTY=y-156};window.press=k=>{let n=0;window.__inp=()=>(n++===0?{[k]:1}:{})}});
ok('coop_linked_in_cloister',await G.ev(()=>NET.linked()&&S().sid)==='cloister',{});
await H.ev(()=>{clear();tp(300);S().player.hp=S().player.hpMax=9999});
for(let i=0;i<4;i++){await G.ev(()=>{const b=S().bells.find(q=>q.id==='bl1');tp(b.x-10,b.y);S().player.f=1;S().player.st=999;S().player.hp=S().player.hpMax});await wait(300);await G.ev(()=>press('atkP'));await wait(1200);if(await H.ev(()=>S().bells.find(q=>q.id==='bl1').rung))break}
const bw=[await H.ev(()=>S().bells.filter(b=>b.rung).length),await G.ev(()=>S().bells.filter(b=>b.rung).length)];await G.shot('l14_coop_guest_bloom');
ok('coop_bloom_cut_host_authoritative',bw.join()==='1,1',{bw});
await G.ev(()=>tp(808));await wait(400);await G.ev(()=>press('restP'));await wait(1200);
const cc=[await H.ev(()=>S().chests.find(c=>c.id==='ch_c1').st),await G.ev(()=>S().chests.find(c=>c.id==='ch_c1').st)];ok('coop_chest_synced',cc.every(s=>s==='open'),{cc});
await G.ev(()=>tp(2688));await H.ev(()=>tp(2620));await wait(400);await G.ev(()=>press('restP'));await wait(1500);
const mm=[await H.ev(()=>S().chests.find(c=>c.id==='ch_c6').st),await G.ev(()=>S().chests.find(c=>c.id==='ch_c6').st)];
for(let i=0;i<14;i++){const d=await G.ev(()=>{const s=S(),c=s.chests.find(c=>c.id==='ch_c6');if(c.st==='dead')return 1;tp(c.hx-20);s.player.f=1;s.player.st=999;s.player.hp=s.player.hpMax;press('atkP')});if(d)break;await wait(650)}await wait(800);
const mk2=[await H.ev(()=>S().chests.find(c=>c.id==='ch_c6').st),await G.ev(()=>S().chests.find(c=>c.id==='ch_c6').st)];
ok('coop_cloister_mimic_mirrored',mm.every(s=>s==='awake')&&mk2.every(s=>s==='dead'),{mm,mk2});
await H.ev(()=>{clear();const s=S();s.player.hp=s.player.hpMax=9999;s.pb.setPosition(3020,140)});await G.ev(()=>{S().player.hp=S().player.hpMax=9999;S().pb.setPosition(2990,140)});
await H.pg.waitForFunction(()=>S().bossState==='fight',null,{timeout:15000}).catch(()=>{});await wait(600);
await H.ev(()=>{const s=S(),B=s.boss;B.state='walk';B.cd=-1;B.loftCd=99;s.pickLord=()=>'lash'});
const gb=await G.ev(async()=>{let n=0;for(let i=0;i<40;i++){n=Math.max(n,S().shots.filter(q=>q.c==='thorn').length);await new Promise(r=>setTimeout(r,50))}return{kind:S().boss&&S().boss.kind,bolts:n}});await G.shot('l15_coop_guest_prioress_lashes');
await H.ev(()=>{delete S().pickLord});ok('coop_guest_sees_prioress_and_vine_lashes',gb.kind==='prioress'&&gb.bolts>=1,gb);
await H.ev(()=>{const s=S();if(s.boss){s.boss.state='walk';s.boss.hp=1;s.damageBoss(5)}});await wait(2500);
const sg=[await H.ev(()=>S().sv.inv.includes('thornbrand')),await G.ev(()=>S().sv.inv.includes('thornbrand'))];ok('coop_both_players_get_thornbrand',sg.every(Boolean),{sg});
await H.ctx.close();await G.ctx.close();
ok('no_errors',errs.length===0,errs);ok('only_peer_broker_traffic',[...ext].every(h=>/peerjs/.test(h)),[...ext]);
await br.close();
try{let s='';FR.forEach((t,i)=>{s+=`file '${VD}/${String(i).padStart(5,'0')}.jpg'\nduration ${Math.min(.5,((FR[i+1]||t+100)-t)/1000).toFixed(3)}\n`});fs.writeFileSync(VD+'/l.txt',s);
 execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i ${VD}/l.txt -vf "scale=640:360,fps=30" -t 45 -c:v libx264 -pix_fmt yuv420p -crf 27 clips/L.mp4`);console.error('clip ok')}catch(e){console.error('clip fail',e.message)}
console.log(JSON.stringify({pass,fail}));process.exit(fail?1:0);
