// Headless checks for milestone D (classes, stats, leveling, weapons, armor, catalysts, 3 save slots). usage: node test/milestoneD.mjs (server on :8171)
import { chromium } from 'playwright';
const B='http://127.0.0.1:8171/',S='screenshots/D/after/';
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const errs=[],ext=[],R={};let pass=0,fail=0;const ok=(n,c,v)=>{R[n]={pass:!!c,v};c?pass++:fail++;console.error((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(v)))};
const ctx=await br.newContext({viewport:{width:1280,height:720}});const pg=await ctx.newPage();
pg.on('pageerror',e=>errs.push(e.message));pg.on('request',r=>{const u=r.url();if(!u.startsWith(B)&&!/^(data|blob):/.test(u))ext.push(u)});
const ev=(f,a)=>pg.evaluate(f,a);const wait=ms=>pg.waitForTimeout(ms);const shot=n=>pg.screenshot({path:S+n+'.png'});
const ready=async()=>{await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive());await wait(800);
 await ev(()=>{window.S=()=>__G.scene.getScene('stage');window.idle=()=>{window.__inp=()=>({})};
  window.press=k=>{let n=0;window.__inp=()=>(n++===0?{[k]:1}:{})};
  window.arena=()=>{const s=S();s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false});s.pb.setPosition(700,148);s.pb.setVelocity(0,0);s.player.f=1;s.player.state='idle';s.player.inv=99;s.player.st=999;s.player.stMax=999;s.camY=s.camTY=0};
  window.dummy=(dx,k='hollow')=>{const s=S(),e=s.spawnEnemy(k,s.player.x+dx,156);e.hp=99;e.state='idle';e.cd=99;e.temp=1;e.b.y=148;e.b.body.moves=false;return e};
  window.equip=(eq)=>{const s=S();Object.assign(s.sv.eq,eq);eq.main&&!s.sv.inv.includes(eq.main)&&s.sv.inv.push(eq.main);s.applyBuild(true)}})};
await pg.goto(B+'assets/README.md');await ev(()=>localStorage.clear());
// 1. all ten DS3 classes: level, 8 stats, derived values, starting gear
R.classes={};for(const c of ['knight','mercenary','warrior','herald','thief','assassin','sorcerer','pyromancer','cleric','deprived']){
 await pg.goto(B+`?play&mute&slot=3&class=${c}`);await ready();R.classes[c]=await ev(()=>{const s=S();return{lvl:s.lvl,stats:Object.values(s.sv.stats).join(','),hp:s.player.hpMax,st:s.player.stMax,fp:s.player.fpMax,main:s.wp.name,off:s.sv.eq.off,armor:s.sv.eq.armor,roll:s.build.roll.kind,weak:s.build.weak}})}
