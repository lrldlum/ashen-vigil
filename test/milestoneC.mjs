// Headless checks for milestone C (stage 2 Cathedral of the Pale Choir, stage 3 Cinderdeep, lords, 1->2->3 link). usage: node test/milestoneC.mjs (server on :8171)
import { chromium } from 'playwright';
const B='http://127.0.0.1:8171/',S='screenshots/C/after/';
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const errs=[],ext=[],R={};let pass=0,fail=0;const ok=(n,c,v)=>{R[n]={pass:!!c,v};c?pass++:fail++;console.error((c?'PASS ':'FAIL ')+n)};
const ctx=await br.newContext({viewport:{width:1280,height:720}});const pg=await ctx.newPage();
pg.on('pageerror',e=>errs.push(e.message));pg.on('request',r=>{const u=r.url();if(!u.startsWith(B)&&!/^(data|blob):/.test(u))ext.push(u)});
const ev=(f,a)=>pg.evaluate(f,a);const wait=ms=>pg.waitForTimeout(ms);
const helpers=()=>ev(()=>{window.S=()=>__G.scene.getScene('stage');
 window.tp=(x,y)=>{const s=S();s.pb.setPosition(x,y-8);s.pb.setVelocity(0,0);s.player.state='idle';s.player.inv=99;s.camY=s.camTY=y-156};
 window.until=(cond,ms)=>new Promise(r=>{const t0=performance.now();const f=()=>{if(cond())return r(true);if(performance.now()-t0>ms)return r(false);requestAnimationFrame(f)};f()});
 window.wallClimb=(dir,goalY,exit)=>{const c={dir,t:1};window.__inp=s=>{const P=s.player,o={jump:1},on=s.pb.body.blocked.down;c.t+=s.dt;P.inv=99;
   if(P.y<goalY){o[exit>0?'r':'l']=1;return o}
   if(on&&c.t>.15){o.jumpP=1;o[c.dir>0?'r':'l']=1;c.t=0;return o}
   if(!on&&P.wallC>0&&s.pb.body.velocity.y>-60){c.dir=-P.wall;o.jumpP=1}
   o[c.dir>0?'r':'l']=1;return o}};
 window.hold=(keys)=>{window.__inp=()=>{const o={};keys.forEach(k=>o[k]=1);return o}};
 window.idle=()=>{window.__inp=()=>({})};
 window.attack=()=>{let n=0;window.__inp=()=>(n++===0?{atkP:1}:{})};
 window.cage=id=>S().cages.find(c=>c.id===id);window.cover=id=>S().covers.find(c=>c.id===id)});
