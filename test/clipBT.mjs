// usage: node test/clipBT.mjs <framedir> — Bell Tower shaft: climb ledges, a toll knocks, icicles freeze, the Ringer swings
import { chromium } from './node_modules/playwright/index.mjs';import fs from 'fs';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`,D=process.argv[2];fs.mkdirSync(D,{recursive:true});
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const pg=await (await br.newContext({viewport:{width:960,height:540}})).newPage();const cdp=await pg.context().newCDPSession(pg);
let n=0;const list=[];cdp.on('Page.screencastFrame',async f=>{const fn=`${D}/f${String(n++).padStart(5,'0')}.jpg`;fs.writeFileSync(fn,Buffer.from(f.data,'base64'));list.push([fn,f.metadata.timestamp]);cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{})});
await pg.goto(B+'?play&mute&slot=1&class=knight&stage=belltower');await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').bt,null,{timeout:30000});await pg.waitForTimeout(1200);
await pg.evaluate(()=>{const s=__G.scene.getScene('stage');window.s=s;s.msg=null;s.player.inv=1e9;s.player.hp=s.player.hpMax=9999;s.enemies.forEach(e=>{if(!e.swing){e.dead=true;e.b.body.enable=false}});const L=s.def.shaft;s.pb.setPosition(L[0].x+10,L[0].y-10);s.bt.t=6;
 // a little climber bot: walk to the edge facing the next ledge, jump, hold jump
 window.__k=0;window.__inp=()=>{const P=s.player,L=s.def.shaft,on=s.pb.body.blocked.down;
  if(on)for(let i=0;i<L.length;i++)if(Math.abs(P.y-L[i].y)<3&&P.x>=L[i].x-3&&P.x<=L[i].x+L[i].w+3)window.__k=i;
  const cur=L[window.__k],nx=L[Math.min(window.__k+1,L.length-1)],goR=nx.x+nx.w/2>cur.x+cur.w/2,tx=nx.x+nx.w/2;
  if(on&&Math.abs(P.y-cur.y)>3){const cx=cur.x+cur.w/2;return{r:cx>P.x?1:0,l:cx<P.x?1:0}}
  const edge=goR?P.x>cur.x+cur.w-12:P.x<cur.x+12;
  if(on)return{r:goR?1:0,l:goR?0:1,jumpP:edge?1:0,jump:1};return{r:tx>P.x+3?1:0,l:tx<P.x-3?1:0,jump:1}}});
await cdp.send('Page.startScreencast',{format:'jpeg',quality:90,everyNthFrame:1});await pg.waitForTimeout(20000);
await pg.evaluate(()=>{window.__inp=null});await cdp.send('Page.stopScreencast');
let txt='';for(let i=0;i<list.length;i++){const d=i<list.length-1?Math.min(.2,Math.max(.001,list[i+1][1]-list[i][1])):.04;txt+=`file '${list[i][0]}'\nduration ${d.toFixed(4)}\n`}
fs.writeFileSync(D+'/list.txt',txt);console.log('frames',list.length,'top',await pg.evaluate(()=>Math.round(s.player.y)));await br.close();