const ds3={knight:[9,'12,11,15,13,12,9,9,7'],mercenary:[8,'11,12,10,10,16,10,8,9'],warrior:[7,'14,6,12,16,9,8,9,11'],herald:[9,'12,10,9,12,11,8,13,11'],thief:[5,'10,11,10,9,13,10,8,14'],assassin:[10,'10,14,11,10,14,11,9,10'],sorcerer:[6,'9,9,7,7,12,16,7,12'],pyromancer:[8,'11,12,11,12,9,14,14,7'],cleric:[7,'10,9,7,12,8,7,16,13'],deprived:[1,'10,10,10,10,10,10,10,10']};
ok('ten_classes_ds3_levels_and_stats',Object.entries(ds3).every(([c,[l,s]])=>R.classes[c].lvl===l&&R.classes[c].stats===s&&!R.classes[c].weak),R.classes);
// 2. title: 3 slots, class select via keyboard, independent saves, erase
await pg.goto(B+'?mute');await ev(()=>localStorage.clear());await pg.reload();await wait(1600);
await pg.keyboard.press('Enter');await wait(250);for(let i=0;i<2;i++){await pg.keyboard.press('ArrowDown');await wait(120)}await wait(200);await shot('d01_class_select_warrior');
await pg.keyboard.press('Enter');await ready();R.s1=await ev(()=>({cls:S().sv.cls,key:!!localStorage.getItem('ashenVigil.save.v1')}));
await pg.goto(B+'?mute');await wait(1600);await pg.keyboard.press('ArrowDown');await wait(150);await pg.keyboard.press('Enter');await wait(250);for(let i=0;i<6;i++){await pg.keyboard.press('ArrowDown');await wait(120)}
await pg.keyboard.press('Enter');await ready();R.s2=await ev(()=>({cls:S().sv.cls,key:!!localStorage.getItem('ashenVigil.save.v1.s2')}));
await pg.goto(B+'?mute');await wait(1600);await shot('d02_title_three_slots');
R.slots=await ev(()=>__G.scene.getScene('title').saves.map(s=>s&&s.cls));R.lastSlot=await ev(()=>__G.scene.getScene('title').sel);
await pg.keyboard.press('ArrowUp');await wait(150);await pg.keyboard.press('Enter');await ready();R.cont1=await ev(()=>S().sv.cls);
await pg.goto(B+'?mute');await wait(1600);await pg.keyboard.press('ArrowDown');await wait(150);await pg.keyboard.press('Delete');await wait(150);await shot('d03_erase_confirm');await pg.keyboard.press('Delete');await wait(200);
R.erase=await ev(()=>({title:__G.scene.getScene('title').saves.map(s=>s&&s.cls),s2:localStorage.getItem('ashenVigil.save.v1.s2'),s1:!!localStorage.getItem('ashenVigil.save.v1')}));
ok('three_save_slots_class_select_continue_erase',R.s1.cls==='warrior'&&R.s1.key&&R.s2.cls==='sorcerer'&&R.s2.key&&R.slots[0]==='warrior'&&R.slots[1]==='sorcerer'&&R.slots[2]===null&&R.lastSlot===1&&R.cont1==='warrior'&&R.erase.s2===null&&R.erase.s1,{s1:R.s1,s2:R.s2,slots:R.slots,cont1:R.cont1,erase:R.erase});
// 3. leveling at the bonfire, rising soul costs
await pg.goto(B+'?play&mute&slot=3&class=knight');await ev(()=>localStorage.removeItem('ashenVigil.save.v1.s3'));await pg.goto(B+'?play&mute&slot=3&class=knight');await ready();
await ev(()=>{const s=S();s.souls=3000;s.pb.setPosition(1600,148);s.camY=s.camTY=0;window.__inp=()=>S().menu?{}:{restP:1}});await pg.waitForFunction(()=>!!S().menu,null,{timeout:5000});await wait(300);
R.menuOpen=await ev(()=>!!S().menu);await ev(()=>{const s=S();s.menuKey('ok')});
R.lv0=await ev(()=>({lvl:S().lvl,hp:S().player.hpMax,souls:S().souls}));
R.costs=await ev(()=>{const s=S(),c=[];for(let i=0;i<5;i++){const before=s.menu.spent;s.menuKey('right');c.push(s.menu.spent-before)}return c});await wait(200);await shot('d04_level_up_menu');
await ev(()=>{const s=S();s.menu.sel=8;s.menuKey('ok')});await wait(200);
R.lv1=await ev(()=>({lvl:S().lvl,hp:S().player.hpMax,souls:S().souls,saved:JSON.parse(localStorage.getItem('ashenVigil.save.v1.s3')).stats.vig}));
ok('level_up_at_bonfire_rising_costs',R.menuOpen&&R.costs.every((c,i)=>i===0||c>R.costs[i-1])&&R.lv1.lvl===R.lv0.lvl+5&&R.lv1.hp===R.lv0.hp+25&&R.lv1.souls===R.lv0.souls-R.costs.reduce((a,b)=>a+b)&&R.lv1.saved===17,{costs:R.costs,lv0:R.lv0,lv1:R.lv1});
// equipment menu: cycle through owned weapons and armor
await ev(()=>{const s=S();s.sv.inv.push('greatsword','iron','spear');s.menu.mode='main';s.menu.sel=1;s.menuKey('ok');s.menuKey('right')});await wait(200);await shot('d05_equipment_menu');
R.eqm=await ev(()=>{const s=S(),a=s.sv.eq.main;s.menuKey('down');s.menuKey('down');s.menuKey('right');return{main:a,armor:s.sv.eq.armor,load:+s.build.ratio.toFixed(2),roll:s.build.roll.kind}});
ok('equipment_menu_changes_weapon_and_armor',R.eqm.main!=='longsword'&&R.eqm.armor!=='knight',R.eqm);
await ev(()=>{S().menu=null});
// 4. requirements + scaling letters
R.req=await ev(()=>{const s=S(),W=WEAPONS,st={...s.sv.stats};const ar=(w,o)=>+RPG.ar(W[w],{...st,...o}).toFixed(3);
 return{gsWeak:ar('greatsword',{str:10}),gsOk:ar('greatsword',{str:16}),gs40:ar('greatsword',{str:40}),dag10:ar('dagger',{dex:10}),dag40:ar('dagger',{dex:40}),letters:Object.fromEntries(Object.keys(W).map(k=>[k,RPG.letters(W[k])])),reqs:Object.fromEntries(Object.keys(W).map(k=>[k,RPG.reqs(W[k])]))}});
