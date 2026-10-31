// Bell Tower enemies on Artist's strips, in the current Bell Tower stage.
import { chromium } from './node_modules/playwright/index.mjs';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`;let pass=0,fail=0;const ok=(n,c,d)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(d)))};
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});const pg=await br.newPage({viewport:{width:960,height:540}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
const S=(f,a)=>pg.evaluate(f,a);
await pg.goto(B+'assets/README.md');await S(()=>localStorage.clear());await pg.goto(B+'?play&mute&novideo&slot=1&class=knight&stage=belltower');
await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await pg.waitForTimeout(1500);await S(()=>{window.s=__G.scene.getScene('stage');s.msg=null});
const ks=await S(()=>s.enemies.map(e=>e.k));ok('stage_uses_bt_kinds',['bellbats','clapper','ringer'].every(k=>ks.includes(k))&&!ks.includes('chorister')&&!ks.includes('sentinel'),ks);
ok('textures_loaded',await S(()=>['bt_bats','bt_clapper','bt_ringer'].every(t=>s.textures.exists(t)&&s.textures.get(t).frameTotal>30)));
// show each one next to the hero for a shot
for(const k of['clapper','bellbats','ringer']){await S(k=>{const e=s.enemies.find(e=>e.k===k&&!e.dead);s.pb.setPosition(e.b.x-70,e.b.y-20);s.pb.setVelocity(0,0)},k);await pg.waitForTimeout(900);
 ok(k+'_sprite_drawn',await S(k=>{const e=s.enemies.find(e=>e.k===k&&!e.dead);return !!(e.spr&&e.spr.visible&&e.spr.texture.key.startsWith('bt_'))},k));await pg.screenshot({path:`screenshots/btenemies/${k}.png`})}
// ringer swing_drop spawns 5 icicles that fall and can hurt
const ic=await S(async()=>{const e=s.enemies.find(e=>e.k==='ringer'&&!e.dead);s.pb.setPosition(e.b.x-30,e.b.body.bottom-14);s.pb.setVelocity(0,0);e.dropCd=0;s.player.inv=0;const n0=s.stats.icicles||0;
 let saw=0;for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,50));if(e.anN==='swing_drop')saw=1}return{n:(s.stats.icicles||0)-n0,saw,frame:e.spr.frame.name}});
ok('ringer_swing_drop_icicles',ic.saw&&ic.n===5,ic);await pg.screenshot({path:'screenshots/btenemies/ringer_icicles.png'});
await pg.waitForTimeout(1500);ok('icicles_land',await S(()=>(s.icicles||[]).length===0));
// bats split when you roll into them
const sp=await S(async()=>{const e=s.enemies.find(e=>e.k==='bellbats'&&!e.dead);s.pb.setPosition(e.b.x-20,e.b.y);await new Promise(r=>setTimeout(r,400));let ok=0;for(let i=0;i<10&&!ok;i++){s.player.state='roll';await new Promise(r=>setTimeout(r,30));ok=e.splitT>0}return{ok,parked:e.parked,dx:Math.round(s.player.x-e.b.x),st:s.player.state}});ok('bats_split_on_roll',sp&&sp.ok,sp);
// kill: death strip plays then sprite hides
const dd=await S(async()=>{const e=s.enemies.find(e=>e.k==='clapper'&&!e.dead);s.pb.setPosition(e.b.x-70,e.b.y-20);e.hp=0;try{s.hitEnemy(e,99,1)}catch(x){e.dead=true;e.deadT=0}await new Promise(r=>setTimeout(r,250));const mid=e.anN;await new Promise(r=>setTimeout(r,1200));return{mid,dead:e.dead,vis:e.spr.visible}});
ok('death_strip_then_hidden',dd.dead&&dd.mid==='death'&&!dd.vis,dd);
ok('no_page_errors',errs.length===0,errs);console.log(JSON.stringify({pass,fail}));await br.close();process.exit(fail?1:0);
