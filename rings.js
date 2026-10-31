// ASHEN VIGIL — rings with real effects + in-level merchants (r9 queue). Loaded after inventory.js / weapons.js.
// Art: Artist's ring icons (assets/rings, 12x12 + 24x24) and the hooded merchant idle strip (assets/merchant, 48x40 x8, faces left).
// - 8 new rings feed RPG.derive like the existing four (HP, absorb, FP + spell power, stamina, attack, souls, roll i-frames, poise).
// - Where rings come from: lords give one each (5 lords), the 5th/6th chest of later regions holds one, merchants sell the rest.
// - Every non-hub stage has a merchant a little past its bonfire: consumables (used on the spot), rings, Ember Shards, for souls.
'use strict';
const RING_ART={ember_signet:1,rime_band:1,choir_ring:1,tide_loop:1,thorn_ring:1,ashen_band:1,star_seal:1,bell_ring:1};
Object.assign(GEAR,{
 ember_signet:{slot:'ring',name:'EMBER SIGNET',w:.5,hpMul:.15,desc:'+15% HP'},
 rime_band:{slot:'ring',name:'RIME BAND',w:.5,abs:.08,desc:'+8% ABSORB'},
 choir_ring:{slot:'ring',name:'CHOIR RING',w:.5,fp:30,spellMul:.12,desc:'+30 FP, +12% SPELLS AND MIRACLES'},
 tide_loop:{slot:'ring',name:'TIDE LOOP',w:.5,st:25,desc:'+25 STAMINA'},
 thorn_ring:{slot:'ring',name:'THORN RING',w:.5,arMul:.12,abs:-.04,desc:'+12% ATTACK, -4% ABSORB'},
 ashen_band:{slot:'ring',name:'ASHEN BAND',w:.5,soul:.15,desc:'+15% SOULS'},
 star_seal:{slot:'ring',name:'STAR SEAL',w:.5,iframe:.05,desc:'LONGER DODGE I-FRAMES'},
 bell_ring:{slot:'ring',name:'BELL RING',w:1,poise:8,desc:'+8 POISE'}});
if(typeof DESC!=='undefined')for(const k of Object.keys(RING_ART))DESC[k]=DESC[k]||[GEAR[k].desc+'.','A RING. WEAR TWO AT ONCE.'];
// the extra effects the base GEAR pass doesn't know about
(()=>{const d0=RPG.derive.bind(RPG);RPG.derive=function(st,eq){const d=d0(st,eq);if(!eq)return d;let ar=0,sp=0,sta=0,ifr=0;
 for(const k of['ring1','ring2']){const G=GEAR[eq[k]];if(!G)continue;ar+=G.arMul||0;sp+=G.spellMul||0;sta+=G.st||0;ifr+=G.iframe||0}
 if(ar)d.ar*=1+ar;if(sp){d.spell*=1+sp;d.mir*=1+sp}if(sta)d.st+=sta;if(ifr&&d.roll&&d.roll.t){d.roll={...d.roll,i1:Math.min(d.roll.t,d.roll.i1+ifr)}}return d}})();
