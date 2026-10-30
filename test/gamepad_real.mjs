// gamepad with Chrome-like semantics: getGamepads() returns a fresh frozen snapshot every call, the pad is already connected
// before load (no gamepadconnected event), buttons are {pressed,value,touched}, and the timestamp only changes on input.
import { chromium } from './node_modules/playwright/index.mjs';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`;let pass=0,fail=0;const ok=(n,c,d)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(d)))};
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});const pg=await br.newPage({viewport:{width:960,height:540}});
const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.addInitScript(()=>{const st={b:Array(17).fill(0),a:[0,0,0,0],ts:1000};window.__pad=st;
 window.btn=(i,on)=>{st.b[i]=on?1:0;st.ts=performance.now()};window.axis=(i,v)=>{st.a[i]=v;st.ts=performance.now()};
 navigator.getGamepads=()=>{const g=Object.freeze({id:'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)',index:0,connected:true,mapping:'standard',timestamp:st.ts,
   axes:Object.freeze(st.a.slice()),buttons:Object.freeze(st.b.map(v=>Object.freeze({pressed:v>0.5,value:v,touched:v>0})))});if(window.__dup){const idle=Object.freeze({id:'Xbox 360 Controller (XInput STANDARD GAMEPAD)',index:0,connected:true,mapping:'standard',timestamp:1,axes:Object.freeze([0,0,0,0]),buttons:Object.freeze(Array(17).fill(0).map(()=>Object.freeze({pressed:false,value:0,touched:false})))});return[idle,Object.freeze({...g,index:1}),null,null]}
 return[g,null,null,null]}});
const ev=(f,a)=>pg.evaluate(f,a),wait=ms=>pg.waitForTimeout(ms);
const tap=async b=>{await ev(b=>btn(b,1),b);await wait(100);await ev(b=>btn(b,0),b);await wait(200)};
await pg.goto(B+'assets/README.md');await ev(()=>localStorage.clear());await pg.goto(B);
await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('title')&&__G.scene.getScene('title').sys.isActive(),null,{timeout:30000});await wait(500);
const T=()=>ev(()=>{const t=__G.scene.getScene('title');return{mode:t.mode,sel:t.sel,csel:t.csel}});
await tap(13);ok('menu_dpad_down',(await T()).sel===1,await T());await tap(12);
await tap(0);ok('menu_A_confirm',(await T()).mode==='class',await T());await tap(1);ok('menu_B_back',(await T()).mode==='slots',await T());
await pg.goto(B+'?play&mute&slot=1&class=knight&stage=ramparts&seed=0');
await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});
await ev(()=>{const s=__G.scene.getScene('stage');s.msg=null;s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false})});await wait(1200);
const P=()=>ev(()=>{const s=__G.scene.getScene('stage'),p=s.player;return{x:p.x,y:p.y,st:p.state,paused:s.paused}});
const p0=await P();await ev(()=>axis(0,1));await wait(600);await ev(()=>axis(0,0));const p1=await P();ok('stick_moves',p1.x>p0.x+15,[p0.x,p1.x]);
await wait(500);
const watch=(b,pred)=>ev(([b,pred])=>new Promise(r=>{const s=__G.scene.getScene('stage'),p=s.player,f=new Function('s','p',pred);let hit=false;const iv=setInterval(()=>{if(f(s,p))hit=true},5);btn(b,1);setTimeout(()=>btn(b,0),90);setTimeout(()=>{clearInterval(iv);r(hit)},700)}),[b,pred]);
ok('A_jumps',await watch(0,"return s.pb.body.velocity.y<-60"));await wait(700);
ok('X_attacks',await watch(2,"return p.state==='atk'"));await wait(500);
ok('B_rolls',await watch(1,"return p.state==='roll'"));await wait(600);
ok('Y_heavy',await watch(3,"return p.state==='atk'&&p.heavy"));await wait(800);
await tap(9);ok('start_pauses',(await P()).paused,await P());await tap(9);ok('start_resumes',!(await P()).paused,await P());
// a duplicate/virtual pad listed first (Steam Input, XInput+DirectInput): the pad receiving input must still drive the player
await pg.addInitScript(()=>{window.__dup=1});await pg.goto(B+'?play&mute&slot=1&class=knight&stage=ramparts&seed=0');
await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});
await ev(()=>{const s=__G.scene.getScene('stage');s.msg=null;s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false})});await wait(1200);
ok('dup_pad_X_attacks',await watch(2,"return p.state==='atk'"));await wait(500);ok('dup_pad_A_jumps',await watch(0,"return s.pb.body.velocity.y<-60"));
ok('no_page_errors',errs.length===0,errs);
console.log(JSON.stringify({pass,fail}));await br.close();process.exit(fail?1:0);