const ready=async()=>{await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive());await wait(900);await helpers()};
await pg.goto(B+'assets/README.md');await pg.evaluate(()=>localStorage.clear());
// 0. stage 1 -> stage 2 link: beat the Frost Warden, choose ONWARD
await pg.goto(B+'?play&mute');await ready();
await ev(()=>{S().pb.setPosition(3020,140)});await pg.waitForFunction(()=>S().bossState==='fight',null,{timeout:15000});
await ev(()=>{S().boss.hp=0});await pg.waitForFunction(()=>S().victory&&S().victory.t>1,null,{timeout:12000});
R.card1=await ev(()=>({clear:S().victory.clear,next:S().def.next}));await pg.screenshot({path:S+'c01_stage1_clear_card.png'});
await pg.keyboard.press('Enter');await wait(1500);await ready();
R.link12=await ev(()=>({sid:S().sid,name:S().def.name,save:JSON.parse(localStorage.getItem('ashenVigil.save.v1')).stage}));
ok('link_stage1_to_stage2',R.card1.clear&&R.card1.next==='cathedral'&&R.link12.sid==='cathedral'&&R.link12.save==='cathedral',{...R.card1,...R.link12});
const ST={cathedral:{pre:'s2',pr:1700,cr:2380,tw:200,os:1000,n:2},cinderdeep:{pre:'s3',pr:900,cr:300,tw:2200,os:1950,n:3}};
async function stage(sid){const T=ST[sid],p=T.pre,sh=(n)=>pg.screenshot({path:`${S}c${T.n}_${n}.png`});const r={};
 r.level=await ev(()=>{const s=S();return{sid:s.sid,cages:s.cages.length,covers:s.covers.length,chs:s.chs.length,brk:s.breakables.length,enemies:[...new Set(s.enemies.map(e=>e.k))],lvl:s.textures.exists('lvl_'+s.sid),sky:s.textures.exists('sky_'+s.sid),gTop:getComputedStyle(document.body)&&0}});
 ok(sid+'_level_built',r.level.sid===sid&&r.level.cages===8&&r.level.covers===3&&r.level.chs===2&&r.level.brk===1&&r.level.lvl&&r.level.sky,r.level);
 await sh('01_start');
 // pillar wall-jump -> hidden room -> cage
 const X=T.pr;await ev(x=>{tp(x+30,156);wallClimb(1,30,1)},X);
 r.wj=await ev(x=>until(()=>S().player.x>x+68&&S().player.y<=37&&S().pb.body.blocked.down,10000),X);await wait(300);await sh('02_hidden_room');
 await ev(x=>{tp(x+94,36);S().player.f=1;attack()},X);await wait(500);
 r.room=await ev(([p,x])=>({found:cover(`${p}_pillarRoom${x}_h`).found,freed:cage(`${p}_pillarRoom${x}_c1`).freed}),[p,X]);
 ok(sid+'_walljump_hidden_room_cage',r.wj&&r.room.found&&r.room.freed,{reached:r.wj,...r.room});
 await ev(x=>{tp(x+140,156);window.__inp=s=>(s.player.inv=99,s.player.y>30?{up:1}:{up:1,r:1})},X);
 r.climb=await ev(()=>until(()=>S().player.y<=21&&S().pb.body.blocked.down,9000));await wait(500);await sh('03_rooftop');
 ok(sid+'_chain_to_rooftop',r.climb,await ev(()=>({x:Math.round(S().player.x),y:Math.round(S().player.y)})));
 // crypt: drop through, vertical camera, hidden room + cage, wall-jump shaft out
 const Cx=T.cr;await ev(x=>{tp(x+64,156);idle()},Cx);await wait(400);await ev(()=>{let n=0;window.__inp=()=>(n++<3?{dn:1,jumpP:1,jump:1}:{})});
 r.drop=await ev(()=>until(()=>S().player.y>=299&&S().pb.body.blocked.down,4000));await wait(900);r.camY=await ev(()=>Math.round(S().cam.scrollY));await sh('04_crypt');
 ok(sid+'_drop_and_vertical_camera',r.drop&&r.camY>=120,{drop:r.drop,camY:r.camY});
 await ev(x=>{tp(x+12,300);hold(['l'])},Cx);r.cf=await ev(([p,x])=>until(()=>cover(`${p}_crypt${x}_h`).found,4000),[p,Cx]);
 await ev(x=>{tp(x-24,300);S().player.f=-1;attack()},Cx);await wait(500);r.cc=await ev(([p,x])=>cage(`${p}_crypt${x}_c1`).freed,[p,Cx]);
 ok(sid+'_crypt_hidden_room_cage',r.cf&&r.cc,{found:r.cf,freed:r.cc});
 await ev(x=>{tp(x+452,300);wallClimb(1,150,-1)},Cx);r.wj2=await ev(()=>until(()=>S().player.y<=157&&S().pb.body.blocked.down,12000));
 ok(sid+'_walljump_shaft_out',r.wj2,await ev(()=>({x:Math.round(S().player.x),y:Math.round(S().player.y)})));
 // tower + timer challenge
 const Tw=T.tw;await ev(x=>{tp(x+32,156);wallClimb(1,-104,1)},Tw);r.wj3=await ev(x=>until(()=>S().player.y<=-99&&S().player.x>x+50&&S().pb.body.blocked.down,12000),Tw);await wait(700);
 r.towerCam=await ev(()=>Math.round(S().cam.scrollY));ok(sid+'_tower_walljump_camera_up',r.wj3&&r.towerCam<=-150,{reached:r.wj3,camY:r.towerCam});
 await ev(x=>{tp(x+90,-100);idle()},Tw);await wait(300);r.ts=await ev(id=>{const c=S().chs.find(c=>c.id===id);return{active:c.active,name:c.name,limit:c.limit}},`${p}_tower${Tw}_run`);await sh('05_timer_run');
 await ev(([x,p])=>{const J=[216,292,372,452].map(d=>x+d),id=`${p}_tower${x}_c2`;window.__inp=s=>{const P=s.player,o={r:1,jump:1};P.inv=99;if(J.some(j=>P.x>j-6&&P.x<j)&&s.pb.body.blocked.down)o.jumpP=1;const c=cage(id);if(Math.abs(P.x-c.x)<16){o.r=0;o.atkP=1}return o}},[Tw,p]);
 r.tw=await ev(id=>until(()=>cage(id).freed,15000),`${p}_tower${Tw}_c2`);r.te=await ev(id=>{const c=S().chs.find(c=>c.id===id);return{done:c.done,left:+c.t.toFixed(2)}},`${p}_tower${Tw}_run`);
 ok(sid+'_timer_challenge_cleared',r.ts.active&&r.tw&&r.te.done,{start:r.ts,end:r.te});await sh('06_timer_cleared');
 // ossuary: breakable wall room, waves trial, climb out
 const O=T.os;await ev(x=>{tp(x+10,300);idle();S().player.f=-1},O);await wait(300);
 for(let i=0;i<3;i++){await ev(()=>{S().player.f=-1;S().player.st=100;attack()});await wait(450)}
 await ev(()=>hold(['l']));r.br=await ev(([p,x])=>until(()=>cover(`${p}_ossuary${x}_h`).found,3000),[p,O]);
 await ev(x=>{tp(x-28,300);S().player.f=-1;attack()},O);await wait(500);r.bc=await ev(([p,x])=>cage(`${p}_ossuary${x}_c2`).freed,[p,O]);
 ok(sid+'_breakable_room_cage',r.br&&r.bc,{room:r.br,freed:r.bc});
 await ev(x=>{tp(x+100,300);idle()},O);await wait(500);
 r.w1=await ev(id=>{const c=S().chs.find(c=>c.id===id);return{active:c.active,live:c.live.map(e=>e.k),gates:c.gateObjs.map(g=>g.closed)}},`${p}_ossuary${O}_trial`);await sh('07_waves_trial');
 for(let i=0;i<2;i++){await ev(id=>{const s=S(),c=s.chs.find(c=>c.id===id);c.live.forEach(e=>{if(!e.dead)s.damageEnemy(e,99,1)})},`${p}_ossuary${O}_trial`);await wait(500)}
 r.w2=await ev(id=>{const c=S().chs.find(c=>c.id===id);return{done:c.done,gates:c.gateObjs.map(g=>g.closed)}},`${p}_ossuary${O}_trial`);
 await ev(x=>{tp(x+286,300);S().player.f=1;attack()},O);await wait(500);r.wc=await ev(([p,x])=>cage(`${p}_ossuary${x}_c1`).freed,[p,O]);
 ok(sid+'_waves_trial_stage_enemies',r.w1.active&&r.w1.gates.every(Boolean)&&r.w2.done&&!r.w2.gates.some(Boolean)&&r.wc,{w1:r.w1,w2:r.w2,freed:r.wc});
 await ev(x=>{tp(x+364,300);window.__inp=s=>(s.player.inv=99,s.player.y>172?{up:1}:{up:1,r:1})},O);r.out=await ev(()=>until(()=>S().player.y<=157&&S().pb.body.blocked.down,9000));
 ok(sid+'_ossuary_chain_out',r.out,{});
 // stage visuals: shafts / lava light present
 r.fx=await ev(()=>{const s=S();s.cam.scrollX=s.def.theme==='cathedral'?s.def.shafts[1]-100:s.def.spikes[1][0]-160;return{theme:s.def.theme}});
 await ev(x=>{tp(x,156);idle()},sid==='cathedral'?1000:1500);await wait(800);await sh('08_atmosphere');
 // lord: intro cinematic + 3 phases + stage clear
 await ev(()=>{const s=S();s.pb.setPosition(3020,140);s.player.inv=999;idle()});await pg.waitForFunction(()=>S().cine&&S().cine.t>2.4,null,{timeout:15000});
 r.cine=await ev(()=>({bars:S().bars,kind:S().boss.kind,name:S().def.boss.name,rise:+S().boss.rise.toFixed(2)}));await sh('09_lord_intro');
 await pg.waitForFunction(()=>S().bossState==='fight',null,{timeout:8000});
 const sample=async(ms)=>ev(ms=>new Promise(res=>{const seen=new Set(),t0=performance.now();const f=()=>{const s=S(),B=s.boss;if(!B)return res([...seen]);s.player.inv=999;s.player.hp=100;if(B.state==='wind')seen.add(B.next);if(performance.now()-t0>ms)return res([...seen]);requestAnimationFrame(f)};f()}),ms);
 r.p1=await sample(9000);await sh('10_lord_phase1');
 await ev(()=>{const B=S().boss;B.hp=B.hpMax*.6});await wait(400);r.ph2=await ev(()=>({phase:S().boss.phase,state:S().boss.state}));
 r.p2=await sample(10000);await sh('11_lord_phase2');
 await ev(()=>{const B=S().boss;B.hp=B.hpMax*.3});await wait(400);r.ph3=await ev(()=>({phase:S().boss.phase,state:S().boss.state}));
 r.p3=await sample(14000);await sh('12_lord_phase3');
 ok(sid+'_lord_intro_cinematic',r.cine.bars>.9&&r.cine.kind===(sid==='cathedral'?'cantor':'king'),r.cine);
 ok(sid+'_lord_three_phases',r.ph2.phase===2&&r.ph2.state==='roar'&&r.ph3.phase===3&&r.ph3.state==='roar'&&r.p3.some(a=>a==='requiem'||a==='inferno'),{p1:r.p1,ph2:r.ph2,p2:r.p2,ph3:r.ph3,p3:r.p3});
 await ev(()=>{S().boss.hp=0});await pg.waitForFunction(()=>S().victory&&S().victory.t>1,null,{timeout:12000});
 r.card=await ev(()=>({clear:S().victory.clear,embers:S().cages.filter(c=>c.freed).length,next:S().def.next,best:+localStorage.getItem('ashenVigil.best.'+S().sid)}));await sh('13_victory_card');
 ok(sid+'_lord_slain_card',r.card.best>0&&(sid==='cathedral'?r.card.clear:!r.card.clear),r.card);
 R[sid]=r;await pg.keyboard.press('Enter');await wait(1500);await ready()}
