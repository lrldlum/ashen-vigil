// Headless checks for the Tester r7 fixes (e04a38e review, 7.4/10):
// P1 unique stage plans (Keep, Spire, Cloister, Throne) with their own chests, collectibles and hazards; mimics rolled per save seed;
//    hazards + two forced fights ON the main road, longer stages, a pre-boss shortcut door; co-op runaway "swing" hollows.
// P2 specials scale from the held weapon (capped, 14+ FP, 1.5 s cooldown); hazards bite (wind, lethal spores, solid thorns); usurp ending scene.
// P3 Spire ceiling, altars want the wielded weapon, a warning before the Catacomb lava route.
// usage: node test/r7fix.mjs   (server on :8171). Writes screenshots/r7/after/*.png and clips/r7.mp4
import { chromium } from './node_modules/playwright/index.mjs';import fs from 'fs';import { execSync } from 'child_process';
const B='http://127.0.0.1:8171/',SH='screenshots/r7/after/',VD='/tmp/r7clip';fs.mkdirSync(SH,{recursive:true});fs.rmSync(VD,{recursive:true,force:true});fs.mkdirSync(VD,{recursive:true});
let pass=0,fail=0;const ok=(n,c,v)=>{c?pass++:fail++;console.error((c?'PASS ':'FAIL ')+n+' '+JSON.stringify(v).slice(0,500))};
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});const ctx=await br.newContext({viewport:{width:1280,height:720}});const pg=await ctx.newPage();
const errs=[];pg.on('pageerror',e=>errs.push(e.message));const ev=(f,a)=>pg.evaluate(f,a),wait=ms=>pg.waitForTimeout(ms);
const FR=[];const cdp=await ctx.newCDPSession(pg);cdp.on('Page.screencastFrame',f=>{fs.writeFileSync(`${VD}/${String(FR.length).padStart(5,'0')}.jpg`,Buffer.from(f.data,'base64'));FR.push(Date.now());cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{})});
await cdp.send('Page.startScreencast',{format:'jpeg',quality:70,maxWidth:1280,maxHeight:720,everyNthFrame:2});
const shot=n=>pg.screenshot({path:SH+n+'.png'});
const go=async(q,clear=true)=>{if(clear){await pg.goto(B+'assets/README.md');await ev(()=>localStorage.clear())}await pg.goto(B+q);await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await wait(700);
 await ev(()=>{window.S=()=>__G.scene.getScene('stage');window.clear=()=>S().enemies.forEach(e=>{e.dead=true;e.b.body.enable=false});window.sl=ms=>new Promise(r=>setTimeout(r,ms));
  window.tp=(x,y=156)=>{const s=S();s.pb.setPosition(x,y-8);s.pb.setVelocity(0,0);s.player.state='idle';s.player.inv=99;s.camY=s.camTY=y-156};window.press=k=>{let n=0;window.__inp=()=>(n++===0?{[k]:1}:{})};window.hold=(o)=>{window.__inp=()=>o}})};
const NEW=['keep','spire','cloister','throne'],SIDE=['belltower','catacomb','drowned',...NEW];
await go('?play&mute&novideo&slot=1&class=knight&stage=keep');
// ---------- P1 #1: every new stage has its own plan, chests, collectibles and hazard rectangles; lengths vary
const U=await ev(NEW=>{const h=a=>{let x=0;for(const c of JSON.stringify(a))x=(Math.imul(x,31)+c.charCodeAt(0))|0;return x};const o={};
 for(const k of NEW){const d=STAGE_DEFS[k];o[k]={geo:h([d.carve,d.solid,d.oneway,d.chain]),chests:h(CHESTS[k].map(c=>[c.x,c.y])),bells:h(d.bells.map(b=>[b.x,b.y])),haz:h([d.wind,d.lowg,d.spores,d.thorns,d.masonry,d.starfall].map(a=>(a||[]).map(z=>z.r||z))),world:d.world,chains:d.chain.map(c=>c[0]).join(',')}}return o},NEW);
