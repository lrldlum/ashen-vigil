// Headless checks for milestone I: THE DROWNED CRYPT — water volumes + swimming (buoyancy, stroke/dive, breath + drowning, leaping out), branching
// high/low (swim) routes, secrets, chests + mimics + a sunken chest, lore, the SISTER SIGILS order puzzle (wrong order resets; solving it unseals
// the cage and drains the cistern), the Tidebound Abbess (cinematic, 3 phases, tide waves, homing bubbles, geysers, deluge, loft, the tide floods
// the arena in phase 3), her ABBESS'S TIDE-CROOK (special balanced vs FROSTBRAND), story ties (Drowned Well opens after the Smith, keeper,
// endings) and co-op (host-authoritative sigils incl. resets, chests, mimic, boss, tide, signature for both).
// usage: node test/I.mjs   (server on :8171). Writes screenshots/I/after/*.png and clips/I.mp4
import { chromium } from 'playwright';import {execSync} from 'child_process';import fs from 'fs';
const B='http://127.0.0.1:8171/',SH='screenshots/I/after/';
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const errs=[],ext=new Set();let pass=0,fail=0;const ok=(n,c,v)=>{c?pass++:fail++;console.error((c?'PASS ':'FAIL ')+n+' '+JSON.stringify(v).slice(0,500))};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const VD='/tmp/ivid';fs.rmSync(VD,{recursive:true,force:true});const FR=[];
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
// ---------- 1. the tide-crook special, balanced against FROSTBRAND (same build, same target), and fired by a real heavy
await go('?play&mute&slot=3&class=knight&stage=ramparts');
const iso=await ev(async W=>{const s=S(),P=s.player,o={};clear();for(const w of W){const r=[];for(let k=0;k<3;k++){s.pb.setPosition(400,148);s.pb.setVelocity(0,0);P.f=1;P.fp=99;await new Promise(q=>setTimeout(q,250));
  const e=s.spawnEnemy('acolyte',430,156);e.hp=999;e.temp=1;e.cd=99;e.state='idle';await new Promise(q=>setTimeout(q,150));const h=e.hp;s.weaponSpecial(WEAPONS[w]);await new Promise(q=>setTimeout(q,800));r.push(h-e.hp);e.dead=true;e.b.body.enable=false}
  o[w]=+(r.reduce((a,b)=>a+b,0)/r.length).toFixed(2)}return o},['frostbrand','tidecrook','ashmaul']);
ok('tidecrook_special_balanced_vs_frostbrand',iso.frostbrand>0&&iso.tidecrook>=iso.frostbrand*.7&&iso.tidecrook<=iso.frostbrand*1.3,iso);
const realF=async()=>{const s=S(),P=s.player;if(!s.sv.inv.includes('tidecrook'))s.sv.inv.push('tidecrook');s.menu={mode:'equip',sel:0,t:1,prev:{}};for(let i=0;i<40&&s.sv.eq.main!=='tidecrook';i++)s.menuKey('right');s.menu=null;
  s.pb.setPosition(400,148);s.pb.setVelocity(0,0);await new Promise(q=>setTimeout(q,300));P.st=999;P.fp=P.fpMax=99;P.state='idle';P.f=1;s.stats.specials=0;const e=s.spawnEnemy('acolyte',430,156);e.hp=999;e.temp=1;e.cd=99;e.state='idle';e.kbImmune=1;if(e.b.body)e.b.body.moves=false;await new Promise(q=>setTimeout(q,200));const h=e.hp;
  let n=0;window.__inp=()=>(n++===0?{heavyP:1}:{});await new Promise(q=>setTimeout(q,1500));window.__inp=()=>({});const o={eq:s.sv.eq.main,sp:s.stats.specials,dmg:+(h-e.hp).toFixed(2),name:WEAPONS.tidecrook.name};e.dead=true;e.b.body.enable=false;return o};let real=await ev(realF);for(let k=0;k<2&&!(real.eq==='tidecrook'&&real.sp===1&&real.dmg>=iso.tidecrook);k++)real=await ev(realF);
