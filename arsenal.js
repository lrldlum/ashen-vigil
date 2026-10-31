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
  warhalberd:{name:'WATCH HALBERD',type:'spear',hand:'main',base:1.6,req:{str:14,dex:10},sc:{str:'B',dex:'D'},w:6,swL:17,
   light:{t:.44,h0:.14,h1:.22,reach:24,w:30,h:10,mul:1,cost:22,lunge:40,n:2,stab:1},
   heavy:{t:.74,h0:.3,h1:.44,reach:10,w:60,h:26,mul:2,cost:34,lunge:20,aoe:1,poise:3,arc:{r:26,th:4,sweep:220,trail:1}}},
  whip:{name:'BELLROPE WHIP',type:'sword',hand:'main',base:.7,req:{str:6,dex:12},sc:{str:'E',dex:'B'},w:2,swL:20,
   light:{t:.4,h0:.18,h1:.24,reach:22,w:40,h:8,mul:.65,cost:20,lunge:0,n:2,arc:{r:30,th:1,sweep:120,trail:1}},
   heavy:{t:.6,h0:.26,h1:.4,reach:0,w:76,h:16,mul:1.5,cost:24,lunge:0,aoe:1,arc:{r:36,th:1,sweep:340,trail:1}}},
  scythe:{name:'GRAVE SCYTHE',type:'axe',hand:'main',base:1.15,req:{str:12,dex:12},sc:{str:'B',dex:'C'},w:5,swL:16,
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
  flintlock:{name:'FLINTLOCK PISTOL',base:1.25,req:{dex:10},sc:{dex:'A'},w:2,gun:{mag:1,reload:1.0,pellets:1,spread:0,mul:1.4,spd:520,life:.55,recoil:90,shake:.008,fire:.32}},
  blunderbuss:{name:'BLUNDERBUSS',base:1.0,req:{str:10,dex:10},sc:{str:'D',dex:'B'},w:4,gun:{mag:1,reload:1.9,pellets:6,spread:.22,mul:.9,spd:420,life:.28,recoil:170,shake:.016,fire:.42}},
  handcannon:{name:'HAND CANNON',base:2.2,req:{str:16,dex:12},sc:{str:'C',dex:'B'},w:8,gun:{mag:1,reload:2.6,pellets:1,spread:0,mul:2.2,spd:360,life:.9,recoil:260,shake:.024,fire:.6,blast:28,pierce:1}},
  longrifle:{name:'LONG RIFLE',base:1.6,req:{dex:16},sc:{dex:'S'},w:5,gun:{mag:1,reload:2.2,pellets:1,spread:0,mul:2.0,spd:900,life:.7,recoil:120,shake:.012,fire:.5,pierce:1}},
  runepistol:{name:'RUNE PISTOL',base:.9,req:{dex:10,int:10},sc:{dex:'B',int:'C'},w:2,gun:{mag:6,reload:1.2,pellets:1,spread:.04,mul:.6,spd:480,life:.6,recoil:60,shake:.006,fire:.22,rune:1,fp:7}}},
 SHIELDS:{
  buckler:{name:'IRON BUCKLER',w:1.5,shield:{abs:.55,stab:30,parry:.16}},
  kite:{name:'KITE SHIELD',w:4,shield:{abs:.85,stab:55,parry:.1}},
  towershield:{name:'TOWER SHIELD',w:10,shield:{abs:1,stab:85,parry:0}},
  magicshield:{name:'WARDING AEGIS',w:3,shield:{abs:.7,stab:45,parry:.1,magic:1}}},
 THROWN:{
  tknife:{name:'THROWING KNIFE',col:0xd8d0e0,mul:.6,spd:420,g:60,per:5},
  firebomb:{name:'FIREBOMB',col:0xff7a2a,mul:1.2,spd:115,g:420,blast:30,elem:'fire',per:3},
  frostjar:{name:'FROST JAR',col:0x9fd8ff,mul:1,spd:115,g:420,blast:30,elem:'frost',per:3},
  boltjar:{name:'STORM JAR',col:0xfff08a,mul:1.1,spd:115,g:420,blast:30,elem:'lightning',per:3}},
 ELEM:{fire:0xff7a2a,frost:0x9fd8ff,lightning:0xfff08a},
 AMMO_PACK:12,
 MERCH:[['ammo',300],['tknife',600],['firebomb',700],['frostjar',700],['boltjar',700],['flintlock',2400],['buckler',1200],['lightxbow',2200]],
 DROPS:{common:[['ammo',4],['tknife',1]],elite:[['ammo',8],['firebomb',2],['frostjar',2],['boltjar',2]],chest:[['ammo',10],['firebomb',3],['tknife',2]]}};
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
  this.arsShot({k:id,x:P.x+P.f*8,y:P.y-14,vx:P.f*T.spd,vy:T.g>100?-150:-10,g:T.g,dmg:this.arsThrowAR()*T.mul,thr:1,life:1.6,blast:T.blast,elem:T.elem});Save.write(sv);this.sfx('roll',.3);this.stats.throws=(this.stats.throws||0)+1;return true};
 SP.thrCycle=function(){const sv=sv0(this),L=Object.keys(ARS.THROWN).filter(k=>sv.thr[k]>0);if(!L.length)return;sv.eq.q2=L[(L.indexOf(sv.eq.q2)+1)%L.length];this.pop(ARS.THROWN[sv.eq.q2].name+' x'+sv.thr[sv.eq.q2],this.player.x,this.player.y-26,ARS.THROWN[sv.eq.q2].col)};
 // ---- projectiles (own list; mirrored to the partner as visual-only) ----
 SP.arsShot=function(p,fromNet){const L=this.arsP||(this.arsP=[]);p={t:0,hit:[],...p};if(fromNet)p.vis=1;L.push(p);if(!fromNet&&NET.linked&&NET.linked())NET.send({t:'ars',p:{k:p.k,x:Math.round(p.x),y:Math.round(p.y),vx:Math.round(p.vx),vy:Math.round(p.vy),g:p.g||0,life:p.life,blast:p.blast||0,elem:p.elem||null}});return p};
 SP.arsHitE=function(e,n,dir,el){this.damageEnemy(e,n,dir);this.arsStatus(e,el,3)};// r6: no riposte multiplier from projectiles
 SP.arsBlast=function(p){const R=p.blast;this.fx.fire&&p.elem==='fire'&&this.fx.fire(p.x,p.y,10,4,1.2);this.fx.spark(p.x,p.y,18,ARS.ELEM[p.elem]||0xffd070,140,20);this.cam.shake(140,.012);this.sfx('slam',.35);
  (this.arsFx||(this.arsFx=[])).push({k:'boom',x:p.x,y:p.y,t:0,R,col:ARS.ELEM[p.elem]||0xffb050});if(p.vis)return;
  const hs=new Set();for(const e of this.enemies){if(e.dead||e.parked||hs.has(e)||!this.arsInRoom(e.b.x))continue;const bb=e.b.body;if(Math.abs(bb.center.x-p.x)<R&&Math.abs(bb.center.y-p.y)<R){hs.add(e);this.arsHitE(e,p.dmg,Math.sign(bb.center.x-p.x)||1,p.elem)}}
  const B=this.boss;if(B&&this.bossState==='fight'&&Math.abs(B.x-p.x)<R+8&&Math.abs(B.y-16-p.y)<R+16)this.damageBoss(p.dmg*(p.thr?.5:1))};
 SP.arsStep=function(dt){const n=Math.max(1,Math.ceil(Math.max(0,...(this.arsP||[]).map(p=>Math.abs(p.vx)))*dt/6));for(let k=0;k<n;k++)this.arsSub(dt/n);this.arsAfter(dt)};// sub-steps of <=6 px so fast shots never tunnel through a target
 SP.arsSub=function(dt){const L=this.arsP;if(L)for(let i=L.length-1;i>=0;i--){const p=L[i];p.t+=dt;p.x+=p.vx*dt;p.vy+=(p.g||0)*dt;p.y+=p.vy*dt;
   let gone=p.t>p.life||!this.arsInRoom(p.x)||(this.lv&&this.lv.kAt(p.x,p.y)===K_SOLID)||p.y>GY+2&&p.g>100;
   if(!gone&&!p.vis){for(const e of this.enemies){if(e.dead||e.parked||p.hit.includes(e)||!this.arsInRoom(e.b.x))continue;const bb=e.b.body;if(Math.abs(bb.center.x-p.x)<bb.width/2+2&&Math.abs(bb.center.y-p.y)<bb.height/2+2){p.hit.push(e);if(p.blast){gone=true;break}this.arsHitE(e,p.dmg,Math.sign(p.vx)||1,p.elem);if(!p.pierce){gone=true;break}}}
    const B=this.boss;if(!gone&&B&&this.bossState==='fight'&&!p.hit.includes(B)&&Math.abs(B.x-p.x)<12&&p.y>B.y-44&&p.y<B.y){p.hit.push(B);if(!p.blast)this.damageBoss(p.dmg*(p.thr?.5:1.2));if(!p.pierce||p.blast)gone=true}
    for(const c of this.chests||[])if(!gone&&c.st==='awake'&&Math.abs(c.hx-p.x)<10&&Math.abs(c.y-6-p.y)<12){this.hitMimic(c,p.dmg);gone=true}}
   if(gone){if(p.blast)this.arsBlast(p);else this.fx.spark(p.x,p.y,5,ARS.ELEM[p.elem]||0xffe2a8,60);L.splice(i,1)}}
 };
 SP.arsAfter=function(dt){
  for(const e of this.enemies)if(e.burn>0&&!e.dead){e.burn-=dt;if(Math.random()<.4)this.fx.fire&&this.fx.fire(e.b.x,e.b.y,1,2,.6);e.burnT=(e.burnT||0)+dt;if(e.burnT>.5){e.burnT=0;if(!NET.guest()){const b=.15*this.build.ar;this.damageEnemy(e,b,0);this.stats.burnDmg=(this.stats.burnDmg||0)+b}}}
  const F=this.arsFx;if(F)for(let i=F.length-1;i>=0;i--){const q=F[i];q.t+=dt;if(q.k==='smoke'){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=.92}if(q.t>(q.k==='smoke'?.7:q.k==='boom'?.35:.16))F.splice(i,1)}};
 const ua=SP.updateArrows;SP.updateArrows=function(dt){const n=Math.max(1,Math.ceil(Math.max(0,...(this.arrows||[]).map(a=>Math.abs(a.vx)))*dt/6));for(let k=0;k<n;k++)ua.call(this,dt/n);// crossbow bolts / lightning spear: sub-step so they can't tunnel
  const P=this.player,inp=this.inp||{},A=this.ars||(this.ars={}),sv=sv0(this);
  if(A.reload>0){A.reload-=dt;if(A.reload<=0){const W=WEAPONS[A.reloadId],n=Math.min(W.gun.mag-(sv.gmag[A.reloadId]||0),sv.ammo);sv.ammo-=n;sv.gmag[A.reloadId]=(sv.gmag[A.reloadId]||0)+n;Save.write(sv);this.sfx('clang',.3);this.pop('LOADED',P.x,P.y-26,0xb8a070)}}
  if(P&&!P.dead&&!this.menu){if(inp.throwP&&!['roll','hurt','rest','drink'].includes(P.state))this.throwItem();if(inp.thrCyc)this.thrCycle();
   const S=WEAPONS[sv.eq.off];P.guard=!!(inp.guard&&S&&S.shield&&!['roll','rollrec','atk','cast','hurt','rest','drink'].includes(P.state)&&P.st>0);if(P.guard){this.pb.setVelocityX(this.pb.body.velocity.x*.5)}}
  this.arsStep(dt)};
 // ---- shields: guard absorbs hits from the front ----
 const hp0=SP.hurtPlayer,hp=function(n,src,att){return hp0.call(this,n,src,att==='env'?undefined:att)};// 'env' hazards: never parryable either
 SP.hurtPlayer=function(n,src,att){const P=this.player,S=WEAPONS[this.sv.eq&&this.sv.eq.off];
  if(P&&P.guard&&S&&S.shield&&P.inv<=0&&!P.dead&&!this.arsEnvHit(src,att)&&(Math.sign(src-P.x)||P.f)===P.f&&!(this._inE&&this._eRemote)){const sh=S.shield,bh=this.arsBossHeavy(att),cost=bh?Math.max((n*1.2*(1-sh.stab/100)+4)*3,P.stMax*.55):(n*1.2*(1-sh.stab/100)+4);// r9: a boss heavy costs >=55% stamina: two break any guard
   this.spend(cost);this.stats.blocks=(this.stats.blocks||0)+1;this.fx.spark(P.x+P.f*8,P.y-10,10,sh.magic?0xb8a8ff:0xffffff,110);this.sfx('parry',.25);this.pb.setVelocityX(-P.f*60);
   if(sh.magic)P.fp=Math.min(P.fpMax,P.fp+n*.3);
   if(P.st<=0){P.guard=false;P.guardLock=1;this.stats.guardBreaks=(this.stats.guardBreaks||0)+1;this.pop('GUARD BROKEN',P.x,P.y-24,0xd8402a);P.inv=0;const r=hp.call(this,n,src,att);if(!P.dead){P.state='hurt';P.t=0;P.gbStag=.7}return r}// r6: full hit + 0.7 s stagger; guard stays down until re-pressed
   const left=Math.max(n*(1-sh.abs),bh?n*.25:0);if(left<1){P.inv=.25;this.pop('BLOCK',P.x,P.y-24,0x9fb8e8);return false}return hp.call(this,left,src,att)}
  return hp.call(this,n,src,att)};
 // ---- drawing (after the scene, before lights) ----
 const rl=SP.renderLights;SP.renderLights=function(...a){try{this.arsDraw(this.gn,this.ga)}catch(e){}return rl.apply(this,a)};
 SP.arsDraw=function(g,ga){const P=this.player,W=this.wp;
  if(P&&!P.dead&&W&&W.gun&&!this.arsArtHas('arsw_',this.sv.eq.main)){const f=P.f,x=Math.round(P.x+f*4-(P.recoil>0?f*2:0)),y=Math.round(P.y-12-(P.recoil>0?1:0)),L=W.gun.pellets>1?9:W.gun.recoil>200?11:W.gun.spd>800?14:W.gun.rune?8:8;P.recoil=(P.recoil||0)-(this.dt||.016);
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
  if(P){const sv=this.sv;let s='';if(W&&W.gun)s=W.gun.rune?'RUNE '+(sv.rune||'fire').toUpperCase():'MAG '+((sv.gmag&&sv.gmag[sv.eq.main])??W.gun.mag)+'/'+W.gun.mag+'  SHOT '+(sv.ammo||0)+((this.ars&&this.ars.reload>0)?'  RELOADING':'');
   const q=sv.eq&&sv.eq.q2,tn=q&&sv.thr&&sv.thr[q];if(tn)s+=(s?'  ':'')+'G '+ARS.THROWN[q].name+' x'+tn;this._arsHudS=s}};
 // ---- co-op: mirror shots/throws as visuals ----
 if(typeof NET!=='undefined'){const nr=NET.recv;NET.recv=function(d){if(d&&d.t==='ars'){const S=this.scene;if(S&&S.sys&&S.sys.isActive()&&S.arsShot){S.arsShot({...d.p},1);S.stats.arsNet=(S.stats.arsNet||0)+1}return}return nr.call(this,d)}}
}

