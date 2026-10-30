// ASHEN VIGIL — game data: classes, gear, spells, stages, lore text. All original.
'use strict';
const STATS=['VIG','END','VIT','STR','DEX','INT','FTH','LCK'];
const CLASSES={
 sentinel:{name:'Sentinel',lv:9,st:[12,10,11,13,12,9,9,7],gear:{weapon:'longsword',head:'plate_head',chest:'plate_chest',hands:'plate_hands',legs:'plate_legs'},spells:[],blurb:'A knight of the gate. Heavy plate, steady blade.'},
 brute:{name:'Brute',lv:7,st:[14,11,12,16,9,8,9,11],gear:{weapon:'battleaxe',chest:'leather_chest',legs:'leather_legs'},spells:[],blurb:'Strength before sense. The axe remembers.'},
 cutpurse:{name:'Cutpurse',lv:5,st:[10,11,10,9,14,10,8,14],gear:{weapon:'dagger',head:'rags_head',chest:'rags_chest',hands:'rags_hands',legs:'rags_legs'},spells:[],blurb:'Quick hands. Quicker feet.'},
 ashwright:{name:'Ashwright',lv:6,st:[9,9,7,7,12,16,7,12],gear:{weapon:'dagger',catalyst:'ember_wand',head:'rags_head',chest:'rags_chest',legs:'rags_legs'},spells:['rime_spikes','soul_bolt'],blurb:'A scholar of cold ash. Spells scale with INT.'},
 lampbearer:{name:'Lampbearer',lv:7,st:[10,9,12,12,8,7,16,13],gear:{weapon:'mace',catalyst:'lamp_talisman',chest:'lamp_chest',legs:'lamp_legs'},spells:['mend','stormcall'],blurb:'Carries a lamp that will not go out. Miracles scale with FTH.'},
 vagrant:{name:'Vagrant',lv:1,st:[10,10,10,10,10,10,10,10],gear:{weapon:'club'},spells:[],blurb:'Nothing. No one. Begin.'},
 pyrewitch:{name:'Pyre Witch',lv:8,st:[11,12,10,12,9,14,14,9],gear:{weapon:'handaxe',catalyst:'ember_wand',chest:'leather_chest',legs:'leather_legs'},spells:['cinder_flame','ember_orb'],blurb:'Kindles what others fear to touch.'},
 gunwarden:{name:'Gunwarden',lv:6,st:[11,12,9,9,15,11,8,10],gear:{weapon:'shortsword',catalyst:'vigil_cannon',chest:'leather_chest',legs:'leather_legs'},spells:['buster'],blurb:'The Vigil Cannon fires ember pellets. Scales with DEX.'}};