await stage('cathedral');
R.link23=await ev(()=>({sid:S().sid,freed:JSON.parse(localStorage.getItem('ashenVigil.save.v1')).freed.filter(i=>i.startsWith('s2_')).length}));
ok('link_stage2_to_stage3_keeps_progress',R.link23.sid==='cinderdeep'&&R.link23.freed>=5,R.link23);
await stage('cinderdeep');
R.ng=await ev(()=>({sid:S().sid,ng:S().ng}));ok('final_lord_then_ngplus_returns_to_stage1',R.ng.sid==='ramparts'&&R.ng.ng===1,R.ng);
await pg.close();
// demo AI fights each lord (all attacks live, nothing crashes)
for(const sid of ['cathedral','cinderdeep']){const p2=await ctx.newPage();p2.on('pageerror',e=>errs.push(e.message));p2.on('request',r=>{const u=r.url();if(!u.startsWith(B)&&!/^(data|blob):/.test(u))ext.push(u)});
 await p2.goto(B+'?demo&boss&mute&stage='+sid);await p2.waitForTimeout(16000);
 const d=await p2.evaluate(()=>{const s=__G.scene.getScene('stage'),B=s.boss;return{state:s.bossState,hp:B?+(B.hp/B.hpMax).toFixed(2):0,phase:B&&B.phase,playerHp:s.player.hp}});
 await p2.screenshot({path:`${S}c_demo_${sid}.png`});ok(sid+'_demo_ai_fights_lord',d.state!=='sleep'&&d.state!=='cine'&&d.hp<1,d);await p2.close()}
ok('no_page_errors',errs.length===0,errs);ok('no_external_requests',ext.length===0,ext);
console.log(JSON.stringify(R,null,1));console.log(`PASS ${pass} / ${pass+fail}`);await br.close();
