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
  solid:[[x+80,180,x+96,252],[x+176,180,x+192,252],[x+272,180,x+288,252]],chain:[[x+128,196,x+136,300],[x+224,196,x+232,300],[x+376,156,x+384,300]],
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
  plats:[[560,128,48],[1450,120,48],[2120,118,48],[2560,112,40],[3030,116,40],[3270,116,40],[3130,80,80]],// arena: 2-tier choir loft the Cantor glides to
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
  plats:[[860,124,48],[1460,118,48],[2440,112,40],[3100,116,36],[3220,116,36]],lavaPits:[[3040,3084],[3150,3196],[3262,3300]],// arena: pits erupt in phase 2
  items:[{id:'i3_plate',x:1700,y:156,item:'knight'},{id:'i3_leather',x:1100,y:156,item:'leather'},{id:'i3_wand',x:2480,y:156,item:'wand'},{id:'i3_gs',x:560,y:300,item:'greatsword'}],puddles:[],
  spikes:[[820,148,844,156],[1540,148,1564,156],[2580,148,2604,156]],
  boss:{kind:'king',name:'VULCREST THE CINDER KING',sub:'LORD OF THE BURNING DEEP',slain:'THE KING IS ASH',hp:60,card:'THE CINDER KING IS ASH. THE FIRST FLAME WAITS.',
   phases:['THE FORGE ROARS','THE DEEP ERUPTS']},
  enemies:[['hollow',200],['imp',520],['knight',700],['wraith',1000],['hollow',1250],['imp',1400],['wraith',1520],['hollow',2010],['knight',2150],['wraith',2420],['imp',2660],['hollow',2800]]},
 [['crypt',300],['pillarRoom',900],['ossuary',1950,'CINDER TRIAL'],['tower',2200,'FURNACE RUN',10],['ledge',2896],['lavaRise',1020],['forge',2420]],
 {hollow:'husk',knight:'cinderknight',wraith:'wisp',imp:'magmaw'});

// ---------------------------------------------------------------------------
// Milestone E: the Ash Shrine hub (reached between stages) + lore stones in every stage
STAGE_DEFS.shrine=composeStage({pre:'s0',name:'THE ASH SHRINE',world:640,top:-204,bottom:364,theme:'shrine',hub:1,arena:[9000,9100],
  bonfire:200,bonfireName:'ASH SHRINE',next:null,keeper:300,exit:596,
  pal:{sky0:'#0c0a12',sky1:'#110e18',sky2:'#17131f',sky3:'#1e1928',sky4:'#282133',far:'#15111c',farW:'#3a2f40',farW2:'#7a6070',near:'#0d0a12',nearW:'#3a2a30',
   gTop:'#b8a898',g1:'#5e5560',g2:'#4e4652',gM:'#262029',gD:'#342c38',b0:'#16121c',bM:'#09070c',bH:'#221c28',mist:'rgba(200,180,170,.10)',haze1:'rgba(40,30,40,.55)',haze2:'rgba(60,44,52,.6)',mist2:'rgba(160,140,140,.07)',pil:0x16121c,pilH:0x2e2636},
  plats:[[420,124,48],[500,100,40]],items:[{id:'i0_talisman',x:520,y:100,item:'talisman'}],puddles:[[90,14],[440,16]],enemies:[],
  lore:[{id:'shrine1',x:120,y:156}]},[],{});
STAGE_DEFS.ramparts.lore=[{id:'r1',x:420,y:156},{id:'r2',x:1300,y:300},{id:'r3',x:2930,y:156}];
STAGE_DEFS.cathedral.lore=[{id:'c1',x:300,y:156},{id:'c2',x:600,y:300},{id:'c3',x:1640,y:156}];
STAGE_DEFS.cinderdeep.lore=[{id:'d1',x:150,y:156},{id:'d2',x:2592,y:252},{id:'d3',x:2930,y:156}];

