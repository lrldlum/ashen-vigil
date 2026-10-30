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
  chain:[[368,12,376,156],[2880,156,2888,300],[2896,12,2904,156]],
  spikes:[[1980,-108,2004,-100],[2140,-108,2164,-100]],
  back:[[2252,-140,2340,-100]],
  covers:[{id:'h_start',r:[280,-4,368,44]},{id:'h_crypt',r:[992,260,1048,300]},{id:'h_ossuary',r:[2464,260,2504,300]}],
  breakables:[{id:'b_ossuary',r:[2504,268,2520,300]}],
  cages:[{id:'e1',x:968,y:20},{id:'e2',x:1012,y:300},{id:'e3',x:1872,y:-100},{id:'e4',x:2310,y:-100},
   {id:'e5',x:2820,y:300,lock:'c_waves'},{id:'e6',x:2480,y:300},{id:'e7',x:340,y:36},{id:'e8',x:2952,y:20}],
  challenges:[
   {id:'c_run',type:'timer',name:'EMBER RUN',zone:[1748,-140,1790,-100],limit:9,cage:'e4',gates:[[2240,-196,2248,-100]]},
   {id:'c_waves',type:'waves',name:'OSSUARY TRIAL',zone:[2600,200,2840,300],gates:[[2568,180,2576,300],[2856,180,2864,300]],
    waves:[[['hollow',2640,300],['hollow',2780,300]],[['knight',2700,300],['imp',2620,300],['hollow',2800,300]]]}],
  braziers:[[1200,300],[1400,300],[2660,300],[2780,300]],
  bonfire:1600,bonfireName:'GATE VIGIL',next:'cathedral',theme:'ramparts',
  plats:[[430,128,48],[540,108,40],[1000,124,64],[1110,100,48],[1820,126,56],[1930,104,40],[2160,118,48],[2290,96,48],[2400,120,40]],
  puddles:[[262,18],[702,14],[1250,22],[1676,16],[2082,20],[2608,14],[3080,24],[3236,16]],
  items:[{id:'i1_bow',x:500,y:156,item:'bow'},{id:'i1_spear',x:800,y:156,item:'spear'},{id:'i1_axe',x:1250,y:156,item:'axe'},{id:'i1_iron',x:300,y:36,item:'iron'},
   {id:'i1_gs',x:2050,y:156,item:'greatsword'},{id:'i1_staff',x:2700,y:156,item:'staff'},{id:'i1_wand',x:1012,y:300,item:'wand'}],
  boss:{kind:'warden',name:'FROST WARDEN',sub:'KEEPER OF THE ASHEN RAMPARTS',slain:'WARDEN SLAIN',hp:40,card:'THE FROST WARDEN IS ASH. THE GATE STANDS OPEN.'},
  enemies:[['hollow',360],['imp',520],['hollow',720],['wraith',900],['knight',1180],['imp',1260],['wraith',1300],['imp',1900],['hollow',2020],['wraith',2250],['knight',2460],['imp',2600],['hollow',2760],['wraith',2850],
   ['hollow',600,20],['wraith',780,-30],['hollow',1260,300],['knight',1400,300],['wraith',2010,-150],['imp',2160,-100]]}};

// ---------------------------------------------------------------------------
// Milestone C: reusable room templates (each is the ramparts room, re-anchored at x).
// A stage = list of [template, x] + its own palette, enemies, hazards and lord.
const TPL={
 pillarRoom(x,id){return{solid:[[x,-4,x+16,124],[x+48,36,x+64,124],[x+48,36,x+136,44],[x+48,-4,x+136,4],[x+128,4,x+136,36],
   [x+144,20,x+288,28],[x+320,20,x+448,28],[x+480,20,x+628,28],[x+660,20,x+768,28]],
  chain:[[x+136,12,x+144,156]],covers:[{id:id+'_h',r:[x+48,-4,x+136,44]}],cages:[{id:id+'_c1',x:x+108,y:36},{id:id+'_c2',x:x+736,y:20}],
  enemies:[['hollow',x+368,20],['wraith',x+548,-30]]}},
 crypt(x,id){return{carve:[[x,180,x+472,300],[x-56,260,x,300],[x+48,156,x+80,180],[x+440,156,x+472,180]],solid:[[x+432,180,x+440,260]],
  oneway:[[x+48,156,x+80,164],[x+440,156,x+472,164]],covers:[{id:id+'_h',r:[x-56,260,x,300]}],cages:[{id:id+'_c1',x:x-36,y:300}],
  braziers:[[x+152,300],[x+352,300]],enemies:[['hollow',x+212,300],['knight',x+352,300]]}},
 tower(x,id,name,limit=9){return{solid:[[x,-124,x+16,124],[x+48,-100,x+64,124],[x+64,-100,x+224,-92],[x+256,-100,x+380,-92],[x+412,-100,x+560,-92],[x+560,-100,x+668,-92],
   [x+572,-148,x+668,-140],[x+660,-140,x+668,-116]],spikes:[[x+300,-108,x+324,-100],[x+460,-108,x+484,-100]],back:[[x+572,-140,x+660,-100]],
  cages:[{id:id+'_c1',x:x+192,y:-100},{id:id+'_c2',x:x+630,y:-100}],
  challenges:[{id:id+'_run',type:'timer',name,zone:[x+68,-140,x+110,-100],limit,cage:id+'_c2',gates:[[x+560,-196,x+568,-100]]}],
  enemies:[['wraith',x+330,-150],['imp',x+480,-100]]}},
 ossuary(x,id,name){return{carve:[[x,180,x+384,300],[x-56,260,x-16,300],[x+8,156,x+40,180],[x+352,156,x+384,180]],
  oneway:[[x+8,156,x+40,164],[x+352,156,x+384,164]],chain:[[x+360,156,x+368,300]],covers:[{id:id+'_h',r:[x-56,260,x-16,300]}],
  breakables:[{id:id+'_b',r:[x-16,268,x,300]}],cages:[{id:id+'_c1',x:x+300,y:300,lock:id+'_trial'},{id:id+'_c2',x:x-40,y:300}],
  challenges:[{id:id+'_trial',type:'waves',name,zone:[x+80,200,x+320,300],gates:[[x+48,180,x+56,300],[x+336,180,x+344,300]],
   waves:[[['hollow',x+120,300],['hollow',x+260,300]],[['knight',x+180,300],['imp',x+100,300],['hollow',x+280,300]]]}],
  braziers:[[x+140,300],[x+260,300]]}},
 ledge(x,id){return{chain:[[x,12,x+8,156]],solid:[[x+8,20,x+72,28]],cages:[{id:id+'_c1',x:x+56,y:20}]}}};