// ===================== r2: pad + touch bindings, partner guard, smith infusions, distinct swing arcs, real-sprite loading =====================
// Pad (read straight from navigator.getGamepads, so gamepad.js stays untouched): D-pad DOWN tap = throw, hold 0.4 s = next throwable,
// LB held = shield guard (LB tap still parries via gamepad.js). Touch: THR (throw), GRD (hold guard), RLD (reload) buttons.
ARS.INF_COST={heavy:[1,1000],sharp:[1,1000],fire:[2,2000],frost:[2,2000],lightning:[2,2000],dark:[3,3000],holy:[3,3000]};// [Ember Shards, souls]
// infusions: heavy/sharp scale with the matching stat; fire/frost/lightning add a flat +0.15 AR and their status (burn/slow/stagger); dark/holy x1.05
ARS.INF_FX={heavy:{stat:'str',mul:1.1},sharp:{stat:'dex',mul:1.1},fire:{mul:1,add:.15,elem:'fire'},frost:{mul:1,add:.15,elem:'frost'},lightning:{mul:1,add:.15,elem:'lightning'},dark:{mul:1.05,elem:'frost'},holy:{mul:1.05,elem:'lightning'}};
// swing styles drawn over the generic slash (one per new moveset)
ARS.SWING={katana:{k:'crescent',col:0xd8f0ff},warhalberd:{k:'thrust',col:0xe8d8b8},whip:{k:'lash',col:0xc89060},scythe:{k:'reap',col:0xb070ff},twinblade:{k:'twin',col:0xffd070},catalyst:{k:'runes',col:0x9fd8ff}};
ARS.SPRITE_KEYS=[...Object.keys(ARS.MELEE),...Object.keys(ARS.RANGED),...Object.keys(ARS.GUNS),...Object.keys(ARS.SHIELDS),...Object.keys(ARS.THROWN)];
if(typeof Stage!=='undefined'){const SP=Stage.prototype;
 if(typeof TBTN!=='undefined'&&!TBTN.some(b=>b.k==='thr'))TBTN.push({k:'thr',x:218,y:162,r:9,lab:'THR'},{k:'grd',x:218,y:138,r:9,lab:'GRD'},{k:'rld',x:298,y:116,r:8,lab:'RLD'});
 SP.arsPadInput=function(now=performance.now()){const o={};let g=null;try{g=window.__fakePad||[...(navigator.getGamepads?navigator.getGamepads():[])].find(q=>q&&q.connected)}catch(e){}if(!g)return o;
  const b=i=>!!(g.buttons[i]&&(g.buttons[i].pressed||g.buttons[i].value>.5)),dn=b(13)||((g.axes[7]||0)>.5),A=this.arsPadS||(this.arsPadS={});
  if(dn&&!A.dn){A.t=now;A.cyc=0}if(dn&&!A.cyc&&now-A.t>=400){A.cyc=1;o.thrCyc=1}if(!dn&&A.dn&&!A.cyc&&now-A.t<400)o.throwP=1;A.dn=dn;if(b(4))o.guard=true;return o};
 SP.arsTouchInput=function(){const o={};if(!this.touch)return o;const h=this.tHeld||{},A=this.arsTch||(this.arsTch={});if(h.thr&&!A.thr)o.throwP=1;if(h.rld&&!A.rld)o.reloadP=1;if(h.grd)o.guard=true;A.thr=h.thr;A.rld=h.rld;return o};
 const ri2=SP.readInput;SP.readInput=function(){const o=ri2.call(this)||{};if(window.__inp)return o;for(const x of[this.arsPadInput(),this.arsTouchInput()])for(const k in x)o[k]=o[k]||x[k];return o};
 const ua2=SP.updateArrows;SP.updateArrows=function(dt){const inp=this.inp||{},P=this.player;if(inp.reloadP&&P&&!P.dead&&!this.menu){const W=this.wp;if(W&&W.gun)this.gunReload(this.sv.eq.main)}return ua2.call(this,dt)};
 // ---- partner sees my shield guard ----
 if(typeof NET!=='undefined'){const me=NET.me;NET.me=function(){const o=me.call(this);const S=this.scene;if(o&&S&&S.player){o.gd=S.player.guard?1:0;o.off=S.sv&&S.sv.eq&&S.sv.eq.off||null}return o}}
 SP.arsDrawShield=function(g,ga,x,y,f,id){const S=WEAPONS[id];if(!S||!S.shield||this.arsArtHas('arss_',id))return;const sx=Math.round(x+f*7);const h=S.shield.abs>=1?16:S.shield.parry>.12?7:12;g.fillStyle(S.shield.magic?0x6a5ab8:0x7a6a58);g.fillRect(sx-1,Math.round(y-6-h),3,h);g.fillStyle(0xd8c8a0);g.fillRect(sx-1,Math.round(y-6-h),3,1);if(S.shield.magic)glow(ga,sx,y-12,10,0xb8a8ff,.2)};
 // ---- smith infusions (opened from the smith menu with RIGHT on a weapon) ----
 RPG.derive=(d0=>function(st,eq,...a){const d=d0.call(this,st,eq,...a);const sv=typeof SMITH!=='undefined'&&SMITH.cur;const inf=sv&&eq&&eq.main&&((sv.wup||{})[eq.main]||{}).inf,F=inf&&ARS.INF_FX[inf];
  if(d&&F){const ok=!F.stat||(F.stat==='str'?st.str>=st.dex:st.dex>st.str);if(ok)d.ar=d.ar*F.mul+(F.add||0)}return d})(RPG.derive);
 SP.arsInfuse=function(id,inf){const sv=this.sv;sv.wup=sv.wup||{};const cur=(sv.wup[id]||{}).inf||null;if(inf===cur)return'SAME';if(inf){const[e,s]=ARS.INF_COST[inf];if((sv.embers||0)<e)return'SHARDS';if(this.souls<s)return'SOULS';sv.embers-=e;this.souls-=s;sv.souls=this.souls}
  sv.wup[id]={...(sv.wup[id]||{}),inf:inf||undefined};if(!inf)delete sv.wup[id].inf;Save.write(sv);SMITH.cur=sv;this.applyBuild(false);this.stats.infusions=(this.stats.infusions||0)+1;return'OK'};
 const mk=SP.menuKey;SP.menuKey=function(k){const M=this.menu;
  if(M&&M.mode==='smith'&&k==='right'){const L=[...this.smithList(),null],id=L[M.sel];if(id){this.menu={mode:'infuse',id,sel:0,t:1,prev:M};this.sfx('menu',.2)}return}
  if(!M||M.mode!=='infuse')return mk.call(this,k);const L=[null,...Object.keys(INF)],n=L.length;this.sfx('menu',.2);
  if(k==='up')M.sel=(M.sel+n-1)%n;else if(k==='down')M.sel=(M.sel+1)%n;else if(k==='back'||k==='left')this.menu=M.prev;
  else if(k==='ok'){const r=this.arsInfuse(M.id,L[M.sel]);M.say=r==='OK'?(L[M.sel]?INF[L[M.sel]].name+' INFUSION TAKES HOLD.':'THE STEEL IS PLAIN AGAIN.'):r==='SAME'?'IT IS ALREADY SO.':r==='SHARDS'?'NOT ENOUGH EMBER SHARDS.':'YOU LACK THE SOULS.';this.sfx(r==='OK'?'clang':'clang',r==='OK'?.5:.15)}};
 const dm=SP.drawMenu0;SP.drawMenu0=function(g,ga){const M=this.menu;if(M.mode==='smith'){dm.call(this,g,ga);drawText(g,'> RIGHT: INFUSE',178,128,0xb8a070);return}if(M.mode!=='infuse')return dm.call(this,g,ga);
  const sv=this.sv,L=[null,...Object.keys(INF)],cur=((sv.wup||{})[M.id]||{}).inf||null;g.fillStyle(0x07050f,.92);g.fillRect(6,14,308,160);g.fillStyle(0x7a5a24);g.fillRect(6,14,308,1);g.fillRect(6,173,308,1);
  drawText(g,'THE SMITH - INFUSE '+itemName(M.id),12,19,0xffb04a);drawText(g,'SHARDS '+(sv.embers||0)+'  SOULS '+this.souls,180,30,0xff9a3a);
  L.forEach((id,i)=>{const y=34+i*11,on=i===M.sel,nm=id?INF[id].name:'NONE';if(id){g.fillStyle(INF[id].c);g.fillRect(14,y+1,5,5)}drawText(g,(on?'> ':'  ')+nm+(id===cur?' *':''),22,y,on?0xffe2a8:0xb8b4d8);
   if(id){const[e,s]=ARS.INF_COST[id];drawText(g,e+' SH  '+s,110,y,(sv.embers||0)>=e&&this.souls>=s?0x9fd8ff:0x6b4a4a)}});
  const F=L[M.sel]&&ARS.INF_FX[L[M.sel]];if(F){const t=F.stat?'+10% ATTACK IF '+F.stat.toUpperCase()+' LEADS':F.elem?F.elem.toUpperCase()+' ON HIT'+(F.add?', +'+F.add+' ATTACK':'')+(F.mul>1?', +5% ATTACK':''):'';drawText(g,t,22,128,0xd8c8a0);this.stats.infText={t,x:22,w:textW(t)}}
  drawText(g,M.say||'LEFT: BACK',12,160,0xd8c8a0)};
 // melee hits carry the infusion's element
 const mh=SP.meleeHit;SP.meleeHit=function(m){const inf=((this.sv.wup||{})[this.sv.eq.main]||{}).inf,F=inf&&ARS.INF_FX[inf];this._arsEl=F&&F.elem||null;try{return mh.call(this,m)}finally{this._arsEl=null}};
 const de=SP.damageEnemy;SP.damageEnemy=function(e,n,dir,fromNet){const r=de.call(this,e,n,dir,fromNet);const el=this._arsEl;if(el&&e&&!e.dead){if(el==='frost')e.slowT=Math.max(e.slowT||0,2);this.arsStatus(e,el,2);this.stats.infHits=(this.stats.infHits||0)+1}return r};
 const ae=SP.arsElem;SP.arsElem=function(id){const r=ae.call(this,id);if(r)return r;const u=(this.sv.wup||{})[id]||{},F=u.inf&&ARS.INF_FX[u.inf];return F&&F.elem||null};
 // ---- distinct swing arcs + partner guard + sprites (drawn with the arsenal layer) ----
 const ad=SP.arsDraw;SP.arsDraw=function(g,ga){const P=this.player,id=this.sv&&this.sv.eq&&this.sv.eq.main,R=typeof NET!=='undefined'&&NET.remote;
  if(P&&P.guard){P._g=1}const pg=P&&P.guard;if(P)P.guard=false;try{ad.call(this,g,ga)}finally{if(P)P.guard=pg}
  if(P&&P.guard)this.arsDrawShield(g,ga,P.x,P.y,P.f,this.sv.eq.off);
  if(R&&R.gd&&R.off&&R.sid===this.sid&&R.rx!=null){this.arsDrawShield(g,ga,R.rx,R.ry,R.f||1,R.off);this.stats.arsRemoteGuard=(this.stats.arsRemoteGuard||0)+1}
  const Sw=ARS.SWING[id];if(P&&Sw&&P.state==='atk'&&!P.dead){const m=this.move(),k=Math.min(1,P.t/Math.max(.05,m.t)),f=P.f,x=P.x,y=P.y-10,c=Sw.col;this.stats.arsSwing=this.stats.arsSwing||{};this.stats.arsSwing[Sw.k]=(this.stats.arsSwing[Sw.k]||0)+1;
   if(Sw.k==='crescent'){for(let i=0;i<10;i++){const a=(-80+k*160-i*9)*Math.PI/180,r=17+(m.reach||0)*.3;px(ga,x+f*Math.cos(a)*r,y+Math.sin(a)*r*.7,i<2?0xffffff:c)}}
   else if(Sw.k==='thrust'){const L=(m.reach||20)+10;for(let i=0;i<L*k;i+=2)px(ga,x+f*(6+i),y+1,c);if(P.heavy)for(let i=0;i<14;i++){const a=(-110+k*220-i*10)*Math.PI/180;px(ga,x+f*Math.cos(a)*24,y+Math.sin(a)*14,c)}}
   else if(Sw.k==='lash'){const L=(m.reach||30)+6;for(let i=0;i<L;i+=1.5){const u=i/L;if(u>k*1.2)break;px(ga,x+f*(4+i),y-6+Math.sin(u*9-this.t*30)*3*(1-u)+u*8,c)}}
   else if(Sw.k==='reap'){for(let i=0;i<18;i++){const a=(-150+k*300-i*8)*Math.PI/180;const r=24;px(ga,x+f*Math.cos(a)*r,y+Math.sin(a)*r*.55,i<3?0xe8d0ff:c);px(ga,x+f*Math.cos(a)*(r-2),y+Math.sin(a)*(r-2)*.55,c)}}
   else if(Sw.k==='twin'){for(let i=0;i<10;i++){const a=(k*360-i*10)*Math.PI/180;px(ga,x+Math.cos(a)*18,y+Math.sin(a)*9,c);px(ga,x-Math.cos(a)*18,y-Math.sin(a)*9,c)}}
   else if(Sw.k==='runes'){for(let i=0;i<6;i++){const a=i/6*6.283+this.t*6;px(ga,x+f*10+Math.cos(a)*8*k,y+Math.sin(a)*8*k,c);px(ga,x+f*10+Math.cos(a)*8*k+1,y+Math.sin(a)*8*k,0xffffff)}glow(ga,x+f*10,y,8,c,.2)}}
};
}

