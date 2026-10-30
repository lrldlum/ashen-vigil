// Headless checks for milestone E (story: hub shrine + keeper + merchant, item descriptions, lore, two endings, faith miracles, distinct lord arenas). usage: node test/milestoneE.mjs (server on :8171)
import { chromium } from 'playwright';
const B='http://127.0.0.1:8171/',S='screenshots/E/after/';
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const errs=[],ext=[],R={};let pass=0,fail=0;const ok=(n,c,v)=>{R[n]={pass:!!c,v};c?pass++:fail++;console.error((c?'PASS ':'FAIL ')+n+' '+JSON.stringify(v).slice(0,600))};
const ctx=await br.newContext({viewport:{width:1280,height:720}});const pg=await ctx.newPage();
pg.on('pageerror',e=>errs.push(e.message));pg.on('request',r=>{const u=r.url();if(!u.startsWith(B)&&!/^(data|blob):/.test(u))ext.push(u)});
const ev=(f,a)=>pg.evaluate(f,a);const wait=ms=>pg.waitForTimeout(ms);const shot=n=>pg.screenshot({path:S+n+'.png'});
const ready=async()=>{await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive());await wait(700);
 await ev(()=>{window.S=()=>__G.scene.getScene('stage');window.idle=()=>{window.__inp=()=>({})};window.press=k=>{let n=0;window.__inp=()=>(n++===0?{[k]:1}:{})};
  window.tp=(x,y=156)=>{const s=S();s.pb.setPosition(x,y-8);s.pb.setVelocity(0,0);s.player.state='idle';s.player.inv=99;s.camY=s.camTY=y-156};
  window.arena=()=>{const s=S();s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false});tp(700);s.player.f=1;s.player.st=999;s.player.stMax=999;s.player.fp=999};
  window.dummy=dx=>{const s=S(),e=s.spawnEnemy('hollow',s.player.x+dx,156);e.hp=99;e.state='idle';e.cd=99;e.temp=1;e.b.y=148;e.b.body.moves=false;return e};
  window.until=(f,ms)=>new Promise(r=>{const t0=performance.now(),g=()=>{if(f())r(true);else if(performance.now()-t0>ms)r(false);else requestAnimationFrame(g)};g()})})};
