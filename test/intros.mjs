// Boss intros: every boss's intro plays and can be skipped (keyboard confirm, Esc, gamepad button); the Pale Cantor's pre-rendered
// video plays the first time; a second attempt (after a death) gets only the short beat. usage: PORT=8171 node test/intros.mjs [shotsDir]
// (PW=/path/to/playwright if 'playwright' is not resolvable from here)
const {chromium}=await import(process.env.PW||'playwright');import fs from 'fs';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`,SD=process.argv[2]||'';if(SD)fs.mkdirSync(SD,{recursive:true});
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader','--autoplay-policy=no-user-gesture-required']});
const errs=[];let pass=0,fail=0;const ok=(n,c,v)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+n+' '+JSON.stringify(v||'').slice(0,300))};
const BOSSES={ramparts:'warden',cathedral:'cantor',cinderdeep:'king',belltower:'toller',catacomb:'smith',drowned:'abbess',keep:'marshal',spire:'astronomer',cloister:'prioress',throne:'heir'};
const ctx=await br.newContext({viewport:{width:1280,height:720}});
await ctx.addInitScript(()=>{window.__pad={buttons:Array(17).fill(0).map(()=>({pressed:false,value:0})),axes:[0,0,0,0],connected:true,mapping:'standard',index:0,id:'fake'};
 window.__padOn=false;navigator.getGamepads=()=>window.__padOn?[window.__pad]:[]});
const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(e.message));
const S=f=>pg.evaluate(f);const wait=ms=>pg.waitForTimeout(ms);
const load=async(stage,clear=true,extra='')=>{if(clear){await pg.goto(B+'assets/README.md');await S(()=>localStorage.clear())}
 await pg.goto(B+`?play&mute&class=knight&stage=${stage}${extra}`);await pg.waitForFunction(()=>{const s=window.__G&&__G.scene.getScene('stage');return s&&s.player&&s.sys.isActive()},null,{timeout:30000});await wait(600)};
const enter=()=>S(()=>{const s=__G.scene.getScene('stage');s.player.inv=99;s.pb.setPosition(ARENA_L+40,140);s.pb.setVelocity(0,0)});
const st=()=>S(()=>{const s=__G.scene.getScene('stage'),c=s.cine;return{bs:s.bossState,cine:!!c,t:c?+c.t.toFixed(2):null,short:c?!!c.short:null,video:!!(c&&c.video),vel:!!document.getElementById('bossVideo'),kind:s.def.boss&&s.def.boss.kind}});
const until=async(f,ms=8000)=>{const t0=Date.now();while(Date.now()-t0<ms){const r=await st();if(f(r))return r;await wait(80)}return await st()};
const keys=['Enter','Escape'];let ki=0;
for(const[stage,kind] of Object.entries(BOSSES).filter(([k])=>!process.env.ONLY||process.env.ONLY.split(',').includes(k))){await load(stage);await enter();
 const a=await until(r=>r.cine);ok(`${kind}_intro_plays`,a.cine&&a.kind===kind&&!a.short,a);
 if(kind==='cantor'){const v=await until(r=>r.vel,3000);await wait(1500);
  const vt=await S(()=>{const v=document.getElementById('bossVideo');return v&&{t:+v.currentTime.toFixed(2),src:v.currentSrc.split('/').pop(),muted:v.muted,paused:v.paused}});
  ok('cantor_video_plays',v.video&&vt&&vt.t>0.3,vt);if(SD)await pg.screenshot({path:SD+'/cantor_video.png'})}
 else{await wait(2300);if(SD)await pg.screenshot({path:`${SD}/${kind}_intro.png`})}
 const k=keys[ki++%keys.length];
 if(kind==='astronomer'){await S(()=>{window.__padOn=true});await wait(150);await S(()=>{__pad.buttons[0]={pressed:true,value:1}});await wait(200);await S(()=>{__pad.buttons[0]={pressed:false,value:0}})}
 else await pg.keyboard.press(k);
 const b=await until(r=>r.bs==='fight'&&!r.cine,400);ok(`${kind}_intro_skips(${kind==='astronomer'?'pad A':k})`,b.bs==='fight'&&!b.cine&&!b.vel,b);
 await S(()=>{window.__padOn=false})}
// unskipped in-engine intro runs to the fight on its own
await load('belltower');await enter();const u=await until(r=>r.bs==='fight',9000);ok('toller_intro_runs_to_fight',u.bs==='fight'&&!u.cine,u);
// r10: grace period + only deliberate inputs skip
await load('ramparts');await enter();await until(r=>r.cine);await pg.keyboard.press('Enter');await wait(150);
const g1=await st();ok('early_enter_ignored(<0.7s)',g1.cine,g1);await wait(700);
for(const k of['x','z',' ','j','k'])await pg.keyboard.press(k);await pg.mouse.click(640,360);await wait(200);
const g2=await st();ok('attack_jump_click_do_not_skip',g2.cine,g2);
// r10: touch gets a small Skip button
await load('keep',true,'&touch');await enter();await until(r=>r.cine);await wait(900);
const hasBtn=await S(()=>!!document.getElementById('skipIntro'));await pg.click('#skipIntro');const tb=await until(r=>r.bs==='fight'&&!r.cine,500);
ok('touch_skip_button',hasBtn&&tb.bs==='fight'&&!(await S(()=>!!document.getElementById('skipIntro'))),{hasBtn,tb});
// r10: cantor video natural end goes straight to the fight (no second rise)
await load('cathedral');await enter();await until(r=>r.vel,4000);const ve=await until(r=>!r.vel,22000);const ne=await until(r=>r.bs==='fight',600);ok('video_end_no_double_rise',!ve.vel&&ne.bs==='fight',{ve,ne});
// after a death: the save remembers the intro, so the next attempt only gets the short beat (no video)
await load('cathedral');await enter();await until(r=>r.cine);await pg.keyboard.press('Escape');await until(r=>r.bs==='fight');
const seen=await S(()=>Save.load().seenIntro);await S(()=>{const s=__G.scene.getScene('stage');s.hurtPlayer(9999,s.player.x+10)});await pg.waitForFunction(()=>__G.scene.getScene('stage').player.dead,null,{timeout:5000}).catch(()=>{});
await S(()=>__G.scene.getScene('stage').respawn());await wait(1200);await enter();
const r3=await until(r=>r.bs==='fight',400);
ok('no_replay_after_death',seen&&seen.cantor&&!r3.cine&&!r3.vel&&r3.bs==='fight',{seen,r3});
ok('esc_does_not_pause_during_intro',!(await S(()=>__G.scene.getScene('stage').paused)));
ok('no_page_errors',errs.length===0,errs.slice(0,3));
console.log(`${pass} passed, ${fail} failed`);await br.close();process.exit(fail?1:0);
