// Focused checks for the rings / in-level merchant / smith lane: two ring slots and every ring effect, merchant stock/buy/save,
// Ember Shards (sv.embers) shared by merchant + drops + lords, smith +1..+5 cost/persistence/attack, lord rings, and co-op (guest) ring sync.
// usage: node test/lane.mjs  (server on :8171; TMPV=private frame dir). Writes screenshots/lane/*.png and clips/lane.mp4
import { chromium } from 'playwright';import {execSync} from 'child_process';import fs from 'fs';
const B='http://127.0.0.1:8171/',SH='screenshots/lane/';
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const errs=[],ext=new Set();let pass=0,fail=0;const ok=(n,c,v)=>{c?pass++:fail++;console.error((c?'PASS ':'FAIL ')+n+' '+JSON.stringify(v).slice(0,500))};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const VD=''+(process.env.TMPV||'/tmp/lanevid')+'';fs.rmSync(VD,{recursive:true,force:true});const FR=[];
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
fs.mkdirSync(SH,{recursive:true});
const A=await mk(true);const{ev,go,shot}=A;
await A.pg.goto(B+'assets/README.md');await ev(()=>localStorage.clear());
// ---------- 1. ring data + two slots + effects through RPG.derive
await go('?play&mute&novideo&slot=1&class=knight&stage=catacomb');
const R=await ev(()=>{const s=S(),sv=s.sv,st=sv.stats,base={...sv.eq,ring1:null,ring2:null},d0=RPG.derive(st,base),w=(a,b)=>RPG.derive(st,{...base,ring1:a,ring2:b||null}),o={};
 
 o.hp=w('ember_signet').hp>d0.hp;o.abs=w('rime_band').abs>d0.abs;const c=w('choir_ring');o.fp=c.fp>=d0.fp+30&&c.spell>d0.spell;o.st=w('tide_loop').st>=d0.st+25;
 const t=w('thorn_ring');o.thorn=t.ar>d0.ar&&t.abs<d0.abs;o.soul=w('ashen_band').soulMul>d0.soulMul;o.iframe=w('star_seal').roll.i1>d0.roll.i1;o.poise=w('bell_ring').poise>d0.poise;
 const two=w('ember_signet','tide_loop');o.stack=two.hp>d0.hp&&two.st>=d0.st+25;
 o.art=Object.keys(RING_ART).every(k=>GEAR[k]&&GEAR[k].slot==='ring');o.stockOk=MERCH_STOCK.every(([id])=>id==='shard'||GEAR[id]||CONSUMABLES[id]);
 o.chestOk=Object.values(RING_CHEST).every(m=>Object.values(m).every(id=>GEAR[id]));o.bossOk=Object.values(RING_BOSS).every(id=>GEAR[id]);
 // the same ring cannot sit in both slots (equip list for ring2 excludes ring1's)
 sv.inv.push('ember_signet','tide_loop');sv.eq.ring1='ember_signet';s.menu={mode:'equip',sel:0,t:1,prev:{}};const L=s.invOpts('ring2');o.noDup=!L.includes('ember_signet')&&L.includes('tide_loop');s.menu=null;return o});
ok('ring_effects_all_feed_the_build',Object.entries(R).every(([k,v])=>v===true||v==='n/a'),R);
// ---------- 2. in-level merchant: present past the bonfire, buy shard + ring + consumable, saved
const M0=await ev(()=>{const s=S();clear();s.souls=s.sv.souls=9000;const m=s.merch;if(!m)return{m:false};tp(m.x-6,m.y);return{m:true,x:m.x,bx:s.bonfire.x}});await wait(300);
const M1=await ev(()=>{const s=S();const ok0=s.interact();const rows0=s.merchRows().map(r=>r[0]);const buy=id=>{s.menu.sel=s.merchRows().findIndex(r=>r[0]===id);s.menuKey('ok')};
 const e0=s.sv.embers||0,so0=s.souls;buy('shard');const e1=s.sv.embers,so1=s.souls;buy('ring_life');const inv=s.sv.inv.includes('ring_life'),gone=!s.merchRows().some(r=>r[0]==='ring_life');
 s.player.hp=10;const lt0=s.sv.looted||0;buy('ember');const hp=s.player.hp,lt=(s.sv.looted||0)-lt0;return{lt,open:ok0&&s.menu&&s.menu.mode==='lmerch',rows0,shard:e1===e0+1&&so1===so0-800,inv,gone,heal:hp>10,souls:s.souls}});