const go=async q=>{await pg.goto(B+q);await ready()};
await pg.goto(B+'assets/README.md');await ev(()=>localStorage.clear());
// 1. every item / weapon / armor / spell / miracle has a cryptic description
await go('?play&mute&slot=1&class=knight');
R.desc=await ev(()=>{const ids=[...Object.keys(WEAPONS),...Object.keys(ARMORS),...Object.keys(SPELLS),...Object.keys(MIRACLES),'flask'];return{n:ids.length,missing:ids.filter(i=>!(DESC[i]&&DESC[i].length>=2)),maxLen:Math.max(...Object.values(DESC).flat().map(s=>s.length)),glyphs:[...new Set(Object.values(DESC).flat().join('').split(''))].filter(c=>!FONT[c]&&c!==' ')}});
ok('descriptions_for_every_item',R.desc.missing.length===0&&R.desc.n>=22&&R.desc.maxLen<=60&&R.desc.glyphs.length===0,R.desc);
await ev(()=>{const s=S();tp(1600);s.souls=0;window.__inp=()=>s.menu?{}:{restP:1}});await pg.waitForFunction(()=>!!S().menu,null,{timeout:5000});
await ev(()=>{const s=S();s.menu.sel=s.mainOpts().indexOf('ITEMS AND SPELLS');s.menuKey('ok');s.menuKey('down')});await wait(250);await shot('e01_items_and_spells_descriptions');
R.itemsMenu=await ev(()=>({mode:S().menu.mode,list:S().itemList().map(x=>x[0])}));
await ev(()=>{const s=S();s.menuKey('back');s.menu.sel=1;s.menuKey('ok')});await wait(250);await shot('e02_equipment_description');await ev(()=>{S().menu=null;idle()});
ok('items_menu_lists_inventory_spells_flask',R.itemsMenu.mode==='items'&&['longsword','wand','knight','ice','bolt','dome','flask'].every(i=>R.itemsMenu.list.includes(i)),R.itemsMenu);
// 2. lore stones: 3 per stage + the shrine, readable, saved
R.loreCount=await ev(()=>({total:Object.keys(LORE).length,per:Object.fromEntries(Object.entries(STAGE_DEFS).map(([k,d])=>[k,(d.lore||[]).length]))}));
await ev(()=>{tp(420);idle()});await wait(200);await shot('e03_lore_stone_prompt');await ev(()=>press('restP'));await wait(400);await shot('e04_lore_stone_read');
R.lore=await ev(()=>({view:S().loreView&&S().loreView.id,saved:JSON.parse(localStorage.getItem('ashenVigil.save.v1')).lore}));await ev(()=>press('jumpP'));await wait(300);R.loreClosed=await ev(()=>!S().loreView);
ok('lore_scattered_and_readable',R.loreCount.total===10&&R.loreCount.per.ramparts===3&&R.loreCount.per.cathedral===3&&R.loreCount.per.cinderdeep===3&&R.loreCount.per.shrine===1&&R.lore.view==='r1'&&R.lore.saved.includes('r1')&&R.loreClosed,{...R.loreCount,...R.lore,closed:R.loreClosed});
// 3. hub between stages: stage 1 lord -> REST AT THE ASH SHRINE -> hub -> exit -> stage 2
await ev(()=>{S().souls=4000;tp(3020,140)});await pg.waitForFunction(()=>S().bossState==='fight',null,{timeout:15000});await ev(()=>{S().boss.hp=0});await pg.waitForFunction(()=>S().victory&&S().victory.t>1,null,{timeout:12000});
await pg.keyboard.press('ArrowDown');await wait(150);await shot('e05_victory_card_shrine_option');R.vopts=await ev(()=>S().victoryOpts());await pg.keyboard.press('Enter');await wait(1500);await ready();
R.hub=await ev(()=>({sid:S().sid,next:S().sv.hubNext,lords:S().sv.lords,keeper:S().def.keeper,bossState:S().bossState,enemies:S().enemies.length}));await ev(()=>tp(250));await wait(500);await shot('e06_ash_shrine_hub');
ok('hub_reached_between_stages',R.vopts[1]==='REST AT THE ASH SHRINE'&&R.hub.sid==='shrine'&&R.hub.next==='cathedral'&&R.hub.lords.includes('warden')&&R.hub.bossState==='dead'&&R.hub.enemies===0,{opts:R.vopts,...R.hub});
// 4. keeper: dialogue changes with progress
const talk=async()=>{await ev(()=>{tp(S().def.keeper-6);idle()});await wait(250);await ev(()=>press('restP'));await wait(300);await ev(()=>{S().menuKey('ok');S().menu.t=99});await wait(150);return ev(()=>{const s=S();return{mode:s.menu.mode,tier:s.keeperTier(),line:KEEPER.lines[s.keeperTier()][0]}})};
R.talk1=await talk();await shot('e07_keeper_dialogue_after_warden');await ev(()=>{const s=S();while(s.menu&&s.menu.mode==='talk')s.menuKey('ok')});
await ev(()=>{const s=S();s.sv.lords=[];s.sv.endings=[]});R.talk0=await ev(()=>({tier:S().keeperTier(),line:KEEPER.lines[S().keeperTier()][0]}));
await ev(()=>{const s=S();s.sv.lords=['warden','cantor']});R.talk2=await ev(()=>({tier:S().keeperTier()}));await ev(()=>{const s=S();s.sv.endings=['rekindle']});R.talk3=await ev(()=>({tier:S().keeperTier()}));await ev(()=>{const s=S();s.sv.lords=['warden'];s.sv.endings=[]});
ok('keeper_dialogue_changes_with_progress',R.talk1.mode==='talk'&&R.talk1.tier===1&&R.talk0.tier===0&&R.talk2.tier===2&&R.talk3.tier===3&&R.talk0.line!==R.talk1.line,{t1:R.talk1,t0:R.talk0,t2:R.talk2,t3:R.talk3});
// 5. merchant
await ev(()=>{const s=S();s.menu={mode:'keeper',sel:1,t:0,prev:{}};s.souls=5000;s.menuKey('ok')});await wait(200);await shot('e08_keeper_merchant');
R.buy=await ev(()=>{const s=S(),L=s.shopList(),i=L.findIndex(x=>x[0]==='talisman');s.menu.sel=i;const s0=s.souls;s.menuKey('ok');const j=s.shopList().findIndex(x=>x[0]==='lspear');s.menu.sel=j;s.menuKey('ok');const f0=s.player.flasks;s.menu.sel=s.shopList().findIndex(x=>x[0]==='flask');s.menuKey('ok');
 return{spent:s0-s.souls,inv:s.sv.inv.filter(i=>['talisman','lspear'].includes(i)),flaskBonus:s.sv.flaskBonus,flasks:s.player.flasks-f0,saved:JSON.parse(localStorage.getItem('ashenVigil.save.v1')).inv.includes('talisman'),poor:(s.souls=0,s.menu.sel=0,s.menuKey('ok'),s.menu.say)}});
