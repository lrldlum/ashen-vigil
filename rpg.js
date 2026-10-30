// ASHEN VIGIL — milestone D: DS3-style classes, stats, leveling, weapons, armor, catalysts (data + pure helpers, no Phaser)
'use strict';
const STATS=['vig','end','vit','str','dex','int','fth','lck'];
const STAT_NAMES={vig:'VIGOR',end:'ENDURANCE',vit:'VITALITY',str:'STRENGTH',dex:'DEXTERITY',int:'INTELLIGENCE',fth:'FAITH',lck:'LUCK'};
// DS3 starting levels and stats (vig end vit str dex int fth lck)
const CLASSES={
 knight:    {name:'KNIGHT',    lvl:9, s:[12,11,15,13,12, 9, 9, 7],main:'longsword',off:'wand',  armor:'knight', desc:'STEADFAST PLATE. A LONGSWORD AND A VIGIL WAND.'},
 mercenary: {name:'MERCENARY', lvl:8, s:[11,12,10,10,16,10, 8, 9],main:'dagger',   off:null,    armor:'leather',desc:'FAST BLADE, LIGHT LEATHER.'},
 warrior:   {name:'WARRIOR',   lvl:7, s:[14, 6,12,16, 9, 8, 9,11],main:'greatsword',off:null,   armor:'iron',   desc:'A GREATSWORD AND HEAVY IRON.'},
 herald:    {name:'HERALD',    lvl:9, s:[12,10, 9,12,11, 8,13,11],main:'spear',    off:'talisman',  armor:'herald', desc:'SPEAR, TALISMAN AND BLESSED MAIL. KNOWS HEAL.',extra:['heal']},
 thief:     {name:'THIEF',     lvl:5, s:[10,11,10, 9,13,10, 8,14],main:'bow',      off:null,    armor:'leather',desc:'A SHORT BOW. A KNIFE IN THE PACK.',extra:['dagger']},
 assassin:  {name:'ASSASSIN',  lvl:10,s:[10,14,11,10,14,11, 9,10],main:'dagger',   off:'wand',  armor:'leather',desc:'KNIFE IN ONE HAND, WAND IN THE OTHER.'},
 sorcerer:  {name:'SORCERER',  lvl:6, s:[ 9, 9, 7, 7,12,16, 7,12],main:'staff',    off:null,    armor:'robe',   desc:'A CRYSTAL STAFF. FRAIL, BUT THE FROST OBEYS.'},
 pyromancer:{name:'PYROMANCER',lvl:8, s:[11,12,11,12, 9,14,14, 7],main:'axe',      off:'wand',  armor:'robe',   desc:'HAND AXE AND AN EMBER WAND.'},
 cleric:    {name:'CLERIC',    lvl:7, s:[10, 9, 7,12, 8, 7,16,13],main:'axe',      off:'talisman',  armor:'herald', desc:'MACE-AXE AND TALISMAN. HEAL AND LIGHTNING SPEAR.',extra:['heal','lspear']},
 deprived:  {name:'DEPRIVED',  lvl:1, s:[10,10,10,10,10,10,10,10],main:'dagger',   off:null,    armor:'none',   desc:'NOTHING BUT A BROKEN KNIFE.'}};
