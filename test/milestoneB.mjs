// Headless checks for milestone B (exploration). usage: node test/milestoneB.mjs  (server on :8171)
import { chromium } from 'playwright';
const B='http://127.0.0.1:8171/',S='screenshots/B/after/';
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const errs=[],ext=[],R={};let pass=0,fail=0;const ok=(n,c,v)=>{R[n]={pass:!!c,v};c?pass++:fail++};
const ctx=await br.newContext({viewport:{width:1280,height:720}});const pg=await ctx.newPage();
pg.on('pageerror',e=>errs.push(e.message));pg.on('request',r=>{const u=r.url();if(!u.startsWith(B)&&!/^(data|blob):/.test(u))ext.push(u)});
await pg.goto(B+'assets/README.md');await pg.evaluate(()=>localStorage.clear());
await pg.goto(B+'?play&mute');await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player);await pg.waitForTimeout(1200);
// helpers installed in page
await pg.evaluate(()=>{window.S=()=>__G.scene.getScene('stage');
 window.tp=(x,y)=>{const s=S();s.pb.setPosition(x,y-8);s.pb.setVelocity(0,0);s.player.state='idle';s.camY=s.camTY=y-156};
 window.until=(cond,ms)=>new Promise(r=>{const t0=performance.now();const f=()=>{if(cond())return r(true);if(performance.now()-t0>ms)return r(false);requestAnimationFrame(f)};f()});
 window.wallClimb=(dir,goalY,exit)=>{const c={dir,t:1};window.__inp=s=>{const P=s.player,o={jump:1},on=s.pb.body.blocked.down;c.t+=s.dt;
   if(P.y<goalY){o[exit>0?'r':'l']=1;return o}
   if(on&&c.t>.15){o.jumpP=1;o[c.dir>0?'r':'l']=1;c.t=0;return o}
   if(!on&&P.wallC>0&&s.pb.body.velocity.y>-60){c.dir=-P.wall;o.jumpP=1}
   o[c.dir>0?'r':'l']=1;return o}};
 window.hold=(keys)=>{window.__inp=()=>{const o={};keys.forEach(k=>o[k]=1);return o}};
 window.idle=()=>{window.__inp=()=>({})};
 window.attack=()=>{let n=0;window.__inp=()=>(n++===0?{atkP:1}:{})};});
