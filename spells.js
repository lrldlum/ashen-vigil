// ASHEN VIGIL — spells (DS3-style). Loaded after game.js; extends the Stage scene's prototype.
// - SPELLBOOK: fire / frost / lightning / dark / holy spells plus the six classic casts (frost spikes, storm, frost dome, heal,
//   lightning spear, blessed weapon). Every effect is drawn here in our own procedural pixel code (bold cores, hard bands,
//   additive glow); pixelfx was only a style reference.
// - Exactly 4 spell slots (sv.att.slots), shared with the visual inventory (inventory.js) and equipped at a bonfire,
//   from the inventory, or from the pause screen (Tab / I / pad X / tap).
// - Sorcerer-only spells need the Sorcerer class or INT 24+; otherwise they show locked and cannot be slotted.
// - Spells drop from bosses (one each) and chests (scrolls), the stub merchant sells some; spell shards empower +1..+10 and
//   the look changes by tier at +4 / +7 / +10 (bigger, hotter palette, then the school's apex palette).
// - Input: pad RB / LT / RT cast the selected spell, D-pad Left/Right TAP cycles (holding still walks);
//   keyboard C / K cast, Q cycles.
'use strict';
const SCHOOL={fire:{name:'FIRE',c:0xff8a2a,d:0x8a1f17},frost:{name:'FROST',c:0x9fe0ff,d:0x2a5a9a},lightning:{name:'LIGHTNING',c:0xfff08a,d:0x6a5a1a},
 dark:{name:'DARK',c:0xb070ff,d:0x2a1048},holy:{name:'HOLY',c:0xffe8a0,d:0x7a5a24}};
// kind: proj | strike | nova | chain | drain | heal | buff | shield; cat: int (catalyst) | fth (talisman) | any
const SPELLBOOK={
 fireball:{name:'FIREBALL',school:'fire',cat:'any',fp:16,req:{int:10},kind:'proj',dmg:3.2,v:200},
 flamepillar:{name:'FLAME PILLAR',school:'fire',cat:'any',fp:24,req:{int:12},kind:'strike',dmg:4.2,r:16,hitT:.25,life:.9},
 meteor:{name:'CINDER METEOR',school:'fire',cat:'int',fp:40,req:{int:16},kind:'strike',dmg:7,r:30,hitT:.45,life:1.1,far:70,sorc:1},
 icelance:{name:'ICE LANCE',school:'frost',cat:'int',fp:14,req:{int:10},kind:'proj',dmg:2.8,v:260,pierce:1},
 frostnova:{name:'FROST NOVA',school:'frost',cat:'int',fp:28,req:{int:13},kind:'nova',dmg:2.6,r:46,hitT:.2,life:.8,slow:1},
 icicles:{name:'ICICLE FALL',school:'frost',cat:'int',fp:22,req:{int:12},kind:'strike',dmg:3.8,r:20,hitT:.35,life:.9,sorc:1},
 lstrike:{name:'SKYFALL',school:'lightning',cat:'any',fp:22,req:{fth:12},kind:'strike',dmg:4.4,r:14,hitT:.15,life:.6},
 chain:{name:'CHAIN LIGHTNING',school:'lightning',cat:'int',fp:26,req:{int:14},kind:'chain',dmg:2.6,n:3,range:130,life:.45,sorc:1},
 orb:{name:'BALL LIGHTNING',school:'lightning',cat:'any',fp:20,req:{fth:11},kind:'proj',dmg:1.6,v:80,pierce:1,tick:.25,life:2.2},
 voidorb:{name:'VOID ORB',school:'dark',cat:'int',fp:24,req:{int:14},kind:'proj',dmg:4.4,v:130,sorc:1},
 tendrils:{name:'GRASPING DARK',school:'dark',cat:'int',fp:26,req:{int:14},kind:'strike',dmg:2.4,r:22,hitT:.25,life:1,hits:2,slow:1},
 drain:{name:'SOUL DRAIN',school:'dark',cat:'any',fp:22,req:{int:12,fth:12},kind:'drain',dmg:.9,range:100,tick:.3,life:1.6},
 mend:{name:'MEND',school:'holy',cat:'fth',fp:30,req:{fth:12},kind:'heal',amt:55,life:1.1},
 benediction:{name:'BENEDICTION',school:'holy',cat:'fth',fp:26,req:{fth:14},kind:'buff',dur:20,life:1.4},
 aegis:{name:'AEGIS',school:'holy',cat:'fth',fp:28,req:{fth:15},kind:'shield',dur:12,life:12},
 radiance:{name:'RADIANCE',school:'holy',cat:'fth',fp:30,req:{fth:16},kind:'strike',dmg:5.2,r:18,hitT:.3,life:1},
 // classic casts (their own code paths in game.js)
 ice:{name:'FROST SPIKES',school:'frost',cat:'int',fp:15,req:{int:8},legacy:'iceP'},
 bolt:{name:'STORM',school:'lightning',cat:'int',fp:20,req:{int:9},legacy:'boltP'},
 dome:{name:'FROST DOME',school:'frost',cat:'int',fp:30,req:{int:9},legacy:'domeP'},
 heal:{name:'HEAL',school:'holy',cat:'fth',fp:0,req:{},legacy:'healP'},
 lspear:{name:'LIGHTNING SPEAR',school:'lightning',cat:'fth',fp:0,req:{},legacy:'lspearP'},
 blessed:{name:'BLESSED WEAPON',school:'holy',cat:'fth',fp:0,req:{},legacy:'blessP'}};