// ===================== r3: Artist's arsenal art (assets/art/arsenal_pixel/arsenal.json) — approved: ON by default, off switch ?arsart=0 / localStorage ashenVigil.arsArt='0' =====================
// Needs the pixel hero (PIXCH) on. Missing textures -> placeholders.
// Pass 2 adds existing dagger/spear/axe/staff/bow (existing:true) and fx muzzle_rune for the rune pistol.
// In hand: hero_strip_noblade base + weapon_<id> 46x46x30 overlay frame-for-frame; guns/bows/crossbows never show attack frames 16-23
// (sword baked in): the base holds idle frame 0 and recoil/flash/smoke sell the shot. Shields: shield_<id> (30f) / shield_<id>_guard (2f, 4fps)
// after the hero. Reload: hero_reload_powder (6f, 8fps) over frame 0 with the gun hidden; crossbows reload_<id> (3f, 6fps).
ARS.ART_DIR='assets/art/arsenal_pixel/';ARS.ART=null;
ARS.artOn=()=>{try{const q=new URLSearchParams(location.search).get('arsart');if(q!=null)return q!=='0';return localStorage.getItem('ashenVigil.arsArt')!=='0'}catch(e){return true}};
if(typeof Boot!=='undefined'){const bp=Boot.prototype.preload;Boot.prototype.preload=function(){bp.call(this);if(!ARS.artOn()||typeof PIXCH==='undefined'||!PIXCH.ON())return;const L=this.load,D=ARS.ART_DIR,fn=f=>D+String(f).split('/').pop();
 L.json('ars_art',D+'arsenal.json');L.on('filecomplete-json-ars_art',(k,t,M)=>{ARS.ART=M;const ss=(key,f,w,h)=>L.spritesheet(key,fn(f),{frameWidth:w,frameHeight:h}),ic=it=>{L.image('arsi_'+it.id,fn(it.icon));L.image('arsi2_'+it.id,fn(it.icon2x))};
  for(const it of[...(M.melee||[]),...(M.guns||[]),...(M.ranged||[])]){if(!WEAPONS[it.id])continue;ss('arsw_'+it.id,it.file,M.frameWidth||46,M.frameHeight||46);ic(it);if(it.reload)ss('arsr_'+it.id,it.reload,46,46)}
  for(const it of M.shields||[]){if(!WEAPONS[it.id])continue;ss('arss_'+it.id,it.file,46,46);ss('arsg_'+it.id,it.guard,46,46);ic(it)}
  for(const it of M.thrown||[]){if(!ARS.THROWN[it.id])continue;ss('arst_'+it.id,it.spin,it.spinFrame[0],it.spinFrame[1]);ic(it)}
  for(const[k,f]of Object.entries(M.fx||{}))ss('arsfx_'+k,f.file,f.frame[0],f.frame[1])})}}
