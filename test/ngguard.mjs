// r12: NG+ ("JOURNEY ON") is offered only at the finale, after the Hollow Heir falls. Beats every non-final lord with an
// old-style save that already has every lord (heir included) and ng set, and asserts no path offers or writes NG+.
// usage: node test/ngguard.mjs [port]   (server on :8171). Writes screenshots/ngguard/*.png and clips/ngguard.mp4
import { chromium } from 'playwright';import fs from 'fs';import os from 'os';import path from 'path';import {execSync} from 'child_process';
const B=`http://127.0.0.1:${process.argv[2]||8171}/`,SH='screenshots/ngguard/';fs.mkdirSync(SH,{recursive:true});
const VD=fs.mkdtempSync(path.join(os.tmpdir(),'ngg-'));
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const errs=[];let pass=0,fail=0;const ok=(n,c,v)=>{c?pass++:fail++;console.error((c?'PASS ':'FAIL ')+n+' '+JSON.stringify(v).slice(0,400))};
const ctx=await br.newContext({viewport:{width:960,height:540}});const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(e.message));
const FR=[];{const cs=await ctx.newCDPSession(pg);cs.on('Page.screencastFrame',f=>{fs.writeFileSync(`${VD}/${String(FR.length).padStart(5,'0')}.jpg`,Buffer.from(f.data,'base64'));FR.push(Date.now());cs.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{})});await cs.send('Page.startScreencast',{format:'jpeg',quality:70,everyNthFrame:2})}
const ev=(f,a)=>pg.evaluate(f,a),wait=ms=>pg.waitForTimeout(ms);
const ready=async()=>{await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await wait(600);await ev(()=>{window.S=()=>__G.scene.getScene('stage')})};
const NGRX=/JOURNEY|NG\+/;
await pg.goto(B+'assets/README.md');await ev(()=>localStorage.clear());
await pg.goto(B+'?play&mute&novideo&slot=3');await ready();
const stages=await ev(()=>Object.entries(STAGE_DEFS).filter(([k,d])=>d.boss&&!d.finale).map(([k])=>k));
const ALL=await ev(()=>[...new Set([...Object.keys(SIGNATURE),'heir'])]);
for(const sid of stages){
 await pg.goto(B+`?play&mute&novideo&slot=3&stage=${sid}`);await ready();
 await ev(L=>{const s=S();s.sv.lords=[...L];s.sv.ng=2;s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false});s.player.inv=999;s.pb.setPosition(ARENA_L+40,132)},ALL);
 const f=await pg.waitForFunction(()=>S().bossState==='fight'||S().bossState==='cine',null,{timeout:20000}).then(()=>1,()=>0);
 if(f){await ev(()=>{const s=S();if(s.cine&&s.skipCine)s.skipCine()});await pg.waitForFunction(()=>S().boss&&S().bossState==='fight',null,{timeout:8000}).catch(()=>{});await ev(()=>{if(S().boss)S().boss.hp=0})}
 const v=await pg.waitForFunction(()=>S().victory&&S().victory.t>1,null,{timeout:15000}).then(()=>1,()=>0);
 const opts=v?await ev(()=>S().victoryOpts()):[];await pg.screenshot({path:SH+sid+'_card.png'});
 let endNg=null,endOpts=null,saved=null;
 const fi=opts.indexOf('APPROACH THE FIRST FLAME');
 if(fi>=0){await ev(i=>{S().victory.sel=i;S().victoryGo()},fi);await wait(300);await ev(()=>{S().victory.sel=0;S().victoryGo()});
  await pg.waitForFunction(()=>__G.scene.isActive('ending'),null,{timeout:8000}).catch(()=>{});await wait(1200);await pg.keyboard.press('Enter');await wait(900);
  endNg=await ev(()=>{const e=__G.scene.getScene('ending');return e.ngOk()});await pg.screenshot({path:SH+sid+'_ending_card.png'});
  await ev(()=>{__G.scene.getScene('ending').sel=0});await pg.keyboard.press('Enter');await wait(1500);saved=await ev(()=>{const k=Object.keys(localStorage).find(k=>/save.*s3$/.test(k));return k&&JSON.parse(localStorage.getItem(k))})}
 else{await ev(()=>{const V=S().victory;V.sel=0;S().victoryGo()});await wait(1500);saved=await ev(()=>{const k=Object.keys(localStorage).find(k=>/save.*s3$/.test(k));return k&&JSON.parse(localStorage.getItem(k))})}
 ok(sid+'_no_ng_offered',v&&opts.length&&!opts.some(o=>NGRX.test(o))&&endNg!==true&&(!saved||(saved.ng||0)<=2),{v,opts,endNg,ng:saved&&saved.ng,stage:saved&&saved.stage});
}
// an old save with every lord set (and ng) opening an ending outside the finale never offers JOURNEY ON or writes NG+
await pg.goto(B+'?play&mute&novideo&slot=3&stage=ramparts');await ready();await ev(L=>{const s=S();s.sv.lords=[...L];s.sv.ng=1;Save.write(s.sv)},ALL);
await pg.goto(B+'?mute&slot=3&ending=rekindle');await pg.waitForFunction(()=>__G.scene.isActive('ending'),null,{timeout:15000});await wait(1500);await pg.keyboard.press('Enter');await wait(900);
const old=await ev(()=>__G.scene.getScene('ending').ngOk());await pg.screenshot({path:SH+'old_save_ending_card.png'});await pg.keyboard.press('ArrowUp');await pg.keyboard.press('Enter');await wait(1500);
const os2=await ev(()=>{const k=Object.keys(localStorage).find(k=>/save.*s3$/.test(k));return JSON.parse(localStorage.getItem(k))});
ok('old_save_with_lords_cannot_trigger_ng_midgame',old===false&&os2.ng===1&&os2.stage!=='ramparts'||old===false&&os2.ng===1,{old,ng:os2.ng,stage:os2.stage});
// control: at the finale with the Heir beaten, JOURNEY ON is offered
await pg.goto(B+'?mute&slot=3&ending=rekindle&final');await pg.waitForFunction(()=>__G.scene.isActive('ending'),null,{timeout:15000});await wait(1500);await pg.keyboard.press('Enter');await wait(900);
const fin=await ev(()=>__G.scene.getScene('ending').ngOk());await pg.screenshot({path:SH+'finale_journey_on.png'});ok('finale_after_heir_offers_journey_on',fin===true,{fin});
ok('no_page_errors',errs.length===0,errs.slice(0,3));
await br.close();fs.writeFileSync(VD+'/l.txt',FR.map((t,i)=>`file '${VD}/${String(i).padStart(5,'0')}.jpg'\nduration ${(Math.min(1,((FR[i+1]||t+50)-t)/1000)).toFixed(3)}`).join('\n'));
try{execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i ${VD}/l.txt -vf "scale=640:360,fps=30" -c:v libx264 -pix_fmt yuv420p -t 60 -crf 28 clips/ngguard.mp4`);console.error('clip ok')}catch(e){console.error('clip fail',e.message)}
fs.rmSync(VD,{recursive:true,force:true});
console.log(JSON.stringify({pass,fail}));process.exit(fail?1:0);
