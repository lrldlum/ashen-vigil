// usage: node test/clip.mjs <framedir> — captures frames via CDP screencast (demo stage, frost dome, boss fight); encode with ffmpeg (see PROGRESS.md)
import { chromium } from 'playwright';import fs from 'fs';
const B='http://127.0.0.1:8171/',D=process.argv[2];fs.mkdirSync(D,{recursive:true});
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const pg=await (await br.newContext({viewport:{width:960,height:540}})).newPage();const cdp=await pg.context().newCDPSession(pg);
let n=0;const list=[];cdp.on('Page.screencastFrame',async f=>{const fn=`${D}/f${String(n++).padStart(5,'0')}.jpg`;fs.writeFileSync(fn,Buffer.from(f.data,'base64'));list.push([fn,f.metadata.timestamp]);cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{})});
const rec=()=>cdp.send('Page.startScreencast',{format:'jpeg',quality:90,everyNthFrame:1});
await pg.goto(B+'?demo&mute');await pg.waitForTimeout(800);await rec();await pg.waitForTimeout(11000);
await pg.evaluate(()=>{const s=__G.scene.getScene('stage');s.castDome(s.player.x,'p')});await pg.waitForTimeout(2200);
await cdp.send('Page.stopScreencast');await pg.goto(B+'?demo&boss&mute');await pg.waitForTimeout(600);await rec();await pg.waitForTimeout(17000);await cdp.send('Page.stopScreencast');
// concat list with real durations (gaps between segments capped)
let txt='';for(let i=0;i<list.length;i++){const d=i<list.length-1?Math.min(.2,Math.max(.001,list[i+1][1]-list[i][1])):.04;txt+=`file '${list[i][0]}'\nduration ${d.toFixed(4)}\n`}
fs.writeFileSync(D+'/list.txt',txt);console.log('frames',list.length,'span',(list.at(-1)[1]-list[0][1]).toFixed(1));await br.close();