// ---------------------------------------------------------------------------
// Milestone G: THE FROZEN BELL TOWER — an optional stage behind the Frozen Stair in the Ash Shrine (opens once the Pale Cantor is silenced).
// Routes branch Rayman-style: a HIGH road over the bell frame (chain up at 1000, ring the hanging bells, drop at 1600) or the LOW road through the
// frozen crypt and bell trial; both meet at the bonfire and again before the arena. Five FROZEN BELLS are the stage's collectible: strike them all
// and the seal on the Bell-Ringer's ember breaks. Lord: THE RIMEBOUND TOLLER.
TPL.bellframe=(x,id)=>({chain:[[x,-52,x+8,156],[x+600,-52,x+608,156]],
  oneway:[[x+8,-60,x+200,-52],[x+232,-60,x+420,-52],[x+452,-60,x+600,-52]],
  solid:[[x+300,-136,x+316,-100],[x+316,-104,x+420,-100],[x+300,-140,x+420,-136]],plats:[[x+436,-80,24]],back:[[x+316,-136,x+420,-104]],
  covers:[{id:id+'_h',r:[x+316,-136,x+420,-104]}],
  enemies:[['wraith',x+150,-110],['hollow',x+330,-60],['imp',x+520,-60]]});
TPL.icefall=(x,id)=>({spikes:[[x+40,148,x+64,156],[x+120,148,x+144,156]],plats:[[x+16,124,32],[x+88,108,40],[x+168,120,32]],enemies:[['knight',x+100]]});
STAGE_DEFS.belltower=composeStage({pre:'bt',name:'THE FROZEN BELL TOWER',world:3360,top:-204,bottom:364,theme:'belltower',side:1,
  bonfire:1600,bonfireName:'BELL-ROPE VIGIL',next:'shrine',bellLock:'bt_bells',
  pal:{sky0:'#070b14',sky1:'#0b1220',sky2:'#111c30',sky3:'#182a44',sky4:'#22385a',far:'#0f182a',farW:'#2a4466',farW2:'#7aa6d0',near:'#09101c',nearW:'#2c4a70',
   gTop:'#e8f4ff',g1:'#7a90b0',g2:'#64789a',gM:'#2e3c58',gD:'#3e5072',b0:'#0e1a2e',bM:'#060a14',bH:'#1a2a44',mist:'rgba(210,230,255,.16)',haze1:'rgba(30,46,74,.55)',haze2:'rgba(44,64,98,.6)',mist2:'rgba(180,210,250,.10)',pil:0x0e1a2e,pilH:0x34507a},
  plats:[[3030,116,40],[3270,116,40],[3130,80,80]],// arena: the Toller climbs to the bell frame at 3130 and drops icicles
  items:[{id:'g_rime',x:1370,y:-104,item:'rime'},{id:'g_bow',x:560,y:300,item:'bow'}],
  puddles:[[120,18],[1500,22],[2240,16],[3080,24]],
  bells:[{id:'bell1',x:240,y:36},{id:'bell2',x:1100,y:-60},{id:'bell3',x:1480,y:-60},{id:'bell4',x:500,y:300},{id:'bell5',x:2300,y:-100}],
  boss:{kind:'toller',name:'THE RIMEBOUND TOLLER',sub:'LORD OF THE FROZEN BELLS',slain:'THE BELL IS STILL',hp:58,card:'THE LAST BELL IS STILL. THE KEEPER WILL HEAR IT.',
   phases:['THE BELLS TOLL AS ONE','THE PEAL OF ENDINGS'],reward:'clapper'},
  enemies:[['hollow',380],['wraith',700],['knight',900],['imp',1250],['hollow',1450],['wraith',1900],['knight',2120],['imp',2520],['hollow',2740],['wraith',2860]]},
 [['pillarRoom',160],['crypt',300],['bellframe',1000],['belfry',1100],['ossuary',1720,'BELL TRIAL'],['tower',2150,'FROST RUN',9],['icefall',2830],['ledge',2896]],
 {hollow:'acolyte',knight:'sentinel',wraith:'chorister'});
