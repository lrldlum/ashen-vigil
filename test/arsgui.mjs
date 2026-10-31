// Arsenal GUI checks (r10b): the three regen rings (Second Wind = stamina, Deep Well = FP, Mending Ember = HP): rates, shop + price,
// placeholder icon, equip GUI, co-op, save/load, NG+; inventory any time (Tab / I / pad View): solo pause mid-combat and in the boss room,
// equip swap applies at once, co-op world keeps running. usage: node test/arsgui.mjs (server :8171; TMPV=frame dir)
// Writes screenshots/arsenal/ring_*.png, ars15_inventory_midlevel.png, clips/arsgui.mp4, clips/arsgui_rings.mp4
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
// ---------- 1. ring rates (solo), recorded for ring_regen_compare.mp4
mark('rings');
const RR=await ev(async()=>{const s=S(),sv=s.sv,P=s.player,o={},sl=ms=>new Promise(r=>setTimeout(r,ms));kill();P.hp=P.hpMax=99999;equip('longsword');window.__inp=()=>({});
 for(const id of Object.keys(ARS.RRING))sv.inv.includes(id)||sv.inv.push(id);
 const on=r=>{sv.eq.ring1=r;s.applyBuild(false);P.hpMax=99999};
 const stR=async r=>{on(r);tp(250);await sl(200);P.st=10;P.stDelay=0;await sl(50);const a=P.st,t0=s.t;await sl(800);const g=(P.st-a)/Math.max(.1,s.t-t0);P.st=P.stMax;s.spend(20);const d=P.stDelay;P.stDelay=0;P.st=P.stMax;return{gain:+g.toFixed(1),delay:+d.toFixed(3)}};
 const fpR=async r=>{on(r);await sl(100);P.fp=0;await sl(50);const a=P.fp,t0=s.t;await sl(1000);const g=(P.fp-a)/Math.max(.1,s.t-t0);P.fp=P.fpMax;return+g.toFixed(2)};
 const hpR=async r=>{on(r);await sl(100);P.hpMax=99999;P.hp=100;await sl(50);const a=P.hp,t0=s.t;await sl(1000);const g=(P.hp-a)/Math.max(.1,s.t-t0);return+g.toFixed(2)};
 o.st=[await stR(null),await stR('second_wind')];o.fp=[await fpR(null),await fpR('deep_well')];o.hp=[await hpR(null),await hpR('mending_ember')];
 o.shop=Object.keys(ARS.RRING).map(id=>{const r=MERCH_STOCK.find(r=>r[0]===id);return[id,r&&r[1],s.textures.exists('ring_'+id),GEAR[id]&&GEAR[id].slot]});
 on(null);P.hp=P.hpMax=s.build&&s.build.hpMax||P.hp;s.applyBuild(true);return o});
mark('rings',1);
ok('ring_second_wind_regen_35_and_delay_30',RR.st[1].gain>=RR.st[0].gain*1.3&&RR.st[1].gain<=RR.st[0].gain*1.4&&Math.abs(RR.st[1].delay-RR.st[0].delay*.7)<.01,RR.st);
ok('ring_deep_well_fp_regen_75',RR.fp[0]>0&&RR.fp[1]>=RR.fp[0]*1.65&&RR.fp[1]<=RR.fp[0]*1.85,RR.fp);
ok('ring_mending_ember_hp_0_8_per_s',Math.abs(RR.hp[0])<.05&&RR.hp[1]>=.7&&RR.hp[1]<=.9,RR.hp);
ok('rings_sold_at_price_with_icon',JSON.stringify(RR.shop.map(r=>[r[1],r[2],r[3]]))===JSON.stringify([[1600,true,'ring'],[1800,true,'ring'],[2200,true,'ring']]),RR.shop);
// ---------- 2. shop: rings listed by the wandering merchant, bought through the menu
const BUY=await ev(async()=>{const s=S(),sv=s.sv,sl=ms=>new Promise(r=>setTimeout(r,ms));delete window.__inp;sv.inv=sv.inv.filter(i=>!ARS.RRING[i]);s.souls=sv.souls=9000;clear();if(!s.merch)return{nomerch:1};
 s.menu={mode:'lmerch',sel:0,t:1,prev:{}};await sl(100);const i=s.shopRows().findIndex(r=>r.id==='second_wind');s.menu.sel=i;s.shopClamp(true);await sl(250);return{i,ids:s.shopRows().map(r=>r.id).filter(id=>ARS.RRING[id])}});
