// usage: node test/clipB.mjs <framedir> — exploration tour (CDP screencast frames + concat list for ffmpeg)
import { chromium } from 'playwright';import fs from 'fs';
const B='http://127.0.0.1:8171/',D=process.argv[2];fs.mkdirSync(D,{recursive:true});
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const pg=await (await br.newContext({viewport:{width:960,height:540}})).newPage();const cdp=await pg.context().newCDPSession(pg);
let n=0;const list=[];cdp.on('Page.screencastFrame',async f=>{const fn=`${D}/f${String(n++).padStart(5,'0')}.jpg`;fs.writeFileSync(fn,Buffer.from(f.data,'base64'));list.push([fn,f.metadata.timestamp]);cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{})});
await pg.goto(B+'?play&mute');await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player);await pg.waitForTimeout(800);
await pg.evaluate(()=>{localStorage.removeItem('ashenVigil.save.v1');localStorage.removeItem('ashenVigil.save.v2');window.S=()=>__G.scene.getScene('stage');window.tp=(x,y)=>{const s=S();s.pb.setPosition(x,y-8);s.pb.setVelocity(0,0);s.player.state='idle';s.player.inv=999;s.player.hp=s.player.hpMax;s.camY=s.camTY=y-156}});
const seg=async(code,ms)=>{await pg.evaluate(code);await pg.waitForTimeout(ms)};
await pg.evaluate(()=>{const s=S();s.enemies.forEach(e=>{if(!e.dead&&e.b.x<1600)s.damageEnemy(e,999,1)});s.player.inv=999});await pg.waitForTimeout(600);
await cdp.send('Page.startScreencast',{format:'jpeg',quality:90,everyNthFrame:1});
await seg(()=>{let t=0;window.__inp=()=>(t++,{r:1,jump:t%50<12})},3000);                       // run & jump from bonfire
await seg(()=>{tp(372,156);let t=0;window.__inp=()=>(t++<200?{up:1}:{r:1})},4500);                 // chain climb to rooftop
await seg(()=>{tp(1112,156);let t=0;window.__inp=()=>(t++<20?{dn:1,jump:1}:{r:t%60<30})},3500);     // drop-through shaft
await seg(()=>{tp(2884,300);window.__inp=()=>(S().player.y>172?{up:1}:{up:1,r:1})},5000);           // ossuary climb out
await seg(()=>{window.__inp=null},300);
await cdp.send('Page.stopScreencast');await pg.goto(B+'?demo&boss&mute');await pg.waitForTimeout(600);
await cdp.send('Page.startScreencast',{format:'jpeg',quality:90,everyNthFrame:1});await pg.waitForTimeout(8000);await cdp.send('Page.stopScreencast');
let txt='';for(let i=0;i<list.length;i++){const d=i<list.length-1?Math.min(.2,Math.max(.001,list[i+1][1]-list[i][1])):.04;txt+=`file '${list[i][0]}'\nduration ${d.toFixed(4)}\n`}
fs.writeFileSync(D+'/list.txt',txt);console.log('frames',list.length,'span',(list.at(-1)[1]-list[0][1]).toFixed(1));await br.close();