STAGE_DEFS.belltower.cages.push({id:'bt_bellcage',x:1250,y:-60,lock:'bt_bells'});
STAGE_DEFS.belltower.lore=[{id:'b1',x:90,y:156},{id:'b2',x:1360,y:-60},{id:'b3',x:2940,y:156}];
STAGE_DEFS.shrine.stair={x:40};// the Frozen Stair (left end of the shrine)

// ---------------------------------------------------------------------------
// Milestone H: THE BURNING CATACOMB FORGE — an optional stage down the Ember Descent in the Ash Shrine (opens once the Rimebound Toller is still).
// Routes branch: a HIGH road over the hanging forge gantry (chain up at 1000, strike the anvils on the gantry, drop at 1600) or the LOW road through
// the slag pool and the anvil steps; both meet at the bonfire and again before the arena. Five FORGE ANVILS are the collectible: strike them all
// and the seal on the bellows-cage breaks. Lord: THE ASHWROUGHT SMITH.
TPL.gantry=(x,id)=>({chain:[[x,-52,x+8,156],[x+600,-52,x+608,156]],
  oneway:[[x+8,-60,x+180,-52],[x+232,-60,x+420,-52],[x+472,-60,x+600,-52]],
  solid:[[x+300,-136,x+316,-100],[x+316,-104,x+420,-100],[x+300,-140,x+420,-136]],plats:[[x+196,-84,24],[x+440,-84,24]],back:[[x+316,-136,x+420,-104]],
  covers:[{id:id+'_h',r:[x+316,-136,x+420,-104]}],braziers:[[x+120,-60],[x+540,-60]],
  enemies:[['wraith',x+150,-110],['hollow',x+330,-60],['imp',x+520,-60]]});
TPL.slagfall=(x,id)=>({spikes:[[x+40,148,x+64,156],[x+120,148,x+144,156]],plats:[[x+16,124,32],[x+88,108,40],[x+168,120,32]],braziers:[[x+100,156]],enemies:[['knight',x+100]]});
STAGE_DEFS.catacomb=composeStage({pre:'cf',name:'THE BURNING CATACOMB FORGE',world:3360,top:-204,bottom:364,theme:'catacomb',side:1,
  bonfire:1600,bonfireName:'ANVIL VIGIL',next:'shrine',bellLock:'cf_anvils',bellKind:'anvil',
  pal:{sky0:'#0e0606',sky1:'#160909',sky2:'#200c0a',sky3:'#2e120c',sky4:'#44180e',far:'#170807',farW:'#4a1c10',farW2:'#c0601c',near:'#0c0404',nearW:'#5a2010',
   gTop:'#c89070',g1:'#5c3a30',g2:'#4c3028',gM:'#241410',gD:'#361e18',b0:'#180a08',bM:'#0a0403',bH:'#2a120c',lava:1,mist:'rgba(255,140,60,.09)',haze1:'rgba(60,20,12,.55)',haze2:'rgba(96,34,16,.6)',mist2:'rgba(220,90,40,.08)',pil:0x180a08,pilH:0x40201a},
  plats:[[3030,116,40],[3270,116,40],[3130,80,80]],// arena: the Smith climbs the crucible gantry at 3130 and hurls molten ingots
  items:[{id:'h_apron',x:1370,y:-104,item:'apron'},{id:'h_axe',x:560,y:300,item:'axe'}],
  puddles:[],spikes:[[2640,148,2664,156]],
  bells:[{id:'anvil1',x:250,y:36},{id:'anvil2',x:1100,y:-60},{id:'anvil3',x:1272,y:252},{id:'anvil4',x:2300,y:-100},{id:'anvil5',x:1500,y:-60}],
  boss:{kind:'smith',name:'THE ASHWROUGHT SMITH',sub:'LORD OF THE CATACOMB FORGE',slain:'THE FORGE GOES COLD',hp:62,card:'THE LAST ANVIL IS SILENT. THE KEEPER WILL FEEL THE COLD.',
   phases:['THE BELLOWS BREATHE','THE CRUCIBLE POURS'],reward:'ashmaul'},
  enemies:[['hollow',380],['wraith',700],['knight',900],['imp',1250],['hollow',1450],['wraith',1900],['knight',2120],['imp',2520],['hollow',2740],['wraith',2860]]},
 [['pillarRoom',160],['lavaRise',300],['gantry',1000],['forge',1100],['ossuary',1720,'ANVIL TRIAL'],['tower',2150,'SLAG RUN',9],['slagfall',2830],['ledge',2896]],
 {hollow:'husk',knight:'cinderknight',wraith:'wisp',imp:'magmaw'});
