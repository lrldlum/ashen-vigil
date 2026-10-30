// r4 hotfix checks: title erase never on X (Delete+Delete only, any key cancels), real-keyboard chain climbs (roof A + ledge x3), economy/balance numbers, touch layout. usage: node test/r4fix.mjs
import { chromium } from 'playwright';
const B='http://127.0.0.1:8171/';let pass=0,fail=0;const ok=(n,c,v)=>{c?pass++:fail++;console.error((c?'PASS ':'FAIL ')+n+' '+JSON.stringify(v))};
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});const pg=await (await br.newContext({viewport:{width:960,height:540}})).newPage();
const errs=[];pg.on('pageerror',e=>errs.push(e.message));const wait=ms=>pg.waitForTimeout(ms);
await pg.goto(B+'assets/README.md');await pg.evaluate(()=>{localStorage.clear();localStorage.setItem('ashenVigil.save.v1',JSON.stringify({cls:'knight',stage:'ramparts',souls:111}))});
// 1. title erase
await pg.goto(B+'?mute');await wait(1600);const has=()=>pg.evaluate(()=>!!localStorage.getItem('ashenVigil.save.v1'));
for(let i=0;i<4;i++){await pg.keyboard.press('x');await wait(120)}const afterX=await has();
await pg.keyboard.press('Delete');await wait(150);const prompt=await pg.evaluate(()=>__G.scene.getScene('title').erase);await pg.screenshot({path:'screenshots/r4fix/erase_prompt.png'});
await pg.keyboard.press('x');await wait(150);const cancelled=await pg.evaluate(()=>__G.scene.getScene('title').erase)===-1&&await has();
await pg.keyboard.press('Delete');await wait(120);await pg.keyboard.press('Backspace');await wait(150);const erased=!(await has());
ok('title_erase_only_delete_confirmed',afterX&&prompt===0&&cancelled&&erased,{afterX,prompt,cancelled,erased});
// 2. chain climbs with the real keyboard (no input hook): hold UP, then UP+RIGHT
const load=async q=>{await pg.goto(B+q);await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive());await wait(600);
 await pg.evaluate(()=>{window.S=()=>__G.scene.getScene('stage');S().enemies.forEach(e=>{e.dead=true;e.b.body.enable=false});S().player.inv=999})};
const climb=async(x,variant)=>{await pg.evaluate(x=>{const s=S();s.pb.setPosition(x+4,148);s.pb.setVelocity(0,0);s.camY=s.camTY=0},x);await wait(200);
 await pg.evaluate(()=>{window.__landed=null;const s=S(),f=()=>{if(!window.__landed&&s.pb.body.blocked.down&&s.player.y<=21)window.__landed={x:Math.round(s.player.x),y:Math.round(s.player.y)};if(!window.__landed)requestAnimationFrame(f)};f()});
 await pg.keyboard.down('ArrowUp');if(variant==='upright')await pg.keyboard.down('ArrowRight');await wait(2600);
 if(variant==='jump'){await pg.keyboard.down('ArrowRight');await pg.keyboard.press('z')}else await pg.keyboard.down('ArrowRight');await wait(350);await pg.keyboard.up('ArrowUp');await pg.keyboard.up('ArrowRight');await wait(500);
 return pg.evaluate(()=>window.__landed?{...window.__landed,on:true}:{x:0,y:999,on:false})};// first landing on the slab top (y=20) after the climb
await pg.evaluate(()=>localStorage.clear());await load('?play&mute');
for(const v of ['up','upright','jump']){const r=await climb(368,v);ok('kbd_chain_roofA_'+v,r.y<=21&&r.x>=376&&r.on,r)}
for(const s of ['ramparts','cathedral','cinderdeep']){await load('?play&mute&stage='+s);for(const v of ['up','upright','jump']){const r=await climb(2896,v);ok('kbd_ledge_'+s+'_'+v,r.y<=21&&r.x>=2904&&r.on,r)}}
// 3. numbers
const N=await pg.evaluate(()=>{const st={vig:20,end:20,vit:20,str:20,dex:20,int:40,fth:20,lck:10},dps=w=>{const W=WEAPONS[w],ar=RPG.ar(W,st),m=W.light;return ar*m.mul/m.t};
 const knight=RPG.classStats('knight');return{cost10:RPG.cost(10),cost14:RPG.cost(14),gs:+dps('greatsword').toFixed(2),dag:+dps('dagger').toFixed(2),ls:+dps('longsword').toFixed(2),gsWeak:+RPG.ar(WEAPONS.greatsword,knight).toFixed(2),lsKnight:+RPG.ar(WEAPONS.longsword,knight).toFixed(2),
  staff40:+RPG.spellBuff(WEAPONS.staff,st).toFixed(2),light:RPG.derive(st,{main:'dagger',armor:'none'}).roll,medium:RPG.derive(st,{main:'greatsword',armor:'herald'}).roll,dn:TBTN.find(b=>b.k==='dn')}});
ok('level_costs_about_3x',N.cost10>=250&&N.cost14>=300,N);
ok('greatsword_not_dominant',N.gs<N.dag&&N.gsWeak<N.lsKnight,N);
ok('light_roll_farther_than_medium',N.light.v*N.light.t>N.medium.v*N.medium.t*1.1,{light:N.light,medium:N.medium});
ok('staff_spell_buff_int40_ge_2_5',N.staff40>=2.5,N.staff40);
ok('touch_down_button_on_screen',N.dn.y+N.dn.r<=176,N.dn);
ok('no_page_errors',errs.length===0,errs);console.log(`PASS ${pass} / ${pass+fail}`);await br.close();
