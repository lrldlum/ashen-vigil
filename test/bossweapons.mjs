// Every boss drops its signature weapon: a visible drop, a pickup banner, the inventory (visual inventory R HAND list) and the save,
// surviving a page reload. Kills each of the 10 bosses through the real fight state (boss hp -> 0, dying, finishBoss).
import { chromium } from './node_modules/playwright/index.mjs';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`;let pass=0,fail=0;const ok=(n,c,d)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(d)))};
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});const pg=await br.newPage({viewport:{width:960,height:540}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
const S=(f,a)=>pg.evaluate(f,a);
const ready=async()=>{await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await pg.waitForTimeout(1200);await S(()=>{window.s=__G.scene.getScene('stage')})};
await pg.goto(B+'assets/README.md');await S(()=>localStorage.clear());await pg.goto(B+'?play&mute&novideo&slot=1');await ready();
const stages=['ramparts','cathedral','cinderdeep','belltower','catacomb','drowned','keep','spire','cloister','throne'];let first=true;
for(const st of stages){
 await S(st=>{Save.write({...s.sv,stage:st,bossDown:false,stain:null});s.scene.restart({fresh:false})},st);await pg.waitForTimeout(600);await ready();
 const kind=await S(()=>s.def.boss.kind),w=await S(k=>SIGNATURE[k],kind);
 await S(()=>{const P=s.player;P.hp=P.hpMax=99999;s.player.x=ARENA_L+40;s.pb.body.reset(ARENA_L+40,s.pb.y)});
 const fought=await pg.waitForFunction(()=>s.bossState==='fight',null,{timeout:25000}).then(()=>1,()=>0);
 if(!fought){ok(st+'_fight_started',false,await S(()=>[s.bossState,!!s.boss]));continue}
 await S(()=>{s.boss.hp=0});
 const drop=await pg.waitForFunction(()=>s.sigDrop&&!s.sigDrop.got,null,{timeout:8000}).then(()=>1,()=>0);ok(st+'_visible_drop_'+w,drop);
 if(first){await pg.waitForTimeout(250);await pg.screenshot({path:'screenshots/bossweapons/drop.png'})}
 const ban=await pg.waitForFunction(()=>s.sigBanner&&s.sigBanner.t>.4,null,{timeout:8000}).then(()=>1,()=>0);ok(st+'_banner',ban);
 if(first)await pg.screenshot({path:'screenshots/bossweapons/banner.png'});
 await pg.waitForFunction(()=>s.victory,null,{timeout:12000}).catch(()=>{});
 const r=await S(w=>({inv:s.sv.inv.includes(w),list:s.invOpts?s.invOpts('main').includes(w):s.eqOpts(0).includes(w),saved:JSON.parse(localStorage.getItem(Save.key())).inv.includes(w)}),w);
 ok(st+'_in_inventory_and_save',r.inv&&r.list&&r.saved,r);first=false}
await pg.goto(B+'?play&mute&novideo&slot=1&continue');await ready();
const all=await S(()=>Object.values(SIGNATURE).filter(w=>!s.sv.inv.includes(w)));ok('all_10_survive_reload',all.length===0,all);
await S(()=>{s.menu={mode:'main',sel:s.mainOpts().indexOf('EQUIPMENT')};s.menuKey('ok');s.menu.focus='grid';s.menu.slot=0;s.menu.gi=s.invOpts('main').indexOf('hollowbrand')});await pg.waitForTimeout(300);
await pg.screenshot({path:'screenshots/bossweapons/inventory.png'});
ok('no_page_errors',errs.length===0,errs);
console.log(JSON.stringify({pass,fail}));await br.close();process.exit(fail?1:0);
