// Headless checks for the r5 review fixes. usage: node test/r5fix.mjs [port]   (server on :8171 by default)
import { chromium } from 'playwright';
const B='http://127.0.0.1:'+(process.argv[2]||8171)+'/',S='screenshots/r5fix/';
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const errs=[];let pass=0,fail=0;const ok=(n,c,v)=>{c?pass++:fail++;console.error((c?'PASS ':'FAIL ')+n+' '+JSON.stringify(v).slice(0,400))};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const mk=async touch=>{const ctx=await br.newContext(touch?{viewport:{width:844,height:390},hasTouch:true,isMobile:true}:{viewport:{width:1280,height:720}});const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(e.message));
 const ev=(f,a)=>pg.evaluate(f,a);const tl=()=>ev(()=>{const t=__G.scene.getScene('title');return{mode:t.mode,sel:t.sel,csel:t.csel,erase:t.erase,saves:t.saves.map(s=>s&&s.cls)}});
 const xy=async(x,y)=>{const bb=await pg.locator('canvas').boundingBox();return[bb.x+(x+.5)*bb.width/320,bb.y+(y+.5)*bb.height/180]};
 const tap=async(x,y)=>{const[a,b]=await xy(x,y);await pg.touchscreen.tap(a,b);await wait(220)};
 const hold=async(x,y,ms)=>{const[a,b]=await xy(x,y);const c=await pg.context().newCDPSession(pg);const tp=[{x:a,y:b}];await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:tp});await wait(ms);await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait(220)};
 const stage=async()=>{await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:20000});await wait(600);
  await ev(()=>{window.S=()=>__G.scene.getScene('stage');window.idle=()=>{window.__inp=()=>({})};window.press=k=>{let n=0;window.__inp=()=>(n++===0?{[k]:1}:{})};window.tp=(x,y=156)=>{const s=S();s.pb.setPosition(x,y-8);s.pb.setVelocity(0,0);s.player.state='idle';s.player.inv=99;s.camY=s.camTY=y-156}})};
 return{ctx,pg,ev,tl,tap,hold,stage}};