const SP_NEW=Object.keys(SPELLBOOK).filter(k=>!SPELLBOOK[k].legacy);
const SP_CLASS={sorcerer:['icelance','frostnova'],pyromancer:['fireball','flamepillar'],cleric:['mend'],herald:['mend'],assassin:['voidorb'],knight:[]};
const SP_BOSS={warden:'chain',heir:'meteor',prioress:'drain',astronomer:'orb',marshal:'aegis',abbess:'radiance',smith:'flamepillar',toller:'lstrike',king:'voidorb',cantor:'frostnova'};
const SP_CHEST=['fireball','icelance','icicles','tendrils','benediction','lstrike','mend','chain'];
const SP_SHOP=[['spell','fireball',900],['spell','icelance',900],['spell','mend',1100],['spell','tendrils',1300],['spell','chain',1600],['shard',null,400]];
const SP_SLOTS=4,SP_SORC_INT=24;
// tier palettes [deep, mid, bright, hot, core]: +0, +4 (same hues, more glow/size), +7 (hotter), +10 (apex)
const SP_PAL={fire:[[0xa01810,0xf03a10,0xff7a10,0xffc020,0xfff080],[0x8a1f17,0xe8501a,0xff9a3a,0xffd84a,0xffffff],[0xa8401a,0xff8a2a,0xffd23d,0xfff3a6,0xffffff],[0x2a2a8a,0x3a6aff,0x7ab0ff,0xc8e0ff,0xffffff]],
 frost:[[0x10307a,0x2a6ae8,0x50b8ff,0xa8e8ff,0xffffff],[0x1a3a7a,0x4a8ae8,0x8ad8ff,0xd8f8ff,0xffffff],[0x2a2a8a,0x5a6aff,0x9ab8ff,0xe0e8ff,0xffffff],[0x3a1a6a,0x8a5ad8,0xc8a0ff,0xf0e0ff,0xffffff]],
 lightning:[[0x6a5010,0xe0b010,0xffe040,0xfff8a0,0xffffff],[0x5a4a1a,0xd8c040,0xfff49a,0xfffad8,0xffffff],[0x1a4a6a,0x3aa0d8,0x8ae8ff,0xd8f8ff,0xffffff],[0x4a1a6a,0xa040e8,0xe08aff,0xf8d8ff,0xffffff]],
 dark:[[0x14041e,0x4a0880,0x8a20e8,0xc060ff,0xf0c8ff],[0x12061e,0x4a1878,0x8a40d8,0xc080ff,0xf0d8ff],[0x1e0610,0x601030,0xc0306a,0xff70a8,0xffd8e8],[0x05000a,0x200838,0xd8c8ff,0xf0e8ff,0xffffff]],
 holy:[[0x8a5a10,0xe0a020,0xffd040,0xfff0a0,0xffffff],[0x7a5a24,0xd8b050,0xffe89a,0xfff8d8,0xffffff],[0x7a3a24,0xe8803a,0xffc06a,0xffe8b8,0xffffff],[0x2a5a6a,0x5ac8d8,0xa8f0ff,0xe8ffff,0xffffff]]};