const CLASS_ORDER=['knight','mercenary','warrior','herald','thief','assassin','sorcerer','pyromancer','cleric','deprived'];
// scaling letters -> coefficient; stat bonus curve saturates at 40, soft cap to 99
const SCALE={S:1.4,A:1.1,B:.8,C:.55,D:.35,E:.15};
const statCurve=s=>s<=10?0:s<=40?(s-10)/30:1+(s-40)/59*.25;
// moves: t = total time, h0/h1 = active window, reach = hitbox centre ahead, w/h = hitbox, mul = damage, cost = stamina,
// lunge = forward velocity, n = light combo length, arc = slash look; heavy has its own; aoe = hits both sides
const WEAPONS={
 longsword:{name:'VIGIL LONGSWORD',type:'sword',hand:'main',base:1.0,req:{str:10,dex:10},sc:{str:'C',dex:'C'},w:3,swL:9,
  light:{t:.34,h0:.08,h1:.16,reach:12,w:22,h:18,mul:1,cost:18,lunge:30,n:2,arc:{r:16,th:3,sweep:200,trail:1}},
  heavy:{t:.62,h0:.30,h1:.38,reach:14,w:24,h:22,mul:2,cost:30,lunge:50,poise:2,arc:{r:18,th:4,sweep:170,trail:1}}},
 greatsword:{name:'ASHEN GREATSWORD',type:'greatsword',hand:'main',base:1.8,req:{str:16,dex:8},sc:{str:'B',dex:'D'},w:9,swL:13,
  light:{t:.7,h0:.25,h1:.36,reach:16,w:30,h:26,mul:1,cost:32,lunge:40,n:2,poise:2,arc:{r:22,th:5,sweep:220,trail:1}},
  heavy:{t:.9,h0:.48,h1:.56,reach:10,w:52,h:24,mul:2.2,cost:40,lunge:70,hop:-170,aoe:1,poise:3,shock:1,arc:{r:24,th:5,sweep:160,trail:1}}},
 dagger:{name:'BANDIT KNIFE',type:'dagger',hand:'main',base:.7,req:{str:5,dex:9},sc:{str:'E',dex:'B'},w:1.5,swL:5,crit:1.6,
  light:{t:.2,h0:.04,h1:.09,reach:10,w:18,h:14,mul:1,cost:10,lunge:50,n:3,stab:1},
  heavy:{t:.34,h0:.1,h1:.18,reach:12,w:20,h:14,mul:1.6,cost:20,lunge:170,stab:1,poise:1}},
 spear:{name:'PIKE OF THE VIGIL',type:'spear',hand:'main',base:1.0,req:{str:11,dex:11},sc:{str:'C',dex:'C'},w:4.5,swL:15,
  light:{t:.36,h0:.1,h1:.18,reach:20,w:26,h:8,mul:1,cost:16,lunge:60,n:2,stab:1},
  heavy:{t:.6,h0:.06,h1:.32,reach:20,w:40,h:10,mul:1.8,cost:28,lunge:230,stab:1,poise:2}},
 axe:{name:'CINDER AXE',type:'axe',hand:'main',base:1.2,req:{str:12,dex:8},sc:{str:'C',dex:'D'},w:4,swL:9,
  light:{t:.44,h0:.14,h1:.22,reach:13,w:22,h:24,mul:1,cost:20,lunge:30,n:2,arc:{r:15,th:4,sweep:170,trail:1}},
  heavy:{t:.66,h0:.25,h1:.42,reach:0,w:46,h:22,mul:1.7,cost:32,lunge:0,aoe:1,spin:1,poise:2,arc:{r:17,th:4,sweep:340,trail:1}}},
 bow:{name:'SHORT BOW',type:'bow',hand:'main',base:.8,req:{str:7,dex:12},sc:{str:'E',dex:'B'},w:2.5,swL:0,
  light:{t:.36,h0:.14,h1:.15,mul:1,cost:12,arrow:280},
  heavy:{t:.72,h0:.55,h1:.56,mul:2,cost:22,arrow:360,pierce:1}},
 staff:{name:'CRYSTAL STAFF',type:'staff',hand:'main',base:.45,req:{int:10},sc:{int:'D'},w:2,swL:11,cat:1,buff:160,csc:'A',
  light:{t:.36,h0:.1,h1:.18,reach:12,w:20,h:16,mul:1,cost:14,lunge:20,n:1,stab:1},
  heavy:{t:.56,h0:.24,h1:.32,reach:12,w:22,h:22,mul:1.5,cost:24,lunge:30,poise:1,arc:{r:14,th:3,sweep:160,trail:0}}},
 wand:{name:'VIGIL WAND',type:'wand',hand:'off',base:0,req:{int:8},sc:{},w:1,cat:1,buff:100,csc:'C'},
 // milestone E: faith catalyst for miracles (off hand); miracle power scales with FTH
 talisman:{name:'EMBER TALISMAN',type:'talisman',hand:'off',base:0,req:{fth:10},sc:{},w:.5,mir:1,buff:100,csc:'B'}};