const ev=(f,a)=>pg.evaluate(f,a);const wait=ms=>pg.waitForTimeout(ms);
// 1. level data
R.level=await ev(()=>{const s=S();return{tilesW:s.lv.cols,tilesH:s.lv.rows,solidBodies:s.solids.length,oneways:s.oneways.length,cages:s.cages.length,covers:s.covers.length,challenges:s.chs.length,breakables:s.breakables.length}});
ok('level_built',R.level.cages===8&&R.level.covers===3&&R.level.challenges===2,R.level);
// 2. wall-jump to the hidden room at the start, find it, free cage e7
await ev(()=>{tp(262,156);wallClimb(1,30,1)});
const t2=Date.now();R.wj1=await ev(()=>until(()=>S().player.x>300&&S().player.y<=37&&S().pb.body.blocked.down,9000));R.wj1t=(Date.now()-t2)/1000;
await wait(300);await pg.screenshot({path:S+'21_hidden_room_found.png'});
await ev(()=>{const s=S();s.player.f=1;idle()});await ev(()=>{tp(326,36);S().player.f=1;attack()});await wait(500);
R.start=await ev(()=>{const s=S();return{x:Math.round(s.player.x),y:Math.round(s.player.y),wallJumps:s.stats.wallJumps,found:s.covers.find(c=>c.id==='h_start').found,coverAlpha:+s.covers[0].a.toFixed(2),e7:s.cages.find(c=>c.id==='e7').freed}});
ok('walljump_to_hidden_room',R.wj1&&R.start.wallJumps>=2&&R.start.found&&R.start.coverAlpha<.3,{reached:R.wj1,secs:R.wj1t,...R.start});
ok('cage_freed_by_attack',R.start.e7,R.start);
// 3. climb the start chain onto the rooftop
await ev(()=>{tp(372,156);let n=0;window.__inp=s=>{n++;return n<5?{up:1}:{up:1,r:1}}});
R.climb=await ev(()=>until(()=>S().player.y<=21&&S().pb.body.blocked.down,8000));
R.climbAt=await ev(()=>({x:Math.round(S().player.x),y:Math.round(S().player.y),climbs:S().stats.climbs,camY:Math.round(S().cam.scrollY)}));
ok('climb_chain_to_rooftop',R.climb&&R.climbAt.climbs>=1,R.climbAt);
await pg.screenshot({path:S+'22_rooftop_after_climb.png'});
// 4. drop through the trapdoor into the crypt; vertical camera follows
await ev(()=>{tp(1112,156);idle()});await wait(400);
await ev(()=>{let n=0;window.__inp=()=>(n++<3?{dn:1,jumpP:1,jump:1}:{})});
R.drop=await ev(()=>until(()=>S().player.y>=299&&S().pb.body.blocked.down,4000));await wait(900);
R.dropAt=await ev(()=>({y:Math.round(S().player.y),camY:Math.round(S().cam.scrollY)}));
ok('drop_through_oneway',R.drop,R.dropAt);ok('vertical_camera_down',R.dropAt.camY>=120,R.dropAt);
await pg.screenshot({path:S+'23_crypt_after_drop.png'});
// 5. crypt hidden room + cage e2 (walk left into the wall)
await ev(()=>{tp(1060,300);hold(['l'])});R.crypt=await ev(()=>until(()=>S().covers.find(c=>c.id==='h_crypt').found,4000));
await ev(()=>{tp(1024,300);S().player.f=-1;attack()});await wait(500);
R.cryptCage=await ev(()=>S().cages.find(c=>c.id==='e2').freed);
ok('crypt_hidden_room_and_cage',R.crypt&&R.cryptCage,{found:R.crypt,freed:R.cryptCage});
// 6. wall-jump up the crypt shaft back to the surface
await ev(()=>{tp(1500,300);wallClimb(1,150,-1)});R.wj2=await ev(()=>until(()=>S().player.y<=157&&S().pb.body.blocked.down,10000));
R.wj2At=await ev(()=>({x:Math.round(S().player.x),y:Math.round(S().player.y)}));ok('walljump_crypt_shaft',R.wj2,R.wj2At);
// 7. tower wall-jump; camera goes up
await ev(()=>{tp(1712,156);wallClimb(1,-104,1)});R.wj3=await ev(()=>until(()=>S().player.y<=-99&&S().player.x>1730&&S().pb.body.blocked.down,12000));await wait(900);
R.towerAt=await ev(()=>({x:Math.round(S().player.x),y:Math.round(S().player.y),camY:Math.round(S().cam.scrollY)}));
ok('walljump_tower',R.wj3,R.towerAt);ok('vertical_camera_up',R.towerAt.camY<=-150,R.towerAt);
await pg.screenshot({path:S+'24_tower_top.png'});
// 8. timer challenge: fail, then succeed
await ev(()=>{tp(1770,-100);idle()});await wait(300);
R.timerStart=await ev(()=>{const c=S().chs.find(c=>c.id==='c_run');return{active:c.active,gateClosed:c.gateObjs[0].closed}});
await pg.screenshot({path:S+'25_ember_run_active.png'});
await ev(()=>{S().chs.find(c=>c.id==='c_run').t=.05});await wait(300);
R.timerFail=await ev(()=>{const c=S().chs.find(c=>c.id==='c_run');return{active:c.active,gateClosed:c.gateObjs[0].closed,bodyOn:c.gateObjs[0].body.body.enable}});
// real run: hold right + jump over gaps/spikes
await ev(()=>{tp(1700+60,-100);idle()});await wait(200);await ev(()=>{tp(1730,-100)});await wait(200);await ev(()=>{tp(1770,-100)});
await ev(()=>{const jumps=[1896,1972,2052,2132];window.__inp=s=>{const P=s.player,o={r:1,jump:1};if(jumps.some(j=>P.x>j-6&&P.x<j)&&s.pb.body.blocked.down)o.jumpP=1;
  const c=s.cages.find(c=>c.id==='e4');if(Math.abs(P.x-c.x)<16){o.r=0;o.atkP=1}return o}});