const RING_BOSS={cantor:'choir_ring',toller:'bell_ring',abbess:'tide_loop',astronomer:'star_seal',prioress:'thorn_ring'};
const RING_CHEST={catacomb:{ch_f5:'ember_signet'},drowned:{ch_w5:'rime_band'},keep:{ch_k5:'ashen_band'},spire:{ch_s5:'ring_steel'},cloister:{ch_c5:'ring_sage'},throne:{ch_t5:'ring_greed'}};
const MERCH_STOCK=[['ember',150],['bluesap',150],['rimesalt',250],['cinderleaf',250],['shard',800],['ember_signet',2500],['ring_life',1800],['ring_sage',1800],['ring_steel',2000],['ring_greed',2200],['ashen_band',3000]];
if(typeof Stage!=='undefined'){const SP=Stage.prototype;
 const give=function(id,why){const sv=this.sv;if(!id||sv.inv.includes(id))return false;sv.inv.push(id);Save.write(sv);this.sigBanner={w:id,t:0,title:why||'RING FOUND'};this.sfx('fanfare',.3);this.stats.ringsGot=(this.stats.ringsGot||0)+1;return true};
 SP.ringGive=give;
 const oc=SP.openChest;SP.openChest=function(c,fromNet){const was=c.st;const r=oc.call(this,c,fromNet);if(was==='shut'&&c.st==='open'&&!NET.guest()){const id=(RING_CHEST[this.sid]||{})[c.id];this.ringGive(id);if(id&&NET.host())NET.send({t:'ring',id,why:'RING FOUND'})}return r};// co-op: the guest usually sees the chest open via the snapshot (no openChest call), so the host sends the ring explicitly
 const hm=SP.hitMimic;SP.hitMimic=function(c,ar,fromNet){const was=c.st;const r=hm.call(this,c,ar,fromNet);if(was==='awake'&&c.st==='dead'&&!NET.guest()){const id=(RING_CHEST[this.sid]||{})[c.id];this.ringGive(id);if(id&&NET.host())NET.send({t:'ring',id,why:'RING FOUND'})}return r};
 // co-op: the guest only sees a mimic die through the snapshot, so the host sends the ring explicitly
 const nr=NET.recv;NET.recv=function(d){if(d&&d.t==='ring'&&this.guest()){const S=this.scene;if(S&&S.sys&&S.sys.isActive()&&S.ringGive&&GEAR[d.id])S.ringGive(d.id,d.why);return}return nr.call(this,d)};
 // lord rings arrive after the weapon banner
 const fb=SP.finishBoss;SP.finishBoss=function(B){const r=fb.call(this,B);const id=RING_BOSS[B&&B.kind];if(id&&!NET.guest()){this.sv.inv.includes(id)||(this.sv.inv.push(id),Save.write(this.sv));this.time.delayedCall(2900,()=>{if(!this.sigBanner)this.sigBanner={w:id,t:0,title:'LORD\'S RING'}})}return r};
 // co-op fix: the guest's lord kill arrives as {t:'bossdead'} -> awardSignature only (finishBoss runs on the host), so the guest never got the lord's ring
 const aw=SP.awardSignature;SP.awardSignature=function(kind,x){const r=aw.call(this,kind,x);const id=RING_BOSS[kind];if(id&&NET.guest()&&!this.sv.inv.includes(id)){this.sv.inv.push(id);Save.write(this.sv);this.time.delayedCall(2900,()=>{if(!this.sigBanner)this.sigBanner={w:id,t:0,title:'LORD\'S RING'}})}return r};
 // ---- textures (loaded once by Boot) ----
 const bp=Boot.prototype.preload;Boot.prototype.preload=function(){bp.call(this);for(const k of Object.keys(RING_ART))this.load.image('ring_'+k,'assets/rings/ring_'+k+'@2x.png');this.load.spritesheet('merchant','assets/merchant/merchant_strip.png',{frameWidth:48,frameHeight:40})};
 // ---- ring icons in menus: a small image pool on top of the HUD graphics, reset every frame ----
 SP.ringIcon=function(id,x,y,s){if(!this.textures.exists('ring_'+id))return false;const P=this.ringPool||(this.ringPool=[]);let im=P[this.ringN||0];if(!im){im=this.add.image(0,0,'ring_'+id).setScrollFactor(0).setDepth(52).setOrigin(0);P.push(im)}
  this.ringN=(this.ringN||0)+1;const sz=s>=20?24:12;im.setTexture('ring_'+id).setDisplaySize(sz,sz).setPosition(Math.round(x+(s-sz)/2),Math.round(y+(s-sz)/2)).setVisible(true);return true};
 const hud=SP.drawHUD;SP.drawHUD=function(){this.ringN=0;hud.call(this);if(this.ringPool)for(let i=this.ringN;i<this.ringPool.length;i++)this.ringPool[i].setVisible(false)};
 const ii=SP.invIcon;SP.invIcon=function(g,id,x,y,s=18,stats=true){if(RING_ART[id]){g.fillStyle(0x15112a);g.fillRect(x+1,y+1,s-2,s-2);if(this.ringIcon(id,x,y,s))return}return ii.call(this,g,id,x,y,s,stats)};
 // ---- in-level merchant ----
 const cr=SP.create;SP.create=function(...a){const r=cr.apply(this,a);try{this.merch=null;const D=this.def;if(!D.hub&&this.bonfire&&this.textures.exists('merchant')){const x=this.bonfire.x+56,y=this.lv&&this.lv.floorAt?this.lv.floorAt(x,GY-4):GY;
   if(!this.anims.exists('merchant_idle'))this.anims.create({key:'merchant_idle',frames:this.anims.generateFrameNumbers('merchant',{start:0,end:7}),frameRate:5,repeat:-1});
   const sp=this.add.sprite(x,y,'merchant').setOrigin(.5,.925).setDepth(4.5);sp.play('merchant_idle');this.merch={x,y,sp}}}catch(e){console.warn('merchant',e)}return r};
 const ih=SP.interactHint;SP.interactHint=function(){const h=ih.call(this);if(h)return h;const M=this.merch,P=this.player;if(M&&P&&!this.menu&&!P.dead&&this.pb.body.blocked.down&&Math.abs(P.x-M.x)<16&&Math.abs(P.y-M.y)<20)return'Trade';return h};
 const it=SP.interact;SP.interact=function(){const M=this.merch,P=this.player;if(M&&Math.abs(P.x-M.x)<16&&Math.abs(P.y-M.y)<20&&!this.menu){this.menu={mode:'lmerch',sel:0,t:0,prev:{}};this.pb.setVelocityX(0);this.sfx('talk',.3);M.sp.setFlipX(P.x>M.x);return true}return it.call(this)};
 SP.merchRows=function(){const sv=this.sv;return MERCH_STOCK.filter(([id])=>!GEAR[id]||!sv.inv.includes(id))};
 const mk=SP.menuKey;SP.menuKey=function(k){const M=this.menu;if(!M||M.mode!=='lmerch')return mk.call(this,k);const R=this.merchRows(),n=R.length+1,sv=this.sv;this.sfx('menu',.2);
  if(k==='up')M.sel=(M.sel+n-1)%n;else if(k==='down')M.sel=(M.sel+1)%n;else if(k==='back'||(k==='ok'&&M.sel===R.length))this.menu=null;
  else if(k==='ok'){const[id,price]=R[M.sel];if(this.souls<price){M.say='YOU LACK THE SOULS.';this.sfx('clang',.2);return}this.souls-=price;sv.souls=this.souls;
   if(id==='shard'){sv.embers=(sv.embers||0)+1;/* one currency: sv.embers (the smith's) */M.say='AN EMBER SHARD. FOR THE SMITH.'}else if(GEAR[id]){sv.inv.push(id);M.say=GEAR[id].name+' - WEAR IT FROM THE INVENTORY.'}
   else{const lt=sv.looted;this.takeDrop({kind:id,x:this.player.x,y:this.player.y});sv.looted=lt;/* a purchase is not loot */M.say=CONSUMABLES[id].name+' - USED.'}Save.write(sv);this.sfx('pickup',.4);this.stats.merchBuys=(this.stats.merchBuys||0)+1;M.sel=Math.min(M.sel,this.merchRows().length)}};
 const dm=SP.drawMenu0;SP.drawMenu0=function(g,ga){const M=this.menu;if(M.mode!=='lmerch')return dm.call(this,g,ga);const R=this.merchRows();
  g.fillStyle(0x07050f,1);g.fillRect(6,10,308,164);g.fillStyle(0x7a5a24);g.fillRect(6,10,308,1);g.fillRect(6,173,308,1);g.fillRect(6,10,1,164);g.fillRect(313,10,1,164);
  drawText(g,'WANDERING MERCHANT',12,15,0xffb04a);drawText(g,'SOULS '+this.souls,232,15,0x9fd8ff);this.mLayout=[];
  R.forEach(([id,price],i)=>{const y=29+i*11,on=i===M.sel;this.mLayout.push([i,y]);if(on){g.fillStyle(0x2a2245);g.fillRect(10,y-2,180,10)}
   if(GEAR[id])this.invIcon(g,id,12,y-2,10,false);else{const c=id==='shard'?0xff8a3a:CONSUMABLES[id].col;g.fillStyle(c);g.fillRect(14,y,5,5)}
   const nm=id==='shard'?'EMBER SHARD':GEAR[id]?GEAR[id].name:CONSUMABLES[id].name;drawText(g,nm,26,y,on?0xffe2a8:0xd8d0ee);const ps=String(price);drawText(g,ps,188-textW(ps),y,this.souls>=price?0x9fd8ff:0x6b4a4a)});
  {const y=29+R.length*11;this.mLayout.push([R.length,y]);if(M.sel===R.length){g.fillStyle(0x2a2245);g.fillRect(10,y-2,180,10)}drawText(g,'LEAVE',26,y,M.sel===R.length?0xffe2a8:0xa8a0c8)}
  g.fillStyle(0x7a5a24);g.fillRect(196,26,1,130);const r=R[M.sel];if(r){const id=r[0];const L=id==='shard'?['TEMPERS A WEAPON AT THE','SMITH\'S ANVIL.']:GEAR[id]?[GEAR[id].desc,'TWO RINGS', 'MAY BE WORN.']:[{heal:'RESTORES HP',fp:'RESTORES FP',souls:'SOULS',guard:'+25% ABSORB FOR 12 S',stam:'FAST STAMINA FOR 10 S'}[CONSUMABLES[id].fx]||'','USED ON THE SPOT.'];
   if(GEAR[id])this.invIcon(g,id,202,30,24,false);L.forEach((s,i)=>drawText(g,s,202,60+i*10,0xd8c8b0))}
  if(M.say)drawText(g,M.say,12,162,0xd8c8b0)};
 SP.merchTap=function(p){const M=this.menu;for(const[i,y]of this.mLayout||[])if(p.y>=y-2&&p.y<y+9&&p.x>=10&&p.x<190){if(M.sel===i)this.menuKey('ok');else M.sel=i;return}if(p.x<6||p.x>314||p.y<10||p.y>174)this.menuKey('back')};
 const c2=SP.create;SP.create=function(...a){const r=c2.apply(this,a);this.input.on('pointerdown',p=>{if(this.menu&&this.menu.mode==='lmerch')this.merchTap(p)});return r};
}
if(typeof module!=='undefined')module.exports={RING_ART,RING_BOSS,RING_CHEST,MERCH_STOCK};