const ARMORS={
 none:{name:'NOTHING',w:0,poise:0,abs:0,pal:{b:0x8a7e88,s:0x4a4050,h:0xb8acb8,c:0x3a3040}},
 robe:{name:'CINDER ROBE',w:3,poise:1,abs:.06,pal:{b:0x6a4ab8,s:0x3a2470,h:0xa088e8,c:0x2a1a60}},
 leather:{name:'HUNTER LEATHERS',w:5,poise:3,abs:.1,pal:{b:0x9a6a3a,s:0x5a3a1c,h:0xd8a060,c:0x4a2a14}},
 herald:{name:'HERALD MAIL',w:10,poise:9,abs:.16,pal:{b:0x7aa0d8,s:0x3a5088,h:0xd8e8ff,c:0xd8a040}},
 knight:{name:'EMBER PLATE',w:12,poise:12,abs:.18,pal:null},// the original orange ember knight
 apron:{name:'ASHWROUGHT APRON',w:8,poise:7,abs:.15,pal:{b:0x6a3a24,s:0x3a1e12,h:0xd08850,c:0xff8a3a}},// milestone H
 rime:{name:'RIMEBOUND SHROUD',w:7,poise:6,abs:.14,pal:{b:0xb8d0ec,s:0x5a7aa0,h:0xf0f8ff,c:0x2a4a7a}},// milestone G
 iron:{name:'IRON BULWARK',w:20,poise:22,abs:.26,pal:{b:0x8a8a9a,s:0x4a4a5a,h:0xd0d0e0,c:0x6a1a14}}};
// spells (INT): need a catalyst (staff in the right hand or a wand in either hand)
const SPELLS={ice:{name:'FROST SPIKES',int:8,fp:15},bolt:{name:'STORM',int:9,fp:20},dome:{name:'FROST DOME',int:9,fp:30}};
// r4: level cost x3 (d*3/8), heavy weapons (w>=6) keep only 35% AR when requirements are unmet
const RPG={
 classStats(c){const o={};STATS.forEach((k,i)=>o[k]=CLASSES[c].s[i]);return o},
 level(c,st){return CLASSES[c].lvl+STATS.reduce((a,k,i)=>a+(st[k]-CLASSES[c].s[i]),0)},
 // DS3 soul curve, scaled /8 for this game's soul economy
 cost(L){const d=L<12?673+17*(L-1):Math.round(.02*L*L*L+3.06*L*L+105.6*L-895);return Math.round(d*3/8)},
 meets(wp,st){return Object.entries(wp.req||{}).every(([k,v])=>st[k]>=v)},
 ar(wp,st){if(!wp)return 0;let b=1;for(const[k,l]of Object.entries(wp.sc||{}))b+=SCALE[l]*statCurve(st[k]);return wp.base*b*(this.meets(wp,st)?1:wp.w>=6?.35:.5)},
 spellBuff(cat,st){if(!cat||!this.meets(cat,st))return 0;return cat.buff/100*(1+SCALE[cat.csc]*statCurve(st.int)*.6)},
 derive(st,eq){const main=WEAPONS[eq.main],off=WEAPONS[eq.off],arm=ARMORS[eq.armor||'none'];
  const load=25+st.vit*1.5,w=(main?main.w:0)+(off?off.w:0)+arm.w,ratio=w/load;
  const roll=ratio<.3?{kind:'LIGHT',t:.32,v:215,i0:.03,i1:.26,cost:22}:ratio<.7?{kind:'MEDIUM',t:.36,v:170,i0:.04,i1:.24,cost:25}:ratio<=1?{kind:'HEAVY',t:.5,v:110,i0:.06,i1:.2,cost:32}:{kind:'OVERLOADED',t:0,v:0,i0:0,i1:0,cost:0};
  const cat=main&&main.cat?main:off&&off.cat?off:null,tal=off&&off.mir?off:main&&main.mir?main:null;
  return{hp:Math.round(100+(st.vig-10)*5),fp:Math.round(80+(st.int+st.fth-18)*2),st:Math.round(100+(st.end-10)*3),load:+load.toFixed(1),w:+w.toFixed(1),ratio,roll,
   poise:arm.poise,abs:arm.abs,ar:this.ar(main,st),cat,spell:this.spellBuff(cat,st),heal:40+Math.max(0,(st.fth-10)*1.5),soulMul:1+Math.max(0,st.lck-10)*.02,weak:main&&!this.meets(main,st),tal,mir:this.mirBuff(tal,st)}},
 mirBuff(tal,st){if(!tal||!this.meets(tal,st))return 0;return tal.buff/100*(1+SCALE[tal.csc]*statCurve(st.fth)*.8)},
 letters(wp){return Object.entries(wp.sc||{}).map(([k,l])=>k.toUpperCase()+' '+l).join(' ')},
 reqs(wp){return Object.entries(wp.req||{}).map(([k,v])=>k.toUpperCase()+' '+v).join(' ')}};
if(typeof module!=='undefined')module.exports={STATS,CLASSES,CLASS_ORDER,WEAPONS,ARMORS,SPELLS,RPG};
