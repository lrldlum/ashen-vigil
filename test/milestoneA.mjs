// Headless checks for milestone A. usage: node test/milestoneA.mjs   (server on :8171)
import { chromium } from 'playwright';
const B='http://127.0.0.1:8171/';const S='screenshots/A/after/';
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader','--autoplay-policy=no-user-gesture-required']});
const errs=[],ext=[],R={};let pass=0,fail=0;const ok=(n,c,v)=>{R[n]={pass:!!c,v};c?pass++:fail++};
async function page(url,opt={}){const ctx=await br.newContext({viewport:opt.vp||{width:1280,height:720},hasTouch:!!opt.touch,isMobile:!!opt.touch});const pg=await ctx.newPage();
 pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error'&&!/favicon|404/.test(m.text()))errs.push(m.text())});
 pg.on('request',r=>{const u=r.url();if(!u.startsWith(B)&&!/^(data|blob):/.test(u))ext.push(u)});
 if(opt.clear!==false){await pg.goto(B+'assets/README.md').catch(()=>{});}
 await pg.goto(B+url);await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player,null,{timeout:20000}).catch(()=>{});await pg.waitForTimeout(1500);return pg}
const ev=(pg,f,a)=>pg.evaluate(f,a);
const frames=(pg,n)=>pg.evaluate(n=>new Promise(r=>{let k=0;const f=()=>++k>=n?r():requestAnimationFrame(f);requestAnimationFrame(f)}),n);
// --- roll + stamina
let pg=await page('?play&mute');
await ev(pg,()=>localStorage.clear());
R.roll=await ev(pg,()=>new Promise(res=>{const s=__G.scene.getScene('stage');const st0=s.player.st;s.keys.C.isDown=true;s.keys.C._justDown=true;let fr=0,inv=0,x0=s.player.x,started=false;
 const f=()=>{const P=s.player;if(P.state==='roll'){started=true;fr++;if(P.t>=AV.TUNE.iF0&&P.t<AV.TUNE.iF1)inv++}else if(started){s.keys.C.isDown=false;return res({frames:fr,iframes:inv,pct:Math.round(inv/fr*100),dist:Math.round(Math.abs(P.x-x0)),cost:Math.round(st0-s.player.st)})}requestAnimationFrame(f)};requestAnimationFrame(f)}));
ok('roll_iframes_<=60%',R.roll.pct<=60&&R.roll.pct>=45,R.roll);
await pg.waitForTimeout(2500);
R.stam=await ev(pg,()=>new Promise(res=>{const s=__G.scene.getScene('stage');let n=0,refused=0,k=0;const go=()=>{const P=s.player;if(k++>=10)return res({attacks:n,refused,st:Math.round(P.st),flashSeen:refused>0});
  const before=P.state;s.keys.X._justDown=true;s.keys.X.isDown=true;setTimeout(()=>{s.keys.X.isDown=false;if(P.state==='atk')n++;else refused++;setTimeout(go,280)},40)};go()}));
ok('stamina_runs_dry_in_10_attacks',R.stam.refused>0,R.stam);
// --- flask heal + interrupt
await pg.waitForTimeout(3000);
R.flask=await ev(pg,()=>new Promise(res=>{const s=__G.scene.getScene('stage'),P=s.player;P.hp=30;s.keys.Q._justDown=true;setTimeout(()=>{const a={hp:Math.round(P.hp),flasks:P.flasks};
  P.hp=30;P.inv=0;s.keys.Q._justDown=true;setTimeout(()=>{s.hurtPlayer(5,P.x+10);setTimeout(()=>res({full:a,interrupted:{hp:Math.round(P.hp),flasks:P.flasks,state:P.state}}),700)},250)},800)}));
