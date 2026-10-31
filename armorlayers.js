// ASHEN VIGIL — layered armor on the pixel hero. Equipped head/chest/hands/legs each draw an overlay sprite that follows
// the hero's frame, flip, position and depth (draw order legs, chest, hands, head). Art: Artist's strips
// assets/art/sheets_pixel/armor/<slot>_<pieceId>.png (46x46, same 30-frame layout) listed in armor/armor.json. Pieces
// without art (and unequipped slots) show the base hero. Co-op: equip ids ride NET.me() (hd/ch/hn/lg).
'use strict';

// Artist's 16 set pieces (data.js design sheet) become real items: chest -> ARMORS, head/hands/legs -> GEAR; they drop as 'gear'
const ARMOR_SETS={
 plate_head:['head','SENTINEL HELM',4,6],plate_chest:['chest','SENTINEL PLATE',10,14],plate_hands:['hands','SENTINEL GAUNTLETS',3,4],plate_legs:['legs','SENTINEL GREAVES',5,7],
 rags_head:['head','ASHEN HOOD',.5,2],rags_chest:['chest','ASHEN RAGS',1.5,4],rags_hands:['hands','ASHEN WRAPS',.3,1],rags_legs:['legs','ASHEN LEGGINGS',.7,2],
 choir_head:['head','PALE CHOIR VEIL',1,4],choir_chest:['chest','PALE CHOIR ROBE',3,9],kiln_chest:['chest','KILN IRON CUIRASS',16,22],kiln_legs:['legs','KILN IRON GREAVES',8,11],
 leather_chest:['chest','WANDERER COAT',4,8],leather_legs:['legs','WANDERER BOOTS',2,4],lamp_chest:['chest','LAMP VESTMENT',2.5,6],lamp_legs:['legs','LAMP SKIRT',1.2,3]};
(()=>{for(const [id,[slot,name,w,abs]] of Object.entries(ARMOR_SETS)){
  if(slot==='chest'){if(typeof ARMORS!=='undefined'&&!ARMORS[id])ARMORS[id]={name,w,poise:Math.round(w),abs:+(abs/100).toFixed(2),pal:null}}
  else if(typeof GEAR!=='undefined'&&!GEAR[id])GEAR[id]={slot,name,w,poise:Math.round(w*.8),abs:+(abs/100).toFixed(2)};
}
 // modest weight: a 'gear' roll picks one of these pieces (instead of the weapon/armor pool) with this chance per table
 if(typeof SHOP!=='undefined')for(const [id,pr] of [['rags_head',400],['leather_legs',700],['leather_chest',1000],['lamp_chest',1300]])if(!SHOP.some(r=>r[0]===id))SHOP.splice(SHOP.length-1,0,[id,pr])})();
const ARMOR_DESC={
 plate_head:['A SENTINEL HELM, VISOR WORN SMOOTH BY RAIN.'],plate_chest:['SENTINEL PLATE. IT STOOD THE WALL','LONG AFTER THE MAN INSIDE HAD GONE.'],
 plate_hands:['SENTINEL GAUNTLETS, STILL CLENCHED.'],plate_legs:['SENTINEL GREAVES. HEAVY, PATIENT, LOYAL.'],
 rags_head:['A HOOD OF ASH-GREY CLOTH. IT SMELLS OF','OLD BONFIRES.'],rags_chest:['RAGS OF THE ASHEN. LIGHT ENOUGH TO RUN IN,','THIN ENOUGH TO REGRET IT.'],
 rags_hands:['STRIPS OF CLOTH WOUND ROUND THE KNUCKLES.'],rags_legs:['ASHEN LEGGINGS, PATCHED MORE THAN SEWN.'],
 choir_head:['A PALE VEIL FROM THE BELL CHOIR. THE','SINGERS NEVER SHOWED THEIR FACES.'],choir_chest:['THE PALE CHOIR ROBE. THE HEM STILL','HUMS WHEN THE BELLS TOLL.'],
 kiln_chest:['A CUIRASS POURED IN THE KILN ITSELF.','IT HOLDS ITS HEAT FOR DAYS.'],kiln_legs:['KILN IRON GREAVES, SCORCHED BLACK.'],
 leather_chest:['A WANDERER COAT OF OILED LEATHER.','MADE FOR ROADS, NOT WARS.'],leather_legs:['WANDERER BOOTS. THE SOLES HAVE SEEN','EVERY STAGE OF THE VIGIL.'],
 lamp_chest:['A LAMPLIGHTER VESTMENT. ITS POCKETS','STILL HOLD SPENT WICKS.'],lamp_legs:['THE LAMP SKIRT, SINGED AT THE HEM.']};
if(typeof DESC!=='undefined')for(const[k,v]of Object.entries(ARMOR_DESC))if(!DESC[k])DESC[k]=v;
const ARMOR_DROP={ids:Object.keys(ARMOR_SETS),w:{common:.2,elite:.25,chest:.45,mimic:.35}};
const ARMORL=(()=>{
 const DIR='assets/art/sheets_pixel/armor/',SLOTS=['legs','chest','hands','head'],EQK={legs:'legs',chest:'armor',hands:'hands',head:'head'};
 let MAN=null;
 function preload(L){if(typeof PIXCH==='undefined'||!PIXCH.ON())return;L.json('av_armor',DIR+'armor.json');
  L.on('filecomplete-json-av_armor',(k,t,j)=>{MAN=j||{};const P=Array.isArray(MAN.pieces)?MAN.pieces:Object.entries(MAN.pieces||{}).map(([id,p])=>({...p,pieceId:id}));
  for(const p of P){const f=p.file?'assets/art/'+p.file:DIR+p.slot+'_'+p.pieceId+'.png';L.spritesheet('arm_'+p.slot+'_'+p.pieceId,f,{frameWidth:MAN.frameWidth||46,frameHeight:MAN.frameHeight||46})}})}
 // base look: no overlay (the hero art already is the default kit); 'knight' (Ember Plate) is the hero's native armour
 const isBase=(slot,id)=>!id||(slot==='chest'&&id==='knight');
 function texFor(s,slot,id){const k='arm_'+slot+'_'+id;return s.textures.exists(k)?k:null}
 // rig: {base, ov:{slot:sprite}}; eq: {head, armor, hands, legs}
 function rig(s,base){return{base,ov:{}}}
 function dress(s,R,eq,flash,tint){const B=R.base;SLOTS.forEach((slot,i)=>{const id=eq&&eq[EQK[slot]];let sp=R.ov[slot];
  const key=isBase(slot,id)?null:texFor(s,slot,id);if(!key||!B.visible){if(sp)sp.setVisible(false);return}
  if(!sp||sp.texture.key!==key){if(sp)sp.destroy();sp=R.ov[slot]=s.add.sprite(0,0,key,0).setOrigin(B.originX,B.originY)}
  sp.setVisible(true).setFrame(B.frame.name).setPosition(B.x,B.y).setFlipX(B.flipX).setDepth(B.depth+.001*(i+1));if(flash)sp.setTintFill(0xffffff);else if(tint!=null)sp.setTint(tint);else sp.clearTint()})}
 function hide(R){for(const k in R.ov)R.ov[k].setVisible(false)}
 return {preload,dress,rig,hide,texFor,SLOTS}})();
