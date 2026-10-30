// pre-E reference shots from commit 2705b40 served on :8172. usage: node test/shotsEbefore.mjs
import { chromium } from 'playwright';
const B='http://127.0.0.1:8172/',O='screenshots/E/before/';const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const pg=await (await br.newContext({viewport:{width:1280,height:720}})).newPage();
const rd=async q=>{await pg.goto(B+q);await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive());await pg.waitForTimeout(800);await pg.evaluate(()=>{window.S=()=>__G.scene.getScene('stage')})};
await pg.goto(B+'assets/README.md');await pg.evaluate(()=>localStorage.clear());
await rd('?play&mute');await pg.evaluate(()=>{S().pb.setPosition(3020,140)});await pg.waitForFunction(()=>S().bossState==='fight',null,{timeout:15000});await pg.evaluate(()=>{S().boss.hp=0});await pg.waitForFunction(()=>S().victory&&S().victory.t>1);await pg.screenshot({path:O+'eb01_stage_clear_no_hub.png'});
await rd('?play&mute');await pg.evaluate(()=>{const s=S();s.souls=900;s.pb.setPosition(1600,148);window.__inp=()=>s.menu?{}:{restP:1}});await pg.waitForTimeout(800);await pg.screenshot({path:O+'eb02_bonfire_menu_no_items_or_travel.png'});
await pg.evaluate(()=>{S().menuKey('down');S().menuKey('ok')});await pg.waitForTimeout(300);await pg.screenshot({path:O+'eb03_equipment_no_descriptions.png'});
await rd('?play&mute&class=cleric&slot=2');await pg.screenshot({path:O+'eb04_cleric_no_talisman_no_miracles.png'});
for(const s of ['cathedral','cinderdeep']){await rd('?play&mute&stage='+s);await pg.evaluate(()=>{S().pb.setPosition(3020,140)});await pg.waitForFunction(()=>S().bossState==='fight',null,{timeout:15000});await pg.evaluate(()=>{S().boss.hp=S().boss.hpMax*.5;S().player.inv=99});await pg.waitForTimeout(2500);await pg.screenshot({path:O+`eb05_${s}_arena_flat_floor.png`})}
await pg.evaluate(()=>{S().boss.hp=0});await pg.waitForFunction(()=>S().victory&&S().victory.t>1,null,{timeout:12000});await pg.screenshot({path:O+'eb07_final_card_straight_to_ngplus.png'});
console.log('ok');await br.close();
