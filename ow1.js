// ASHEN VIGIL — OW1: room engine, v2 save with v1 migration, lazy PeerJS, perf marks (openworld_plan.md §3-5).
// Rooms: every region (stage strip) is cut into rooms of 1-4 screens. The camera smooth-follows across the whole region (no room
// snaps or slides); enemies outside the current room are parked (no body, no AI) and their
// state lives in roomState, so a room you leave is exactly as you left it. Vertical scrolling inside a room is kept.
'use strict';
const ROOM_SLIDE=.15;
// hand cuts (Ramparts is the OW1 deliverable); other regions are auto-cut until OW2 draws their room graphs
const ROOM_CUTS={ramparts:[0,560,1240,1820,2380,2860]};
function roomCuts(sid){const D=STAGE_DEFS[sid];if(!D||D.hub)return[0];if(ROOM_CUTS[sid])return ROOM_CUTS[sid];
 const AL=D.arena?D.arena[0]:2980,end=AL-120,c=[0];const n=Math.max(1,Math.round(end/720));for(let i=1;i<n;i++)c.push(Math.round(end*i/n/20)*20);c.push(end);return c}
function roomList(sid){const D=STAGE_DEFS[sid],c=roomCuts(sid),Wd=D?D.world:3360;return c.map((x0,i)=>({id:sid+'.r'+(i+1),i,x0,x1:i+1<c.length?c[i+1]:Wd,top:D?D.top:-204,bottom:D?D.bottom:364,arena:!!(D&&D.boss)&&i===c.length-1}))}
function roomAt(sid,x){const L=roomList(sid);for(const r of L)if(x<r.x1)return r;return L[L.length-1]}
// ---------- saves: schema v2 ----------
const LORD_ABILITY={warden:'dash',cantor:'cling',abbess:'tide',marshal:'djump',astronomer:'grapple',prioress:'thorn'};
const slotKey2=i=>i?'ashenVigil.save.v2.s'+(i+1):'ashenVigil.save.v2';
const hashS=s=>{let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return h};
function saveV2(d){if(!d)return d;d.v=2;const st=STAGE_DEFS[d.stage]?d.stage:'ramparts';d.region=d.region||st;
 if(!d.room){const D=STAGE_DEFS[st];d.room=roomAt(st,(D&&D.bonfire)||0).id}
 d.bonfires=d.bonfires||[];d.doors=d.doors||[];d.rooms=d.rooms||{visited:{}};d.rooms.visited=d.rooms.visited||{};d.abilities=d.abilities||[];d.mapsOwned=d.mapsOwned||[];return d}
function migrateV1(v1){const d=saveV2(JSON.parse(JSON.stringify(v1)));const st=d.region;
 d.room=roomAt(st,(STAGE_DEFS[st]&&STAGE_DEFS[st].bonfire)||0).id;
 if(v1.bonfire)d.bonfires.push({region:st,room:d.room});
 for(const k of v1.lords||[]){const a=LORD_ABILITY[k];if(a&&!d.abilities.includes(a))d.abilities.push(a);
  const sid=Object.keys(STAGE_DEFS).find(s=>STAGE_DEFS[s].boss&&STAGE_DEFS[s].boss.kind===k);
  if(sid){for(const r of roomList(sid))d.rooms.visited[r.id]=1;if(!d.bonfires.some(b=>b.region===sid))d.bonfires.push({region:sid,room:roomAt(sid,STAGE_DEFS[sid].bonfire||0).id})}}
 if(d.stain&&d.stain.x!=null)d.stain.room=roomAt(d.stain.stage||st,d.stain.x).id;
 d.migratedFrom=1;return d}
