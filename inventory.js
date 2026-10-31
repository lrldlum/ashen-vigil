// ASHEN VIGIL — DS3-style visual inventory + equip screen (bonfire > EQUIPMENT).
// Left: the character model (drawn at 2x with the equipped weapon/armor) with labelled slots around it: R/L hand, head,
// chest, hands, legs, two rings; below it 4 spell slots and 3 consumable slots. Empty slots are outlines.
// Right: a pixel-icon grid of every item that fits the selected slot, each icon carrying its stats (damage or absorb,
// +upgrade and infusion, best scaling letter, weight), plus a before/after stat comparison for the highlighted item.
// A / Enter / Z on a slot opens its grid; on an item equips it at once (the model updates); B / Esc backs out.
// D-pad / arrows / stick move; touch: tap a slot, tap an item to highlight, tap it again to equip, tap outside to go back.
// Data model: sv.eq = {main, off, armor (chest), head, hands, legs, ring1, ring2, q1..q3}; sv.att.slots = 4 spell ids;
// sv.wup = {itemId: {lv: 0-10, inf: infusion id}} (upgrades/infusions hook here).
'use strict';
const GEAR={
 iron_helm:{slot:'head',name:'IRON HELM',w:4,poise:4,abs:.05},rime_hood:{slot:'head',name:'RIMEBOUND HOOD',w:1.5,poise:1,abs:.03,fp:10},
 iron_gauntlets:{slot:'hands',name:'IRON GAUNTLETS',w:3,poise:3,abs:.04},hunter_gloves:{slot:'hands',name:'HUNTER GLOVES',w:1,poise:1,abs:.02},
 iron_greaves:{slot:'legs',name:'IRON GREAVES',w:5,poise:5,abs:.05},cloth_trousers:{slot:'legs',name:'CLOTH TROUSERS',w:1,poise:0,abs:.02},
 ring_life:{slot:'ring',name:'RING OF EMBERS',w:.5,hpMul:.1,desc:'+10% HP'},ring_sage:{slot:'ring',name:'SAGE RING',w:.5,fp:25,desc:'+25 FP'},
 ring_greed:{slot:'ring',name:'COVETOUS RING',w:.5,soul:.1,desc:'+10% SOULS'},ring_steel:{slot:'ring',name:'STEEL RING',w:1,abs:.05,desc:'+5% ABSORB'}};
const INF={heavy:{name:'HEAVY',c:0xb8b0a0},sharp:{name:'SHARP',c:0x9fe0ff},fire:{name:'FIRE',c:0xff8a2a},frost:{name:'FROST',c:0x9fd8ff},lightning:{name:'LTNG',c:0xfff08a},dark:{name:'DARK',c:0xb070ff},holy:{name:'HOLY',c:0xffe8a0}};
const INV_SPELLS=4;
// the portrait: the in-game hero art at an integer nearest-neighbour scale (pixel rects, no filtering), feet on the plinth
const INV_HS=4,INV_HX=52,INV_HY=129;
// extra armor pieces + rings feed the derived build (pure: same inputs -> same build)
(()=>{const d0=RPG.derive.bind(RPG);RPG.derive=function(st,eq){const d=d0(st,eq);if(!eq)return d;let w=0,po=0,ab=0,hp=0,fp=0,so=0;
 for(const k of['head','hands','legs','ring1','ring2']){const G=GEAR[eq[k]];if(!G)continue;w+=G.w||0;po+=G.poise||0;ab+=G.abs||0;hp+=G.hpMul||0;fp+=G.fp||0;so+=G.soul||0}
 if(!(w||po||ab||hp||fp||so))return d;d.w=+(d.w+w).toFixed(1);d.ratio=d.w/d.load;const r=d.ratio;d.roll=r<.3?{kind:'LIGHT',t:.32,v:215,i0:.03,i1:.26,cost:22}:r<.7?{kind:'MEDIUM',t:.36,v:170,i0:.04,i1:.24,cost:25}:r<=1?{kind:'HEAVY',t:.5,v:110,i0:.06,i1:.2,cost:32}:{kind:'OVERLOADED',t:0,v:0,i0:0,i1:0,cost:0};
 d.poise+=po;d.abs=Math.min(.6,d.abs+ab);d.hp=Math.round(d.hp*(1+hp));d.fp+=fp;d.soulMul+=so;return d}})();
