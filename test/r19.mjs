// r19: (1) the kill toast after a Frost Ringer dies never covers the Bells objective line (desktop + mobile);
// (2) 0 HTTP 404s / failed requests over N loads (incl. the /favicon.ico probe Chrome makes on the first page of a fresh profile)
import { chromium } from './node_modules/playwright/index.mjs';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`,N=+(process.env.N||10);let pass=0,fail=0;const ok=(n,c,d)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(d)))};
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const SHOT=process.env.SHOT||'';
for(const[name,ctxo]of[['desktop',{viewport:{width:960,height:540}}],['mobile',{viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2}]]){
 const ctx=await br.newContext(ctxo),pg=await ctx.newPage(),errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto(B+'assets/README.md');await pg.evaluate(()=>localStorage.clear());await pg.goto(B+'?play&mute&novideo&slot=1&class=knight&stage=belltower&seed=0');
 await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000}).catch(async e=>{await pg.screenshot({path:'/tmp/to_'+name+'.png'});throw e});await pg.waitForTimeout(1200);
 const clip=await pg.evaluate(()=>{const s=__G.scene.getScene('stage');s.msg=null;const r=document.querySelector('canvas').getBoundingClientRect(),z=r.width/320;return{x:r.left+32*z,y:r.top+34*z,width:64*z,height:10*z}});
 await pg.waitForTimeout(200);const before=await pg.screenshot({clip});
 const r=await pg.evaluate(async()=>{const s=__G.scene.getScene('stage');const e=s.enemies.find(e=>e.mb==='bt_ringer');if(!e)return{noringer:1};e.hp=0;try{s.damageEnemy(e,999,1)}catch(x){e.dead=true}await new Promise(r=>setTimeout(r,400));return{msg:s.msg&&s.msg.s,toastTop:TOAST_Y-4,objBottom:44}});
 const after=await pg.screenshot({clip});if(SHOT)await pg.screenshot({path:`${SHOT}_${name}.png`});
 ok(`${name}: ringer kill shows the toast`,/FROST RINGER FELLED/.test(r.msg||''),r);
 ok(`${name}: toast band starts below the objective line`,r.toastTop>=r.objBottom,r);
 ok(`${name}: objective line pixels unchanged while the toast is up`,Buffer.compare(before,after)===0);
 ok(`${name}: no page errors`,!errs.length,errs);await ctx.close()}
let bad=[];for(let i=0;i<N;i++){const ctx=await br.newContext({viewport:{width:960,height:540}}),pg=await ctx.newPage();
 pg.on('response',r=>{if(r.status()>=400)bad.push(i+':'+r.status()+' '+r.url())});pg.on('requestfailed',r=>bad.push(i+':FAIL '+r.url()));pg.on('console',m=>{if(m.type()==='error'&&/404|Failed to load/.test(m.text()))bad.push(i+':console '+m.text())});
 await pg.goto(B+'assets/README.md');await pg.evaluate(()=>localStorage.clear());await pg.goto(B+`?play&mute&novideo&slot=1&class=knight&stage=${['cathedral','ramparts','belltower'][i%3]}`);await pg.waitForTimeout(3500);await ctx.close()}
ok(`0 404s / failed requests over ${N} loads`,!bad.length,bad);
console.log(`\n${pass} passed, ${fail} failed`);await br.close();process.exit(fail?1:0);
