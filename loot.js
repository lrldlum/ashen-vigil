// ASHEN VIGIL — milestone G: loot (consumables, weighted drop tables, chests + mimics, lord signature weapons). Pure data, no Phaser.
'use strict';
// consumables take effect the moment you pick them up (each has its own pickup burst drawn in code: kind -> colour + shape)
const CONSUMABLES={
 ember:{name:'WARM EMBER',fx:'heal',col:0xffb04a,hp:35},
 bluesap:{name:'BLUE SAP',fx:'fp',col:0x6ab8ff,fp:30},
 soulshard:{name:'SOUL SHARD',fx:'souls',col:0xe8e0ff,souls:150},
 rimesalt:{name:'RIME SALT',fx:'guard',col:0xd8f2ff,guard:12},// 12 s of +25% absorption
 cinderleaf:{name:'CINDER LEAF',fx:'stam',col:0x9fe86a,stam:10}};// 10 s of free stamina regen boost
// weighted tables. Each roll: one entry by weight. 'none' = only souls. 'gear' = a random weapon/armor the picker doesn't own yet
const DROP_TABLES={
 common:[['none',62],['ember',12],['bluesap',8],['soulshard',8],['cinderleaf',5],['gear',5]],
 elite:[['none',30],['ember',18],['bluesap',12],['soulshard',14],['rimesalt',10],['cinderleaf',6],['gear',10]],
 chest:[['ember',22],['bluesap',16],['soulshard',22],['rimesalt',14],['cinderleaf',10],['gear',16]],
 mimic:[['gear',100]]};
const ETABLE={knight:'elite',sentinel:'elite',cinderknight:'elite'};// everything else uses 'common'
const GEAR_POOL=['longsword','dagger','spear','axe','bow','greatsword','staff','leather','herald','robe','iron'];
function rollTable(name,r=Math.random()){const T=DROP_TABLES[name];const tot=T.reduce((a,[,w])=>a+w,0);let x=r*tot;for(const[k,w]of T){if((x-=w)<0)return k}return T[T.length-1][0]}
// chests per stage: some sit in the open, some hide in secret rooms (hidden:1), some bite (mimic:1)
const CHESTS={
 ramparts:[{id:'ch_r1',x:640,y:156},{id:'ch_r2',x:330,y:36,hidden:1},{id:'ch_r3',x:1020,y:300,hidden:1},{id:'ch_r4',x:2200,y:156,mimic:1}],
 cathedral:[{id:'ch_c1',x:860,y:156},{id:'ch_c2',x:1770,y:36,hidden:1},{id:'ch_c3',x:2340,y:300,hidden:1},{id:'ch_c4',x:2700,y:156,mimic:1}],
 cinderdeep:[{id:'ch_d1',x:620,y:156},{id:'ch_d2',x:970,y:36,hidden:1},{id:'ch_d3',x:260,y:300,hidden:1},{id:'ch_d4',x:2350,y:156,mimic:1}],
 belltower:[{id:'ch_b1',x:820,y:156},{id:'ch_b2',x:1400,y:-104,hidden:1},{id:'ch_b3',x:260,y:36,hidden:1},{id:'ch_b4',x:1180,y:-60,mimic:1},{id:'ch_b5',x:2500,y:156,mimic:1}],
 catacomb:[{id:'ch_f1',x:820,y:156},{id:'ch_f2',x:1400,y:-104,hidden:1},{id:'ch_f3',x:260,y:36,hidden:1},{id:'ch_f4',x:1180,y:-60,mimic:1},{id:'ch_f5',x:1312,y:232},{id:'ch_f6',x:2500,y:156,mimic:1}],
 drowned:[{id:'ch_w1',x:820,y:156},{id:'ch_w2',x:1400,y:-104,hidden:1},{id:'ch_w3',x:260,y:36,hidden:1},{id:'ch_w4',x:1180,y:-60,mimic:1},{id:'ch_w5',x:2500,y:196,sunk:1},{id:'ch_w6',x:2700,y:156,mimic:1}],
 keep:[{id:'ch_k1',x:820,y:156},{id:'ch_k2',x:1400,y:-104,hidden:1},{id:'ch_k3',x:260,y:36,hidden:1},{id:'ch_k4',x:1180,y:-60,mimic:1},{id:'ch_k5',x:600,y:300},{id:'ch_k6',x:2700,y:156,mimic:1}],
 spire:[{id:'ch_s1',x:820,y:156},{id:'ch_s2',x:1400,y:-104,hidden:1},{id:'ch_s3',x:260,y:36,hidden:1},{id:'ch_s4',x:1180,y:-60,mimic:1},{id:'ch_s5',x:600,y:300},{id:'ch_s6',x:2700,y:156,mimic:1}]};