const SC={E:.2,D:.45,C:.7,B:.95,A:1.2,S:1.4};
// weapons: base phys, element, scaling letters, requirements, stamina, attack time, reach
const ITEMS={
 longsword:{slot:'weapon',name:'Longsword',phys:110,sc:{STR:'C',DEX:'C'},req:{STR:10,DEX:10},stam:14,dur:.26,r:13,wt:3,lore:'A watchman\'s blade. Its edge was kept for a dawn that never came.'},
 battleaxe:{slot:'weapon',name:'Battle Axe',phys:135,sc:{STR:'B',DEX:'E'},req:{STR:14},stam:18,dur:.34,r:14,wt:4,lore:'Notched by a hundred gates. Each notch, a name forgotten.'},
 dagger:{slot:'weapon',name:'Dagger',phys:72,sc:{DEX:'B',STR:'E'},req:{DEX:8},stam:10,dur:.18,r:10,wt:1,lore:'Small enough to hide. Sharp enough to matter.'},
 mace:{slot:'weapon',name:'Mace',phys:124,sc:{STR:'B'},req:{STR:12},stam:17,dur:.32,r:12,wt:4,lore:'Blessed iron. The Lamp-order struck only what would not kneel.'},
 club:{slot:'weapon',name:'Club',phys:88,sc:{STR:'C'},req:{STR:8},stam:15,dur:.3,r:11,wt:3,lore:'A table leg, once. It has seen worse days than this.'},
 handaxe:{slot:'weapon',name:'Hand Axe',phys:100,sc:{STR:'C',DEX:'D'},req:{STR:9},stam:13,dur:.24,r:11,wt:2,lore:'Pyre witches split kindling with it. And other things.'},
 shortsword:{slot:'weapon',name:'Short Sword',phys:92,sc:{STR:'D',DEX:'C'},req:{STR:8,DEX:10},stam:12,dur:.22,r:12,wt:2,lore:'Standard issue of the Vigil. Rust in the fuller, like old blood.'},
 pale_rapier:{slot:'weapon',name:'Pale Rapier',phys:96,frost:20,sc:{DEX:'A'},req:{DEX:14},stam:11,dur:.19,r:15,wt:2,lore:'The choir\'s conductors kept time with these. They still do, somewhere.'},
 warden_gs:{slot:'weapon',name:'Warden Greatsword',phys:185,frost:40,sc:{STR:'B',DEX:'D'},req:{STR:18,DEX:10},stam:26,dur:.48,r:20,wt:9,lore:'The Frost Warden held the Ramparts for a lord who fled. Loyal to an empty seat.'},
 cinder_greataxe:{slot:'weapon',name:'Cinder Greataxe',phys:205,fire:60,sc:{STR:'A'},req:{STR:22},stam:30,dur:.52,r:19,wt:12,lore:'Forged in Orsk\'s own belly. Still warm. Still hungry.'},
 // catalysts
 ember_wand:{slot:'catalyst',name:'Ember Wand',kind:'wand',sc:{INT:'C'},req:{INT:10},wt:1,lore:'A splinter of a burnt ash-tree. Cold to the touch, oddly.'},
 sorc_staff:{slot:'catalyst',name:'Ashwright Staff',kind:'staff',sc:{INT:'B'},req:{INT:12},wt:2,lore:'Staves cast slow and strike true. Hold it with both hands.'},
 rime_staff:{slot:'catalyst',name:'Rime Staff',kind:'staff',sc:{INT:'A'},req:{INT:18},frostBonus:.2,wt:3,lore:'Carved from the clapper of the Frost Bell. It hums a note no one sings anymore.'},
 lamp_talisman:{slot:'catalyst',name:'Lamp Talisman',kind:'talisman',sc:{FTH:'B'},req:{FTH:10},wt:.5,lore:'A lamp wick bound in wire. Faith is a flame you carry for others.'},
 vigil_cannon:{slot:'catalyst',name:'Vigil Cannon',kind:'cannon',sc:{DEX:'B'},req:{DEX:12},wt:3,lore:'An arm-cannon of the old watch. Fires pellets of compressed ember.'},
 // armor (absorption %, weight)
 plate_head:{slot:'head',name:'Sentinel Helm',abs:6,wt:4,lore:'The visor is welded shut. You never needed to see the gate to guard it.'},
 plate_chest:{slot:'chest',name:'Sentinel Plate',abs:14,wt:10,lore:'Heavy plate of the Gate Vigil. It does not rust. It only waits.'},
 plate_hands:{slot:'hands',name:'Sentinel Gauntlets',abs:4,wt:3,lore:'Gauntlets that once clasped a lord\'s hand in oath.'},
 plate_legs:{slot:'legs',name:'Sentinel Greaves',abs:7,wt:5,lore:'For standing still. For a very long time.'},
 leather_chest:{slot:'chest',name:'Wanderer Leathers',abs:8,wt:4,lore:'Boiled leather, stitched by someone who meant to come home.'},
 leather_legs:{slot:'legs',name:'Wanderer Boots',abs:4,wt:2,lore:'Worn through at the heel. The road was longer than promised.'},
 rags_head:{slot:'head',name:'Ashen Hood',abs:2,wt:.5,lore:'Grave-cloth. It still smells of the earth you rose from.'},
 rags_chest:{slot:'chest',name:'Ashen Rags',abs:4,wt:1.5,lore:'You were buried in these. You were not meant to need them again.'},
 rags_hands:{slot:'hands',name:'Ashen Wraps',abs:1,wt:.3,lore:'Bindings for hands that should be bones.'},
 rags_legs:{slot:'legs',name:'Ashen Leggings',abs:2,wt:.7,lore:'Thin as a promise.'},
 lamp_chest:{slot:'chest',name:'Lamp Vestment',abs:6,wt:2.5,lore:'White once. The Lamp-order washed it in ash to mourn the sun.'},
 lamp_legs:{slot:'legs',name:'Lamp Skirt',abs:3,wt:1.2,lore:'Embroidered with a flame. The thread has gone grey.'},
 choir_head:{slot:'head',name:'Pale Choir Veil',abs:4,frostRes:15,wt:1,lore:'Singers wore veils so the bell would not see their faces.'},
 choir_chest:{slot:'chest',name:'Pale Choir Robe',abs:9,frostRes:25,wt:3,lore:'Frost gathers in the folds and never melts. It keeps the cold out by keeping it in.'},
 kiln_chest:{slot:'chest',name:'Kiln Iron Cuirass',abs:22,fireRes:30,wt:16,lore:'Iron poured straight from Orsk\'s furnace onto a living man. He stood up anyway.'},
 kiln_legs:{slot:'legs',name:'Kiln Iron Greaves',abs:11,fireRes:15,wt:8,lore:'Walk on coals. Walk anywhere.'},
 // consumables / keys
 ember_shard:{slot:'mat',name:'Ember Shard',lore:'A fleck of the First Flame. A smith can fold it into steel.'},
 warden_soul:{slot:'key',name:'Soul of the Warden',lore:'He did not flee. He was left. The Ramparts lord never said goodbye.'},
 vaelith_soul:{slot:'key',name:'Frost Bell Soul',lore:'Vaelith rang the bell to drown the sound of the flame dying. Fear, in the end.'},
 orsk_soul:{slot:'key',name:'Kiln Soul',lore:'Orsk would not burn because he was always burning. Hunger, not cowardice.'}};
