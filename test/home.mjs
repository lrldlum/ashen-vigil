// Travel to Home: bonfire option -> shrine hub (saved), hub bonfire lists unlocked stages, NPC placeholders, pad/keyboard/touch.
import { chromium } from './node_modules/playwright/index.mjs';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`;let pass=0,fail=0;const ok=(n,c,d)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(d)))};
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});const errs=[];
const mk=async(touch)=>{const ctx=await br.newContext({viewport:{width:960,height:540},hasTouch:!!touch});const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(e.message));return pg};
const ready=pg=>pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive()&&__G.scene.getScene('stage').t>.5,null,{timeout:30000});
let pg=await mk();await pg.goto(B+'assets/README.md');await pg.evaluate(()=>localStorage.clear());
await pg.goto(B+'?play&mute&slot=1&class=knight&stage=ramparts&seed=0');await ready(pg);await pg.waitForTimeout(800);
const S=f=>pg.evaluate(f);
await S(()=>{const s=__G.scene.getScene('stage');s.msg=null;s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false});s.pb.setPosition(s.bonfire.x-4,s.pb.y-4);s.souls=777});await pg.waitForTimeout(400);
await pg.keyboard.press('ArrowUp');await pg.waitForTimeout(600);
const opts=await S(()=>__G.scene.getScene('stage').mainOpts());ok('bonfire_has_travel_home',opts.includes('TRAVEL TO HOME'),opts);
const n=opts.indexOf('TRAVEL TO HOME');for(let i=0;i<n;i++){await pg.keyboard.press('ArrowDown');await pg.waitForTimeout(80)}
await pg.keyboard.press('Enter');await pg.waitForTimeout(2500);await ready(pg);await pg.waitForTimeout(500);
const h=await S(()=>{const s=__G.scene.getScene('stage'),sv=JSON.parse(localStorage.getItem(Save.key()));return{sid:s.sid,en:s.enemies.filter(e=>!e.dead).length,saved:sv.stage,souls:sv.souls,vis:sv.visited}});
ok('warped_home_saved',h.sid==='shrine'&&h.saved==='shrine'&&h.souls>=777,h);ok('home_safe_no_enemies',h.en===0,h);
await pg.screenshot({path:'screenshots/home_hub.png'});
await S(()=>{const s=__G.scene.getScene('stage');s.pb.setPosition(506,s.pb.y-4)});await pg.waitForTimeout(1200);{const r=await S(()=>{const s=__G.scene.getScene('stage');return[s.interactHint(),s.player.x,s.pb.body.blocked.down,!!s.menu,s.msg&&1]});ok('merchant_prompt',r[0]==='Trade',r)}
await pg.keyboard.press('e');await pg.waitForTimeout(400);ok('merchant_opens',['merchant','shop',undefined].includes(await S(()=>(__G.scene.getScene('stage').menu||{}).mode)));await pg.screenshot({path:'screenshots/home_merchant.png'});if(await S(()=>!!__G.scene.getScene('stage').menu))await pg.keyboard.press('Escape');await pg.waitForTimeout(300);
await S(()=>{const s=__G.scene.getScene('stage');s.pb.setPosition(342,s.pb.y-4)});await pg.waitForTimeout(500);{const r=await S(()=>{const s=__G.scene.getScene('stage');return[s.interactHint(),s.player.x,s.menu&&s.menu.mode]});ok('smith_prompt',r[0]==='Talk',r)}
await S(()=>{const s=__G.scene.getScene('stage');s.sv.visited.push('cathedral');s.pb.setPosition(s.bonfire.x-4,s.pb.y-4)});await pg.waitForTimeout(400);
await pg.keyboard.press('ArrowUp');await pg.waitForTimeout(600);const o2=await S(()=>__G.scene.getScene('stage').mainOpts());const k=o2.indexOf('TRAVEL TO A STAGE');ok('hub_bonfire_stage_list',k>=0,o2);
for(let i=0;i<k;i++){await pg.keyboard.press('ArrowDown');await pg.waitForTimeout(80)}await pg.keyboard.press('Enter');await pg.waitForTimeout(400);
const L=await S(()=>__G.scene.getScene('stage').homeStages());ok('lists_unlocked',L.includes('ramparts')&&L.includes('cathedral')&&!L.includes('throne'),L);await pg.screenshot({path:'screenshots/home_travel_list.png'});
// touch: tap the second row twice (select, choose)
const y=await S(()=>{const s=__G.scene.getScene('stage');return s.spLayout.rows[1][1]+3});await pg.mouse.click(60*3,y*3);await pg.waitForTimeout(150);await pg.mouse.click(60*3,y*3);await pg.waitForTimeout(2600);await ready(pg);
ok('touch_travel_to_stage',await S(()=>__G.scene.getScene('stage').sid)===L[1],[await S(()=>__G.scene.getScene('stage').sid),L[1]]);
// pad A at a bonfire opens the menu and travels home
await S(()=>{const s=__G.scene.getScene('stage');s.msg=null;s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false});s.pb.setPosition(s.bonfire.x-4,s.pb.y-4);s.menu={mode:'main',sel:s.mainOpts().indexOf('TRAVEL TO HOME'),t:1,prev:{}}});
await S(()=>{window.__inp=()=>{window.__inp=null;return{jumpP:1}}});await pg.waitForTimeout(2800);await ready(pg);ok('pad_confirm_travels_home',await S(()=>__G.scene.getScene('stage').sid)==='shrine');
ok('no_errors',errs.length===0,errs);console.log(JSON.stringify({pass,fail}));await br.close();process.exit(fail?1:0);