// r3 P2: rooms unique to stages 2 and 3 (underground, so they never overlap the shared templates above)
// nave: hanging choir columns with bell ropes you climb to a loft; belfry: stacked bell-frame planks up a narrow tower
// lavaRise: a cinder pool you cross on sinking-stone steps; forge: stepped anvil blocks over ember pits
TPL.nave=(x,id)=>({carve:[[x,180,x+400,300],[x+8,156,x+40,180],[x+368,156,x+400,180]],oneway:[[x+8,156,x+40,164],[x+368,156,x+400,164]],
  solid:[[x+80,180,x+96,252],[x+176,180,x+192,252],[x+272,180,x+288,252]],chain:[[x+128,196,x+136,292],[x+224,196,x+232,292],[x+376,156,x+384,300]],
  plats:[[x+96,212,32],[x+192,212,32],[x+288,212,40]],braziers:[[x+48,300],[x+336,300]],enemies:[['hollow',x+150,300],['wraith',x+250,240]]});
TPL.belfry=(x,id)=>({carve:[[x,180,x+232,300],[x+8,156,x+40,180]],oneway:[[x+8,156,x+40,164],[x+56,276,x+104,284],[x+120,252,x+168,260],[x+56,228,x+104,236],[x+120,204,x+168,212]],
  chain:[[x+200,188,x+208,300]],solid:[[x+184,180,x+192,272]],braziers:[[x+30,300]],enemies:[['knight',x+130,300]]});
TPL.lavaRise=(x,id)=>({carve:[[x,180,x+440,300],[x+8,156,x+40,180],[x+408,156,x+440,180]],oneway:[[x+8,156,x+40,164],[x+408,156,x+440,164]],
  spikes:[[x+64,292,x+376,300]],solid:[[x+96,276,x+120,292],[x+168,268,x+192,292],[x+240,276,x+264,292],[x+312,268,x+336,292]],chain:[[x+416,156,x+424,300]],
  plats:[[x+56,252,24],[x+200,236,32],[x+344,244,24]],braziers:[[x+30,300],[x+392,300]],enemies:[['imp',x+180,268],['imp',x+320,268]]});
TPL.forge=(x,id)=>({carve:[[x,180,x+400,300],[x+8,156,x+40,180],[x+368,156,x+400,180]],oneway:[[x+8,156,x+40,164],[x+368,156,x+400,164]],
  solid:[[x+72,284,x+112,300],[x+112,268,x+152,300],[x+152,252,x+192,300],[x+232,252,x+272,300],[x+272,268,x+312,300],[x+312,284,x+352,300]],spikes:[[x+192,292,x+232,300]],
  chain:[[x+376,156,x+384,300]],plats:[[x+196,232,32]],braziers:[[x+130,268],[x+290,268]],enemies:[['knight',x+250,252],['hollow',x+60,300]]});
const KEYS=['carve','solid','oneway','chain','spikes','back','covers','breakables','cages','challenges','braziers','enemies','plats'];
function composeStage(base,parts,remap){const d={...base};KEYS.forEach(k=>d[k]=[...(base[k]||[])]);
 parts.forEach(([n,x,...a])=>{const r=TPL[n](x,base.pre+'_'+n+x,...a);KEYS.forEach(k=>{if(r[k])d[k].push(...r[k])})});
 const rk=k=>remap[k]||k;d.enemies=d.enemies.map(([k,x,y])=>[rk(k),x,y]);
 d.challenges.forEach(c=>{if(c.waves)c.waves=c.waves.map(w=>w.map(([k,x,y])=>[rk(k),x,y]))});return d}