ok('weapon_requirements_and_scaling',R.req.gsWeak<R.req.gsOk*.6&&R.req.gs40>R.req.gsOk*1.2&&R.req.dag40>R.req.dag10*1.3&&R.req.letters.greatsword==='STR B DEX D',R.req);
// 5. distinct movesets + heavy attacks (damage on a staggered-free dummy at fixed distance)
const swing=async(w,dist,heavy,behind)=>{await ev(([w])=>{arena();equip({main:w,off:null,armor:'leather'})},[w]);await wait(100);
 return ev(([dist,heavy,behind])=>new Promise(res=>{const s=S(),e=dummy(behind?-dist:dist);e.state='idle';e.t=0;const P=s.player;P.f=1;const hp0=e.hp,t0=s.t;let first=null;press(heavy?'heavyP':'atkP');
  const f=()=>{if(first===null&&e.hp<hp0)first=+(s.t-t0).toFixed(2);if(s.t-t0>1.1){const r={dmg:+(hp0-e.hp).toFixed(2),first};e.dead=true;e.b.body.enable=false;res(r)}else requestAnimationFrame(f)};f()}),[dist,heavy,behind])};
R.moves={};for(const w of ['longsword','greatsword','dagger','spear','axe']){R.moves[w]={light:await swing(w,14,0),heavy:await swing(w,14,1),reach34:await swing(w,34,0),behind:await swing(w,12,1,1)}}
await ev(()=>{arena();equip({main:'greatsword'});press('heavyP')});await wait(230);await shot('d06_greatsword_heavy_leap');await wait(400);
await ev(()=>{arena();equip({main:'axe'});press('heavyP')});await wait(330);await shot('d07_axe_spin');await wait(400);
await ev(()=>{arena();equip({main:'spear'});dummy(26);press('heavyP')});await wait(160);await shot('d08_spear_charge');await wait(500);
// dagger 3-hit chain
R.combo=await ev(()=>new Promise(res=>{arena();equip({main:'dagger',off:null,armor:'leather'});const s=S(),e=dummy(12);e.state='idle';let n=0,max=0;window.__inp=()=>{n++;max=Math.max(max,s.player.combo);return n%4===1?{atkP:1}:{}};setTimeout(()=>{idle();e.dead=true;e.b.body.enable=false;res({maxCombo:max})},900)}));
const M=R.moves;
ok('distinct_movesets',M.greatsword.light.first>M.dagger.light.first+.1&&M.spear.reach34.dmg>0&&M.longsword.reach34.dmg===0&&M.dagger.reach34.dmg===0&&R.combo.maxCombo===2&&M.greatsword.heavy.dmg>M.dagger.heavy.dmg*1.25,{moves:M,combo:R.combo});
ok('heavy_attacks_stronger_and_special',Object.values(M).every(m=>m.heavy.dmg>m.light.dmg)&&M.axe.behind.dmg>0&&M.greatsword.behind.dmg>0&&M.longsword.behind.dmg===0,Object.fromEntries(Object.entries(M).map(([k,v])=>[k,{light:v.light.dmg,heavy:v.heavy.dmg,behind:v.behind.dmg}])));
// bow: arrow at range, charged arrow pierces two
R.bow=await ev(()=>new Promise(res=>{arena();equip({main:'bow',off:null,armor:'leather'});const a=dummy(120),b=dummy(150);a.state=b.state='idle';const h=[a.hp,b.hp];press('atkP');
 setTimeout(()=>{const l=[+(h[0]-a.hp).toFixed(2),+(h[1]-b.hp).toFixed(2)];a.hp=b.hp=99;press('heavyP');setTimeout(()=>{res({light:l,heavy:[+(99-a.hp).toFixed(2),+(99-b.hp).toFixed(2)]});a.dead=b.dead=true},1300)},900)}));
