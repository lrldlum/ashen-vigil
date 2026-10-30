// ASHEN VIGIL — explorable level builder. 8px tile grid, chunk templates: upper/lower routes,
// hidden rooms (fake + breakable walls), wall-jump shafts, chains, trapped embers, challenge rooms.
'use strict';
const T_EMPTY=-1,T_TOP=1,T_FILL=2,T_FILL2=3,T_DEEP=4,T_ONEWAY=5,T_BREAK=6,T_SPIKE=7,T_LAVA=8,T_LAVA2=9,T_CHAIN=10,T_BACK=12,T_DOOR=13;
const ROWS=48,FLOOR=30,LOW_TOP=34,LOW_FLOOR=41,CW=24;
const LAYOUTS={
 ramparts:['start','flat','up','upper','drop','flat','rise','tower','bonfire','shaft','upper','steps','cell','challenge','breakwall','flat'],
 choir:['start','up','upper','shaft','flat','drop','breakwall','rise','bonfire','tower','steps','up','upper','cell','challenge','flat'],
 cinder:['start','flat','drop','lavaLow','rise','steps','tower','bonfire','up','upper','shaft','cell','challenge','breakwall','lavaLow','flat'],
 shrine:null};
const ROSTER={ramparts:{g:'hollow',f:'wraith',s:'imp'},choir:{g:'hollow',f:'wraith',s:'hollow'},cinder:{g:'hollow',f:'ewraith',s:'imp'}};
function buildLevel(id){
 const st=STAGES[id];const lay=LAYOUTS[id];
 if(!lay)return buildShrine(id);
 const R=seedRand(1234+id.length*77);
 const nC=lay.length,A0=nC*CW+2,CH0=A0+44,COLS=CH0+42;
 const t=[],fk=[],bk=[],cl=[];for(let r=0;r<ROWS;r++){t.push(new Array(COLS).fill(T_EMPTY));fk.push(new Array(COLS).fill(T_EMPTY));bk.push(new Array(COLS).fill(T_EMPTY));cl.push(new Array(COLS).fill(0))}
 const ok=(c,r)=>r>=0&&r<ROWS&&c>=0&&c<COLS;
 const fill=(c0,r0,c1,r1,v=T_FILL)=>{for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++)if(ok(c,r))t[r][c]=v};
 const carve=(c0,r0,c1,r1)=>{for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++)if(ok(c,r)){t[r][c]=T_EMPTY;bk[r][c]=T_BACK}};
 const plat=(c0,c1,r)=>{for(let c=c0;c<=c1;c++)if(ok(c,r))t[r][c]=T_ONEWAY};
 const chain=(c,r0,r1)=>{for(let r=r0;r<=r1;r++)if(ok(c,r)){cl[r][c]=1;bk[r][c]=bk[r][c]}};
 const fake=(c0,r0,c1,r1)=>{for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++)if(ok(c,r)){t[r][c]=T_EMPTY;fk[r][c]=T_FILL;bk[r][c]=T_BACK}};
 const O={enemies:[],embers:[],loot:[],doors:[],chests:[],icicles:[],vents:[],signs:[],spawn:null,bonfire:null};
 const px=c=>c*TS+4, py=r=>r*TS;
 let eid=0;const ember=(c,r,where)=>O.embers.push({id:id+'_e'+(eid++),x:px(c),y:py(r)-4,where});
 const foe=(k,c,r)=>O.enemies.push({k,x:px(c),y:py(r)-8});
 const ros=ROSTER[id];
 // base mass + lower corridor
 fill(0,FLOOR,COLS-1,ROWS-1,T_FILL);carve(3,LOW_TOP,A0-3,LOW_FLOOR-1);
 fill(0,0,1,ROWS-1);// left wall
 lay.forEach((k,i)=>{const cx=2+i*CW;
  if(i>0&&i%3===0)foe(R()<.5?ros.g:ros.s,cx+12,LOW_FLOOR);
  switch(k){
   case'start':O.spawn={x:px(cx+4),y:py(FLOOR)-8};O.signs.push({x:px(cx+9),y:py(FLOOR),t:'ARROWS MOVE  Z JUMP  X ATTACK  C ROLL'});plat(cx+14,cx+20,25);break;
   case'flat':foe(ros.g,cx+14,FLOOR);if(R()<.6)plat(cx+6,cx+12,25);if(id==='cinder')O.vents.push(px(cx+18));break;
   case'up':chain(cx+3,20,29);plat(cx+4,cx+11,20);plat(cx+14,cx+23,20);ember(cx+18,20,'upper route');foe(ros.f,cx+16,16);if(id==='choir')O.icicles.push({x:px(cx+8),y:py(21)});break;
   case'upper':plat(cx+0,cx+9,20);plat(cx+13,cx+23,20);plat(cx+5,cx+10,14);ember(cx+7,14,'high ledge');foe(ros.f,cx+12,15);foe(ros.g,cx+18,FLOOR);
    O.loot.push({item:R()<.5?'ember_shard':'souls:300',x:px(cx+20),y:py(20)-6});if(id==='choir')O.icicles.push({x:px(cx+16),y:py(21)});break;
   case'drop':carve(cx+10,FLOOR,cx+13,LOW_TOP-1);ember(cx+20,LOW_FLOOR,'lower route');foe(ros.s,cx+6,LOW_FLOOR);plat(cx+16,cx+22,37);break;
   case'rise':carve(cx+18,FLOOR+1,cx+19,LOW_TOP-1);plat(cx+18,cx+19,FLOOR);chain(cx+18,FLOOR,LOW_FLOOR-1);chain(cx+19,FLOOR,LOW_FLOOR-1);foe(ros.g,cx+8,FLOOR);break;
   case'tower':fill(cx+4,20,cx+19,FLOOR-1);carve(cx+6,24,cx+17,FLOOR-1);fake(cx+4,26,cx+5,FLOOR-1);plat(cx+0,cx+3,25);
    ember(cx+14,FLOOR,'hidden room');O.chests.push({x:px(cx+10),y:py(FLOOR),item:null});foe(ros.s,cx+16,19);break;
   case'bonfire':O.bonfire={x:px(cx+12),y:py(FLOOR)};break;
   case'shaft':fill(cx+6,8,cx+8,26);fill(cx+13,8,cx+15,26);ember(cx+10,5,'wall-jump shaft');plat(cx+16,cx+23,13);plat(cx+0,cx+5,20);O.loot.push({item:'souls:500',x:px(cx+20),y:py(13)-6});
    O.signs.push({x:px(cx+10),y:py(FLOOR),t:'HOLD TOWARD A WALL AND JUMP'});break;
   case'steps':fill(cx+6,27,cx+11,FLOOR-1);fill(cx+12,24,cx+17,FLOOR-1);ember(cx+15,24,'atop the steps');foe(ros.s,cx+20,FLOOR);break;
   case'cell':fake(cx+8,LOW_FLOOR,cx+10,LOW_FLOOR+1);carve(cx+4,LOW_FLOOR+2,cx+16,ROWS-2);chain(cx+9,LOW_FLOOR-2,ROWS-2);ember(cx+14,ROWS-1,'sealed cell');
    O.loot.push({item:'souls:800',x:px(cx+6),y:py(ROWS-1)-6});carve(cx+10,FLOOR,cx+12,LOW_TOP-1);break;
   case'challenge':O.doors.push({x:px(cx+12),y:py(FLOOR),to:'room',back:{x:px(cx+12),y:py(FLOOR)-8}});foe(ros.g,cx+4,FLOOR);break;
   case'breakwall':fill(cx+12,LOW_TOP,cx+13,LOW_FLOOR-1,T_BREAK);ember(cx+17,LOW_FLOOR,'behind a cracked wall');O.chests.push({x:px(cx+20),y:py(LOW_FLOOR),item:null});carve(cx+4,FLOOR,cx+6,LOW_TOP-1);break;
   case'lavaLow':fill(cx+2,LOW_FLOOR,cx+21,LOW_FLOOR,T_LAVA);fill(cx+2,LOW_FLOOR+1,cx+21,LOW_FLOOR+2,T_LAVA2);plat(cx+4,cx+7,37);plat(cx+11,cx+14,36);plat(cx+18,cx+21,37);ember(cx+12,36,'over the lava');carve(cx+20,FLOOR,cx+22,LOW_TOP-1);break;}
 });
 // lower-route spikes in a few places (choir/ramparts) + ensure exits back up at both ends
 chain(4,FLOOR,LOW_FLOOR-1);carve(4,FLOOR+1,5,LOW_TOP-1);plat(4,5,FLOOR);
 chain(A0-6,FLOOR,LOW_FLOOR-1);carve(A0-6,FLOOR+1,A0-5,LOW_TOP-1);plat(A0-6,A0-5,FLOOR);
 // boss arena
 fill(A0-1,0,A0+41,7);fill(A0+40,0,COLS-1,ROWS-1);carve(A0,8,A0+39,FLOOR-1);for(let r=8;r<FLOOR;r++)bk[r][A0-1]=T_EMPTY;
 for(let c=A0;c<A0+40;c++)for(let r=8;r<FLOOR;r++)bk[r][c]=T_EMPTY;
 const arena={x0:A0*TS,x1:(A0+40)*TS,floor:FLOOR*TS,top:8*TS,boss:{x:(A0+30)*TS,y:FLOOR*TS}};
 // challenge room (separate pocket, door-linked)
 carve(CH0,12,CH0+37,FLOOR-1);plat(CH0+8,CH0+14,24);plat(CH0+23,CH0+29,24);plat(CH0+15,CH0+22,19);
 const room={x0:CH0*TS,x1:(CH0+38)*TS,top:12*TS,floor:FLOOR*TS,entry:{x:px(CH0+3),y:py(FLOOR)-8},
  waves:[[ros.g,ros.s,ros.g],[ros.f,ros.g,ros.f,ros.s]],spawns:[CH0+10,CH0+20,CH0+30,CH0+26],reward:{x:px(CH0+19),y:py(19)}};
 O.doors.push({x:px(CH0+3),y:py(FLOOR),to:'out',inRoom:1});
 // gear inside chests (first chest stage-loot, others souls)
 const gear=st.loot.map(l=>l[2]);O.chests.forEach((c,i)=>c.item=gear[i%gear.length]);
 room.rewardItem=gear[(gear.length-1)];
 // autotile: solid with open space above → top tile; deep fill variation
 for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const v=t[r][c];if(v===T_FILL){const up=r>0?t[r-1][c]:T_EMPTY;
   if(up===T_EMPTY||up===T_ONEWAY||up===T_SPIKE)t[r][c]=T_TOP;else t[r][c]=((c+r*3)%7===0)?T_FILL2:(r>LOW_FLOOR+3?T_DEEP:T_FILL)}}
 return{id,t,fk,bk,cl,COLS,ROWS,W:COLS*TS,H:ROWS*TS,O,arena,room,mainEnd:A0*TS,nEmbers:O.embers.length+1}}
