// ASHEN VIGIL — the arsenal (dev2 lane): new melee movesets, shields that block, bows + crossbows, throwables, and old-world guns.
// Loaded last (after smith.js). Everything hooks Stage.prototype / NET by wrapping, so game.js is untouched:
//  - WEAPONS: katana, war halberd, whip, scythe, twinblade, sorcerer's catalyst (+ the existing dagger/spear/axe/staff); longbow,
//    light/heavy crossbow (type 'bow': shootArrow); guns (type 'gun'); shields (hand 'off', type 'shield').
//  - Guns: light = fire (one round from the magazine), hold heavy = reload (slow); empty mag auto-reloads from the shot pouch
//    (sv.ammo). DEX scaling via sc, smith +1..+5 via RPG.derive (smith.js), infusion (sv.wup[id].inf fire/frost/lightning) sets
//    the shot element. Rune pistol: no powder, costs FP per shot, heavy cycles its element (fire > frost > lightning).
//  - Shields: hold parry (V / U) to raise a guard: absorbs per shield, stamina drain by stability; buckler parries wider, tower
//    cannot parry but blocks everything in front, magic shield turns blocked hits into FP.
//  - Throwables: q2 slot (inventory), G throws, T cycles; counts in sv.thr.
//  - Co-op: every shot/throw is mirrored to the partner as a visual-only projectile ({t:'ars'}); damage stays host-authoritative
//    (the guest's hits go through damageEnemy -> {t:'dmg'}).
//  - Obtainable: gear drops/chests (GEAR_POOL), drop tables (ammo, knives, bombs), in-level merchants (MERCH_STOCK).
'use strict';
const ARS={
 MELEE:{
  katana:{name:'ASHEN KATANA',type:'sword',hand:'main',base:.95,req:{str:9,dex:14},sc:{str:'E',dex:'A'},w:3,swL:11,crit:1.3,
   light:{t:.26,h0:.06,h1:.13,reach:14,w:24,h:14,mul:1,cost:14,lunge:60,n:3,arc:{r:17,th:2,sweep:150,trail:1}},
   heavy:{t:.5,h0:.16,h1:.3,reach:16,w:48,h:12,mul:1.9,cost:26,lunge:170,stab:1,poise:1}},// iaido dash-cut
  warhalberd:{name:'WATCH HALBERD',type:'spear',hand:'main',base:1.3,req:{str:14,dex:10},sc:{str:'B',dex:'D'},w:6,swL:17,
   light:{t:.44,h0:.14,h1:.22,reach:24,w:30,h:10,mul:1,cost:22,lunge:40,n:2,stab:1},
   heavy:{t:.74,h0:.3,h1:.44,reach:10,w:60,h:26,mul:2,cost:34,lunge:20,aoe:1,poise:3,arc:{r:26,th:4,sweep:220,trail:1}}},
  whip:{name:'BELLROPE WHIP',type:'sword',hand:'main',base:.7,req:{str:6,dex:12},sc:{str:'E',dex:'B'},w:2,swL:20,
   light:{t:.4,h0:.18,h1:.24,reach:30,w:40,h:8,mul:1,cost:14,lunge:0,n:2,arc:{r:30,th:1,sweep:120,trail:1}},
   heavy:{t:.6,h0:.26,h1:.4,reach:0,w:76,h:16,mul:1.5,cost:24,lunge:0,aoe:1,arc:{r:36,th:1,sweep:340,trail:1}}},
  scythe:{name:'GRAVE SCYTHE',type:'axe',hand:'main',base:1.15,req:{str:12,dex:12},sc:{str:'C',dex:'C'},w:5,swL:16,
   light:{t:.48,h0:.16,h1:.28,reach:16,w:36,h:22,mul:1,cost:22,lunge:20,n:2,aoe:1,arc:{r:22,th:3,sweep:260,trail:1}},
   heavy:{t:.8,h0:.3,h1:.5,reach:0,w:64,h:28,mul:1.9,cost:34,lunge:0,aoe:1,spin:1,poise:2,arc:{r:26,th:4,sweep:360,trail:1}}},
  twinblade:{name:'VIGIL TWINBLADE',type:'sword',hand:'main',base:.85,req:{str:10,dex:13},sc:{str:'D',dex:'B'},w:4,swL:12,
   light:{t:.3,h0:.06,h1:.2,reach:0,w:40,h:18,mul:1,cost:16,lunge:30,n:3,aoe:1,arc:{r:18,th:3,sweep:330,trail:1}},
   heavy:{t:.62,h0:.12,h1:.46,reach:0,w:52,h:22,mul:1.6,cost:28,lunge:120,aoe:1,spin:1,poise:2,arc:{r:22,th:3,sweep:360,trail:1}}},
  catalyst:{name:'SORCERER\'S CATALYST',type:'staff',hand:'main',base:.4,req:{int:12},sc:{int:'C'},w:1.5,swL:8,cat:1,buff:180,csc:'S',
   light:{t:.32,h0:.1,h1:.16,reach:10,w:18,h:14,mul:1,cost:12,lunge:10,n:1},heavy:{t:.5,h0:.2,h1:.28,reach:10,w:20,h:18,mul:1.4,cost:20,lunge:20}}},
 RANGED:{
  longbow:{name:'WATCH LONGBOW',type:'bow',hand:'main',base:.95,req:{str:9,dex:14},sc:{str:'E',dex:'A'},w:3,swL:0,
   light:{t:.5,h0:.24,h1:.25,mul:1,cost:14,arrow:380},heavy:{t:.95,h0:.75,h1:.76,mul:2.3,cost:26,arrow:480,pierce:1}},
  lightxbow:{name:'LIGHT CROSSBOW',type:'bow',hand:'main',base:1.1,req:{str:10,dex:10},sc:{str:'D',dex:'C'},w:3.5,swL:0,xbow:1,
   light:{t:.9,h0:.08,h1:.09,mul:1,cost:10,arrow:520},heavy:{t:1.2,h0:.1,h1:.11,mul:1.2,cost:12,arrow:560,pierce:1}},// fires at once, long reload
  heavyxbow:{name:'SIEGE ARBALEST',type:'bow',hand:'main',base:1.7,req:{str:16,dex:10},sc:{str:'C',dex:'D'},w:7,swL:0,xbow:1,
   light:{t:1.4,h0:.1,h1:.11,mul:1,cost:14,arrow:600,pierce:1},heavy:{t:1.8,h0:.12,h1:.13,mul:1.4,cost:18,arrow:640,pierce:1}}},
 // guns: dmg = AR * mul per pellet; mag rounds; reload s; recoil px/s pushback; spd px/s; life s; elem optional; fp = rune cost
 GUNS:{
  flintlock:{name:'FLINTLOCK PISTOL',base:1.25,req:{dex:10},sc:{dex:'A'},w:2,gun:{mag:1,reload:1.4,pellets:1,spread:0,mul:1.4,spd:520,life:.55,recoil:90,shake:.008,fire:.32}},
  blunderbuss:{name:'BLUNDERBUSS',base:1.0,req:{str:10,dex:10},sc:{str:'D',dex:'B'},w:4,gun:{mag:1,reload:1.9,pellets:6,spread:.32,mul:.55,spd:420,life:.28,recoil:170,shake:.016,fire:.42}},
  handcannon:{name:'HAND CANNON',base:2.2,req:{str:16,dex:12},sc:{str:'C',dex:'B'},w:8,gun:{mag:1,reload:2.6,pellets:1,spread:0,mul:2.2,spd:360,life:.9,recoil:260,shake:.024,fire:.6,blast:28,pierce:1}},
  longrifle:{name:'LONG RIFLE',base:1.6,req:{dex:16},sc:{dex:'S'},w:5,gun:{mag:1,reload:2.2,pellets:1,spread:0,mul:2.0,spd:900,life:.7,recoil:120,shake:.012,fire:.5,pierce:1}},
  runepistol:{name:'RUNE PISTOL',base:.9,req:{dex:10,int:10},sc:{dex:'B',int:'C'},w:2,gun:{mag:6,reload:1.2,pellets:1,spread:.04,mul:.9,spd:480,life:.6,recoil:60,shake:.006,fire:.22,rune:1,fp:4}}},
 SHIELDS:{
  buckler:{name:'IRON BUCKLER',w:1.5,shield:{abs:.55,stab:30,parry:.16}},
  kite:{name:'KITE SHIELD',w:4,shield:{abs:.85,stab:55,parry:.1}},
  towershield:{name:'TOWER SHIELD',w:10,shield:{abs:1,stab:85,parry:0}},
  magicshield:{name:'WARDING AEGIS',w:3,shield:{abs:.7,stab:45,parry:.1,magic:1}}},
 THROWN:{
  tknife:{name:'THROWING KNIFE',col:0xd8d0e0,dmg:16,spd:420,g:60,per:5},
  firebomb:{name:'FIREBOMB',col:0xff7a2a,dmg:30,spd:115,g:420,blast:30,elem:'fire',per:3},
  frostjar:{name:'FROST JAR',col:0x9fd8ff,dmg:22,spd:115,g:420,blast:30,elem:'frost',per:3},
  boltjar:{name:'STORM JAR',col:0xfff08a,dmg:26,spd:115,g:420,blast:30,elem:'lightning',per:3}},
 ELEM:{fire:0xff7a2a,frost:0x9fd8ff,lightning:0xfff08a},
 AMMO_PACK:12,
 MERCH:[['ammo',300],['tknife',200],['firebomb',350],['frostjar',350],['boltjar',350],['flintlock',2400],['buckler',1200],['lightxbow',2200]],
 DROPS:{common:[['ammo',6],['tknife',3]],elite:[['ammo',10],['firebomb',4],['frostjar',3],['boltjar',3]],chest:[['ammo',12],['firebomb',5],['tknife',5]]}};