if(typeof Stage!=='undefined'){const SP=Stage.prototype;
 SP.arsArtHas=function(pre,id){return!!(id&&ARS.artOn()&&this.textures&&this.textures.exists(pre+id))};
 SP.arsFxSprite=function(k,x,y,f,o){const key='arsfx_'+k;if(!this.arsArtHas('arsfx_',k))return null;const F=ARS.ART.fx[k];if(!this.anims.exists(key))this.anims.create({key,frames:this.anims.generateFrameNumbers(key,{start:0,end:F.frames-1}),frameRate:F.fps||14,repeat:0});
  const sp=this.add.sprite(Math.round(x),Math.round(y),key,0).setOrigin(f<0?1-F.origin[0]:F.origin[0],F.origin[1]).setFlipX(f<0).setDepth(7);if(o&&o.tint)sp.setTint(o.tint);sp.play(key);sp.once('animationcomplete',()=>sp.destroy());this.stats.arsFxArt=(this.stats.arsFxArt||0)+1;return sp};
 // muzzle / smoke / impacts / whip arc
 const gf=SP.gunFire;SP.gunFire=function(W,id){gf.call(this,W,id);if(!this.arsArtHas('arsw_',id))return;const P=this.player,f=P.f,G=W.gun,it=(ARS.ART.guns||[]).find(q=>q.id===id),mz=it&&it.muzzle||[12,1];
  const k=G.rune&&this.arsArtHas('arsfx_','muzzle_rune')?'muzzle_rune':G.recoil>200?'muzzle_large':G.pellets>1||G.spd>800?'muzzle_medium':'muzzle_small';this.stats.arsMuzzle=k;const x=P.x+f*(4+mz[0]),y=P.y-12+mz[1];
  if(this.arsFxSprite(k,x,y,f,{tint:G.rune&&k!=='muzzle_rune'?ARS.ELEM[this.sv.rune||'fire']:null})){this.arsFx=(this.arsFx||[]).filter(q=>q.k!=='flash'&&q.k!=='smoke');this.arsFxSprite('smoke_puff',x+f*4,y-2,f)}};
 const bl=SP.arsBlast;SP.arsBlast=function(p){bl.call(this,p);if(p.elem)this.arsFxSprite('impact_'+p.elem,p.x,p.y-4,1)};
 const sa=SP.startAtk;SP.startAtk=function(hv,combo,on){const r=sa.call(this,hv,combo,on);if(this.sv.eq.main==='whip'&&this.player.state==='atk'&&this.arsArtHas('arsfx_','whip_arc'))this.arsFxSprite('whip_arc',this.player.x+this.player.f*4,this.player.y-10,this.player.f);return r};
 // thrown spin sprites follow their projectiles
 const ad=SP.arsDraw;SP.arsDraw=function(g,ga){const L=this.arsP||[],keep=new Set();for(const p of L){if(!ARS.THROWN[p.k]||!this.arsArtHas('arst_',p.k))continue;if(!p.spr)p.spr=this.add.sprite(0,0,'arst_'+p.k,0).setDepth(6);p.spr.setPosition(Math.round(p.x),Math.round(p.y)).setFrame(Math.floor(p.t*14)%4).setFlipX(p.vx<0);keep.add(p.spr);p.hide=1}
  for(const sp of this.arsSpr||[])if(!keep.has(sp))sp.destroy();this.arsSpr=keep;
  const hid=L.filter(p=>p.hide);for(const p of hid)p._k=p.k,p.k='__art';try{return ad.call(this,g,ga)}finally{for(const p of hid)p.k=p._k}};
}
if(typeof WEAPART!=='undefined'){
 const icon0=WEAPART.icon,cache={};WEAPART.icon=function(s,g,id,x,y,sz){const key=(sz>=24?'arsi2_':'arsi_')+id;if(id&&ARS.artOn()&&s.textures.exists(key)){let I=cache[key];if(!I){const src=s.textures.get(key).getSourceImage(),cv=document.createElement('canvas');cv.width=src.width;cv.height=src.height;const c=cv.getContext('2d');c.drawImage(src,0,0);const d=c.getImageData(0,0,cv.width,cv.height).data,o=[];
   for(let j=0;j<cv.height;j++)for(let i=0;i<cv.width;i++){const k=(j*cv.width+i)*4;if(d[k+3]>40)o.push([i,j,(d[k]<<16)|(d[k+1]<<8)|d[k+2]])}I=cache[key]={w:cv.width,h:cv.height,p:o}}
   const ox=x+((sz-I.w)>>1),oy=y+((sz-I.h)>>1);for(const[i,j,c]of I.p){g.fillStyle(c);g.fillRect(ox+i,oy+j,1,1)}return true}return icon0.call(this,s,g,id,x,y,sz)};
 const wo=WEAPART.wield;WEAPART.wield=function(s,R,id,flash,tint){const on=ARS.artOn()&&s.textures.exists('av_hero_nb'),mine=on&&id&&s.textures.exists('arsw_'+id),c=s.pxc,local=c&&R===c.rig,Rm=typeof NET!=='undefined'&&NET.remote;
  wo.call(this,s,R,mine?null:id,flash,tint);const B=R.base;
  const tf=sp=>{if(flash)sp.setTintFill(0xffffff);else if(tint!=null)sp.setTint(tint);else sp.clearTint()};
  const off=local?s.sv&&s.sv.eq&&s.sv.eq.off:Rm&&Rm.off,guard=local?s.player&&s.player.guard:Rm&&Rm.gd;
  if(mine&&B.visible){if(B.texture.key!=='av_hero_nb')B.setTexture('av_hero_nb',B.frame.name);const W=WEAPONS[id],ranged=!!(W.gun||W.type==='bow'||ARS.RANGED[id]);let fr=+B.frame.name;if(ranged&&fr>=16&&fr<24){fr=0;B.setFrame(0)}
   const rl=local&&W.gun&&s.ars&&s.ars.reload>0,xr=local&&/xbow/.test(id)&&s.player.state==='atk'&&s.player.t>.12&&s.textures.exists('arsr_'+id);
   let w=R.arsW;const key=xr?'arsr_'+id:rl?'arsfx_gun_reload':'arsw_'+id;if(!w||w.texture.key!==key){if(w)w.destroy();w=R.arsW=s.add.sprite(0,0,key,0).setOrigin(B.originX,B.originY)}
   const wf=xr?Math.min(2,Math.floor((s.player.t-.12)*6)):rl?Math.floor(s.t*8)%6:fr;if(xr||rl)B.setFrame(0);
   if(s.textures.exists(key)){w.setVisible(true).setFrame(wf).setPosition(B.x,B.y).setFlipX(B.flipX).setDepth(B.depth+.0025);tf(w);s.stats&&(s.stats.arsWield=(s.stats.arsWield||0)+1)}else w.setVisible(false)}
  else if(R.arsW)R.arsW.setVisible(false);
  if(on&&off&&B.visible&&s.textures.exists('arss_'+off)){const key=guard?'arsg_'+off:'arss_'+off;let sp=R.arsS;if(!sp||sp.texture.key!==key){if(sp)sp.destroy();sp=R.arsS=s.add.sprite(0,0,key,0).setOrigin(B.originX,B.originY)}
   sp.setVisible(true).setFrame(guard?Math.floor(s.t*4)%2:+B.frame.name).setPosition(B.x,B.y).setFlipX(B.flipX).setDepth(B.depth+.004);tf(sp);s.stats&&(s.stats.arsShieldArt=(s.stats.arsShieldArt||0)+1)}
  else if(R.arsS)R.arsS.setVisible(false)}}