Object.assign(Save,{
 key(){return slotKey2(this.slot)},
 load(i=this.slot){try{const s1=localStorage.getItem(slotKey(i)),s2=localStorage.getItem(slotKey2(i));let d=s2?JSON.parse(s2):null;
   // v1 present and not yet migrated (or replaced since): migrate it; the v1 key itself is never touched
   if(s1&&!d){// r15: v1 migrates only when there is no v2 at all; once any v2 exists, v1 (an old tab) is ignored
   // r14: once v2 exists from a migration, later v1 writes (an old tab) are ignored
   d=migrateV1(JSON.parse(s1));d.fromV1=hashS(s1);localStorage.setItem(slotKey2(i),JSON.stringify(d));return d}
   return d?saveV2(d):null}catch(e){return null}},
 write(d){try{localStorage.setItem(this.key(),JSON.stringify(saveV2(d)))}catch(e){}},
 clear(i=this.slot){localStorage.removeItem(slotKey2(i));localStorage.removeItem(slotKey(i))}});
// ---------- lazy PeerJS: only when co-op is chosen ----------
const loadPeer=()=>window.__peerP||(window.__peerP=typeof Peer!=='undefined'?Promise.resolve():new Promise((res,rej)=>{const s=document.createElement('script');s.src='vendor/peerjs.min.js';s.onload=()=>{performance.mark('peer-ready');res()};s.onerror=rej;document.head.appendChild(s)}));
window.loadPeer=loadPeer;
if(typeof NET!=='undefined'){const sh=NET.startHost.bind(NET),sj=NET.startJoin.bind(NET);
 NET.startHost=function(code){if(typeof Peer!=='undefined')return sh(code);this.status='OPENING ROOM';loadPeer().then(()=>sh(code),()=>{this.err='PEERJS MISSING';this.status='ROOM ERROR: PEERJS MISSING'})};
 NET.startJoin=function(code,cb){if(typeof Peer!=='undefined')return sj(code,cb);this.status='CONNECTING TO '+String(code).toUpperCase();loadPeer().then(()=>sj(code,cb),()=>cb&&cb('PEERJS MISSING'))}}