await shot('ring_shop');
const BUY2=await ev(async()=>{const s=S(),sv=s.sv,sl=ms=>new Promise(r=>setTimeout(r,ms));const a=s.souls;s.menuKey('ok');await sl(200);if(s.menu&&s.menu.confirm)s.menuKey('ok');await sl(200);return{paid:a-s.souls,has:sv.inv.includes('second_wind')}});
await ev(()=>{const s=S();s.menu=null});
ok('rings_in_wandering_merchant_and_buy_second_wind',BUY.ids&&BUY.ids.length===3&&BUY2.paid===1600&&BUY2.has,{BUY,BUY2});
// ---------- 3. equip GUI: equip through the inventory menu ring slot
const EQ=await ev(async()=>{const s=S(),sv=s.sv,sl=ms=>new Promise(r=>setTimeout(r,ms));sv.eq.ring1=sv.eq.ring2=null;s.applyBuild(false);s.arsInvToggle();await sl(200);if(!s.menu)return{nomenu:1};
 const M=s.menu,path=[];for(let n=0;n<8&&M.slot!==2;n++){s.menuKey('down');path.push(M.slot);await sl(60)}if(M.slot!==2)return{noslot:path};s.menuKey('ok');await sl(80);
 const o=s.invOpts('ring1'),want=o.indexOf('second_wind');for(let n=0;n<40&&M.gi!==want;n++){s.menuKey(M.gi<want?'right':'left');await sl(40)}const gi=M.gi;s.menuKey('ok');await sl(250);
 return{r1:sv.eq.ring1,want,gi,sw:s.arsSW(),mode:s.menu&&s.menu.mode,focus:s.menu&&s.menu.focus}});
await shot('ring_equipped');
await ev(async()=>{const s=S();if(s.menu&&s.arsInvOpen)s.arsInvToggle();s.menu=null;s.arsInvOpen=false;if(s.physics.world.isPaused)s.physics.resume();await new Promise(r=>setTimeout(r,150))});
ok('ring_equips_via_inventory_gui',EQ.r1==='second_wind'&&EQ.sw,EQ);
await ev(()=>{const s=S();s.sv.eq.ring1=s.sv.eq.ring2=null;s.applyBuild(false)});
// ---------- 4. inventory any time (solo)
const INV=await ev(async()=>{const s=S(),sv=s.sv,P=s.player,sl=ms=>new Promise(r=>setTimeout(r,ms));delete window.__inp;kill();tp(250);P.hp=P.hpMax;P.inv=0;await sl(200);const e=s.spawnEnemy('acolyte',P.x+70,150);e.temp=1;e.state='chase';window.__en=e;await sl(400);return{t:s.t,ex:Math.round(e.b.x)}});
await A.pg.keyboard.press('Tab');await wait(700);
const INV1=await ev(async()=>{const s=S(),sv=s.sv,sl=ms=>new Promise(r=>setTimeout(r,ms));const a={menu:s.menu&&s.menu.mode,open:s.arsInvOpen,t:s.t,ex:Math.round(__en.b.x),paused:s.physics.world.isPaused};
 sv.inv.includes('katana')||sv.inv.push('katana');const ar0=s.build.ar;const M=s.menu;// equip through the menu itself: R HAND slot -> list -> pick katana
 s.menuKey('ok');await sl(100);let tries=0;while(sv.eq.main!=='katana'&&tries<12){s.menuKey('ok');await sl(80);if(sv.eq.main==='katana')break;s.menuKey('down');await sl(60);tries++}
 return{...a,eq:sv.eq.main,wp:s.wp&&s.wp.name,wpOk:!!(s.wp&&WEAPONS[sv.eq.main]&&s.wp.name===WEAPONS[sv.eq.main].name),ar0,ar1:s.build.ar,t2:s.t,ex2:Math.round(__en.b.x)}});
await shot('ars15_inventory_midlevel');
await A.pg.keyboard.press('Escape');await wait(200);await A.pg.keyboard.press('Escape');await wait(200);
const INV2=await ev(async()=>{const s=S(),sl=ms=>new Promise(r=>setTimeout(r,ms));if(s.menu&&s.arsInvOpen){s.arsInvKey=1;await sl(150)}const t=s.t;await sl(400);const r={menu:!!s.menu,t0:t,t1:s.t};
 window.__fakePad={connected:true,buttons:Array.from({length:17},()=>({pressed:false,value:0})),axes:[0,0,0,0]};await sl(100);__fakePad.buttons[8].pressed=true;await sl(120);__fakePad.buttons[8].pressed=false;await sl(200);r.padOpen=!!s.menu&&s.arsInvOpen;
 __fakePad.buttons[8].pressed=true;await sl(120);__fakePad.buttons[8].pressed=false;await sl(200);r.padClosed=!s.menu;delete window.__fakePad;__en.dead=true;__en.b.body.enable=false;s.sv.eq.main='longsword';s.applyBuild(false);return r});
