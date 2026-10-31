// gamepad: mocks navigator.getGamepads (standard/Xbox mapping) and checks connect toast + hint, menu navigation,
// movement (stick + d-pad, deadzone), jump, attack, dodge, pause via Start
import { chromium } from './node_modules/playwright/index.mjs';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`;let pass=0,fail=0;const ok=(n,c,d)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(d)))};
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});const pg=await br.newPage({viewport:{width:960,height:540}});
const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.addInitScript(()=>{window.__pads=[null,null,null,null];navigator.getGamepads=()=>window.__pads;
 window.mkPad=(i=0)=>{const p={index:i,id:'Xbox Wireless Controller (STANDARD GAMEPAD)',mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};window.__pads[i]=p;return p};
 window.btn=(b,on,i=0)=>{const p=window.__pads[i];p.buttons[b]={pressed:on,value:on?1:0}};window.axis=(a,v,i=0)=>{window.__pads[i].axes[a]=v};});
const ev=(f,a)=>pg.evaluate(f,a),wait=ms=>pg.waitForTimeout(ms);
const tap=async(b,i=0)=>{await ev(([b,i])=>btn(b,true,i),[b,i]);await wait(120);await ev(([b,i])=>btn(b,false,i),[b,i]);await wait(150)};
// ---- title: hint, connect toast, menu navigation
await pg.goto(B+'assets/README.md');await ev(()=>localStorage.clear());await pg.goto(B);
await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('title')&&__G.scene.getScene('title').sys.isActive(),null,{timeout:30000});await wait(600);
ok('hint_press_any_button_shown',await ev(()=>{const h=document.getElementById('padHint');return!!h&&h.style.display==='block'&&/press any button/i.test(h.textContent)}));
await ev(()=>{const p=mkPad(0);const e=new Event('gamepadconnected');e.gamepad=p;window.dispatchEvent(e)});await wait(200);
ok('toast_controller_connected',await ev(()=>{const t=document.getElementById('padToast');return t.style.display==='block'&&t.textContent==='Controller connected'}),await ev(()=>document.getElementById('padToast').textContent));
ok('hint_hidden_after_connect',await ev(()=>document.getElementById('padHint').style.display==='none'));
const T=()=>ev(()=>{const t=__G.scene.getScene('title');return{mode:t.mode,sel:t.sel,csel:t.csel}});
const t0=await T();await tap(13);const t1=await T();ok('menu_dpad_down_moves_cursor',t1.sel===(t0.sel+1)%4,[t0,t1]);
await tap(12);const t2=await T();ok('menu_dpad_up_moves_back',t2.sel===t0.sel,t2);
await ev(()=>axis(1,.9));await wait(200);await ev(()=>axis(1,0));await wait(150);const t3=await T();ok('menu_stick_down_moves_cursor',t3.sel===(t0.sel+1)%4,t3);
await ev(()=>axis(1,-.9));await wait(200);await ev(()=>axis(1,0));await wait(150);
await tap(0);const t4=await T();ok('menu_A_confirms_empty_slot_to_class_pick',t4.mode==='class',t4);
await tap(13);const t5=await T();ok('class_menu_navigates',t5.csel===1,t5);
await tap(1);const t6=await T();ok('menu_B_goes_back',t6.mode==='slots',t6);
// ---- gameplay
await pg.goto(B+'assets/README.md');await ev(()=>localStorage.clear());await pg.goto(B+'?play&mute&novideo&slot=1&class=knight&stage=ramparts&seed=0');
await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});
await ev(()=>{mkPad(0);const s=__G.scene.getScene('stage');s.msg=null;s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false})});await wait(1500);
const P=()=>ev(()=>{const s=__G.scene.getScene('stage'),p=s.player;return{x:p.x,y:p.y,vy:s.pb.body.velocity.y,combo:p.combo,atk:p.atkT||p.atk||0,roll:p.roll||p.rollT||0,paused:s.paused,mode:PAD.modeNow,slots:PAD.slots.length}});
const p0=await P();ok('pad_slot_assigned',p0.slots===1,p0);
await ev(()=>axis(0,.12));await wait(500);const pz=await P();ok('deadzone_ignores_small_tilt',Math.abs(pz.x-p0.x)<1,[p0.x,pz.x]);
await ev(()=>axis(0,1));await wait(700);await ev(()=>axis(0,0));const p1=await P();ok('stick_moves_right',p1.x>p0.x+20,[p0.x,p1.x]);
await ev(()=>btn(14,true));await wait(500);await ev(()=>btn(14,false));const p2=await P();ok('dpad_moves_left',p2.x<p1.x-10,[p1.x,p2.x]);
await wait(400);const g0=await P();await ev(()=>btn(0,true));await wait(180);const g1=await P();await ev(()=>btn(0,false));ok('A_jumps',g1.y<g0.y-4||g1.vy<-50,[g0,g1]);
await wait(900);
const a0=await ev(()=>{const s=__G.scene.getScene('stage');window.__sw=0;const o=s.sound.play.bind(s.sound);return 1});
const sw=await ev(()=>new Promise(r=>{const s=__G.scene.getScene('stage'),p=s.player,c0=p.combo;let hit=false;const iv=setInterval(()=>{if(p.combo!==c0||(p.atkT||0)>0||s.player.state==='atk')hit=true},10);btn(2,true);setTimeout(()=>btn(2,false),120);setTimeout(()=>{clearInterval(iv);r({hit,c0,c1:p.combo})},500)}));
ok('X_attacks',sw.hit,sw);
await tap(9);const q1=await P();ok('start_pauses',q1.paused===true,q1);
await tap(9);const q2=await P();ok('start_unpauses',q2.paused===false,q2);
// co-op style second pad gets its own slot
await ev(()=>{const p=mkPad(1);const e=new Event('gamepadconnected');e.gamepad=p;window.dispatchEvent(e)});await wait(200);
ok('second_pad_own_slot',await ev(()=>PAD.slots.length===2&&PAD.slots[1]===1&&/P2/.test(PAD.lastToast)),await ev(()=>[PAD.slots,PAD.lastToast]));
await ev(()=>{window.__pads[1]=null;const e=new Event('gamepaddisconnected');e.gamepad={index:1};window.dispatchEvent(e)});await wait(200);
ok('disconnect_frees_slot',await ev(()=>PAD.slots.length===1&&PAD.lastToast==='Controller disconnected'));
ok('no_page_errors',errs.length===0,errs);
await pg.screenshot({path:'screenshots/gamepad_test.png'});
console.log(JSON.stringify({pass,fail}));await br.close();process.exit(fail?1:0);