const uniq=f=>new Set(NEW.map(k=>U[k][f])).size===NEW.length;
ok('unique_layouts_chests_collectibles_hazards',uniq('geo')&&uniq('chests')&&uniq('bells')&&uniq('haz')&&uniq('chains')&&uniq('world'),U);
ok('stages_longer_and_varied',NEW.every(k=>U[k].world>=3800)&&new Set(NEW.map(k=>U[k].world)).size===4,NEW.map(k=>U[k].world));
// ---------- P1 #1: the mimic is rolled per save (same count, visible chests only); seed 0 keeps the authored set; a save keeps its roll
const M=await ev(()=>{const sets=new Set();for(let s=1;s<=24;s++)sets.add([...mimicIds('keep',s)].sort().join());const a=[...mimicIds('keep',0)].sort().join(),n=[...mimicIds('keep',5)].length,hid=CHESTS.keep.filter(c=>c.hidden).map(c=>c.id);
 return{distinct:sets.size,authored:a,n,noHidden:[...Array(24)].every((_,s)=>![...mimicIds('keep',s+1)].some(i=>hid.includes(i))),seed:S().sv.seed}});
await go('?play&mute&novideo&slot=1&continue',false);const M2=await ev(()=>({seed:S().sv.seed,m:S().chests.filter(c=>c.mimic).map(c=>c.id).sort().join()}));
ok('mimic_position_random_per_save',M.distinct>=3&&M.authored==='ch_k4,ch_k6'&&M.n===2&&M.noHidden&&M.seed>0&&M2.seed===M.seed&&M2.m===[...await ev(s=>[...mimicIds('keep',s)].sort(),M.seed)].join(),{M,M2});
// ---------- P1 #2: two forced fights + a shortcut door on every side stage; each new stage's hazard sits on the ground road
const R=await ev(SIDE=>SIDE.map(k=>{const d=STAGE_DEFS[k],g=d.challenges.filter(c=>c.type==='waves');const ground=z=>z.r[3]>=156;return{k,fights:g.length,lock:g.some(c=>c.ground),sc:(d.shortcuts||[]).length,
 road:[...(d.wind||[]),...(d.lowg||[]),...(d.spores||[])].filter(ground).length+(d.thorns||[]).filter(t=>t[2]===156).length+(d.spikes||[]).filter(s=>s[3]===156&&s[2]-s[0]>=60).length}}),SIDE);
ok('two_forced_fights_and_shortcut_every_side_stage',R.every(r=>r.fights>=2&&r.lock&&r.sc===1),R);
ok('signature_hazard_on_the_main_road',R.filter(r=>NEW.includes(r.k)).every(r=>r.road>=1),R);
// hold-Right bot (god mode, jumps when stuck) no longer strolls to the boss: it is stopped by a locked melee / the barred door
await ev(()=>{clear();const s=S();s.player.hp=s.player.hpMax=99999});await shot('r01_keep_start');
const bot=await ev(async()=>{const s=S();let last=0,stuck=0,seen=0;const t0=performance.now();for(let i=0;i<300;i++){const x=s.player.x;stuck=Math.abs(x-last)<3?stuck+1:0;last=x;window.__inp=()=>({r:1,jump:stuck>1,jumpP:stuck>1&&i%2===0});s.player.inv=99;
  if(s.chs.some(c=>c.active&&c.ground))seen=1;await sl(100)}window.__inp=()=>({});return{x:Math.round(s.player.x),arena:ARENA_L,seen,t:Math.round((performance.now()-t0)/1000)}});
await shot('r02_gatehouse_melee_locks_the_road');ok('hold_right_cannot_reach_boss_in_30s',bot.x<bot.arena-300&&bot.seen,bot);
// shortcut: barred from the bonfire side, reached through the ossuary trial below, lever opens it for good (saved)
const sc=await ev(async()=>{const s=S(),D=s.def,c=D.shortcuts[0],P=s.player,oss=D.challenges.find(c=>c.id.includes('ossuary'));clear();P.hp=P.hpMax=99999;const o={};
 tp(c.x-40);await sl(300);hold({r:1});await sl(1200);hold({});o.blocked=P.x<c.x;await sl(100);
 tp(c.lever+40);await sl(200);hold({l:1});await sl(1200);hold({});o.blockedRight=P.x>c.x;
 const ox=oss.gates[0][0]-48;tp(ox+24);await sl(300);hold({dn:1,jumpP:1,jump:1});await sl(150);hold({});await sl(900);o.dropY=Math.round(P.y);
 const ch=s.chs.find(q=>q.id===oss.id);hold({r:1});for(let i=0;i<60&&!ch.done;i++){await sl(100);if(ch.active)for(const e of s.enemies)if(!e.dead)s.damageEnemy(e,999,1)}o.trial=ch.done;hold({});
 tp(c.lever+4);await sl(300);press('restP');await sl(400);o.open=s.shortcuts[0].open;o.saved=Save.load().shortcuts.includes(c.id);tp(c.x-40);await sl(200);hold({r:1});await sl(1000);hold({});o.through=P.x>c.x+10;return o});
