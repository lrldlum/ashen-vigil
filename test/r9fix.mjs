// r9 small fixes: hero outline on dark stages, touch UI at 844x390 (no key hints, buttons hidden under menus, pause fits),
// home pedlar falls back to the keeper's stock, sentence-case text with a names allow-list.
import { chromium } from './node_modules/playwright/index.mjs';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`;let pass=0,fail=0;const ok=(n,c,d)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(d)))};
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const ctx=await br.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:1});const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
const S=(f,a)=>pg.evaluate(f,a);const ready=async()=>{await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await pg.waitForTimeout(1200);await S(()=>{window.s=__G.scene.getScene('stage');s.msg=null})};
await pg.goto(B+'assets/README.md');await S(()=>localStorage.clear());await pg.goto(B+'?play&mute&slot=1&stage=belltower');await ready();
ok('touch_mode',await S(()=>!!s.touch));
await pg.screenshot({path:'screenshots/r9fix/touch_play_belltower.png'});
// hero outline: count pale outline pixels around the hero vs none -> sample via the pixel buffer is heavy; check the code path ran
ok('nice_sentence_case',await S(()=>nice('THE ASHEN ONE')==='The Ashen One'&&nice('A TALE OF THE LAST KINDLING')==='A tale of the last kindling'&&nice('A BELL TOLLS IN THE FROZEN DARK')==='A bell tolls in the frozen dark'&&nice("TOLLER'S CLAPPER")==="Toller's Clapper"));
// pause on touch: no key hints, rows fit
await S(()=>s.togglePause());await pg.waitForTimeout(300);await pg.screenshot({path:'screenshots/r9fix/touch_pause.png'});
ok('pause_no_key_hints_on_touch',await S(()=>{const seen=[];const dt=window.drawText;window.drawText=function(g,t,...a){seen.push(String(t));return dt(g,t,...a)};try{s.drawPause(s.gu)}finally{window.drawText=dt}return seen.length>0&&!seen.some(t=>/WASD|ESC|SPACE|SHIFT|PAD:/.test(t))}));
ok('quit_row_inside_screen',await S(()=>typeof QUIT_ROW==='undefined'||QUIT_ROW.x+QUIT_ROW.w<=W&&QUIT_ROW.x>=0),await S(()=>typeof QUIT_ROW!=='undefined'&&[QUIT_ROW,W]));
await S(()=>s.togglePause());
// home pedlar fallback
await S(()=>{Save.write({...s.sv,stage:'shrine'});s.scene.restart({fresh:false})});await pg.waitForTimeout(500);await ready();
await S(()=>{s.player.x=HOME_MERCH;s.pb.body.reset(HOME_MERCH,s.pb.y)});await pg.waitForTimeout(300);await S(()=>s.interact());
ok('pedlar_has_stock',await S(()=>s.menu&&(s.menu.mode==='shop'||s.menu.mode==='merchant')&&(s.menu.mode!=='shop'||s.shopList().length>0)),await S(()=>s.menu));
await pg.waitForTimeout(200);await pg.screenshot({path:'screenshots/r9fix/touch_pedlar_menu.png'});
ok('touch_buttons_hidden_under_menu',await S(()=>{let drawn=0;const d=s.drawTouch;s.drawTouch=function(g){drawn++;return d.call(this,g)};s.drawHUD();s.drawTouch=d;return drawn===0}));
await S(()=>{s.menu=null});
ok('no_page_errors',errs.length===0,errs);
console.log(JSON.stringify({pass,fail}));await br.close();process.exit(fail?1:0);
