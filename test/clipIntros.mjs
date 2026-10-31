// records every r12 boss intro in order (1280x720) into one clip. usage: PORT=8192 PW=... node test/clipIntros.mjs out.mp4
const {chromium}=await import(process.env.PW||'playwright');import fs from 'fs';import {execSync} from 'child_process';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`,OUT=process.argv[2]||'clips/intros_r12.mp4',VD='/tmp/introclip';fs.rmSync(VD,{recursive:true,force:true});
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
fs.mkdirSync(VD,{recursive:true});const ctx=await br.newContext({viewport:{width:1280,height:720}});const pg=await ctx.newPage();let on=false;const FR=[];
const cdp=await ctx.newCDPSession(pg);cdp.on('Page.screencastFrame',f=>{if(on){const n=`${VD}/${String(FR.length).padStart(5,'0')}.jpg`;fs.writeFileSync(n,Buffer.from(f.data,'base64'));FR.push([n,Date.now()])}cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{})});
await cdp.send('Page.startScreencast',{format:'jpeg',quality:85,maxWidth:1280,maxHeight:720,everyNthFrame:1});
const marks=[];const T0=Date.now();
for(const stage of['ramparts','cathedral','cinderdeep','belltower','catacomb','drowned','keep','spire','cloister','throne']){
 await pg.goto(B+'assets/README.md');await pg.evaluate(()=>localStorage.clear());await pg.goto(B+`?play&mute&class=knight&stage=${stage}`);
 await pg.waitForFunction(()=>{const s=window.__G&&__G.scene.getScene('stage');return s&&s.player&&s.sys.isActive()},null,{timeout:30000});await pg.waitForTimeout(300);
 await pg.evaluate(()=>{const s=__G.scene.getScene('stage');s.player.inv=99;s.pb.setPosition(ARENA_L+40,140)});
 await pg.waitForFunction(()=>__G.scene.getScene('stage').cine);on=true;const a=(Date.now()-T0)/1000;await pg.waitForFunction(()=>__G.scene.getScene('stage').bossState==='fight',null,{timeout:15000});marks.push([a,(Date.now()-T0)/1000]);on=false;FR.push(null)}
await ctx.close();await br.close();
let L='';for(let i=0;i<FR.length;i++){const f=FR[i];if(!f)continue;const nx=FR[i+1];const d=nx?Math.min(.2,(nx[1]-f[1])/1000):1/30;L+=`file '${f[0]}'\nduration ${d.toFixed(3)}\n`}fs.writeFileSync(VD+'/list.txt',L);
execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i ${VD}/list.txt -vf "scale=1280:720,fps=30" -an -c:v libx264 -pix_fmt yuv420p ${OUT}`);console.log(OUT,marks.length,FR.length)