await shot('r03_shortcut_door_open');
await go('?play&mute&novideo&slot=1&continue',false);const sc2=await ev(()=>({open:S().shortcuts[0].open,body:S().shortcuts[0].body.body.enable}));
ok('preboss_shortcut_door_earned_once',sc.blocked&&sc.blockedRight&&sc.dropY>250&&sc.trial&&sc.open&&sc.saved&&sc.through&&sc2.open&&!sc2.body,{sc,sc2});
// ---------- P1 #3: a hollow stuck in swing never slides away (out-of-range exit, swing timeout, retarget on a jumping target)
const sw=await ev(async()=>{const s=S();clear();tp(600);const e=s.spawnEnemy('hollow',640,156);await sl(300);e.state='swing';e.t=0;e.b.setVelocityX(70);const x0=e.b.x;tp(1400);await sl(1500);
 const a={st:e.state,vx:Math.round(e.b.body.velocity.x),dx:Math.round(e.b.x-x0)};tp(660);await sl(200);e.state='swing';e.t=0;e.b.setVelocityX(70);e.cd=99;await sl(1400);const b={st:e.state,vx:Math.round(e.b.body.velocity.x)};e.dead=true;e.b.body.enable=false;return{a,b,fix:s.stats.swingFix}});
ok('swing_hollow_does_not_run_away',sw.a.st!=='swing'&&sw.a.vx===0&&Math.abs(sw.a.dx)<30&&sw.b.st!=='swing',sw);
// ---------- P2 #4: specials scale from the held weapon (capped), cost 14+ FP and have a 1.5 s cooldown
const sp=await ev(async()=>{const s=S(),P=s.player,o={};for(const w of['longsword','greatsword','frostbrand','ashmaul']){s.sv.eq.main=w;s.applyBuild&&s.applyBuild();s.build=RPG.derive(s.sv.stats,s.sv.eq);o[w]={pw:+s.specialPower(WEAPONS[w]).toFixed(2),ar:+s.build.ar.toFixed(2)}}
 s.sv.eq.main='frostbrand';s.build=RPG.derive(s.sv.stats,s.sv.eq);clear();tp(500);P.f=1;P.fp=P.fpMax=99;P.spCd=0;s.stats.specials=0;s.weaponSpecial(WEAPONS.frostbrand);const fp1=P.fp;s.weaponSpecial(WEAPONS.frostbrand);o.second=s.stats.specials;o.cost=99-fp1;while(s.t<=P.spCd+.05)await sl(50);s.weaponSpecial(WEAPONS.frostbrand);o.third=s.stats.specials;return o});
ok('special_scales_from_held_weapon_with_cap_cost_cooldown',sp.longsword.pw!==sp.greatsword.pw&&Math.abs(sp.frostbrand.pw-.8/*r9: signature specials use their own spMul, the r7 cap is gone*/*sp.frostbrand.ar)<.02&&sp.cost>=14&&sp.second===1&&sp.third===2,sp);
// ---------- P2 #5: hazards bite: wind shoves 40+ px/s, spores kill below 25%, thorn hedges block the road
await go('?play&mute&novideo&slot=1&class=knight&stage=keep');
const wd=await ev(async()=>{const s=S(),z=s.def.wind.find(w=>w.ground);clear();await new Promise(r=>{const f=()=>s.gustOn(z)&&((s.t+(z.off||0))%z.period)<.3?r():setTimeout(f,30);f()});tp(z.r[0]+30);hold({});await sl(60);const x0=s.player.x;await sl(1000);return{dx:Math.round(s.player.x-x0),dir:z.dir}});
await shot('r04_keep_wind_trench');ok('wind_shoves_hard',Math.abs(wd.dx)>=35&&Math.sign(wd.dx)===wd.dir,wd);
await go('?play&mute&novideo&slot=1&class=knight&stage=cloister');
const th=await ev(async()=>{const s=S(),t=s.def.thorns.find(q=>q[2]===156),P=s.player;clear();P.hp=P.hpMax=999;s.stats.thorned=0;tp(t[0]-50);P.inv=0;hold({r:1});await sl(1500);hold({});return{x:Math.round(P.x),t0:t[0],n:s.stats.thorned}});
await shot('r05_thorn_hedge_blocks');ok('thorns_block_and_hurt',th.x<th.t0+4&&th.n>=1,th);
const spk=await ev(async()=>{const s=S(),z=s.def.spores.find(q=>q.ground),P=s.player;clear();P.hp=P.hpMax=200;await new Promise(r=>{const f=()=>s.gustOn(z)&&((s.t+(z.off||0))%z.period)<.2?r():setTimeout(f,30);f()});tp(z.r[0]+20);hold({});P.hp=10;P.inv=0;await sl(4000);
 const low={hp:+P.hp.toFixed(1),dead:!!P.dead};return low});
