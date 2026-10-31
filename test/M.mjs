// Headless checks for milestone M: THE HOLLOW THRONE — the ashen finale sanctum (opens once all six new lords are beaten). Echo halls of earlier
// lords (gale, weightless nave, rot bed, thorns), branching routes, secrets, chests + mimics, lore, six relic altars that each want a lord's
// signature weapon (collectible) to open the hollow vault, the Hollow Heir (cinematic, 3 phases echoing the Castellan, Prioress, Astronomer,
// Abbess), his HEIR'S HOLLOWBRAND (special balanced vs FROSTBRAND), the new USURP ending, story ties and co-op (incl. the ending).
// usage: node test/M.mjs   (server on :8171). Writes screenshots/M/after/*.png and clips/M.mp4
import { chromium } from 'playwright';import {execSync} from 'child_process';import fs from 'fs';
const B='http://127.0.0.1:8171/',SH='screenshots/M/after/';
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const errs=[],ext=new Set();let pass=0,fail=0;const ok=(n,c,v)=>{c?pass++:fail++;console.error((c?'PASS ':'FAIL ')+n+' '+JSON.stringify(v).slice(0,500))};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const VD='/tmp/mvid';fs.rmSync(VD,{recursive:true,force:true});const FR=[];
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
// ---------- 1. hollowbrand special vs FROSTBRAND, and fired by a real heavy
await go('?play&mute&novideo&slot=3&class=knight&stage=ramparts');
const iso=await ev(async W=>{const s=S(),P=s.player,o={};clear();for(const w of W){const r=[];for(let k=0;k<3;k++){s.pb.setPosition(400,148);s.pb.setVelocity(0,0);P.f=1;P.fp=99;await new Promise(q=>setTimeout(q,250));
  const e=s.spawnEnemy('acolyte',430,156);e.hp=999;e.temp=1;e.cd=99;e.state='idle';await new Promise(q=>setTimeout(q,150));const h=e.hp;(s.player.spCd=0,s).weaponSpecial(WEAPONS[w]);await new Promise(q=>setTimeout(q,800));r.push(h-e.hp);e.dead=true;e.b.body.enable=false}
  o[w]=+(r.reduce((a,b)=>a+b,0)/r.length).toFixed(2)}return o},['frostbrand','hollowbrand','thornbrand']);
ok('hollowbrand_special_beats_earlier_lord_weapons',iso.frostbrand>0&&iso.hollowbrand>iso.frostbrand&&iso.hollowbrand<=iso.frostbrand*2.5,iso);// r9: lord weapons climb boss to boss (r8 parity dropped)
const realF=async()=>{const s=S(),P=s.player;if(!s.sv.inv.includes('hollowbrand'))s.sv.inv.push('hollowbrand');s.menu={mode:'equip',sel:0,t:1,prev:{}};for(let i=0;i<40&&s.sv.eq.main!=='hollowbrand';i++)s.menuKey('right');s.menu=null;
  s.pb.setPosition(400,148);s.pb.setVelocity(0,0);await new Promise(q=>setTimeout(q,300));P.st=999;P.fp=P.fpMax=99;P.spCd=0;P.state='idle';P.f=1;s.stats.specials=0;const e=s.spawnEnemy('acolyte',430,156);e.hp=999;e.temp=1;e.cd=99;e.state='idle';e.kbImmune=1;if(e.b.body)e.b.body.moves=false;await new Promise(q=>setTimeout(q,200));const h=e.hp;
  let n=0;window.__inp=()=>(n++===0?{heavyP:1}:{});await new Promise(q=>setTimeout(q,1500));window.__inp=()=>({});const o={eq:s.sv.eq.main,sp:s.stats.specials,dmg:+(h-e.hp).toFixed(2)};e.dead=true;e.b.body.enable=false;return o};let real=await ev(realF);for(let k=0;k<2&&!(real.eq==='hollowbrand'&&real.sp===1&&real.dmg>=iso.hollowbrand);k++)real=await ev(realF);
