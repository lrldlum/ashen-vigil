// usage: node test/clipOW1.mjs <framedir> — Ramparts walked room to room (CDP screencast frames + ffmpeg concat list)
import { chromium } from './node_modules/playwright/index.mjs';import fs from 'fs';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`,D=process.argv[2];fs.mkdirSync(D,{recursive:true});
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const pg=await (await br.newContext({viewport:{width:960,height:540}})).newPage();const cdp=await pg.context().newCDPSession(pg);
let n=0;const list=[];cdp.on('Page.screencastFrame',async f=>{const fn=`${D}/f${String(n++).padStart(5,'0')}.jpg`;fs.writeFileSync(fn,Buffer.from(f.data,'base64'));list.push([fn,f.metadata.timestamp]);cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{})});
await pg.goto(B+'?play&mute&slot=1&class=knight&stage=ramparts');await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player);await pg.waitForTimeout(1200);
await pg.evaluate(()=>{const s=__G.scene.getScene('stage');s.msg=null;s.player.inv=1e9;s.player.hp=s.player.hpMax=9999;s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false});s.pb.setPosition(380,140)});await pg.waitForTimeout(400);
await cdp.send('Page.startScreencast',{format:'jpeg',quality:90,everyNthFrame:1});
await pg.evaluate(()=>{let t=0;window.__inp=()=>(t++,{r:1,jump:t%90<8})});await pg.waitForTimeout(9000);await pg.evaluate(()=>{window.__inp=null});
await cdp.send('Page.stopScreencast');
let txt='';for(let i=0;i<list.length;i++){const d=i<list.length-1?Math.min(.2,Math.max(.001,list[i+1][1]-list[i][1])):.04;txt+=`file '${list[i][0]}'\nduration ${d.toFixed(4)}\n`}
fs.writeFileSync(D+'/list.txt',txt);console.log('frames',list.length);await br.close();