const tRun=Date.now();R.timerWin=await ev(()=>until(()=>S().cages.find(c=>c.id==='e4').freed,14000));R.timerWinSecs=(Date.now()-tRun)/1000;
R.timerEnd=await ev(()=>{const s=S(),c=s.chs.find(c=>c.id==='c_run');return{done:c.done,left:+c.t.toFixed(2),spikeHits:s.stats.spikes||0,hp:s.player.hp}});
ok('timer_challenge_start',R.timerStart.active&&!R.timerStart.gateClosed,R.timerStart);ok('timer_challenge_fail_seals_gate',!R.timerFail.active&&R.timerFail.gateClosed&&R.timerFail.bodyOn,R.timerFail);
ok('timer_challenge_cleared_by_running',R.timerWin&&R.timerEnd.done,{secs:R.timerWinSecs,...R.timerEnd});
await pg.screenshot({path:S+'26_ember_run_cleared.png'});
// 9. spikes hurt and return you to safe ground
await ev(()=>{tp(1960,-100);idle()});await wait(400);await ev(()=>{const s=S();s.player.hp=100;s.player.inv=0;tp(1992,-100)});await wait(700);
R.spike=await ev(()=>({hp:S().player.hp,x:Math.round(S().player.x),y:Math.round(S().player.y)}));ok('spikes_hurt_and_reset',R.spike.hp<100&&Math.abs(R.spike.x-1960)<12,R.spike);
// 10. breakable wall + hidden room behind it + cage e6
await ev(()=>{tp(2530,300);idle();S().player.f=-1});await wait(300);
for(let i=0;i<3;i++){await ev(()=>{S().player.f=-1;S().player.st=100;attack()});await wait(450)}
R.brk=await ev(()=>({hp:S().breakables[0].hp}));
await ev(()=>{hold(['l'])});R.brkRoom=await ev(()=>until(()=>S().covers.find(c=>c.id==='h_ossuary').found,3000));
await ev(()=>{tp(2492,300);S().player.f=-1;attack()});await wait(500);R.e6=await ev(()=>S().cages.find(c=>c.id==='e6').freed);
ok('breakable_wall_room_cage',R.brk.hp<=0&&R.brkRoom&&R.e6,{...R.brk,room:R.brkRoom,e6:R.e6});
await pg.screenshot({path:S+'27_breakwall_room.png'});
// 11. waves challenge
await ev(()=>{tp(2620,300);idle()});await wait(400);
R.w1=await ev(()=>{const c=S().chs.find(c=>c.id==='c_waves');return{active:c.active,gates:c.gateObjs.map(g=>g.body.body.enable),live:c.live.length,cageLocked:S().cages.find(c=>c.id==='e5').locked}});
await pg.screenshot({path:S+'28_ossuary_trial.png'});
await ev(()=>{const s=S(),c=s.chs.find(c=>c.id==='c_waves');c.live.forEach(e=>{if(!e.dead)s.damageEnemy(e,99,1)})});await wait(400);
R.w2=await ev(()=>{const c=S().chs.find(c=>c.id==='c_waves');return{wave:c.wave,live:c.live.length}});
await ev(()=>{const s=S(),c=s.chs.find(c=>c.id==='c_waves');c.live.forEach(e=>{if(!e.dead)s.damageEnemy(e,99,1)})});await wait(400);
R.w3=await ev(()=>{const s=S(),c=s.chs.find(c=>c.id==='c_waves');return{done:c.done,active:c.active,gates:c.gateObjs.map(g=>g.body.body.enable),cageLocked:s.cages.find(c=>c.id==='e5').locked,saved:JSON.parse(localStorage.getItem('ashenVigil.save.v1')).chDone}});
await ev(()=>{tp(2806,300);S().player.f=1;attack()});await wait(500);R.e5=await ev(()=>S().cages.find(c=>c.id==='e5').freed);
ok('waves_challenge',R.w1.active&&R.w1.gates.every(Boolean)&&R.w1.cageLocked&&R.w2.wave===1&&R.w3.done&&!R.w3.gates.some(Boolean)&&!R.w3.cageLocked&&R.e5,{w1:R.w1,w2:R.w2,w3:R.w3,e5:R.e5});
// 12. climb out of the ossuary on the chain
await ev(()=>{tp(2884,300);S().player.inv=99;let n=0;window.__inp=()=>(S().player.y>172?{up:1}:{up:1,r:1})});R.climb2=await ev(()=>until(()=>S().player.y<=157&&S().pb.body.blocked.down,8000));
ok('climb_out_of_ossuary',R.climb2,await ev(()=>({x:Math.round(S().player.x),y:Math.round(S().player.y)})));
// 13. persistence: reload keeps freed cages / found rooms / broken wall / trial
await ev(()=>{idle();const s=S();s.rest&&0});await pg.goto(B+'?play&mute&continue');await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player);await wait(800);
R.persist=await ev(()=>{const s=__G.scene.getScene('stage');return{freed:s.cages.filter(c=>c.freed).map(c=>c.id),found:s.covers.filter(c=>c.found).length,breakables:s.breakables.length,trialDone:s.chs.find(c=>c.id==='c_waves').done}});
ok('collectibles_persist',R.persist.freed.length===5&&R.persist.found===3&&R.persist.breakables===0&&R.persist.trialDone,R.persist);
// 14. HUD counter + victory card show embers
await pg.evaluate(()=>{window.S=()=>__G.scene.getScene('stage')});await pg.screenshot({path:S+'29_hud_counter.png'});
await ev(()=>{const s=S();s.cages.filter(c=>!c.freed).forEach(c=>s.freeCage(c))});
await ev(()=>{const s=S();s.pb.setPosition(3020,140)});await pg.waitForFunction(()=>S().bossState==='fight',null,{timeout:15000});
await ev(()=>{S().boss.hp=0});await pg.waitForFunction(()=>S().victory&&S().victory.t>1,null,{timeout:12000});await pg.screenshot({path:S+'30_victory_embers.png'});
R.best=await ev(()=>({best:+localStorage.getItem('ashenVigil.best.ramparts'),stageEnemiesAlive:S().enemies.filter(e=>!e.dead&&e.b.x<2980).length}));ok('best_time_saved',R.best.best>0,R.best);ok('stage_enemies_frozen_at_gate',R.best.stageEnemiesAlive===0,R.best);
 R.victory=await ev(()=>({embers:S().cages.filter(c=>c.freed).length,rooms:S().covers.filter(c=>c.found).length}));ok('victory_lists_embers',R.victory.embers===8,R.victory);