const SPELLS={
 soul_bolt:{name:'Soul Bolt',school:'sorc',fp:6,req:{INT:10},dmg:70,cast:'any',lore:'The first lesson of the Ashwrights: a soul is a stone you can throw.'},
 rime_spikes:{name:'Rime Spikes',school:'sorc',fp:15,req:{INT:12},dmg:110,lore:'Call the frost up from below. The ground remembers winter.'},
 rime_burst:{name:'Rime Burst',school:'sorc',fp:18,req:{INT:18},dmg:150,lore:'A dome of rime. What is inside freezes; what is outside watches.'},
 crystal_lance:{name:'Crystal Lance',school:'sorc',fp:20,req:{INT:22},dmg:200,lore:'A spear of clear ice that passes through all who stand in a line.'},
 cinder_flame:{name:'Cinder Flame',school:'pyro',fp:8,req:{INT:8,FTH:8},dmg:60,lore:'A handful of fire, held a moment too long.'},
 ember_orb:{name:'Ember Orb',school:'pyro',fp:14,req:{INT:12,FTH:12},dmg:120,lore:'Lob the fire. Let it find its own way down.'},
 stormcall:{name:'Stormcall',school:'mir',fp:20,req:{FTH:14},dmg:170,lore:'Lightning was the Lamp-order\'s answer to every question.'},
 mend:{name:'Mend',school:'mir',fp:25,req:{FTH:12},heal:.4,lore:'Close the wound. Do not ask what fills it.'},
 buster:{name:'Ember Pellet',school:'cannon',fp:0,req:{DEX:10},dmg:40,lore:'Pellets of compressed ember. The cannon never runs dry; you might.'}};
const SCHOOL_OK={sorc:['wand','staff'],pyro:['wand','staff','talisman'],mir:['talisman'],cannon:['cannon']};
// level-up cost, design doc §10
function levelCost(L){return Math.max(Math.round(.02*L**3+3.06*L**2+105.6*L-895),200+12*L)}
function statCurve(v){return v<=20?.5*v/20:v<=40?.5+.4*(v-20)/20:Math.min(1,.9+.1*(v-40)/20)}
function derived(s){const g=k=>s.stats[STATS.indexOf(k)];
 const vig=g('VIG');const hp=300+25*Math.min(vig,40)+10*Math.max(0,vig-40);
 return{hp,st:80+2*g('END'),load:40+1.5*g('VIT'),fp:Math.round(50+4*g('INT')/2+3*g('FTH')/2)}}
function stat(s,k){return s.stats[STATS.indexOf(k)]}
function meetsReq(s,req){for(const k in req||{})if(stat(s,k)<req[k])return false;return true}
function weaponAR(s,id,up){const w=ITEMS[id];if(!w)return 50;const base=w.phys+(w.fire||0)+(w.frost||0);let ar=base*(1+.1*(up||0));
 for(const k in w.sc)ar+=base*SC[w.sc[k]]*statCurve(stat(s,k));if(!meetsReq(s,w.req))ar*=.6;return Math.round(ar)}