await wait(150);await shot('e09_merchant_not_enough_souls');await ev(()=>{S().menu=null});
ok('merchant_sells_items_for_souls',R.buy.spent===600+1200+2000&&R.buy.inv.length===2&&R.buy.flaskBonus===1&&R.buy.flasks===0&&/* r5: a bought flask arrives at the next rest */R.buy.saved&&/LACK/.test(R.buy.poor),R.buy);
// 6. hub leveling at the shrine bonfire
await ev(()=>{const s=S();s.souls=3000;tp(s.bonfire.x+4);window.__inp=()=>s.menu?{}:{restP:1}});await pg.waitForFunction(()=>!!S().menu,null,{timeout:5000});
R.lvl=await ev(()=>{const s=S(),l0=s.lvl,o=s.mainOpts();s.menuKey('ok');s.menuKey('right');s.menu.sel=8;s.menuKey('ok');return{opts:o,l0,l1:s.lvl,souls:s.souls}});await ev(()=>{S().menu=null;idle()});
ok('hub_leveling',R.lvl.opts[0]==='LEVEL UP'&&!R.lvl.opts.includes('TRAVEL TO THE SHRINE')&&R.lvl.l1===R.lvl.l0+1&&R.lvl.souls<3000,R.lvl);
await ev(()=>{tp(S().def.exit-30);idle()});await wait(300);await shot('e10_shrine_exit_arch');await ev(()=>{tp(S().def.exit);idle()});await wait(250);await ev(()=>press('restP'));await wait(1500);await ready();
R.exit=await ev(()=>({sid:S().sid,lords:S().sv.lords,inv:S().sv.inv.includes('talisman')}));
await ev(()=>{const s=S();tp(s.bonfire.x+4);window.__inp=()=>s.menu?{}:{restP:1}});await pg.waitForFunction(()=>!!S().menu,null,{timeout:5000});R.travelOpt=await ev(()=>S().mainOpts());await shot('e11_bonfire_travel_to_shrine');
await ev(()=>{const s=S();s.menu.sel=s.mainOpts().indexOf('TRAVEL TO THE SHRINE');s.menuKey('ok')});await wait(1500);await ready();R.back=await ev(()=>({sid:S().sid,next:S().sv.hubNext,ret:S().sv.retBonfire}));
await ev(()=>{tp(S().def.exit);idle()});await wait(250);await ev(()=>press('restP'));await wait(1500);await ready();R.back2=await ev(()=>({sid:S().sid,x:Math.round(S().player.x),bonfire:S().bonfire.x}));
ok('shrine_exit_and_bonfire_travel',R.exit.sid==='cathedral'&&R.exit.inv&&R.travelOpt.includes('TRAVEL TO THE SHRINE')&&R.back.sid==='shrine'&&R.back.next==='cathedral'&&R.back2.sid==='cathedral'&&Math.abs(R.back2.x-R.back2.bonfire)<30,{exit:R.exit,opts:R.travelOpt,back:R.back,back2:R.back2});
// 7. faith miracles scale with FTH
await ev(()=>localStorage.removeItem('ashenVigil.save.v1.s3'));await go('?play&mute&slot=3&class=cleric');
R.mir=await ev(()=>new Promise(async res=>{const s=S(),P=s.player,o={};const w=ms=>new Promise(r=>setTimeout(r,ms));arena();
 const heal=async f=>{s.sv.stats.fth=f;s.applyBuild(false);P.hp=20;P.fp=999;P.state='idle';press('healP');await w(700);return P.hp-20};o.inv=s.sv.inv.filter(i=>MIRACLES[i]);o.off=s.sv.eq.off;
 o.heal16=await heal(16);o.heal40=await heal(40);
 const spear=async f=>{s.sv.stats.fth=f;s.applyBuild(false);arena();const e=dummy(90);P.fp=999;press('lspearP');await w(900);const d=+(99-e.hp).toFixed(2);e.dead=true;e.b.body.enable=false;return d};o.ls16=await spear(16);o.ls40=await spear(40);
 s.sv.stats.fth=16;s.applyBuild(false);const sw=async()=>{arena();const e=dummy(14);P.fp=999;press('atkP');await w(600);const d=+(99-e.hp).toFixed(2);e.dead=true;e.b.body.enable=false;return d};o.melee=await sw();
 s.sv.inv.push('blessed');P.fp=999;press('blessP');await w(600);o.bless=+P.bless.toFixed(1);o.blessed=await sw();
 res(o)}));
