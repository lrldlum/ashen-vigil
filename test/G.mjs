// Headless checks for milestone G: THE FROZEN BELL TOWER (branching routes, frozen bells, secrets, Rimebound Toller lord with cinematic + 3 phases,
// story ties to hub/keeper/endings) + loot (weighted drop tables, chests, hidden chests, mimics, consumables with pickup effects) + lord signature
// weapons for all four lords. Co-op checks run two contexts (rooms on the real PeerJS broker; data channel via the test-only relay, see milestoneF.mjs).
// usage: node test/G.mjs   (server on :8171). Writes screenshots/G/after/*.png and clips/G.mp4
import { chromium } from 'playwright';import {execSync} from 'child_process';import fs from 'fs';
const B='http://127.0.0.1:8171/',SH='screenshots/G/after/';
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const errs=[],ext=new Set();let pass=0,fail=0;const ok=(n,c,v)=>{c?pass++:fail++;console.error((c?'PASS ':'FAIL ')+n+' '+JSON.stringify(v).slice(0,500))};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const VD='/tmp/gvid';fs.rmSync(VD,{recursive:true,force:true});const FR=[];
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
await A.pg.goto(B+'assets/README.md');await ev(()=>localStorage.clear());
// ---------- 1. stage data: routes, secrets, collectibles, story
await go('?play&mute&novideo&slot=1&class=knight&stage=belltower');
const D=await ev(()=>{const d=STAGE_DEFS.belltower;return{name:d.name,side:d.side,bells:d.bells.length,ch:CHESTS.belltower.length,hidden:CHESTS.belltower.filter(c=>c.hidden).length,mimic:CHESTS.belltower.filter(c=>c.mimic).length,
 lock:d.cages.filter(c=>c.lock==='bt_bells').length,covers:d.covers.length,lore:d.lore.map(l=>l.id),high:d.oneway.filter(r=>r[1]===-60).length,low:d.carve.filter(r=>r[1]>=180).length,boss:d.boss.kind,lords:(d.boss.phases||[]).length+1,
 desc:['clapper','rime','frostbrand','requiemspear','crownbreaker','ember','bluesap','soulshard','rimesalt','cinderleaf'].every(i=>DESC[i]&&DESC[i].length>=2),lorex:['b1','b2','b3'].every(i=>LORE[i])}});
