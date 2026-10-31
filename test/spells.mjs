// Spells: 4 shared slots, sorcerer lock, cycle/cast (keys + pad latch), native effects for every spell, tiers, merchant, drops, pause equip.
import { chromium } from './node_modules/playwright/index.mjs';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`;let pass=0,fail=0;const ok=(n,c,d)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(d)))};
const SHOTS=process.env.SHOTS!=='0';
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});const pg=await br.newPage({viewport:{width:960,height:540}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
const boot=async cls=>{await pg.goto(B+'assets/README.md');await pg.evaluate(()=>localStorage.clear());await pg.goto(B+`?play&mute&novideo&slot=1&class=${cls}&stage=ramparts&seed=0`);
 await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await pg.waitForTimeout(1200);
 await pg.evaluate(()=>{const s=__G.scene.getScene('stage');window.s=s;s.msg=null})};
const S=(f,a)=>pg.evaluate(f,a),K=async k=>{await pg.keyboard.press(k);await pg.waitForTimeout(120)};
await boot('knight');
ok('spells_loaded_native_no_vendor',await S(()=>typeof SPELLBOOK==='object'&&typeof PFX==='undefined'&&![...document.scripts].some(x=>/pixelfx/.test(x.src))));
ok('exactly_4_slots',await S(()=>s.spSlots()===4&&s.sv.att.slots.length<=4));
// knight: sorcerer-only spells locked
await S(()=>{s.sv.spells.push('meteor','chain','fireball','icelance','mend','voidorb');s.sv.stats.int=12;s.spFit()});
ok('sorc_locked_for_knight',await S(()=>s.spLocked('meteor')&&s.spLocked('chain')&&!s.spLocked('fireball')));
ok('inventory_refuses_locked',await S(()=>{s.menu={mode:'inv',slot:8,focus:'grid',gi:0,t:1,prev:{}};const r=s.invEquip('sp0','meteor');const r2=!s.sv.att.slots.includes('meteor');s.menu=null;return r===false&&r2}));
await S(()=>{s.sv.stats.int=24});ok('int24_unlocks',await S(()=>!s.spLocked('meteor')));
// fill 4 slots through the shared inventory model; 5th impossible
await S(()=>{['fireball','icelance','meteor','mend'].forEach((id,i)=>s.invEquip('sp'+i,id))});
ok('slots_shared_with_inventory',await S(()=>JSON.stringify(s.sv.att.slots))==='["fireball","icelance","meteor","mend"]',await S(()=>s.sv.att.slots));
ok('no_fifth_slot',await S(()=>{s.spLearn('voidorb');return s.sv.att.slots.length===4}));
// cycle with Q, cast with C (keyboard)
await S(()=>{s.sv.att.sel=0;s.player.fp=999;s.player.fpMax=999;s.build.cat=s.build.cat||'x';s.build.tal=s.build.tal||'x';s.build.spell=s.build.spell||1;s.build.mir=s.build.mir||1;s.sv.stats.fth=40});
await K('q');ok('q_cycles',await S(()=>s.sv.att.sel)===1);await K('q');await K('q');await K('q');ok('cycle_wraps',await S(()=>s.sv.att.sel)===0);
const n0=await S(()=>s.stats.spFired||0);await K('c');await pg.waitForTimeout(900);ok('c_casts_selected',await S(()=>s.stats.spFired||0)>n0,await S(()=>[s.stats,s.player.state]));
// pad latch: RB/LT/RT -> spellP; dpad tap -> cycle
ok('pad_map',await S(()=>/spellP:!!\(L\.RB\|\|L\.LT\|\|L\.RT\)/.test(PAD.take.toString())&&/cycL/.test(PAD.take.toString())));
await S(()=>{window.__inp=null;const ri=s.readInput;window.__seq=[{cycR:1}];s.readInput=function(){const o=ri.call(this);const x=__seq.shift();if(x)Object.assign(o,x);return o}});
// (the readInput wrapper in spells.js consumes cycR set by PAD.take; emulate by direct call)
await S(()=>s.spCycle(1));ok('dpad_cycle_fn',await S(()=>s.sv.att.sel)===1);
// every native effect renders: fire each spell, screenshot
const ids=await S(()=>Object.keys(SPELLBOOK).filter(k=>!SPELLBOOK[k].legacy));
// slow: Frost Nova and Grasping Dark set e.slowT; game.js slowEnemies halves movement and timers
for(const id of['frostnova','tendrils']){const r=await S(id=>{const P=s.player;const e=s.enemies.find(e=>!e.dead)||s.spawnEnemy('hollow',P.x+30);e.b.x=P.x+P.f*24;e.b.body.reset(e.b.x,e.b.y);e.slowT=0;e.hp=999;s.spFx.length=0;s.spFire(id);window.__e=e;return!!e},id);
 await pg.waitForTimeout(700);ok(id+'_slows',await S(()=>__e.slowT>0),await S(()=>__e.slowT));}
ok('game_slowEnemies_halves',await S(()=>{const e=__e;e.slowT=2;e.b.setVelocityX(80);const t0=e.t;s.slowEnemies(.1);return Math.abs(e.b.body.velocity.x-40)<1&&Math.abs(e.t-(t0-.05))<1e-6&&e.slowT<2}));
const mv=await S(()=>new Promise(res=>{const e=__e,ue=s.updateEnemies;// fixed walker: velocity 60 + a direct 20px/s nudge each frame, through the real update loop
 s.updateEnemies=function(dt){ue.call(this,dt);e.b.setVelocityX(60);e.b.x+=20*dt;e.state='walk'};
 const go=(slow,cb)=>{e.slowT=slow?5:0;e.b.body.reset(s.player.x+40,e.b.y);const x0=e.b.x;setTimeout(()=>cb(e.b.x-x0),500)};
 go(0,a=>go(1,b=>{s.updateEnemies=ue;res({free:a,slowed:b})}))}));
ok('slowed_enemy_moves_about_half',mv.free>10&&mv.slowed<mv.free*.65&&mv.slowed>mv.free*.3,mv);
await S(()=>{__e.slowT=0});
await S(()=>{s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false})});
for(const tier of[0,1,2,3])for(const id of ids){await S(([id,tier])=>{const lv=[0,4,7,10][tier];s.sv.spLv[id]=lv;s.spFx.length=0;s.spProj.length=0;s.player.hp=s.player.hpMax;s.spFire(id)},[id,tier]);
  const S0=await S(id=>SPELLBOOK[id],id);const wait=S0.kind==='proj'?260:S0.kind==='strike'?Math.round((S0.hitT||.2)*1000)+60:S0.kind==='shield'?400:160;await pg.waitForTimeout(wait);
  if(SHOTS&&(tier===0||tier===3))await pg.screenshot({path:`screenshots/spells/${id}_t${tier}.png`});}
ok('all_effects_ran_no_errors',errs.length===0,errs);
// merchant (bonfire option) sells and empowers
await S(()=>{s.souls=99999;s.sv.shards=20;s.menu={mode:'main',sel:s.mainOpts().indexOf('MERCHANT')}});await S(()=>s.menuKey('ok'));
ok('merchant_opens',await S(()=>s.menu.mode)==='merchant');
await S(()=>{const R=s.spShopRows();s.menu.sel=R.findIndex(r=>r[0]==='spell');s.menuKey('ok')});ok('merchant_sells_spell',await S(()=>s.stats.spLearned>=1));
await S(()=>{s.sv.spLv.fireball=3;const R=s.spShopRows();s.menu.sel=R.findIndex(r=>r[0]==='empower'&&r[1]==='fireball');s.menuKey('ok')});ok('empower_to_tier1',await S(()=>s.sv.spLv.fireball===4&&spTierOf(4)===1));
if(SHOTS)await pg.screenshot({path:'screenshots/spells/merchant.png'});
await S(()=>{s.menu=null});
// pause -> Tab -> inventory spell slots, world frozen, back resumes
await K('Escape');ok('paused',await S(()=>s.paused));if(SHOTS)await pg.screenshot({path:'screenshots/spells/pause_row.png'});
await K('Tab');ok('pause_tab_opens_spell_slots',await S(()=>s.menu&&s.menu.mode==='inv'&&s.menu.fromPause&&s.menu.slot===8));
const x0=await S(()=>s.player.x);await pg.waitForTimeout(300);ok('world_frozen',await S(()=>s.physics.world.isPaused));
if(SHOTS)await pg.screenshot({path:'screenshots/spells/pause_equip.png'});
await K('Escape');await pg.waitForTimeout(200);ok('closes_and_resumes',await S(()=>!s.menu&&!s.physics.world.isPaused&&!s.paused),await S(()=>[!!s.menu,s.paused]));
// HUD shot
await S(()=>{s.spHud=1.2});await pg.waitForTimeout(100);if(SHOTS)await pg.screenshot({path:'screenshots/spells/hud.png'});
// drops: boss gives its spell + shards
const d=await S(()=>{const sh=s.sv.shards;const k=Object.keys(SP_BOSS)[0];const id=SP_BOSS[k];s.sv.spells=s.sv.spells.filter(x=>x!==id);try{s.finishBoss({kind:k,x:s.player.x,y:s.player.y})}catch(e){}return{k,id,learned:s.sv.spells.includes(id),sh:s.sv.shards-sh}});
ok('boss_drop',d.learned&&d.sh>=2,d);
// sorcerer class: sorc spells usable at low INT
await boot('sorcerer');ok('sorcerer_class_unlocked',await S(()=>{s.sv.stats.int=10;return!s.spLocked('meteor')}));
ok('no_page_errors',errs.length===0,errs);
console.log(JSON.stringify({pass,fail}));await br.close();process.exit(fail?1:0);