ok('tidecrook_heavy_fires_its_special',real.eq==='tidecrook'&&real.sp===1&&real.dmg>=iso.tidecrook,real);
// ---------- 2. stage data
await go('?play&mute&slot=1&class=knight&stage=drowned');
const D=await ev(()=>{const d=STAGE_DEFS.drowned;return{name:d.name,side:d.side,water:d.water.length,drain:d.water.filter(w=>w.drain).length,sigils:d.bells.length,kind:d.bellKind,order:d.bellOrder,ch:CHESTS.drowned.length,hidden:CHESTS.drowned.filter(c=>c.hidden).length,
 mimic:CHESTS.drowned.filter(c=>c.mimic).length,sunk:CHESTS.drowned.filter(c=>c.sunk).length,lock:d.cages.filter(c=>c.lock==='dw_sigils').length,covers:d.covers.length,lore:d.lore.map(l=>l.id),high:d.oneway.filter(r=>r[1]===-60).length,
 boss:d.boss.kind,phases:d.boss.phases.length+1,sig:SIGNATURE.abbess,desc:!!(DESC.tidecrook&&DESC.tidecrook.length>=2),lorex:['w1','w2','w3'].every(i=>LORE[i]),hint:/GANTRY.*CRYPT.*NAVE.*COURT/.test(LORE.w2.join(' '))}});