ok('stage_defined_with_branches_secrets_collectibles',D.name==='THE FROZEN BELL TOWER'&&D.bells===5&&D.ch>=4&&D.hidden>=2&&D.mimic>=1&&D.lock===1&&D.covers>=4&&D.high>=3&&D.low>=3&&D.boss==='toller'&&D.lords===3&&D.desc&&D.lorex&&D.lore.length>=3,/*Bell Tower region adds the belfry lore b4*/D);
await shot('g01_bell_tower_start');
// high road: climb the chain at x1000 with real input to the bell frame (-60)
await ev(()=>{clear();tp(1003)});await wait(500);await ev(()=>hold({up:1},260));await wait(4200);await ev(()=>hold({up:1,r:1},40));await wait(1200);
const hi=await ev(()=>({y:Math.round(S().player.y),x:Math.round(S().player.x)}));await ev(()=>idle());
ok('high_route_reachable_by_chain',hi.y<=-56&&hi.y>-70,hi);await shot('g02_high_road_bell_frame');
// low road: drop into the frozen crypt
await ev(()=>tp(470,300));await wait(700);const lo=await ev(()=>Math.round(S().player.y));ok('low_route_crypt',lo>290,{lo});
// ---------- 2. frozen bells (struck with real attacks) unlock the bell cage
const bells=await ev(()=>S().bells.map(b=>({id:b.id,x:b.x,y:b.y})));const rung=[];
for(const b of bells){await ev(b=>{tp(b.x-10,b.y);S().player.f=1;S().player.st=999},b);await wait(450);await ev(()=>press('atkP'));await wait(600);rung.push(await ev(id=>S().bells.find(q=>q.id===id).rung,b.id))}
await shot('g03_frozen_bell_rung');
const bc=await ev(()=>({locked:S().cages.find(c=>c.id==='bt_bellcage').locked,chDone:S().sv.chDone.includes('bt_bells'),sv:S().sv.bells.length}));
ok('bells_rung_by_attacks_unseal_cage',rung.every(Boolean)&&!bc.locked&&bc.chDone&&bc.sv===5,{rung,bc});
// ---------- 3. chests: open by UP, loot falls, pickup effects, persistence
await ev(()=>{clear();const s=S();s.player.hp=40;tp(808)});await wait(500);const ch0=await ev(()=>S().drops.length);await ev(()=>press('restP'));await wait(900);
const cs=await ev(()=>{const c=S().chests.find(c=>c.id==='ch_b1');return{st:c.st,drops:S().drops.map(d=>d.kind),got:S().sv.looted||0,saved:S().sv.chests.includes('ch_b1')}});await shot('g04_chest_opened_loot');
await ev(()=>{const s=S();for(const d of s.drops){d.t=1}if(s.drops[0])tp(s.drops[0].x)});await wait(300);for(let i=0;i<3;i++){await ev(()=>{const s=S();if(s.drops[0])tp(s.drops[0].x,s.drops[0].y)});await wait(350)}
const after=await ev(()=>({left:S().drops.length,looted:S().sv.looted||0}));
ok('chest_opens_drops_loot_and_saves',cs.st==='open'&&cs.drops.length+cs.got>=2&&cs.saved&&after.looted>=2,{ch0,cs,after});
// every consumable's pickup effect (and its burst)
const fx=await ev(async()=>{const s=S(),P=s.player,o={};for(const k of Object.keys(CONSUMABLES)){P.hp=10;P.fp=0;const so=s.souls;s.buffs={guard:0,stam:0};const d=s.spawnDrop(k,null,P.x,P.y);d.t=1;d.rest=1;d.y=P.y;
  await new Promise(r=>setTimeout(r,250));o[k]={hp:P.hp>10,fp:P.fp>0,souls:s.souls-so,guard:s.buffs.guard>0,stam:s.buffs.stam>0,burst:!!s.burst||1}}return o});