(()=>{const SP=Stage.prototype;
 // slot layout around the model (screen px); nav: [up,down,left,right] slot indices
 const SLOTS=[{k:'main',lab:'R HAND',x:10,y:30},{k:'off',lab:'L HAND',x:10,y:56},{k:'ring1',lab:'RING',x:10,y:82},{k:'ring2',lab:'RING',x:10,y:108},
  {k:'head',lab:'HEAD',x:96,y:30},{k:'armor',lab:'CHEST',x:96,y:56},{k:'hands',lab:'HANDS',x:96,y:82},{k:'legs',lab:'LEGS',x:96,y:108},
  {k:'sp0',lab:'',x:8,y:140},{k:'sp1',lab:'',x:27,y:140},{k:'sp2',lab:'',x:46,y:140},{k:'sp3',lab:'',x:65,y:140},
  {k:'q1',lab:'',x:84,y:140},{k:'q2',lab:'',x:103,y:140},{k:'q3',lab:'',x:122,y:140}];
 const NAV=[[8,1,4,4],[0,2,5,5],[1,3,6,6],[2,8,7,7],[12,5,0,0],[4,6,1,1],[5,7,2,2],[6,13,3,3],[3,0,14,9],[3,0,8,10],[3,0,9,11],[3,0,10,12],[7,4,11,13],[7,4,12,14],[7,4,13,8]];
 SP.invAtt=function(){const sv=this.sv;if(!sv.att){sv.att={lv:0,stones:0,sel:0,slots:[]};sv.att.slots=this.invSpellsKnown().slice(0,INV_SPELLS)}return sv.att};
 SP.invSpellsKnown=function(){if(this.spKnown)return this.spKnown();const sv=this.sv,o=[];if(this.build&&this.build.cat)o.push('ice','bolt','dome');for(const k of Object.keys(MIRACLES))if(sv.inv.includes(k))o.push(k);return o};
 SP.invUp=function(id){const u=(this.sv.wup||{})[id]||{};return{lv:u.lv||0,inf:u.inf||null}};
 SP.invCur=function(k){const sv=this.sv;if(k.startsWith('sp'))return this.invAtt().slots[+k[2]]||null;if(k==='q1')return sv.eq.q1||'flask';return sv.eq[k]||null};
 // what can go in a slot: null = take it off (not for the right hand)
 SP.invOpts=function(k){const sv=this.sv,inv=sv.inv;
  if(k==='main')return inv.filter(i=>WEAPONS[i]&&WEAPONS[i].hand==='main');if(k==='off')return[null,...inv.filter(i=>WEAPONS[i]&&WEAPONS[i].hand==='off')];
  if(k==='armor')return['none',...inv.filter(i=>ARMORS[i]&&i!=='none')];if(k==='head'||k==='hands'||k==='legs')return[null,...inv.filter(i=>GEAR[i]&&GEAR[i].slot===k)];
  if(k==='ring1'||k==='ring2'){const other=sv.eq[k==='ring1'?'ring2':'ring1'];return[null,...inv.filter(i=>GEAR[i]&&GEAR[i].slot==='ring'&&i!==other)]}
  if(k.startsWith('sp'))return[null,...this.invSpellsKnown()];if(k[0]==='q')return k==='q1'?['flask']:[null,...inv.filter(i=>typeof THROWN!=='undefined'&&THROWN[i])];return[]};
 SP.invEquip=function(k,id){const sv=this.sv;if(k.startsWith('sp')&&id&&this.spLocked&&this.spLocked(id)){if(this.menu)this.menu.say='SORCERER ONLY - NEEDS THE SORCERER CLASS OR INT 24';this.sfx('clang',.2);return false}if(k.startsWith('sp')){const A=this.invAtt(),i=+k[2];const s=A.slots.slice(0,INV_SPELLS);while(s.length<INV_SPELLS)s.push(null);const j=s.indexOf(id);if(id&&j>=0&&j!==i)s[j]=s[i];s[i]=id;A.slots=s.filter(Boolean);A.sel=0}
  else if(k==='q1'){}else sv.eq[k]=id;this.applyBuild(false);Save.write(sv);this.stats.invEquips=(this.stats.invEquips||0)+1};
 SP.invBuildWith=function(k,id){const sv=this.sv;if(k.startsWith('sp')||k[0]==='q')return this.build;return RPG.derive(sv.stats,{...sv.eq,[k]:id})};
 const mk=SP.menuKey;SP.menuKey=function(k){const M=this.menu;
  if(M&&M.mode==='main'&&k==='ok'&&this.mainOpts()[M.sel]==='EQUIPMENT'){this.sfx('menu',.2);this.menu={mode:'inv',slot:0,focus:'slots',gi:0,t:M.t,prev:M.prev,back:M.sel};return}
  if(M&&M.mode==='inv'){this.sfx('menu',.2);const S=SLOTS[M.slot];
   if(M.focus==='slots'){const d={up:0,down:1,left:2,right:3}[k];if(d!=null){M.slot=NAV[M.slot][d];return}
    if(k==='ok'){const o=this.invOpts(S.k);if(!o.length)return;M.focus='grid';M.gi=Math.max(0,o.indexOf(this.invCur(S.k)));return}
    if(k==='back'){this.menu={mode:'main',sel:this.mainOpts().indexOf('EQUIPMENT'),t:1,prev:{}};return}}
   else{const o=this.invOpts(S.k),n=o.length,C=6;
    if(k==='left')M.gi=(M.gi+n-1)%n;else if(k==='right')M.gi=(M.gi+1)%n;else if(k==='up')M.gi=M.gi-C>=0?M.gi-C:M.gi;else if(k==='down')M.gi=Math.min(n-1,M.gi+C);
    else if(k==='ok'){if(this.invEquip(S.k,o[M.gi])!==false){this.sfx('pickup',.3);M.flash=.3;M.say=null}}else if(k==='back')M.focus='slots';return}}
  return mk.call(this,k)};
 // Esc on the inventory goes back a level instead of closing everything
 const cr=SP.create;SP.create=function(...a){const r=cr.apply(this,a);
  this.input.on('pointerdown',p=>{const M=this.menu;if(!M||M.mode!=='inv')return;const x=p.x,y=p.y,L=this.invLayout||{};
   for(let i=0;i<SLOTS.length;i++){const s=SLOTS[i];if(x>=s.x&&x<s.x+18&&y>=s.y&&y<s.y+18){M.slot=i;M.focus='slots';this.menuKey('ok');return}}
   if(L.cells)for(const[i,cx,cy]of L.cells)if(x>=cx&&x<cx+20&&y>=cy&&y<cy+20){if(M.focus==='grid'&&M.gi===i)this.menuKey('ok');else{M.focus='grid';M.gi=i}return}
   if(x>316||y>176||x<4||y<4)this.menuKey('back');else if(M.focus==='grid'&&x<146)M.focus='slots'});return r};
 // ---------- drawing ----------
 const tiny=(g,s,x,y,c)=>{s=String(s).toUpperCase();g.fillStyle(c);for(let i=0;i<s.length;i++){const F=FONT[s[i]];if(!F)continue;for(let r=0;r<5;r++)for(let q=0;q<3;q++)if(F[r*3+q]==='1')g.fillRect(x+i*4+q,y+r,1,1)}};
 const tinyO=(g,s,x,y,c)=>{for(const[dx,dy]of[[-1,0],[1,0],[0,-1],[0,1]])tiny(g,s,x+dx,y+dy,0x07050f);tiny(g,s,x,y,c)};
 SP.invIcon=function(g,id,x,y,s=18,stats=true){if(!id){return}const W0=WEAPONS[id],A=ARMORS[id],G=GEAR[id],m=s/18,cx=x+s/2|0,cy=y+s/2|0,R=(a,b,w,h,c)=>{g.fillStyle(c);g.fillRect(x+Math.round(a*m),y+Math.round(b*m),Math.max(1,Math.round(w*m)),Math.max(1,Math.round(h*m)))};
  if(typeof SPELLBOOK!=='undefined'&&SPELLBOOK[id]&&this.spIcon){this.spIcon(g,id,x+1,y+1,s-2);return}
  if(SPELLS[id]||MIRACLES[id]){const c=MIRACLES[id]?0xffe8a0:id==='bolt'?0xfff08a:0x9fe0ff;R(3,3,12,12,0x1a1630);R(8,4,2,10,c);R(4,8,10,2,c);return}
  if(id==='flask'){R(7,2,4,3,0x8a7a60);R(5,5,8,10,0x3a2a20);R(6,6,6,8,0xff8a2a);R(7,7,2,3,0xffe2a8);if(stats)tinyO(g,'X'+(TUNE.flaskN+(this.sv.flaskBonus||0)),x+s-9,y+s-6,0xffe2a8);return}
  if(W0){const t=W0.type,M=0xc8c8d8,D=0x6a5a48,Gd=0xd8b060;
   const pxI=s>=12&&typeof WEAPART!=='undefined'&&WEAPART.icon(this,g,id,x,y,s);
   if(pxI);else if(t==='sword'){R(8,2,2,11,M);R(5,12,8,1,Gd);R(8,13,2,3,D)}else if(t==='greatsword'){R(7,1,4,12,M);R(4,12,10,2,Gd);R(8,14,2,3,D)}
   else if(t==='dagger'){R(8,5,2,7,M);R(6,11,6,1,Gd);R(8,12,2,3,D)}else if(t==='spear'){R(8,1,2,3,M);R(7,3,4,1,M);R(8,4,2,13,D)}
   else if(t==='axe'){R(8,2,2,15,D);R(4,3,4,6,M);R(3,4,1,4,M)}else if(t==='bow'){R(5,2,1,14,D);R(6,1,2,1,D);R(6,16,2,1,D);R(9,2,1,14,0xd8d0ee)}
   else if(t==='staff'){R(8,4,2,13,D);R(7,1,4,4,0x9fe0ff)}else if(t==='wand'){R(8,6,2,10,D);R(8,4,2,2,0xff8a2a)}else if(t==='talisman'){R(5,4,8,9,0xd8b060);R(8,6,2,5,0x3a2a20);R(6,8,6,1,0x3a2a20)}
   else{R(8,2,2,14,M)}
   if(stats){const u=this.invUp(id),st=this.sv.stats;const dmg=W0.cat||W0.mir?Math.round(RPG[W0.mir?'mirBuff':'spellBuff'](W0,st)*100):Math.round(RPG.ar(W0,st)*100);
    tinyO(g,dmg,x+1,y+1,RPG.meets(W0,st)?0xffe2a8:0xd8402a);const sc=Object.values(W0.sc||{}).sort((a,b)=>'SABCDE'.indexOf(a)-'SABCDE'.indexOf(b))[0]||W0.csc;if(sc)tinyO(g,sc,x+s-4,y+1,0x9fd8ff);
    tinyO(g,String(W0.w),x+1,y+s-6,0xa8a0c8);if(u.lv)tinyO(g,'+'+u.lv,x+s-9,y+s-6,0xffd04a);if(u.inf){g.fillStyle(INF[u.inf].c);g.fillRect(x,y,s,1)}}return}
  if(A||G){const sl=A?'chest':G.slot,M=0x9a9ab0,P=(A&&A.pal)?A.pal.b:G&&/rime|cloth|hood/.test(id)?0xb8d0ec:M;
   if(sl==='chest'){R(5,4,8,10,P);R(3,4,2,5,P);R(13,4,2,5,P);R(7,4,4,2,0x07050f)}else if(sl==='head'){R(5,4,8,9,P);R(6,8,6,2,0x07050f);R(8,2,2,2,P)}
   else if(sl==='hands'){R(3,6,5,7,P);R(10,6,5,7,P);R(3,5,5,1,0xd8d0ee);R(10,5,5,1,0xd8d0ee)}else if(sl==='legs'){R(5,3,8,4,P);R(5,7,3,9,P);R(10,7,3,9,P)}
   else{R(5,6,8,8,0xd8b060);R(7,8,4,4,0x07050f);R(8,3,2,3,G.fp?0x9fe0ff:G.soul?0x58e070:0xff6a4a)}
   if(stats){const o=A||G;if(sl!=='ring')tinyO(g,Math.round((o.abs||0)*100),x+1,y+1,0xd8d0ee);tinyO(g,String(o.w),x+1,y+s-6,0xa8a0c8)}}};
 SP.invNameOf=function(id){if(!id)return'EMPTY';if(GEAR[id])return GEAR[id].name;if(typeof SPELLBOOK!=='undefined'&&SPELLBOOK[id])return SPELLBOOK[id].name+(this.spLocked&&this.spLocked(id)?' (LOCKED)':'');return itemName(id)};
 const dm=SP.drawMenu0;SP.drawMenu0=function(g,ga){const M=this.menu;if(M.mode!=='inv')return dm.call(this,g,ga);const sv=this.sv,t=this.t;
  if(M.flash>0)M.flash-=this.dt;
  const panel=(x,y,w,h)=>{g.fillStyle(0x07050f,1);g.fillRect(x,y,w,h);g.fillStyle(0x7a5a24);g.fillRect(x,y,w,1);g.fillRect(x,y+h-1,w,1);g.fillRect(x,y,1,h);g.fillRect(x+w-1,y,1,h);g.fillStyle(0xd8b060);[[x,y],[x+w-1,y],[x,y+h-1],[x+w-1,y+h-1]].forEach(([a,b])=>g.fillRect(a,b,1,1))};
  panel(4,4,140,172);panel(146,4,170,172);tiny(g,'EQUIPMENT',10,10,0xffb04a);tiny(g,CLASSES[sv.cls].name+' LV '+this.lvl,60,10,0x8a86c0);
  // the model: 2x, wearing what's equipped (live)
  const W0=WEAPONS[sv.eq.main],AR=ARMORS[sv.eq.armor||'none'];g.fillStyle(0x15112a);g.fillRect(32,26,62,106);g.fillStyle(0x221c3a);g.fillRect(36,129,54,3);
  heroStyle(W0,false,AR);g.save();g.translateCanvas(INV_HX,INV_HY);g.scaleCanvas(INV_HS,INV_HS);drawHero(g,0,0,1,'idle',Math.floor(t*2)%2,t,{flash:M.flash>0});NET.localStyle(this);heroStyle(this.wp,false,ARMORS[sv.eq.armor||'none']);
  // head/hands/legs/rings drawn as overlays on the model
  const H=GEAR[sv.eq.head],HA=GEAR[sv.eq.hands],LG=GEAR[sv.eq.legs];if(H){g.fillStyle(/rime/.test(sv.eq.head)?0xb8d0ec:0x8a8a9a);g.fillRect(-2,-21,5,2)}if(HA){g.fillStyle(0x8a8a9a);g.fillRect(-4,-10,2,2);g.fillRect(3,-10,2,2)}if(LG){g.fillStyle(/cloth/.test(sv.eq.legs)?0x6a5a48:0x8a8a9a);g.fillRect(-3,-5,7,2)}g.restore();
  // slots
  this.invLayout={cells:[]};SLOTS.forEach((s,i)=>{const id=this.invCur(s.k),on=M.slot===i;g.fillStyle(id?0x221c3a:0x0d0a18);g.fillRect(s.x,s.y,18,18);
   g.fillStyle(on?(M.focus==='slots'?0xffe2a8:0xb08a40):id?0x6a5a88:0x3a3458);g.fillRect(s.x,s.y,18,1);g.fillRect(s.x,s.y+17,18,1);g.fillRect(s.x,s.y,1,18);g.fillRect(s.x+17,s.y,1,18);
   if(id&&id!=='none')this.invIcon(g,id,s.x,s.y,18,false);if(s.lab)tiny(g,s.lab,s.x+(s.x>60?-1:0),s.y-6,on?0xffe2a8:0x6a6490)});
  tiny(g,'SPELLS',8,134,0x6a6490);if(M.say)tiny(g,M.say,150,166,0xd8402a);tiny(g,'ITEMS',84,134,0x6a6490);
  // right: grid for the selected slot
  const S=SLOTS[M.slot],o=this.invOpts(S.k),cur=this.invCur(S.k),C=6;tiny(g,S.lab||(S.k.startsWith('sp')?'SPELL':'ITEM'),152,10,0xffb04a);tiny(g,'A EQUIP  B BACK',240,10,0x6a6490);
  const top=Math.max(0,Math.floor((M.gi||0)/C)-2)*C;
  o.slice(top,top+C*3).forEach((id,j)=>{const i=top+j,x=152+(j%C)*27,y=20+Math.floor(j/C)*27;this.invLayout.cells.push([i,x,y]);const on=M.focus==='grid'&&M.gi===i,eq=id===cur||(id==='none'&&!cur);
   g.fillStyle(0x15112a);g.fillRect(x,y,24,24);g.fillStyle(on?0xffe2a8:eq?0xb08a40:0x3a3458);g.fillRect(x,y,24,1);g.fillRect(x,y+23,24,1);g.fillRect(x,y,1,24);g.fillRect(x+23,y,1,24);
   if(id&&id!=='none')this.invIcon(g,id,x+3,y+3,18,true);else{g.fillStyle(0x4a4468);g.fillRect(x+7,y+11,10,2)}if(eq){g.fillStyle(0xffd04a);g.fillRect(x+20,y+20,2,2)}});
  if(!o.length)tiny(g,'NOTHING FITS THIS SLOT YET',152,30,0x6a6490);
  // details + before/after
  const hi=M.focus==='grid'?o[M.gi]:cur;g.fillStyle(0x7a5a24);g.fillRect(150,104,162,1);tiny(g,this.invNameOf(hi==='none'?null:hi),152,108,0xffe2a8);
  {const u=hi&&this.invUp(hi);if(u&&(u.lv||u.inf))tiny(g,(u.inf?INF[u.inf].name+' ':'')+'+'+u.lv,262,108,0xffd04a);
   const W1=WEAPONS[hi],G=GEAR[hi];tiny(g,W1?(RPG.letters(W1)||'NO SCALING')+'  REQ '+(RPG.reqs(W1)||'-'):G?(G.desc||('POISE '+(G.poise||0)+'  ABS '+Math.round((G.abs||0)*100)+'%'))+'  WT '+G.w:'',152,115,0x8a86c0)}
  const b0=this.build,b1=M.focus==='grid'?this.invBuildWith(S.k,o[M.gi]):b0;
  const rows=[['ATTACK',Math.round(b0.ar*100),Math.round(b1.ar*100)],['SPELL',Math.round(b0.spell*100),Math.round(b1.spell*100)],['MIRACLE',Math.round((b0.mir||0)*100),Math.round((b1.mir||0)*100)],['HP',b0.hp,b1.hp],['FP',b0.fp,b1.fp],['POISE',b0.poise,b1.poise],['ABSORB %',Math.round(b0.abs*100),Math.round(b1.abs*100)],['LOAD',b0.w,b1.w,1]];
  rows.forEach(([n,a,b,inv],i)=>{const x=152+(i%2)*82,y=124+Math.floor(i/2)*8;tiny(g,n,x,y,0xa8a0c8);tiny(g,String(a),x+44,y,0xd8d0ee);if(b!==a){const up=inv?b<a:b>a;tiny(g,'>'+b,x+60,y,up?0x58e070:0xd8402a)}});
  const rc=k=>k==='LIGHT'?0x58e070:k==='MEDIUM'?0xd8d0ee:k==='HEAVY'?0xffb04a:0xd8402a;tiny(g,'ROLL '+b0.roll.kind,152,160,rc(b0.roll.kind));if(b1.roll.kind!==b0.roll.kind)tiny(g,'> '+b1.roll.kind,220,160,rc(b1.roll.kind));
  tiny(g,M.focus==='slots'?'ARROWS PICK A SLOT':'ARROWS PICK AN ITEM',152,168,0x4a4468)};
})();