ok('inventory_opens_mid_combat_solo_pauses_world',INV1.menu&&INV1.open&&INV1.paused&&Math.abs(INV1.t2-INV1.t)<.05&&INV1.ex2===INV1.ex,{INV,INV1});
ok('inventory_equip_swap_applies_immediately',INV1.eq!=='longsword'&&INV1.wpOk&&INV1.ar1!==INV1.ar0,INV1);
ok('inventory_closes_and_world_resumes_pad_view_toggles',!INV2.menu&&INV2.t1>INV2.t0+.2&&INV2.padOpen&&INV2.padClosed,INV2);
// ---------- 5. co-op: guest rings run guest-side and the host sees them; guest inventory leaves the world running
const H=await mk(false);await H.pg.goto(B+'assets/README.md');await H.ev(()=>localStorage.clear());await H.go('?host&mute&novideo&stage=ramparts&class=knight');
await H.pg.waitForFunction(()=>NET.peer&&NET.peer.open,null,{timeout:20000}).catch(()=>{});const code=await H.ev(()=>NET.code);pages[await H.ev(()=>NET.peer.id)]=H.pg;
const G=await mk(false);await G.pg.goto(B+'assets/README.md');await G.ev(()=>localStorage.clear());await G.pg.goto(B+'?seed=0&mute&novideo&class=knight&join='+code);
await G.pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await wait(1500);
await G.ev(()=>{window.S=()=>__G.scene.getScene('stage')});
await G.ev(()=>{window.S=()=>__G.scene.getScene('stage')});
await H.ev(()=>{const s=S();s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false});s.pb.setPosition(400,148);s.player.inv=99});
await G.ev(()=>{const s=S();s.pb.setPosition(360,148);s.pb.setVelocity(0,0);s.player.inv=99});await wait(900);
const CR=await G.ev(async()=>{const s=S(),sv=s.sv,P=s.player,sl=ms=>new Promise(r=>setTimeout(r,ms));window.__inp=()=>({});for(const id of Object.keys(ARS.RRING))sv.inv.push(id);
 const on=(a,b)=>{sv.eq.ring1=a;sv.eq.ring2=b;s.applyBuild(false)};
 const st=async()=>{await sl(150);P.st=10;P.stDelay=0;await sl(50);const a=P.st,t0=s.t;await sl(800);return+((P.st-a)/Math.max(.1,s.t-t0)).toFixed(1)};
 const fp=async()=>{await sl(100);P.fp=0;await sl(50);const a=P.fp,t0=s.t;await sl(1000);return+((P.fp-a)/Math.max(.1,s.t-t0)).toFixed(2)};
 const hp=async()=>{await sl(100);const m=P.hpMax;P.hp=Math.max(1,m-60);await sl(50);const a=P.hp,t0=s.t;await sl(1000);return+((P.hp-a)/Math.max(.1,s.t-t0)).toFixed(2)};
 on(null,null);const r={st0:await st(),fp0:await fp(),hp0:await hp()};on('second_wind','deep_well');r.st1=await st();r.fp1=await fp();on('mending_ember',null);r.hp1=await hp();on('second_wind','mending_ember');P.hp=P.hpMax;return r});await wait(800);