ok('consumables_apply_on_pickup',fx.ember.hp&&fx.bluesap.fp&&fx.soulshard.souls>=150&&fx.rimesalt.guard&&fx.cinderleaf.stam,fx);
// rime salt really reduces damage
const red=await ev(()=>{const s=S(),P=s.player;s.buffs.guard=0;P.inv=0;P.hp=200;P.hpMax=200;s.hurtPlayer(20,P.x+10);const a=200-P.hp;P.inv=0;P.state='idle';P.hp=200;s.buffs.guard=10;s.hurtPlayer(20,P.x+10);const b=200-P.hp;return{a,b}});
ok('rime_salt_guard_buff',red.b<red.a,red);
// ---------- 4. mimic: opens with teeth, hops and bites, dies to hits, drops gear
await ev(()=>{clear();tp(2488);S().player.hp=S().player.hpMax=999});await wait(500);await ev(()=>{S().player.f=1;press('restP')});await wait(500);const mst=await ev(()=>S().chests.find(c=>c.id==='ch_b5').st);
await wait(1500);await shot('g05_mimic_awake');await wait(1500);const bit=await ev(()=>S().player.hp<999||(S().chests.find(c=>c.id==='ch_b5').bites||0)>0);
const inv0=await ev(()=>S().sv.inv.length);
for(let i=0;i<14;i++){const done=await ev(()=>{const s=S(),c=s.chests.find(c=>c.id==='ch_b5');if(c.st==='dead')return 1;tp(c.hx-20);s.player.f=1;s.player.st=999;press('atkP')});if(done)break;await wait(650)}
const md=await ev(inv0=>({st:S().chests.find(c=>c.id==='ch_b5').st,gear:S().drops.filter(d=>d.kind==='gear').map(d=>d.item).concat(S().sv.inv.slice(inv0))}),inv0);
ok('mimic_wakes_bites_dies_drops_gear',mst==='awake'&&bit&&md.st==='dead'&&md.gear.length>=1,{mst,bit,md});
await ev(()=>{const s=S(),d=s.drops.find(d=>d.kind==='gear');if(d){d.t=1;tp(d.x,d.y)}});await wait(500);const inv1=await ev(()=>S().sv.inv);
ok('gear_drop_added_to_inventory',inv1.length>inv0&&inv1.includes(md.gear[0]),{inv0,add:md.gear[0]});
// ---------- 5. weighted drop tables + monsters dropping loot
const st=await ev(()=>{const o={};for(const t of Object.keys(DROP_TABLES)){const c={};for(let i=0;i<20000;i++){const k=rollTable(t);c[k]=(c[k]||0)+1}const tot=DROP_TABLES[t].reduce((a,[,w])=>a+w,0);o[t]=DROP_TABLES[t].map(([k,w])=>Math.abs(c[k]/20000-w/tot)).every(x=>x<.015)}return o});
const md2=await ev(async()=>{const s=S();s.drops.length=0;const kinds={};for(let i=0;i<60;i++){const e=s.spawnEnemy(i%3?'acolyte':'sentinel',s.player.x+40,156);e.temp=1;s.damageEnemy(e,999,1)}await new Promise(r=>setTimeout(r,300));for(const d of s.drops)kinds[d.kind]=(kinds[d.kind]||0)+1;return{n:s.drops.length,kinds}});
ok('weighted_tables_and_monster_drops',Object.values(st).every(Boolean)&&md2.n>=10&&Object.keys(md2.kinds).length>=3,{st,md2});
await shot('g06_monster_loot_drops');
// ---------- 6. persistence: chests stay open, bells stay rung, loot kept, after a reload
await ev(()=>{S().sv.souls=S().souls;Save.write(S().sv)});await go('?play&continue&mute&slot=1');
const per=await ev(g=>({sid:S().sid,b1:S().chests.find(c=>c.id==='ch_b1').st,b5:S().chests.find(c=>c.id==='ch_b5').st,bells:S().bells.filter(b=>b.rung).length,gear:S().sv.inv.includes(g)}),md.gear[0]);
ok('loot_and_chests_persist_in_save_slot',per.sid==='belltower'&&per.b1==='open'&&per.b5==='dead'&&per.bells===5&&per.gear,per);
// ---------- 7. the Rimebound Toller: cinematic, phases, tolls / icicles / peal, signature weapon, side-stage return
await ev(()=>{clear();const s=S();s.player.hp=s.player.hpMax=9999;s.pb.setPosition(3020,140);s.player.inv=999});
await A.pg.waitForFunction(()=>S().cine,null,{timeout:15000}).catch(()=>{});await wait(1300);await shot('g07_toller_intro_cinematic');const cine=await ev(()=>({c:!!S().cine,kind:S().boss&&S().boss.kind}));
await A.pg.waitForFunction(()=>S().bossState==='fight',null,{timeout:15000}).catch(()=>{});await wait(400);
const atk=await ev(async()=>{const s=S(),B=s.boss,o={};const force=async n=>{B.state='walk';B.cd=-1;s.pickLord=()=>n;await new Promise(r=>setTimeout(r,1400))};
  {let n=0;const ob0=s.flames.push.bind(s.flames);s.flames.push=(...a)=>{n+=a.filter(f=>f.ice).length;return ob0(...a)};await force('toll');s.flames.push=ob0;o.toll=n}await force('requiem');o.ice=s.shots.filter(q=>q.c==='ice').length;
  const ph=async n=>{for(let i=0;i<40&&B.phase<n;i++)await new Promise(r=>setTimeout(r,100));return B.phase};// poll (up to 4 s) instead of a fixed 400 ms: under load the phase change can land late
  B.hp=B.hpMax*.6;o.p2=await ph(2);await new Promise(r=>setTimeout(r,1500));B.hp=B.hpMax*.3;o.p3=await ph(3);await new Promise(r=>setTimeout(r,1500));
  let tolls=0;const ob=s.flames.push.bind(s.flames);s.flames.push=(...a)=>{tolls+=a.length;return ob(...a)};for(let i=0;i<50&&(B.state==='roar'||B.state==='cast'||B.state==='wind');i++)await new Promise(r=>setTimeout(r,100));// let the phase-3 roar / any cast finish so the forced pick is taken
  tolls=0;await force('peal');for(let i=0;i<60&&tolls<6;i++)await new Promise(r=>setTimeout(r,100));o.peal=tolls;o.pealState=B.state;delete s.pickLord;return o});