(()=>{
 for(const[id,W]of Object.entries(ARS.MELEE))WEAPONS[id]=W;
 for(const[id,W]of Object.entries(ARS.RANGED))WEAPONS[id]=W;
 for(const[id,G]of Object.entries(ARS.GUNS)){const gn=G.gun;WEAPONS[id]={name:G.name,type:'gun',hand:'main',base:G.base,req:G.req,sc:G.sc,w:G.w,swL:3,gun:gn,
  light:{t:gn.fire,h0:9,h1:9,mul:1,cost:4,lunge:0},heavy:{t:.2,h0:9,h1:9,mul:1,cost:0,lunge:0}}}
 for(const[id,S]of Object.entries(ARS.SHIELDS))WEAPONS[id]={name:S.name,type:'shield',hand:'off',base:0,req:{str:Math.round(S.w)+4},sc:{},w:S.w,shield:S.shield};
 const THROWN_=window.THROWN=window.THROWN||{};for(const[id,T]of Object.entries(ARS.THROWN))THROWN_[id]=T;
 for(const[id,T]of Object.entries(ARS.THROWN))CONSUMABLES[id]=CONSUMABLES[id]||{name:T.name,fx:'souls',col:T.col};
 CONSUMABLES.ammo=CONSUMABLES.ammo||{name:'SHOT POUCH',fx:'souls',col:0xb8a070};
 for(const id of['flintlock','buckler','lightxbow'])CONSUMABLES[id]=CONSUMABLES[id]||{name:WEAPONS[id].name,fx:'souls',col:0xd8c8a0};// merchant rows
 const NEW=[...Object.keys(ARS.MELEE),...Object.keys(ARS.RANGED),...Object.keys(ARS.GUNS),...Object.keys(ARS.SHIELDS)];
 if(typeof GEAR_POOL!=='undefined')for(const id of NEW)if(!GEAR_POOL.includes(id))GEAR_POOL.push(id);
 for(const[t,L]of Object.entries(ARS.DROPS))if(DROP_TABLES[t])for(const r of L)if(!DROP_TABLES[t].some(q=>q[0]===r[0]))DROP_TABLES[t].push(r);
 if(typeof MERCH_STOCK!=='undefined')for(const r of ARS.MERCH)if(!MERCH_STOCK.some(q=>q[0]===r[0]))MERCH_STOCK.push(r);
 if(typeof DESC!=='undefined'){for(const id of NEW)DESC[id]=DESC[id]||[WEAPONS[id].type==='gun'?'AN OLD-WORLD FIREARM. LOUD, SLOW TO LOAD.':WEAPONS[id].type==='shield'?'HOLD PARRY TO RAISE IT.':'A WEAPON OF THE OLD WATCH.',WEAPONS[id].name+'.'];
  for(const id of[...Object.keys(ARS.THROWN),'ammo'])DESC[id]=DESC[id]||[CONSUMABLES[id].name+'.','THROWN WITH G. T PICKS THE NEXT ONE.']}
})();
if(typeof Stage!=='undefined'){const SP=Stage.prototype;
 const sv0=s=>{const sv=s.sv;sv.thr=sv.thr||{};sv.ammo=sv.ammo??0;sv.gmag=sv.gmag||{};return sv};
 SP.arsElem=function(id){const W=WEAPONS[id],u=(this.sv.wup||{})[id]||{};if(W&&W.gun&&W.gun.rune)return this.sv.rune||'fire';return['fire','frost','lightning'].includes(u.inf)?u.inf:null};
 // ---- items into the save (drops, merchant, co-op dgot) ----
 const td=SP.takeDrop;SP.takeDrop=function(d){const k=d&&d.kind,sv=sv0(this);
  if(k==='ammo'||ARS.THROWN[k]||(WEAPONS[k]&&ARS.MERCH.some(r=>r[0]===k))){
   if(k==='ammo'){sv.ammo+=ARS.AMMO_PACK;this.pop('+'+ARS.AMMO_PACK+' SHOT',d.x,d.y-24,0xb8a070)}
   else if(ARS.THROWN[k]){sv.thr[k]=(sv.thr[k]||0)+ARS.THROWN[k].per;if(!sv.inv.includes(k))sv.inv.push(k);if(!sv.eq.q2)sv.eq.q2=k;this.pop(ARS.THROWN[k].name+' x'+ARS.THROWN[k].per,d.x,d.y-24,ARS.THROWN[k].col)}
   else{if(!sv.inv.includes(k))sv.inv.push(k);this.pop(WEAPONS[k].name,d.x,d.y-24,0xffe2a8)}
   sv.looted=(sv.looted||0)+1;/* a world pickup is loot (the merchant restores the count for purchases) */this.sfx('pickup',.4);Save.write(sv);return}
  return td.call(this,d)};
 if(SP.merchRows){const mr=SP.merchRows;SP.merchRows=function(){return mr.call(this).filter(([id])=>!(WEAPONS[id]&&this.sv.inv.includes(id)))}}
 // ---- build: shield parry window ----
 const ab=SP.applyBuild;SP.applyBuild=function(...a){const r=ab.apply(this,a);const S=WEAPONS[this.sv.eq&&this.sv.eq.off];if(TUNE.parryWin0==null)TUNE.parryWin0=TUNE.parryWin;TUNE.parryWin=S&&S.shield?S.shield.parry:TUNE.parryWin0;sv0(this);return r};
 // ---- input: G throw, T cycle throwable, hold V/U guard ----
 const ri=SP.readInput;SP.readInput=function(){const o=ri.call(this)||{};const K=this.keys;if(!window.__inp&&K){if(Phaser.Input.Keyboard.JustDown(K.G))o.throwP=1;if(Phaser.Input.Keyboard.JustDown(K.T))o.thrCyc=1;o.guard=K.V.isDown||K.U.isDown}return o};
 // ---- guns: fire / reload instead of a swing ----
 const sa=SP.startAtk;SP.startAtk=function(hv,combo,on){const W=this.wp;if(!W||!W.gun)return sa.call(this,hv,combo,on);const P=this.player,G=W.gun,id=this.sv.eq.main,sv=sv0(this),A=this.ars||(this.ars={});
  if(A.reload>0){this.pop('RELOADING',P.x,P.y-26,0xb8a070);return}
  if(hv){if(G.rune){const L=['fire','frost','lightning'];sv.rune=L[(L.indexOf(sv.rune||'fire')+1)%3];this.pop('RUNE: '+sv.rune.toUpperCase(),P.x,P.y-26,ARS.ELEM[sv.rune]);this.sfx('chime',.3);return}return this.gunReload(id)}
  const mag=sv.gmag[id]??G.mag;
  if(G.rune){if(P.fp<G.fp){this.pop('NO FP',P.x,P.y-24,0x6ab8ff);return}P.fp-=G.fp}
  else if(mag<=0){this.sfx('clang',.15);this.pop('CLICK',P.x,P.y-24,0xb8a070);return this.gunReload(id)}
  if(!G.rune)sv.gmag[id]=mag-1;sa.call(this,false,0,on);P.hitDone=true;this.gunFire(W,id);if(!G.rune&&sv.gmag[id]<=0&&sv.ammo>0)this.time.delayedCall(Math.round(G.fire*1000)+60,()=>{if(this.player&&!this.player.dead)this.gunReload(id)})};
 SP.gunReload=function(id){const W=WEAPONS[id],G=W.gun,sv=sv0(this),P=this.player,A=this.ars||(this.ars={});if(G.rune)return;const have=sv.gmag[id]||0;if(have>=G.mag){return}
  if(sv.ammo<=0){this.pop('NO SHOT',P.x,P.y-24,0xd8402a);return}A.reload=G.reload;A.reloadId=id;A.reloadT0=G.reload;this.sfx('roll',.25);this.stats.reloads=(this.stats.reloads||0)+1};
 SP.gunFire=function(W,id){const P=this.player,G=W.gun,f=P.f,el=this.arsElem(id),dmg=this.build.ar*G.mul*(P.bless>0?P.blessMul:1);
  for(let i=0;i<G.pellets;i++){const a=(G.pellets>1?(i/(G.pellets-1)-.5)*2*G.spread:0)+(Math.random()-.5)*G.spread*.3;this.arsShot({k:'bullet',x:P.x+f*12,y:P.y-11,vx:Math.cos(a)*G.spd*f,vy:Math.sin(a)*G.spd,dmg,life:G.life,pierce:G.pierce,blast:G.blast,elem:el})}
  this.pb.setVelocityX(-f*G.recoil);P.recoil=.12;this.cam.shake(120+G.recoil,G.shake);this.hitstop&&G.recoil>150&&this.hitstop(.04);
  (this.arsFx||(this.arsFx=[])).push({k:'flash',x:P.x+f*14,y:P.y-11,f,t:0,big:G.pellets>1||G.recoil>150?1:0,col:el?ARS.ELEM[el]:0xffd070});
  for(let i=0;i<5;i++)this.arsFx.push({k:'smoke',x:P.x+f*(14+i*3),y:P.y-12,vx:f*(20+i*10),vy:-8-i*3,t:0,r:2+i});this.sfx('shot',.6);this.sfx('slam',.2);this.stats.shots=(this.stats.shots||0)+1};
 // ---- throwables ----
 SP.throwItem=function(){const sv=sv0(this),P=this.player;let id=sv.eq.q2;if(!id||!(sv.thr[id]>0))id=Object.keys(ARS.THROWN).find(k=>sv.thr[k]>0);if(!id){this.pop('NOTHING TO THROW',P.x,P.y-24,0xa89880);return false}
  const T=ARS.THROWN[id];sv.thr[id]--;sv.eq.q2=id;const dex=(sv.stats&&sv.stats.dex)||10;
  this.arsShot({k:id,x:P.x+P.f*8,y:P.y-14,vx:P.f*T.spd,vy:T.g>100?-150:-10,g:T.g,dmg:T.dmg*(1+dex/40),life:1.6,blast:T.blast,elem:T.elem});Save.write(sv);this.sfx('roll',.3);this.stats.throws=(this.stats.throws||0)+1;return true};
 SP.thrCycle=function(){const sv=sv0(this),L=Object.keys(ARS.THROWN).filter(k=>sv.thr[k]>0);if(!L.length)return;sv.eq.q2=L[(L.indexOf(sv.eq.q2)+1)%L.length];this.pop(ARS.THROWN[sv.eq.q2].name+' x'+sv.thr[sv.eq.q2],this.player.x,this.player.y-26,ARS.THROWN[sv.eq.q2].col)};
 // ---- projectiles (own list; mirrored to the partner as visual-only) ----
 SP.arsShot=function(p,fromNet){const L=this.arsP||(this.arsP=[]);p={t:0,hit:[],...p};if(fromNet)p.vis=1;L.push(p);if(!fromNet&&NET.linked&&NET.linked())NET.send({t:'ars',p:{k:p.k,x:Math.round(p.x),y:Math.round(p.y),vx:Math.round(p.vx),vy:Math.round(p.vy),g:p.g||0,life:p.life,blast:p.blast||0,elem:p.elem||null}});return p};
 SP.arsHitE=function(e,n,dir,el){this.damageEnemy(e,e.state==='stag'?n*TUNE.ripMul:n,dir);if(el==='frost')e.slowT=Math.max(e.slowT||0,3);else if(el==='lightning'&&!e.dead){e.state='stag';e.t=0}else if(el==='fire')e.burn=2};
 SP.arsBlast=function(p){const R=p.blast;this.fx.fire&&p.elem==='fire'&&this.fx.fire(p.x,p.y,10,4,1.2);this.fx.spark(p.x,p.y,18,ARS.ELEM[p.elem]||0xffd070,140,20);this.cam.shake(140,.012);this.sfx('slam',.35);
  (this.arsFx||(this.arsFx=[])).push({k:'boom',x:p.x,y:p.y,t:0,R,col:ARS.ELEM[p.elem]||0xffb050});if(p.vis)return;
  const hs=new Set();for(const e of this.enemies){if(e.dead||hs.has(e))continue;const bb=e.b.body;if(Math.abs(bb.center.x-p.x)<R&&Math.abs(bb.center.y-p.y)<R){hs.add(e);this.arsHitE(e,p.dmg,Math.sign(bb.center.x-p.x)||1,p.elem)}}
  const B=this.boss;if(B&&this.bossState==='fight'&&Math.abs(B.x-p.x)<R+8&&Math.abs(B.y-16-p.y)<R+16)this.damageBoss(p.dmg)};
 SP.arsStep=function(dt){const n=Math.max(1,Math.ceil(Math.max(0,...(this.arsP||[]).map(p=>Math.abs(p.vx)))*dt/6));for(let k=0;k<n;k++)this.arsSub(dt/n);this.arsAfter(dt)};// sub-steps of <=6 px so fast shots never tunnel through a target
 SP.arsSub=function(dt){const L=this.arsP;if(L)for(let i=L.length-1;i>=0;i--){const p=L[i];p.t+=dt;p.x+=p.vx*dt;p.vy+=(p.g||0)*dt;p.y+=p.vy*dt;
   let gone=p.t>p.life||(this.lv&&this.lv.kAt(p.x,p.y)===K_SOLID)||p.y>GY+2&&p.g>100;
   if(!gone&&!p.vis){for(const e of this.enemies){if(e.dead||p.hit.includes(e))continue;const bb=e.b.body;if(Math.abs(bb.center.x-p.x)<bb.width/2+2&&Math.abs(bb.center.y-p.y)<bb.height/2+2){p.hit.push(e);if(p.blast){gone=true;break}this.arsHitE(e,p.dmg,Math.sign(p.vx)||1,p.elem);if(!p.pierce){gone=true;break}}}
    const B=this.boss;if(!gone&&B&&this.bossState==='fight'&&!p.hit.includes(B)&&Math.abs(B.x-p.x)<12&&p.y>B.y-44&&p.y<B.y){p.hit.push(B);if(!p.blast)this.damageBoss(p.dmg*1.2);if(!p.pierce||p.blast)gone=true}
    for(const c of this.chests||[])if(!gone&&c.st==='awake'&&Math.abs(c.hx-p.x)<10&&Math.abs(c.y-6-p.y)<12){this.hitMimic(c,p.dmg);gone=true}}
   if(gone){if(p.blast)this.arsBlast(p);else this.fx.spark(p.x,p.y,5,ARS.ELEM[p.elem]||0xffe2a8,60);L.splice(i,1)}}
 };
 SP.arsAfter=function(dt){
  for(const e of this.enemies)if(e.burn>0&&!e.dead){e.burn-=dt;if(Math.random()<.4)this.fx.fire&&this.fx.fire(e.b.x,e.b.y,1,2,.6);e.burnT=(e.burnT||0)+dt;if(e.burnT>.5){e.burnT=0;if(!NET.guest())this.damageEnemy(e,2+this.build.ar*.6,0)}}
  const F=this.arsFx;if(F)for(let i=F.length-1;i>=0;i--){const q=F[i];q.t+=dt;if(q.k==='smoke'){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=.92}if(q.t>(q.k==='smoke'?.7:q.k==='boom'?.35:.16))F.splice(i,1)}};
 const ua=SP.updateArrows;SP.updateArrows=function(dt){const n=Math.max(1,Math.ceil(Math.max(0,...(this.arrows||[]).map(a=>Math.abs(a.vx)))*dt/6));for(let k=0;k<n;k++)ua.call(this,dt/n);// crossbow bolts / lightning spear: sub-step so they can't tunnel
  const P=this.player,inp=this.inp||{},A=this.ars||(this.ars={}),sv=sv0(this);
  if(A.reload>0){A.reload-=dt;if(A.reload<=0){const W=WEAPONS[A.reloadId],n=Math.min(W.gun.mag-(sv.gmag[A.reloadId]||0),sv.ammo);sv.ammo-=n;sv.gmag[A.reloadId]=(sv.gmag[A.reloadId]||0)+n;Save.write(sv);this.sfx('clang',.3);this.pop('LOADED',P.x,P.y-26,0xb8a070)}}
  if(P&&!P.dead&&!this.menu){if(inp.throwP&&!['roll','hurt','rest','drink'].includes(P.state))this.throwItem();if(inp.thrCyc)this.thrCycle();
   const S=WEAPONS[sv.eq.off];P.guard=!!(inp.guard&&S&&S.shield&&!['roll','rollrec','atk','cast','hurt','rest','drink'].includes(P.state)&&P.st>0);if(P.guard){this.pb.setVelocityX(this.pb.body.velocity.x*.5)}}
  this.arsStep(dt)};
 // ---- shields: guard absorbs hits from the front ----
 const hp=SP.hurtPlayer;SP.hurtPlayer=function(n,src,att){const P=this.player,S=WEAPONS[this.sv.eq&&this.sv.eq.off];
  if(P&&P.guard&&S&&S.shield&&P.inv<=0&&!P.dead&&(Math.sign(src-P.x)||P.f)===P.f&&!(this._inE&&this._eRemote)){const sh=S.shield,cost=n*1.2*(1-sh.stab/100)+4;
   this.spend(cost);this.stats.blocks=(this.stats.blocks||0)+1;this.fx.spark(P.x+P.f*8,P.y-10,10,sh.magic?0xb8a8ff:0xffffff,110);this.sfx('parry',.25);this.pb.setVelocityX(-P.f*60);
   if(sh.magic)P.fp=Math.min(P.fpMax,P.fp+n*.3);
   if(P.st<=0){P.guard=false;this.pop('GUARD BROKEN',P.x,P.y-24,0xd8402a);return hp.call(this,n*.5,src,att)}
   const left=n*(1-sh.abs);if(left<1){P.inv=.25;this.pop('BLOCK',P.x,P.y-24,0x9fb8e8);return false}return hp.call(this,left,src,att)}
  return hp.call(this,n,src,att)};
 // ---- drawing (after the scene, before lights) ----
 const rl=SP.renderLights;SP.renderLights=function(...a){try{this.arsDraw(this.gn,this.ga)}catch(e){}return rl.apply(this,a)};
 SP.arsDraw=function(g,ga){const P=this.player,W=this.wp;
  if(P&&!P.dead&&W&&W.gun){const f=P.f,x=Math.round(P.x+f*4-(P.recoil>0?f*2:0)),y=Math.round(P.y-12-(P.recoil>0?1:0)),L=W.gun.pellets>1?9:W.gun.recoil>200?11:W.gun.spd>800?14:W.gun.rune?8:8;P.recoil=(P.recoil||0)-(this.dt||.016);
   g.fillStyle(0x5a3a1c);g.fillRect(f>0?x-3:x,y,4,3);g.fillStyle(W.gun.rune?0x6a5aa0:0x3a3a44);g.fillRect(f>0?x:x-L,y-1,L,2);if(W.gun.pellets>1){g.fillRect(f>0?x+L-2:x-L-1,y-2,3,4)}if(W.gun.recoil>200){g.fillStyle(0x2a2a30);g.fillRect(f>0?x:x-L,y-2,L,4)}}
  if(P&&P.guard){const S=WEAPONS[this.sv.eq.off],h=S.shield.abs>=1?16:S.shield.parry>.12?7:12,x=Math.round(P.x+P.f*7);g.fillStyle(S.shield.magic?0x6a5ab8:0x7a6a58);g.fillRect(x-1,Math.round(P.y-6-h),3,h);g.fillStyle(0xd8c8a0);g.fillRect(x-1,Math.round(P.y-6-h),3,1);if(S.shield.magic)glow(ga,x,P.y-12,10,0xb8a8ff,.2)}
  for(const p of this.arsP||[]){const x=Math.round(p.x),y=Math.round(p.y),d=Math.sign(p.vx)||1;
   if(p.k==='bullet'){const c=p.elem?ARS.ELEM[p.elem]:0xfff0c0;g.fillStyle(c);g.fillRect(x-d*3,y,4,1);px(ga,x,y,0xffffff);glow(ga,x,y,4,c,.25)}
   else if(p.k==='tknife'){g.fillStyle(0xd8d0e0);g.fillRect(x-d*3,y,5,1);px(g,x-d*3,y-1,0x5a3a1c)}
   else{const c=ARS.THROWN[p.k]?ARS.THROWN[p.k].col:0xffffff;g.fillStyle(0x3a2a20);g.fillRect(x-2,y-2,5,5);g.fillStyle(c);g.fillRect(x-1,y-1,3,3);px(ga,x,y-4,0xffe080)}}
  for(const q of this.arsFx||[]){const x=Math.round(q.x),y=Math.round(q.y);
   if(q.k==='flash'){const s=q.big?9:6;ga.fillStyle(q.col,.95);ga.fillRect(q.f>0?x:x-s*2,y-s/2,s*2,s);ga.fillStyle(0xffffff,1);ga.fillRect(q.f>0?x:x-s,y-2,s,4);ga.fillRect(q.f>0?x+s:x-s-4,y-s,4,s*2);glow(ga,x+q.f*s,y,s*2,q.col,.5);this.light(x,y,60,q.col,1)}
   else if(q.k==='smoke'){g.fillStyle(0x8a8478,Math.max(0,.5-q.t*.7));g.fillRect(x-q.r,y-q.r,q.r*2,q.r*2)}
   else if(q.k==='boom'){const r=Math.round(q.R*(.4+q.t*2));ga.fillStyle(q.col,Math.max(0,.6-q.t*1.6));ga.fillRect(x-r,y-r,r*2,r*2);ga.fillStyle(0xffffff,Math.max(0,.6-q.t*2));ga.fillRect(x-r/2,y-r/2,r,r);this.light(x,y,70,q.col,1)}}
  // HUD: ammo / mag and throwable
  if(P){const sv=this.sv;let s='';if(W&&W.gun)s=W.gun.rune?'RUNE '+(sv.rune||'fire').toUpperCase():'MAG '+(sv.gmag&&sv.gmag[sv.eq.main]||0)+'/'+W.gun.mag+'  SHOT '+(sv.ammo||0)+((this.ars&&this.ars.reload>0)?'  RELOADING':'');
   const q=sv.eq&&sv.eq.q2,tn=q&&sv.thr&&sv.thr[q];if(tn)s+=(s?'  ':'')+'G '+ARS.THROWN[q].name+' x'+tn;if(s){const cx=this.cam.scrollX,cy=this.cam.scrollY;drawText(g,s,Math.round(cx+6),Math.round(cy+52),0xd8c8a0)}}};
 // ---- co-op: mirror shots/throws as visuals ----
 if(typeof NET!=='undefined'){const nr=NET.recv;NET.recv=function(d){if(d&&d.t==='ars'){const S=this.scene;if(S&&S.sys&&S.sys.isActive()&&S.arsShot){S.arsShot({...d.p},1);S.stats.arsNet=(S.stats.arsNet||0)+1}return}return nr.call(this,d)}}
}
if(typeof module!=='undefined')module.exports={ARS};