function spellPower(s,spellId){const sp=SPELLS[spellId],c=ITEMS[s.eq.catalyst];if(!sp||!c)return 0;let m=1+Object.keys(c.sc).reduce((a,k)=>a+SC[c.sc[k]]*statCurve(stat(s,k)),0);
 if(c.kind==='staff')m*=1.2;if(c.kind==='wand')m*=.85;if(c.frostBonus&&/rime|crystal/.test(spellId))m*=1+c.frostBonus;const up=(s.inv.find(i=>i.id===s.eq.catalyst)||{}).up||0;return Math.round((sp.dmg||0)*m*(1+.08*up))}
function canCast(s,id){const sp=SPELLS[id],c=ITEMS[s.eq.catalyst];return !!(sp&&c&&SCHOOL_OK[sp.school].includes(c.kind)&&meetsReq(s,sp.req))}
function equipWeight(s){return['weapon','catalyst','head','chest','hands','legs'].reduce((a,k)=>a+((ITEMS[s.eq[k]]||{}).wt||0),0)}
function rollTier(s){const r=equipWeight(s)/derived(s).load;return r<.3?{n:'LIGHT',spd:185,i0:.06,i1:.30,dur:.36}:r<.7?{n:'MEDIUM',spd:155,i0:.08,i1:.26,dur:.40}:r<1?{n:'HEAVY',spd:120,i0:.12,i1:.22,dur:.46}:{n:'OVERLOADED',spd:0,i0:0,i1:0,dur:0,over:1}}
function absorb(s){return Math.min(.65,['head','chest','hands','legs'].reduce((a,k)=>a+((ITEMS[s.eq[k]]||{}).abs||0),0)/100)}
function newSave(cls){const C0=CLASSES[cls];const inv=[];for(const k in C0.gear)inv.push({id:C0.gear[k],up:0});
 return{version:1,class:cls,level:C0.lv,stats:C0.st.slice(),souls:0,remnant:null,inv,eq:{...C0.gear},spells:C0.spells.slice(),spellIdx:0,flasks:3,flaskMax:3,shards:0,
  stage:'shrine',vigil:null,kindled:[],bosses:[],seenIntro:{},flags:{},loot:[],playtime:0,updatedAt:Date.now(),ending:null}}
// ---------- stages ----------
const PAL={
 ramparts:{sky:['#0b081d','#0f0b25','#140f2e','#1a1439','#221a47'],far:'#191335',farW:'#2a2754',farW2:'#3b3a6e',near:'#0e0a20',nearW:'#30335f',gTop:'#4b4078',g1:'#352c5e',g2:'#2d2552',gM:'#1f1940',gD:'#17122f',star:['#e8e4ff','#8a86c0','#4d4a86'],cap:null},
 choir:{sky:['#050b1c','#08122b','#0c1a3b','#11254f','#183363'],far:'#0f1d3c',farW:'#24406e',farW2:'#6fa6e0',near:'#08112a',nearW:'#3a6aa8',gTop:'#a8c8f0',g1:'#3a5482',g2:'#2e4570',gM:'#1e2e50',gD:'#16223e',star:['#ffffff','#9fc8ff','#4a6aa8'],cap:'#cfe6ff'},
 cinder:{sky:['#140606','#1e0807','#2a0c08','#3c120a','#5a1c0c'],far:'#1c0808',farW:'#5a1c0e',farW2:'#ff8a3a',near:'#0f0505',nearW:'#b0461a',gTop:'#7a4234',g1:'#3a1e1c',g2:'#2e1716',gM:'#1e0e0e',gD:'#160a0a',star:['#ffb070','#a04a2a','#5a2414'],cap:null},
 shrine:{sky:['#0b081d','#100b24','#160f2c','#1e1436','#2a1a40'],far:'#191335',farW:'#2a2754',farW2:'#6a4a3a',near:'#0e0a20',nearW:'#5a3a2a',gTop:'#5a4a6a',g1:'#3a2e4a',g2:'#30263f',gM:'#1f1930',gD:'#171226',star:['#e8e4ff','#8a86c0','#4d4a86'],cap:null}};
