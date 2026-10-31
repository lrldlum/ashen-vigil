// ASHEN VIGIL — Bell Tower enemies on Artist's pixel strips (assets/enemies/bell_tower, manifest.json), in the current stage.
// rime bat swarm (flier, base wraith; "split" opens a dodge gap when you roll at it), clapper knight (base knight),
// frost ringer (mini-elite, base knight; swings on its rope, swing_drop drops real icicles at x=14/30/46/62 in frames 3-7).
'use strict';
const BT_ART={bellbats:{tex:'bt_bats',file:'rime_bat_swarm_strip.png',fw:64,fh:60,ox:.5,oy:.5,face:1,A:{idle:[0,8,10],move:[8,8,12],attack:[16,8,14],split:[24,8,10],hit:[32,6,14],death:[38,6,10]}},
 clapper:{tex:'bt_clapper',file:'clapper_knight_strip.png',fw:56,fh:54,ox:.5,oy:50/54,face:1,A:{idle:[0,8,8],move:[8,8,10],attack:[16,8,12],hit:[24,6,14],death:[30,6,10]}},
 ringer:{tex:'bt_ringer',file:'frost_ringer_strip.png',fw:80,fh:80,ox:.5,oy:.95,face:-1,A:{idle:[0,8,8],move:[8,8,8],attack:[16,8,12],swing_drop:[24,8,10],hit:[32,6,14],death:[38,6,10]}}};
Object.assign(EBASE,{bellbats:'wraith',clapper:'knight',ringer:'knight'});
Object.assign(EHP,{bellbats:5,clapper:9,ringer:22});Object.assign(ESOULS,{bellbats:100,clapper:140,ringer:400});
ESIZE.bellbats=ESIZE.bellbats||[40,30];
if(typeof STAGE_DEFS!=='undefined'&&STAGE_DEFS.belltower){const D=STAGE_DEFS.belltower;
 D.enemies=D.enemies.map(([k,x,y])=>[k==='wraith'||k==='chorister'?'bellbats':k==='knight'||k==='sentinel'?'clapper':k,x,y]);D.enemies.push(['ringer',1960],['ringer',2650])}
