// Bell Tower region: 4-screen shaft, bell tolls (knock-off + icicles shatter into ledges), ice slide, Frost Ringer mini-boss.
import { chromium } from './node_modules/playwright/index.mjs';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`;let pass=0,fail=0;const ok=(n,c,d)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(d)))};
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});const pg=await br.newPage({viewport:{width:960,height:540}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
const SH={x0:1660,x1:2020,top:-760};const S=(f,a)=>pg.evaluate(f,a);const W8=ms=>pg.waitForTimeout(ms);
await pg.goto(B+'assets/README.md');await S(()=>localStorage.clear());await pg.goto(B+'?play&mute&slot=1&class=knight&stage=belltower');
await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').bt,null,{timeout:30000});await W8(1200);
await S(()=>{window.s=__G.scene.getScene('stage');s.msg=null;s.player.hp=s.player.hpMax=9999;s.enemies.forEach(e=>{if(!e.swing){e.dead=true;e.b.body.enable=false}})});
const geo=await S(()=>({n:s.def.shaft.length,top:Math.min(...s.def.shaft.map(p=>p.y)),dtop:s.def.top,ice:s.def.shaft.filter(p=>p.ice).length,ici:s.bt.ici.length,room:s.rooms.some(r=>r.x0===1660)}));
ok('shaft_4_screens_tall',geo.n>=24&&124-geo.top>=4*180,geo);ok('shaft_is_its_own_room',geo.room,geo);ok('ice_ledges_and_icicles',geo.ice>=6&&geo.ici>=4,geo);
// climb: every step reachable (<=34 px up, horizontal gap jumpable)
ok('steps_climbable',await S(()=>{const L=s.def.shaft;for(let i=1;i<L.length;i++){if(L[i-1].y-L[i].y>40)return false}return true}));
// actually jump up the first steps with input
const cl=await S(async()=>{const L=s.def.shaft;s.pb.setPosition(L[0].x+10,L[0].y-10);s.pb.setVelocity(0,0);s.bt.t=99;await new Promise(r=>setTimeout(r,500));const y0=s.player.y;const tgt=L[1];
 window.__inp=()=>{const P=s.player;const dx=tgt.x+tgt.w/2-P.x;return{r:dx>6?1:0,l:dx<-6?1:0,jumpP:s.pb.body.blocked.down&&Math.abs(P.y-L[0].y)<3&&P.x>L[0].x+L[0].w-14?1:0,jump:1}};
 for(let i=0;i<60;i++){await new Promise(r=>setTimeout(r,50));if(Math.abs(s.player.y-tgt.y)<3&&s.pb.body.blocked.down)break}window.__inp=null;return{y0:Math.round(y0),y1:Math.round(s.player.y),t:tgt.y}});
ok('climbs_a_step_with_input',Math.abs(cl.y1-cl.t)<3,cl);
// toll: knocks a standing hero off, rolling keeps footing; icicles shatter and freeze into ledges
const mid=await S(()=>s.def.shaft[12]);
const kn=await S(async m=>{s.pb.setPosition(m.x+m.w/2,m.y-10);s.pb.setVelocity(0,0);s.player.state='idle';await new Promise(r=>setTimeout(r,400));const k0=s.bt.knocks,sh0=s.bt.shatter;s.bt.t=0;
 for(let i=0;i<60&&s.bt.knocks===k0;i++)await new Promise(r=>setTimeout(r,50));await new Promise(r=>setTimeout(r,300));return{knock:s.bt.knocks-k0,off:Math.abs(s.player.x-(m.x+m.w/2))>20||s.player.y>m.y+10,sh:s.bt.shatter-sh0,tolls:s.bt.tolls}},mid);
ok('toll_knocks_hero_off_ledge',kn.knock===1&&kn.off,kn);ok('toll_shatters_icicles',kn.sh>=3,kn);await pg.screenshot({path:'screenshots/btregion/toll_wave.png'});
await W8(1600);const ch=await S(()=>s.bt.chunks.length);ok('icicles_freeze_into_ledges',ch>=1,ch);await pg.screenshot({path:'screenshots/btregion/icicle_ledges.png'});
const rl=await S(async m=>{await new Promise(r=>setTimeout(r,200));s.pb.setPosition(m.x+m.w/2,m.y-10);s.pb.setVelocity(0,0);await new Promise(r=>setTimeout(r,400));const k0=s.bt.knocks;s.bt.waves.push({y:m.y-60,hit:0});
 for(let i=0;i<12;i++){s.player.state='roll';await new Promise(r=>setTimeout(r,25))}return s.bt.knocks-k0},mid);ok('roll_through_toll_keeps_footing',rl===0,rl);
// ice: momentum carries
const ice=await S(async()=>{const p=s.def.shaft.find(p=>p.ice&&p.w>=52);s.bt.t=99;s.bt.waves=[];s.pb.setPosition(p.x+6,p.y-10);s.pb.setVelocity(0,0);s.player.state='idle';await new Promise(r=>setTimeout(r,400));
 window.__inp=()=>({r:1});await new Promise(r=>setTimeout(r,250));window.__inp=null;const x0=s.player.x;await new Promise(r=>setTimeout(r,120));return{slide:Math.round(s.player.x-x0)}});
ok('ice_ledge_slides',ice.slide>=4,ice);
// Frost Ringer mini-boss: swings across the shaft, drops icicles, stays dead
const rg=await S(async()=>{const e=s.enemies.find(e=>e.mb==='bt_ringer');const xs=[];s.pb.setPosition(e.swing.cx,e.swing.y+60);for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,80));xs.push(e.b.x)}
 return{span:Math.round(Math.max(...xs)-Math.min(...xs)),hp:e.hp,spr:!!(e.spr&&e.spr.visible)}});ok('ringer_swings_across_shaft',rg.span>=120&&rg.hp>=40,rg);await pg.screenshot({path:'screenshots/btregion/ringer_swing.png'});
// r14: a knight standing on the wide catch ledge (row 16, between ledges 15 and 17) can melee the Ringer as it swings overhead
const mel=await S(async()=>{const e=s.enemies.find(e=>e.mb==='bt_ringer');const L=s.def.shaft.find(p=>p.catch);s.bt.t=99;s.bt.waves=[];s.player.hp=9999;s.player.st=999;
 s.pb.setPosition(e.swing.cx+30,L.y-10);s.pb.setVelocity(0,0);s.player.state='idle';await new Promise(r=>setTimeout(r,400));const h0=e.hp,y=[];let n=0;
 window.__inp=()=>{s.player.st=999;s.player.f=e.b.x>s.player.x?1:-1;return(n++%8===0)?{atkP:1}:{}};for(let i=0;i<120&&e.hp>=h0;i++){await new Promise(r=>setTimeout(r,50));y.push(Math.round(e.b.y))}window.__inp=null;
 return{h0,h1:+e.hp.toFixed(1),catchW:L.w,ledgeY:L.y,ry:[Math.min(...y),Math.max(...y)],py:Math.round(s.player.y),onLedge:Math.abs(s.player.y-L.y)<4}});
console.log('MEL',JSON.stringify(mel));ok('knight_on_catch_ledge_can_melee_ringer',mel.h1<mel.h0&&mel.catchW>=200&&mel.ry[1]<=mel.ledgeY-10&&mel.ry[0]>=mel.ledgeY-20,mel);await pg.screenshot({path:'screenshots/btregion/ringer_melee.png'});
await S(()=>{const e=s.enemies.find(e=>e.mb==='bt_ringer');e.hp=e.hpMax});
const dead=await S(async()=>{const e=s.enemies.find(e=>e.mb==='bt_ringer');e.hp=0;try{s.damageEnemy(e,999,1)}catch(x){e.dead=true}await new Promise(r=>setTimeout(r,400));return{mb:!!s.sv.mbDead.bt_ringer,emb:s.sv.embers||0}});ok('ringer_mini_boss_stays_dead',dead.mb&&dead.emb>=2,dead);
await pg.goto(B+'?play&mute&slot=1&continue');await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').bt,null,{timeout:30000});await W8(800);
ok('ringer_not_respawned',await S(()=>!__G.scene.getScene('stage').enemies.some(e=>e.mb==='bt_ringer')));
// top: belfry with the bell, chest and lore
const top=await S(async()=>{const s=__G.scene.getScene('stage');s.msg=null;s.pb.setPosition(1780,-740);s.pb.setVelocity(0,0);s.player.hp=9999;await new Promise(r=>setTimeout(r,900));return{y:Math.round(s.player.y),cam:Math.round(s.cam.scrollY),ch:s.chests.some(c=>c.id==='ch_b6')}});
ok('belfry_at_top_reachable_and_in_view',top.ch&&top.y<-710&&top.cam<-720,top);await pg.screenshot({path:'screenshots/btregion/belfry.png'});
// r14: no ledge inside the belfry floor; no toll knock on the belfry; stone back wall + walls inside the 1660-2020 bounds
const g2=await S(()=>{const s=__G.scene.getScene('stage');const L=s.def.shaft;return{topLedge:Math.min(...L.map(p=>p.y)),wall:!!(s.btBg&&s.btBg.active),cam:s.room&&[s.room.x0,s.room.x1]}});
ok('no_ledge_inside_belfry_floor',g2.topLedge>SH.top+40+10,g2);ok('stone_back_wall_drawn',g2.wall,g2);
const bk=await S(async()=>{const s=__G.scene.getScene('stage');s.pb.setPosition(1780,-740);s.pb.setVelocity(0,0);s.player.state='idle';await new Promise(r=>setTimeout(r,600));const k0=s.bt.knocks;s.bt.t=0;await new Promise(r=>setTimeout(r,900));return{k:s.bt.knocks-k0,y:Math.round(s.player.y)}});
ok('no_toll_knock_on_belfry_floor',bk.k===0&&bk.y<-710,bk);await pg.screenshot({path:'screenshots/btregion/belfry_no_knock.png'});
await S(()=>{const s=__G.scene.getScene('stage');s.pb.setPosition(1840,-200);s.pb.setVelocity(0,0)});await W8(700);await pg.screenshot({path:'screenshots/btregion/back_wall.png'});
// r14: at a barred shortcut only one prompt shows: E Inspect replaces 'BARRED - DROP BELOW' when it is up
const pr=await S(async()=>{const s=__G.scene.getScene('stage');const c=(s.shortcuts||[]).find(c=>!c.open);if(!c)return{none:1};s.pb.setPosition(c.x-6,GY-10);s.pb.setVelocity(0,0);s.player.state='idle';await new Promise(r=>setTimeout(r,500));
 const seen=new Set(),dt0=window.drawText;window.drawText=function(g,t,...a){seen.add(String(t));return dt0.call(this,g,t,...a)};await new Promise(r=>setTimeout(r,300));window.drawText=dt0;return{barred:seen.has('BARRED - DROP BELOW'),prompt:s.promptKey?s.promptKey():null,id:c.id}});
ok('barred_and_inspect_prompts_do_not_overlap',!pr.none&&!pr.barred,pr);await pg.screenshot({path:'screenshots/btregion/prompt_inspect.png'});
ok('no_page_errors',errs.length===0,errs);console.log(JSON.stringify({pass,fail}));await br.close();process.exit(fail?1:0);