await shot('g08_toller_peal_phase3');
ok('toller_cinematic_and_three_phases',cine.c&&cine.kind==='toller'&&atk.p2===2&&atk.p3===3,{cine,atk});
ok('toller_attacks_toll_icicles_peal',atk.toll>=2&&atk.ice>=5&&atk.peal>=6,atk);
await ev(()=>{const s=S();s.boss.hp=1;s.damageBoss(5)});await A.pg.waitForFunction(()=>S().victory,null,{timeout:40000}).catch(()=>{});await wait(1200);await shot('g09_toller_slain_signature');
const vic=await ev(()=>({lords:S().sv.lords,inv:S().sv.inv.includes('clapper'),opts:S().victoryOpts(),hub:S().sv.hubNext}));
ok('toller_drops_signature_clapper',vic.lords.includes('toller')&&vic.inv,vic);
await ev(()=>{S().victory.t=2;S().victory.sel=0;S().victoryGo()});await A.pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage').sid==='shrine'&&__G.scene.getScene('stage').player,null,{timeout:12000}).catch(()=>{});await wait(900);
const back=await ev(()=>({sid:S().sid,hub:S().sv.hubNext}));
ok('side_stage_returns_to_shrine',vic.opts[0]==='RETURN TO THE ASH SHRINE'&&back.sid==='shrine'&&back.hub===vic.hub,{opts:vic.opts,back});
// ---------- 8. story ties: frozen stair (sealed -> open), keeper lines, ending line
const keeper=await ev(()=>{const s=S(),sv=s.sv,keep=[...sv.lords],o={};sv.lords=[];o.sealed=s.keeperLines().join(' ');sv.lords=['warden','cantor'];o.open=s.keeperLines().join(' ');sv.lords=keep;o.slain=s.keeperLines().join(' ');return o});
ok('keeper_speaks_of_the_bell_tower',/OPENS WHEN THE CHOIR/.test(keeper.sealed)&&/FROZEN STAIR IS OPEN/.test(keeper.open)&&/BELLS ARE QUIET/.test(keeper.slain),keeper);
await ev(()=>{const s=S();s.sv.lords=[];tp(STAGE_DEFS.shrine.stair.x);idle()});await wait(500);await ev(()=>press('restP'));await wait(900);const sealed=await ev(()=>({sid:S().sid,say:S().sayT||S().sayText||''}));await shot('g10_frozen_stair_sealed');
await ev(()=>{const s=S();s.sv.lords=['warden','cantor','toller']});await wait(200);await ev(()=>press('restP'));await A.pg.waitForFunction(()=>__G.scene.getScene('stage').sid==='belltower'&&__G.scene.getScene('stage').player,null,{timeout:12000}).catch(()=>{});await wait(600);
const opened=await ev(()=>({sid:S().sid,bossDead:S().bossState==='dead'}));
ok('frozen_stair_sealed_then_opens_after_cantor',sealed.sid==='shrine'&&opened.sid==='belltower'&&opened.bossDead,{sealed,opened});
await A.pg.goto(B+'?seed=0&mute&slot=1&ending=rekindle');await wait(9000);const endL=await ev(()=>__G.scene.getScene('ending').lines);await shot('g11_ending_bell_line');
ok('ending_mentions_the_bell',endL.some(s=>/ONE BELL TOLLED/.test(s)),endL);
// ---------- 9. signature weapons from ALL lords (real kills), equippable, heavy special attacks
const sig={};
for(const[stage,kind,w]of[['ramparts','warden','frostbrand'],['cathedral','cantor','requiemspear'],['cinderdeep','king','crownbreaker']]){
 await go(`?play&mute&novideo&slot=2&class=knight&stage=${stage}`);await ev(()=>{clear();const s=S();s.player.hp=s.player.hpMax=9999;s.pb.setPosition(3020,140);s.player.inv=999});
 await A.pg.waitForFunction(()=>S().bossState==='fight',null,{timeout:15000}).catch(()=>{});await ev(()=>{const s=S();s.boss.hp=1;s.damageBoss(5)});await A.pg.waitForFunction(()=>S().victory,null,{timeout:40000}).catch(()=>{});
 sig[kind]=await ev(w=>S().sv.inv.includes(w),w)}