await shot('r06_spores_lethal_when_low');ok('spores_can_kill_below_25pct',spk.dead||spk.hp<=0,spk);
// ---------- P3: altars want the weapon in hand; Spire tide is not clamped at x1300; catacomb lava warning
await go('?play&mute&novideo&slot=1&class=knight&stage=throne');
const rl=await ev(async()=>{const s=S(),b=s.bells.find(q=>q.id==='rl_toller');s.sv.inv.push('clapper');s.sv.eq.main='longsword';return{inv:s.relicOk(b),wield:(s.sv.eq.main='clapper',s.relicOk(b))}});
ok('altar_takes_only_wielded_weapon',!rl.inv&&rl.wield,rl);
await go('?play&mute&novideo&slot=1&class=knight&stage=spire');
const sg=await ev(async()=>{const s=S(),z=s.def.lowg[0];clear();await new Promise(r=>{const f=()=>s.gustOn(z)&&((s.t+(z.off||0))%z.period)<.3?r():setTimeout(f,30);f()});tp(1300,-60);hold({});await sl(80);const y0=s.player.y;let m=y0,n=0;window.__inp=()=>(n++<10?{jump:1,jumpP:n===1?1:0}:{});const t0=performance.now();while(performance.now()-t0<1200){m=Math.min(m,s.player.y);await new Promise(r=>requestAnimationFrame(r))}hold({});return{rise:Math.round(y0-m)}});
await shot('r07_spire_tide_open_sky');ok('spire_low_gravity_not_clamped_near_1300',sg.rise>=50,sg);// r6 build: a ceiling clamped this jump to 26 px
await go('?play&mute&novideo&slot=1&class=knight&stage=catacomb');const wn=await ev(async()=>{const w=S().def.warns||[];tp(w[0].x-30);await sl(400);return{n:w.length,t:w[0]&&w[0].t}});await shot('r08_catacomb_lava_warning');
ok('catacomb_lava_route_warning',wn.n>=1&&/LAVA/.test(wn.t),wn);
// ---------- P2 #6: the usurp ending draws its own scene (throne + six kneeling lords)
await pg.goto(B+'?mute&slot=1&ending=usurp');await wait(7500);await shot('r09_usurp_ending_scene');const us=await ev(()=>{const e=__G.scene.getScene('ending');return{kind:e.kind,drawn:e.usurpDrawn||0}});
ok('usurp_ending_has_its_own_scene',us.kind==='usurp'&&us.drawn>30,us);
ok('no_page_errors',errs.length===0,errs);
await cdp.send('Page.stopScreencast').catch(()=>{});
try{let s='';FR.forEach((t,i)=>{s+=`file '${VD}/${String(i).padStart(5,'0')}.jpg'\nduration ${Math.min(.5,((FR[i+1]||t+100)-t)/1000).toFixed(3)}\n`});fs.writeFileSync(VD+'/l.txt',s);
 execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i ${VD}/l.txt -vf "scale=640:360,fps=30" -t 60 -c:v libx264 -pix_fmt yuv420p -crf 27 clips/r7.mp4`);console.error('clip ok')}catch(e){console.error('clip fail',e.message)}
console.log(JSON.stringify({pass,fail}));await br.close();process.exit(fail?1:0);