function buildShrine(id){const COLS=80,t=[],fk=[],bk=[],cl=[];for(let r=0;r<ROWS;r++){t.push(new Array(COLS).fill(T_EMPTY));fk.push(new Array(COLS).fill(T_EMPTY));bk.push(new Array(COLS).fill(T_EMPTY));cl.push(new Array(COLS).fill(0))}
 for(let r=FLOOR;r<ROWS;r++)for(let c=0;c<COLS;c++)t[r][c]=r===FLOOR?T_TOP:T_FILL;for(let r=0;r<FLOOR;r++){t[r][0]=t[r][1]=T_FILL;t[r][COLS-1]=t[r][COLS-2]=T_FILL}
 const O={enemies:[],embers:[],loot:[],doors:[],chests:[],icicles:[],vents:[],signs:[],spawn:{x:40*TS,y:FLOOR*TS-8},bonfire:{x:40*TS,y:FLOOR*TS,flame:1},
  npcs:[{id:'keeper',x:22*TS,y:FLOOR*TS},{id:'smith',x:60*TS,y:FLOOR*TS}],
  portals:[{to:'ramparts',x:7*TS,y:FLOOR*TS},{to:'choir',x:14*TS,y:FLOOR*TS},{to:'cinder',x:66*TS,y:FLOOR*TS},{to:'_coop',x:73*TS,y:FLOOR*TS}]};
 return{id,t,fk,bk,cl,COLS,ROWS,W:COLS*TS,H:ROWS*TS,O,arena:null,room:null,mainEnd:COLS*TS,nEmbers:0,hub:1}}
