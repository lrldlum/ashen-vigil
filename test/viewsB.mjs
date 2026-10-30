// usage: node test/viewsB.mjs <outdir> — teleports to each exploration area and screenshots it
import { chromium } from 'playwright';
const B='http://127.0.0.1:8171/',S=process.argv[2];
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});const pg=await (await br.newContext({viewport:{width:1280,height:720}})).newPage();
const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto(B+'assets/README.md');await pg.evaluate(()=>localStorage.clear());
await pg.goto(B+'?play&mute');await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player);await pg.waitForTimeout(1500);
const spots=[['b01_start_shaft',264,156],['b02_hidden_room',330,36],['b03_rooftop',940,20],['b04_crypt',1300,300],['b05_crypt_shaft',1504,300],['b06_tower',1712,156],['b07_tower_top',1800,-100],['b08_timer_gate',2200,-100],['b09_ossuary',2700,300],['b10_breakwall',2530,300],['b11_preboss_ledge',2930,20]];
for(const[n,x,y]of spots){await pg.evaluate(([x,y])=>{const s=__G.scene.getScene('stage');s.pb.setPosition(x,y-8);s.pb.setVelocity(0,0);s.camY=y-156;s.camTY=y-156},[x,y]);await pg.waitForTimeout(900);await pg.screenshot({path:`${S}/${n}.png`})}
console.log(JSON.stringify({errs}));await br.close();
