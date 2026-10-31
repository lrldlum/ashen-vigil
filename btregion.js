// ASHEN VIGIL — Bell Tower region (stage_identity_plan: vertical climb). Loaded after ow1.js.
// The Frozen Bell Tower grows a 4-screen shaft above the bonfire (x 1660-2020, up to y -760), climbed on short ice ledges:
// - Bell tolls: the great bell at the top tolls every 4.5 s; its ring sweeps down the shaft and knocks a standing hero off
//   the ledge (roll through it to keep your footing) and shatters the hanging icicles, which fall and freeze into ledges below for 7 s.
// - Ice ledges slide: momentum carries on, you stop slowly.
// - Frost Ringer [mini-boss]: swings across the shaft on a rope from the beam and drops icicles (swing_drop), stays dead.
'use strict';
const BT_SHAFT={x0:1660,x1:2020,top:-760,bellY:-736,period:4.5};window.BT_SHAFT=BT_SHAFT;
(()=>{const D=STAGE_DEFS.belltower;if(!D)return;D.top=BT_SHAFT.top-20;
 // zigzag ledges every 34 px: 25 steps from the ground to the belfry; every third is ice; icicles hang under some
 const L=[];let y=124,i=0;while(y>BT_SHAFT.top+40){const left=i%2===0,cx=(BT_SHAFT.x0+BT_SHAFT.x1)/2+(i%2?-(i%6):(i%6));const x=left?cx-76:cx;L.push({x,y,w:i%4===3?64:56,ice:i%3===1,ici:i%5===2});y-=30;i++}
 D.shaft=L;D.plats=[...(D.plats||[]),...L.map(p=>[p.x,p.y,p.w]),[BT_SHAFT.x0+120,BT_SHAFT.top+40,120]];
 D.lore=[...(D.lore||[]),{id:'b4',x:BT_SHAFT.x0+180,y:BT_SHAFT.top+40}];
 D.enemies=D.enemies.filter(e=>!(e[0]==='ringer'&&e[1]===1960));
 if(typeof CHESTS!=='undefined'&&CHESTS.belltower&&!CHESTS.belltower.some(c=>c.id==='ch_b6'))CHESTS.belltower.push({id:'ch_b6',x:BT_SHAFT.x0+150,y:BT_SHAFT.top+40});
 if(typeof LORE!=='undefined')LORE.b4=['THE GREAT BELL HAS NO ROPE. IT TOLLS BECAUSE','THE COLD ASKS IT TO. EVERY TOLL TAKES A STEP','FROM THE STAIR, AND GIVES ONE BACK IN ICE.'];
 if(typeof ROOM_CUTS!=='undefined')ROOM_CUTS.belltower=[0,560,1100,BT_SHAFT.x0,BT_SHAFT.x1,2500,2860]})();