const STAGES={
 shrine:{name:'THE EMBER SHRINE',hub:1,len:640,pal:'shrine',plats:[],enemies:[],weather:'ash',braziers:[120,520],lamp:'fire'},
 ramparts:{name:'THE ASHEN RAMPARTS',len:3360,pal:'ramparts',weather:'none',lamp:'fire',bonfire:1600,
  plats:[[430,128,48],[540,108,40],[1000,124,64],[1110,100,48],[1820,126,56],[1930,104,40],[2160,118,48],[2290,96,48],[2400,120,40]],
  enemies:[['hollow',360],['imp',520],['hollow',720],['wraith',900],['hollow',1180],['imp',1260],['wraith',1380],['imp',1900],['hollow',2020],['wraith',2250],['hollow',2460],['imp',2600],['hollow',2760],['wraith',2850]],
  loot:[[560,96,'ember_shard'],[1130,88,'sorc_staff'],[2310,84,'ember_shard'],[1950,92,'pale_rapier']],boss:'warden',bossName:'FROST WARDEN',bossSub:'KEEPER OF THE ASHEN RAMPARTS',reward:['warden_soul','warden_gs']},
 choir:{name:'CATHEDRAL OF THE PALE CHOIR',len:3360,pal:'choir',weather:'snow',ice:1,lamp:'frost',bonfire:1700,
  plats:[[380,126,48],[470,104,40],[860,120,56],[980,96,40],[1300,124,48],[1420,100,48],[2050,122,56],[2180,98,48],[2500,118,64]],
  enemies:[['hollow',420],['wraith',640],['wraith',900],['hollow',1100],['hollow',1250],['wraith',1500],['hollow',1950],['wraith',2150],['hollow',2350],['wraith',2600],['hollow',2780],['wraith',2880]],
  icicles:[480,880,1000,1320,1440,2070,2200,2520],
  loot:[[990,84,'choir_head'],[1440,88,'choir_chest'],[2200,86,'ember_shard'],[2520,106,'rime_burst_scroll']],boss:'vaelith',bossName:'VAELITH',bossSub:'WARDEN OF THE FROST BELL',reward:['vaelith_soul','rime_staff']},
 cinder:{name:'CINDERDEEP',len:3360,pal:'cinder',weather:'embers',heat:1,lamp:'fire',bonfire:1650,
  plats:[[600,124,40],[700,108,40],[1240,120,56],[1350,98,40],[2080,124,48],[2200,104,48],[2320,120,40]],
  lava:[[620,120],[1250,140],[2100,240]],vents:[420,950,1520,1880,2560,2720],
  enemies:[['imp',380],['hollow',520],['imp',880],['ewraith',1050],['hollow',1150],['imp',1450],['ewraith',1600],['hollow',1950],['imp',2450],['ewraith',2600],['hollow',2800],['imp',2880]],
  loot:[[720,96,'kiln_legs'],[1360,86,'kiln_chest'],[2210,92,'ember_shard'],[2330,108,'cinder_greataxe']],boss:'orsk',bossName:'ORSK',bossSub:'THE KILN THAT WALKS',reward:['orsk_soul']}};
ITEMS.rime_burst_scroll={slot:'scroll',name:'Scroll: Rime Burst',spell:'rime_burst',lore:'A hymn written in frost on vellum. Read it before it melts.'};
const STAGE_ORDER=['ramparts','choir','cinder'];
// keeper dialogue — cryptic, short
const KEEPER={name:'SISTER EMBER',lines:{
 0:['Ah... another Vigil, risen from the grave-ash.','The First Flame gutters. Three Lords swore to feed it, and fled.','Begin at the Ramparts. Bring me their embers.'],
 1:['The Warden kept his post. Pity him, if you can.','The Choir sings beyond the frozen arch. Mind the bell.'],
 2:['Vaelith rang and rang, so none would hear the dark.','Only the Kiln remains. Orsk is hunger given legs.'],
 3:['Three embers. The flame is listening.','Lay them in the hearth. Then choose.','Rekindle, and you burn so the age may limp on.','Or let it fade... and I will hold one small light for us.']}};
const INTRO_TEXT=['THE FIRST FLAME IS GUTTERING.','THE LORDS OF CINDER SWORE TO BURN AS ITS KINDLING,','AND BROKE THEIR VOW.','YOU ARE AN ASHEN VIGIL. RISE.'];