await go('?play&mute&novideo&slot=2&continue');
const spec=await ev(async()=>{const s=S(),o={};s.menu=null;for(const w of['frostbrand','requiemspear','crownbreaker','clapper']){if(!s.sv.inv.includes(w))s.sv.inv.push(w);s.menu={mode:'equip',sel:0,t:1,prev:{}};for(let i=0;i<30&&s.sv.eq.main!==w;i++)s.menuKey('right');s.menu=null;
  const P=s.player;P.st=999;P.fp=P.fpMax=99;P.spCd=0;s.stats.specials=0;const e=s.spawnEnemy('acolyte',P.x+30,156);e.hp=999;e.temp=1;e.cd=99;e.state='idle';const h=e.hp,fp=P.fp;P.f=1;P.state='idle';
  for(let k=0;k<3&&s.stats.specials===0;k++){// r12: retry if a stray hit or a frame hitch interrupted the wind-up
   s.shots.length=0;s.flames=[];P.inv=3;P.spCd=0;P.fp=99;P.state='idle';P.t=0;let n=0;window.__inp=()=>(n++===0?{heavyP:1}:{});await new Promise(r=>setTimeout(r,1500));window.__inp=()=>({})}
  o[w]={eq:s.sv.eq.main===w,special:s.stats.specials,dmg:+(h-e.hp).toFixed(1),fp:fp-P.fp,spFp:WEAPONS[w].spFp,name:WEAPONS[w].name};e.dead=true;e.b.body.enable=false}return o});
