// The next stage and lord are always obvious: HUD 'Next' line, pause 'The road' list (cleared dimmed + struck, next gold), home marker over the next door.
// usage: PORT=8171 node test/objective.mjs [shotsDir]   (co-op sync of the line is checked in coopboss.mjs)
const {chromium}=await import(process.env.PW||'playwright');import fs from 'fs';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`,SD=process.argv[2]||'screenshots/objective';fs.mkdirSync(SD,{recursive:true});
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const errs=[];let pass=0,fail=0;const ok=(n,c,v)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+n+' '+JSON.stringify(v||'').slice(0,300))};
const pg=await (await br.newContext({viewport:{width:1280,height:720}})).newPage();pg.on('pageerror',e=>errs.push(e.message));
const S=f=>pg.evaluate(f),wait=ms=>pg.waitForTimeout(ms);
const load=async(q,lords)=>{await pg.goto(B+'assets/README.md');await S(()=>localStorage.clear());await pg.goto(B+'?play&mute&novideo&class=knight&'+q);
 await pg.waitForFunction(()=>{const s=window.__G&&__G.scene.getScene('stage');return s&&s.player&&s.sys.isActive()},null,{timeout:30000});await wait(800);
 if(lords)await pg.evaluate(l=>{const s=__G.scene.getScene('stage');s.sv.lords=l},lords)};
const st=()=>S(()=>{const s=__G.scene.getScene('stage');return{text:s.objText(),next:s.nextObj()}});
await load('stage=ramparts');let r=await st();await wait(2500);await pg.screenshot({path:SD+'/hud_next_ramparts.png'});
ok('fresh_next_is_ramparts_warden',r.next.sid==='ramparts'&&r.next.kind==='warden'&&/RAMPARTS/.test(r.text)&&/WARDEN/.test(r.text),r);
await load('stage=cinderdeep',['warden','cantor']);r=await st();ok('after_two_lords_next_is_cinderdeep_king',r.next.sid==='cinderdeep'&&r.next.kind==='king',r);
await pg.keyboard.press('Escape');await wait(400);const pz=await S(()=>__G.scene.getScene('stage').paused);await pg.screenshot({path:SD+'/pause_road.png'});ok('pause_shows_road',pz,{pz});await pg.keyboard.press('Escape');
await load('stage=shrine',['warden','cantor','king']);r=await st();await wait(3000);
const mk=await S(()=>{const s=__G.scene.getScene('stage'),D=s.def;return{stair:D.stair&&D.stair.x,hub:!!D.hub}});
await S(()=>{const s=__G.scene.getScene('stage');s.pb.setPosition(s.def.stair.x+30,s.pb.y-4)});await wait(1200);await pg.screenshot({path:SD+'/home_marker_belltower.png'});
ok('home_next_is_belltower_stair',mk.hub&&r.next.sid==='belltower'&&r.next.kind==='toller'&&mk.stair!=null,{r,mk});
await load('stage=shrine');
const all=await pg.evaluate(()=>{const s=__G.scene.getScene('stage');s.sv.lords=OBJECTIVE_ORDER.map(o=>o[1]);return s.objText()});ok('all_lords_done',/ALL LORDS/.test(all),all);
ok('no_page_errors',errs.length===0,errs.slice(0,3));console.log(`${pass} passed, ${fail} failed`);await br.close();process.exit(fail?1:0);