STAGE_DEFS.catacomb.cages.push({id:'cf_anvilcage',x:1250,y:-60,lock:'cf_anvils'});
STAGE_DEFS.catacomb.lore=[{id:'f1',x:90,y:156},{id:'f2',x:1360,y:-60},{id:'f3',x:2940,y:156}];
STAGE_DEFS.shrine.descent={x:470};// the Ember Descent (a grate in the shrine floor, right of the keeper)

// ---------------------------------------------------------------------------
// Milestone I: THE DROWNED CRYPT — an optional stage down the Drowned Well in the Ash Shrine (opens once the Ashwrought Smith's forge is cold).
// WATER (def.water rects, drawn + simulated in code): swim with jump/up, dive with down, breath runs out underwater. Routes: the HIGH gantry
// (chain at 1000) or the LOW flooded crypt + flooded nave (swim). PUZZLE: four SISTER SIGILS must be struck in the order the lore stones tell
// (gantry, crypt, nave, court); a wrong strike resets them. Solving it unseals the sigil cage and DRAINS the cistern, freeing the sunken chest.
// Lord: THE TIDEBOUND ABBESS (her tide floods the arena in phase 3).
TPL.cistern=(x,id)=>({carve:[[x,156,x+200,196]],plats:[[x+90,150,24]],enemies:[['wraith',x+100,120]]});
STAGE_DEFS.drowned=composeStage({pre:'dw',name:'THE DROWNED CRYPT',world:3360,top:-204,bottom:364,theme:'drowned',side:1,
  bonfire:1600,bonfireName:'TIDEMARK VIGIL',next:'shrine',bellLock:'dw_sigils',bellKind:'sigil',bellOrder:['sg_gantry','sg_crypt','sg_nave','sg_court'],
  pal:{sky0:'#040a10',sky1:'#071018',sky2:'#0a1822',sky3:'#0e222e',sky4:'#14303c',far:'#08141c',farW:'#1a3a44',farW2:'#4a9aa0',near:'#050c12',nearW:'#1c3a44',
   gTop:'#9ac8c0',g1:'#3e5a5c',g2:'#324c50',gM:'#16262a',gD:'#20363a',b0:'#0a1820',bM:'#04090c',bH:'#14282e',mist:'rgba(150,220,210,.10)',haze1:'rgba(14,34,40,.55)',haze2:'rgba(20,48,56,.6)',mist2:'rgba(120,200,190,.08)',pil:0x0a1820,pilH:0x24444a},
  plats:[[3030,116,40],[3270,116,40],[3130,80,80]],
  water:[{r:[300,184,772,300]},{r:[1100,200,1500,300]},{r:[2400,164,2600,196],drain:'dw_sigils'},{r:[2984,151,3336,156],arena:1}],
  items:[{id:'i_wspear',x:1370,y:-104,item:'spear'},{id:'i_wrobe',x:620,y:300,item:'robe'}],
  puddles:[[120,18],[1700,22],[2240,16]],
  bells:[{id:'sg_court',x:250,y:36},{id:'sg_crypt',x:520,y:300},{id:'sg_gantry',x:1300,y:-60},{id:'sg_nave',x:1240,y:300}],
  boss:{kind:'abbess',name:'THE TIDEBOUND ABBESS',sub:'LADY OF THE DROWNED CRYPT',slain:'THE TIDE GOES OUT',hp:60,card:'THE TIDE HAS GONE OUT. THE KEEPER IS THE LAST NOVICE.',
   phases:['THE SISTERS SING BENEATH','THE TIDE RISES'],reward:'tidecrook'},
  enemies:[['hollow',380],['wraith',700],['knight',900],['imp',1250],['hollow',1450],['wraith',1900],['knight',2120],['imp',2700],['hollow',2760],['wraith',2860]]},
 [['pillarRoom',160],['crypt',300],['gantry',1000],['nave',1100],['ossuary',1720,'TIDE TRIAL'],['tower',2150,'SLUICE RUN',9],['cistern',2400],['icefall',2830],['ledge',2896]],
 {hollow:'acolyte',knight:'sentinel',wraith:'chorister'});
