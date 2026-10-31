// ASHEN VIGIL — Travel to Home: every bonfire can warp to the Ash Shrine hub; the hub bonfire lists every unlocked stage.
// The shrine is a safe home (no enemies): bonfire, the Ash Keeper, plus a blacksmith and a merchant (placeholders; the
// merchant opens the spell merchant stub from spells.js). Travel saves first. Co-op: only the host travels, the guest follows
// (net.js follows the host's stage id).
'use strict';
const HOME_SMITH=342,HOME_MERCH=506;
(()=>{const SP=Stage.prototype;
 const cr=SP.create;SP.create=function(...a){const r=cr.apply(this,a);try{const sv=this.sv;if(sv&&sv.homeSpawn&&this.def.hub&&this.bonfire){delete sv.homeSpawn;this.pb.setPosition(this.bonfire.x+14,this.pb.y);Save.write(sv)}if(sv){sv.visited=Array.isArray(sv.visited)?sv.visited:[];if(this.sid&&!this.def.hub&&!sv.visited.includes(this.sid)){sv.visited.push(this.sid);Save.write(sv)}}}catch(e){}return r};
 // stages you can travel back to from home: visited ones (+ the first stage), in stage-definition order
 SP.homeStages=function(){const v=new Set([...(this.sv.visited||[]),'ramparts']);return Object.keys(STAGE_DEFS).filter(k=>!STAGE_DEFS[k].hub&&v.has(k))};
 const mo=SP.mainOpts;SP.mainOpts=function(){const o=mo.call(this).filter(s=>s!=='TRAVEL TO THE SHRINE');const i=o.indexOf('LEAVE');o.splice(i<0?o.length:i,0,this.def.hub?'TRAVEL TO A STAGE':'TRAVEL TO HOME');return o};
 SP.homeGo=function(to){if(NET.guest()){this.menu=null;this.pop('THE HOST LEADS THE WAY',this.player.x,this.player.y-26,0x9ff0dc);return}
  this.sv.souls=this.souls;Save.write(this.sv);this.stats.homeTravel=(this.stats.homeTravel||0)+1;
  if(to==='shrine'){this.sv.homeSpawn=1;this.say('TRAVELLING HOME',1.4);this.travel('shrine',{next:this.def.side?this.sv.hubNext:this.sid,bonfire:true})}else{this.say('TRAVELLING TO '+STAGE_DEFS[to].name,1.4);this.sv.hubNext=to;this.travel(to)}};
 const mk=SP.menuKey;SP.menuKey=function(k){const M=this.menu;
  if(M&&M.mode==='main'&&k==='ok'){const o=this.mainOpts()[M.sel];if(o==='TRAVEL TO HOME'){this.sfx('menu',.2);this.homeGo('shrine');return}if(o==='TRAVEL TO A STAGE'){this.sfx('menu',.2);M.mode='travel';M.sel=0;return}}
  if(M&&M.mode==='travel'){this.sfx('menu',.2);const L=[...this.homeStages(),null],n=L.length;if(k==='up')M.sel=(M.sel+n-1)%n;else if(k==='down')M.sel=(M.sel+1)%n;
   else if(k==='back'||k==='ok'&&L[M.sel]===null){M.mode='main';M.sel=this.mainOpts().indexOf('TRAVEL TO A STAGE')}else if(k==='ok')this.homeGo(L[M.sel]);return}
  if(M&&M.npc&&k==='back'&&M.mode==='merchant'){this.menu=null;return}
  return mk.call(this,k)};
 const dm=SP.drawMenu0;SP.drawMenu0=function(g,ga){const M=this.menu;if(M.mode!=='travel')return dm.call(this,g,ga);const L=[...this.homeStages(),null];
  g.fillStyle(0x07050f,.92);g.fillRect(8,30,170,24+L.length*11);g.fillStyle(0x7a5a24);g.fillRect(8,30,170,1);g.fillRect(8,53+L.length*11,170,1);
  drawText(g,'TRAVEL FROM THE SHRINE',14,35,0xffb04a);this.spLayout={x0:8,x1:178,y0:30,y1:54+L.length*11,rx:10,rw:166,rows:[]};
  L.forEach((s,i)=>{const y=49+i*11,on=i===M.sel;this.spLayout.rows.push([i,y]);if(on){g.fillStyle(0x2a2245);g.fillRect(10,y-2,166,10)}drawText(g,(on?'> ':'  ')+(s?STAGE_DEFS[s].name:'BACK'),14,y,on?0xffe2a8:0xd8d0ee)})};
 // touch rows for the travel list reuse the spells.js row tapper
 SP.create=(c=>function(...a){const r=c.apply(this,a);this.input.on('pointerdown',p=>{const M=this.menu;if(!M||M.mode!=='travel')return;const L=this.spLayout;for(const[i,ry]of L.rows)if(p.y>=ry-1&&p.y<ry+8&&p.x>=L.rx&&p.x<L.rx+L.rw){if(M.sel===i)this.menuKey('ok');else M.sel=i;return}if(p.x<L.x0||p.x>L.x1||p.y<L.y0||p.y>L.y1)this.menuKey('back')});return r})(SP.create);
 // the home NPCs: interact + prompt + drawing
 const ih=SP.interactHint;SP.interactHint=function(){const h=ih.call(this);if(h&&h!=='Rest')return h;const D=this.def,P=this.player;if(D.hub&&P&&this.pb.body.blocked.down&&!this.menu){if(Math.abs(P.x-HOME_MERCH)<16)return'Trade';if(Math.abs(P.x-HOME_SMITH)<16)return'Talk'}return h};
 const it=SP.interact;SP.interact=function(){const D=this.def,P=this.player;if(D.hub){if(Math.abs(P.x-HOME_MERCH)<16){if(!this.spShopRows){/* r9: until spells ship, the pedlar sells the keeper's stock */this.menu={mode:'shop',sel:0,t:0,prev:{},pedlar:1};this.pb.setVelocityX(0);this.sfx('talk',.3);return true}this.menu={mode:'merchant',sel:0,t:0,prev:{},npc:1,say:'THE PEDLAR BOWS. WARES FOR THE ASHEN.'};this.sfx('talk',.3);return true}
   if(Math.abs(P.x-HOME_SMITH)<16){this.say('THE SMITH: MY FORGE IS STILL COLD, ASHEN ONE. COME BACK WHEN THE EMBERS TAKE.',2.6);this.sfx('clang',.3);return true}}return it.call(this)};
 const ds=SP.drawStory;SP.drawStory=function(g,ga){ds.call(this,g,ga);const D=this.def;if(!D.hub)return;const t=this.t,y=GY;
  // blacksmith: broad, leather apron, anvil with a dull ember
  {const x=HOME_SMITH;g.fillStyle(0x2a2228);g.fillRect(x+8,y-6,14,6);g.fillRect(x+10,y-9,10,3);g.fillStyle(0x4a4048);g.fillRect(x+9,y-9,12,1);
   const gl=.5+.3*Math.sin(t*2);ga.fillStyle(0xff7a2a,.25*gl);ga.fillRect(x+12,y-11,6,3);
   g.fillStyle(0x1a1418);g.fillRect(x-5,y-22,10,22);g.fillStyle(0x6a3a24);g.fillRect(x-4,y-17,8,14);g.fillStyle(0x8a6a58);g.fillRect(x-3,y-27,6,6);g.fillStyle(0x3a2a20);g.fillRect(x-4,y-28,8,2);
   g.fillStyle(0x5a5a66);g.fillRect(x+5,y-20,2,8);g.fillRect(x+4,y-21,4,2)}
  // merchant: hooded pedlar with a lantern and a pack of scrolls
  {const x=HOME_MERCH,b=Math.round(Math.sin(t*1.3));g.fillStyle(0x3a2a48);g.fillRect(x-5,y-20+b,10,20-b);g.fillStyle(0x241a30);g.fillRect(x-4,y-25+b,8,6);g.fillStyle(0x0a080e);g.fillRect(x-2,y-23+b,4,3);
   g.fillStyle(0x6a5030);g.fillRect(x+5,y-18+b,7,10);g.fillStyle(0xd8c8a0);g.fillRect(x+6,y-21+b,2,4);g.fillRect(x+9,y-20+b,2,3);
   g.fillStyle(0x8a7a60);g.fillRect(x-8,y-16,1,6);g.fillStyle(0xffd070);g.fillRect(x-9,y-10,3,3);ga.fillStyle(0xffb04a,.18);ga.fillRect(x-14,y-15,13,12)}};
})();
