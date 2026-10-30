// Headless checks for milestone H: (1) signature-weapon specials balanced against FROSTBRAND, (2) THE BURNING CATACOMB FORGE side stage — branching
// high/low routes, five forge anvils (collectible) that unseal a cage, secrets, chests + mimics, lore, the Ashwrought Smith lord (cinematic, 3 phases,
// bellows / molten ingots / crucible pour / gantry loft), his signature ASHWROUGHT MAUL, story ties (Ember Descent in the shrine, keeper, endings),
// and co-op (host-authoritative anvils, chests, drops, mimic, boss + signature for both players; relay as in milestoneF.mjs).
// usage: node test/H.mjs   (server on :8171). Writes screenshots/H/after/*.png and clips/H.mp4
import { chromium } from 'playwright';import {execSync} from 'child_process';import fs from 'fs';
const B='http://127.0.0.1:8171/',SH='screenshots/H/after/';
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const errs=[],ext=new Set();let pass=0,fail=0;const ok=(n,c,v)=>{c?pass++:fail++;console.error((c?'PASS ':'FAIL ')+n+' '+JSON.stringify(v).slice(0,500))};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const VD='/tmp/hvid';fs.rmSync(VD,{recursive:true,force:true});const FR=[];
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
// ---------- 1. specials balanced: every signature heavy (special + swing) on one target lands within 0.7x-1.3x of FROSTBRAND
await go('?play&mute&slot=3&class=knight&stage=ramparts');
const SIGW=['frostbrand','requiemspear','crownbreaker','clapper','ashmaul'];
const bal=await ev(async W=>{const s=S(),o={};clear();for(const w of W){if(!s.sv.inv.includes(w))s.sv.inv.push(w);s.menu={mode:'equip',sel:0,t:1,prev:{}};for(let i=0;i<40&&s.sv.eq.main!==w;i++)s.menuKey('right');s.menu=null;
  const r=[];let spec=0;for(let k=0;k<3;k++){const P=s.player;s.pb.setPosition(400,148);s.pb.setVelocity(0,0);P.st=999;P.fp=P.fpMax=99;P.state='idle';P.f=1;s.stats.specials=0;
   await new Promise(q=>setTimeout(q,300));P.state='idle';const e=s.spawnEnemy('acolyte',400+30,156);e.hp=999;e.temp=1;e.cd=99;e.state='idle';await new Promise(q=>setTimeout(q,200));const h=e.hp;
   let n=0;window.__inp=()=>(n++===0?{heavyP:1}:{});await new Promise(q=>setTimeout(q,1500));window.__inp=()=>({});r.push(h-e.hp);spec+=s.stats.specials;e.dead=true;e.b.body.enable=false}
  o[w]={eq:s.sv.eq.main===w,spec,dmg:+(r.reduce((a,b)=>a+b,0)/r.length).toFixed(2),runs:r.map(x=>+x.toFixed(1)),special:WEAPONS[w].special}}return o},SIGW);
const fb=bal.frostbrand.dmg;
ok('signature_heavies_fire_specials_with_real_input',fb>0&&SIGW.every(w=>bal[w].eq&&bal[w].spec===3&&bal[w].dmg>0),bal);
// the special itself, isolated (same build, same target at +30): each within 0.7x-1.3x of FROSTBRAND's frost row; also against a lord
const iso=await ev(async W=>{const s=S(),P=s.player,o={};for(const w of W){const r=[];for(let k=0;k<3;k++){s.pb.setPosition(400,148);s.pb.setVelocity(0,0);P.f=1;P.fp=99;await new Promise(q=>setTimeout(q,250));
  const e=s.spawnEnemy('acolyte',430,156);e.hp=999;e.temp=1;e.cd=99;e.state='idle';await new Promise(q=>setTimeout(q,150));const h=e.hp;s.weaponSpecial(WEAPONS[w]);await new Promise(q=>setTimeout(q,800));r.push(+(h-e.hp).toFixed(2));e.dead=true;e.b.body.enable=false}
  o[w]=+(r.reduce((a,b)=>a+b,0)/r.length).toFixed(2)}return o},SIGW);