ok('hollowbrand_heavy_fires_its_special',real.eq==='hollowbrand'&&real.sp===1&&real.dmg>=iso.hollowbrand,real);
// ---------- 2. stage data
await go('?play&mute&novideo&slot=1&class=knight&stage=throne');
const D=await ev(()=>{const d=STAGE_DEFS.throne;return{name:d.name,side:d.side,echo:[d.wind,d.lowg,d.spores,d.thorns].every(a=>a&&a.length),finale:d.finale,mas:3,wants:d.bells.every(b=>WEAPONS[b.w]&&SIGNATURE[b.lord]===b.w),bal:d.bells.length,kind:d.bellKind,ch:CHESTS.throne.length,hidden:CHESTS.throne.filter(c=>c.hidden).length,
 mimic:CHESTS.throne.filter(c=>c.mimic).length,lock:d.cages.filter(c=>c.lock==='th_relics').length,lore:['h1','h2','h3'].every(i=>LORE[i]),high:d.oneway.filter(r=>r[1]===-60).length,
 boss:d.boss.kind,phases:d.boss.phases.length+1,sig:SIGNATURE.heir,desc:!!(DESC.hollowbrand&&DESC.hollowbrand.length>=2),hint:/ALTAR/.test(LORE.h2.join(' '))}});