STAGE_DEFS.drowned.cages.push({id:'dw_sigilcage',x:1250,y:-60,lock:'dw_sigils'});
STAGE_DEFS.drowned.lore=[{id:'w1',x:90,y:156},{id:'w2',x:1360,y:-60},{id:'w3',x:2940,y:156}];
STAGE_DEFS.shrine.well={x:380};// the Drowned Well (between the keeper and the shrine's raised ledge)

// ---------------------------------------------------------------------------
// Milestone J: THE RUINED RAMPART KEEP — an optional stage through the Keep Gate in the Ash Shrine (opens once the Tidebound Abbess is still).
// SIEGE: crumbling walls drop masonry (telegraphed), live BALLISTAE shoot bolts at anyone in their line, and WIND gusts sweep the battlements
// (def.wind: zones with a direction and a gust period; airborne heroes get blown). Routes: HIGH battlements (chain at 1000, windy) or the LOW
// undercroft. COLLECTIBLE: wreck all four ballistae to unseal the cage. Lord: THE IRONCLAD CASTELLAN (his gale sweeps the arena in phase 3).
STAGE_DEFS.keep=composeStage({pre:'kp',name:'THE RUINED RAMPART KEEP',world:3360,top:-204,bottom:364,theme:'keep',side:1,
  bonfire:1600,bonfireName:'BREACH VIGIL',next:'shrine',bellLock:'kp_ballistae',bellKind:'ballista',
  pal:{sky0:'#0a0a12',sky1:'#10101a',sky2:'#181824',sky3:'#22222e',sky4:'#30303c',far:'#121218',farW:'#3a3a48',farW2:'#8a8aa0',near:'#0a0a10',nearW:'#34343e',
   gTop:'#b8b0a0',g1:'#5a5650',g2:'#4a4642',gM:'#24221f',gD:'#34312c',b0:'#16151a',bM:'#08080a',bH:'#24232a',mist:'rgba(200,200,210,.10)',haze1:'rgba(30,30,40,.55)',haze2:'rgba(44,44,56,.6)',mist2:'rgba(170,170,190,.08)',pil:0x16151a,pilH:0x34343e},
  plats:[[3030,116,40],[3270,116,40],[3130,80,80]],
  wind:[{r:[1000,-200,1608,-52],dir:1,period:5},{r:[2210,-210,2720,-100],dir:-1,period:4}],
  masonry:[700,1400,2050,2600],
  items:[{id:'k_herald',x:1370,y:-104,item:'herald'},{id:'k_axe',x:620,y:300,item:'iron'}],
  puddles:[[1700,22],[2240,16]],
  bells:[{id:'bal1',x:1120,y:-60,f:1},{id:'bal2',x:1530,y:-60,f:-1},{id:'bal3',x:2300,y:-100,f:1},{id:'bal4',x:2000,y:156,f:-1}],
  boss:{kind:'marshal',name:'THE IRONCLAD CASTELLAN',sub:'LORD OF THE RUINED KEEP',slain:'THE KEEP HAS FALLEN',hp:62,card:'THE KEEP HAS FALLEN AT LAST. THE KEEPER KEEPS ALONE.',
   phases:['THE WALLS ANSWER THE HORN','THE WALLS COME DOWN'],reward:'halberd'},
  enemies:[['hollow',380],['wraith',700],['knight',900],['imp',1250],['hollow',1450],['wraith',1900],['knight',2120],['imp',2520],['hollow',2760],['wraith',2860]]},
 [['pillarRoom',160],['crypt',300],['gantry',1000],['belfry',1100],['ossuary',1720,'SIEGE TRIAL'],['tower',2150,'BREACH RUN',9],['slagfall',2830],['ledge',2896]],
 {});