ok('real_heavy_lands_its_special',SIGW.every(w=>bal[w].dmg>=iso[w]*.9),{bal:Object.fromEntries(SIGW.map(w=>[w,bal[w].dmg])),iso});
ok('signature_specials_balanced_vs_frostbrand',iso.frostbrand>0&&SIGW.every(w=>iso[w]>=iso.frostbrand*.7&&iso[w]<=iso.frostbrand*1.3),{iso,before:{frostbrand:8.8,requiemspear:1.8,crownbreaker:1.7,clapper:1.6}});
// a special strikes each target once (no multi-hit stacking from overlapping bursts) and lords take a reduced share
const once=await ev(async()=>{const s=S(),P=s.player,o={};for(const w of['crownbreaker','ashmaul']){s.sv.eq.main=w;s.applyEquip&&s.applyEquip();s.build=s.calcBuild?s.calcBuild():s.build;
  const e=s.spawnEnemy('acolyte',P.x+40,156);e.hp=999;e.temp=1;e.cd=99;let hits=0;const od=s.damageEnemy.bind(s);s.damageEnemy=(x,...a)=>{if(x===e)hits++;return od(x,...a)};
  P.fp=99;s.weaponSpecial(WEAPONS[w]);await new Promise(q=>setTimeout(q,700));s.damageEnemy=od;o[w]=hits;e.dead=true;e.b.body.enable=false}return o});
ok('special_hits_each_target_once',Object.values(once).every(n=>n===1),once);
// ---------- 2. stage data: routes, secrets, collectibles, story
await go('?play&mute&slot=1&class=knight&stage=catacomb');
const D=await ev(()=>{const d=STAGE_DEFS.catacomb;return{name:d.name,side:d.side,anvils:d.bells.length,kind:d.bellKind,ch:CHESTS.catacomb.length,hidden:CHESTS.catacomb.filter(c=>c.hidden).length,mimic:CHESTS.catacomb.filter(c=>c.mimic).length,
 lock:d.cages.filter(c=>c.lock==='cf_anvils').length,covers:d.covers.length,lore:d.lore.map(l=>l.id),high:d.oneway.filter(r=>r[1]===-60).length,low:d.carve.filter(r=>r[1]>=180).length,boss:d.boss.kind,phases:(d.boss.phases||[]).length+1,
 sig:SIGNATURE.smith,desc:['ashmaul','apron'].every(i=>DESC[i]&&DESC[i].length>=2),lorex:['f1','f2','f3'].every(i=>LORE[i]),secretItem:d.items.some(i=>i.item==='apron'&&i.y<-60),armor:!!ARMORS.apron}});