await ev(()=>{arena();S().player.fp=999;press('lspearP')});await wait(330);await shot('e12_lightning_spear');await ev(()=>{arena();S().player.hp=40;S().player.fp=999;press('healP')});await wait(300);await shot('e13_heal_miracle');
await ev(()=>{arena();S().sv.inv.includes('blessed')||S().sv.inv.push('blessed');S().player.fp=999;press('blessP')});await wait(700);await ev(()=>press('atkP'));await wait(120);await shot('e14_blessed_weapon');
R.noTal=await ev(()=>new Promise(res=>{const s=S();s.sv.eq.off=null;s.applyBuild(false);arena();s.player.fp=50;const fp=s.player.fp;press('healP');setTimeout(()=>res({fp0:fp,fp1:s.player.fp,state:s.player.state}),400)}));
ok('faith_miracles_scale_with_fth',R.mir.off==='talisman'&&R.mir.inv.includes('heal')&&R.mir.inv.includes('lspear')&&R.mir.heal40>R.mir.heal16*1.2&&R.mir.ls16>0&&R.mir.ls40>R.mir.ls16*1.2&&R.mir.bless>5&&R.mir.blessed>R.mir.melee*1.15&&R.noTal.fp1>=R.noTal.fp0&&R.noTal.state!=='cast',{...R.mir,noTal:R.noTal});
R.herald=await ev(()=>({herald:[CLASSES.herald.off,CLASSES.herald.extra],cleric:[CLASSES.cleric.off,CLASSES.cleric.extra]}));
ok('herald_and_cleric_start_with_faith_heal',R.herald.herald[0]==='talisman'&&R.herald.herald[1].includes('heal')&&R.herald.cleric[1].includes('heal'),R.herald);
// 8. distinct lord arenas: cantor glides to a 2-tier loft, vulcrest's lava pits open in phase 2
await go('?play&mute&slot=3&stage=cathedral');
R.loft=await ev(()=>new Promise(async res=>{const s=S();s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false});tp(3020,140);await until(()=>s.bossState==='fight',15000);const B=s.boss;B.hp=B.hpMax*.6;s.player.inv=999;s.player.hp=9999;s.player.hpMax=9999;
 const ok1=await until(()=>s.boss.state==='perch',12000);res({perch:ok1,y:Math.round(s.boss.y),plats:s.plats.filter(p=>p[0]>2980).map(p=>p[1])})}));await wait(500);await shot('e15_cantor_choir_loft');
await go('?play&mute&slot=3&stage=cinderdeep');
R.lava=await ev(()=>new Promise(async res=>{const s=S();s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false});tp(3020,140);await until(()=>s.bossState==='fight',15000);const B=s.boss;B.hp=B.hpMax*.6;await until(()=>B.phase>=2&&B.state!=='roar',6000);
 B.cd=99;B.state='cast';B.dur=99;const pit=s.def.lavaPits[0];s.player.inv=0;s.player.hp=s.player.hpMax;tp((pit[0]+pit[1])/2);const hp0=s.player.hp;await until(()=>s.player.hp<hp0,2500);res({pits:s.def.lavaPits.length,phase:B.phase,hurt:hp0-s.player.hp})}));await wait(300);await shot('e16_vulcrest_lava_pits');
