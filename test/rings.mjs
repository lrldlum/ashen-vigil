// Rings (real effects, 2 slots, sources) + in-level merchants (Artist's sprite, stock, buying with souls).
import { chromium } from './node_modules/playwright/index.mjs';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`;let pass=0,fail=0;const ok=(n,c,d)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(d)))};
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});const pg=await br.newPage({viewport:{width:960,height:540}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
const S=(f,a)=>pg.evaluate(f,a);const ready=async()=>{await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await pg.waitForTimeout(1200);await S(()=>{window.s=__G.scene.getScene('stage');s.msg=null;s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false})})};
await pg.goto(B+'assets/README.md');await S(()=>localStorage.clear());await pg.goto(B+'?play&mute&slot=1&class=knight&stage=ramparts');await ready();
// effects through the real derive
const eff=await S(()=>{const sv=s.sv,b0=RPG.derive(sv.stats,{...sv.eq,ring1:null,ring2:null});const t=k=>RPG.derive(sv.stats,{...sv.eq,ring1:k,ring2:null});
 return{hp:t('ember_signet').hp/b0.hp,abs:t('rime_band').abs-b0.abs,fp:t('choir_ring').fp-b0.fp,st:t('tide_loop').st-b0.st,ar:t('thorn_ring').ar/b0.ar,soul:t('ashen_band').soulMul-b0.soulMul,ifr:t('star_seal').roll.i1-b0.roll.i1,poise:t('bell_ring').poise-b0.poise,two:RPG.derive(sv.stats,{...sv.eq,ring1:'ember_signet',ring2:'thorn_ring'})}});
ok('ring_effects_real',eff.hp>1.14&&eff.abs>.07&&eff.fp===30&&eff.st===25&&eff.ar>1.11&&eff.soul>.14&&eff.ifr>.04&&eff.poise===8,eff);
ok('two_rings_stack',eff.two.hp>0&&eff.two.ar>0);
ok('ring_textures_loaded',await S(()=>Object.keys(RING_ART).every(k=>s.textures.exists('ring_'+k))));
// merchant in the level
ok('merchant_in_level',await S(()=>!!(s.merch&&s.merch.sp&&s.merch.sp.anims.isPlaying)));
await S(()=>{const M=s.merch;s.pb.setPosition(M.x-8,M.y-10);s.pb.setVelocity(0,0)});await pg.waitForTimeout(700);
ok('trade_prompt',await S(()=>s.interactHint())==='Trade',await S(()=>s.interactHint()));
await pg.screenshot({path:'screenshots/rings/merchant_in_level.png'});
await pg.keyboard.press('e');await pg.waitForTimeout(300);ok('merchant_menu_opens',await S(()=>s.menu&&s.menu.mode==='lmerch'));
await S(()=>{s.souls=99999;const R=s.merchRows();s.menu.sel=R.findIndex(r=>r[0]==='ember_signet')});await pg.waitForTimeout(150);await pg.screenshot({path:'screenshots/rings/merchant_menu.png'});
await pg.keyboard.press('Enter');await pg.waitForTimeout(200);ok('buy_ring',await S(()=>s.sv.inv.includes('ember_signet')&&JSON.parse(localStorage.getItem(Save.key())).inv.includes('ember_signet')));
const hp0=await S(()=>{s.player.hp=10;const R=s.merchRows();s.menu.sel=R.findIndex(r=>r[0]==='ember');return s.player.hp});await pg.keyboard.press('Enter');await pg.waitForTimeout(200);ok('buy_consumable_used',await S(()=>s.player.hp)>hp0);
const sh0=await S(()=>{const R=s.merchRows();s.menu.sel=R.findIndex(r=>r[0]==='shard');return s.sv.embers||0});await pg.keyboard.press('Enter');await pg.waitForTimeout(200);ok('buy_ember_shard',await S(()=>s.sv.embers)===sh0+1);
await pg.keyboard.press('Escape');await pg.waitForTimeout(200);ok('merchant_closes',await S(()=>!s.menu));
// equip in the inventory: icon from Artist art, effect applied
await S(()=>{s.menu={mode:'main',sel:s.mainOpts().indexOf('EQUIPMENT')};s.menuKey('ok')});const hpa=await S(()=>s.build.hp);await S(()=>s.invEquip('ring1','ember_signet'));await pg.waitForTimeout(300);
ok('equip_ring_raises_hp',await S(()=>s.sv.eq.ring1==='ember_signet'&&s.build.hp>0)&&await S(()=>s.build.hp)>hpa,[hpa,await S(()=>s.build.hp)]);
ok('ring_icon_drawn_from_art',await S(()=>s.ringPool&&s.ringPool.some(i=>i.visible&&i.texture.key==='ring_ember_signet')));
await pg.screenshot({path:'screenshots/rings/inventory_ring.png'});await S(()=>{s.menu=null});
// sources: lord ring, chest ring
const lord=await S(()=>{s.sv.inv=s.sv.inv.filter(x=>x!=='choir_ring');try{s.finishBoss({kind:'cantor',x:s.player.x,y:s.player.y})}catch(e){}return s.sv.inv.includes('choir_ring')});ok('lord_gives_ring',lord);
ok('chest_rings_placed',await S(()=>Object.entries(RING_CHEST).every(([sid,m])=>Object.keys(m).every(id=>(CHESTS[sid]||[]).some(c=>c.id===id)))));
ok('no_page_errors',errs.length===0,errs);
console.log(JSON.stringify({pass,fail}));await br.close();process.exit(fail?1:0);