ok('forge_stage_defined_with_branches_secrets_collectibles',D.name==='THE BURNING CATACOMB FORGE'&&D.side&&D.anvils===5&&D.kind==='anvil'&&D.ch>=5&&D.hidden>=2&&D.mimic>=2&&D.lock===1&&D.covers>=3&&D.high>=3&&D.low>=3&&D.boss==='smith'&&D.phases===3&&D.sig==='ashmaul'&&D.desc&&D.lorex&&D.secretItem&&D.armor,D);
await shot('h01_catacomb_forge_start');
await ev(()=>{clear();tp(1003)});await wait(500);await ev(()=>hold({up:1},260));await wait(4200);await ev(()=>hold({up:1,r:1},40));await wait(1200);
const hi=await ev(()=>({y:Math.round(S().player.y),x:Math.round(S().player.x)}));await ev(()=>idle());
ok('high_route_gantry_by_chain',hi.y<=-56&&hi.y>-70,hi);await shot('h02_high_road_forge_gantry');
await ev(()=>tp(1150,300));await wait(700);const lo=await ev(()=>Math.round(S().player.y));ok('low_route_anvil_steps',lo>290,{lo});
// secret loft behind the cover: the apron + a hidden chest
await ev(()=>{tp(1370,-104)});await wait(800);const sec=await ev(()=>({cover:S().sv.found.some(f=>/gantry|_h/.test(f))||true,item:S().sv.picked.includes('h_apron'),inv:S().sv.inv.includes('apron')}));
ok('secret_loft_holds_apron',sec.item&&sec.inv,sec);
// ---------- 3. forge anvils struck with real attacks unseal the cage
const anv=await ev(()=>S().bells.map(b=>({id:b.id,x:b.x,y:b.y})));const struck=[];
for(const b of anv){await ev(b=>{clear();tp(b.x-10,b.y);S().player.f=1;S().player.st=999},b);await wait(450);await ev(()=>press('atkP'));await wait(600);struck.push(await ev(id=>S().bells.find(q=>q.id===id).rung,b.id))}
await shot('h03_forge_anvils_struck');
const ac=await ev(()=>({locked:S().cages.find(c=>c.id==='cf_anvilcage').locked,chDone:S().sv.chDone.includes('cf_anvils'),sv:S().sv.bells.filter(b=>/^anvil/.test(b)).length}));
ok('anvils_struck_unseal_cage',struck.every(Boolean)&&!ac.locked&&ac.chDone&&ac.sv===5,{struck,ac});
// ---------- 4. chests (one on a platform above the slag), mimic
await ev(()=>{clear();tp(808)});await wait(500);await ev(()=>press('restP'));await wait(900);
const c1=await ev(()=>({st:S().chests.find(c=>c.id==='ch_f1').st,saved:S().sv.chests.includes('ch_f1')}));
await ev(()=>{tp(1312,232)});await wait(500);await ev(()=>press('restP'));await wait(900);const c5=await ev(()=>S().chests.find(c=>c.id==='ch_f5').st);await shot('h04_forge_chest_loot');
ok('forge_chests_open_and_save',c1.st==='open'&&c1.saved&&c5==='open',{c1,c5});
await ev(()=>{clear();tp(2488);S().player.hp=S().player.hpMax=999});await wait(500);await ev(()=>{S().player.f=1;press('restP')});await wait(500);const mst=await ev(()=>S().chests.find(c=>c.id==='ch_f6').st);
await wait(1200);await shot('h05_forge_mimic');const inv0=await ev(()=>S().sv.inv.length);
for(let i=0;i<14;i++){const done=await ev(()=>{const s=S(),c=s.chests.find(c=>c.id==='ch_f6');if(c.st==='dead')return 1;tp(c.hx-20);s.player.f=1;s.player.st=999;press('atkP')});if(done)break;await wait(650)}
const md=await ev(inv0=>({st:S().chests.find(c=>c.id==='ch_f6').st,gear:S().drops.filter(d=>d.kind==='gear').map(d=>d.item).concat(S().sv.inv.slice(inv0))}),inv0);
ok('forge_mimic_wakes_dies_drops_gear',mst==='awake'&&md.st==='dead'&&md.gear.length>=1,{mst,md});
// persistence
await ev(()=>{S().sv.souls=S().souls;Save.write(S().sv)});await go('?play&continue&mute&slot=1');
const per=await ev(()=>({sid:S().sid,f1:S().chests.find(c=>c.id==='ch_f1').st,f6:S().chests.find(c=>c.id==='ch_f6').st,anvils:S().bells.filter(b=>b.rung).length,apron:S().sv.inv.includes('apron')}));
ok('forge_progress_persists',per.sid==='catacomb'&&per.f1==='open'&&per.f6==='dead'&&per.anvils===5&&per.apron,per);
// ---------- 5. the Ashwrought Smith: cinematic, phases, attacks, loft, signature maul, side-stage return
await ev(()=>{clear();const s=S();s.player.hp=s.player.hpMax=9999;s.pb.setPosition(3020,140);s.player.inv=999});
await A.pg.waitForFunction(()=>S().cine,null,{timeout:15000}).catch(()=>{});await wait(1300);await shot('h06_smith_intro_cinematic');
const cine=await ev(()=>({c:!!S().cine,kind:S().boss&&S().boss.kind,say:S().sayText||S().sayT||''}));
await wait(1000);await shot('h07_smith_name_card');
await A.pg.waitForFunction(()=>S().bossState==='fight',null,{timeout:15000}).catch(()=>{});await wait(400);
const atk=await ev(async()=>{const s=S(),B=s.boss,o={};const force=async(n,ms=1400)=>{B.state='walk';B.cd=-1;B.y=GY;s.pickLord=()=>n;await new Promise(r=>setTimeout(r,ms))};
  let fl=0;const of=s.flames.push.bind(s.flames);s.flames.push=(...a)=>{fl+=a.filter(f=>!f.ice).length;return of(...a)};
  let sh=[];const os=s.shots.push.bind(s.shots);s.shots.push=(...a)=>{sh.push(...a.map(q=>({...q})));return os(...a)};
  await force('bellows');o.bellows1=fl;fl=0;await force('anvil');o.ingots=sh.filter(q=>q.c==='fire'&&q.g&&q.vy<0).length;sh=[];
  B.hp=B.hpMax*.6;await new Promise(r=>setTimeout(r,400));o.p2=B.phase;await new Promise(r=>setTimeout(r,1500));fl=0;await force('bellows',1800);o.bellows2=fl;
  B.loftCd=-1;B.cd=-1;delete s.pickLord;B.state='walk';await new Promise(r=>setTimeout(r,1200));o.loft=B.state==='glide'||B.state==='perch'||B.y<GY;await new Promise(r=>setTimeout(r,1200));o.perchFire=sh.filter(q=>q.c==='fire').length;sh=[];
  B.hp=B.hpMax*.3;await new Promise(r=>setTimeout(r,400));o.p3=B.phase;await new Promise(r=>setTimeout(r,1500));await force('pour',1500);o.pour=sh.filter(q=>q.c==='fire'&&q.delay>0).length;
  s.flames.push=of;s.shots.push=os;delete s.pickLord;return o});
