// ASHEN VIGIL — per-zone ground/wall materials, all code-drawn per pixel. No two zones share a tile.
// Level.paint asks TILEMAT[sid] for each pixel of solid ground, one-way ledges and back walls.
// Variation is hashed per pixel and per cell, so it is seeded and stable, and collision is untouched (colour only).
'use strict';
const TILEMAT=(()=>{
 const hs=(a,b,s=0)=>{let h=(a*374761393+b*668265263+s*1442695041)|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};
 const vn=(x,y,s,k=0)=>{const xi=Math.floor(x/s),yi=Math.floor(y/s),fx=x/s-xi,fy=y/s-yi,a=hs(xi,yi,k),b=hs(xi+1,yi,k),c=hs(xi,yi+1,k),d=hs(xi+1,yi+1,k);return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy};
 // irregular blocks: rows of varying height, hashed widths; returns cell id and whether (X,Y) is mortar
 const blocks=(X,Y,rh,cw,k)=>{const r=Math.floor(Y/rh),off=Math.floor(hs(r,0,k)*cw),xx=X+off,c=Math.floor(xx/cw),merge=hs(r,c,k+1)<.35;const m=(Y%rh===0)||(xx%cw===0&&!merge);return{r,c:merge?c-1:c,m,ex:xx%cw,ey:Y%rh}};
 const M={};
 // RAMPARTS — weathered grey stone, varied block sizes, moss on the lip
 M.ramparts={pal:['#5a5670','#4a4660','#3a3650','#2a2640','#7a7896','#4a7a3a','#6aa04a','#1c1a2c'],
  solid(o){const{X,Y,dy}=o;if(dy<2)return hs(X,0,9)<.6?(dy?5:6):4;const b=blocks(X,dy,dy<12?6:8,12+((X>>5)&1)*6,3);if(b.m)return 7;const t=hs(b.r,b.c,4);let c=t<.3?0:t<.7?1:2;if(b.ey===1)c=4;if(b.ex===1&&c>0)c--;if(hs(X,Y,5)<.03)c=3;if(dy>40)c=Math.min(3,c+1);return c},
  back(X,Y){const b=blocks(X,Y,7,14,8);return b.m?7:hs(b.r,b.c,2)<.5?3:2},one(X,Y,u,v){return v===0?4:v<5?1:v===5?7:0}};
 // CATHEDRAL — pale marble with a black-and-white checker floor and a gold trim
 M.cathedral={pal:['#d8d4e8','#b8b4cc','#2a2440','#16122a','#e8c060','#8a86a8','#6a6690','#f4f0ff'],
  solid(o){const{X,Y,dy}=o;if(dy===0)return 7;if(dy<3)return 4;if(dy<11)return((X>>2)+((dy-3)>>2))&1?2:0;if(dy===11)return 4;const v=vn(X,Y,10,2);if(Math.abs(Math.sin(X*.12+v*6+Y*.05))<.05)return 6;return v>.55?0:v>.3?1:5},
  back(X,Y){return X%24<3?1:(Y%40<2?6:5)},one(X,Y,u,v){return v===0?7:v<2?4:v<5?0:v===5?6:0}};
 // CINDERDEEP — rough basalt with ember veins
 M.cinderdeep={pal:['#3a2420','#2a1814','#1a0e0c','#5a3a2a','#ff7a20','#ffc060','#7a2a10','#100806'],
  solid(o){const{X,Y,dy}=o;const n=vn(X,Y,7,1)*.7+vn(X,Y,3,2)*.3;if(dy===0)return n>.5?3:0;const vein=Math.abs(vn(X,Y,13,3)-.5);if(vein<.018)return dy<20?5:4;if(vein<.035)return 6;return n>.68?3:n>.45?0:n>.25?1:2},
  back(X,Y){const n=vn(X,Y,9,4);return n>.6?1:n>.3?2:7},one(X,Y,u,v){return v===0?3:v<5?(hs(X,v,6)<.2?6:1):v===5?7:0}};
 // BELL TOWER — packed snow over cracked ice sheets, icicle lips
 M.belltower={pal:['#f4f8ff','#d0e0f4','#a8c4e8','#6a90c8','#3a5a98','#ffffff','#284070','#88b0e0'],
  solid(o){const{X,Y,dy,bE,vv}=o;const sd=4+Math.round(vn(X,0,9,1)*4);if(dy<sd)return dy===0?5:hs(X,Y,2)<.15?1:0;if(dy===sd)return 1;
   const sh=blocks(X,dy,14,22,4);if(sh.m)return 6;if(((X+dy*2)%23)<2&&sh.ey<8)return 5;const t=hs(sh.r,sh.c,7);if(bE&&vv>4&&hs(X,0,8)<.4)return 7;return t<.4?2:t<.8?3:4},
  back(X,Y){return(X+Y)%9===0?3:4},one(X,Y,u,v){return v===0?5:v<3?0:v<5?2:v===5?3:(hs(X,1,1)<.3?7:0)}};
 // FORGE — cooling slag, iron grates, magma cracks
 M.catacomb={pal:['#2a2624','#3a3430','#1a1614','#ffd060','#ff6a10','#a82a08','#5a5a64','#8a8a96'],
  solid(o){const{X,Y,dy}=o;if(dy<4){if(dy===0)return 7;return(X%6<2)?6:(dy===3?2:4)}const n=vn(X,Y,6,5);const cr=Math.abs(vn(X,Y,11,6)-.5);if(cr<.02)return 3;if(cr<.04)return 4;if(cr<.06)return 5;return n>.6?1:n>.3?0:2},
  back(X,Y){return(X%16<2||Y%16<2)?6:2},one(X,Y,u,v){return v===0?7:v<5?(X%4<2?6:0):v===5?2:0}};
 // DROWNED — bone-strewn wet earth under coffin-slab lids, with puddle sheen
 M.drowned={pal:['#2a2a22','#3a3628','#1a1a14','#d8d4c0','#8a8a7a','#5a4a30','#3a2e1e','#6ad8d0'],
  solid(o){const{X,Y,dy}=o;if(dy<5){if(dy===0)return(vn(X,0,14,2)>.62)?7:4;const pl=(X+((X/40|0)%2)*20)%40;return pl<1?6:dy===1?4:5}const n=vn(X,Y,5,8);
   const bc=Math.floor(X/12),br=Math.floor(Y/10);if(hs(bc,br,9)<.18){const lx=(X+Math.floor(hs(bc,br,10)*5))%12,ly=(Y+Math.floor(hs(bc,br,11)*4))%10;if(ly===4&&lx>2&&lx<10)return 3;if((lx===2||lx===10)&&ly>2&&ly<6)return 3}return n>.6?1:n>.3?0:2},
  back(X,Y){return Y%18<2?6:(vn(X,Y,8,3)>.5?2:6)},one(X,Y,u,v){return v===0?4:v<5?5:v===5?6:0}};
 // KEEP — timber walkways over rubble
 M.keep={pal:['#8a5a30','#6a4220','#4a2c14','#c08a50','#5a5a60','#3a3a40','#2a2a2e','#b0b0b8'],
  solid(o){const{X,Y,dy}=o;if(dy<6){if(dy===0)return 3;const pl=(X+((dy>2?1:0)*11))%26;if(pl===0)return 2;if(pl===3&&(dy===2||dy===4))return 7;return Math.sin(X*.5+dy*2)>.7?1:0}const b=blocks(X,dy,4+((dy>>3)&1)*2,5+Math.floor(hs(dy>>2,0,3)*5),9);if(b.m)return 6;const t=hs(b.r,b.c,2);return t<.3?4:t<.75?5:(t<.9?2:7)},
  back(X,Y){return X%20<2?2:(Y%30===0?2:1)},one(X,Y,u,v){return v===0?3:v<5?((X%10)?0:2):v===5?2:0}};
 // SPIRE — floating crystal over veined marble with star inlay
 M.spire={pal:['#e8e4f4','#c8c0e0','#9a88d0','#6a4ab8','#40e0ff','#ffffff','#2a1a60','#ffe080'],
  solid(o){const{X,Y,dy}=o;if(dy<8){if(dy===0)return 5;if(((X*7+dy*13)%97)===0)return 7;const v=Math.abs(Math.sin(X*.08+vn(X,dy,9,2)*5));return v<.08?2:(dy<2?0:1)}const f=((X+dy)%14+(X-dy+999)%14)%14,g=Math.floor((X+dy)/14)+Math.floor((X-dy+999)/14);if(f<1)return 5;return [2,3,4,6][g&3]},
  back(X,Y){return((X*13+Y*7)%173===0)?5:6},one(X,Y,u,v){return v===0?5:v<3?0:v<5?2:v===5?3:0}};
 // CLOISTER — broken mosaic, moss and roots
 M.cloister={pal:['#3a2a1a','#2a1c10','#4a7a2a','#7ab040','#c04a3a','#3a6ac0','#e0c050','#e8e0c8'],
  solid(o){const{X,Y,dy}=o;if(dy<4){if(vn(X,0,8,3)>.6)return dy<2?3:2;const tx=X>>2,miss=hs(tx,1,4)<.15;if(miss)return 1;if((X&3)===3||dy===3)return 1;return[4,5,6,7][Math.floor(hs(tx,0,5)*4)]}
   const r=Math.abs(Math.sin(Y*.15+X*.02+vn(X,0,30,6)*6)*20-(X%40-20));if(r<1.2)return 0===((X+Y)&1)?3:2;const n=vn(X,Y,6,7);return n>.55?0:1},
  back(X,Y){return vn(X,Y,10,1)>.6?2:1},one(X,Y,u,v){return v===0?3:v<3?2:v<5?0:v===5?1:0}};
 // THRONE — black obsidian steps and void-glass
 M.throne={pal:['#0a0612','#14101e','#22183a','#6a3aa8','#d080ff','#1a0a2a','#3a2a5a','#ffffff'],
  solid(o){const{X,Y,dy}=o;const step=(dy%10);if(step===0)return dy===0?4:3;if(step===1)return 6;const d=(X+dy*2)%37;if(d<2)return d?3:4;if(((X*31+Y*17)%211)===0)return 7;return vn(X,Y,9,4)>.55?1:(dy>20?0:2)},
  back(X,Y){return(X+Y)%29===0?2:5},one(X,Y,u,v){return v===0?4:v<5?2:v===5?3:0}};
 const P={};for(const k in M){const toI=c=>{c=parseInt(c.slice(1),16);return((0xff<<24)|((c&0xff)<<16)|(c&0xff00)|((c>>16)&0xff))>>>0};M[k].c=M[k].pal.map(toI);const lum=c=>{c=parseInt(c.slice(1),16);return(c>>16)*.3+((c>>8)&255)*.59+(c&255)*.11};M[k].dark=M[k].pal.reduce((b,c,i,A)=>lum(c)<lum(A[b])?i:b,0)}
 return M})();
