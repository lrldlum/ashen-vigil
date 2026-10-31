// Headless checks for milestone J: THE RUINED RAMPART KEEP — wind on the battlements, live ballistae (wreck all four to unseal a cage),
// falling masonry, branching high/low routes, secrets, chests + mimics, lore, the Ironclad Castellan (cinematic, 3 phases, volley, gust,
// slam, rubble, loft, phase-3 gale), his CASTELLAN'S HALBERD (special balanced vs FROSTBRAND), story ties (Keep Gate after the Abbess,
// keeper, ending) and co-op (host-authoritative ballistae, chests, mimic, boss, signature for both).
// usage: node test/J.mjs   (server on :8171). Writes screenshots/J/after/*.png and clips/J.mp4
import { chromium } from 'playwright';import {execSync} from 'child_process';import fs from 'fs';
const B='http://127.0.0.1:8171/',SH='screenshots/J/after/';
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const errs=[],ext=new Set();let pass=0,fail=0;const ok=(n,c,v)=>{c?pass++:fail++;console.error((c?'PASS ':'FAIL ')+n+' '+JSON.stringify(v).slice(0,500))};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const VD='/tmp/jvid';fs.rmSync(VD,{recursive:true,force:true});const FR=[];
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
const A=await mk(true);const{ev,go,shot}=A;
fs.mkdirSync(SH,{recursive:true});
await A.pg.goto(B+'assets/README.md');await ev(()=>localStorage.clear());
// ---------- 1. halberd special vs FROSTBRAND, and fired by a real heavy
await go('?play&mute&novideo&slot=3&class=knight&stage=ramparts');
const iso=await ev(async W=>{const s=S(),P=s.player,o={};clear();for(const w of W){const r=[];for(let k=0;k<3;k++){s.pb.setPosition(400,148);s.pb.setVelocity(0,0);P.f=1;P.fp=99;await new Promise(q=>setTimeout(q,250));
  const e=s.spawnEnemy('acolyte',430,156);e.hp=999;e.temp=1;e.cd=99;e.state='idle';await new Promise(q=>setTimeout(q,150));const h=e.hp;(s.player.spCd=0,s).weaponSpecial(WEAPONS[w]);await new Promise(q=>setTimeout(q,800));r.push(h-e.hp);e.dead=true;e.b.body.enable=false}
  o[w]=+(r.reduce((a,b)=>a+b,0)/r.length).toFixed(2)}return o},['frostbrand','halberd','tidecrook']);
ok('halberd_special_beats_earlier_lord_weapons',/*r9: boss weapons climb boss to boss (r8 parity dropped)*/iso.frostbrand>0&&iso.halberd>iso.tidecrook&&iso.halberd<=iso.frostbrand*2.5,iso);
const realF=async()=>{const s=S(),P=s.player;if(!s.sv.inv.includes('halberd'))s.sv.inv.push('halberd');s.menu={mode:'equip',sel:0,t:1,prev:{}};for(let i=0;i<40&&s.sv.eq.main!=='halberd';i++)s.menuKey('right');s.menu=null;
  s.pb.setPosition(400,148);s.pb.setVelocity(0,0);await new Promise(q=>setTimeout(q,300));P.st=999;P.fp=P.fpMax=99;P.spCd=0;P.state='idle';P.f=1;s.stats.specials=0;const e=s.spawnEnemy('acolyte',430,156);e.hp=999;e.temp=1;e.cd=99;e.state='idle';e.kbImmune=1;if(e.b.body)e.b.body.moves=false;await new Promise(q=>setTimeout(q,200));const h=e.hp;
  let n=0;window.__inp=()=>(n++===0?{heavyP:1}:{});await new Promise(q=>setTimeout(q,1500));window.__inp=()=>({});const o={eq:s.sv.eq.main,sp:s.stats.specials,dmg:+(h-e.hp).toFixed(2)};e.dead=true;e.b.body.enable=false;return o};let real=await ev(realF);for(let k=0;k<2&&!(real.eq==='halberd'&&real.sp===1&&real.dmg>=iso.halberd);k++)real=await ev(realF);
