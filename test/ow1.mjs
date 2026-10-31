// OW1: room engine (Ramparts in rooms, 150 ms slides, parked enemies + roomState), v2 save + v1 migration, lazy PeerJS, perf marks.
import { chromium } from './node_modules/playwright/index.mjs';import fs from 'fs';import vm from 'vm';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`;let pass=0,fail=0;const ok=(n,c,d)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(d)))};
const CLIP=process.env.CLIP;
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const ctx=await br.newContext({viewport:{width:960,height:540},...(CLIP?{recordVideo:{dir:'/tmp/ow1vid',size:{width:960,height:540}}}:{})});const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
const S=(f,a)=>pg.evaluate(f,a);const W8=ms=>pg.waitForTimeout(ms);
const ready=async()=>{await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await W8(900);await S(()=>{window.s=__G.scene.getScene('stage');s.msg=null})};
// ---- boot: instant title, perf marks, lazy PeerJS ----
await pg.goto(B+'assets/README.md');await S(()=>localStorage.clear());
await pg.goto(B+'?mute');const bootEl=await S(()=>!!document.getElementById('boot'));
await pg.waitForFunction(()=>performance.getEntriesByName('title-ready').length,null,{timeout:20000});
const perf=await S(()=>{const m=n=>Math.round((performance.getEntriesByName(n)[0]||{}).startTime||-1);return{boot:m('boot'),title:m('title-ready'),peer:typeof Peer,bootGone:!document.getElementById('boot')}});
ok('instant_html_title_then_handoff',bootEl&&perf.bootGone,{bootEl,perf});ok('title_ready_under_1s_localhost',perf.title>0&&perf.title<1000,perf);ok('peerjs_not_loaded_at_boot',perf.peer==='undefined',perf);
ok('peerjs_loads_on_demand',await S(async()=>{await loadPeer();return typeof Peer==='function'}));
// ---- Ramparts in rooms ----
await pg.goto(B+'?play&mute&slot=1&class=knight&stage=ramparts');await ready();
const R=await S(()=>({n:s.rooms.length,ids:s.rooms.map(r=>r.id),room:s.room.id,b:s.cam.getBounds?{x:s.cam._bounds.x,w:s.cam._bounds.width}:null,region:performance.getEntriesByName('region-ready').length}));
ok('ramparts_split_into_rooms',R.n>=6&&R.ids[0]==='ramparts.r1',R);ok('camera_bounded_to_room',R.b&&R.b.w<=740,R);ok('region_ready_mark',R.region>0);
await pg.screenshot({path:'screenshots/ow1/room_start.png'});
// walk right across a room edge: one 150 ms slide, no restart
const sw=await S(async()=>{const r=s.room;s.enemies.forEach(e=>{if(e.b.x<r.x1+200){e.dead=true;e.b.body.enable=false}});s.pb.setPosition(r.x1-30,s.pb.y);s.player.inv=999;const sc=s.scene.isActive(),n0=s.roomSwaps,t0=performance.now();
 window.__inp=()=>({r:1});let tSwap=0,tDone=0,mid=null;for(let i=0;i<80;i++){await new Promise(r=>setTimeout(r,16));if(!tSwap&&s.roomSwaps>n0)tSwap=performance.now();if(tSwap&&s.roomSlide&&!mid)mid=s.cam.scrollX;if(tSwap&&!s.roomSlide&&!tDone)tDone=performance.now()}window.__inp=null;
 return{swaps:s.roomSwaps-n0,room:s.room.id,dur:Math.round(tDone-tSwap),mid,same:sc&&s.scene.isActive(),bx:s.cam._bounds.x,r1:s.room.x0}});
ok('room_slide_150ms',sw.swaps===1&&sw.dur>=100&&sw.dur<=450&&sw.mid!=null,sw);ok('slide_locks_to_next_room',sw.bx===sw.r1&&sw.same,sw);
await pg.screenshot({path:'screenshots/ow1/room_after_slide.png'});
// parked enemies keep their state (roomState) and wake when you come back
const pk=await S(async()=>{const e=s.enemies.find(e=>!e.dead&&e.b.x>s.room.x1+100);const hp=e.hp=e.hp-1;const rr=s.rooms.find(r=>e.b.x>=r.x0&&e.b.x<r.x1);
 const park=!!e.parked&&!e.b.body.enable;s.pb.setPosition(e.b.x-40,e.b.y);await new Promise(r=>setTimeout(r,500));const wake=!e.parked&&e.b.body.enable&&e.hp===hp;
 s.pb.setPosition(s.rooms[0].x0+200,s.pb.y);await new Promise(r=>setTimeout(r,500));return{park,wake,again:!!e.parked,rs:!!(s.roomState[rr.id]&&s.roomState[rr.id].enemies)}});
ok('enemies_parked_outside_room',pk.park&&pk.again,pk);ok('room_state_persists_on_return',pk.wake&&pk.rs,pk);
// vertical scroll inside a room
const vy=await S(async()=>{const y0=s.cam.scrollY;s.pb.setPosition(s.pb.x,-120);s.pb.setVelocity(0,0);await new Promise(r=>setTimeout(r,800));return{y0,y1:s.cam.scrollY}});
ok('vertical_scroll_in_room',vy.y1<vy.y0-40,vy);
// save v2 tracks room + visited
const sv=await S(()=>{Save.write(s.sv);return JSON.parse(localStorage.getItem(Save.key()))});
ok('save_v2_fields',sv.v===2&&sv.room&&sv.region==='ramparts'&&Object.keys(sv.rooms.visited).length>=2&&Array.isArray(sv.bonfires)&&Array.isArray(sv.abilities)&&Array.isArray(sv.mapsOwned)&&Array.isArray(sv.doors),sv&&{v:sv.v,room:sv.room,vis:sv.rooms&&sv.rooms.visited});
// ---- migration: each of the 10 stages + NG+ ----
const mig=await S(()=>{const out={};const lordOrder=['warden','cantor','king','toller','smith','abbess','marshal','astronomer','prioress','heir'];
 const stages=['ramparts','cathedral','cinderdeep','belltower','catacomb','drowned','keep','spire','cloister','throne'];
 stages.forEach((st,i)=>{localStorage.clear();const v1={cls:'knight',stage:st,bonfire:true,souls:100+i,bossDown:false,lords:lordOrder.slice(0,i),inv:['longsword'],eq:{main:'longsword'},stain:{x:900,y:156,souls:50},ng:0};const s1=JSON.stringify(v1);
  localStorage.setItem('ashenVigil.save.v1.s3',s1);const d=Save.load(2);const raw=localStorage.getItem('ashenVigil.save.v1.s3');
  out[st]={v:d.v,region:d.region,room:d.room,inRegion:d.room.startsWith(st+'.'),bon:d.bonfires.length,ab:d.abilities.slice(),souls:d.souls===100+i,lords:d.lords.length===i,stain:d.stain.room,v1kept:raw===s1,v2:!!localStorage.getItem('ashenVigil.save.v2.s3')}});
 localStorage.clear();localStorage.setItem('ashenVigil.save.v1.s3',JSON.stringify({cls:'knight',stage:'ramparts',ng:1,lords:lordOrder,bossDown:true,bonfire:true,souls:5}));const n=Save.load(2);
 out.ngplus={ng:n.ng,ab:n.abilities.length,visited:Object.keys(n.rooms.visited).length,bon:n.bonfires.length};
 // a second load reads v2 (no re-migration); the game's writes don't touch v1
 n.souls=777;Save.use(2);Save.write(n);out.reload=Save.load(2).souls===777&&JSON.parse(localStorage.getItem('ashenVigil.save.v1.s3')).souls===5;Save.use(0);return out});
const bad=Object.entries(mig).filter(([k,d])=>k.length>6&&k!=='ngplus'&&k!=='reload'||['ramparts','keep','spire','throne'].includes(k)).filter(([k,d])=>!(d.v===2&&d.inRegion&&d.bon>=1&&d.souls&&d.lords&&d.v1kept&&d.v2&&d.stain));
ok('migrate_each_of_10_stages',bad.length===0&&Object.keys(mig).length===12,bad);
ok('migrate_lords_grant_abilities',mig.throne.ab.length===6&&mig.cathedral.ab.join()==='dash',{t:mig.throne.ab,c:mig.cathedral.ab});
ok('migrate_ngplus',mig.ngplus.ng===1&&mig.ngplus.ab===6&&mig.ngplus.visited>40&&mig.ngplus.bon>=10,mig.ngplus);
ok('v1_backup_untouched_v2_reloads',mig.reload,mig.reload);
// ---- clip: walk Ramparts room to room ----
if(CLIP){await pg.goto(B+'?play&mute&slot=1&class=knight&stage=ramparts');await ready();await S(()=>{s.player.inv=1e9;s.player.hp=s.player.hpMax=9999;s.pb.setPosition(300,140);let t=0;window.__inp=()=>(t++,{r:1,jump:t%70<10})});await W8(9000);await S(()=>{window.__inp=null})}
ok('no_page_errors',errs.length===0,errs);console.log(JSON.stringify({pass,fail}));
const v=CLIP?pg.video():null;await ctx.close();if(v){await v.saveAs('/tmp/ow1.webm')}await br.close();process.exit(fail?1:0);