const spTierOf=lv=>lv>=10?3:lv>=7?2:lv>=4?1:0;
(()=>{const SP=Stage.prototype;
 const cr=SP.create;SP.create=function(...a){const r=cr.apply(this,a);try{this.spInit()}catch(e){console.warn('spells',e)}return r};
 SP.spInit=function(){const sv=this.sv;if(!sv)return;this.spFx=[];this.spProj=[];this.spK={};this.spHud=0;
  sv.spells=Array.isArray(sv.spells)?sv.spells:[];sv.spLv=sv.spLv||{};sv.shards=sv.shards||0;
  for(const id of SP_CLASS[sv.cls]||[])if(!sv.spells.includes(id))sv.spells.push(id);
  if(!sv.att)sv.att={sel:0,slots:this.spKnown().filter(id=>!this.spLocked(id)).slice(0,SP_SLOTS)};this.spFit();
  this.input.keyboard.on('keydown',e=>{if(e.repeat)return;if(this.paused&&!this.quitQ&&(e.key==='Tab'||e.key==='i'||e.key==='I')){this.spPauseEquip();return}});
  this.input.on('pointerdown',p=>{if(this.paused&&!this.quitQ){const R=SP_PAUSE_ROW;if(p.x>=R.x&&p.x<R.x+R.w&&p.y>=R.y-2&&p.y<R.y+9)this.spPauseEquip();return}
   const M=this.menu;if(M&&M.mode==='merchant'){this.spTap(p);return}
   if(!M&&!this.paused&&p.x>=this.spBox.x&&p.x<this.spBox.x+this.spBox.w&&p.y>=this.spBox.y&&p.y<this.spBox.y+this.spBox.h)this.spCycle(1)})};
 const SP_PAUSE_ROW={x:6,y:6,w:120};
 SP.spBox={x:4,y:34,w:86,h:15};
 SP.spSlots=function(){return SP_SLOTS};
 // sorcerer-only spells: Sorcerer class, or INT 24+
 SP.spLocked=function(id){const S=SPELLBOOK[id];return!!(S&&S.sorc&&this.sv.cls!=='sorcerer'&&(this.sv.stats.int||0)<SP_SORC_INT)};
 SP.spKnown=function(){const sv=this.sv,o=[...(sv.spells||[])];if(this.build&&this.build.cat)for(const k of['bolt','ice','dome'])o.push(k);for(const k of['heal','lspear','blessed'])if((sv.inv||[]).includes(k))o.push(k);return[...new Set(o)]};
 SP.spFit=function(){const A=this.sv.att,K=this.spKnown();A.slots=(A.slots||[]).filter(id=>SPELLBOOK[id]&&K.includes(id)&&!this.spLocked(id)).slice(0,SP_SLOTS);A.sel=A.slots.length?((A.sel||0)%A.slots.length+A.slots.length)%A.slots.length:0};
 SP.spCur=function(){const A=this.sv&&this.sv.att;return A&&A.slots.length?A.slots[A.sel%A.slots.length]:null};
 SP.spCycle=function(d){const A=this.sv.att;if(A.slots.length<2){if(A.slots.length)this.spHud=1;return}A.sel=(A.sel+d+A.slots.length)%A.slots.length;this.spHud=1.2;this.sfx('menu',.15);this.stats.spCycles=(this.stats.spCycles||0)+1};
 // pause screen -> the inventory's spell slots, with the world frozen until it closes
 SP.spPauseEquip=function(){if(!this.paused)return;this.paused=false;this.menu={mode:'inv',slot:8,focus:'slots',gi:0,t:1,prev:{},fromPause:1};this.physics.pause();this.spFrozen=1;this.sfx('menu',.2)};
 const ri=SP.readInput;SP.readInput=function(){const o=ri.call(this);if(!this.sv||!this.sv.att)return o;
  if(o.cycL)this.spCycle(-1);if(o.cycR)this.spCycle(1);
  if(o.spellP){const id=this.spCur(),S=id&&SPELLBOOK[id];if(!S)o.boltP=true;else if(S.legacy)o[S.legacy]=true;else o.spNew=id}
  delete o.spellP;delete o.cycL;delete o.cycR;return o};
 SP.spCanCast=function(id){const S=SPELLBOOK[id],P=this.player,b=this.build,st=this.sv.stats,need=S.cat==='int'?b.cat:S.cat==='fth'?b.tal:(b.cat||b.tal);
  if(this.spLocked(id)){this.pop('SORCERER ONLY',P.x,P.y-24,0xd8402a);return false}
  if(!need){this.pop(S.cat==='fth'?'NO TALISMAN':'NO CATALYST',P.x,P.y-24,0xd8402a);return false}
  for(const[k,v]of Object.entries(S.req))if(st[k]<v){this.pop('NEED '+k.toUpperCase()+' '+v,P.x,P.y-24,0xd8402a);return false}
  if(P.fp<S.fp){this.pop('NOT ENOUGH FP',P.x,P.y-24,0xd8402a);return false}return true};
 SP.spPow=function(id){const S=SPELLBOOK[id],b=this.build,m=S.cat==='int'?b.spell:S.cat==='fth'?b.mir:Math.max(b.spell||0,b.mir||0);return Math.max(.6,m||0)*(1+.07*(this.sv.spLv[id]||0))};
 SP.spBegin=function(id){const P=this.player;if(!this.canAct())return false;if(!this.spCanCast(id))return false;P.state='cast';P.spell=id;P.t=0;P.fp-=SPELLBOOK[id].fp;this.pb.setVelocityX(0);this.sfx('charge',.25);this.stats.spCasts=(this.stats.spCasts||0)+1;return true};
 const up=SP.update;SP.update=function(time,delta){const M=this.menu;if(this.spFrozen&&!(M&&M.fromPause)){this.spFrozen=0;this.physics.resume()}
  if(M&&M.fromPause){const dt=Math.min(delta,50)/1000;this.dt=dt;M.t+=dt;const inp=this.readInput();this.menuInput(inp);this.drawHUD();return}
  up.call(this,time,delta);if(!this.spFx||this.paused||this.victory)return;
  const P=this.player,i=this.inp||{};if(i.spNew&&!P.dead&&!this.menu&&(P.state==='idle'||P.state==='fall'||P.state==='jump'))this.spBegin(i.spNew);
  this.spStep(this.dt)};
 SP.spTarget=function(range,ahead=1){const P=this.player;let best=null,bd=1e9;for(const e of this.enemies)if(!e.dead){const dx=(e.b.x-P.x)*P.f;if(ahead&&dx<-8)continue;const d=Math.hypot(e.b.x-P.x,e.b.y-P.y);if(d<range&&d<bd){bd=d;best={x:e.b.x,y:e.b.body?e.b.body.bottom:e.b.y,e}}}
  const B=this.boss;if(B&&this.bossState==='fight'){const d=Math.hypot(B.x-P.x,B.y-P.y);if(d<range&&d<bd)best={x:B.x,y:B.y,boss:1}}return best};
 SP.spHitArea=function(x,y,r,dmg,dir,seen){let n=0;for(const e of this.enemies)if(!e.dead&&!(seen&&seen.has(e))){const ey=e.b.body?e.b.body.bottom-6:e.b.y;if(Math.abs(e.b.x-x)<r+5&&Math.abs(ey-y)<r+10){this.damageEnemy(e,dmg,dir);if(seen)seen.add(e);n++}}
  const B=this.boss;if(B&&this.bossState==='fight'&&!(seen&&seen.has(B))&&Math.abs(B.x-x)<r+12&&Math.abs(B.y-10-y)<r+26){this.damageBoss(dmg*.6);if(seen)seen.add(B);n++}if(n)this.stats.spHits=(this.stats.spHits||0)+n;return n};
 SP.spFire=function(id){const S=SPELLBOOK[id],P=this.player,lv=this.sv.spLv[id]||0,tier=spTierOf(lv),pw=this.spPow(id),f=P.f,hx=P.x+f*8,hy=P.y-12;this.stats.spFired=(this.stats.spFired||0)+1;
  const fx=(x,y,o={})=>{const e={id,S,tier,x,y,f,t:0,life:o.life||S.life||1,follow:o.follow,seed:Math.random()*1000,...o.extra};this.spFx.push(e);if(tier>=3)this.fx.ember(x,y-8,18,1.6);return e};
  if(S.kind==='proj'){const p={id,S,x:hx,y:hy,vx:f*S.v,t:0,dmg:S.dmg*pw,seen:new Set(),tick:0,life:S.life||1.4,f,tier,trail:[]};p.v=fx(hx,hy,{follow:p,life:p.life+.2});this.spProj.push(p);this.sfx(S.school==='fire'?'fire':'charge',.3)}
  else if(S.kind==='strike'){const T=this.spTarget(170)||{x:P.x+f*(S.far||52),y:P.y};const e=fx(T.x,T.y);e.hit={t:S.hitT,x:T.x,y:T.y-8,r:S.r,dmg:S.dmg*pw,n:S.hits||1,dir:f,slow:S.slow};this.sfx(S.school==='lightning'?'thunder':'slam',.3)}
  else if(S.kind==='nova'){const e=fx(P.x,P.y);e.hit={t:S.hitT,x:P.x,y:P.y-8,r:S.r,dmg:S.dmg*pw,n:1,dir:f,slow:S.slow};this.sfx('charge',.35)}
  else if(S.kind==='chain'){const seen=new Set(),pts=[[hx,hy]];let from={x:hx,y:hy},n=0;for(let k=0;k<S.n;k++){let best=null,bd=S.range;for(const e of this.enemies)if(!e.dead&&!seen.has(e)){const d=Math.hypot(e.b.x-from.x,e.b.y-from.y);if(d<bd){bd=d;best=e}}
    if(!best){const B=this.boss;if(B&&this.bossState==='fight'&&!seen.has(B)&&Math.hypot(B.x-from.x,B.y-from.y)<S.range){seen.add(B);this.damageBoss(S.dmg*pw*.6);pts.push([B.x,B.y-16]);n++}break}seen.add(best);this.damageEnemy(best,S.dmg*pw,f);from={x:best.b.x,y:best.b.y};pts.push([from.x,from.y]);n++}
   if(pts.length<2)pts.push([hx+f*60,hy+rnd(-6,6)]);fx(hx,hy,{extra:{pts}});this.stats.spHits=(this.stats.spHits||0)+n;this.sfx('thunder',.35)}
  else if(S.kind==='drain'){const T=this.spTarget(S.range);const e=fx(hx,hy,{life:S.life});e.drain={T,tick:0,dmg:S.dmg*pw};this.sfx('charge',.3)}
  else if(S.kind==='heal'){fx(P.x,P.y,{follow:P});const amt=Math.round(S.amt*pw);P.hp=Math.min(P.hpMax,P.hp+amt);this.pop('+'+amt,P.x,P.y-26,0x9ff0a0);this.sfx('heal',.45)}
  else if(S.kind==='buff'){fx(P.x,P.y,{follow:P});P.bless=S.dur;P.blessMul=1+.25*pw;this.say(S.name+' - WEAPON BLESSED',1.4);this.sfx('buff',.45)}
  else if(S.kind==='shield'){fx(P.x,P.y,{follow:P,life:S.dur});this.buffs=this.buffs||{};this.buffs.guard=S.dur;this.say(S.name+' - DAMAGE REDUCED',1.4);this.sfx('buff',.45)}};
 SP.spStep=function(dt){const P=this.player;
  for(let i=this.spProj.length-1;i>=0;i--){const p=this.spProj[i],S=p.S;p.t+=dt;p.x+=p.vx*dt;p.trail.unshift([p.x,p.y+Math.sin(p.t*30)*.6]);if(p.trail.length>10)p.trail.pop();let gone=p.t>p.life||p.x<0||p.x>WORLD;
   if(!gone){if(S.tick){p.tick-=dt;if(p.tick<=0){p.tick=S.tick;this.spHitArea(p.x,p.y,12,p.dmg,p.f)}}
    else{const n=this.spHitArea(p.x,p.y,8,p.dmg,p.f,p.seen);if(n&&!S.pierce){gone=true;this.spBurst(p.x,p.y,S.school,p.tier)}}}
   if(gone){this.spProj.splice(i,1);if(p.v){p.v.life=Math.min(p.v.life,p.v.t+.12);p.v.follow=null;p.v.dead=1}}}
  for(let i=this.spFx.length-1;i>=0;i--){const e=this.spFx[i];e.t+=dt;if(e.follow){e.x=e.follow.x;e.y=e.follow.y}
   if(e.hit&&e.t>=e.hit.t){const H=e.hit;const n=this.spHitArea(H.x,H.y,H.r,H.dmg,H.dir,null);if(H.slow)for(const en of this.enemies)if(!en.dead&&Math.abs(en.b.x-H.x)<H.r+5&&Math.abs((en.b.body?en.b.body.bottom-6:en.b.y)-H.y)<H.r+10){en.slowT=Math.max(en.slowT||0,2.5+.15*(this.sv.spLv[e.id]||0));this.stats.spSlowed=(this.stats.spSlowed||0)+1}if(--H.n>0)H.t+=.35;else e.hit=null;if(n)this.cam.shake(80,.005)}
   if(e.drain){const D=e.drain;D.tick-=dt;if(D.tick<=0&&D.T){D.tick=SPELLBOOK.drain.tick;const T=D.T;if(T.e&&!T.e.dead){this.damageEnemy(T.e,D.dmg,P.f);P.hp=Math.min(P.hpMax,P.hp+3);D.tx=T.e.b.x;D.ty=T.e.b.y}else if(T.boss&&this.boss&&this.bossState==='fight'){this.damageBoss(D.dmg*.6);P.hp=Math.min(P.hpMax,P.hp+3);D.tx=this.boss.x;D.ty=this.boss.y-16}}}
   if(e.t>=e.life)this.spFx.splice(i,1)}
  if(this.spHud>0)this.spHud-=dt};
 SP.spBurst=function(x,y,school,tier){const C=SP_PAL[school][tier];this.fx.spark(x,y,14+tier*4,C[3],110);this.fx.spark(x,y,6,C[4],60);this.spFx.push({S:{school,kind:'burst'},tier,x,y,t:0,life:.25,f:1,seed:0})};
 // ---------- drawing: every spell in our own pixel code (world space) ----------
 const ds=SP.drawStory;SP.drawStory=function(g,ga){ds.call(this,g,ga);if(this.spFx&&this.spFx.length)try{this.spDraw(g,ga)}catch(e){}};
 const R=(g,x,y,w,h,c,a=1)=>{g.fillStyle(c,a);g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))};
 const ring=(g,x,y,r,c,a=1,th=1)=>{g.lineStyle(th,c,a);g.strokeCircle(Math.round(x),Math.round(y),Math.max(1,Math.round(r)))};
 const bolt=(g,x0,y0,x1,y1,c,seed,jag=6,a=1)=>{const n=Math.max(3,Math.round(Math.hypot(x1-x0,y1-y0)/8));let px0=x0,py0=y0;for(let i=1;i<=n;i++){const k=i/n,j=i===n?0:(Math.sin(seed*13.1+i*7.7)*jag);const nx=x0+(x1-x0)*k+(Math.abs(y1-y0)>Math.abs(x1-x0)?j:0),ny=y0+(y1-y0)*k+(Math.abs(y1-y0)>Math.abs(x1-x0)?0:j);line(g,px0,py0,nx,ny,c,a);line(g,px0+1,py0,nx+1,ny,c,a);line(g,px0,py0+1,nx,ny+1,c,a);line(g,px0-1,py0,nx-1,ny,0x000000,a*.35);px0=nx;py0=ny}};
 SP.spDraw=function(g,ga){const T=this.t;
  // flat pixel shapes only: solid bands, dark outlines, no glow/bloom. k scales everything (+0 is already bold).
  const O=0x0a0612;
  for(const p of this.spProj){const C=SP_PAL[p.S.school][p.tier],k=1.6+.2*p.tier,id=p.id,f=p.f;
   if(id==='fireball'){p.trail.forEach(([x,y],i)=>{const r=(5-i*.4)*k;if(r<1)return;R(g,x-f*i*2-r,y-r,r*2,r*2,i<2?C[2]:i<5?C[1]:C[0])});const r=4*k;R(g,p.x-r-1,p.y-r-1,r*2+2,r*2+2,O);R(g,p.x-r,p.y-r,r*2,r*2,C[2]);R(g,p.x-r*.6,p.y-r*.6,r*1.2,r*1.2,C[3]);R(g,p.x-r*.25,p.y-r*.25,r*.5,r*.5,C[4])}
   else if(id==='icelance'){const L=18*k,h=4*k;for(let i=0;i<L;i++){const w=Math.max(2,Math.round((1-Math.abs(i-L*.65)/(L*.65))*h));R(g,p.x-f*i,p.y-w/2-1,1,w+2,O);R(g,p.x-f*i,p.y-w/2,1,w,i<4?C[4]:i<L*.5?C[3]:C[1])}p.trail.forEach(([x,y],i)=>{if(i%2)R(g,x-f*(L+i*3),y+Math.sin(i+T*20)*3,2,2,C[2])})}
   else if(id==='orb'){const r=6*k;R(g,p.x-r-1,p.y-r-1,r*2+2,r*2+2,O);R(g,p.x-r,p.y-r,r*2,r*2,C[1]);R(g,p.x-r*.6,p.y-r*.6,r*1.2,r*1.2,C[3]);R(g,p.x-2,p.y-2,4,4,C[4]);for(let i=0;i<3;i++){const a=T*9+i*2.1+p.t*3;bolt(g,p.x,p.y,p.x+Math.cos(a)*r*2.4,p.y+Math.sin(a)*r*2.4,C[3],a,3)}}
   else if(id==='voidorb'){const r=7*k;R(g,p.x-r-1,p.y-r-1,r*2+2,r*2+2,C[3]);R(g,p.x-r,p.y-r,r*2,r*2,C[2]);R(g,p.x-r+2,p.y-r+2,r*2-4,r*2-4,C[1]);R(g,p.x-r*.45,p.y-r*.45,r*.9,r*.9,0x000000);for(let i=0;i<6;i++){const a=T*6+i*1.05;R(g,p.x+Math.cos(a)*(r+4)-1,p.y+Math.sin(a)*(r+4)*.6-1,2,2,C[3])}p.trail.forEach(([x,y],i)=>{if(i>1)R(g,x-f*i*3-2,y-2,4,4,i<5?C[2]:C[1])})}}
  for(const e of this.spFx){const S=e.S,C=SP_PAL[S.school][e.tier],k=1.6+.2*e.tier,u=Math.min(1,e.t/Math.max(.01,e.life)),x=e.x,y=e.y,id=e.id;
   if(S.kind==='burst'){ring(g,x,y,3+e.t*70,C[3],1-e.t*4,3);continue}
   if(S.kind==='proj')continue;
   if(id==='flamepillar'){const h=Math.min(1,e.t/.18)*62*k*(u>.75?(1-u)*4:1),w=10*k;for(let yy=0;yy<h;yy+=3){const fl=Math.round(Math.sin(yy*.4-T*30+e.seed)*2),ww=w*(1-yy/h*.5);R(g,x-ww/2+fl-1,y-yy-3,ww+2,3,O);R(g,x-ww/2+fl,y-yy-3,ww,3,yy<h*.3?C[1]:yy<h*.65?C[2]:C[3])}R(g,x-w*.18,y-h*.85,w*.36,h*.75,C[4]);if(Math.random()<.5)this.fx.ember(x+rnd(-w,w),y-rnd(0,h),1,1.2)}
   else if(id==='meteor'){const fall=Math.min(1,e.t/S.hitT),mx=x-e.f*70*(1-fall),my=y-110*(1-fall);if(fall<1){const r=6*k;for(let i=1;i<8;i++){const q=r*(1-i/9);R(g,mx-e.f*i*5-q/2,my-i*7-q/2,q,q,i<3?C[3]:i<5?C[2]:C[1])}R(g,mx-r-1,my-r-1,r*2+2,r*2+2,O);R(g,mx-r,my-r,r*2,r*2,0x4a2a22);R(g,mx-r+2,my-r+2,r,r,C[3])}
    else{const q=(e.t-S.hitT)/(e.life-S.hitT);ring(g,x,y-4,6+q*40*k,C[2],1,4);ring(g,x,y-4,3+q*24*k,C[4],1,3);R(g,x-30*k*q,y-3,60*k*q,4,C[2]);for(let i=0;i<6;i++){const a=i*1.05+e.seed;R(g,x+Math.cos(a)*q*36*k-2,y-6-Math.abs(Math.sin(a))*q*30*k,4,4,C[3])}if(q<.1)this.cam.shake(160,.012)}}
   else if(id==='frostnova'){const r=Math.min(1,e.t/.25)*S.r*k;for(let i=-10;i<=10;i++){if(Math.abs(i)<2)continue;const sx=x+i*r/10,hh=(8+((i*7+3)%5)*2)*k*(1-u*.5);R(g,sx-2,y-hh-1,4,hh+1,O);R(g,sx-1,y-hh,3,hh,C[2]);R(g,sx,y-hh,1,hh-2,C[4]);R(g,sx-2,y-3,5,3,C[1])}ring(g,x,y-6,r,C[3],1,3)}
   else if(id==='icicles'){for(let j=0;j<5;j++){const ox=(j-2)*8*k,d=j*.06,fall=Math.min(1,Math.max(0,(e.t-d)/S.hitT)),iy=y-90+(90-2)*fall,L=14*k;if(fall<1){R(g,x+ox-3,iy-L-1,6,L+2,O);R(g,x+ox-2,iy-L,4,L,C[2]);R(g,x+ox-1,iy-L,2,L-2,C[4]);R(g,x+ox-1,iy,2,2,C[4])}else{R(g,x+ox-4,y-4,9,4,C[2]);R(g,x+ox-2,y-7,3,3,C[3])}}}
   else if(id==='lstrike'){if(e.t<.35){bolt(g,x+Math.sin(e.seed)*10,y-140,x,y,e.t<.08?C[4]:C[3],e.seed+Math.floor(e.t*20),8);bolt(g,x+8,y-80,x+20*k,y-30,C[2],e.seed*3,5)}R(g,x-16*k*u,y-3,32*k*u,3,C[3])}
   else if(id==='chain'){if(e.pts)for(let i=1;i<e.pts.length;i++){const[a0,b0]=e.pts[i-1],[a1,b1]=e.pts[i];bolt(g,a0,b0,a1,b1,u<.5?C[4]:C[3],e.seed+i+Math.floor(e.t*25),6);R(g,a1-3,b1-3,6,6,C[3])}}
   else if(id==='tendrils'){R(g,x-18*k,y-2,36*k,3,0x000000);for(let j=0;j<5;j++){const bx=x+(j-2)*7*k,h=(20+j%3*7)*k*Math.sin(Math.min(1,u*1.4)*Math.PI);for(let yy=0;yy<h;yy++){const sw=Math.round(Math.sin(yy*.22+T*8+j)*4*(yy/h)),w=yy<h-4?3:2;R(g,bx+sw-w/2-1,y-yy,w+2,1,O);R(g,bx+sw-w/2,y-yy,w,1,yy>h-5?C[3]:yy%4<2?C[1]:C[2])}}}
   else if(id==='drain'){const D=e.drain||{},tx=D.tx!=null?D.tx:x+e.f*70,ty=D.ty!=null?D.ty:y;const P=this.player;for(let i=0;i<14;i++){const q=((T*1.6+i/14)%1),sx=tx+(P.x-tx)*q,sy=ty+(P.y-12-ty)*q+Math.sin(q*9+i)*5;R(g,sx-2,sy-2,4,4,O);R(g,sx-1,sy-1,3,3,q<.5?C[2]:C[3])}}
   else if(id==='mend'){for(let i=0;i<12;i++){const q=(u*1.3+i/12)%1,ax=x+Math.sin(i*2.4+T*3)*11*k,ay=y-2-q*32*k;R(g,ax-2,ay-1,4,4,i%2?0x5fe070:C[3]);R(g,ax-1,ay-3,2,2,C[4])}ring(g,x,y-10,6+u*12*k,C[3],1-u,3)}
   else if(id==='benediction'){const hy=y-28;ring(g,x,hy,6*k,C[2],1,3);R(g,x-1,hy-9,3,6,C[4]);for(let i=0;i<8;i++){const a=T*2+i*.785;R(g,x+Math.cos(a)*11*k-1,y-12+Math.sin(a)*13-1,3,3,C[3])}}
   else if(id==='aegis'){const r=15*k,a=Math.min(1,(e.life-e.t)/.5);g.lineStyle(3,C[2],a);g.beginPath();for(let i=0;i<=6;i++){const an=i/6*Math.PI*2+T*.6,X=x+Math.cos(an)*r,Y=y-11+Math.sin(an)*r*1.1;i?g.lineTo(X,Y):g.moveTo(X,Y)}g.strokePath();g.lineStyle(1,C[4],a);g.strokePath();R(g,x+Math.cos(T*4)*r-2,y-11+Math.sin(T*4)*r*1.1-2,4,4,C[4],a)}
   else if(id==='radiance'){const w=12*k*(u<.2?u/.2:1-(u-.2)/.8*.6);R(g,x-w/2-1,y-150,w+2,150,C[1]);R(g,x-w/2,y-150,w,150,C[2]);R(g,x-w/4,y-150,w/2,150,C[4]);for(let i=0;i<6;i++){const sx=x+(i-2.5)*8*k;R(g,sx-1,y-60+((T*90+i*17)%60),3,7,C[3])}ring(g,x,y-2,4+u*24*k,C[3],1-u,3)}}};
 // ---------- HUD: the selected spell, its tier, slot pips ----------
 SP.spIcon=function(g,id,x,y,s=12,dim){const S=SPELLBOOK[id];if(!S){g.fillStyle(0x2a2440);g.fillRect(x,y,s,s);return}const C=SCHOOL[S.school],lock=this.spLocked(id),c=dim||lock?0x5a5470:C.c,cx=x+s/2|0,cy=y+s/2|0;
  g.fillStyle(dim||lock?0x15121f:C.d);g.fillRect(x,y,s,s);g.fillStyle(c);
  if(S.school==='fire'){g.fillRect(cx-2,cy-1,5,5);g.fillRect(cx-1,cy-3,3,2);g.fillRect(cx,cy-5,1,2)}
  else if(S.school==='frost'){g.fillRect(cx,cy-4,1,9);g.fillRect(cx-4,cy,9,1);g.fillRect(cx-2,cy-2,1,1);g.fillRect(cx+2,cy+2,1,1);g.fillRect(cx+2,cy-2,1,1);g.fillRect(cx-2,cy+2,1,1)}
  else if(S.school==='lightning'){g.fillRect(cx,cy-5,2,4);g.fillRect(cx-2,cy-1,5,1);g.fillRect(cx-1,cy,2,5)}
  else if(S.school==='dark'){g.fillRect(cx-3,cy-1,7,3);g.fillRect(cx-1,cy-3,3,7);g.fillStyle(C.d);g.fillRect(cx-1,cy-1,3,3)}
  else{g.fillRect(cx,cy-4,1,9);g.fillRect(cx-3,cy-2,7,1)}
  if(lock){g.fillStyle(0xd8b060);g.fillRect(x+s-5,y+s-4,4,3);g.fillRect(x+s-4,y+s-6,2,2)}
  const t=spTierOf(this.sv.spLv[id]||0);if(t&&!lock){g.fillStyle(t>=3?0xffffff:t>=2?0xffd04a:0xd8d0ee);for(let i=0;i<t;i++)g.fillRect(x+s-2,y+1+i*3,1,2)}
  if(S.sorc&&!lock){g.fillStyle(0xb070ff);g.fillRect(x+1,y+s-2,2,1)}};
 const hud=SP.drawHUD;SP.drawHUD=function(){hud.call(this);try{this.spDrawHud()}catch(e){}};
 SP.spDrawHud=function(){if(!this.sv||!this.sv.att||this.cine||this.menu||this.victory)return;const g=this.gu,A=this.sv.att,id=this.spCur(),B=this.spBox;if(this.touch){B.x=W/2-43;B.y=4}
  if(this.paused){drawText(g,(typeof PAD!=='undefined'&&PAD.connected()?'X':'TAB')+'  SPELLS / EQUIP',SP_PAUSE_ROW.x,SP_PAUSE_ROW.y,0xffb04a);SP_PAUSE_ROW.w=textW('TAB  SPELLS / EQUIP');return}
  g.fillStyle(0x07050f,.75);g.fillRect(B.x,B.y,B.w,B.h);g.fillStyle(this.spHud>0?0xffd04a:0x4a3a6a);g.fillRect(B.x,B.y,B.w,1);g.fillRect(B.x,B.y+B.h-1,B.w,1);
  this.spIcon(g,id,B.x+2,B.y+2,11);const S=SPELLBOOK[id],lv=id?(this.sv.spLv[id]||0):0;
  drawText(g,S?(S.name.length>11?S.name.slice(0,11):S.name)+(lv?' +'+lv:''):'NO SPELL',B.x+16,B.y+3,S?SCHOOL[S.school].c:0x6a6488);
  const n=A.slots.length;for(let i=0;i<SP_SLOTS;i++){g.fillStyle(i>=n?0x2a2440:i===A.sel%n?0xffe2a8:0x5a5478);g.fillRect(B.x+16+i*4,B.y+B.h-3,3,1)}
  if(this.spHud>0&&n>1){const L=A.slots[(A.sel+n-1)%n],Rr=A.slots[(A.sel+1)%n];this.spIcon(g,L,B.x+B.w+2,B.y+2,9,1);this.spIcon(g,Rr,B.x+B.w+13,B.y+2,9,1)}};
 // ---------- bonfire: ATTUNE SPELLS opens the inventory's spell slots; MERCHANT (stub until the hub market) ----------
 const mo=SP.mainOpts;SP.mainOpts=function(){const o=mo.call(this);const i=o.indexOf('ITEMS AND SPELLS')+1;o.splice(i,0,'ATTUNE SPELLS','MERCHANT');return o};
 SP.spShopRows=function(){const sv=this.sv;const emp=(sv.att.slots||[]).filter(id=>!SPELLBOOK[id].legacy&&(sv.spLv[id]||0)<10).map(id=>['empower',id,1+Math.floor((sv.spLv[id]||0)/3)]);
  return[...SP_SHOP.filter(([k,id])=>k!=='spell'||!sv.spells.includes(id)),...emp,['back']]};
 SP.spLearn=function(id,from){const sv=this.sv;if(sv.spells.includes(id))return false;sv.spells.push(id);if(sv.att.slots.length<SP_SLOTS&&!this.spLocked(id))sv.att.slots.push(id);this.spFit();Save.write(sv);this.say('LEARNED '+SPELLBOOK[id].name+(from?' ('+from+')':'')+(this.spLocked(id)?' - SORCERER ONLY':''),2);this.sfx('fanfare',.35);this.stats.spLearned=(this.stats.spLearned||0)+1;return true};
 const mk=SP.menuKey;SP.menuKey=function(k){const M=this.menu;
  if(M&&M.mode==='main'&&k==='ok'){const o=this.mainOpts()[M.sel];if(o==='ATTUNE SPELLS'){this.sfx('menu',.2);this.menu={mode:'inv',slot:8,focus:'slots',gi:0,t:1,prev:{},back:M.sel};return}if(o==='MERCHANT'){this.sfx('menu',.2);M.mode='merchant';M.sel=0;M.say='WARES FOR THE ASHEN. (A STUB UNTIL THE HUB MARKET OPENS.)';return}}
  if(M&&M.mode==='inv'&&M.fromPause&&k==='back'&&M.focus==='slots'){this.menu=null;return}
  if(M&&M.mode==='merchant'){this.sfx('menu',.2);const R=this.spShopRows(),n=R.length,sv=this.sv;
   if(k==='up')M.sel=(M.sel+n-1)%n;else if(k==='down')M.sel=(M.sel+1)%n;else if(k==='back'||k==='ok'&&R[M.sel][0]==='back'){if(M.npc)this.menu=null;else{M.mode='main';M.sel=this.mainOpts().indexOf('MERCHANT')}}
   else if(k==='ok'){const[kind,id,price]=R[M.sel];
    if(kind==='empower'){if(sv.shards<price){M.say='NEED '+price+' SPELL SHARDS';this.sfx('clang',.2)}else{sv.shards-=price;const lv=(sv.spLv[id]||0)+1;sv.spLv[id]=lv;Save.write(sv);M.say=SPELLBOOK[id].name+' +'+lv+([4,7,10].includes(lv)?' - ITS LIGHT CHANGES':'');this.sfx('pickup',.4)}}
    else if(this.souls<price){M.say='YOU LACK THE SOULS.';this.sfx('clang',.2)}else{this.souls-=price;sv.souls=this.souls;if(kind==='spell')this.spLearn(id,'BOUGHT');else sv.shards++;Save.write(sv);M.say='SOLD. '+(kind==='spell'?SPELLBOOK[id].name:'A SPELL SHARD')+'.';this.sfx('pickup',.4)}M.sel=Math.min(M.sel,this.spShopRows().length-1)}return}
  return mk.call(this,k)};
 SP.spTap=function(p){const M=this.menu,L=this.spLayout||{};const x=p.x,y=p.y;
  if(L.rows){for(const[i,ry]of L.rows){if(y>=ry-1&&y<ry+8&&x>=L.rx&&x<L.rx+L.rw){if(M.sel===i)this.menuKey('ok');else M.sel=i;return}}}
  if(x<L.x0||x>L.x1||y<L.y0||y>L.y1)this.menuKey('back')};
 const dm=SP.drawMenu0;SP.drawMenu0=function(g,ga){const M=this.menu;if(M.mode!=='merchant')return dm.call(this,g,ga);
  const sv=this.sv;g.fillStyle(0x07050f,1);g.fillRect(6,8,308,166);g.fillStyle(0x7a5a24);g.fillRect(6,8,308,1);g.fillRect(6,173,308,1);g.fillRect(6,8,1,166);g.fillRect(313,8,1,166);this.spLayout={x0:6,x1:314,y0:8,y1:174,rows:[],rx:10,rw:300};
  drawText(g,'MERCHANT',12,13,0xffb04a);drawText(g,'SOULS '+this.souls+'   SHARDS '+sv.shards,140,13,0x9fd8ff);
  const R=this.spShopRows(),top=Math.max(0,Math.min(M.sel-8,R.length-11));R.slice(top,top+11).forEach((r,j)=>{const i=top+j,y=28+j*11;this.spLayout.rows.push([i,y]);const on=i===M.sel;if(on){g.fillStyle(0x2a2245);g.fillRect(10,y-2,300,10)}
   if(r[0]==='back'){drawText(g,'LEAVE',26,y,on?0xffe2a8:0xa8a0c8);return}
   const nm=r[0]==='spell'?SPELLBOOK[r[1]].name+(this.spLocked(r[1])?' (SORCERER)':''):r[0]==='shard'?'SPELL SHARD':'EMPOWER '+SPELLBOOK[r[1]].name+' +'+((sv.spLv[r[1]]||0)+1);
   if(r[0]!=='shard')this.spIcon(g,r[1],12,y-2,10);drawText(g,nm,26,y,on?0xffe2a8:0xd8d0ee);drawText(g,r[0]==='empower'?r[2]+' SH':String(r[2]),262,y,r[0]==='empower'?(sv.shards>=r[2]?0x9fd8ff:0xd8402a):(this.souls>=r[2]?0x9fd8ff:0xd8402a))});
  if(M.say)drawText(g,M.say,12,160,0xd8c8b0)};
 // drops: chests may hold a scroll or a shard; every boss yields its spell
 const oc=SP.openChest;SP.openChest=function(c,fromNet){const was=c.st;oc.call(this,c,fromNet);if(was!=='shut'||c.st!=='open'||NET.guest()||!this.sv||!this.sv.att)return;
  const sv=this.sv,h=[...c.id].reduce((a,ch)=>a*31+ch.charCodeAt(0)|0,7),r=((h>>>0)%100)/100;
  if(r<.3){const id=SP_CHEST.find(k=>!sv.spells.includes(k));if(id){this.spLearn(id,'SCROLL');return}}
  if(r<.75){sv.shards++;Save.write(sv);this.pop('SPELL SHARD',c.x,c.y-30,0x9fd8ff)}};
 const fb=SP.finishBoss;SP.finishBoss=function(B){const r=fb.call(this,B);try{if(this.sv&&this.sv.att&&!NET.guest()){const id=SP_BOSS[B.kind];this.sv.shards+=2;if(!(id&&this.spLearn(id,'BOSS SOUL'))){this.sv.shards+=1;Save.write(this.sv)}}}catch(e){}return r};
})();
if(typeof module!=='undefined')module.exports={SPELLBOOK,SCHOOL,spTierOf};