await pg.close();
// r2 extras: favicon, parry flash + pop, hero rim, fg/mist layers
const p3=await ctx.newPage();const c404=[];p3.on('console',m=>{if(m.type()==='error')c404.push(m.text())});p3.on('pageerror',e=>errs.push(e.message));
await p3.goto(B+'?play&mute');await p3.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player);await p3.waitForTimeout(1000);
R.fav=await p3.evaluate(async()=>{const r=await fetch(document.querySelector('link[rel=icon]').href);return r.status});
R.parry=await p3.evaluate(()=>new Promise(res=>{const s=__G.scene.getScene('stage'),P=s.player;const e=s.enemies.find(e=>e.k==='hollow'&&!e.dead&&e.gy===156);s.pb.x=e.b.x-14;P.f=1;P.inv=0;
  setTimeout(()=>{e.f=-1;e.state='swing';e.t=0;P.state='parry';P.t=0;setTimeout(()=>res({pflashSet:s.pops.some(p=>p.s==='PARRY'),stag:e.state==='stag',mist:s.mist.length}),40)},300)}));
await p3.waitForTimeout(60);await p3.screenshot({path:S+'31_parry_flash.png'});
ok('favicon_200_no_404',R.fav===200&&c404.length===0,{status:R.fav,consoleErrors:c404});ok('parry_pop_and_flash',R.parry.pflashSet&&R.parry.stag,R.parry);
await p3.close();
// 15. demo AI still reaches the boss along the main route
const p2=await ctx.newPage();p2.on('pageerror',e=>errs.push(e.message));await p2.goto(B+'assets/README.md');await p2.evaluate(()=>localStorage.clear());
await p2.goto(B+'?demo&mute');const t15=Date.now();R.demo=await p2.waitForFunction(()=>window.__G&&__G.scene.getScene('stage').bossState!=='sleep',null,{timeout:150000}).then(()=>true).catch(()=>false);R.demoSecs=(Date.now()-t15)/1000;
ok('demo_ai_reaches_boss',R.demo,{secs:R.demoSecs});
ok('no_page_errors',errs.length===0,errs);ok('no_external_requests',ext.length===0,ext);
console.log(JSON.stringify(R,null,1));console.log(`PASS ${pass} / ${pass+fail}`);await br.close();