// ===================== r6: Tester r15 fixes (P1-1 throwable scale, P1-2 statuses, P2-3 rooms, P2-4 env, P2-5 guard break, P2-6 HUD, P3s) =====================
if(typeof MIRACLES!=='undefined')for(const m of Object.values(MIRACLES))m.key='C (SELECT Q)';// P3-8: G/T/R now throw/cycle/flask
if(typeof CONSUMABLES!=='undefined'){for(const id of Object.keys(ARS.THROWN))CONSUMABLES[id].fx='ars';CONSUMABLES.ammo.fx='ars'}
ARS.MTXT={ammo:['12 PISTOL SHOT.','LOAD: HOLD X.'],tknife:['THROWN WITH G.','T PICKS THE NEXT ONE.'],firebomb:['THROWN WITH G. BURSTS','INTO FLAME.'],frostjar:['THROWN WITH G. BURSTS','INTO RIME. SLOWS.'],boltjar:['THROWN WITH G. BURSTS','INTO LIGHTNING.']};
if(typeof DESC!=='undefined'){DESC.ammo=['A POUCH OF 12 PISTOL SHOT AND POWDER.','LOADED WITH HOLD X (OR RLD).'];for(const id of Object.keys(ARS.THROWN))DESC[id]=[ARS.THROWN[id].name+'.','THROWN WITH G. T PICKS THE NEXT ONE.']}
if(typeof Stage!=='undefined'){const SP=Stage.prototype;
 // P1-2: one place for elemental statuses. Fire: burn only starts when not already burning (no full refresh). Lightning: 25% chance,
 // 1.5 s per-enemy cooldown, a short 0.5 s stagger flagged arsStag so it never enables a riposte.
 SP.arsStatus=function(e,el,dur){if(!e||e.dead||!el)return;if(el==='frost')e.slowT=Math.max(e.slowT||0,dur);
  else if(el==='fire'){if(!(e.burn>0)){e.burn=dur*.75;e.burnT=0}}
  else if(el==='lightning'){const now=this.t||0;if(now-(e.lstT??-9)>=1.5&&Math.random()<.25){e.lstT=now;if(e.state!=='stag'){e.state='stag';e.t=Math.max(0,TUNE.stagT-.5);e.arsStag=1;this.stats.arsStags=(this.stats.arsStags||0)+1}}}};
 const mh6=SP.meleeHit;SP.meleeHit=function(m){const sw=[];for(const e of this.enemies)if(e.arsStag&&e.state==='stag'){e.state='idle';sw.push(e)}try{return mh6.call(this,m)}finally{for(const e of sw)if(e.state==='idle'&&!e.dead)e.state='stag'}};
 // P2-3: shots live only in the current room; parked enemies are out of play
 SP.arsInRoom=function(x){const r=this.room;if(!r||this.bossState==='fight'||this.cine)return true;return x>=r.x0-2&&x<r.x1+2};
 // P2-4: environmental damage (drowning, lava, spikes, thorns, falling ice/chunks) is never guarded
 SP.arsEnvHit=function(src,att){return att==='env'};// r9 (Tester r16 P1): hazards are tagged hurtPlayer(n,src,'env') at their call sites; nothing else skips the guard
 SP.arsBossHeavy=function(att){const B=this.boss;return att==='boss'&&B&&/slam|roar|heavy|charge/.test(B.state||'')};
 const rI=SP.readInput;SP.readInput=function(){const o=rI.call(this)||{},P=this.player;if(P&&P.guardLock){if(!o.guard)P.guardLock=0;else o.guard=false}return o};
 const up6=SP.update;SP.update=function(t,dms){const P=this.player;if(P&&P.gbStag>0){P.gbStag-=(dms||16)/1000;if(P.state!=='dead'&&!P.dead&&P.gbStag>0&&P.state!=='hurt'){P.state='hurt'}}return up6.call(this,t,dms)};
 // P2-6: ammo line sits in the top-right under the souls counter, clear of the spell box and objective counters
 SP.arsHudY=function(){return 22};
 const hud6=SP.drawHUD;SP.drawHUD=function(...a){const r=hud6.apply(this,a);const s=this._arsHudS,g=this.gu;if(s&&g&&!this.menu&&!this.paused&&!this.cine&&!this.victory){const y=this.arsHudY(),x=W-textW(s)-6;g.fillStyle(0x07050f,.55);g.fillRect(x-3,y-2,textW(s)+6,9);drawText(g,s,x,y,0xd8c8a0);this.stats.arsHud={s,y}}return r};// screen-space HUD layer
 // P3-11: changing weapon cancels a reload in progress
 const ab6=SP.applyBuild;SP.applyBuild=function(...a){const A=this.ars,sv=this.sv;if(A&&A.reload>0&&sv&&sv.eq&&A.reloadId!==sv.eq.main){A.reload=0;this.stats.reloadCancel=(this.stats.reloadCancel||0)+1}return ab6.apply(this,a)};
 // P3-10: D-pad Down throws / cycles only when standing still on the ground (never while dropping, swimming or moving)
 const pi6=SP.arsPadInput;SP.arsPadInput=function(now){const o=pi6.call(this,now),P=this.player,b=this.pb&&this.pb.body;
  const still=P&&!P.swim&&b&&b.blocked.down&&Math.abs(b.velocity.x)<8&&P.state!=='climb';if(!still&&(o.throwP||o.thrCyc)){delete o.throwP;delete o.thrCyc;this.stats.padThrowBlocked=(this.stats.padThrowBlocked||0)+1}return o};
 // P3-9: pause screen lists the arsenal controls
 const dp6=SP.drawPause;SP.drawPause=function(g){dp6.call(this,g);if(this.touch)return;const st=TXT.big?10:11,L=['G THROW  T NEXT ITEM','HOLD V  SHIELD GUARD','HOLD X  RELOAD  PAD DN THROW'];let mx=0;L.forEach((s,i)=>{const x=W-textW(s)-8;mx=Math.max(mx,x+textW(s));drawText(g,s,x,38+(6+i)*st,0xd8d0ee)});this.stats.pauseArs=L.length;this.stats.pauseArsR=mx};
 // P3-12: merchant panel text for shot / throwables (rings.js prints a generic consumable line)
 const dm6=SP.drawMenu0;SP.drawMenu0=function(g,ga){const r=dm6.call(this,g,ga),M=this.menu;if(M&&M.mode==='lmerch'){const row=this.merchRows()[M.sel],id=row&&row[0],T=id&&ARS.MTXT[id];
  if(T){g.fillStyle(0x07050f);g.fillRect(199,58,118,24);T.forEach((s,i)=>drawText(g,s,202,60+i*10,0xd8c8b0));this.stats.merchTxt=T[0]}}return r};
}
if(typeof WEAPART!=='undefined'){
 // P3-15: keep the pixel hero's outline on the same frame/texture as the body (no baked-sword crescent on bows/guns), and a brass rim on gun overlays
 const w6=WEAPART.wield;WEAPART.wield=function(s,R,id,flash,tint){w6.call(this,s,R,id,flash,tint);const c=s.pxc,B=R.base;if(!c||!B)return;const E=R===c.rig?c.he:R===c.rrig?c.re:null;
  if(E&&R.arsW&&R.arsW.visible){for(const q of E.ol)q.setTexture(B.texture.key,B.frame.name);E.lift.setTexture(B.texture.key,B.frame.name);s.stats&&(s.stats.arsEdgeSync=(s.stats.arsEdgeSync||0)+1)}
  const W=id&&WEAPONS[id],rim=R.arsRim;if(W&&W.gun&&R.arsW&&R.arsW.visible&&R.arsW.texture.key==='arsw_'+id){let q=rim;if(!q||q.texture.key!==R.arsW.texture.key){if(q)q.destroy();q=R.arsRim=s.add.sprite(0,0,R.arsW.texture.key,0).setOrigin(R.arsW.originX,R.arsW.originY)}
   q.setVisible(true).setFrame(R.arsW.frame.name).setFlipX(R.arsW.flipX).setPosition(R.arsW.x,R.arsW.y-1).setDepth(R.arsW.depth-.0005).setTintFill(0xe8c878).setAlpha(.8);s.stats&&(s.stats.arsRim=(s.stats.arsRim||0)+1)}else if(rim)rim.setVisible(false)}}