(()=>{const SP=Stage.prototype;
 const bp=Boot.prototype.preload;Boot.prototype.preload=function(){bp.call(this);for(const a of Object.values(BT_ART))this.load.spritesheet(a.tex,'assets/enemies/bell_tower/'+a.file,{frameWidth:a.fw,frameHeight:a.fh})};
 // the bat swarm's hit box is the whole group; the ringer is big
 const se=SP.spawnEnemy;SP.spawnEnemy=function(k,x,gy){const e=se.call(this,k,x,gy);if(k==='bellbats')e.b.body.setSize(40,30);if(k==='ringer'){e.b.body.setSize(16,44);e.dropCd=2;e.elite=1}return e};
 const anim=(e,name)=>{const a=BT_ART[e.k].A[name]||BT_ART[e.k].A.idle;if(e.anN!==name){e.anN=name;e.anT=0}return a};
 SP.btFrame=function(e,dt){const S=e.spr;let name;
  if(e.dead)name='death';else if(e.drop)name='swing_drop';else if(e.splitT>0)name='split';else if(e.flash>0||e.state==='stag')name='hit';else if(e.state==='wind'||e.state==='swing')name='attack';else if(e.state==='chase')name='move';else name='idle';
  const a=anim(e,name);e.anT+=dt;let i=Math.floor(e.anT*a[2]);const once=name==='death'||name==='hit'||name==='swing_drop';i=once?Math.min(i,a[1]-1):i%a[1];e.anI=i;S.setFrame(a[0]+i);return name};
 // ringer swing_drop: stop, play the strip, spawn an icicle at each manifest x on frames 3..7
 const ue=SP.updateEnemies;SP.updateEnemies=function(dt){const r=ue.call(this,dt);const P=this.player;
  for(const e of this.enemies){if(e.dead)continue;if(e.splitT>0)e.splitT-=dt;
   if(e.k==='bellbats'&&P&&P.state==='roll'&&Math.abs(P.x-e.b.x)<48&&!(e.splitT>0))e.splitT=.8;
   if(e.k!=='ringer')continue;e.dropCd-=dt;
   if(!e.drop&&e.dropCd<=0&&P&&!P.dead&&Math.abs(P.x-e.b.x)<110&&Math.abs(P.y-e.b.body.bottom)<60){e.drop={t:0,done:{}};e.f=P.x<e.b.x?-1:1}
   if(e.drop){e.b.setVelocityX(0);e.drop.t+=dt;const fr=Math.floor(e.drop.t*10);
    for(let k=3;k<=7&&k<=fr;k++)if(!e.drop.done[k]){e.drop.done[k]=1;const xs=[14,30,46,62];const lx=xs[(k-3)%4]-40;this.spawnIcicle(e.b.x+lx*-BT_ART.ringer.face*e.f*-1,e.b.body.bottom-70)}
    if(e.drop.t>.85){e.drop=null;e.dropCd=3.2}}}
  this.stepIcicles(dt);return r};
 SP.spawnIcicle=function(x,y){(this.icicles||(this.icicles=[])).push({x,y,vy:40,t:0});this.stats.icicles=(this.stats.icicles||0)+1};
 SP.stepIcicles=function(dt){const L=this.icicles;if(!L)return;const P=this.player;for(let i=L.length-1;i>=0;i--){const c=L[i];c.t+=dt;c.vy+=520*dt;c.y+=c.vy*dt;
  const fy=this.lv&&this.lv.floorAt?this.lv.floorAt(c.x,c.y-4):GY;
  if(P&&!P.dead&&Math.abs(P.x-c.x)<6&&c.y>P.y-26&&c.y<P.y+2&&P.inv<=0){if(this.hurtPlayer(14,c.x,'env'))this.stats.icicleHits=(this.stats.icicleHits||0)+1;L.splice(i,1);this.fx.shard(c.x,c.y,6,80);continue}
  if(c.y>=fy||c.t>3){this.fx.shard(c.x,Math.min(c.y,fy),6,70);L.splice(i,1)}}};
 const de=SP.drawEnemy;SP.drawEnemy=function(g,ga,e){const A=BT_ART[e.k];if(!A||!this.textures.exists(A.tex))return de.call(this,g,ga,e);
  if(!e.spr){e.spr=this.add.sprite(0,0,A.tex,0).setOrigin(A.ox,A.oy).setDepth(5)}const S=e.spr,b=e.b;
  const name=this.btFrame(e,this.game.loop.delta/1000);
  if(e.dead&&(e.deadT||0)>.9){S.setVisible(false);return}S.setVisible(true);
  S.setPosition(Math.round(b.x),Math.round(A.oy>.8?b.body.bottom:b.y));S.setFlipX(A.face*(e.f||1)<0);
  if(e.flash>0&&!e.dead)S.setTintFill(0xffffff);else S.clearTint();
  // the ringer's rope runs up to the beam while it swings
  if(e.k==='ringer'&&!e.dead&&(name==='move'||name==='swing_drop')){const top=Math.round(b.body.bottom-72);g.fillStyle(0x8a7a5a);g.fillRect(Math.round(b.x),top-90,1,90);g.fillStyle(0x5a4a3a);g.fillRect(Math.round(b.x)+1,top-90,1,90)}};
 const ds=SP.drawStory;SP.drawStory=function(g,ga,...a){const r=ds.call(this,g,ga,...a);for(const c of this.icicles||[]){const x=Math.round(c.x),y=Math.round(c.y);g.fillStyle(0x1a2a44);g.fillRect(x-2,y-9,5,8);g.fillStyle(0xd8f2ff);g.fillRect(x-1,y-9,3,6);g.fillStyle(0xffffff);g.fillRect(x,y-3,1,3)}return r};
})();