// 1. P2 touch class select: tap empty slot -> class list -> tap SORCERER-ish row 4 -> BEGIN
let T=await mk(true);await T.pg.goto(B+'assets/README.md');await T.ev(()=>localStorage.clear());await T.pg.goto(B+'?mute');await wait(1500);
await T.tap(160,100);const m1=await T.tl();await T.tap(40,50+4*10+4);const m2=await T.tl();await T.pg.screenshot({path:S+'touch_class_select.png'});
const want=await T.ev(i=>CLASS_ORDER[i],4);await T.tap(231,169);await T.stage();const got=await T.ev(()=>S().sv.cls);
ok('touch_class_select',m1.mode==='class'&&m2.mode==='class'&&m2.csel===4&&got===want&&want!=='knight',{m1,m2,want,got});
// 2. class overlay is opaque and hint-free (draw check: no hint text / title drawn under the panel)
await T.pg.goto(B+'?mute&slot=2');await wait(1200);await T.tap(160,111);await T.tap(160,111);const m3=await T.tl();
const px=await T.pg.screenshot({clip:{x:0,y:0,width:844,height:390}});await T.pg.screenshot({path:S+'class_overlay_opaque.png'});
const alpha=await T.ev(()=>{const g=__G.scene.getScene('title').gt;const c=g.commandBuffer;const i=c.indexOf(3);return c.slice(0,12)});
ok('class_overlay_opaque',m3.mode==='class',{m3,cmd:alpha});
// 3. touch erase: hold a saved slot -> ERASE/KEEP; KEEP keeps, ERASE erases
await T.pg.goto(B+'?mute');await wait(1500);const s0=await T.tl();
await T.hold(160,100,900);const e1=await T.tl();await T.pg.screenshot({path:S+'touch_erase_prompt.png'});await T.tap(192,155);const e2=await T.tl();
await T.hold(160,100,900);await T.tap(128,155);const e3=await T.tl();
ok('touch_erase_with_confirm',s0.saves[0]&&e1.erase===0&&e1.mode==='slots'&&e2.erase===-1&&e2.saves[0]&&e3.saves[0]===null&&e3.mode==='slots',{s0,e1,e2,e3});
await T.ctx.close();
// 4. desktop: real keyboard shop purchase (4th ware), flask buy doesn't refill, Blessed Weapon
const D=await mk(false);await D.pg.goto(B+'assets/README.md');await D.ev(()=>localStorage.clear());await D.pg.goto(B+'?play&mute&novideo&stage=shrine&class=cleric');await D.stage();
await D.ev(()=>{const s=S();s.souls=20000;tp(s.def.keeper-6);idle()});await wait(400);const kb=k=>D.pg.keyboard.press(k).then(()=>wait(90));
await D.ev(()=>press('restP'));await wait(400);await kb('ArrowDown');const k1=await D.ev(()=>S().menu&&[S().menu.mode,S().menu.sel]);await kb('z');await wait(100);
const L=await D.ev(()=>S().shopList().map(x=>x[0]));const m0=await D.ev(()=>[S().menu.mode,S().menu.sel]);for(let i=0;i<3;i++)await kb('ArrowDown');const ms=await D.ev(()=>S().menu.sel);
await D.pg.screenshot({path:S+'shop_keyboard_4th.png'});await kb('z');const inv=await D.ev(()=>S().sv.inv);const fi=await D.ev(()=>S().shopList().findIndex(x=>x[0]==='flask'));
ok('shop_real_keyboard',k1&&k1[0]==='keeper'&&k1[1]===1&&m0[0]==='shop'&&ms===3&&inv.includes(L[3]),{k1,m0,ms,want:L[3],inv});
// flask: move cursor to flask with real keys
await D.ev(()=>{S().player.flasks=1});let cur=await D.ev(()=>S().menu.sel);for(let g=0;g<12&&cur!==fi;g++){await kb(cur<fi?'ArrowDown':'ArrowUp');cur=await D.ev(()=>S().menu.sel)}
await kb('z');const fl=await D.ev(()=>({f:S().player.flasks,b:S().sv.flaskBonus}));await D.ev(()=>{S().menu=null;S().rest();S().menu=null});const fr=await D.ev(()=>S().player.flasks);
ok('flask_buy_no_refill',fl.f===1&&fl.b===1&&fr===await D.ev(()=>TUNE.flaskN+1),{fl,fr});
// blessed weapon: owned + cast via real input -> buff active, melee damage up
await D.ev(()=>{const s=S();s.menu=null;s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false});tp(250);s.player.f=1;s.player.fp=999;s.player.st=999;if(!s.sv.inv.includes('blessed'))s.sv.inv.push('blessed')});
const sw=()=>D.ev(async()=>{const s=S(),e=s.spawnEnemy('hollow',s.player.x+16,156);e.hp=99;e.state='idle';e.cd=99;e.temp=1;e.b.body.moves=false;const h=e.hp;s.player.st=999;press('atkP');await new Promise(r=>setTimeout(r,700));const d=h-e.hp;e.dead=true;e.b.body.enable=false;return d});
const d0=await sw();await D.ev(()=>press('blessP'));await wait(900);const bl=await D.ev(()=>+(S().player.bless||0).toFixed(1));const d1=await sw();await D.pg.screenshot({path:S+'blessed_weapon.png'});
ok('blessed_weapon_works',bl>3&&d1>d0*1.15,{d0,d1,bless:bl});
// 5. cathedral chains at x568/x664 reach the floor
await D.pg.goto(B+'?play&mute&novideo&stage=cathedral');await D.stage();
const ch=await D.ev(()=>{const s=S(),D=s.def;return(D.chain||[]).filter(c=>c[0]===568||c[0]===664).map(c=>({c,floor:s.lv?s.lv.floorAt(c[0]+4,c[3]-4):null}))});
ok('cathedral_chains_reach_floor',ch.length===2&&ch.every(o=>o.c[3]===300),ch);
// 6. ending cinematic skips on ONE press
await D.pg.goto(B+'?mute&ending=rekindle');await wait(500);await D.pg.keyboard.press('Enter');await wait(400);const card=await D.ev(()=>!!__G.scene.getScene('ending').card);
ok('cinematic_one_press_skip',card,{card});
ok('no_errors',errs.length===0,errs);await br.close();console.log(JSON.stringify({pass,fail}));process.exit(fail?1:0);