// ===================== r7: PixelFX effects (MIT, assets/fx/pixelfx; baked by assets/fx/arsfx.mjs) recolored per stage palette =====================
// Muzzle flashes, bullet/element impacts, firebomb/jar/hand-cannon explosions and melee infusion hits. Spell FX belong to
// Video Games (spells.js); they can opt in through window.ArsFX below.
// Baked lazily into Phaser sprite strips per (effect, ramp, stage theme) and cached; falls back to the old drawn effects until
// a texture exists or if the module fails to load. ?pfx=0 turns PixelFX off.
ARS.pfxOn=()=>{try{return new URLSearchParams(location.search).get('pfx')!=='0'}catch(e){return true}};
ARS.pfx=null;ARS.pfxErr=null;
if(typeof window!=='undefined'&&typeof document!=='undefined'&&ARS.pfxOn()){try{import('./assets/fx/arsfx.mjs').then(m=>{ARS.pfx=m},e=>{ARS.pfxErr=String(e&&e.message||e)})}catch(e){ARS.pfxErr=String(e)}}
ARS.PFX_SCALE={plasma:.6,boom:.8,mana:.6};
if(typeof Stage!=='undefined'){const SP=Stage.prototype;
 SP.pfxTheme=function(){return this.def&&this.def.theme||'ramparts'};
 SP.pfxTex=function(key,ramp){const M=ARS.pfx;if(!M||!ARS.pfxOn())return null;const th=this.pfxTheme(),tk='pfx_'+key+'_'+(ramp?String(ramp).replace('#',''):'base')+'_'+th;
  if(!this.textures.exists(tk)){const t0=performance.now();let b;try{b=M.bakeCanvas(key,{ramp:ramp?M.rampOf(ramp):null,theme:th})}catch(e){ARS.pfxErr=String(e);return null}
   this.textures.addSpriteSheet(tk,b.canvas,{frameWidth:b.w,frameHeight:b.h});this.anims.create({key:tk,frames:this.anims.generateFrameNumbers(tk,{start:0,end:b.n-1}),frameRate:b.fps,repeat:0});
   (ARS.PFXMETA||(ARS.PFXMETA={}))[tk]={ox:b.ox,oy:b.oy,w:b.w,h:b.h,n:b.n};const st=this.stats.pfxBake=this.stats.pfxBake||{n:0,ms:0};st.n++;st.ms+=performance.now()-t0}
  return tk};
 SP.pfxPlay=function(key,x,y,o={}){const tk=this.pfxTex(key,o.ramp);if(!tk)return null;const m=ARS.PFXMETA[tk],f=o.f||1,sc=(o.scale||1)*(ARS.PFX_SCALE[key]||1);
  const sp=this.add.sprite(Math.round(x),Math.round(y),tk,0).setOrigin((f<0?m.w-m.ox:m.ox)/m.w,m.oy/m.h).setFlipX(f<0).setScale(sc).setDepth(o.depth||7.5);sp.play(tk);sp.once('animationcomplete',()=>sp.destroy());
  const S=this.stats.pfx=this.stats.pfx||{};S[key]=(S[key]||0)+1;(this.pfxLive||(this.pfxLive=new Set())).add(sp);sp.once('destroy',()=>this.pfxLive.delete(sp));return sp};
 // pre-bake the common ones for this stage a frame at a time, so the first shot does not hitch
 const cr7=SP.create;SP.create=function(...a){const r=cr7.apply(this,a);const Q=[['muzzle'],['spark'],['muzzle','lightning'],['spark','fire'],['spark','frost'],['spark','lightning'],['muzzleBig'],['boom'],['snow'],['plasma']];
  const step=()=>{if(!this.sys||!this.sys.isActive())return;if(!ARS.pfx){if(!ARS.pfxErr&&ARS.pfxOn())this.time.delayedCall(200,step);return}const q=Q.shift();if(q){this.pfxTex(q[0],q[1]);this.time.delayedCall(40,step)}};this.time.delayedCall(300,step);return r};
 // muzzle flashes (replace the drawn flash and the Artist muzzle sprite; the Artist smoke puff stays)
 const gf7=SP.gunFire;SP.gunFire=function(W,id){const n0=(this.arsFx||[]).length;gf7.call(this,W,id);const P=this.player,G=W.gun,f=P.f,big=G.pellets>1||G.recoil>200,el=G.rune?(this.sv.rune||'fire'):null;
  const sp=this.pfxPlay(big?'muzzleBig':'muzzle',P.x+f*(big?16:14),P.y-11,{f,ramp:el});if(sp){this.arsFx=(this.arsFx||[]).filter((q,i)=>q.k!=='flash');for(const c of this.children.list)if(c.texture&&/^arsfx_muzzle/.test(c.texture.key)&&c.anims&&c.anims.isPlaying&&c.anims.getProgress()<.2)c.destroy()}};
 // impacts: every projectile / blast hit
 const he7=SP.arsHitE;SP.arsHitE=function(e,n,dir,el){const r=he7.call(this,e,n,dir,el);const bb=e.b&&e.b.body,t=this.t||0;if(bb&&!(e.pfxT>t-.08)){e.pfxT=t;this.pfxPlay('spark',bb.center.x-dir*4,bb.center.y,{f:-dir,ramp:el||null})}return r};
 // explosions: firebomb / jars / hand cannon
 const bl7=SP.arsBlast;SP.arsBlast=function(p){const r=bl7.call(this,p);const k=p.elem==='frost'?'snow':p.elem==='lightning'?'plasma':'boom';const y=p.elem==='lightning'?p.y:Math.min(p.y+6,GY);if(this.pfxPlay(k,p.x,y,{ramp:k==='boom'&&p.elem&&p.elem!=='fire'?p.elem:null}))this.arsFx=(this.arsFx||[]).filter(q=>q.k!=='boom');return r};
 // melee infusion hits carry their element's spark
 const de7=SP.damageEnemy;SP.damageEnemy=function(e,n,dir,fromNet){const el=this._arsEl,r=de7.call(this,e,n,dir,fromNet);if(el&&e&&e.b&&e.b.body&&!(e.pfxT>(this.t||0)-.08)){e.pfxT=this.t||0;this.pfxPlay('spark',e.b.body.center.x,e.b.body.center.y,{f:-(dir||1),ramp:el})}return r};
}