await shot('lane01_merchant');await ev(()=>{S().menu=null});
await go('?play&mute&novideo&slot=1&continue');const M2=await ev(()=>({emb:S().sv.embers,inv:S().sv.inv.includes('ring_life'),souls:S().souls}));
ok('merchant_in_level_buy_and_save',M0.m&&M0.x>M0.bx&&M1.open&&M1.shard&&M1.inv&&M1.gone&&M1.heal&&M1.lt===0&&M2.inv&&M2.emb>=1&&M2.souls===M1.souls,{M0,M1,M2});
// ---------- 3. Ember Shards from drops and lords add to the same sv.embers
const E=await ev(()=>{const s=S(),e0=s.sv.embers||0;s.takeDrop({kind:'embershard',x:s.player.x,y:s.player.y});const e1=s.sv.embers;const so=s.souls;return{drop:e1===e0+1,noSouls:s.souls===so,inTables:['common','elite','chest'].every(t=>DROP_TABLES[t].some(r=>r[0]==='embershard'))}});
ok('ember_shards_from_drops',E.drop&&E.inTables,E);
// ---------- 4. smith: +1..+5, cost table, refuses without shards/souls, persists, scales attack
await ev(()=>{const s=S();s.sv.stage='shrine';s.sv.souls=s.souls;Save.write(s.sv)});await go('?play&mute&novideo&slot=1&continue');
const SM=await ev(()=>{const s=S(),sv=s.sv,id=sv.eq.main,o={id,sid:s.sid};sv.embers=0;s.souls=sv.souls=0;o.noShards=s.smithUp(id);sv.embers=99;o.noSouls=s.smithUp(id);s.souls=sv.souls=99999;
 const ar0=s.build.ar;const e0=sv.embers,so0=s.souls;o.r=[];for(let i=0;i<6;i++)o.r.push(s.smithUp(id));o.lv=SMITH.lv(sv,id);o.spentE=e0-sv.embers;o.spentS=so0-s.souls;o.ar=+(s.build.ar/ar0).toFixed(2);
 o.costE=SMITH.COST.reduce((a,c)=>a+c[0],0);o.costS=SMITH.COST.reduce((a,c)=>a+c[1],0);
 tp(HOME_SMITH);return o});