ok('distinct_lord_arenas',R.loft.perch&&R.loft.y<100&&R.loft.plats.includes(80)&&R.lava.pits===3&&R.lava.phase>=2&&R.lava.hurt>0,{loft:R.loft,lava:R.lava});
// 9. endings: final lord -> FIRST FLAME choice -> fade cinematic -> card; rekindle via the other option
await go('?play&mute&slot=3&stage=cinderdeep');await ev(()=>{S().enemies.forEach(e=>{e.dead=true;e.b.body.enable=false});tp(3020,140)});await pg.waitForFunction(()=>S().bossState==='fight',null,{timeout:15000});await ev(()=>{S().boss.hp=0});
await pg.waitForFunction(()=>S().victory&&S().victory.t>1,null,{timeout:12000});R.final=await ev(()=>S().victoryOpts());await pg.keyboard.press('Enter');await wait(700);await shot('e17_first_flame_choice');
R.choice=await ev(()=>({phase:S().victory.phase,opts:S().victoryOpts()}));await pg.keyboard.press('ArrowDown');await wait(200);await shot('e18_choice_let_it_fade');await pg.keyboard.press('Enter');
await pg.waitForFunction(()=>__G.scene.isActive('ending'),null,{timeout:8000});await wait(4500);await shot('e19_fade_cinematic');await wait(4000);await shot('e20_fade_cinematic_late');
await pg.waitForFunction(()=>__G.scene.getScene('ending').card&&__G.scene.getScene('ending').card.t>.8,null,{timeout:8000});await shot('e21_fade_end_card');
R.fade=await ev(()=>({kind:__G.scene.getScene('ending').kind,endings:JSON.parse(localStorage.getItem('ashenVigil.save.v1.s3')).endings}));
await pg.keyboard.press('Enter');await wait(1500);await ready();R.ng=await ev(()=>({sid:S().sid,ng:S().ng,endings:S().sv.endings,lore:S().sv.lore.length}));
await pg.goto(B+'?mute&slot=3&ending=rekindle');await wait(5200);await shot('e22_rekindle_cinematic');await wait(3500);await shot('e23_rekindle_cinematic_late');await pg.keyboard.press('Enter');await wait(900);await shot('e24_rekindle_end_card');
R.rek=await ev(()=>({kind:__G.scene.getScene('ending').kind,card:!!__G.scene.getScene('ending').card,endings:JSON.parse(localStorage.getItem('ashenVigil.save.v1.s3')).endings}));
await pg.keyboard.press('ArrowDown');await wait(150);await pg.keyboard.press('Enter');await wait(1500);R.title=await ev(()=>__G.scene.isActive('title'));
ok('two_endings_with_cinematic_and_card',R.final[0]==='APPROACH THE FIRST FLAME'&&R.choice.phase==='choose'&&R.choice.opts.length===2&&R.fade.kind==='fade'&&R.fade.endings.includes('fade')&&R.ng.sid==='ramparts'&&R.ng.ng===1&&R.ng.endings.includes('fade')&&R.rek.kind==='rekindle'&&R.rek.card&&R.rek.endings.includes('rekindle')&&R.title,{final:R.final,choice:R.choice,fade:R.fade,ng:R.ng,rek:R.rek,title:R.title});
// keeper's post-ending line
await ev(()=>{const k='ashenVigil.save.v1.s3',s=JSON.parse(localStorage.getItem(k));s.stage='shrine';localStorage.setItem(k,JSON.stringify(s))});await go('?play&continue&mute&slot=3');R.tier3=await ev(()=>S().keeperTier());await ev(()=>{tp(S().def.keeper-6);idle()});await wait(250);await ev(()=>press('restP'));await wait(300);await ev(()=>{S().menuKey('ok');S().menu.t=99});await wait(200);await shot('e25_keeper_after_ending');
ok('keeper_remembers_endings',R.tier3===3,R.tier3);
ok('no_page_errors_no_external_requests',errs.length===0&&ext.length===0,{errs,ext});
console.log(`PASS ${pass} / ${pass+fail}`);await br.close();