ok('drowned_stage_defined',D.name==='THE DROWNED CRYPT'&&D.side&&D.water>=3&&D.drain===1&&D.sigils===4&&D.kind==='sigil'&&D.order.length===4&&D.ch>=6&&D.hidden>=2&&D.mimic>=2&&D.sunk===1&&D.lock===1&&D.covers>=3&&D.high>=3&&D.boss==='abbess'&&D.phases===3&&D.sig==='tidecrook'&&D.desc&&D.lorex&&D.hint,D);
await shot('i01_drowned_crypt_start');
// ---------- 3. swimming with real input: buoyancy, dive, breath, drowning, stroke up and leap out onto the ledge
await ev(()=>{clear();tp(520,260);S().player.hp=S().player.hpMax=200});await wait(300);
const sw0=await ev(()=>({swim:S().player.swim,grav:S().pb.body.allowGravity,y:S().player.y}));await ev(()=>idle());await wait(1200);const sw1=await ev(()=>S().player.y);
await ev(()=>hold({dn:1},90));await wait(1500);const sw2=await ev(()=>({y:S().player.y,air:S().player.air}));await shot('i02_swimming_underwater');
ok('swim_buoyancy_and_dive',sw0.swim&&!sw0.grav&&sw1<sw0.y-5&&sw2.y>sw1+10&&sw2.air<11.5,{sw0,sw1,sw2});
await ev(()=>{S().player.air=.3;S().player.inv=0;hold({dn:1},200)});const hp0=await ev(()=>S().player.hp);await wait(2600);const dr=await ev(()=>({hp:S().player.hp,air:S().player.air}));
ok('breath_runs_out_and_drowns',dr.air===0&&dr.hp<hp0,{hp0,dr});
await ev(()=>{S().player.air=12;tp(756,250)});await wait(200);await ev(()=>hold({jump:1,up:1},150));await wait(2600);
const out=await ev(()=>({y:Math.round(S().player.y),swim:S().player.swim,leaps:S().stats.leaps||0}));await ev(()=>idle());await shot('i03_leapt_out_of_water');
ok('stroke_up_and_leap_out_of_water',out.y<=157&&!out.swim&&out.leaps>=1,out);
// ---------- 4. routes: high gantry by chain, low road through the flooded nave (swim)
await ev(()=>{clear();tp(1003)});await wait(500);await ev(()=>hold({up:1},260));await wait(4200);await ev(()=>hold({up:1,r:1},40));await wait(1200);
const hi=await ev(()=>Math.round(S().player.y));await ev(()=>idle());ok('high_route_gantry_by_chain',hi<=-56&&hi>-70,{hi});
await ev(()=>tp(1150,280));await wait(500);const lo=await ev(()=>({swim:S().player.swim,y:Math.round(S().player.y)}));ok('low_route_flooded_nave_swim',lo.swim&&lo.y>200,lo);
// ---------- 5. sunken chest + the sigil order puzzle
await ev(()=>{clear();tp(2500,196)});await wait(600);await ev(()=>press('restP'));await wait(600);const sunk0=await ev(()=>S().chests.find(c=>c.id==='ch_w5').st);
const strike=async id=>{const b=await ev(id=>{const b=S().bells.find(q=>q.id===id);return{x:b.x,y:b.y}},id);await ev(b=>{clear();tp(b.x-10,b.y);S().player.f=1;S().player.st=999},b);await wait(250);await ev(()=>press('atkP'));await wait(600);return ev(()=>S().bells.filter(q=>q.rung).map(q=>q.id))};
const w1=await strike('sg_gantry'),w2=await strike('sg_court');// wrong: court is last
const rs=await ev(()=>({n:S().bells.filter(q=>q.rung).length,resets:S().stats.sigilResets||0,sv:S().sv.bells.length}));
ok('sigils_wrong_order_resets',w1.join()==='sg_gantry'&&w2.length===0&&rs.n===0&&rs.resets===1&&rs.sv===0,{w1,w2,rs});
const seq=[];for(const id of ['sg_gantry','sg_crypt','sg_nave','sg_court'])seq.push((await strike(id)).length);await shot('i04_sigils_solved');
const pz=await ev(()=>({locked:S().cages.find(c=>c.id==='dw_sigilcage').locked,chDone:S().sv.chDone.includes('dw_sigils')}));
await ev(()=>tp(2500,140));await wait(3500);const drained=await ev(()=>S().waters.find(w=>w.drain).drained);await shot('i05_cistern_drained');
await ev(()=>{clear();tp(2500,196)});await wait(600);await ev(()=>press('restP'));await wait(900);const sunk1=await ev(()=>S().chests.find(c=>c.id==='ch_w5').st);
ok('sigils_in_order_unseal_cage_and_drain_cistern',seq.join()==='1,2,3,4'&&!pz.locked&&pz.chDone&&drained,{seq,pz,drained});
ok('sunken_chest_opens_only_after_drain',sunk0==='shut'&&sunk1==='open',{sunk0,sunk1});
// ---------- 6. chests + mimic + secret loft
await ev(()=>{clear();tp(808)});await wait(500);await ev(()=>press('restP'));await wait(900);const c1=await ev(()=>S().chests.find(c=>c.id==='ch_w1').st);
await ev(()=>tp(1370,-104));await wait(800);const loft=await ev(()=>S().sv.picked.includes('i_wspear'));
await ev(()=>{clear();tp(2688);S().player.hp=S().player.hpMax=999});await wait(500);await ev(()=>{S().player.f=1;press('restP')});await wait(800);const mst=await ev(()=>S().chests.find(c=>c.id==='ch_w6').st);await shot('i06_drowned_mimic');
for(let i=0;i<14;i++){const done=await ev(()=>{const s=S(),c=s.chests.find(c=>c.id==='ch_w6');if(c.st==='dead')return 1;tp(c.hx-20);s.player.f=1;s.player.st=999;press('atkP')});if(done)break;await wait(650)}
const md=await ev(()=>S().chests.find(c=>c.id==='ch_w6').st);
ok('drowned_chests_secret_and_mimic',c1==='open'&&loft&&mst==='awake'&&md==='dead',{c1,loft,mst,md});
await ev(()=>{S().sv.souls=S().souls;Save.write(S().sv)});await go('?play&continue&mute&slot=1');
const per=await ev(()=>({sid:S().sid,w5:S().chests.find(c=>c.id==='ch_w5').st,w6:S().chests.find(c=>c.id==='ch_w6').st,sig:S().bells.filter(b=>b.rung).length,drained:S().waters.find(w=>w.drain).drained}));
ok('drowned_progress_persists',per.sid==='drowned'&&per.w5==='open'&&per.w6==='dead'&&per.sig===4&&per.drained,per);
// ---------- 7. the Tidebound Abbess
await ev(()=>{clear();const s=S();s.player.hp=s.player.hpMax=9999;s.pb.setPosition(3020,140);s.player.inv=999});
await A.pg.waitForFunction(()=>S().cine,null,{timeout:15000}).catch(()=>{});await wait(1300);await shot('i07_abbess_intro_cinematic');const cine=await ev(()=>({c:!!S().cine,kind:S().boss&&S().boss.kind}));
await wait(1000);await shot('i08_abbess_name_card');
await A.pg.waitForFunction(()=>S().bossState==='fight',null,{timeout:15000}).catch(()=>{});await wait(400);
const atk=await ev(async()=>{const s=S(),B=s.boss,o={};const force=async(n,ms=1400)=>{B.state='walk';B.cd=-1;B.y=GY;B.loftCd=99;s.pickLord=()=>n;await new Promise(r=>setTimeout(r,ms))};
  let fl=0;const of=s.flames.push.bind(s.flames);s.flames.push=(...a)=>{fl+=a.filter(f=>f.water).length;return of(...a)};
  let sh=[];const os=s.shots.push.bind(s.shots);s.shots.push=(...a)=>{sh.push(...a.map(q=>({...q})));return os(...a)};
  await force('wave');o.wave1=fl;await force('slam',1300);o.geysers=(s.geysers||[]).length+(o.g0=0);
  B.hp=B.hpMax*.6;await new Promise(r=>setTimeout(r,400));o.p2=B.phase;await new Promise(r=>setTimeout(r,1500));fl=0;await force('wave',1800);o.wave2=fl;sh=[];await force('bubbles');o.bubbles=sh.filter(q=>q.c==='water'&&q.home).length;
  B.loftCd=-1;B.cd=-1;delete s.pickLord;B.state='walk';await new Promise(r=>setTimeout(r,1200));o.loft=B.state==='glide'||B.state==='perch'||B.y<GY;await new Promise(r=>setTimeout(r,1000));
  B.hp=B.hpMax*.3;await new Promise(r=>setTimeout(r,400));o.p3=B.phase;await new Promise(r=>setTimeout(r,1500));sh=[];await force('deluge',1500);o.deluge=sh.filter(q=>q.c==='water'&&q.delay>0).length;
  await new Promise(r=>setTimeout(r,1500));o.tide=Math.round(s.tideY??999);s.pb.setPosition(3060,140);await new Promise(r=>setTimeout(r,400));o.swimInTide=!!s.player.swim;
  s.flames.push=of;s.shots.push=os;delete s.pickLord;return o});