await wait(400);SM.menu=await ev(()=>{const s=S();return s.interact()&&s.menu&&s.menu.mode});await wait(300);await shot('lane02_smith');await ev(()=>{S().menu=null});
await go('?play&mute&novideo&slot=1&continue');const SM2=await ev(id=>({lv:SMITH.lv(S().sv,id),ar:S().build.ar}),SM.id);
ok('smith_upgrades_cost_cap_and_persist',SM.noShards==='SHARDS'&&SM.noSouls==='SOULS'&&SM.r.join()==='OK,OK,OK,OK,OK,MAX'&&SM.lv===5&&SM.spentE===SM.costE&&SM.spentS===SM.costS&&SM.ar===1.5&&SM.menu==='smith'&&SM2.lv===5&&SM2.ar>0,{SM,SM2});
// ---------- 5. lord ring (solo): the Pale Cantor gives the choir ring + 2 shards
await go('?play&mute&slot=3&class=knight&stage=cathedral');
await ev(()=>{clear();const s=S();s.player.hp=s.player.hpMax=9999;s.pb.setPosition(3020,140);s.player.inv=999});
await A.pg.waitForFunction(()=>{const c=S().cine;if(c&&c.video)S().skipCine();return S().bossState==='fight'},null,{timeout:20000}).catch(()=>{});
const lr0=await ev(()=>S().sv.embers||0);await ev(()=>{const s=S();s.boss.hp=1;s.damageBoss(5)});await A.pg.waitForFunction(()=>S().victory,null,{timeout:40000}).catch(()=>{});
const LR=await ev(e0=>({ring:S().sv.inv.includes('choir_ring'),emb:(S().sv.embers||0)-e0}),lr0);await shot('lane03_lord_ring');
ok('lord_gives_ring_and_two_shards',LR.ring&&LR.emb===2,LR);
await A.ctx.close();
// ---------- 6. co-op: lord ring + shards reach the guest too; guest merchant buys are its own
const H=await mk(false);await H.pg.goto(B+'assets/README.md');await H.ev(()=>localStorage.clear());await H.go('?host&mute&stage=cathedral&class=knight');
await H.pg.waitForFunction(()=>NET.peer&&NET.peer.open,null,{timeout:20000}).catch(()=>{});const code=await H.ev(()=>NET.code);pages[await H.ev(()=>NET.peer.id)]=H.pg;
const G=await mk(false);await G.pg.goto(B+'assets/README.md');await G.ev(()=>localStorage.clear());await G.pg.goto(B+'?seed=0&mute&class=pyromancer&join='+code);
await G.pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await wait(1500);
await G.ev(()=>{window.S=()=>__G.scene.getScene('stage');window.tp=(x,y=156)=>{const s=S();s.pb.setPosition(x,y-8);s.pb.setVelocity(0,0);s.player.inv=99;s.camY=s.camTY=y-156}});
ok('coop_linked_in_cathedral',await G.ev(()=>NET.linked()&&S().sid)==='cathedral',{});
await G.ev(()=>{const m=S().merch;if(m)tp(m.x-6,m.y)});await wait(400);
const GM=await G.ev(()=>{const s=S(),m=s.merch;if(!m)return{m:false};s.souls=s.sv.souls=5000;if(!s.interact()||!s.menu)return{m:true,menu:false,px:s.player.x,mx:m.x};const e0=s.sv.embers||0;s.menu.sel=s.merchRows().findIndex(r=>r[0]==='shard');s.menuKey('ok');const r={m:true,emb:(s.sv.embers||0)-e0,souls:s.souls};s.menu=null;return r});
await wait(800);const HS=await H.ev(()=>({souls:S().souls,emb:S().sv.embers||0}));await G.shot('lane04_coop_guest_merchant');
ok('coop_guest_merchant_buy_is_local',GM.m&&GM.emb===1&&GM.souls===4200&&HS.emb===0,{GM,HS});
await H.ev(()=>{clear();const s=S();s.player.hp=s.player.hpMax=9999;s.pb.setPosition(3020,140)});await G.ev(()=>{S().player.hp=S().player.hpMax=9999;S().pb.setPosition(2990,140)});
await H.pg.waitForFunction(()=>{const c=S().cine;if(c&&c.video)S().skipCine();return S().bossState==='fight'},null,{timeout:25000}).catch(()=>{});await wait(800);
const ge0=await G.ev(()=>S().sv.embers||0),HE0=await H.ev(()=>S().sv.embers||0);
await H.ev(()=>{const s=S();if(s.boss){s.boss.state='walk';s.boss.hp=1;s.damageBoss(5)}});await wait(4500);
const he0=HE0;const CR=[await H.ev(e0=>({ring:S().sv.inv.includes('choir_ring'),w:S().sv.inv.includes('requiemspear'),emb:(S().sv.embers||0)-e0}),he0),await G.ev(e0=>({ring:S().sv.inv.includes('choir_ring'),w:S().sv.inv.includes('requiemspear'),emb:(S().sv.embers||0)-e0}),ge0)];
await G.shot('lane05_coop_guest_lord_ring');
ok('coop_both_players_get_lord_ring',CR[0].ring&&CR[1].ring&&CR[1].w,{CR});
ok('coop_each_player_keeps_two_lord_shards',CR[0].emb===2&&CR[1].emb===2,{CR});// decided: both players keep +2 per lord
await H.ctx.close();await G.ctx.close();
// ---------- 7. co-op ring chest + ring-holding mimic (catacomb: ch_f5 holds the EMBER SIGNET; the test stages ch_f4, a mimic, with the RIME BAND)
{const H=await mk(false);await H.pg.goto(B+'assets/README.md');await H.ev(()=>localStorage.clear());await H.go('?host&mute&stage=catacomb&class=knight');
await H.pg.waitForFunction(()=>NET.peer&&NET.peer.open,null,{timeout:20000}).catch(()=>{});const code=await H.ev(()=>NET.code);pages[await H.ev(()=>NET.peer.id)]=H.pg;
const G=await mk(false);await G.pg.goto(B+'assets/README.md');await G.ev(()=>localStorage.clear());await G.pg.goto(B+'?seed=0&mute&class=pyromancer&join='+code);
await G.pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await wait(1500);
await G.ev(()=>{window.S=()=>__G.scene.getScene('stage')});
const linked=await G.ev(()=>NET.linked()&&S().sid)==='catacomb';
await H.ev(()=>{clear();const s=S(),c=s.chests.find(c=>c.id==='ch_f5');c.mimic=0;s.openChest(c)});await wait(2500);
const RC=[await H.ev(()=>S().sv.inv.includes('ember_signet')),await G.ev(()=>({ring:S().sv.inv.includes('ember_signet'),st:S().chests.find(c=>c.id==='ch_f5').st}))];
ok('coop_ring_chest_both_players',linked&&RC[0]&&RC[1].ring,{linked,RC});
await H.ev(async()=>{const s=S();RING_CHEST.catacomb.ch_f4='rime_band';const c=s.chests.find(c=>c.id==='ch_f4');c.mimic=1;s.openChest(c);for(let i=0;i<30&&c.st!=='awake';i++)await new Promise(r=>setTimeout(r,100));for(let i=0;i<40&&c.st==='awake';i++){s.hitMimic(c,9999);await new Promise(r=>setTimeout(r,100))}});await wait(2500);
const RM=[await H.ev(()=>({ring:S().sv.inv.includes('rime_band'),st:S().chests.find(c=>c.id==='ch_f4').st})),await G.ev(()=>({ring:S().sv.inv.includes('rime_band'),st:S().chests.find(c=>c.id==='ch_f4').st}))];
await G.shot('lane06_coop_guest_mimic_ring');
ok('coop_ring_mimic_both_players',RM[0].ring&&RM[0].st==='dead'&&RM[1].ring,{RM});
await H.ctx.close();await G.ctx.close()}
ok('no_errors',errs.length===0,errs);
try{let s='';FR.forEach((t,i)=>{s+=`file '${VD}/${String(i).padStart(5,'0')}.jpg'\nduration ${Math.min(.5,((FR[i+1]||t+100)-t)/1000).toFixed(3)}\n`});fs.writeFileSync(VD+'/l.txt',s);
 execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i ${VD}/l.txt -vf "scale=640:360,fps=30" -t 45 -c:v libx264 -pix_fmt yuv420p -crf 27 clips/lane.mp4`);console.error('clip ok')}catch(e){console.error('clip fail',e.message)}
console.log(JSON.stringify({pass,fail}));process.exit(fail?1:0);