STAGE_DEFS.cathedral=composeStage({pre:'s2',name:'CATHEDRAL OF THE PALE CHOIR',world:3360,top:-204,bottom:364,theme:'cathedral',
  bonfire:1560,bonfireName:'CHANCEL VIGIL',next:'cinderdeep',
  pal:{sky0:'#0a0f1c',sky1:'#0f1626',sky2:'#152034',sky3:'#1c2c46',sky4:'#263a5a',far:'#121a2e',farW:'#2a3d63',farW2:'#5a7aaa',near:'#0a0f1e',nearW:'#2e4a78',
   gTop:'#c8def4',g1:'#6c80a8',g2:'#5a6c92',gM:'#2c385a',gD:'#3a4870',b0:'#0f1830',bM:'#070b16',bH:'#1a2846',mist:'rgba(170,200,240,.14)',haze1:'rgba(30,44,74,.55)',haze2:'rgba(40,58,92,.6)',mist2:'rgba(130,160,210,.09)',pil:0x0f1830,pilH:0x2a3c64},
  plats:[[560,128,48],[1450,120,48],[2120,118,48],[2560,112,40],[3030,108,44],[3266,108,44]],
  items:[{id:'i2_herald',x:1460,y:156,item:'herald'},{id:'i2_robe',x:620,y:156,item:'robe'},{id:'i2_dagger',x:2200,y:156,item:'dagger'},{id:'i2_sword',x:2160,y:300,item:'longsword'}],puddles:[[120,18],[640,14],[1500,22],[2240,16],[3080,24],[3236,16]],
  shafts:[420,980,1480,2050,2600,3160],spikes:[[2640,148,2664,156]],
  boss:{kind:'cantor',name:'THE PALE CANTOR',sub:'LORD OF THE PALE CHOIR',slain:'CANTOR SILENCED',hp:54,card:'THE CHOIR FALLS SILENT. THE DEEP BURNS BELOW.',
   phases:['THE CHOIR JOINS THE HYMN','THE REQUIEM BEGINS']},
  enemies:[['hollow',340],['wraith',600],['knight',760],['hollow',900],['imp',1180],['wraith',1300],['hollow',1900],['knight',2100],['wraith',2250],['imp',2520],['hollow',2740],['wraith',2860]]},
 [['tower',200,'CHOIR RUN',9],['ossuary',1000,'PALE CHOIR TRIAL'],['pillarRoom',1700],['crypt',2380],['ledge',2896],['nave',440],['belfry',1440]],
 {hollow:'acolyte',knight:'sentinel',wraith:'chorister'});
STAGE_DEFS.cinderdeep=composeStage({pre:'s3',name:'THE BURNING CINDERDEEP',world:3360,top:-204,bottom:364,theme:'cinderdeep',
  bonfire:1760,bonfireName:'FORGE VIGIL',next:null,
  pal:{sky0:'#110505',sky1:'#1a0807',sky2:'#260b08',sky3:'#38120a',sky4:'#521c0c',far:'#1c0907',farW:'#5a2010',farW2:'#b04a18',near:'#100404',nearW:'#6a2410',
   gTop:'#d07040',g1:'#5a2c22',g2:'#4a231c',gM:'#22100c',gD:'#331611',b0:'#1a0907',bM:'#0b0403',bH:'#2a100c',lava:1,mist:'rgba(255,110,40,.10)',haze1:'rgba(70,20,10,.55)',haze2:'rgba(110,34,12,.6)',mist2:'rgba(200,70,30,.08)',pil:0x1a0907,pilH:0x3a160e},
  plats:[[860,124,48],[1460,118,48],[2440,112,40],[3100,116,36],[3220,116,36]],
  items:[{id:'i3_plate',x:1700,y:156,item:'knight'},{id:'i3_leather',x:1100,y:156,item:'leather'},{id:'i3_wand',x:2480,y:156,item:'wand'},{id:'i3_gs',x:560,y:300,item:'greatsword'}],puddles:[],
  spikes:[[820,148,844,156],[1540,148,1564,156],[2580,148,2604,156]],
  boss:{kind:'king',name:'VULCREST THE CINDER KING',sub:'LORD OF THE BURNING DEEP',slain:'THE KING IS ASH',hp:60,card:'THE CINDER KING IS ASH. THE FIRST FLAME WAITS.',
   phases:['THE FORGE ROARS','THE DEEP ERUPTS']},
  enemies:[['hollow',200],['imp',520],['knight',700],['wraith',1000],['hollow',1250],['imp',1400],['wraith',1520],['hollow',2010],['knight',2150],['wraith',2420],['imp',2660],['hollow',2800]]},
 [['crypt',300],['pillarRoom',900],['ossuary',1950,'CINDER TRIAL'],['tower',2200,'FURNACE RUN',10],['ledge',2896],['lavaRise',1020],['forge',2420]],
 {hollow:'husk',knight:'cinderknight',wraith:'wisp',imp:'magmaw'});