STAGE_DEFS.keep.cages.push({id:'kp_balcage',x:1250,y:-60,lock:'kp_ballistae'});
STAGE_DEFS.keep.lore=[{id:'k1',x:90,y:156},{id:'k2',x:1360,y:-60},{id:'k3',x:2940,y:156}];
STAGE_DEFS.shrine.gate={x:540};// the Keep Gate (a barred postern in the shrine's east wall)
// ---------------- milestone K: THE ASTRAL SPIRE — a gothic observatory; gravity tides lift you in pulsing zones, star platforms flicker in and out,
// starfall rains near the open domes, four star lenses must be turned to the sky (collectible) to unseal the orrery cage; lord: the Starbound Astronomer
STAGE_DEFS.spire=composeStage({pre:'sp',name:'THE ASTRAL SPIRE',world:3360,top:-204,bottom:364,theme:'spire',side:1,
  bonfire:1600,bonfireName:'ORRERY VIGIL',next:'shrine',bellLock:'sp_lenses',bellKind:'lens',
  pal:{sky0:'#05041a',sky1:'#0a0826',sky2:'#120e34',sky3:'#1c1644',sky4:'#2a2258',far:'#0c0a1e',farW:'#2e2a5a',farW2:'#a8a0e8',near:'#06051a',nearW:'#2a2648',
   gTop:'#b8b0d8',g1:'#4e4a6a',g2:'#3e3a58',gM:'#1c1a2a',gD:'#2a2840',b0:'#121022',bM:'#06050c',bH:'#221e36',mist:'rgba(170,160,240,.10)',haze1:'rgba(20,16,50,.55)',haze2:'rgba(34,28,70,.6)',mist2:'rgba(200,190,255,.08)',pil:0x121022,pilH:0x2a2648},
  plats:[[3030,116,40],[3270,116,40],[3130,80,80]],
  lowg:[{r:[1000,-210,1608,-52],period:6},{r:[2210,-210,2720,-100],period:5,off:2}],
  stars:[[1640,-80,30,3],[1700,-104,30,3.6],[2140,-60,36,4]],
  starfall:[700,1400,2050,2600],
  items:[{id:'s_herald',x:1370,y:-104,item:'herald'},{id:'s_ring',x:620,y:300,item:'iron'}],
  puddles:[[1700,22],[2240,16]],
  bells:[{id:'ln1',x:1120,y:-60},{id:'ln2',x:1530,y:-60},{id:'ln3',x:2300,y:-100},{id:'ln4',x:2000,y:156}],
  boss:{kind:'astronomer',name:'THE STARBOUND ASTRONOMER',sub:'LORD OF THE ASTRAL SPIRE',slain:'THE STARS GO DARK',hp:64,card:'THE LAST STAR-READER IS SILENT. THE SKY IS OURS TO READ.',
   phases:['THE HEAVENS TURN','THE SKY FALLS'],reward:'starlance'},
  enemies:[['hollow',380],['wraith',700],['knight',900],['imp',1250],['hollow',1450],['wraith',1900],['knight',2120],['imp',2520],['hollow',2760],['wraith',2860]]},
 [['pillarRoom',160],['crypt',300],['gantry',1000],['belfry',1100],['ossuary',1720,'STAR TRIAL'],['tower',2150,'COMET RUN',9],['slagfall',2830],['ledge',2896]],
 {});
STAGE_DEFS.spire.cages.push({id:'sp_orrery',x:1250,y:-60,lock:'sp_lenses'});
STAGE_DEFS.spire.lore=[{id:'a1',x:90,y:156},{id:'a2',x:1360,y:-60},{id:'a3',x:2940,y:156}];
STAGE_DEFS.shrine.lift={x:80};// the Star Lift (an orrery cage near the shrine's west end)