ok('every_lord_drops_signature_weapon',sig.warden&&sig.cantor&&sig.king&&vic.inv,sig);
ok('signature_weapons_equippable_with_specials',Object.values(spec).every(o=>o.eq&&o.special===1&&o.dmg>0&&o.fp>=o.spFp*.5),spec);
await ev(()=>{const s=S(),P=s.player;s.spawnEnemy('acolyte',P.x+40,156).temp=1;P.fp=99;P.st=999;press('heavyP')});await wait(500);await shot('g12_signature_special_toll');
await A.ctx.close();
// ---------- 10. co-op: host-authoritative bells, chests, drops, mimics, boss signature for both
const H=await mk(false);await H.pg.goto(B+'assets/README.md');await H.ev(()=>localStorage.clear());await H.go('?host&mute&novideo&stage=belltower&class=knight');
await H.pg.waitForFunction(()=>NET.peer&&NET.peer.open,null,{timeout:20000}).catch(()=>{});const code=await H.ev(()=>NET.code);pages[await H.ev(()=>NET.peer.id)]=H.pg;
const G=await mk(false);await G.pg.goto(B+'assets/README.md');await G.ev(()=>localStorage.clear());await G.pg.goto(B+'?seed=0&mute&class=pyromancer&join='+code);
await G.pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await wait(1500);
await G.ev(()=>{window.S=()=>__G.scene.getScene('stage');window.tp=(x,y=156)=>{const s=S();s.pb.setPosition(x,y-8);s.pb.setVelocity(0,0);s.player.inv=99;s.camY=s.camTY=y-156};window.press=k=>{let n=0;window.__inp=()=>(n++===0?{[k]:1}:{})}});
ok('coop_linked_in_bell_tower',await G.ev(()=>NET.linked()&&S().sid)==='belltower',{});
await H.ev(()=>{clear();tp(780)});await G.ev(()=>{tp(232,36);S().player.f=1;S().player.st=999});await wait(500);await G.ev(()=>press('atkP'));await wait(1200);
const cb=[await H.ev(()=>S().bells.find(b=>b.id==='bell1').rung),await G.ev(()=>S().bells.find(b=>b.id==='bell1').rung)];
await G.ev(()=>tp(808));await wait(400);await G.ev(()=>press('restP'));await wait(1200);
const cc=await H.ev(()=>({st:S().chests.find(c=>c.id==='ch_b1').st,ids:S().drops.map(d=>d.id)}));const gc=await G.ev(()=>({st:S().chests.find(c=>c.id==='ch_b1').st,ids:S().drops.map(d=>d.id)}));
const gl=await G.ev(()=>S().sv.looted||0);// the guest may already have auto-picked a drop it was standing on
await H.shot('g13_coop_host_chest');await G.shot('g14_coop_guest_chest');
ok('coop_bell_and_chest_host_authoritative',cb.every(Boolean)&&cc.st==='open'&&gc.st==='open'&&cc.ids.join()===gc.ids.join()&&cc.ids.length+gl>=2,{cb,cc,gc});
await G.ev(()=>{const s=S();s.drops.forEach(d=>d.t=1);const d=s.drops[0];tp(d.x,d.y)});await wait(1200);const gp=[await H.ev(()=>S().drops.length),await G.ev(()=>S().drops.length),await G.ev(()=>S().sv.looted||0)];
ok('coop_guest_picks_drop_removed_on_both',gp[0]<=cc.ids.length&&gp[1]===gp[0]&&gp[2]>=1,{gp});
const kd=await H.ev(async()=>{const s=S();s.drops.length=0;const e=s.spawnEnemy('sentinel',s.player.x+30,156);e.temp=1;let tries=0;while(!s.drops.length&&tries<40){const e2=s.spawnEnemy('sentinel',s.player.x+30,156);e2.temp=1;s.damageEnemy(e2,999,1);tries++}return s.drops.map(d=>d.id)});await wait(800);
const kg=await G.ev(()=>S().drops.map(d=>d.id));ok('coop_monster_drop_synced',kd.length>=1&&kd.every(i=>kg.includes(i)),{kd,kg});
await G.ev(()=>tp(2488));await H.ev(()=>tp(2420));await wait(400);await G.ev(()=>press('restP'));await wait(1500);
const mm=[await H.ev(()=>S().chests.find(c=>c.id==='ch_b5').st),await G.ev(()=>S().chests.find(c=>c.id==='ch_b5').st)];
for(let i=0;i<14;i++){const d=await G.ev(()=>{const s=S(),c=s.chests.find(c=>c.id==='ch_b5');if(c.st==='dead')return 1;tp(c.hx-14);s.player.f=1;s.player.st=999;s.player.hp=s.player.hpMax;press('atkP')});if(d)break;await wait(650)}await wait(800);
const mk2=[await H.ev(()=>S().chests.find(c=>c.id==='ch_b5').st),await G.ev(()=>S().chests.find(c=>c.id==='ch_b5').st)];
ok('coop_mimic_mirrored_and_killed_by_guest',mm[0]==='awake'&&mm[1]==='awake'&&mk2[0]==='dead'&&mk2[1]==='dead',{mm,mk2});
await H.ev(()=>{clear();const s=S();s.player.hp=s.player.hpMax=9999;s.pb.setPosition(3020,140)});await G.ev(()=>{S().player.hp=S().player.hpMax=9999;S().pb.setPosition(2990,140)});
await H.pg.waitForFunction(()=>S().bossState==='fight',null,{timeout:15000}).catch(()=>{});await wait(800);await H.ev(()=>{const s=S();if(s.boss){s.boss.state='walk';s.boss.hp=1;s.damageBoss(5)}});await wait(2500);
const sg=[await H.ev(()=>S().sv.inv.includes('clapper')),await G.ev(()=>S().sv.inv.includes('clapper'))];await H.shot('g15_coop_toller_slain');
ok('coop_both_players_get_signature_weapon',sg.every(Boolean),{sg});
await H.ctx.close();await G.ctx.close();
ok('no_errors',errs.length===0,errs);ok('only_peer_broker_traffic',[...ext].every(h=>/peerjs/.test(h)),[...ext]);
await br.close();
try{let s='';const T0=FR[0];FR.forEach((t,i)=>{s+=`file '${VD}/${String(i).padStart(5,'0')}.jpg'\nduration ${Math.min(.5,((FR[i+1]||t+100)-t)/1000).toFixed(3)}\n`});fs.writeFileSync(VD+'/l.txt',s);
 execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i ${VD}/l.txt -vf "scale=640:360,fps=30" -t 45 -c:v libx264 -pix_fmt yuv420p -crf 27 clips/G.mp4`);console.error('clip ok')}catch(e){console.error('clip fail',e.message)}
console.log(JSON.stringify({pass,fail}));process.exit(fail?1:0);