ok('halberd_heavy_fires_its_special',real.eq==='halberd'&&real.sp===1&&real.dmg>=iso.halberd,real);
// ---------- 2. stage data
await go('?play&mute&novideo&slot=1&class=knight&stage=keep');
const D=await ev(()=>{const d=STAGE_DEFS.keep;return{name:d.name,side:d.side,wind:d.wind.length,mas:d.masonry.length,bal:d.bells.length,kind:d.bellKind,ch:CHESTS.keep.length,hidden:CHESTS.keep.filter(c=>c.hidden).length,
 mimic:CHESTS.keep.filter(c=>c.mimic).length,lock:d.cages.filter(c=>c.lock==='kp_ballistae').length,lore:['k1','k2','k3'].every(i=>LORE[i]),high:d.oneway.filter(r=>r[1]===-60).length,
 boss:d.boss.kind,phases:d.boss.phases.length+1,sig:SIGNATURE.marshal,desc:!!(DESC.halberd&&DESC.halberd.length>=2),hint:/BALLISTA/.test(LORE.k2.join(' '))}});
ok('keep_stage_defined',D.name==='THE RUINED RAMPART KEEP'&&D.side&&D.wind>=2&&D.mas>=3&&D.bal===4&&D.kind==='ballista'&&D.ch>=6&&D.hidden>=2&&D.mimic>=2&&D.lock===1&&D.high>=2&&D.boss==='marshal'&&D.phases===3&&D.sig==='halberd'&&D.desc&&D.lore&&D.hint,D);
await shot('j01_keep_start');
// ---------- 3. falling masonry
await ev(()=>{clear();tp(S().def.masonry[0]);S().player.hp=S().player.hpMax=999;S().stats.masonry=0});await A.pg.waitForFunction(()=>S().stats.masonry>0,null,{timeout:8000}).catch(()=>{});await wait(500);
const mas=await ev(()=>({n:S().stats.masonry,st:S().shots.filter(q=>q.c==='stone').length}));await shot('j02_falling_masonry');ok('masonry_falls_from_crumbling_walls',mas.n>=1,mas);
// ---------- 4. routes: high battlement by chain, low crypt
await ev(()=>{clear();window.__W0=S().def.wind;S().def.wind=[];tp(S().def.chain.find(c=>c[1]===-52)[0]+3)});/* r7: battlement gusts now blow an idle hero off the planks; calm them for the route check */await wait(500);await ev(()=>hold({up:1},100000));await A.pg.waitForFunction(()=>S().player.y<-44,null,{timeout:12000}).catch(()=>{});await ev(()=>hold({up:1,r:1},40));await wait(1200);
const hi=await ev(()=>Math.round(S().player.y));await ev(()=>idle());await ev(()=>{S().def.wind=window.__W0});ok('high_route_battlements_by_chain',hi<=-56&&hi>-70,{hi});
await ev(()=>tp(S().def.carve.find(r=>r[3]===300&&r[2]-r[0]>380)[0]+170,300));await wait(500);const lo=await ev(()=>Math.round(S().player.y));ok('low_route_keep_crypt',lo>250,{lo});
// ---------- 5. wind gusts push the player on the battlements
await ev(()=>{clear();S().stats.gusted=0});await ev(()=>until(()=>S().gustOn(STAGE_DEFS.keep.wind[0])&&((S().t)%5)<.6,8000));
const g0=await ev(()=>{tp(1300,-60);idle();S().pb.setVelocityY(-200);return S().player.x});await wait(700);const g1=await ev(()=>({x:S().player.x,gust:S().stats.gusted}));await shot('j03_wind_on_battlements');
ok('wind_gust_pushes_player',g1.gust>0&&g1.x-g0>8,{g0,g1});
// ---------- 6. ballistae fire, and wrecking all four unseals the cage
await ev(()=>{const s=S();s.stats.ballistaShots=0;clear();const b=s.bells.find(q=>q.id==='bal2');tp(b.x-90,b.y);s.player.hp=s.player.hpMax=999});await wait(3000);
const bs=await ev(()=>S().stats.ballistaShots);await shot('j04_ballista_firing');ok('ballistae_fire_bolts',bs>=1,{bs});
const wreck=async id=>{const b=await ev(id=>{const b=S().bells.find(q=>q.id===id);return{x:b.x,y:b.y}},id);for(let i=0;i<4;i++){await ev(b=>{clear();tp(b.x-10,b.y);S().player.f=1;S().player.st=999},b);await wait(250);await ev(()=>press('atkP'));await wait(600);if(await ev(id=>S().bells.find(q=>q.id===id).rung,id))break}};
for(const id of ['bal1','bal2','bal3'])await wreck(id);const w3=await ev(()=>({n:S().bells.filter(q=>q.rung).length,cage:S().sv.chDone.includes('kp_ballistae')}));
await wreck('bal4');await wait(500);const w4=await ev(()=>({n:S().bells.filter(q=>q.rung).length,cage:S().sv.chDone.includes('kp_ballistae'),bs:S().stats.ballistaShots}));
await ev(()=>{S().stats.ballistaShots=0;const b=S().bells.find(q=>q.id==='bal2');tp(b.x-90,b.y)});await wait(3000);const after=await ev(()=>S().stats.ballistaShots);await shot('j05_ballistae_wrecked');
ok('wrecking_four_ballistae_unseals_cage_and_silences_them',w3.n===3&&!w3.cage&&w4.n===4&&w4.cage&&after===0,{w3,w4,after});
// ---------- 7. chests, hidden loft, mimic, persistence
await ev(()=>{clear();tp(S().chests.find(c=>c.id==='ch_k1').x-12)});await wait(300);await ev(()=>press('restP'));await wait(900);const c1=await ev(()=>S().chests.find(c=>c.id==='ch_k1').st);
const loft=await ev(()=>!!S().chests.find(c=>c.id==='ch_k2'&&c.hidden));
await ev(()=>{clear();tp(S().chests.find(c=>c.id==='ch_k6').x-12);S().player.hp=S().player.hpMax=999});await wait(400);await ev(()=>press('restP'));await wait(1500);const mst=await ev(()=>S().chests.find(c=>c.id==='ch_k6').st);await shot('j06_keep_mimic');
for(let i=0;i<16;i++){const done=await ev(()=>{const s=S(),c=s.chests.find(c=>c.id==='ch_k6');if(c.st==='dead')return 1;tp(c.hx-20);s.player.f=1;s.player.st=999;press('atkP')});if(done)break;await wait(650)}
const md=await ev(()=>S().chests.find(c=>c.id==='ch_k6').st);
ok('keep_chests_secret_and_mimic',c1==='open'&&loft&&mst==='awake'&&md==='dead',{c1,loft,mst,md});
await ev(()=>{S().sv.souls=S().souls;Save.write(S().sv)});await go('?play&continue&mute&slot=1');
const per=await ev(()=>({sid:S().sid,k1:S().chests.find(c=>c.id==='ch_k1').st,k6:S().chests.find(c=>c.id==='ch_k6').st,bal:S().bells.filter(b=>b.rung).length,cage:S().sv.chDone.includes('kp_ballistae')}));
ok('keep_progress_persists',per.sid==='keep'&&per.k1==='open'&&per.k6==='dead'&&per.bal===4&&per.cage,per);
// ---------- 8. the Ironclad Castellan
await ev(()=>{clear();const s=S();s.player.hp=s.player.hpMax=9999;s.pb.setPosition(ARENA_L+40,140);s.player.inv=999});
await A.pg.waitForFunction(()=>S().cine,null,{timeout:15000}).catch(()=>{});await wait(1300);await shot('j07_castellan_intro_cinematic');const cine=await ev(()=>({c:!!S().cine,kind:S().boss&&S().boss.kind}));
await wait(1000);await shot('j08_castellan_name_card');
await A.pg.waitForFunction(()=>S().bossState==='fight',null,{timeout:15000}).catch(()=>{});await wait(400);
const atk=await ev(async()=>{const s=S(),B=s.boss,o={};const force=async(n,ms=1400)=>{B.state='walk';B.cd=-1;B.y=GY;B.loftCd=99;s.pickLord=()=>n;await new Promise(r=>setTimeout(r,ms))};
  let sh=[];const os=s.shots.push.bind(s.shots);s.shots.push=(...a)=>{sh.push(...a.map(q=>({...q})));return os(...a)};
  await force('volley',1800);o.volley=sh.filter(q=>q.c==='bolt').length;sh=[];await force('slam',1300);o.slam=true;
  B.hp=B.hpMax*.6;await new Promise(r=>setTimeout(r,400));o.p2=B.phase;await new Promise(r=>setTimeout(r,1500));
  s.player.state='idle';s.pb.setPosition(B.x-60,140);const x0=s.player.x;s.stats.gusted=0;await force('gust',1600);o.gust=s.stats.gusted;o.gdx=Math.round(s.player.x-x0);
  B.loftCd=-1;B.cd=-1;delete s.pickLord;B.state='walk';await new Promise(r=>setTimeout(r,1200));o.loft=B.state==='glide'||B.state==='perch'||B.y<GY;await new Promise(r=>setTimeout(r,1000));
  B.hp=B.hpMax*.3;await new Promise(r=>setTimeout(r,400));o.p3=B.phase;await new Promise(r=>setTimeout(r,1500));sh=[];await force('rubble',1500);o.rubble=sh.filter(q=>q.c==='stone'&&q.delay>0).length;
  s.shots.push=os;delete s.pickLord;B.state='walk';B.cd=99;s.stats.gusted=0;s.pb.setPosition(ARENA_L+120,140);await new Promise(r=>setTimeout(r,3500));o.gale=s.stats.gusted;return o});
