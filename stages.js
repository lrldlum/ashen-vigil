// ASHEN VIGIL — stage layouts (data only). Schema is shared by every stage; the builder lives in game.js (LevelKit).
// Coordinates are world pixels. Tile grid is 8px with origin y=OY (-204) so that the main floor GY=156 is a tile edge.
// Rect = [x0,y0,x1,y1] (x1/y1 exclusive). Kinds:
//  carve   : make empty (cavities, rooms) — painted with the back wall
//  solid   : brick (walls, hanging pillars, slabs)
//  oneway  : plank you can jump up through and drop through with DOWN+JUMP
//  chain   : climbable (UP/DOWN to grab)
//  spikes  : hazard tile (hurts and returns you to the last safe spot)
//  back    : back wall without collision (decor behind open spaces)
//  covers  : hidden rooms — drawn as solid wall until you step inside
//  breakables : cracked wall that takes 3 hits
//  cages   : Lost Embers to free (the collectibles)
//  challenges : {type:'timer'|'waves'}
'use strict';
const STAGE_DEFS={
 ramparts:{name:'THE ASHEN RAMPARTS',world:3360,top:-204,bottom:364,
  carve:[
   [1048,180,1520,300],[992,260,1048,300],       // crypt + its hidden room
   [2520,180,2904,300],[2464,260,2504,300],      // ossuary + room behind cracked wall
   [1096,156,1128,180],[1488,156,1520,180],[2528,156,2560,180],[2872,156,2904,180]], // shafts through the floor
  solid:[
   // start: twin hanging pillars (wall-jump) + hidden room above the main route
   [232,-4,248,124],[280,36,296,124],[280,36,368,44],[280,-4,368,4],[360,4,368,36],
   // rooftop route A
   [376,20,520,28],[552,20,680,28],[712,20,860,28],[892,20,1000,28],
   // crypt shaft inner wall (hangs from ceiling)
   [1480,180,1488,260],
   // wall-jump tower by the bonfire + high run
   [1680,-124,1696,124],[1728,-100,1744,124],[1744,-100,1904,-92],[1936,-100,2060,-92],[2092,-100,2240,-92],[2240,-100,2348,-92],
   [2252,-148,2348,-140],[2340,-140,2348,-116],
   // ledge before the arena
   [2904,20,2968,28]],
  oneway:[[1096,156,1128,164],[1488,156,1520,164],[2528,156,2560,164],[2872,156,2904,164]],
  chain:[[392,20,400,156],[2880,164,2888,300],[2936,28,2944,156]],
  spikes:[[1980,-108,2004,-100],[2140,-108,2164,-100]],
  back:[[2252,-140,2340,-100]],
  covers:[{id:'h_start',r:[280,-4,368,44]},{id:'h_crypt',r:[992,260,1048,300]},{id:'h_ossuary',r:[2464,260,2504,300]}],
  breakables:[{id:'b_ossuary',r:[2504,268,2520,300]}],
  cages:[{id:'e1',x:968,y:20},{id:'e2',x:1012,y:300},{id:'e3',x:1872,y:-100},{id:'e4',x:2310,y:-100},
   {id:'e5',x:2820,y:300,lock:'c_waves'},{id:'e6',x:2480,y:300},{id:'e7',x:340,y:36},{id:'e8',x:2952,y:20}],
  challenges:[
   {id:'c_run',type:'timer',name:'EMBER RUN',zone:[1748,-140,1790,-100],limit:9,gates:[[2240,-140,2248,-100]]},
   {id:'c_waves',type:'waves',name:'OSSUARY TRIAL',zone:[2600,200,2840,300],gates:[[2568,180,2576,300],[2856,180,2864,300]],
    waves:[[['hollow',2640,300],['hollow',2780,300]],[['knight',2700,300],['imp',2620,300],['hollow',2800,300]]]}],
  braziers:[[1200,300],[1400,300],[2660,300],[2780,300]],
  enemies:[['hollow',360],['imp',520],['hollow',720],['wraith',900],['knight',1180],['imp',1260],['wraith',1380],['imp',1900],['hollow',2020],['wraith',2250],['knight',2460],['imp',2600],['hollow',2760],['wraith',2850],
   ['hollow',600,20],['wraith',780,-30],['hollow',1260,300],['knight',1400,300],['wraith',2010,-150],['imp',2160,-100]]}};