await shot('h08_smith_crucible_pour_phase3');
ok('smith_cinematic_and_three_phases',cine.c&&cine.kind==='smith'&&atk.p2===2&&atk.p3===3,{cine,atk});
ok('smith_attacks_bellows_ingots_loft_pour',atk.bellows1>=2&&atk.bellows2>=4&&atk.ingots>=3&&atk.loft&&atk.perchFire>=3&&atk.pour>=5,atk);
await ev(()=>{const s=S();s.boss.hp=1;s.damageBoss(5)});await A.pg.waitForFunction(()=>S().victory,null,{timeout:12000}).catch(()=>{});await wait(1200);await shot('h09_smith_slain_maul');
const vic=await ev(()=>({lords:S().sv.lords,inv:S().sv.inv.includes('ashmaul'),opts:S().victoryOpts(),hub:S().sv.hubNext}));
ok('smith_drops_signature_ashmaul',vic.lords.includes('smith')&&vic.inv,vic);
await ev(()=>{S().victory.t=2;S().victory.sel=0;S().victoryGo()});await A.pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage').sid==='shrine'&&__G.scene.getScene('stage').player,null,{timeout:12000}).catch(()=>{});await wait(900);
const back=await ev(()=>({sid:S().sid,hub:S().sv.hubNext}));
ok('forge_returns_to_shrine',vic.opts[0]==='RETURN TO THE ASH SHRINE'&&back.sid==='shrine'&&back.hub===vic.hub,{opts:vic.opts,back});
// ---------- 6. story ties: Ember Descent (barred -> open), keeper lines, ending line
const keeper=await ev(()=>{const s=S(),sv=s.sv,keep=[...sv.lords],o={};sv.lords=['warden','cantor'];o.sealed=s.keeperLines().join(' ');sv.lords=['warden','cantor','toller'];o.open=s.keeperLines().join(' ');sv.lords=keep;o.slain=s.keeperLines().join(' ');return o});
ok('keeper_speaks_of_the_forge',/WILL NOT WAKE WHILE THE BELLS/.test(keeper.sealed)&&/SMITH WHO MADE MY LANTERN/.test(keeper.open)&&/FORGE IS COLD/.test(keeper.slain),keeper);
const keep=await ev(()=>[...S().sv.lords]);
await ev(()=>{const s=S();s.sv.lords=['warden','cantor'];tp(STAGE_DEFS.shrine.descent.x);idle()});await wait(500);await shot('h11_ember_descent_barred');await ev(()=>press('restP'));await wait(900);const barred=await ev(()=>S().sid);
await ev(k=>{S().sv.lords=[...new Set([...k,'warden','cantor','toller'])]},keep);await wait(300);await shot('h12_ember_descent_open');await ev(()=>press('restP'));await A.pg.waitForFunction(()=>__G.scene.getScene('stage').sid==='catacomb'&&__G.scene.getScene('stage').player,null,{timeout:12000}).catch(()=>{});await wait(600);
const opened=await ev(()=>({sid:S().sid,bossDead:S().bossState==='dead'}));
ok('ember_descent_barred_then_opens_after_toller',barred==='shrine'&&opened.sid==='catacomb'&&opened.bossDead,{barred,opened});
// the maul: equippable, its forge special raises pillars
const maul=await ev(async()=>{const s=S();s.menu={mode:'equip',sel:0,t:1,prev:{}};for(let i=0;i<40&&s.sv.eq.main!=='ashmaul';i++)s.menuKey('right');s.menu=null;const P=s.player;P.fp=99;P.st=999;P.f=1;s.stats.specials=0;
  s.pb.setPosition(1000,148);P.state='idle';await new Promise(r=>setTimeout(r,400));let n=0;window.__inp=()=>(n++===0?{heavyP:1}:{});let cols=0;for(let i=0;i<20;i++){await new Promise(r=>setTimeout(r,60));cols=Math.max(cols,(s.forgeCols||[]).length)}window.__inp=()=>({});return{eq:s.sv.eq.main,sp:s.stats.specials,cols,name:WEAPONS.ashmaul.name}});
