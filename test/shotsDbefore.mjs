// pre-D reference shots from commit 80873be served on :8172. usage: node test/shotsDbefore.mjs
import { chromium } from 'playwright';
const B='http://127.0.0.1:8172/',S='screenshots/D/before/';
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const pg=await (await br.newContext({viewport:{width:1280,height:720}})).newPage();
const rd=async q=>{await pg.goto(B+q);await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player);await pg.waitForTimeout(900)};
await pg.goto(B+'assets/README.md');await pg.evaluate(()=>localStorage.clear());
await pg.goto(B+'?mute');await pg.waitForTimeout(1600);await pg.screenshot({path:S+'b01_title_single_save.png'});
await pg.keyboard.press('Enter');await pg.waitForTimeout(400);await pg.screenshot({path:S+'b02_new_game_no_class_select.png'});
await rd('?play&mute');await pg.screenshot({path:S+'b03_stage1_hud.png'});
await pg.evaluate(()=>{const s=__G.scene.getScene('stage');s.pb.setPosition(1600,148);s.camY=s.camTY=0;let n=0;window.__inp=()=>(n++<2?{restP:1}:{})});await pg.waitForTimeout(900);await pg.screenshot({path:S+'b04_bonfire_rest_no_menu.png'});
await pg.evaluate(()=>{let n=0;window.__inp=()=>(n++%20<3?{atkP:1}:{})});await pg.waitForTimeout(250);await pg.screenshot({path:S+'b05_only_sword_attack.png'});
for(const [i,s] of [[6,'cathedral'],[7,'cinderdeep']]){await pg.goto(B+'?demo&boss&mute&stage='+s);await pg.waitForTimeout(5000);await pg.screenshot({path:S+`b0${i}_${s}_arena.png`})}
await br.close();console.log('ok');