// ---- window.ArsFX: small helper API for other code (e.g. Video Games' spell FX). All calls draw into the active stage,
// recolored with the stage tint, and fall back to the game's own spark particles when PixelFX is off / not loaded yet.
//  color: an element or school name ('fire'|'frost'|'lightning'|'dark'|'holy'|'arcane'), a '#rrggbb' string or a 0xRRGGBB number;
//         omit for the effect's own palette.            o: { f: 1|-1 facing, scale: number, depth: number }
//  ArsFX.impact(x, y, color?, o?)            hit spark (0.4 s)                          -> Phaser.Sprite | null (fallback drawn)
//  ArsFX.explosion(x, y, kind?, color?, o?)  kind 'fire'|'frost'|'lightning' (default fire): blast / snow burst / plasma; y = floor
//  ArsFX.burst(x, y, color?, o?)             arcane mana burst (0.7 s), e.g. a cast flash
//  ArsFX.ready()                             true once PixelFX is loaded;  ArsFX.on()  false with ?pfx=0
if(typeof window!=='undefined'){const stage=()=>{try{const s=window.__G&&__G.scene.getScene('stage');return s&&s.sys&&s.sys.isActive()&&s.pfxPlay?s:null}catch(e){return null}};
 const norm=c=>c==null?null:typeof c==='number'?'#'+c.toString(16).padStart(6,'0'):String(c);
 const num=c=>{const n=norm(c);if(!n)return 0xffe0a0;if(n[0]==='#')return parseInt(n.slice(1),16);return(ARS.ELEM[n]||({dark:0xb070ff,holy:0xffe8a0,arcane:0xb8a8ff})[n]||0xffe0a0)};
 const play=(key,x,y,c,o={})=>{const s=stage();if(!s)return null;const sp=s.pfxPlay(key,x,y,{...o,ramp:norm(c)});if(!sp&&s.fx&&s.fx.spark)s.fx.spark(x,y,key==='spark'?8:16,num(c),key==='spark'?80:130);s.stats.arsFxApi=(s.stats.arsFxApi||0)+1;return sp};
 window.ArsFX={impact:(x,y,c,o)=>play('spark',x,y,c,o),explosion:(x,y,kind='fire',c,o)=>play(kind==='frost'?'snow':kind==='lightning'?'plasma':'boom',x,y,c!=null?c:kind==='fire'?null:undefined,o),
  burst:(x,y,c,o)=>play('mana',x,y,c,{scale:.6,...(o||{})}),ready:()=>!!ARS.pfx,on:()=>ARS.pfxOn()}}