ok('flask_heals_40',R.flask.full.hp===70&&R.flask.full.flasks===2,R.flask.full);ok('flask_interruptible',R.flask.interrupted.hp<65&&R.flask.interrupted.flasks===1,R.flask.interrupted);
await pg.screenshot({path:S+'10_flask.png'});
// --- rest radius + refill
R.rest=await ev(pg,()=>new Promise(res=>{const s=__G.scene.getScene('stage');s.pb.x=s.bonfire.x+25;setTimeout(()=>{s.keys.UP._justDown=true;setTimeout(()=>res({lit:s.bonfire.lit,flasks:s.player.flasks,dist:Math.round(s.player.x-s.bonfire.x)}),300)},300)}));
ok('rest_at_25px',R.rest.lit&&R.rest.flasks===3,R.rest);
// --- souls drop + recovery
R.souls=await ev(pg,()=>new Promise(res=>{let s=__G.scene.getScene('stage');s.souls=777;s.pb.x=900;setTimeout(()=>{s.player.hp=0;setTimeout(()=>{s=__G.scene.getScene('stage');const st=s.stain&&{...s.stain},souls0=s.souls;
  s.pb.x=st.x-60;setTimeout(()=>{s.pb.x=st.x;setTimeout(()=>res({stain:st,soulsAfterDeath:souls0,soulsAfterPickup:s.souls,stainLeft:!!s.stain,save:JSON.parse(localStorage.getItem('ashenVigil.save.v1'))}),400)},300)},3600)},200)}));
ok('souls_recovered',R.souls.stain&&R.souls.stain.souls===777&&R.souls.soulsAfterDeath===0&&R.souls.soulsAfterPickup===777&&!R.souls.stainLeft,R.souls);
// --- parry + riposte on hollow, knight block
R.parry=await ev(pg,()=>new Promise(res=>{const s=__G.scene.getScene('stage'),P=s.player;const e=s.enemies.find(e=>e.k==='hollow'&&!e.dead);s.pb.x=e.b.x-14;P.f=1;P.inv=0;
  setTimeout(()=>{e.f=-1;e.state='swing';e.t=0;P.state='parry';P.t=0;setTimeout(()=>{const st=e.state;s.keys.X._justDown=true;setTimeout(()=>res({enemyState:st,dead:e.dead,ripostes:s.stats.ripostes,parries:s.stats.parries,hp:P.hp}),500)},60)},300)}));
ok('parry_staggers_riposte_kills',R.parry.enemyState==='stag'&&R.parry.dead&&R.parry.ripostes===1,R.parry);
R.knight=await ev(pg,()=>new Promise(res=>{const s=__G.scene.getScene('stage'),P=s.player;const e=s.enemies.find(e=>e.k==='knight'&&!e.dead);s.pb.x=e.b.x-14;P.f=1;P.st=100;e.f=-1;e.state='chase';e.cd=9;
  setTimeout(()=>{e.f=-1;const hp0=e.hp;s.keys.X._justDown=true;setTimeout(()=>res({hp0,hp:e.hp,guard:e.guard}),350)},200)}));