await shot('h10_ashmaul_forge_special');
ok('ashmaul_equippable_forge_special',maul.eq==='ashmaul'&&maul.sp===1&&maul.cols>=1,maul);
await A.pg.goto(B+'?mute&slot=1&ending=fade');await wait(9000);const endL=await ev(()=>__G.scene.getScene('ending').lines);await shot('h13_ending_forge_line');
ok('ending_mentions_the_forge',endL.some(s=>/LAST FORGE COOLED/.test(s)),endL);
await A.ctx.close();
// ---------- 7. co-op in the forge
const H=await mk(false);await H.pg.goto(B+'assets/README.md');await H.ev(()=>localStorage.clear());await H.go('?host&mute&stage=catacomb&class=knight');
await H.pg.waitForFunction(()=>NET.peer&&NET.peer.open,null,{timeout:20000}).catch(()=>{});const code=await H.ev(()=>NET.code);pages[await H.ev(()=>NET.peer.id)]=H.pg;
const G=await mk(false);await G.pg.goto(B+'assets/README.md');await G.ev(()=>localStorage.clear());await G.pg.goto(B+'?mute&class=pyromancer&join='+code);
await G.pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await wait(1500);
await G.ev(()=>{window.S=()=>__G.scene.getScene('stage');window.tp=(x,y=156)=>{const s=S();s.pb.setPosition(x,y-8);s.pb.setVelocity(0,0);s.player.inv=99;s.camY=s.camTY=y-156};window.press=k=>{let n=0;window.__inp=()=>(n++===0?{[k]:1}:{})}});
ok('coop_linked_in_catacomb_forge',await G.ev(()=>NET.linked()&&S().sid)==='catacomb',{});
await H.ev(()=>{clear();tp(780)});await G.ev(()=>{tp(240,36);S().player.f=1;S().player.st=999});await wait(500);await G.ev(()=>press('atkP'));await wait(1200);
const ca=[await H.ev(()=>S().bells.find(b=>b.id==='anvil1').rung),await G.ev(()=>S().bells.find(b=>b.id==='anvil1').rung)];
await G.ev(()=>tp(808));await wait(400);await G.ev(()=>press('restP'));await wait(1200);
const cc=await H.ev(()=>({st:S().chests.find(c=>c.id==='ch_f1').st,ids:S().drops.map(d=>d.id)}));const gc=await G.ev(()=>({st:S().chests.find(c=>c.id==='ch_f1').st,ids:S().drops.map(d=>d.id)}));
const gl=await G.ev(()=>S().sv.looted||0);// the guest may already have auto-picked a drop it was standing on
await H.shot('h14_coop_host_forge');await G.shot('h15_coop_guest_forge');
ok('coop_anvil_and_chest_host_authoritative',ca.every(Boolean)&&cc.st==='open'&&gc.st==='open'&&cc.ids.join()===gc.ids.join()&&cc.ids.length+gl>=1,{ca,cc,gc});
await G.ev(()=>{const s=S();s.drops.forEach(d=>d.t=1);const d=s.drops[0];if(d)tp(d.x,d.y)});await wait(1200);const gp=[await H.ev(()=>S().drops.length),await G.ev(()=>S().drops.length),await G.ev(()=>S().sv.looted||0)];
ok('coop_guest_picks_forge_loot',gp[0]<=cc.ids.length&&gp[1]===gp[0]&&gp[2]>=1,{gp});
await G.ev(()=>tp(2488));await H.ev(()=>tp(2420));await wait(400);await G.ev(()=>press('restP'));await wait(1500);
const mm=[await H.ev(()=>S().chests.find(c=>c.id==='ch_f6').st),await G.ev(()=>S().chests.find(c=>c.id==='ch_f6').st)];
for(let i=0;i<14;i++){const d=await G.ev(()=>{const s=S(),c=s.chests.find(c=>c.id==='ch_f6');if(c.st==='dead')return 1;tp(c.hx-20);s.player.f=1;s.player.st=999;s.player.hp=s.player.hpMax;press('atkP')});if(d)break;await wait(650)}await wait(800);
const mk2=[await H.ev(()=>S().chests.find(c=>c.id==='ch_f6').st),await G.ev(()=>S().chests.find(c=>c.id==='ch_f6').st)];
ok('coop_forge_mimic_mirrored',mm.every(s=>s==='awake')&&mk2.every(s=>s==='dead'),{mm,mk2});
await H.ev(()=>{clear();const s=S();s.player.hp=s.player.hpMax=9999;s.pb.setPosition(3020,140)});await G.ev(()=>{S().player.hp=S().player.hpMax=9999;S().pb.setPosition(2990,140)});
await H.pg.waitForFunction(()=>S().bossState==='fight',null,{timeout:15000}).catch(()=>{});await wait(600);
await H.ev(()=>{const s=S(),B=s.boss;B.state='walk';B.cd=-1;s.pickLord=()=>'bellows'});await wait(1100);
const gb=await G.ev(()=>({kind:S().boss&&S().boss.kind,fl:S().flames.length}));await G.shot('h16_coop_guest_smith_bellows');await H.ev(()=>{delete S().pickLord});
ok('coop_guest_sees_smith_and_bellows_fire',gb.kind==='smith'&&gb.fl>=1,gb);
await H.ev(()=>{const s=S();if(s.boss){s.boss.state='walk';s.boss.hp=1;s.damageBoss(5)}});await wait(2500);
const sg=[await H.ev(()=>S().sv.inv.includes('ashmaul')),await G.ev(()=>S().sv.inv.includes('ashmaul'))];
ok('coop_both_players_get_ashmaul',sg.every(Boolean),{sg});
await H.ctx.close();await G.ctx.close();
ok('no_errors',errs.length===0,errs);ok('only_peer_broker_traffic',[...ext].every(h=>/peerjs/.test(h)),[...ext]);
await br.close();
try{let s='';FR.forEach((t,i)=>{s+=`file '${VD}/${String(i).padStart(5,'0')}.jpg'\nduration ${Math.min(.5,((FR[i+1]||t+100)-t)/1000).toFixed(3)}\n`});fs.writeFileSync(VD+'/l.txt',s);
 execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i ${VD}/l.txt -vf "scale=640:360,fps=30" -t 45 -c:v libx264 -pix_fmt yuv420p -crf 27 clips/H.mp4`);console.error('clip ok')}catch(e){console.error('clip fail',e.message)}
console.log(JSON.stringify({pass,fail}));process.exit(fail?1:0);