await shot('i09_abbess_tide_phase3');
ok('abbess_cinematic_and_three_phases',cine.c&&cine.kind==='abbess'&&atk.p2===2&&atk.p3===3,{cine,atk});
ok('abbess_attacks_wave_geysers_bubbles_loft_deluge',atk.wave1>=2&&atk.wave2>=4&&atk.geysers>=1&&atk.bubbles>=5&&atk.loft&&atk.deluge>=5,atk);
ok('phase3_tide_floods_arena_player_swims',atk.tide<=136&&atk.swimInTide,atk);
await ev(()=>{const s=S();s.boss.hp=1;s.damageBoss(5)});await A.pg.waitForFunction(()=>S().victory,null,{timeout:40000}).catch(()=>{});await wait(1200);await shot('i10_abbess_slain_crook');
const vic=await ev(()=>({lords:S().sv.lords,inv:S().sv.inv.includes('tidecrook'),opts:S().victoryOpts(),hub:S().sv.hubNext}));
ok('abbess_drops_signature_tidecrook',vic.lords.includes('abbess')&&vic.inv,vic);
await ev(()=>{S().victory.t=2;S().victory.sel=0;S().victoryGo()});await A.pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage').sid==='shrine'&&__G.scene.getScene('stage').player,null,{timeout:12000}).catch(()=>{});await wait(900);
const back=await ev(()=>({sid:S().sid,hub:S().sv.hubNext}));ok('drowned_returns_to_shrine',vic.opts[0]==='RETURN TO THE ASH SHRINE'&&back.sid==='shrine'&&back.hub===vic.hub,{opts:vic.opts,back});
// ---------- 8. story ties: Drowned Well (sealed until the Smith), keeper, ending
const keeper=await ev(()=>{const s=S(),sv=s.sv,keep=[...sv.lords],o={};sv.lords=['warden','cantor','toller'];o.sealed=s.keeperLines().join(' ');sv.lords=['warden','cantor','toller','smith'];o.open=s.keeperLines().join(' ');sv.lords=keep;o.slain=s.keeperLines().join(' ');return o});
ok('keeper_speaks_of_the_drowned_crypt',/STILL SINGS MY NOVICE NAME/.test(keeper.sealed)&&/ABBESS WAITS IN THE DROWNED CRYPT/.test(keeper.open)&&/NO ONE CALLS MY OLD NAME/.test(keeper.slain),keeper);
const keep=await ev(()=>[...S().sv.lords]);
await ev(()=>{const s=S();s.sv.lords=['warden','cantor','toller'];tp(STAGE_DEFS.shrine.well.x);idle()});await wait(500);await shot('i11_drowned_well_sealed');await ev(()=>press('restP'));await wait(900);const sealed=await ev(()=>S().sid);
await ev(k=>{S().sv.lords=[...new Set([...k,'warden','cantor','toller','smith'])]},keep);await wait(300);await shot('i12_drowned_well_open');await ev(()=>press('restP'));
await A.pg.waitForFunction(()=>__G.scene.getScene('stage').sid==='drowned'&&__G.scene.getScene('stage').player,null,{timeout:12000}).catch(()=>{});await wait(600);
const opened=await ev(()=>({sid:S().sid,bossDead:S().bossState==='dead'}));
ok('drowned_well_sealed_then_opens_after_smith',sealed==='shrine'&&opened.sid==='drowned'&&opened.bossDead,{sealed,opened});
await A.pg.goto(B+'?mute&slot=1&ending=rekindle');await wait(9000);const endL=await ev(()=>__G.scene.getScene('ending').lines);await shot('i13_ending_crypt_line');
ok('ending_mentions_the_drowned_crypt',endL.some(s=>/DROWNED CRYPT, THE WATER WARMED/.test(s)),endL);
await A.ctx.close();
// ---------- 9. co-op in the drowned crypt
const H=await mk(false);await H.pg.goto(B+'assets/README.md');await H.ev(()=>localStorage.clear());await H.go('?host&mute&stage=drowned&class=knight');
await H.pg.waitForFunction(()=>NET.peer&&NET.peer.open,null,{timeout:20000}).catch(()=>{});const code=await H.ev(()=>NET.code);pages[await H.ev(()=>NET.peer.id)]=H.pg;
const G=await mk(false);await G.pg.goto(B+'assets/README.md');await G.ev(()=>localStorage.clear());await G.pg.goto(B+'?mute&class=pyromancer&join='+code);
await G.pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await wait(1500);
await G.ev(()=>{window.S=()=>__G.scene.getScene('stage');window.tp=(x,y=156)=>{const s=S();s.pb.setPosition(x,y-8);s.pb.setVelocity(0,0);s.player.inv=99;s.camY=s.camTY=y-156};window.press=k=>{let n=0;window.__inp=()=>(n++===0?{[k]:1}:{})}});
ok('coop_linked_in_drowned_crypt',await G.ev(()=>NET.linked()&&S().sid)==='drowned',{});
await H.ev(()=>{clear();tp(1000)});
const gs=async id=>{const b=await G.ev(id=>{const b=S().bells.find(q=>q.id===id);return{x:b.x,y:b.y}},id);await G.ev(b=>{tp(b.x-10,b.y);S().player.f=1;S().player.st=999},b);await wait(300);await G.ev(()=>press('atkP'));await wait(1200)};
await gs('sg_gantry');const r1=[await H.ev(()=>S().bells.filter(b=>b.rung).length),await G.ev(()=>S().bells.filter(b=>b.rung).length)];
await gs('sg_nave');const r2=[await H.ev(()=>S().bells.filter(b=>b.rung).length),await G.ev(()=>S().bells.filter(b=>b.rung).length)];
ok('coop_sigil_puzzle_host_authoritative_incl_reset',r1.join()==='1,1'&&r2.join()==='0,0',{r1,r2});
await G.ev(()=>tp(520,270));await wait(500);const gsw=await G.ev(()=>S().player.swim);await G.shot('i14_coop_guest_swimming');ok('coop_guest_swims',!!gsw,{gsw});
await G.ev(()=>tp(808));await wait(400);await G.ev(()=>press('restP'));await wait(1200);
const cc=[await H.ev(()=>S().chests.find(c=>c.id==='ch_w1').st),await G.ev(()=>S().chests.find(c=>c.id==='ch_w1').st)];ok('coop_chest_synced',cc.every(s=>s==='open'),{cc});
await G.ev(()=>tp(2688));await H.ev(()=>tp(2620));await wait(400);await G.ev(()=>press('restP'));await wait(1500);
const mm=[await H.ev(()=>S().chests.find(c=>c.id==='ch_w6').st),await G.ev(()=>S().chests.find(c=>c.id==='ch_w6').st)];
for(let i=0;i<14;i++){const d=await G.ev(()=>{const s=S(),c=s.chests.find(c=>c.id==='ch_w6');if(c.st==='dead')return 1;tp(c.hx-20);s.player.f=1;s.player.st=999;s.player.hp=s.player.hpMax;press('atkP')});if(d)break;await wait(650)}await wait(800);
const mk2=[await H.ev(()=>S().chests.find(c=>c.id==='ch_w6').st),await G.ev(()=>S().chests.find(c=>c.id==='ch_w6').st)];
ok('coop_drowned_mimic_mirrored',mm.every(s=>s==='awake')&&mk2.every(s=>s==='dead'),{mm,mk2});
await H.ev(()=>{clear();const s=S();s.player.hp=s.player.hpMax=9999;s.pb.setPosition(3020,140)});await G.ev(()=>{S().player.hp=S().player.hpMax=9999;S().pb.setPosition(2990,140)});
await H.pg.waitForFunction(()=>S().bossState==='fight',null,{timeout:15000}).catch(()=>{});await wait(600);
await H.ev(()=>{const s=S(),B=s.boss;B.state='walk';B.cd=-1;s.pickLord=()=>'wave'});await wait(1100);
const gb=await G.ev(()=>({kind:S().boss&&S().boss.kind,fl:S().flames.filter(f=>f.water).length}));await H.ev(()=>{delete S().pickLord;S().boss.hp=S().boss.hpMax*.3});await wait(4000);
const gt=await G.ev(()=>({phase:S().boss&&S().boss.phase,tide:Math.round(S().tideY??999)}));await G.shot('i15_coop_guest_tide');
ok('coop_guest_sees_abbess_waves_and_tide',gb.kind==='abbess'&&gb.fl>=1&&gt.phase===3&&gt.tide<150,{gb,gt});
await H.ev(()=>{const s=S();if(s.boss){s.boss.state='walk';s.boss.hp=1;s.damageBoss(5)}});await wait(2500);
const sg=[await H.ev(()=>S().sv.inv.includes('tidecrook')),await G.ev(()=>S().sv.inv.includes('tidecrook'))];ok('coop_both_players_get_tidecrook',sg.every(Boolean),{sg});
await H.ctx.close();await G.ctx.close();
ok('no_errors',errs.length===0,errs);ok('only_peer_broker_traffic',[...ext].every(h=>/peerjs/.test(h)),[...ext]);
await br.close();
try{let s='';FR.forEach((t,i)=>{s+=`file '${VD}/${String(i).padStart(5,'0')}.jpg'\nduration ${Math.min(.5,((FR[i+1]||t+100)-t)/1000).toFixed(3)}\n`});fs.writeFileSync(VD+'/l.txt',s);
 execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i ${VD}/l.txt -vf "scale=640:360,fps=30" -t 45 -c:v libx264 -pix_fmt yuv420p -crf 27 clips/I.mp4`);console.error('clip ok')}catch(e){console.error('clip fail',e.message)}
console.log(JSON.stringify({pass,fail}));process.exit(fail?1:0);
