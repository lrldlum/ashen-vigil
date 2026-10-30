// usage: node test/shots.mjs <outdir>  — captures title, play, mobile, boss shots
import { chromium } from 'playwright';
const B='http://127.0.0.1:8171/', S=process.argv[2];
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader','--autoplay-policy=no-user-gesture-required']});
const errs=[],ext=[];const mk=async(vp,touch)=>{const ctx=await br.newContext({viewport:vp,hasTouch:!!touch,isMobile:!!touch});const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(e.message));pg.on('request',r=>{const u=r.url();if(!u.startsWith('http://127.0.0.1:8171/')&&!u.startsWith('data:')&&!u.startsWith('blob:'))ext.push(u)});pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});return pg};
const w=(pg,ms)=>pg.waitForTimeout(ms);
let pg=await mk({width:1280,height:720});
await pg.goto(B+'?mute');await w(pg,2000);await pg.screenshot({path:S+'/01_title.png'});
await pg.goto(B+'?play&mute');await w(pg,2500);await pg.screenshot({path:S+'/02_stage_start.png'});
await pg.goto(B+'?play&mute&x=1560');await w(pg,2500);await pg.screenshot({path:S+'/03_bonfire.png'});
await pg.goto(B+'?play&mute&x=880');await w(pg,2200);await pg.keyboard.press('x');await w(pg,110);await pg.screenshot({path:S+'/04_slash.png'});
await pg.goto(B+'?play&mute&still=dome');await w(pg,3250);await pg.screenshot({path:S+'/05_frost_dome.png'});
await pg.goto(B+'?demo&boss&mute');await w(pg,9000);await pg.screenshot({path:S+'/06_boss_fight.png'});
pg=await mk({width:844,height:390},1);await pg.goto(B+'?play&mute');await w(pg,2500);await pg.screenshot({path:S+'/07_mobile_landscape.png'});
pg=await mk({width:390,height:844},1);await pg.goto(B+'?play&mute');await w(pg,2500);await pg.screenshot({path:S+'/08_mobile_portrait.png'});
console.log(JSON.stringify({errs:errs.filter(e=>!/favicon/.test(e)),ext}));await br.close();
