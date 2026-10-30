// r3 fix screenshots: unique rooms (stages 2/3), cinderdeep rim light, souls backing, title backdrop. usage: node test/shotsR3.mjs
import { chromium } from 'playwright';
const B='http://127.0.0.1:8171/',O='screenshots/r3fix/';const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const pg=await (await br.newContext({viewport:{width:1280,height:720}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
const load=async q=>{await pg.goto(B+q);await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive());await pg.waitForTimeout(600);await pg.evaluate(()=>{window.S=()=>__G.scene.getScene('stage');window.tp=(x,y)=>{const s=S();s.pb.setPosition(x,y-8);s.pb.setVelocity(0,0);s.player.inv=999;s.camY=s.camTY=y-156}})};
await pg.goto(B+'assets/README.md');await pg.evaluate(()=>localStorage.clear());
for(const [st,x,n] of [['cathedral',600,'nave'],['cathedral',1560,'belfry'],['cinderdeep',1220,'lava_rise'],['cinderdeep',2560,'forge']]){await load('?play&mute&stage='+st);await pg.evaluate(x=>{tp(x,x===1220?268:300);S().souls=12345},x);await pg.waitForTimeout(1400);await pg.screenshot({path:O+`r3_${st}_${n}.png`})}
await load('?play&mute&stage=cinderdeep');await pg.evaluate(()=>{tp(640,156);S().souls=880});await pg.waitForTimeout(1000);await pg.screenshot({path:O+'r3_cinderdeep_rim_light.png'});
await pg.evaluate(()=>{localStorage.setItem('ashenVigil.save.v1',JSON.stringify({stage:'cinderdeep',cls:'warrior',souls:10,time:100}))});await pg.goto(B+'?mute');await pg.waitForTimeout(1800);await pg.screenshot({path:O+'r3_title_stage_backdrop.png'});
console.log('errors',JSON.stringify(errs));await br.close();