await shot('j09_castellan_gale_phase3');
ok('castellan_cinematic_and_three_phases',cine.c&&cine.kind==='marshal'&&atk.p2===2&&atk.p3===3,{cine,atk});
ok('castellan_attacks_volley_slam_gust_loft_rubble',atk.volley>=3&&atk.gust>0&&Math.abs(atk.gdx)>8&&atk.loft&&atk.rubble>=5,atk);
ok('phase3_gale_sweeps_the_arena',atk.gale>0,atk);
await ev(()=>{const s=S();s.boss.state='walk';s.boss.hp=1;s.damageBoss(5)});await A.pg.waitForFunction(()=>S().victory,null,{timeout:40000}).catch(()=>{});await wait(1200);await shot('j10_castellan_slain_halberd');
const vic=await ev(()=>({lords:S().sv.lords,inv:S().sv.inv.includes('halberd'),opts:S().victoryOpts(),hub:S().sv.hubNext}));
ok('castellan_drops_signature_halberd',vic.lords.includes('marshal')&&vic.inv,vic);
await ev(()=>{S().victory.t=2;S().victory.sel=0;S().victoryGo()});await A.pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage').sid==='shrine'&&__G.scene.getScene('stage').player,null,{timeout:12000}).catch(()=>{});await wait(900);
const back=await ev(()=>({sid:S().sid}));ok('keep_returns_to_shrine',vic.opts[0]==='RETURN TO THE ASH SHRINE'&&back.sid==='shrine',{opts:vic.opts,back});
// ---------- 9. story ties
const keeper=await ev(()=>{const s=S(),sv=s.sv,keep=[...sv.lords],o={};sv.lords=['warden','cantor','toller','smith'];o.sealed=s.keeperLines().join(' ');sv.lords=['warden','cantor','toller','smith','abbess'];o.open=s.keeperLines().join(' ');sv.lords=keep;o.slain=s.keeperLines().join(' ');return o});
ok('keeper_speaks_of_the_keep',/CASTELLAN SWORE HIS SWORD TO ME/.test(keeper.sealed)&&/UNBARRED THE GATE/.test(keeper.open)&&/HIS OATH IS ANSWERED/.test(keeper.slain),keeper);
const keep=await ev(()=>[...S().sv.lords]);
await ev(()=>{const s=S();s.sv.lords=['warden','cantor','toller','smith'];tp(STAGE_DEFS.shrine.gate.x);idle()});await wait(500);await shot('j11_keep_gate_barred');await ev(()=>press('restP'));await wait(900);const sealed=await ev(()=>S().sid);
await ev(k=>{S().sv.lords=[...new Set([...k,'warden','cantor','toller','smith','abbess'])]},keep);await wait(300);await shot('j12_keep_gate_open');await ev(()=>press('restP'));
await A.pg.waitForFunction(()=>__G.scene.getScene('stage').sid==='keep'&&__G.scene.getScene('stage').player,null,{timeout:12000}).catch(()=>{});await wait(600);
const opened=await ev(()=>({sid:S().sid,bossDead:S().bossState==='dead'}));
ok('keep_gate_barred_then_opens_after_abbess',sealed==='shrine'&&opened.sid==='keep'&&opened.bossDead,{sealed,opened});
await A.pg.goto(B+'?seed=0&mute&slot=1&ending=rekindle');await wait(9000);const endL=await ev(()=>__G.scene.getScene('ending').lines);await shot('j13_ending_keep_line');
ok('ending_mentions_the_keep',endL.some(s=>/RUINED KEEP, A TORN BANNER/.test(s)),endL);
await A.ctx.close();
// ---------- 10. co-op in the keep
const H=await mk(false);await H.pg.goto(B+'assets/README.md');await H.ev(()=>localStorage.clear());await H.go('?host&mute&novideo&stage=keep&class=knight');
await H.pg.waitForFunction(()=>NET.peer&&NET.peer.open,null,{timeout:20000}).catch(()=>{});const code=await H.ev(()=>NET.code);pages[await H.ev(()=>NET.peer.id)]=H.pg;
const G=await mk(false);await G.pg.goto(B+'assets/README.md');await G.ev(()=>localStorage.clear());await G.pg.goto(B+'?seed=0&mute&class=pyromancer&join='+code);
await G.pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await wait(1500);
await G.ev(()=>{window.S=()=>__G.scene.getScene('stage');window.tp=(x,y=156)=>{const s=S();s.pb.setPosition(x,y-8);s.pb.setVelocity(0,0);s.player.inv=99;s.camY=s.camTY=y-156};window.press=k=>{let n=0;window.__inp=()=>(n++===0?{[k]:1}:{})}});
ok('coop_linked_in_keep',await G.ev(()=>NET.linked()&&S().sid)==='keep',{});
await H.ev(()=>{clear();tp(300);S().player.hp=S().player.hpMax=9999});
for(let i=0;i<4;i++){await G.ev(()=>{const b=S().bells.find(q=>q.id==='bal1');tp(b.x-10,b.y);S().player.f=1;S().player.st=999;S().player.hp=S().player.hpMax});await wait(300);await G.ev(()=>press('atkP'));await wait(1200);if(await H.ev(()=>S().bells.find(q=>q.id==='bal1').rung))break}
const bw=[await H.ev(()=>S().bells.filter(b=>b.rung).length),await G.ev(()=>S().bells.filter(b=>b.rung).length)];await G.shot('j14_coop_guest_ballista');
ok('coop_ballista_wreck_host_authoritative',bw.join()==='1,1',{bw});
await G.ev(()=>tp(S().chests.find(c=>c.id==='ch_k1').x-12));await wait(400);await G.ev(()=>press('restP'));await wait(1200);
const cc=[await H.ev(()=>S().chests.find(c=>c.id==='ch_k1').st),await G.ev(()=>S().chests.find(c=>c.id==='ch_k1').st)];ok('coop_chest_synced',cc.every(s=>s==='open'),{cc});
await G.ev(()=>tp(S().chests.find(c=>c.id==='ch_k6').x-12));await H.ev(()=>tp(S().chests.find(c=>c.id==='ch_k6').x-80));await wait(400);await G.ev(()=>press('restP'));await wait(1500);
const mm=[await H.ev(()=>S().chests.find(c=>c.id==='ch_k6').st),await G.ev(()=>S().chests.find(c=>c.id==='ch_k6').st)];
for(let i=0;i<14;i++){const d=await G.ev(()=>{const s=S(),c=s.chests.find(c=>c.id==='ch_k6');if(c.st==='dead')return 1;tp(c.hx-20);s.player.f=1;s.player.st=999;s.player.hp=s.player.hpMax;press('atkP')});if(d)break;await wait(650)}await wait(800);
const mk2=[await H.ev(()=>S().chests.find(c=>c.id==='ch_k6').st),await G.ev(()=>S().chests.find(c=>c.id==='ch_k6').st)];
ok('coop_keep_mimic_mirrored',mm.every(s=>s==='awake')&&mk2.every(s=>s==='dead'),{mm,mk2});
await H.ev(()=>{clear();const s=S();s.player.hp=s.player.hpMax=9999;s.pb.setPosition(ARENA_L+40,140)});await G.ev(()=>{S().player.hp=S().player.hpMax=9999;S().pb.setPosition(ARENA_L+10,140)});
await H.pg.waitForFunction(()=>S().bossState==='fight',null,{timeout:15000}).catch(()=>{});await wait(600);
await H.ev(()=>{const s=S(),B=s.boss;B.state='walk';B.cd=-1;B.loftCd=99;s.pickLord=()=>'volley'});
const gb=await G.ev(async()=>{let n=0;for(let i=0;i<40;i++){n=Math.max(n,S().shots.filter(q=>q.c==='bolt').length);await new Promise(r=>setTimeout(r,50))}return{kind:S().boss&&S().boss.kind,bolts:n}});await G.shot('j15_coop_guest_castellan_volley');
await H.ev(()=>{delete S().pickLord});ok('coop_guest_sees_castellan_and_bolts',gb.kind==='marshal'&&gb.bolts>=1,gb);
await H.ev(()=>{const s=S();if(s.boss){s.boss.state='walk';s.boss.hp=1;s.damageBoss(5)}});await wait(2500);
const sg=[await H.ev(()=>S().sv.inv.includes('halberd')),await G.ev(()=>S().sv.inv.includes('halberd'))];ok('coop_both_players_get_halberd',sg.every(Boolean),{sg});
await H.ctx.close();await G.ctx.close();
ok('no_errors',errs.length===0,errs);ok('only_peer_broker_traffic',[...ext].every(h=>/peerjs/.test(h)),[...ext]);
await br.close();
try{let s='';FR.forEach((t,i)=>{s+=`file '${VD}/${String(i).padStart(5,'0')}.jpg'\nduration ${Math.min(.5,((FR[i+1]||t+100)-t)/1000).toFixed(3)}\n`});fs.writeFileSync(VD+'/l.txt',s);
 execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i ${VD}/l.txt -vf "scale=640:360,fps=30" -t 45 -c:v libx264 -pix_fmt yuv420p -crf 27 clips/J.mp4`);console.error('clip ok')}catch(e){console.error('clip fail',e.message)}
console.log(JSON.stringify({pass,fail}));process.exit(fail?1:0);