// lord signature weapons: guaranteed drop, unique special on the HEAVY attack (costs FP), story description in DESC
const SIGNATURE={warden:'frostbrand',cantor:'requiemspear',king:'crownbreaker',toller:'clapper',smith:'ashmaul',abbess:'tidecrook',marshal:'halberd',astronomer:'starlance'};
const SIG_WEAPONS={
 frostbrand:{name:'FROSTBRAND',type:'sword',hand:'main',base:1.25,req:{str:11,dex:12},sc:{str:'C',dex:'B'},w:4,swL:10,special:'frost',spFp:8,
  light:{t:.34,h0:.08,h1:.16,reach:12,w:22,h:18,mul:1,cost:18,lunge:30,n:2,arc:{r:16,th:3,sweep:200,trail:1}},
  heavy:{t:.66,h0:.30,h1:.38,reach:14,w:24,h:22,mul:2,cost:30,lunge:50,poise:2,arc:{r:18,th:4,sweep:170,trail:1}}},
 requiemspear:{name:'REQUIEM PIKE',type:'spear',hand:'main',base:1.2,req:{str:10,dex:13},sc:{str:'D',dex:'B'},w:4,swL:15,special:'hymn',spFp:10,
  light:{t:.34,h0:.1,h1:.18,reach:20,w:26,h:8,mul:1,cost:15,lunge:60,n:2,stab:1},
  heavy:{t:.62,h0:.08,h1:.32,reach:20,w:40,h:10,mul:1.8,cost:28,lunge:200,stab:1,poise:2}},
 crownbreaker:{name:'CROWNBREAKER',type:'greatsword',hand:'main',base:2.0,req:{str:18,dex:8},sc:{str:'A',dex:'E'},w:10,swL:13,special:'cinder',spFp:12,
  light:{t:.72,h0:.26,h1:.37,reach:16,w:30,h:26,mul:1,cost:33,lunge:40,n:2,poise:2,arc:{r:22,th:5,sweep:220,trail:1}},
  heavy:{t:.92,h0:.48,h1:.56,reach:10,w:52,h:24,mul:2.2,cost:42,lunge:70,hop:-170,aoe:1,poise:3,shock:1,arc:{r:24,th:5,sweep:160,trail:1}}},
 clapper:{name:"TOLLER'S CLAPPER",type:'axe',hand:'main',base:1.5,req:{str:14,dex:7},sc:{str:'B',dex:'E'},w:7,swL:11,special:'toll',spFp:10,
  light:{t:.6,h0:.22,h1:.32,reach:14,w:28,h:24,mul:1,cost:28,lunge:30,n:2,poise:2,arc:{r:19,th:5,sweep:200,trail:1}},
  heavy:{t:.84,h0:.42,h1:.52,reach:6,w:50,h:24,mul:2,cost:38,lunge:40,hop:-150,aoe:1,poise:3,shock:1,arc:{r:22,th:5,sweep:170,trail:1}}},
 // milestone H: the Ashwrought Smith's forge maul — slow, huge poise, the heavy brings down the anvil: three molten pillars erupt ahead
 ashmaul:{name:'ASHWROUGHT MAUL',type:'greatsword',hand:'main',base:1.9,req:{str:17,dex:7},sc:{str:'A',dex:'E'},w:9,swL:12,special:'forge',spFp:10,
  light:{t:.68,h0:.26,h1:.36,reach:14,w:30,h:26,mul:1,cost:31,lunge:36,n:2,poise:2,arc:{r:21,th:5,sweep:210,trail:1}},
  heavy:{t:.9,h0:.46,h1:.56,reach:8,w:48,h:24,mul:2.1,cost:40,lunge:50,hop:-160,aoe:1,poise:3,shock:1,arc:{r:23,th:5,sweep:160,trail:1}}},
 // milestone I: the Tidebound Abbess's crook — a long reaching hook; the heavy calls a tide-crest that rolls forward through everything it meets
 tidecrook:{name:"ABBESS'S TIDE-CROOK",type:'spear',hand:'main',base:1.15,req:{str:9,dex:12,fth:8},sc:{str:'D',dex:'C'},w:4,swL:16,special:'tide',spFp:10,
  light:{t:.36,h0:.1,h1:.2,reach:22,w:28,h:10,mul:1,cost:16,lunge:50,n:2,stab:1},
  heavy:{t:.66,h0:.22,h1:.34,reach:18,w:42,h:14,mul:1.8,cost:28,lunge:60,poise:2,arc:{r:20,th:4,sweep:190,trail:1}}},
 // milestone J: the Ironclad Castellan's halberd — the heavy looses a ballista bolt that pierces everything in its line
 halberd:{name:"CASTELLAN'S HALBERD",type:'axe',hand:'main',base:1.45,req:{str:13,dex:10},sc:{str:'C',dex:'C'},w:6,swL:14,special:'bolt',spFp:10,
  light:{t:.5,h0:.18,h1:.28,reach:16,w:30,h:20,mul:1,cost:24,lunge:30,n:2,poise:2,arc:{r:20,th:4,sweep:200,trail:1}},
  heavy:{t:.76,h0:.34,h1:.46,reach:12,w:44,h:22,mul:1.9,cost:34,lunge:40,poise:3,arc:{r:22,th:5,sweep:170,trail:1}}},
 // milestone K: the Starbound Astronomer's lance — the heavy bursts into a nova of starlight around you
 starlance:{name:'ASTRONOMER\'S STARLANCE',type:'spear',hand:'main',base:1.3,req:{str:10,dex:12},sc:{str:'D',dex:'B'},w:4,swL:18,special:'nova',spFp:10,
  light:{t:.42,h0:.14,h1:.24,reach:26,w:30,h:10,mul:1,cost:18,lunge:40,n:2,poise:1,arc:{r:24,th:3,sweep:60,trail:1}},
  heavy:{t:.66,h0:.3,h1:.42,reach:22,w:40,h:14,mul:1.8,cost:28,lunge:70,poise:2,arc:{r:26,th:4,sweep:90,trail:1}}}};