ok('throne_stage_defined',D.name==='THE HOLLOW THRONE'&&D.side&&D.finale&&D.echo&&D.wants&&D.mas>=3&&D.bal===6&&D.kind==='relic'&&D.ch>=6&&D.hidden>=2&&D.mimic>=2&&D.lock===1&&D.high>=2&&D.boss==='heir'&&D.phases===3&&D.sig==='hollowbrand'&&D.desc&&D.lore&&D.hint,D);
await shot('m01_throne_start');
// ---------- 3. echo halls: the Castellan's gale, the Astronomer's weightless nave, the Prioress's rot bed and thorns
await ev(()=>{clear();const s=S();s.player.hp=s.player.hpMax=999;s.stats.gusted=0});await ev(()=>until(()=>S().gustOn(STAGE_DEFS.throne.wind[0])&&((S().t)%5)<.6,8000));
const g0=await ev(()=>{tp(1400,-60);idle();S().pb.setVelocityY(-200);return S().player.x});await wait(700);const g1=await ev(()=>({x:S().player.x,gust:S().stats.gusted}));await shot('m02_echo_gale');
const th=await ev(async()=>{const s=S(),t0=STAGE_DEFS.throne.thorns[0];s.stats.thorned=0;tp(t0[0]+14);s.player.inv=0;await new Promise(r=>setTimeout(r,500));return s.stats.thorned});
const z=await ev(()=>STAGE_DEFS.throne.spores[0]);const sp=await ev(async z=>{const s=S();clear();s.player.hp=200;await until(()=>((s.t+(z.off||0))%z.period)<.2,9000);s.stats.poisoned=0;tp((z.r[0]+z.r[2])/2);idle();await new Promise(r=>setTimeout(r,1200));return s.stats.poisoned},z);
const lz=await ev(()=>STAGE_DEFS.throne.lowg[0]);const fl=await ev(async z=>{const s=S();clear();await until(()=>((s.t+(z.off||0))%z.period)<.3,9000);s.stats.floated=0;tp(z.r[0]+80,-100);idle();await new Promise(r=>setTimeout(r,120));let n=0;window.__inp=()=>(n++<10?{jump:1,jumpP:n===1?1:0}:{});await new Promise(r=>setTimeout(r,900));idle();return s.stats.floated},lz);
ok('echo_halls_gale_rot_weightless_thorns',g1.gust>0&&g1.x-g0>8&&th>=1&&sp>0&&fl>0,{g0,g1,th,sp,fl});
// ---------- 4. routes: high battlement by chain, low crypt
await ev(()=>{clear();tp(S().def.chain.find(c=>c[1]===-52)[0]+3)});await wait(500);await ev(()=>hold({up:1},260));await wait(4200);await ev(()=>hold({up:1,r:1},40));await wait(1200);
const hi=await ev(()=>Math.round(S().player.y));await ev(()=>idle());ok('high_route_gallery_by_chain',hi<=-56&&hi>-70,{hi});
await ev(()=>tp(S().def.carve.find(r=>r[3]===300&&r[2]-r[0]>380)[0]+170,300));await wait(500);const lo=await ev(()=>Math.round(S().player.y));ok('low_route_throne_crypt',lo>250,{lo});
// ---------- 5. (the echo halls are shown above; the vault needs relics)
await ev(()=>{clear();tp(S().def.chain.find(c=>c[1]===-52)[0]+3,156)});await wait(300);await shot('m04_hollow_sanctum');
// ---------- 6. six relic altars: each refuses until you carry its lord's signature weapon; all six open the hollow vault
const wreck=async id=>{const b=await ev(id=>{const b=S().bells.find(q=>q.id===id);return{x:b.x,y:b.y}},id);for(let i=0;i<4;i++){await ev(b=>{clear();tp(b.x-10,b.y);S().player.f=1;S().player.st=999;S().player.hp=S().player.hpMax=999},b);await wait(250);await ev(()=>press('atkP'));await wait(600);if(await ev(id=>S().bells.find(q=>q.id===id).rung,id))break}};
await ev(()=>{const s=S();s.sv.inv=s.sv.inv.filter(w=>!STAGE_DEFS.throne.bells.some(b=>b.w===w));s.stats.relicRefused=0});await wreck('rl_smith');
const ref=await ev(()=>({n:S().bells.filter(q=>q.rung).length,refused:S().stats.relicRefused}));await shot('m05_altar_refuses');
await ev(()=>{const s=S();for(const b of STAGE_DEFS.throne.bells)if(!s.sv.inv.includes(b.w))s.sv.inv.push(b.w)});
for(const id of ['rl_toller','rl_smith','rl_abbess','rl_marshal','rl_astronomer']){await ev(id=>{const s=S();s.sv.eq.main=STAGE_DEFS.throne.bells.find(b=>b.id===id).w},id);await wreck(id)}/* r7 P3: the altar wants the weapon in hand */const w5=await ev(()=>({n:S().bells.filter(q=>q.rung).length,cage:S().sv.chDone.includes('th_relics')}));
await ev(()=>{S().sv.eq.main='thornbrand'});await wreck('rl_prioress');await wait(500);const w6=await ev(()=>({n:S().bells.filter(q=>q.rung).length,cage:S().sv.chDone.includes('th_relics'),locked:S().cages.find(c=>c.id==='th_vault').locked}));await shot('m06_relics_offered');
ok('relic_altars_want_signature_weapons_and_open_vault',ref.n===0&&ref.refused>=1&&w5.n===5&&!w5.cage&&w6.n===6&&w6.cage&&!w6.locked,{ref,w5,w6});
// ---------- 7. chests, hidden loft, mimic, persistence
await ev(()=>{clear();tp(S().chests.find(c=>c.id==='ch_t1').x-12)});await wait(300);await ev(()=>press('restP'));await wait(900);const c1=await ev(()=>S().chests.find(c=>c.id==='ch_t1').st);
const loft=await ev(()=>!!S().chests.find(c=>c.id==='ch_t2'&&c.hidden));
await ev(()=>{clear();tp(S().chests.find(c=>c.id==='ch_t6').x-12);S().player.hp=S().player.hpMax=999});await wait(400);await ev(()=>press('restP'));await wait(1500);const mst=await ev(()=>S().chests.find(c=>c.id==='ch_t6').st);await shot('m07_throne_mimic');
for(let i=0;i<16;i++){const done=await ev(()=>{const s=S(),c=s.chests.find(c=>c.id==='ch_t6');if(c.st==='dead')return 1;tp(c.hx-20);s.player.f=1;s.player.st=999;press('atkP')});if(done)break;await wait(650)}
const md=await ev(()=>S().chests.find(c=>c.id==='ch_t6').st);
ok('throne_chests_secret_and_mimic',c1==='open'&&loft&&mst==='awake'&&md==='dead',{c1,loft,mst,md});
await ev(()=>{S().sv.souls=S().souls;Save.write(S().sv)});await go('?play&continue&mute&slot=1');
const per=await ev(()=>({sid:S().sid,k1:S().chests.find(c=>c.id==='ch_t1').st,k6:S().chests.find(c=>c.id==='ch_t6').st,bal:S().bells.filter(b=>b.rung).length,cage:S().sv.chDone.includes('th_relics')}));
ok('throne_progress_persists',per.sid==='throne'&&per.k1==='open'&&per.k6==='dead'&&per.bal===6&&per.cage,per);
// ---------- 8. the Hollow Heir
await ev(()=>{clear();const s=S();s.player.hp=s.player.hpMax=9999;s.pb.setPosition(ARENA_L+40,140);s.player.inv=999});
await A.pg.waitForFunction(()=>S().cine,null,{timeout:15000}).catch(()=>{});await wait(1300);await shot('m08_heir_intro_cinematic');const cine=await ev(()=>({c:!!S().cine,kind:S().boss&&S().boss.kind}));
await wait(1000);await shot('m09_heir_name_card');
await A.pg.waitForFunction(()=>S().bossState==='fight',null,{timeout:15000}).catch(()=>{});await wait(400);
const atk=await ev(async()=>{const s=S(),B=s.boss,o={};const force=async(n,ms=1400)=>{B.state='walk';B.cd=-1;B.y=GY;B.loftCd=99;s.pickLord=()=>n;await new Promise(r=>setTimeout(r,ms))};
  let sh=[];const os=s.shots.push.bind(s.shots);s.shots.push=(...a)=>{sh.push(...a.map(q=>({...q})));return os(...a)};
  let fl=0;const of=s.flames.push.bind(s.flames);s.flames.push=(...a)=>{fl+=a.filter(f=>f.water).length;return of(...a)};
  const pk=[];const rp=s.pickLord.bind(s);for(let i=0;i<60;i++)pk.push(rp(B,1,0));o.p1picks=[...new Set(pk)].sort();
  await force('volley',1800);o.volley=sh.filter(q=>q.c==='bolt').length;sh=[];await force('lash',1600);o.lash=sh.filter(q=>q.c==='thorn').length;
  B.hp=B.hpMax*.6;await new Promise(r=>setTimeout(r,400));o.p2=B.phase;await new Promise(r=>setTimeout(r,1500));
  s.player.state='idle';s.pb.setPosition(B.x-80,140);let x0=s.player.x;s.stats.gusted=0;await force('pull',1600);o.pull=s.stats.gusted;o.pdx=Math.round(s.player.x-x0);
  fl=0;await force('wave',1600);o.wave=fl;
  B.loftCd=-1;B.cd=-1;delete s.pickLord;B.state='walk';await new Promise(r=>setTimeout(r,1200));o.loft=B.state==='glide'||B.state==='perch'||B.y<GY;await new Promise(r=>setTimeout(r,1000));
  B.hp=B.hpMax*.3;await new Promise(r=>setTimeout(r,400));o.p3=B.phase;await new Promise(r=>setTimeout(r,1500));sh=[];await force('comet',1500);o.comet=sh.filter(q=>q.c==='star'&&q.delay>0).length;sh=[];await force('rot',1500);o.rot=sh.filter(q=>q.c==='spore'&&q.delay>0).length;
  s.shots.push=os;s.flames.push=of;delete s.pickLord;B.state='walk';B.cd=99;s.stats.poisoned=0;const sides=new Set();const t0=performance.now();while(performance.now()-t0<6000){for(const x of[ARENA_L+80,ARENA_L+280]){s.pb.setPosition(x,140);await new Promise(r=>setTimeout(r,250));if(s.sporeAt(s.player.x,s.player.y-8))sides.add(x)}}o.rotSides=[...sides];return o});