const CRH=await H.ev(()=>({rg:NET.remote&&NET.remote.rg}));
const CI0=[await H.ev(()=>S().t),await G.ev(()=>S().t)];await G.ev(()=>{delete window.__inp});await G.pg.keyboard.press('Tab');await wait(1200);
const CI1=await G.ev(()=>({menu:S().menu&&S().menu.mode,open:S().arsInvOpen,t:S().t,paused:S().physics.world.isPaused}));const CIH=await H.ev(()=>S().t);
await G.ev(()=>{S().arsInvKey=1});await wait(300);const CI2=await G.ev(()=>!S().menu);
ok('rings_coop_guest_regen_all_three',CR.st1>=CR.st0*1.25&&CR.fp1>=CR.fp0*1.5&&CR.hp1>=CR.hp0+.6,CR);
ok('rings_coop_host_sees_guest_rings',!!(CRH.rg&&CRH.rg[0]==='second_wind'&&CRH.rg[1]==='mending_ember'),CRH);
ok('inventory_coop_world_keeps_running',CI1.menu&&CI1.open&&!CI1.paused&&CI1.t>CI0[1]+.8&&CIH>CI0[0]+.8&&CI2,{CI0,CI1,CIH,CI2});
await H.ctx.close();await G.ctx.close();
// ---------- 6. inventory in the boss room (Frost Warden fight)
const TB=await mk(false);await TB.pg.goto(B+'assets/README.md');await TB.ev(()=>localStorage.clear());await TB.go('?play&mute&novideo&slot=2&class=knight&stage=ramparts');
const TBt=await TB.ev(async()=>{const s=S(),P=s.player,sl=ms=>new Promise(r=>setTimeout(r,ms));clear();P.inv=99;s.pb.setPosition(s.gateL.x+40,140);let st;for(let i=0;i<80;i++){await sl(250);st=s.bossState;if(st==='fight')break;if(i%8==4&&s.skipCine)s.skipCine()}
 delete window.__inp;P.hp=P.hpMax;P.inv=99;return{t:s.t,bs:st}});await TB.pg.keyboard.press('Tab');await wait(600);
const TBI=await TB.ev(()=>({menu:S().menu&&S().menu.mode,paused:S().physics.world.isPaused,t:S().t,bs:S().bossState}));await TB.ctx.close();
ok('inventory_opens_in_boss_room',TBI.menu&&TBI.paused&&TBt.bs==='fight'&&Math.abs(TBI.t-TBt.t)<.1,{TBt,TBI});
// ---------- 7. all three rings survive save/load and NG+
const NG=await mk(false);await NG.pg.goto(B+'assets/README.md');await NG.ev(()=>localStorage.clear());await NG.go('?play&mute&novideo&slot=1&class=knight&stage=ramparts');
await NG.ev(()=>{const s=S(),sv=s.sv;for(const id of Object.keys(ARS.RRING))sv.inv.push(id);sv.eq.ring1='deep_well';sv.eq.ring2='second_wind';s.applyBuild(false);Save.write(sv)});
await NG.go('?play&mute&novideo&slot=1&continue');const SL=await NG.ev(()=>({r1:S().sv.eq.ring1,r2:S().sv.eq.ring2,sw:S().arsSW(),fp:S().arsRing('fp'),inv:Object.keys(ARS.RRING).every(i=>S().sv.inv.includes(i))}));
await NG.ev(()=>{const s=S(),sv=s.sv;sv.lords=[...(sv.lords||[]),'heir'];Save.write(sv);s.scene.start('ending',{kind:'fade',final:true})});await wait(1500);
for(let i=0;i<3;i++){await NG.pg.keyboard.press('Enter');await wait(900)}await wait(1500);
const NGR=await NG.ev(()=>{const v=Save.load()||{};return{ng:v.ng,r1:v.eq&&v.eq.ring1,r2:v.eq&&v.eq.ring2,inv:Object.keys(ARS.RRING).every(i=>(v.inv||[]).includes(i))}});await NG.ctx.close();
ok('rings_save_load_and_ng_plus',SL.r1==='deep_well'&&SL.r2==='second_wind'&&SL.sw&&SL.fp>0&&SL.inv&&NGR.ng>=1&&NGR.r1==='deep_well'&&NGR.r2==='second_wind'&&NGR.inv,{SL,NGR});
ok('no_errors',errs.length===0,errs);
const clip=(out,a,b)=>{let s='';for(let i=a;i<b;i++)s+=`file '${VD}/${String(i).padStart(5,'0')}.jpg'\nduration ${Math.min(.5,((FR[i+1]||FR[i]+100)-FR[i])/1000).toFixed(3)}\n`;fs.writeFileSync(VD+'/l.txt',s);
 execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i ${VD}/l.txt -vf "scale=640:360,fps=30" -c:v libx264 -pix_fmt yuv420p -crf 27 ${out}`)};
try{clip('clips/arsgui.mp4',0,FR.length);for(const[k,[a,b]]of Object.entries(MARK))if(b>a)clip(`clips/arsgui_${k}.mp4`,a,b);console.error('clips ok')}catch(e){console.error('clip fail',e.message)}
console.log(JSON.stringify({pass,fail}));process.exit(fail?1:0);
