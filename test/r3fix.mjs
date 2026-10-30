// r3 P1/P2 regression checks: chain-top climbs reach the slab (roof A + ledge in all 3 stages), Ember Run gate closed until started and clear persisted. usage: node test/r3fix.mjs
import { chromium } from 'playwright';
const B='http://127.0.0.1:8171/';let pass=0,fail=0;const R={};const ok=(n,c,v)=>{R[n]=v;c?pass++:fail++;console.error((c?'PASS ':'FAIL ')+n+' '+JSON.stringify(v))};
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});const pg=await (await br.newContext({viewport:{width:960,height:540}})).newPage();
const errs=[];pg.on('pageerror',e=>errs.push(e.message));
const load=async q=>{await pg.goto(B+q);await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive());await pg.waitForTimeout(600);
 await pg.evaluate(()=>{window.S=()=>__G.scene.getScene('stage');S().enemies.forEach(e=>{e.dead=true;e.b.body.enable=false})})};
// climb: stand at chain bottom, hold UP only (no steering, no jump), then hold RIGHT after the top; report max-right landing on the slab
const climb=(x,goalX,v=0)=>pg.evaluate(([x,goalX,v])=>new Promise(res=>{const s=S();s.pb.setPosition(x+4,148);s.pb.setVelocity(0,0);s.player.inv=999;s.camY=s.camTY=0;let n=0,top=1e9,phase=0,land=null;
 window.__inp=()=>{n++;const P=s.player;top=Math.min(top,P.y);if(phase===0&&P.state!=='climb'&&n>30)phase=1;if(phase===1&&s.pb.body.blocked.down&&!land)land={x:Math.round(P.x),y:Math.round(P.y)};return land?{}:phase===0?(v===1?{up:1,r:1}:v===2&&n>20&&P.y<40?{up:1,r:1,jumpP:n%2,jump:1}:{up:1}):{r:1}};
 setTimeout(()=>{const P=s.player;window.__inp=()=>({});res({land,top:Math.round(top),ok:!!land&&land.y<=21&&land.x>goalX})},4500)}),[x,goalX,v]);
await pg.goto(B+'assets/README.md');await pg.evaluate(()=>localStorage.clear());
await load('?play&mute');for(const v of [0,1,2]){const r=await climb(368,377,v);ok('chain_top_roofA_reaches_slab_v'+v,r.ok,r)}
for(const s of ['ramparts','cathedral','cinderdeep']){await load('?play&mute&stage='+s);for(const v of [0,1,2]){const r=await climb(2896,2905,v);ok('ledge_chain_'+s+'_reaches_ember_slab_v'+v,r.ok,r)}}
// Ember Run: gate closed before the run, opens on start, clear saved to chDone
await pg.evaluate(()=>localStorage.clear());await load('?play&mute');
R.run=await pg.evaluate(()=>new Promise(res=>{const s=S(),ch=s.chs.find(c=>c.id==='c_run');const before=ch.gateObjs.map(g=>g.closed&&g.body.body.enable);
 s.pb.setPosition(1770,-110);s.pb.setVelocity(0,0);s.player.inv=999;s.camY=s.camTY=-200;window.__inp=()=>({});
 setTimeout(()=>{const started=ch.active,open=ch.gateObjs.every(g=>!g.closed);s.freeCage(s.cages.find(c=>c.id==='e4'));setTimeout(()=>{res({before,started,open,done:ch.done,saved:JSON.parse(localStorage.getItem('ashenVigil.save.v1')||'{}').chDone})},300)},500)}));
ok('ember_run_gate_closed_until_start_and_clear_saved',R.run.before.every(Boolean)&&R.run.started&&R.run.open&&R.run.done&&(R.run.saved||[]).includes('c_run'),R.run);
ok('no_page_errors',errs.length===0,errs);
console.log(`PASS ${pass} / ${pass+fail}`);await br.close();