(()=>{const SP=Stage.prototype;
 const cr=SP.create;SP.create=function(...a){const r=cr.apply(this,a);this.bt=null;if(this.sid==='belltower')try{this.btInit()}catch(e){console.warn('bt',e)}return r};
 SP.btInit=function(){const D=this.def;this.bt={t:1.5,waves:[],tolls:0,knocks:0,shatter:0,ici:D.shaft.filter(p=>p.ici).map(p=>({x:p.x+p.w/2,y:p.y+7,st:'hang',re:0})),chunks:[],lastVx:0};
  // the Frost Ringer mini-boss swings across the middle of the shaft (stays dead in the save)
  const sv=this.sv;sv.mbDead=sv.mbDead||{};if(!sv.mbDead.bt_ringer){// guest spawns it too: snapshots map enemies by index
  const cy=-380;const e=this.spawnEnemy('ringer',(BT_SHAFT.x0+BT_SHAFT.x1)/2,cy+40);e.b.body.setAllowGravity(false);e.swing={cx:(BT_SHAFT.x0+BT_SHAFT.x1)/2,y:cy,A:120,t:0};e.hp=e.hpMax=40*this.ngMul;e.mb='bt_ringer';e.souls=1200*(1+this.ng)}};
 SP.btOnLedge=function(){const P=this.player;if(!this.pb.body.blocked.down)return null;for(const p of this.def.shaft)if(P.x>=p.x-2&&P.x<=p.x+p.w+2&&Math.abs(P.y-p.y)<3)return p;for(const c of this.bt.chunks)if(P.x>=c.x-2&&P.x<=c.x+c.w+2&&Math.abs(P.y-c.y)<3)return{ice:1,chunk:1};return null};
 SP.btStep=function(dt){const B=this.bt,P=this.player,pb=this.pb;if(!B||!P)return;
  // tolls: a ring sweeping down from the bell at 260 px/s
  B.t-=dt;if(B.t<=0){B.t=BT_SHAFT.period;B.tolls++;B.waves.push({y:BT_SHAFT.bellY,hit:0});if(Math.abs(P.x-(BT_SHAFT.x0+BT_SHAFT.x1)/2)<400){this.sfx('bell',.45);this.cam.shake(160,.006)}}
  for(let i=B.waves.length-1;i>=0;i--){const w=B.waves[i];const y0=w.y;w.y+=260*dt;
   for(const c of B.ici)if(c.st==='hang'&&c.y>y0&&c.y<=w.y){c.st='fall';c.vy=0;B.shatter++}
   if(!w.hit&&P.y>y0&&P.y<=w.y+4&&P.x>BT_SHAFT.x0-20&&P.x<BT_SHAFT.x1+20){w.hit=1;
    if(P.state!=='roll'&&pb.body.blocked.down&&!P.dead){const dir=P.x<(BT_SHAFT.x0+BT_SHAFT.x1)/2?1:-1;pb.setVelocity(dir*190,-120);P.state='hurt';P.hurtT=.25;B.knocks++;this.pop('KNOCKED',P.x,P.y-26,0x9fd8ff)}}
   if(w.y>160)B.waves.splice(i,1)}
  // icicles fall, then freeze into a ledge where they land (7 s), then grow back on the beam
  for(const c of B.ici){if(c.st==='fall'){c.vy+=600*dt;c.y+=c.vy*dt;const fy=this.btFloorBelow(c.x,c.y-c.vy*dt);
    if(Math.abs(P.x-c.x)<5&&c.y>P.y-24&&c.y<P.y&&P.inv<=0)this.hurtPlayer(10,c.x);
    if(fy!=null&&c.y>=fy-6){c.st='gone';c.re=9;this.btChunk(c.x,fy-12);this.fx.shard(c.x,fy-6,8,80)}else if(c.y>200){c.st='gone';c.re=9}}
   else if(c.st==='gone'){c.re-=dt;if(c.re<=0){c.st='hang';c.y=c.y0??c.y;}}}
  for(let i=B.chunks.length-1;i>=0;i--){const k=B.chunks[i];k.t-=dt;if(k.t<=0){k.r.destroy();k.col.destroy();k.img.destroy();B.chunks.splice(i,1)}}
  // ice: keep momentum
  const L=this.btOnLedge();if(L&&L.ice){const vx=pb.body.velocity.x,lv=B.lastVx;if(Math.abs(vx)<Math.abs(lv))pb.setVelocityX(lv*Math.pow(.25,dt));B.slid=(B.slid||0)+(Math.abs(vx)<1&&Math.abs(lv)>5?1:0)}B.lastVx=pb.body.velocity.x;
  // ringer swing
  for(const e of this.enemies)if(e.swing&&!e.dead&&!NET.guest()){const s=e.swing;s.t+=dt*(e.slowT>0?.5:1);e.b.setVelocity(0,0);e.b.x=s.cx+Math.sin(s.t*1.1)*s.A;e.b.y=s.y+Math.abs(Math.cos(s.t*1.1))*14;e.f=Math.cos(s.t*1.1)>0?1:-1;e.state='chase'}
   else if(e.swing&&e.dead&&e.mb&&!this.sv.mbDead[e.mb]){this.sv.mbDead[e.mb]=1;this.sv.embers=(this.sv.embers||0)+2;Save.write(this.sv);this.say('FROST RINGER FELLED - 2 EMBER SHARDS',2.5);this.stats.mbKills=(this.stats.mbKills||0)+1}};
 SP.btFloorBelow=function(x,y){let best=null;for(const p of this.def.shaft)if(x>=p.x&&x<=p.x+p.w&&p.y>=y&&(best==null||p.y<best))best=p.y;return best??GY};
 SP.btChunk=function(x,y){const w=20;const r=this.add.rectangle(x,y+3,w,6).setVisible(false);this.physics.add.existing(r,true);r.body.checkCollision.down=r.body.checkCollision.left=r.body.checkCollision.right=false;
  const col=this.physics.add.collider(this.pb,r);const img=this.add.tileSprite(x-w/2,y,w,8,'plat_belltower').setOrigin(0).setDepth(1).setTint(0xd8f2ff);this.bt.chunks.push({x:x-w/2,y,w,t:7,r,col,img})};
 const up=SP.update;SP.update=function(t,dms){const r=up.call(this,t,dms);if(this.bt&&!this.paused&&!this.menu)this.btStep(Math.min(.05,(dms||16)/1000));return r};
 const ds=SP.drawStory;SP.drawStory=function(g,ga,...a){const r=ds.call(this,g,ga,...a);const B=this.bt;if(!B)return r;const cx=(BT_SHAFT.x0+BT_SHAFT.x1)/2,by=BT_SHAFT.bellY;
  // tower walls either side of the shaft (flat stone courses)
  for(const wx of[BT_SHAFT.x0-14,BT_SHAFT.x1+2]){g.fillStyle(0x1a2438);g.fillRect(wx,BT_SHAFT.top-20,12,124-BT_SHAFT.top+20);g.fillStyle(0x2c3a58);for(let y=BT_SHAFT.top-20;y<124;y+=10)g.fillRect(wx+((y/10)%2?0:6),y,6,1);g.fillStyle(0x9fb8d8);g.fillRect(wx+(wx<BT_SHAFT.x0?11:0),BT_SHAFT.top-20,1,124-BT_SHAFT.top+20)}
  // the great bell (flat pixel, swings on a toll)
  const sw=Math.round(Math.sin((BT_SHAFT.period-B.t)*9)*Math.max(0,1-(BT_SHAFT.period-B.t))*4);g.fillStyle(0x3a2a1a);g.fillRect(BT_SHAFT.x0+40,by-14,BT_SHAFT.x1-BT_SHAFT.x0-80,4);
  g.fillStyle(0x6a7a96);g.fillRect(cx-10+sw,by-10,20,4);g.fillRect(cx-14+sw,by-6,28,14);g.fillRect(cx-18+sw,by+8,36,5);g.fillStyle(0xb8d0ec);g.fillRect(cx-12+sw,by-6,4,14);g.fillStyle(0x2a3048);g.fillRect(cx-2+sw*2,by+12,4,4);
  // toll rings: bold flat bands
  for(const w of B.waves){const y=Math.round(w.y);g.fillStyle(0xd8f2ff,.85);g.fillRect(BT_SHAFT.x0,y,BT_SHAFT.x1-BT_SHAFT.x0,2);g.fillStyle(0x6aa8e8,.7);g.fillRect(BT_SHAFT.x0,y-3,BT_SHAFT.x1-BT_SHAFT.x0,2);g.fillRect(BT_SHAFT.x0,y+3,BT_SHAFT.x1-BT_SHAFT.x0,1)}
  // ice ledges get a pale top, icicles hang/fall
  for(const p of this.def.shaft)if(p.ice){g.fillStyle(0xe8f8ff);g.fillRect(p.x,p.y,p.w,2);g.fillStyle(0x9fd8ff);for(let x=p.x+3;x<p.x+p.w;x+=9)g.fillRect(x,p.y+2,2,1)}
  for(const c of B.ici){if(c.y0==null)c.y0=c.y;if(c.st==='gone')continue;const x=Math.round(c.x),y=Math.round(c.y);g.fillStyle(0x1a2a44);g.fillRect(x-3,y-1,7,3);g.fillStyle(0xd8f2ff);g.fillRect(x-2,y,5,3);g.fillRect(x-1,y+3,3,3);g.fillStyle(0xffffff);g.fillRect(x,y+6,1,2)}
  return r};
})();
