// Headless checks for the r6 review fixes (keeper menu opens on TALK, bonfire menu opens on its first row, join gives up after 15 s with CONNECTION FAILED).
// Role colours and ROOM IS FULL status are checked in test/milestoneF.mjs (they need two linked players). usage: node test/r6fix.mjs (server on :8171)
import { chromium } from 'playwright';
const B='http://127.0.0.1:8171/',S='screenshots/r6/';
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const errs=[];let pass=0,fail=0;const ok=(n,c,v)=>{c?pass++:fail++;console.error((c?'PASS ':'FAIL ')+n+' '+JSON.stringify(v).slice(0,300))};const wait=ms=>new Promise(r=>setTimeout(r,ms));
const ctx=await br.newContext({viewport:{width:1280,height:720}});const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(e.message));const ev=(f,a)=>pg.evaluate(f,a);
await pg.goto(B+'assets/README.md');await ev(()=>localStorage.clear());
const stage=async q=>{await pg.goto(B+q);await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive());await wait(700);
 await ev(()=>{window.S=()=>__G.scene.getScene('stage');window.tp=(x,y=156)=>{const s=S();s.pb.setPosition(x,y-8);s.pb.setVelocity(0,0);s.player.state='idle';s.camY=s.camTY=y-156}})};
// 1. keeper: real Up (tap, and a held Up) opens on TALK (sel 0); Down then moves to WARES
await stage('?play&mute&novideo&stage=shrine&class=cleric');await wait(1500);const res=[];
for(const hold of[0,0,300]){await ev(()=>{S().menu=null;tp(S().def.keeper-6)});await wait(1000);
 if(hold){await pg.keyboard.down('ArrowUp');await wait(hold);await pg.keyboard.up('ArrowUp')}else await pg.keyboard.press('ArrowUp');await wait(350);
 const m=await ev(()=>S().menu?[S().menu.mode,S().menu.sel]:{lore:!!S().loreView,x:S().player.x,k:S().def.keeper,lores:S().lore.map(l=>l.x)});if(!hold)await pg.screenshot({path:S+'keeper_opens_on_talk.png'});await pg.keyboard.press('ArrowDown');await wait(150);const m2=await ev(()=>S().menu&&S().menu.sel);res.push({hold,m,m2})}
ok('keeper_menu_opens_on_talk',res.every(r=>r.m&&r.m[0]==='keeper'&&r.m[1]===0&&r.m2===1),res);
// 2. bonfire menu likewise opens on its first row
await stage('?play&mute&novideo');await ev(()=>{const s=S();tp(s.bonfire.x)});await wait(500);await pg.keyboard.press('ArrowUp');await wait(400);const bm=await ev(()=>S().menu&&[S().menu.mode,S().menu.sel]);
ok('bonfire_menu_opens_on_first_row',bm&&bm[1]===0,bm);
// 3. join timeout: a real room on the public broker, but this box can't open WebRTC, so the join must give up at ~15 s with CONNECTION FAILED
const H=await (await br.newContext()).newPage();await H.goto(B+'?host&mute&novideo');await H.waitForFunction(()=>NET.peer&&NET.peer.open,null,{timeout:20000});const code=await H.evaluate(()=>NET.code);
await pg.goto(B+'?mute&join='+code);const t0=Date.now();await pg.waitForFunction(()=>NET.jt0>0,null,{timeout:30000}).catch(()=>{});await wait(2000);const mid=await ev(()=>({st:NET.status,err:__G.scene.getScene('title').joinErr}));await pg.screenshot({path:S+'join_connecting.png'});
await pg.waitForFunction(()=>__G.scene.getScene('title').joinErr,null,{timeout:90000}).catch(()=>{});const wall=(Date.now()-t0)/1000;const dt=await ev(()=>NET.jtFired&&NET.jt0?+((NET.jtFired-NET.jt0)/1000).toFixed(2):-1);
const end=await ev(()=>({err:__G.scene.getScene('title').joinErr,joining:__G.scene.getScene('title').joining,role:NET.role,peer:!!NET.peer,mode:__G.scene.getScene('title').mode}));await pg.screenshot({path:S+'join_connection_failed.png'});
ok('join_times_out_with_message',/CONNECTION FAILED/.test(end.err||'')&&dt>14&&dt<17&&!end.joining&&end.role===null&&!end.peer&&end.mode==='code'&&/CONNECTING/.test(mid.st)&&!mid.err,{dt,wall,mid,end});
// retry possible from the keypad after a failure (ENTER restarts the attempt)
await pg.keyboard.press('Enter');await wait(400);const re=await ev(()=>({st:NET.status,joining:__G.scene.getScene('title').joining}));ok('can_retry_after_failure',/CONNECTING/.test(re.st)&&re.joining===1,re);
ok('no_errors',errs.length===0,errs);await br.close();console.log(JSON.stringify({pass,fail}));process.exit(fail?1:0);
