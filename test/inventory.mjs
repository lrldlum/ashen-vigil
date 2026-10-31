// Visual inventory / equip screen: keyboard, pad (input injection like the pad path), touch; live equip + model + comparison.
import { chromium } from './node_modules/playwright/index.mjs';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`;let pass=0,fail=0;const ok=(n,c,d)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(d)))};
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});const pg=await br.newPage({viewport:{width:960,height:540}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto(B+'assets/README.md');await pg.evaluate(()=>localStorage.clear());await pg.goto(B+'?play&mute&novideo&slot=1&class=knight&stage=ramparts&seed=0');
await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await pg.waitForTimeout(1200);
const S=f=>pg.evaluate(f),K=async k=>{await pg.keyboard.press(k);await pg.waitForTimeout(90)};
await S(()=>{const s=__G.scene.getScene('stage');window.s=s;s.msg=null;s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false});s.sv.inv.push('greatsword','spear','talisman','iron_helm','ring_life','ring_sage','iron_greaves');s.menu={mode:'main',sel:s.mainOpts().indexOf('EQUIPMENT'),t:1,prev:{}}});
await K('Enter');ok('portrait_integer_scale_large',await S(()=>Number.isInteger(INV_HS)&&INV_HS>=4&&INV_HX-11*INV_HS/2>=24&&INV_HY<=132));ok('equipment_opens_visual_inventory',await S(()=>s.menu.mode)==='inv');await pg.screenshot({path:'screenshots/inventory/slots.png'});
// keyboard: R hand grid, move right, compare shows, Enter equips immediately
await K('Enter');ok('grid_focus',await S(()=>s.menu.focus)==='grid');await K('ArrowRight');
const cmp=await S(()=>{const o=s.invOpts('main'),b1=s.invBuildWith('main',o[s.menu.gi]);return{id:o[s.menu.gi],a:s.build.ar,b:b1.ar}});ok('before_after_comparison',cmp.a!==cmp.b,cmp);
await pg.screenshot({path:'screenshots/inventory/grid_compare.png'});
await K('Enter');const eq=await S(()=>({main:s.sv.eq.main,wp:s.wp&&s.wp.name,saved:JSON.parse(localStorage.getItem(Save.key())).eq.main}));ok('keyboard_equips_live_and_saves',eq.main===cmp.id&&eq.saved===cmp.id&&eq.wp===await S(()=>WEAPONS[s.sv.eq.main].name),eq);
await K('Escape');ok('esc_back_to_slots',await S(()=>s.menu&&s.menu.mode==='inv'&&s.menu.focus==='slots'));
// head slot via arrows (R HAND -> right = HEAD), equip the helm: poise goes up
const p0=await S(()=>s.build.poise);await K('ArrowRight');await K('Enter');await K('ArrowRight');await K('Enter');
const hd=await S(()=>({head:s.sv.eq.head,poise:s.build.poise}));ok('head_slot_equips_helm_poise_up',hd.head==='iron_helm'&&hd.poise>p0,{hd,p0});await K('Escape');
await pg.screenshot({path:'screenshots/inventory/helm_on_model.png'});
// pad-style input (A = jumpP confirm, B = rollP back, dpad edges) through menuInput: ring slot
await S(()=>{s.menu.slot=0;s.menu.focus='slots';window.seq=[{dn:1},{},{dn:1},{},{jumpP:1},{},{r:1},{},{jumpP:1},{},{rollP:1},{}];window.__inp=()=>seq.length?seq.shift():{}});await pg.waitForTimeout(1500);
const rg=await S(()=>({k:s.menu.slot,ring:s.sv.eq.ring2||s.sv.eq.ring1,hp:s.build.hp,focus:s.menu.focus}));ok('pad_nav_equips_ring',!!rg.ring&&rg.focus==='slots',rg);
await S(()=>{window.__inp=null});
// touch: tap the LEGS slot, tap an item twice
const tap=async(x,y)=>{await pg.mouse.click(x*3,y*3);await pg.waitForTimeout(150)};
await tap(105,117);ok('touch_slot_opens_grid',await S(()=>s.menu.focus==='grid'&&s.menu.slot===7),await S(()=>[s.menu.focus,s.menu.slot]));
await tap(152+27+12,20+12);await tap(152+27+12,20+12);ok('touch_equips_legs',await S(()=>s.sv.eq.legs)==='iron_greaves',await S(()=>s.sv.eq));
// spell slot
await S(()=>{s.menu.focus='slots';s.menu.slot=9});await K('Enter');await K('ArrowRight');await K('Enter');ok('spell_slot_set',await S(()=>s.sv.att.slots.length)>=1&&await S(()=>s.sv.att.slots.length)<=4,await S(()=>s.sv.att));
await pg.screenshot({path:'screenshots/inventory/full.png'});
await K('Escape');await K('Escape');ok('back_out_of_inventory',await S(()=>!s.menu||s.menu.mode==='main'));
ok('no_errors',errs.length===0,errs);console.log(JSON.stringify({pass,fail}));await br.close();process.exit(fail?1:0);
