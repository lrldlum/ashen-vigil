// ASHEN VIGIL — the Shrine smith: weapon upgrades +1..+5 paid in Ember Shards (sv.embers, shared with the merchants) + souls.
// Level lives in sv.wup[id].lv (the inventory's existing +N / infusion display reads it). Damage: RPG.derive's attack is scaled
// by the equipped weapon's level, so every screen that shows ATTACK and every hit (solo, host or guest) agree.
// Shards: enemies/chests/mimics drop 'embershard' (weights added below), every lord gives 2. Menu: keyboard + gamepad via menuKey.
'use strict';
const SMITH={MAX:5,COST:[[1,500],[1,1000],[2,1800],[3,2800],[4,4000]],STEP:.1,
 lv(sv,id){return Math.min(5,((sv&&sv.wup||{})[id]||{}).lv||0)},mul(lv){return 1+SMITH.STEP*lv},cur:null};
(()=>{
 CONSUMABLES.embershard={name:'EMBER SHARD',fx:'souls',col:0xff9a3a};
 for(const[t,w]of[['common',3],['elite',7],['chest',12]])if(DROP_TABLES[t]&&!DROP_TABLES[t].some(r=>r[0]==='embershard'))DROP_TABLES[t].push(['embershard',w]);
 const dv=RPG.derive;RPG.derive=function(st,eq,...a){const d=dv.call(this,st,eq,...a);const sv=SMITH.cur;if(d&&sv&&eq&&eq.main)d.ar*=SMITH.mul(SMITH.lv(sv,eq.main));return d};
 const SP=Stage.prototype;
 const ab=SP.applyBuild;SP.applyBuild=function(...a){SMITH.cur=this.sv;return ab.apply(this,a)};
 const td=SP.takeDrop;SP.takeDrop=function(d){const r=td.call(this,d);if(d&&d.kind==='embershard'){this.sv.embers=(this.sv.embers||0)+1;Save.write(this.sv)}return r};
 const aw=SP.awardSignature;SP.awardSignature=function(kind,x){const r=aw.call(this,kind,x);if(SIGNATURE[kind]&&!(this.sv.embLords||[]).includes(kind)){this.sv.embLords=[...(this.sv.embLords||[]),kind];this.sv.embers=(this.sv.embers||0)+2;Save.write(this.sv);this.pop('+2 EMBER SHARDS',this.player.x,this.player.y-34,0xff9a3a)}return r};
 SP.smithList=function(){const sv=this.sv;return[...new Set(sv.inv.filter(i=>WEAPONS[i]&&!WEAPONS[i].cat&&!WEAPONS[i].mir&&WEAPONS[i].hand!=='off'))]};
 SP.smithUp=function(id){const sv=this.sv,lv=SMITH.lv(sv,id);if(lv>=SMITH.MAX)return'MAX';const[e,s]=SMITH.COST[lv];
  if((sv.embers||0)<e)return'SHARDS';if(this.souls<s)return'SOULS';sv.embers-=e;this.souls-=s;sv.souls=this.souls;sv.wup=sv.wup||{};sv.wup[id]={...(sv.wup[id]||{}),lv:lv+1};Save.write(sv);this.applyBuild(false);return'OK'};
 const it=SP.interact;SP.interact=function(){const D=this.def,P=this.player;if(D.hub&&typeof HOME_SMITH!=='undefined'&&Math.abs(P.x-HOME_SMITH)<16){SMITH.cur=this.sv;this.menu={mode:'smith',sel:0,t:0,prev:{},npc:1,say:'THE SMITH: BRING ME EMBERS AND I WILL FOLD THEM IN.'};this.sfx('clang',.3);return true}return it.call(this)};
 const ih=SP.interactHint;SP.interactHint=function(){const h=ih.call(this);return h==='Talk'&&this.def.hub&&Math.abs(this.player.x-HOME_SMITH)<16?'Upgrade':h};
 const mk=SP.menuKey;SP.menuKey=function(k){const M=this.menu;if(!M||M.mode!=='smith')return mk.call(this,k);const L=[...this.smithList(),null],n=L.length;this.sfx('menu',.2);
  if(k==='up')M.sel=(M.sel+n-1)%n;else if(k==='down')M.sel=(M.sel+1)%n;else if(k==='back'||(k==='ok'&&L[M.sel]===null))this.menu=null;
  else if(k==='ok'){const id=L[M.sel],r=this.smithUp(id);M.say=r==='OK'?itemName(id)+' +'+SMITH.lv(this.sv,id)+'. THE STEEL REMEMBERS.':r==='MAX'?'IT CAN TAKE NO MORE, ASHEN ONE.':r==='SHARDS'?'NOT ENOUGH EMBER SHARDS.':'YOU LACK THE SOULS.';
   if(r==='OK'){this.sfx('clang',.5);this.fx.spark(HOME_SMITH+14,GY-8,16,0xff9a3a,110)}else this.sfx('clang',.15)}};
 const dm=SP.drawMenu0;SP.drawMenu0=function(g,ga){const M=this.menu;if(M.mode!=='smith')return dm.call(this,g,ga);const sv=this.sv,L=[...this.smithList(),null];
  g.fillStyle(0x07050f,.92);g.fillRect(6,14,308,160);g.fillStyle(0x7a5a24);g.fillRect(6,14,308,1);g.fillRect(6,173,308,1);g.fillRect(6,14,1,160);g.fillRect(313,14,1,160);
  drawText(g,'THE SMITH - REINFORCE',12,19,0xffb04a);drawText(g,'SHARDS '+(sv.embers||0)+'  SOULS '+this.souls,180,19,0xff9a3a);
  const top=Math.max(0,Math.min(M.sel-6,L.length-13));L.slice(top,top+13).forEach((id,j)=>{const i=top+j,y=32+j*9,on=i===M.sel;
   if(!id){drawText(g,(on?'> ':'  ')+'LEAVE',12,y,on?0xffe2a8:0xb8b4d8);return}const lv=SMITH.lv(sv,id);drawText(g,(on?'> ':'  ')+itemName(id).slice(0,16)+(lv?' +'+lv:''),12,y,on?0xffe2a8:0xb8b4d8)});
  const id=L[M.sel];g.fillStyle(0x7a5a24);g.fillRect(170,30,1,110);
  if(id){const lv=SMITH.lv(sv,id),W0=WEAPONS[id],a=RPG.ar(W0,sv.stats);if(typeof WEAPART!=='undefined'&&this.invIcon)this.invIcon(g,id,178,32,24,false);
   drawText(g,itemName(id),206,34,0xffe2a8);drawText(g,'LEVEL +'+lv+' / +'+SMITH.MAX,178,62,0xd8d0ee);
   drawText(g,'ATTACK '+Math.round(a*SMITH.mul(lv)*100)+(lv<SMITH.MAX?' > '+Math.round(a*SMITH.mul(lv+1)*100):''),178,74,0x8a86c0);
   if(lv<SMITH.MAX){const[e,s]=SMITH.COST[lv];drawText(g,'COST '+e+' SHARD'+(e>1?'S':''),178,90,(sv.embers||0)>=e?0xff9a3a:0x6b4a4a);drawText(g,'     '+s+' SOULS',178,100,this.souls>=s?0x9fd8ff:0x6b4a4a)}else drawText(g,'FULLY REINFORCED',178,90,0xffd04a)}
  drawText(g,M.say||'',12,160,0xd8c8b0)};
})();