// ---------- perf marks + instant title hand-off ----------
(()=>{const tc=Title.prototype.create;Title.prototype.create=function(...a){const r=tc.apply(this,a);this.events.once('postupdate',()=>{performance.mark('title-ready');const el=document.getElementById('boot');if(el)el.remove()});return r}})();
// ---------- the room engine ----------
(()=>{const SP=Stage.prototype;
 const cr=SP.create;SP.create=function(...a){const r=cr.apply(this,a);try{this.roomsInit()}catch(e){console.warn('rooms',e)}performance.mark('region-ready');{const el=document.getElementById('boot');if(el)el.remove()}return r};
 SP.roomsInit=function(){const cam=this.cam;if(cam&&!cam.__glide){cam.__glide=1;const sf=cam.startFollow;cam.startFollow=function(...a){const x=this.scrollX,y=this.scrollY,r=sf.apply(this,a);this.scrollX=x;this.scrollY=y;return r}}/* Phaser's startFollow jumps to the target; keep the scroll so the .12 lerp glides there (intro end/skip, no snap) */this.rooms=roomList(this.sid);this.roomState=this.roomState||{};this.roomSwaps=0;this.roomSlide=null;const r=roomAt(this.sid,this.player.x);this.room=null;this.enterRoom(r,true)};
 // camera: continuous smooth follow over the whole region (pre-OW1 behaviour, Justin); rooms only drive parking/state, never the camera
 SP.roomBounds=function(r){const D=this.def||{};this.cam.setBounds(0,D.top!=null?D.top:r.top,WORLD,(D.bottom!=null?D.bottom:r.bottom)-(D.top!=null?D.top:r.top))};
 // enemies belong to the room they stand in when you leave it; parked ones keep hp/dead/pos in roomState
 SP.parkEnemies=function(r){if(NET.guest()||(NET.linked&&NET.linked())){for(const e of this.enemies)if(e.parked){e.parked=0;e.b.body.enable=!e.dead}return}// co-op: partners may be in different rooms until OW7's room following
 const P=this.player,AGG=['idle','patrol','sleep','walk',undefined];
 for(const e of this.enemies){const inR=e.b.x>=r.x0-8&&e.b.x<r.x1+8;
  // r14: never park a chaser or anything near the hero - only enemies more than a screen away and not aggroed
  const far=!P||Math.abs(e.b.x-P.x)>W+40||Math.abs(e.b.y-P.y)>H,calm=AGG.includes(e.state)&&!(e.swing);
  if(!inR&&!e.parked&&!e.dead&&far&&calm){e.parked=1;e.room=roomAt(this.sid,e.b.x).id;e.b.body.enable=false;e.b.setVelocity(0,0);if(e.spr)e.spr.setVisible(false);
   const RS=this.roomState[e.room]=this.roomState[e.room]||{};(RS.enemies=RS.enemies||{})[this.enemies.indexOf(e)]={hp:e.hp,x:Math.round(e.b.x),y:Math.round(e.b.y)}}
  else if(e.parked&&(inR||!far)){e.parked=0;e.b.body.enable=true;e.state='idle'}}
  for(const e of this.enemies)if(e.dead){const id=roomAt(this.sid,e.x0).id;const RS=this.roomState[id]=this.roomState[id]||{};(RS.dead=RS.dead||{})[this.enemies.indexOf(e)]=1}};
 SP.enterRoom=function(r,instant){const prev=this.room;this.room=r;this.parkEnemies(r);const sv=this.sv;if(sv){saveV2(sv);sv.region=this.sid;sv.room=r.id;sv.rooms.visited[r.id]=1}
  if(instant||!prev){this.roomBounds(r);return}
  this.roomSwaps++;performance.mark('room-swap');this.roomBounds(r);
  if(NET.host())NET.send({t:'room',id:r.id})};
 SP.roomStep=function(dt){if(!this.rooms||this.cine||this.bossState==='fight')return;const S=this.roomSlide;
  if(S)this.roomSlide=null;
  const P=this.player,r=this.room;if(r&&!(NET.linked&&NET.linked())){this.parkT=(this.parkT||0)-dt;if(this.parkT<=0){this.parkT=.5;this.parkEnemies(r)}}if(!r||P.x>=r.x0&&P.x<r.x1)return;this.enterRoom(roomAt(this.sid,P.x))};
 const up=SP.update;SP.update=function(t,dms){const r=up.call(this,t,dms);if(this.player&&this.rooms&&NET.linked&&NET.linked()&&this.enemies.some(e=>e.parked))this.parkEnemies(this.room);if(this.arenaX0!=null&&this.cam){const b=this.cam._bounds;if(b.x<this.arenaX0){const nx=Math.min(this.arenaX0,Math.floor(this.cam.scrollX));if(nx>b.x)this.cam.setBounds(nx,b.y,WORLD-nx,b.height)}}/* arena lock tightens only behind the camera: never a snap */if(this.player&&this.rooms)this.roomStep(Math.min(.05,(dms||16)/1000));return r};
 // parked enemies sit out the AI and the draw
 const ue=SP.updateEnemies;SP.updateEnemies=function(dt){if(!this.enemies.some(e=>e.parked))return ue.call(this,dt);const all=this.enemies;this.enemies=all.filter(e=>!e.parked);try{return ue.call(this,dt)}finally{const act=this.enemies;this.enemies=all;for(const e of act)if(!all.includes(e))all.push(e)}};
 const de=SP.drawEnemy;SP.drawEnemy=function(g,ga,e){if(e.parked)return;return de.call(this,g,ga,e)};
 // the boss fight / cine pan needs the arena room: unlock to it when the intro starts
 const sc=SP.startCine;SP.startCine=function(...a){const L=this.rooms&&this.rooms[this.rooms.length-1];if(L){this.roomSlide=null;this.room=L;this.arenaX0=L.x0;const x0=Math.max(0,Math.min(L.x0,Math.floor(this.cam.scrollX)));this.cam.setBounds(x0,L.top,WORLD-x0,L.bottom-L.top)}return sc.apply(this,a)};
})();
if(typeof module!=='undefined')module.exports={roomList,roomAt,migrateV1,saveV2,LORD_ABILITY};
