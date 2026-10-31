// r20: (1) on touch layouts the bottom NEXT banner never overlaps a touch button (every stage); desktop text unchanged;
// (2) the depth-7 foreground silhouette layer no longer drops a translucent box over the floor right of the start brazier (every stage)
import { chromium } from './node_modules/playwright/index.mjs';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`;let pass=0,fail=0;const ok=(n,c,d)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(d)))};
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const S=['ramparts','cathedral','cinderdeep','belltower','catacomb','drowned','keep','spire','cloister','throne'];const errs=[];
const load=async(pg,q)=>{await pg.goto(B+'assets/README.md');await pg.evaluate(()=>localStorage.clear());await pg.goto(B+q);
 await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await pg.waitForTimeout(700)};
const ctx=await br.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(e.message));
for(const st of S){await load(pg,`?play&mute&novideo&touch&slot=1&class=knight&stage=${st}&seed=0`);
 const r=await pg.evaluate(()=>{const s=__G.scene.getScene('stage');const O=s.objBanner(),t=O.s,bx=O.box;
  const hit=TBTN.filter(b=>b.x+b.r>bx[0]&&b.x-b.r<bx[2]&&b.y+b.r>bx[1]&&b.y-b.r<bx[3]).map(b=>b.lab);return{touch:s.touch,t,bx,hit}});
 ok(`${st}: touch banner "${r.t}" clears every touch button`,r.touch&&!r.hit.length,r)}
{const r=await pg.evaluate(()=>{const s=__G.scene.getScene('stage'),nx=s.nextObj,out=[];for(const k of Object.keys(STAGE_DEFS)){const d=STAGE_DEFS[k];if(!d.boss)continue;s.nextObj=()=>({stage:d.name,boss:d.boss.name});const O=s.objBanner();out.push([O.s,TBTN.filter(b=>b.x+b.r>O.box[0]&&b.x-b.r<O.box[2]&&b.y+b.r>O.box[1]&&b.y-b.r<O.box[3]).map(b=>b.lab)])}s.nextObj=nx;return out});
 ok(`every next-stage name fits the touch gap (${r.length}: ${r.map(x=>x[0]).join(' | ')})`,r.length>=10&&r.every(x=>!x[1].length),r.filter(x=>x[1].length))}
await ctx.close();
const pg2=await br.newPage({viewport:{width:960,height:540}});pg2.on('pageerror',e=>errs.push(e.message));
for(const st of S){await load(pg2,`?play&mute&novideo&slot=1&class=knight&stage=${st}&seed=0`);
 const r=await pg2.evaluate(()=>{const s=__G.scene.getScene('stage');const fg=s.children.list.find(o=>o.type==='Graphics'&&o.depth===7&&o.scrollFactorX===1.3);const b=fg.commandBuffer;const big=[];
  for(let i=0;i<b.length;i++){if(b[i]===7){i+=2;continue}if(b[i]===3){const[x,y,w,h]=b.slice(i+1,i+5);i+=4;if((w>=12&&h>=12)||(w>=8&&h>=8&&y+h>GY))big.push([x,y,w,h])}}
  return{desk:!s.touch,same:s.objText()===s.objText(),big}});
 ok(`${st}: no translucent foreground box (>=12x12, or >=8 wide below the floor line) in the fg silhouette layer`,r.big.length===0,r.big.slice(0,3));
 if(st==='ramparts'){const t=await pg2.evaluate(()=>{const s=__G.scene.getScene('stage');return[s.touch,s.objText()]});ok('desktop banner keeps the full NEXT text',!t[0]&&/^NEXT: .+, /.test(t[1]),t)}}
ok('no page errors',!errs.length,errs);console.log(`\n${pass} passed, ${fail} failed`);await br.close();process.exit(fail?1:0);