ok('knight_blocks_front',R.knight.hp===R.knight.hp0&&R.knight.guard===2,R.knight);
// --- pause
await pg.keyboard.press('Escape');await pg.waitForTimeout(300);R.pause=await ev(pg,()=>__G.scene.getScene('stage').paused);await pg.screenshot({path:S+'11_pause.png'});await pg.keyboard.press('Escape');
ok('esc_pause',R.pause===true,R.pause);
await pg.close();
// --- boss: flash ratio, victory card, NG+
pg=await page('?demo&boss&mute');await ev(pg,()=>localStorage.clear());
await pg.waitForFunction(()=>__G.scene.getScene('stage').bossState==='fight',null,{timeout:20000});
R.bossFlash=await ev(pg,()=>new Promise(res=>{const s=__G.scene.getScene('stage');let n=0,fl=0,T=0,FT=0;const f=()=>{s.damageBoss(0);n++;T+=s.dt;if(s.boss.flash>0){fl++;FT+=s.dt}if(n<60)requestAnimationFrame(f);else res({frames:n,flashFrames:fl,T:+T.toFixed(2),pctTime:Math.round(FT/T*100)})};requestAnimationFrame(f)}));
R.bossFlash.maxAllowed=2*Math.ceil(R.bossFlash.T/.15)+2;ok('boss_flash_2f_per_150ms',R.bossFlash.flashFrames<=R.bossFlash.maxAllowed,R.bossFlash);
R.tell=await ev(pg,()=>new Promise(res=>{const s=__G.scene.getScene('stage'),B=s.boss;const t0=performance.now();const f=()=>{if(B.state==='wind'){return res({next:B.next,windup:B.wt,eyeFlash:B.eyeFlash>0})}if(performance.now()-t0>8000)return res(null);requestAnimationFrame(f)};f()}));
ok('boss_windup_>=0.5s',R.tell&&R.tell.windup>=.6,R.tell);
await pg.waitForTimeout(150);await pg.screenshot({path:S+'12_boss_tell.png'});
await ev(pg,()=>{__G.scene.getScene('stage').boss.hp=0});await pg.waitForFunction(()=>__G.scene.getScene('stage').victory&&__G.scene.getScene('stage').victory.t>1,null,{timeout:12000});
await pg.screenshot({path:S+'13_victory.png'});R.victory=await ev(pg,()=>({card:!!__G.scene.getScene('stage').victory}));
await pg.keyboard.press('Enter');await pg.waitForTimeout(2500);R.ng=await ev(pg,()=>{const s=__G.scene.getScene('stage');return{ng:s.ng,sid:s.sid,bossState:s.bossState,victory:!!s.victory}});
// milestone C: stage 1's card now leads ONWARD to stage 2 (NG+ moved to the final lord; covered in milestoneC.mjs)
ok('victory_card_then_onward',R.victory.card&&R.ng.sid==='cathedral'&&R.ng.bossState!=='dead'&&!R.ng.victory,{...R.victory,...R.ng});
await pg.close();
// --- touch controls (landscape phone) using real CDP touch events
pg=await page('?play&mute',{vp:{width:844,height:390},touch:1});await ev(pg,()=>localStorage.clear());
const cdp=await pg.context().newCDPSession(pg);
const box=await ev(pg,()=>{const r=document.querySelector('canvas').getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}});
const at=(gx,gy)=>({x:box.x+gx*box.w/320,y:box.y+gy*box.h/180});
const hold=async(gx,gy,ms)=>{const p=at(gx,gy);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y,id:1}]});await pg.waitForTimeout(ms);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})};
const x0=await ev(pg,()=>__G.scene.getScene('stage').player.x);
await hold(56,152,700);const x1=await ev(pg,()=>__G.scene.getScene('stage').player.x);
await pg.screenshot({path:S+'14_touch_controls.png'});
await hold(270,162,60);const st=await ev(pg,()=>__G.scene.getScene('stage').player.state);
await pg.waitForTimeout(500);await hold(298,148,120);const vy=await ev(pg,()=>Math.round(__G.scene.getScene('stage').pb.body.velocity.y));
R.touch={touchEnabled:await ev(pg,()=>__G.scene.getScene('stage').touch),moved:Math.round(x1-x0),atkState:st,jumpVy:vy};
ok('touch_move_attack_jump',R.touch.moved>30&&R.touch.atkState==='atk'&&R.touch.jumpVy<0,R.touch);
await pg.close();
pg=await page('?play&mute',{vp:{width:390,height:844},touch:1});R.portrait=await ev(pg,()=>getComputedStyle(document.getElementById('rot')).display);await pg.screenshot({path:S+'15_portrait_prompt.png'});
ok('portrait_rotate_prompt',R.portrait==='flex',R.portrait);await pg.close();
// --- title continue menu
pg=await page('?mute');await ev(pg,()=>localStorage.setItem('ashenVigil.save.v1',JSON.stringify({bonfire:true,souls:42,bossDown:false})));await pg.reload();await pg.waitForTimeout(2000);
await pg.screenshot({path:S+'16_title_menu.png'});await pg.keyboard.press('Enter');await pg.waitForTimeout(1500);
R.cont=await ev(pg,()=>{const s=__G.scene.getScene('stage');return s&&s.player?{souls:s.souls,x:Math.round(s.player.x),lit:s.bonfire.lit}:null});
ok('title_continue',R.cont&&R.cont.souls===42&&R.cont.lit,R.cont);await pg.close();
ok('no_page_errors',errs.length===0,errs);ok('no_external_requests',ext.length===0,ext);
console.log(JSON.stringify(R,null,1));console.log(`PASS ${pass} / ${pass+fail}`);await br.close();
