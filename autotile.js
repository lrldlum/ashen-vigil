// ASHEN VIGIL — foreground autotiles (render-only). Runs at the end of Level.paint on the baked level canvas:
// 8-bit "blob" neighbour masks (47 frames) give edge, outer-corner and inner-corner variants for solid ground/walls,
// a 4-frame strip for one-way ledges, seeded per-tile variant picks and an optional decor/prop overlay.
// Collision is never read back or changed: this only recolours pixels of a canvas. ?tiles=0 turns it off.
// Art: PNG atlases from assets/art/tiles/<stage>/ (manifest.json) replace the code-drawn placeholders; spec in av-tiles-spec.md.
'use strict';
const AUTOTILE=(()=>{
 const ON=new URLSearchParams(location.search).get('tiles')!=='0';
 const CELL=16,PAD=4,T=8,VAR=4;
 const N=1,NE=2,E=4,SE=8,S=16,SW=32,W=64,NW=128;
 // blob reduction: a corner bit only counts when both of its edges are solid -> 47 unique masks; frame = rank of the mask
 const red=m=>{if(!(m&N&&m&E))m&=~NE;if(!(m&S&&m&E))m&=~SE;if(!(m&S&&m&W))m&=~SW;if(!(m&N&&m&W))m&=~NW;return m};
 const BLOB=[...new Set([...Array(256).keys()].map(red))].sort((a,b)=>a-b),FRAME=new Int8Array(256).fill(-1);BLOB.forEach((m,i)=>FRAME[m]=i);
 for(let m=0;m<256;m++)FRAME[m]=FRAME[red(m)];
 const hs=(a,b,s)=>{let h=(a*374761393+b*668265263+s*1442695041)|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};
 const sseed=s=>{let h=7;for(const ch of s)h=(h*31+ch.charCodeAt(0))|0;return h};
 const CUT=0xffff00ff;// #ff00ff in an atlas = erase this pixel of the tile (corner rounding)
 // ---- per-stage placeholder styles (palettes follow stage_identity_plan.md / TILEMAT) ----
 const ST={
  ramparts:{cap:['#9ad06a','#6aa04a','#3a6a2a'],sideL:'#8a88a6',sideR:'#1c1a2c',under:'#1c1a2c',tuft:['#6aa04a','#9ad06a'],tuftH:3,hang:['#4a7a3a','#2f5a2a'],hangP:.18,hangL:3,inner:'#1c1a2c',crack:'#2a2640',props:['grass','rock','arrow','grass','merlon'],dens:.09},
  cathedral:{cap:['#f4f0ff','#e8c060','#a8842a'],sideL:'#f4f0ff',sideR:'#6a6690',under:'#2a2440',tuft:null,hang:['#e8c060','#a8842a'],hangP:.12,hangL:2,hangKind:'tassel',inner:'#2a2440',crack:'#8a86a8',props:['candle','urn','petal','candle'],dens:.07},
  cinderdeep:{cap:['#7a4a30','#5a3a2a','#ff7a20'],capDot:'#ffc060',sideL:'#5a3a2a',sideR:'#100806',under:'#100806',tuft:null,hang:['#ffc060','#ff7a20','#7a2a10'],hangP:.12,hangL:3,hangKind:'drip',inner:'#100806',crack:'#ff7a20',props:['ember','shard','bone','ember'],dens:.08},
  belltower:{cap:['#ffffff','#f4f8ff','#d0e0f4'],capThick:3,sideL:'#f4f8ff',sideR:'#284070',under:'#3a5a98',tuft:['#ffffff','#f4f8ff'],tuftH:1,tuftMound:true,hang:['#f4f8ff','#a8c4e8','#6a90c8'],hangP:.3,hangL:4,hangKind:'icicle',inner:'#284070',crack:'#6a90c8',props:['drift','crystal','drift'],dens:.08},
  catacomb:{cap:['#b0a090','#7a6a5a','#3a2e26'],rivet:'#d0c0a8',sideL:'#8a6a4a',sideR:'#1a120e',under:'#1a120e',tuft:null,hang:['#5a5a6a','#3a3a48'],hangP:.08,hangL:4,hangKind:'chain',inner:'#1a120e',crack:'#ff8a30',props:['anvil','coal','skull','coal'],dens:.07},
  drowned:{cap:['#9ae0d0','#3a8a6a','#1f5a4a'],sideL:'#4a8a8a',sideR:'#0a1a20',under:'#0a1a20',tuft:['#3a8a6a','#5ab08a'],tuftH:2,hang:['#2a6a5a','#3a8a6a','#6ad0e0'],hangP:.22,hangL:4,hangKind:'weed',inner:'#0a1a20',crack:'#2a5a5a',props:['shell','coral','weed','shell'],dens:.08},
  keep:{cap:['#c8b898','#a89a80','#5a6a3a'],sideL:'#c8b898',sideR:'#2a241c',under:'#2a241c',tuft:['#6a8a3a','#8aa04a'],tuftH:2,hang:['#4a6a2a','#6a8a3a'],hangP:.15,hangL:3,inner:'#2a241c',crack:'#5a5040',props:['rubble','banner','spear','rubble'],dens:.08},
  spire:{cap:['#ffffff','#c0b0ff','#6a5aa8'],capDot:'#ffffff',sideL:'#c0b0ff',sideR:'#1a1440',under:'#1a1440',tuft:null,hang:['#c0b0ff','#8a70ff'],hangP:.14,hangL:3,hangKind:'icicle',inner:'#1a1440',crack:'#8a70ff',props:['crystal','mote','crystal'],dens:.07},
  cloister:{cap:['#aac05a','#7a9a3a','#4a5a2a'],sideL:'#8a9a5a',sideR:'#1a1a10',under:'#1a1a10',tuft:['#7a9a3a','#aac05a','#e05a8a'],tuftH:3,hang:['#5a4a2a','#4a6a2a'],hangP:.25,hangL:4,hangKind:'root',inner:'#1a1a10',crack:'#3a3020',props:['flower','mushroom','thorn','flower','grass'],dens:.11},
  throne:{cap:['#d080ff','#6a3aa8','#22183a'],sideL:'#6a3aa8',sideR:'#05030a',under:'#05030a',tuft:null,hang:['#3a2a5a','#6a3aa8'],hangP:.12,hangL:3,hangKind:'icicle',inner:'#05030a',crack:'#d080ff',props:['vcrystal','candle','vcrystal'],dens:.06},
  shrine:{cap:['#b8a888','#8a7a6a','#4a3e34'],sideL:'#a8987a',sideR:'#1a1410',under:'#1a1410',tuft:['#6a7a4a'],tuftH:1,hang:null,inner:'#1a1410',crack:'#4a3e34',props:['candle','rock'],dens:.05}};
 const toI=c=>{c=parseInt(c.slice(1),16);return((0xff<<24)|((c&0xff)<<16)|(c&0xff00)|((c>>16)&0xff))>>>0};
 // ---- code-drawn atlases (same layout an Artist PNG uses) ----
 function mk(w,h){const d=new Uint32Array(w*h);return{w,h,d,cell:CELL,pad:PAD,px(x,y,c){if(x>=0&&y>=0&&x<w&&y<h)d[y*w+x]=typeof c==='string'?toI(c):c}}}
 function genTiles(sid,s){const A=mk(BLOB.length*CELL,VAR*CELL),k=sseed(sid);
  BLOB.forEach((m,f)=>{for(let v=0;v<VAR;v++){const ox=f*CELL+PAD,oy=v*CELL+PAD,P=(x,y,c)=>A.px(ox+x,oy+y,c),r=(a,b)=>hs(f*13+a,v*7+b,k);
   const n=!(m&N),e=!(m&E),so=!(m&S),w=!(m&W);
   if(w)for(let y=0;y<T;y++){P(0,y,s.sideL);if(r(1,y)<.4)P(1,y,s.sideL)}
   if(e)for(let y=0;y<T;y++){P(7,y,s.sideR);if(r(2,y)<.5)P(6,y,s.sideR)}
   if(so){for(let x=0;x<T;x++){P(x,7,s.under);if(r(3,x)<.35)P(x,6,s.under)}
    if(s.hang)for(let x=1;x<T-1;x++)if(r(4,x)<s.hangP){const L=1+Math.floor(r(5,x)*s.hangL),kd=s.hangKind;
     for(let y=0;y<L;y++){const c=s.hang[Math.min(s.hang.length-1,y===L-1&&s.hang.length>2?2:y?1:0)];
      if(kd==='chain'){P(x,8+y,y%2?s.hang[1]:s.hang[0])}else if(kd==='drip'){P(x,8+y,y===L-1?s.hang[0]:s.hang[2]);}else if(kd==='root'){P(x+(y>1&&r(6,x)<.5?1:0),8+y,c)}else if(kd==='weed'){P(x+((y>>1)&1),8+y,c)}else if(kd==='tassel'){P(x,8+y,s.hang[y?1:0]);if(y===L-1){P(x-1,8+y,s.hang[1]);P(x+1,8+y,s.hang[1])}}else P(x,8+y,c)}
     if(kd==='icicle'&&L>1)P(x+1,8,s.hang[1])}}
   if(n){const th=s.capThick||2;for(let x=0;x<T;x++){const t=th+(r(7,x)<.4?1:0)-(r(8,x)<.2?1:0);for(let y=0;y<t;y++)P(x,y,s.cap[y===0?0:y===t-1?2:1]);
     if(s.capDot&&r(9,x)<.18)P(x,1,s.capDot);if(s.rivet&&x===3&&r(10,0)<.5)P(x,1,s.rivet);
     if(s.tuft&&r(11,x)<(s.tuftMound?.8:.45)){const H=s.tuftMound?1:1+Math.floor(r(12,x)*s.tuftH);for(let y=1;y<=H;y++)P(x,-y,s.tuft[(y+(r(13,x)<.5?1:0))%s.tuft.length]);if(!s.tuftMound&&s.tuft.length>2&&r(14,x)<.25)P(x,-H-1,s.tuft[2])}}}
   // outer corners: round off (cut), inner corners: shadow fillet
   const cut=(x,y)=>P(x,y,CUT);
   if(n&&w){cut(0,0);if(v&1){cut(1,0);cut(0,1)}}if(n&&e){cut(7,0);if(v&2){cut(6,0);cut(7,1)}}
   if(so&&w){cut(0,7);if(v&1)cut(1,7)}if(so&&e){cut(7,7);if(v&2)cut(6,7)}
   if(!n&&!w&&!(m&NW)){P(0,0,s.inner);P(1,0,s.inner);P(0,1,s.inner)}if(!n&&!e&&!(m&NE)){P(7,0,s.inner);P(6,0,s.inner);P(7,1,s.inner)}
   if(!so&&!w&&!(m&SW)){P(0,7,s.inner);P(1,7,s.inner)}if(!so&&!e&&!(m&SE)){P(7,7,s.inner);P(6,7,s.inner)}
   // interior variation (variants 1-3): small cracks / chips
   if(m===255&&v>0){const cx=1+Math.floor(r(15,0)*5),cy=2+Math.floor(r(16,0)*4);P(cx,cy,s.crack);if(v>1)P(cx+1,cy+1,s.crack);if(v>2)P(cx+1,cy-1,s.crack)}
  }});return A}
 function genOne(sid,s){const A=mk(4*CELL,VAR*CELL),k=sseed(sid)+5;// frames: 0 single, 1 left end, 2 middle, 3 right end
  for(let f=0;f<4;f++)for(let v=0;v<VAR;v++){const ox=f*CELL+PAD,oy=v*CELL+PAD,P=(x,y,c)=>A.px(ox+x,oy+y,c),r=a=>hs(f*5+a,v,k);
   for(let x=0;x<T;x++){P(x,0,s.cap[0]);if(r(x)<.3)P(x,1,s.cap[1])}
   if(f===0||f===1){P(0,0,CUT);P(0,5,s.sideR);P(0,1,s.sideL)}if(f===0||f===3){P(7,0,CUT);P(7,5,s.sideR)}
   if(f===2&&v===1){P(3,6,s.sideR);P(3,7,s.sideR);P(4,6,s.sideR)}// bracket
   if(s.tuft&&!s.tuftMound&&r(9)<.5)P(2+Math.floor(r(10)*4),-1,s.tuft[0]);if(s.tuftMound)for(let x=1;x<7;x++)P(x,-1,s.tuft[0]);
   if(s.hang&&r(11)<.4){const x=1+Math.floor(r(12)*6);P(x,6,s.hang[0]);P(x,7,s.hang[s.hang.length-1])}}
  return A}
 const PROP={// 16x16 cells, bottom row 15 sits on the floor surface, x centred at 8
  grass:(P,s)=>{[[5,3],[6,5],[7,2],[8,6],[9,4],[10,3]].forEach(([x,h])=>{for(let y=0;y<h;y++)P(x,15-y,y>h-2?s.cap[0]:s.cap[1])})},
  rock:(P,s)=>{for(let x=5;x<11;x++)for(let y=13;y<16;y++)if(!(y===13&&(x===5||x===10)))P(x,y,y===13?s.sideL:x>8?s.sideR:s.crack)},
  arrow:(P,s)=>{for(let y=0;y<7;y++)P(7+(y>>2),9+y,'#6a4a2a');P(7,9,'#d0d0d0');P(6,9,'#e0e0e0');P(8,9,'#e0e0e0')},
  merlon:(P,s)=>{for(let x=4;x<12;x++)for(let y=11;y<16;y++)P(x,y,y===11?s.sideL:(x===4?s.sideL:x===11?s.sideR:'#4a4660'));P(7,13,s.sideR);P(8,13,s.sideR)},
  candle:(P,s)=>{for(let y=11;y<16;y++){P(7,y,'#e8e0c8');P(8,y,'#c8c0a8')}P(7,10,'#3a2a20');P(7,9,'#ffd080');P(7,8,'#ff9a30');P(8,9,'#ffe8a0');P(6,15,'#a8842a');P(9,15,'#a8842a')},
  urn:(P,s)=>{const w=[1,2,3,3,3,2,1,2];w.forEach((h,i)=>{for(let x=8-h;x<8+h;x++)P(x,8+i,i===0||i===7?s.cap[1]:x<8?s.cap[0]:s.sideR)})},
  petal:(P,s)=>{P(5,15,'#f0a0c0');P(9,15,'#e080a8');P(11,14,'#f0a0c0');P(7,15,'#ffffff')},
  ember:(P,s)=>{for(let x=5;x<11;x++)for(let y=13;y<16;y++)P(x,y,(x+y)%3?'#3a2420':'#ff7a20');P(7,12,'#ffc060');P(8,13,'#ffc060')},
  shard:(P,s)=>{for(let y=0;y<6;y++){P(7,15-y,y>3?'#ffc060':'#ff7a20');if(y<4)P(8,15-y,'#7a2a10')}},
  bone:(P,s)=>{for(let x=5;x<11;x++)P(x,15,'#d8d0b8');P(5,14,'#d8d0b8');P(10,14,'#d8d0b8')},
  drift:(P,s)=>{const h=[0,1,2,2,3,3,2,1,1,0];h.forEach((t,i)=>{for(let y=0;y<t;y++)P(3+i,15-y,y===t-1?'#ffffff':'#d0e0f4')})},
  crystal:(P,s)=>{const c=s.hang||s.cap;for(let y=0;y<7;y++){P(8,15-y,c[0]);if(y<5)P(7,15-y,c[1]);if(y<3)P(9,15-y,c[1])}P(5,15,c[1]);P(5,14,c[0]);P(10,15,c[0])},
  vcrystal:(P,s)=>{for(let y=0;y<8;y++){P(8,15-y,y<6?'#6a3aa8':'#d080ff');if(y<5)P(7,15-y,'#3a2a5a');if(y<3)P(10,15-y,'#6a3aa8')}P(8,9,'#ffffff')},
  mote:(P,s)=>{P(8,10,'#ffffff');P(7,10,'#c0b0ff');P(9,10,'#c0b0ff');P(8,9,'#c0b0ff');P(8,11,'#c0b0ff');P(8,15,s.cap[1]);P(9,15,s.cap[2])},
  anvil:(P,s)=>{for(let x=4;x<12;x++)P(x,11,'#6a6a7a');for(let x=5;x<11;x++)P(x,12,'#4a4a58');for(let y=13;y<15;y++){P(7,y,'#3a3a48');P(8,y,'#3a3a48')}for(let x=5;x<11;x++)P(x,15,'#3a3a48');P(4,11,'#9a9aaa')},
  coal:(P,s)=>{for(let x=5;x<11;x++)for(let y=14;y<16;y++)P(x,y,(x*3+y)%4?'#1a1416':'#ff8a30');P(7,13,'#1a1416');P(8,13,'#2a2024')},
  skull:(P,s)=>{for(let x=6;x<10;x++)for(let y=12;y<16;y++)P(x,y,'#d8d0b8');P(6,13,'#1a1410');P(9,13,'#1a1410');P(7,15,'#1a1410')},
  shell:(P,s)=>{for(let x=6;x<10;x++)P(x,15,'#e8c0a8');P(7,14,'#f0d0b8');P(8,14,'#e8c0a8');P(7,13,'#f8e0d0')},
  coral:(P,s)=>{for(let y=0;y<6;y++)P(8,15-y,'#e06a6a');P(7,12,'#e06a6a');P(6,11,'#f08a7a');P(9,13,'#e06a6a');P(10,12,'#f08a7a')},
  weed:(P,s)=>{for(let y=0;y<7;y++){P(7+((y>>1)&1),15-y,'#3a8a6a');P(10-((y>>1)&1),15-y+2,'#2a6a5a')}},
  rubble:(P,s)=>{[[5,15],[6,15],[7,15],[6,14],[9,15],[10,15],[10,14],[11,15]].forEach(([x,y])=>P(x,y,(x+y)%2?s.sideL:s.crack))},
  banner:(P,s)=>{for(let y=4;y<16;y++)P(6,y,'#5a4030');for(let y=5;y<11;y++)for(let x=7;x<11;x++)if(!(y===10&&x===8))P(x,y,x===7?'#a03030':'#7a2020');P(8,7,'#e8c060')},
  spear:(P,s)=>{for(let y=0;y<9;y++)P(5+y,15-y,'#6a4a2a');P(14,6,'#c0c0c8');P(13,6,'#c0c0c8')},
  flower:(P,s)=>{for(let y=12;y<16;y++)P(8,y,'#4a6a2a');P(7,14,'#7a9a3a');P(8,11,'#ffe080');P(7,11,'#e05a8a');P(9,11,'#e05a8a');P(8,10,'#e05a8a');P(8,12,'#e05a8a')},
  mushroom:(P,s)=>{for(let y=13;y<16;y++)P(8,y,'#e8e0d0');for(let x=6;x<11;x++)P(x,12,'#a070d0');P(7,11,'#c0a0ff');P(8,11,'#c0a0ff');P(9,11,'#a070d0');P(7,12,'#ffffff')},
  thorn:(P,s)=>{for(let y=0;y<6;y++)P(7+(y%2),15-y,'#5a4a2a');P(6,12,'#5a4a2a');P(9,13,'#5a4a2a');P(9,11,'#e05a8a')}};
 function genDecor(sid,s){const L=s.props||[],A=mk(Math.max(1,L.length)*CELL,CELL);L.forEach((k,i)=>PROP[k]&&PROP[k]((x,y,c)=>A.px(i*CELL+x,y,c),s));A.n=L.length;return A}
 const SET={};let TM=null;const ART={};// ART[sid] = {man, imgs} from the PNG loader
 function fromImg(img,cell,pad){if(!img||!img.width)return null;const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);return{w:c.width,h:c.height,cell,pad,d:new Uint32Array(x.getImageData(0,0,c.width,c.height).data.buffer)}}
 function set(sid){if(SET[sid]!==undefined)return SET[sid];
  const s=ST[sid];let out=null;
  const a=ART[sid];if(a&&TM){const m=a.man,ce=m.cell|0||CELL,pa=m.pad!=null?m.pad|0:(ce-T)/2,tex=k=>TM.exists(k)?fromImg(TM.get(k).getSourceImage(),ce,pa):null;
   const ti=tex('at_'+sid+'_tiles');if(ti){out={src:'png',mode:m.mode==='replace'?'replace':'overlay',var:m.variants||1,tiles:ti,one:tex('at_'+sid+'_oneway'),decor:tex('at_'+sid+'_decor'),dn:m.decorCount|0,dens:m.decorDensity!=null?+m.decorDensity:(s?s.dens:0),props:m.decorAllow||null}}}
  if(!out&&s)out={src:'code',mode:'overlay',var:VAR,tiles:genTiles(sid,s),one:genOne(sid,s),decor:genDecor(sid,s),dens:s.dens};
  if(out&&out.decor&&out.dn==null)out.dn=out.decor.n;if(out&&out.decor&&!out.dn)out.dn=Math.floor(out.decor.w/out.decor.cell);
  if(out)out.empty=new Uint8Array(BLOB.length*out.var).map((_,q)=>{const f=q%BLOB.length,v=(q/BLOB.length)|0,A=out.tiles,C=A.cell;for(let y=0;y<C;y++)for(let x=0;x<C;x++){const X=f*C+x,Y=v*C+y;if(X<A.w&&Y<A.h&&A.d[Y*A.w+X]>>>24)return 0}return 1});
  return SET[sid]=out}
 // blit one atlas cell; in-tile CUT pixels erase, pixels outside the tile only land on empty (alpha 0) or non-solid pixels of the canvas
 // blit one atlas cell (frame fx,fy in cells). phase 0: pixels inside the 8x8 tile (CUT erases); phase 1: overhang margin pixels,
 // drawn after every tile and only onto non-solid tiles; phase 2: decor, every pixel, non-solid tiles only
 function blit(A,fx,fy,d,w,h,dx,dy,free,mode,phase){if(!A)return;const C=A.cell,P=A.pad;fx*=C;fy*=C;dx-=P;dy-=P;for(let y=0;y<C;y++){const sy=fy+y,ty=dy+y;if(ty<0||ty>=h||sy>=A.h)continue;for(let x=0;x<C;x++){const sx=fx+x,tx=dx+x;if(tx<0||tx>=w||sx>=A.w)continue;const c=A.d[sy*A.w+sx];if(!(c>>>24))continue;
   const inT=phase!==2&&x>=P&&x<P+T&&y>=P&&y<P+T;if(phase===0?!inT:inT)continue;if(c===CUT){if(inT)d[ty*w+tx]=0;continue}if(!inT&&!free(tx,ty))continue;
   const a=c>>>24;if(a>=250||(mode==='replace'&&inT))d[ty*w+tx]=c|0xff000000;else{const b=d[ty*w+tx],m=s=>((((c>>>s)&255)*a+((b>>>s)&255)*(255-a))/255)&255;d[ty*w+tx]=(0xff000000|(m(16)<<16)|(m(8)<<8)|m(0))>>>0}}}}
 const stats={};
 // called by Level.paint with the canvas pixel buffer; lv.k/collision is only read
 function apply(lv,d,w,h,i0,j0,i1,j1,force){if(!ON)return;const sid=lv.sid,S=set(sid);if(!S)return;const K=lv.k,cols=lv.cols,rows=lv.rows,seed=sseed(sid);
  const inR=(i,j)=>force&&i>=i0&&i<i1&&j>=j0&&j<j1,kk=(i,j)=>{if(inR(i,j))return 1;if(i<0||i>=cols)return 1;if(j<0)return 0;if(j>=rows)return 1;return K[j*cols+i]};
  const sol=(i,j)=>kk(i,j)===1;
  const free=(tx,ty)=>{const i=i0+Math.floor(tx/T),j=j0+Math.floor(ty/T);return!sol(i,j)};
  let nT=0,nP=0;const Qb=[],Qd=[];
  for(let j=j0;j<j1;j++)for(let i=i0;i<i1;i++){const v=force?1:(lv.idx(i,j)<0?0:K[j*cols+i]);const dx=(i-i0)*T,dy=(j-j0)*T;
   if(v===1){const m=(sol(i,j-1)?N:0)|(sol(i+1,j-1)?NE:0)|(sol(i+1,j)?E:0)|(sol(i+1,j+1)?SE:0)|(sol(i,j+1)?S:0)|(sol(i-1,j+1)?SW:0)|(sol(i-1,j)?W:0)|(sol(i-1,j-1)?NW:0);
    const f=FRAME[m],vr=Math.floor(hs(i,j,seed)*S.var);if(!S.empty[vr*BLOB.length+f]){Qb.push([S.tiles,f,vr,dx,dy]);nT++}
    // decor on open floor: two clear tiles above, not on a 1-wide pillar top
    if(!force&&S.decor&&S.dn&&!(m&N)&&kk(i,j-1)===0&&kk(i,j-2)===0&&((m&E)||(m&W))&&hs(i,j,seed+99)<S.dens){const p=Math.floor(hs(i,j,seed+7)*S.dn),C=S.decor.cell,P=S.decor.pad;Qd.push([S.decor,p,0,(i-i0)*T+P-(C-T)/2,(j-j0)*T+P-C]);nP++}}
   else if(v===2&&S.one){const l=kk(i-1,j)===2||sol(i-1,j),r=kk(i+1,j)===2||sol(i+1,j),f=l&&r?2:l?3:r?1:0,vr=Math.floor(hs(i,j,seed+3)*Math.max(1,Math.floor(S.one.h/S.one.cell)));Qb.push([S.one,f,vr,dx,dy]);nT++}}
  for(const ph of[0,1])for(const[A,f,v,x,y]of Qb)blit(A,f,v,d,w,h,x,y,free,S.mode,ph);for(const[A,f,v,x,y]of Qd)blit(A,f,v,d,w,h,x,y,free,'overlay',2);
  stats[sid+(force?'_cov':'')]={tiles:nT,props:nP,src:S.src}}
 // Boot preload hook: reads assets/art/tiles/index.json, then queues each listed stage's manifest + PNG atlases
 function preload(load){if(!ON)return;TM=load.textureManager||TM;load.json('tiles_index','assets/art/tiles/index.json');
  load.once('filecomplete-json-tiles_index',(k,t,data)=>{((data&&data.stages)||[]).forEach(sid=>{const base=`assets/art/tiles/${sid}/`;load.json('tm_'+sid,base+'manifest.json');
   load.once('filecomplete-json-tm_'+sid,(k2,t2,man)=>{if(!man)return;ART[sid]={man};delete SET[sid];load.image('at_'+sid+'_tiles',base+(man.tiles||'tiles.png'));if(man.oneway!==null)load.image('at_'+sid+'_oneway',base+(man.oneway||'oneway.png'));if(man.decor)load.image('at_'+sid+'_decor',base+man.decor)})})})}
 return{ON,BLOB,FRAME,ST,CELL,PAD,VAR,apply,preload,stats,set,reset(){for(const k in SET)delete SET[k]},atlas:sid=>set(sid)}})();