// ===================== r9: Tester r16 =====================
// P3-5: throwables use their own DEX-scaled attack rating (scaling B), independent of the weapon in hand
ARS.throwAR=dex=>+(0.9+Math.max(0,(dex||10)-10)*0.045).toFixed(3);
// P2-2: STR boss-weapon ladder - each region's STR signature weapon ~1.1x+ the last in sustained DPS (crownbreaker -> clapper ->
// ashmaul -> halberd -> hollowbrand). Base tweaks only (loot.js data is Video Games'; adjusted here, at load).
ARS.STR_LADDER=['crownbreaker','clapper','ashmaul','halberd','hollowbrand'];
ARS.LADDER_BASE={clapper:2.6,ashmaul:2.7,halberd:2.8,hollowbrand:3.8};
if(typeof WEAPONS!=='undefined'){for(const[id,b]of Object.entries(ARS.LADDER_BASE))if(WEAPONS[id])WEAPONS[id].base=b;if(WEAPONS.ashmaul)WEAPONS.ashmaul.light.t=.56}
// ladder metric (used by test/arsenal.mjs): light-chain DPS = AR x light.mul / light.t at STR 40
if(typeof Stage!=='undefined')Stage.prototype.arsThrowAR=function(){return ARS.throwAR(this.sv&&this.sv.stats&&this.sv.stats.dex)};
if(typeof module!=='undefined')module.exports={ARS};