await shot('m10_heir_every_lord_phase3');
ok('heir_cinematic_and_three_phases',cine.c&&cine.kind==='heir'&&atk.p2===2&&atk.p3===3,{cine,atk});
ok('heir_echoes_castellan_prioress_astronomer_abbess',atk.volley>=3&&atk.lash>=3&&atk.pull>0&&atk.pdx>8&&atk.wave>=2&&atk.loft&&atk.comet>=5&&atk.rot>=5&&atk.rotSides.length===2,atk);
await ev(()=>{const s=S();s.boss.state='walk';s.boss.hp=1;s.damageBoss(5)});await A.pg.waitForFunction(()=>S().victory,null,{timeout:40000}).catch(()=>{});await wait(1200);await shot('m10b_heir_slain_hollowbrand');
const vic=await ev(()=>({lords:S().sv.lords,inv:S().sv.inv.includes('hollowbrand'),opts:S().victoryOpts()}));
ok('heir_drops_signature_hollowbrand',vic.lords.includes('heir')&&vic.inv,vic);
await ev(()=>{S().victory.t=2;S().victory.sel=0;S().victoryGo()});await A.pg.waitForFunction(()=>window.__G&&__G.scene.getScene('ending')&&__G.scene.getScene('ending').sys.isActive(),null,{timeout:20000}).catch(()=>{});await wait(6000);
const us=await ev(()=>{const e=__G.scene.getScene('ending');return{kind:e.kind,lines:e.lines,title:ENDINGS[e.kind]&&ENDINGS[e.kind].title,saved:(Save.load()||{}).endings,ng:e.ngOk(),card:!!e.card}});await shot('m11_usurp_ending');
ok('claim_the_hollow_throne_usurp_ending',vic.opts.join('|')==='CLAIM THE HOLLOW THRONE|APPROACH THE FIRST FLAME|RETURN TO THE ASH SHRINE|RETURN TO TITLE'&&us.ng===true&&us.kind==='usurp'&&us.title==='THE HOLLOW THRONE'&&us.lines.some(s=>/AGE OF ASH/.test(s))&&us.lines.every(Boolean)&&us.saved.includes('usurp'),{...us,opts:vic.opts});// the finale card also offers the first flame; beating the Heir unlocks JOURNEY ON (NG+) on the ending card
await go('?play&continue&mute&slot=1');await ev(()=>{const s=S();if(s.sid!=='shrine')s.travel('shrine')});await A.pg.waitForFunction(()=>__G.scene.getScene('stage').sid==='shrine'&&__G.scene.getScene('stage').player,null,{timeout:20000}).catch(()=>{});await wait(900);
const back=await ev(()=>({sid:S().sid}));ok('throne_returns_to_shrine',back.sid==='shrine',back);
// ---------- 9. story ties
const SIX=['toller','smith','abbess','marshal','astronomer','prioress'];
const keeper=await ev(S6=>{const s=S(),sv=s.sv,keep=[...sv.lords],o={};sv.lords=['warden','cantor',...S6.slice(0,5)];o.sealed=s.keeperLines().join(' ');sv.lords=['warden','cantor',...S6];o.open=s.keeperLines().join(' ');sv.lords=keep;o.slain=s.keeperLines().join(' ');return o},SIX);
ok('keeper_speaks_of_the_throne',/ASH OF SIX/.test(keeper.sealed)&&/ALL SIX LORDS ARE BEATEN/.test(keeper.open)&&/THE THRONE STANDS EMPTY/.test(keeper.slain),keeper);
const keep=await ev(()=>[...S().sv.lords]);
await ev(S6=>{const s=S();s.sv.lords=['warden','cantor',...S6.slice(0,5)];tp(STAGE_DEFS.shrine.sanctum.x);idle()},SIX);await wait(500);await shot('m12_hollow_door_sealed');await ev(()=>press('restP'));await wait(900);const sealed=await ev(()=>({sid:S().sid,say:S().sayT||S().sayText||''}));
await ev(([k,S6])=>{S().sv.lords=[...new Set([...k,'warden','cantor',...S6])]},[keep,SIX]);await wait(300);await shot('m13_hollow_door_open');await ev(()=>press('restP'));
await A.pg.waitForFunction(()=>__G.scene.getScene('stage').sid==='throne'&&__G.scene.getScene('stage').player,null,{timeout:12000}).catch(()=>{});await wait(600);
const opened=await ev(()=>({sid:S().sid,bossDead:S().bossState==='dead'}));
ok('hollow_door_sealed_until_all_six_lords',sealed.sid==='shrine'&&opened.sid==='throne'&&opened.bossDead,{sealed,opened});
await A.pg.goto(B+'?seed=0&mute&slot=1&ending=rekindle');await wait(9000);const endL=await ev(()=>__G.scene.getScene('ending').lines);await shot('m14_ending_throne_line');
ok('ending_mentions_the_throne',endL.some(s=>/HOLLOW THRONE STOOD EMPTY/.test(s)),endL);
await A.ctx.close();
// ---------- 10. co-op in the throne
const H=await mk(false);await H.pg.goto(B+'assets/README.md');await H.ev(()=>localStorage.clear());await H.go('?host&mute&novideo&stage=throne&class=knight');
await H.pg.waitForFunction(()=>NET.peer&&NET.peer.open,null,{timeout:20000}).catch(()=>{});const code=await H.ev(()=>NET.code);pages[await H.ev(()=>NET.peer.id)]=H.pg;
const G=await mk(false);await G.pg.goto(B+'assets/README.md');await G.ev(()=>localStorage.clear());await G.pg.goto(B+'?seed=0&mute&class=pyromancer&join='+code);
await G.pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await wait(1500);
await G.ev(()=>{window.S=()=>__G.scene.getScene('stage');window.tp=(x,y=156)=>{const s=S();s.pb.setPosition(x,y-8);s.pb.setVelocity(0,0);s.player.inv=99;s.camY=s.camTY=y-156};window.press=k=>{let n=0;window.__inp=()=>(n++===0?{[k]:1}:{})}});
ok('coop_linked_in_throne',await G.ev(()=>NET.linked()&&S().sid)==='throne',{});
await H.ev(()=>{clear();tp(300);S().player.hp=S().player.hpMax=9999;S().sv.inv.push('clapper');S().sv.eq.main='clapper'});
for(let i=0;i<4;i++){await G.ev(()=>{const b=S().bells.find(q=>q.id==='rl_toller');tp(b.x-10,b.y);S().player.f=1;S().player.st=999;S().player.hp=S().player.hpMax});await wait(300);await G.ev(()=>press('atkP'));await wait(1200);if(await H.ev(()=>S().bells.find(q=>q.id==='rl_toller').rung))break}
const bw=[await H.ev(()=>S().bells.filter(b=>b.rung).length),await G.ev(()=>S().bells.filter(b=>b.rung).length)];await G.shot('m15_coop_guest_relic');
ok('coop_relic_offer_host_authoritative',bw.join()==='1,1',{bw});
await G.ev(()=>tp(S().chests.find(c=>c.id==='ch_t1').x-12));await wait(400);await G.ev(()=>press('restP'));await wait(1200);
const cc=[await H.ev(()=>S().chests.find(c=>c.id==='ch_t1').st),await G.ev(()=>S().chests.find(c=>c.id==='ch_t1').st)];ok('coop_chest_synced',cc.every(s=>s==='open'),{cc});
await G.ev(()=>tp(S().chests.find(c=>c.id==='ch_t6').x-12));await H.ev(()=>tp(S().chests.find(c=>c.id==='ch_t6').x-80));await wait(400);await G.ev(()=>press('restP'));await wait(1500);
const mm=[await H.ev(()=>S().chests.find(c=>c.id==='ch_t6').st),await G.ev(()=>S().chests.find(c=>c.id==='ch_t6').st)];
for(let i=0;i<14;i++){const d=await G.ev(()=>{const s=S(),c=s.chests.find(c=>c.id==='ch_t6');if(c.st==='dead')return 1;tp(c.hx-20);s.player.f=1;s.player.st=999;s.player.hp=s.player.hpMax;press('atkP')});if(d)break;await wait(650)}await wait(800);
const mk2=[await H.ev(()=>S().chests.find(c=>c.id==='ch_t6').st),await G.ev(()=>S().chests.find(c=>c.id==='ch_t6').st)];
ok('coop_throne_mimic_mirrored',mm.every(s=>s==='awake')&&mk2.every(s=>s==='dead'),{mm,mk2});
await H.ev(()=>{clear();const s=S();s.player.hp=s.player.hpMax=9999;s.pb.setPosition(ARENA_L+40,140)});await G.ev(()=>{S().player.hp=S().player.hpMax=9999;S().pb.setPosition(ARENA_L+10,140)});
await H.pg.waitForFunction(()=>S().bossState==='fight',null,{timeout:15000}).catch(()=>{});await wait(600);
await H.ev(()=>{const s=S(),B=s.boss;B.state='walk';B.cd=-1;B.loftCd=99;s.pickLord=()=>'volley'});
const gb=await G.ev(async()=>{let n=0;for(let i=0;i<40;i++){n=Math.max(n,S().shots.filter(q=>q.c==='bolt').length);await new Promise(r=>setTimeout(r,50))}return{kind:S().boss&&S().boss.kind,bolts:n}});await G.shot('m16_coop_guest_heir_volley');
await H.ev(()=>{delete S().pickLord});ok('coop_guest_sees_heir_and_echo_volley',gb.kind==='heir'&&gb.bolts>=1,gb);
await H.ev(()=>{const s=S();if(s.boss){s.boss.state='walk';s.boss.hp=1;s.damageBoss(5)}});await wait(2500);
const sg=[await H.ev(()=>S().sv.inv.includes('hollowbrand')),await G.ev(()=>S().sv.inv.includes('hollowbrand'))];ok('coop_both_players_get_hollowbrand',sg.every(Boolean),{sg});
await H.pg.waitForFunction(()=>S().victory,null,{timeout:40000}).catch(()=>{});await H.ev(()=>{S().victory.t=2;S().victory.sel=0;S().victoryGo()});
await G.pg.waitForFunction(()=>__G.scene.getScene('ending')&&__G.scene.getScene('ending').sys.isActive(),null,{timeout:20000}).catch(()=>{});await wait(1500);
const ce=[await H.ev(()=>__G.scene.getScene('ending').sys.isActive()&&__G.scene.getScene('ending').kind),await G.ev(()=>__G.scene.getScene('ending').sys.isActive()&&__G.scene.getScene('ending').kind)];ok('coop_usurp_ending_for_both',ce.every(k=>k==='usurp'),{ce});
await H.ctx.close();await G.ctx.close();
ok('no_errors',errs.length===0,errs);ok('only_peer_broker_traffic',[...ext].every(h=>/peerjs/.test(h)),[...ext]);
await br.close();
try{let s='';FR.forEach((t,i)=>{s+=`file '${VD}/${String(i).padStart(5,'0')}.jpg'\nduration ${Math.min(.5,((FR[i+1]||t+100)-t)/1000).toFixed(3)}\n`});fs.writeFileSync(VD+'/l.txt',s);
 execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i ${VD}/l.txt -vf "scale=640:360,fps=30" -t 45 -c:v libx264 -pix_fmt yuv420p -crf 27 clips/M.mp4`);console.error('clip ok')}catch(e){console.error('clip fail',e.message)}
console.log(JSON.stringify({pass,fail}));process.exit(fail?1:0);
