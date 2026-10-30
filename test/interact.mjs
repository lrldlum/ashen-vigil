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

const go=async q=>{await pg.goto(B+'assets/README.md');await ev(()=>localStorage.clear());await pg.goto(B+'?play&mute&slot=1&class=knight&seed=0&'+q);
 await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});
 await ev(()=>{window.S=()=>__G.scene.getScene('stage');const s=S();s.msg=null;s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false});window.tp=x=>{const s=S();s.pb.setPosition(x,s.pb.y-4);s.pb.setVelocity(0,0)}});await wait(1000)};
const tapA=async()=>ev(()=>new Promise(r=>{const s=S();let jumped=false;const iv=setInterval(()=>{if(s.pb.body.velocity.y<-60)jumped=true},5);btn(0,1);setTimeout(()=>btn(0,0),120);setTimeout(()=>{clearInterval(iv);r(jumped)},450)}));
await go('stage=ramparts');
const bx=await ev(()=>S().bonfire.x);await ev(x=>{tp(x-60)},bx);await wait(500);
ok('away_no_prompt',await ev(()=>S().interactHint())===null,await ev(()=>S().interactHint()));
ok('away_A_jumps',await tapA());await wait(800);
await ev(x=>{tp(x-4);S().player.hp=1},bx);await wait(500);
ok('prompt_rest',await ev(()=>S().interactHint())==='Rest',await ev(()=>S().interactHint()));
const j=await tapA();const r=await ev(()=>({hp:S().player.hp,max:S().player.hpMax,lit:S().bonfire.lit}));
ok('near_A_rests_not_jumps',!j&&r.hp===r.max&&r.lit,{j,r});
await pg.screenshot({path:'screenshots/interact_prompt_pad.png'});ok('menu_open_hides_hint',await ev(()=>!!S().menu&&S().interactHint()===null));
await wait(1500);
// a chest
await go('stage=catacomb');
const cx=await ev(()=>{const c=S().chests.find(c=>c.st==='shut'&&Math.abs(c.y-S().player.y)<16)||S().chests.find(c=>c.st==='shut');S().pb.setPosition(c.x-4,c.y-10);S().pb.setVelocity(0,0);return c.id});await wait(600);
ok('prompt_open',await ev(()=>S().interactHint())==='Open',await ev(()=>[S().interactHint(),S().player.x,S().player.y]));
await tapA();await wait(400);ok('A_opens_chest',await ev(id=>S().chests.find(c=>c.id===id).st!=='shut',cx));
// keeper talk + A advances dialogue
await go('stage=shrine');
const hub=await ev(()=>!!S().def.hub);
if(hub){await ev(()=>tp(S().def.keeper-6));await wait(500);ok('prompt_talk',await ev(()=>S().interactHint())==='Talk',await ev(()=>S().interactHint()));
 await tapA();await wait(300);ok('A_talks',await ev(()=>S().menu&&S().menu.mode)==='keeper',await ev(()=>S().menu));
 await wait(400);const m0=await ev(()=>JSON.stringify({m:S().menu&&{...S().menu,t:0,prev:0,kOk:0},l:S().loreView,say:S().msg&&S().msg.text}));await tapA();await wait(300);const m1=await ev(()=>JSON.stringify({m:S().menu&&{...S().menu,t:0,prev:0,kOk:0},l:S().loreView,say:S().msg&&S().msg.text}));ok('A_advances_dialogue',m0!==m1,{m0,m1});}
// keyboard E still works, prompt shows [E] without a pad
await pg.goto(B+'assets/README.md');
await pg.addInitScript(()=>{navigator.getGamepads=()=>[null,null,null,null]});
const ctx2=await br.newContext({viewport:{width:960,height:540}});const p2=await ctx2.newPage();p2.on('pageerror',e=>errs.push(e.message));
await p2.goto(B+'?play&mute&slot=2&class=knight&seed=0&stage=ramparts');await p2.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player,null,{timeout:30000});await p2.waitForTimeout(1200);
await p2.evaluate(()=>{const s=__G.scene.getScene('stage');s.msg=null;s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false});s.pb.setPosition(s.bonfire.x-4,s.pb.y-4);s.player.hp=1});await p2.waitForTimeout(500);
ok('nopad_padConnected0',await p2.evaluate(()=>PAD.connected())===0);
await p2.screenshot({path:'screenshots/interact_prompt_kb.png'});
await p2.keyboard.press('e');await p2.waitForTimeout(400);ok('E_rests',await p2.evaluate(()=>{const p=__G.scene.getScene('stage').player;return p.hp===p.hpMax}));
ok('no_errors',errs.length===0,errs);
console.log(JSON.stringify({pass,fail}));await br.close();process.exit(fail?1:0);
