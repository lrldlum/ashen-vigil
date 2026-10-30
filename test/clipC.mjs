// usage: node test/clipC.mjs <framedir> — stage 2 + 3 tour and both lords (CDP screencast frames + concat list for ffmpeg)
import { chromium } from 'playwright';import fs from 'fs';
const B='http://127.0.0.1:8171/',D=process.argv[2];fs.mkdirSync(D,{recursive:true});
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const pg=await (await br.newContext({viewport:{width:960,height:540}})).newPage();const cdp=await pg.context().newCDPSession(pg);
let n=0;const list=[];cdp.on('Page.screencastFrame',async f=>{const fn=`${D}/f${String(n++).padStart(5,'0')}.jpg`;fs.writeFileSync(fn,Buffer.from(f.data,'base64'));list.push([fn,f.metadata.timestamp]);cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{})});
const rec=()=>cdp.send('Page.startScreencast',{format:'jpeg',quality:90,everyNthFrame:1}),stop=()=>cdp.send('Page.stopScreencast');
const load=async q=>{await pg.goto(B+q);await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player);await pg.waitForTimeout(700);
 await pg.evaluate(()=>{window.S=()=>__G.scene.getScene('stage');window.tp=(x,y)=>{const s=S();s.pb.setPosition(x,y-8);s.pb.setVelocity(0,0);s.player.state='idle';s.player.inv=999;s.player.hp=100;s.camY=s.camTY=y-156};
  window.wallClimb=(goalY)=>{const c={dir:1,t:1};window.__inp=s=>{const P=s.player,o={jump:1},on=s.pb.body.blocked.down;c.t+=s.dt;if(P.y<goalY){o.r=1;return o}if(on&&c.t>.15){o.jumpP=1;o[c.dir>0?'r':'l']=1;c.t=0;return o}if(!on&&P.wallC>0&&s.pb.body.velocity.y>-60){c.dir=-P.wall;o.jumpP=1}o[c.dir>0?'r':'l']=1;return o}}})};
const seg=async(code,ms,arg)=>{await pg.evaluate(code,arg);await pg.waitForTimeout(ms)};
await pg.goto(B+'assets/README.md');await pg.evaluate(()=>localStorage.clear());
for(const [sid,pr,tw,cr] of [['cathedral',1700,200,2380],['cinderdeep',900,2200,300]]){
 await load('?play&mute&stage='+sid);await rec();
 await seg(()=>{tp(60,156);let t=0;window.__inp=()=>(t++,{r:1,jump:t%50<12})},2600);
 await seg(x=>{tp(x+30,156);wallClimb(30)},3000,pr);
 await seg(x=>{tp(x+140,156);window.__inp=s=>(s.player.y>30?{up:1}:{up:1,r:1})},3200,pr);
 await seg(x=>{tp(x+64,156);let n=0;window.__inp=()=>(n++<3?{dn:1,jumpP:1,jump:1}:{r:n%80<50})},2800,cr);
 await seg(x=>{tp(x+32,156);wallClimb(-104)},3000,tw);
 await stop();
 await pg.goto(B+'?demo&boss&mute&stage='+sid);await pg.waitForTimeout(500);await rec();await pg.waitForTimeout(9000);
 await pg.evaluate(()=>{const B=__G.scene.getScene('stage').boss;if(B)B.hp=B.hpMax*.6});await pg.waitForTimeout(4500);
 await pg.evaluate(()=>{const B=__G.scene.getScene('stage').boss;if(B)B.hp=B.hpMax*.3});await pg.waitForTimeout(6000);await stop()}
let txt='';for(let i=0;i<list.length;i++){const d=i<list.length-1?Math.min(.2,Math.max(.001,list[i+1][1]-list[i][1])):.04;txt+=`file '${list[i][0]}'\nduration ${d.toFixed(4)}\n`}
fs.writeFileSync(D+'/list.txt',txt);console.log('frames',list.length,'span',(list.at(-1)[1]-list[0][1]).toFixed(1));await br.close();