await ev(()=>{arena();equip({main:'bow'});press('heavyP')});await wait(650);await shot('d09_bow_charged');await wait(500);
ok('bow_ranged_and_piercing_heavy',R.bow.light[0]>0&&R.bow.light[1]===0&&R.bow.heavy[0]>0&&R.bow.heavy[1]>0,R.bow);
// 6. armor weight -> roll speed; overload; poise
const roll=async(eq,vit)=>{await ev(([eq,vit])=>{arena();S().sv.stats.vit=vit;equip(eq)},[eq,vit]);await wait(150);return ev(()=>new Promise(res=>{const s=S(),x0=s.player.x,k=s.build.roll.kind;press('rollP');setTimeout(()=>res({kind:k,dist:Math.round(s.player.x-x0),state:s.player.state}),700)}))};
R.roll={light:await roll({main:'dagger',off:null,armor:'none'},10),medium:await roll({main:'longsword',off:null,armor:'herald'},10),heavy:await roll({main:'greatsword',off:null,armor:'iron'},10),over:await roll({main:'greatsword',off:null,armor:'iron'},1)};
await ev(()=>{S().sv.stats.vit=15});
ok('armor_weight_sets_roll',R.roll.light.kind==='LIGHT'&&R.roll.medium.kind==='MEDIUM'&&R.roll.heavy.kind==='HEAVY'&&R.roll.over.kind==='OVERLOADED'&&R.roll.light.dist>R.roll.medium.dist&&R.roll.medium.dist>R.roll.heavy.dist&&Math.abs(R.roll.over.dist)<12,R.roll);
const poise=async armor=>{await ev(a=>{arena();equip({main:'longsword',armor:a})},armor);return ev(()=>{const s=S(),P=s.player;P.inv=0;P.hp=P.hpMax;P.state='idle';s.hurtPlayer(14,P.x+10);return{state:P.state,lost:P.hpMax-P.hp,poise:s.build.poise}})};
R.poise={plate:await poise('knight'),robe:await poise('robe'),iron:await poise('iron')};await wait(300);
ok('poise_and_absorption',R.poise.plate.state!=='hurt'&&R.poise.robe.state==='hurt'&&R.poise.iron.lost<R.poise.robe.lost,R.poise);
// 7. catalysts: staff main, wand offhand, none, INT requirement
const cast=async(eq,int)=>{await ev(([eq,int])=>{arena();S().sv.stats.int=int;equip(eq);S().player.fp=99},[eq,int]);await wait(100);return ev(()=>new Promise(res=>{const s=S();press('iceP');setTimeout(()=>res({state:s.player.state,spells:s.spells.filter(p=>p.owner==='p').length,mul:+s.spellMul.toFixed(2),cat:s.build.cat&&s.build.cat.name}),150)}))};
R.cat={staff:await cast({main:'staff',off:null},16),staffHiInt:await cast({main:'staff',off:null},40),wandOff:await cast({main:'axe',off:'wand'},12),none:await cast({main:'axe',off:null},12),lowInt:await cast({main:'staff',off:null},7)};
await ev(()=>{arena();S().sv.stats.int=16;equip({main:'axe',off:'wand'});S().player.fp=99;press('iceP')});await wait(180);await shot('d10_wand_offhand_cast');await wait(400);
ok('staffs_and_offhand_wand_cast_int_spells',R.cat.staff.state==='cast'&&R.cat.wandOff.state==='cast'&&R.cat.wandOff.cat==='VIGIL WAND'&&R.cat.none.state!=='cast'&&R.cat.lowInt.state!=='cast'&&R.cat.staffHiInt.mul>R.cat.staff.mul&&R.cat.staff.mul>R.cat.wandOff.mul,R.cat);
// 8. pickups along the stage
await pg.goto(B+'?play&mute&slot=3&class=deprived');await ev(()=>localStorage.removeItem('ashenVigil.save.v1.s3'));await pg.goto(B+'?play&mute&slot=3&class=deprived');await ready();
await ev(()=>{const s=S();s.pb.setPosition(480,148);s.player.inv=99;window.__inp=()=>({r:1})});await wait(900);await ev(()=>idle());
R.pick=await ev(()=>({inv:S().sv.inv,saved:JSON.parse(localStorage.getItem('ashenVigil.save.v1.s3')).inv}));await shot('d11_pickup_bow');
ok('item_pickups_persist',R.pick.inv.includes('bow')&&R.pick.saved.includes('bow'),R.pick);
// 9. armor look per set + distinct lord arenas
await ev(()=>{arena();S().pb.setPosition(1580,148);equip({main:'greatsword',armor:'iron'})});await wait(500);await shot('d12_iron_greatsword_look');
R.arenas={};for(const st of ['cathedral','cinderdeep']){await pg.goto(B+`?play&mute&slot=3&stage=${st}`);await ready();
 await ev(()=>{const s=S();s.pb.setPosition(3020,140);s.player.inv=999});await pg.waitForFunction(()=>S().bossState==='fight',null,{timeout:15000});await wait(1500);
 R.arenas[st]=await ev(()=>S().oneways.filter(o=>o.body.x>2980).length);await shot('d13_arena_'+st)}
ok('distinct_lord_arenas',R.arenas.cathedral>=2&&R.arenas.cinderdeep>=2,R.arenas);
ok('no_page_errors',errs.length===0,errs);ok('no_external_requests',ext.length===0,ext);
console.log(JSON.stringify(R,null,1));console.log(`PASS ${pass} / ${pass+fail}`);await br.close();