const LOOT_DESC={
 ember:['A WARM EMBER, STILL BEATING. PRESSED TO THE','CHEST IT MENDS WHAT THE COLD HAS TAKEN.'],
 bluesap:['SAP OF THE BLUE TREE THAT GREW IN THE COURT','GARDEN. SORCERERS DRANK IT TO HEAR THE FROST.'],
 soulshard:['A SLIVER OF SOMEONE. THEY WILL NOT MISS IT,','OR THEY WILL, BUT NOT FOR LONG.'],
 rimesalt:['SALT SCRAPED FROM THE BELL TOWER STAIRS.','RUBBED ON ARMOR, THE COLD HOLDS IT FAST.'],
 cinderleaf:['A LEAF THAT GREW IN THE CINDERDEEP AND DID','NOT BURN. CHEWED, THE LUNGS FORGET TO TIRE.'],
 frostbrand:['THE FROST WARDEN\'S BLADE. HE TAUGHT WITH IT','BEFORE HE GUARDED WITH IT. HEAVY ATTACK','SENDS A ROW OF FROST ALONG THE GROUND.'],
 requiemspear:['THE PALE CANTOR\'S PIKE, ITS SHAFT CARVED','WITH A HYMN NO ONE FINISHED. HEAVY ATTACK','RINGS OUT A CIRCLE OF PALE NOTES.'],
 crownbreaker:['FORGED FROM THE CINDER KING\'S OWN CROWN BY','THE LAST OF THE FORGE-FOLK. HEAVY ATTACK','SPLITS THE GROUND IN A LINE OF CINDERS.'],
 clapper:['THE TONGUE OF THE GREAT BELL, PRISED FROM THE','RIMEBOUND TOLLER. HEAVY ATTACK TOLLS A','SHOCKWAVE THAT STUNS ALL WHO HEAR IT.'],
 ashmaul:['THE ASHWROUGHT SMITH\'S MAUL. IT CAST THE','GREAT BELL AND THE CINDER KING\'S CROWN. HEAVY','ATTACK BRINGS DOWN THE ANVIL: MOLTEN PILLARS RISE.'],
 tidecrook:['THE TIDEBOUND ABBESS\'S CROOK. SHE HOOKED','HER SISTERS UNDER WITH IT, ONE BY ONE. HEAVY','ATTACK CALLS A TIDE-CREST THAT ROLLS AHEAD.'],
 starlance:['THE STARBOUND ASTRONOMER\'S LANCE, TIPPED','WITH A SHARD OF A FALLEN STAR. HEAVY ATTACK','BURSTS INTO A NOVA OF STARLIGHT AROUND YOU.'],
 halberd:['THE IRONCLAD CASTELLAN\'S HALBERD, ITS HAFT','NOTCHED FOR EVERY SIEGE HE HELD. HEAVY ATTACK','LOOSES A BALLISTA BOLT THAT PIERCES ITS LINE.'],
 chest:['A RINGER\'S STRONGBOX. MOST HOLD WHAT THE DEAD','LEFT BEHIND. SOME HAVE GROWN TEETH.']};
if(typeof module!=='undefined')module.exports={CONSUMABLES,DROP_TABLES,ETABLE,GEAR_POOL,rollTable,CHESTS,SIGNATURE,SIG_WEAPONS,LOOT_DESC};
// in the browser: signature weapons join the armoury, loot lore joins the description book
if(typeof WEAPONS!=='undefined')Object.assign(WEAPONS,SIG_WEAPONS);if(typeof DESC!=='undefined')Object.assign(DESC,LOOT_DESC);
