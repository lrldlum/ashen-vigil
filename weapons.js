// ASHEN VIGIL — weapon progression (r9). Loaded after game.js. Pure data + one chest hook.
// - Every region (in story order) places one STR, one DEX, one INT and one FTH weapon that beats the previous region's at the
//   stat a player would have there (14 + 3 per region). They sit in the region's chests (the first four), so they are found, not bought.
// - Starting weapons stay where they are, so they fall off by the second or third region.
// - Boss (signature) weapons are tuned to 1.3x the best regular weapon of their region at that stat (replaces the r8 1.2x cap),
//   so the curve climbs monotonically boss to boss; STR lord weapons scale S in STR. Heavy specials scale from the weapon's AR.
// - Headroom: the region curve grows 13%/region, so smith upgrades (+1..+5, ~+6% each, later) still matter between regions.
'use strict';
const REGION_ORDER=['ramparts','cathedral','cinderdeep','belltower','catacomb','drowned','keep','spire','cloister','throne'];
const REGION_STAT=i=>14+3*i;// expected main stat in region i
const SIG_OVER=1.3;
const PROG_STATS=['str','dex','int','fth'];
// families: moveset template + scaling letter on the main stat, a minor secondary, and names per region
const PROG_FAM={
 str:{tpl:'greatsword',sc:'A',sec:['dex','E'],w:[7,7,8,8,9,9,10,10,11,11],names:['RAMPART CLEAVER','CHOIR MAUL','SLAG GREATAXE','BELLRINGER MAUL','OSSUARY CLEAVER','WRECKER GREATSWORD','SIEGE BREAKER','METEOR HAMMER','BRIAR GREATAXE','USURPER GREATSWORD']},
 dex:{tpl:'longsword',sc:'A',sec:['str','E'],w:[3,3,3,3,4,4,4,4,4,4],names:['SENTRY SABRE','CANTOR RAPIER','EMBERSTEEL SHOTEL','RIME ESTOC','BONE FALCHION','TIDE SCIMITAR','CASTELLAN SABRE','COMET RAPIER','THORN ESTOC','HEIR\'S SHORTBLADE']},
 int:{tpl:'staff',sc:'A',sec:['dex','E'],w:[2,2,2,2,3,3,3,3,3,3],names:['WATCH STAFF','CHOIR ROD','CINDER ROD','RIME STAFF','MARROW STAFF','PEARL STAFF','ARCHIVE STAFF','ORRERY STAFF','BRIAR ROD','HOLLOW STAFF'],cat:1},
 fth:{tpl:'axe',sc:'A',sec:['str','E'],w:[4,4,5,5,5,5,6,6,6,6],names:['VIGIL MACE','HYMNAL MACE','EMBER CENSER','TOLLING MACE','RELIQUARY MACE','DROWNED CENSER','OATH MACE','STAR CENSER','PRIORY MACE','THRONE SCEPTRE']}};
const SCALE_=typeof SCALE!=='undefined'?SCALE:{S:1.4,A:1.1,B:.8,C:.55,D:.35,E:.15};
const curve_=s=>s<=10?0:s<=40?(s-10)/30:1+(s-40)/59*.25;
// the stats a player at region i is assumed to have (main stat high, the rest at 12)
const regionStats=(i,main)=>{const o={vig:12,end:12,vit:12,str:12,dex:12,int:12,fth:12,lck:10};if(main)o[main]=REGION_STAT(i);return o};
const mulAt=(sc,st)=>{let b=1;for(const[k,l]of Object.entries(sc))b+=SCALE_[l]*curve_(st[k]);return b};
// starters fall off: the heavy starters lose their late-game edge (they were the one-weapon-all-game pick)
const STARTER_NERF={greatsword:{base:1.35,sc:{str:'C',dex:'E'}},axe:{base:1.05}};const STARTER_BEFORE={};
for(const[id,n]of Object.entries(STARTER_NERF))if(WEAPONS[id]){STARTER_BEFORE[id]={base:WEAPONS[id].base,sc:{...WEAPONS[id].sc}};Object.assign(WEAPONS[id],n)}
const STARTERS=['longsword','dagger','spear','axe','greatsword','staff','bow'];
const arAt=(w,st)=>{let ok=Object.entries(w.req||{}).every(([k,v])=>st[k]>=v);return w.base*mulAt(w.sc||{},st)*(ok?1:w.w>=6?.35:.5)};
// per-stat target curve: >=6% over every starter at that region's stat, and +12% per region (smith headroom between regions)
const TGT={};for(const k of PROG_STATS){TGT[k]=[];for(let i=0;i<10;i++){const st=regionStats(i,k),bs=Math.max(...STARTERS.map(id=>arAt(WEAPONS[id],st)));const fam={[k]:'A',[PROG_FAM[k].sec[0]]:PROG_FAM[k].sec[1]},grow=i?mulAt(fam,st)/mulAt(fam,regionStats(i-1,k)):1;TGT[k].push(Math.max(i?TGT[k][i-1]*grow*1.08:0,bs*1.06))}for(let i=9;i>0;i--)TGT[k][i-1]=Math.max(TGT[k][i-1],TGT[k][i]/1.16)}
const REGION_TARGET=(i,k='str')=>TGT[k][i];
const PROG_WEAPONS={},REGION_GEAR={};
REGION_ORDER.forEach((sid,i)=>{REGION_GEAR[sid]=[];for(const k of PROG_STATS){const F=PROG_FAM[k],T=WEAPONS[F.tpl],id='r'+i+'_'+k,sc={[k]:F.sc,[F.sec[0]]:F.sec[1]},st=regionStats(i,k);
  const req={[k]:Math.max(10,REGION_STAT(i)-4)};const base=+(REGION_TARGET(i,k)/mulAt(sc,st)).toFixed(3);
  const wp={...T,name:F.names[i],base,req,sc,w:F.w[i],prog:{region:i,stat:k}};if(F.cat){wp.cat=1;wp.buff=Math.round(100+12*i);wp.csc='A'}else{delete wp.cat;delete wp.buff;delete wp.csc}
  PROG_WEAPONS[id]=wp;REGION_GEAR[sid].push(id)}});
// signature retune: primary stat + letter, then base solved for SIG_OVER x the region best at that stat
const SIG_TUNE={frostbrand:['dex','A',0],requiemspear:['dex','A',1],crownbreaker:['str','S',2],clapper:['str','S',3],ashmaul:['str','S',4],tidecrook:['dex','A',5],halberd:['str','S',6],starlance:['dex','A',7],thornbrand:['dex','A',8],hollowbrand:['str','S',9]};
const SIG_BEFORE={};let prevSig=0;
for(const[id,[k,l,i]]of Object.entries(SIG_TUNE)){const w=WEAPONS[id];if(!w)continue;SIG_BEFORE[id]={base:w.base,sc:{...w.sc},req:{...w.req},hmul:w.heavy.mul};
 const sec=k==='str'?'dex':'str';w.sc={[k]:l,[sec]:'E'};w.req={[k]:Math.max(10,REGION_STAT(i)-4),[sec]:10};if(w.req.fth===undefined&&SIG_BEFORE[id].req.fth)w.req.fth=SIG_BEFORE[id].req.fth;
 const target=SIG_OVER*Math.max(...PROG_STATS.map(q=>REGION_TARGET(i,q)));/* a region's lord weapon tops every stat's best there, and never ends up below +15% of its old AR */const st0=regionStats(i,k),oldAr=SIG_BEFORE[id].base*mulAt(SIG_BEFORE[id].sc,st0);const tg=Math.max(target,oldAr*1.15,prevSig*1.06);prevSig=tg;w.base=+(tg/mulAt(w.sc,st0)).toFixed(3);
 w.heavy={...w.heavy,mul:+(w.heavy.mul*1.15).toFixed(2),cost:Math.round(w.heavy.cost*.9)};w.spMul=+(0.8+0.06*i).toFixed(2);w.spR=+(1.25+0.03*i).toFixed(2);w.sigRank=i}
// the Cinder King's greatsword swings faster (its DPS trailed the region's quicker blades)
if(WEAPONS.crownbreaker){WEAPONS.crownbreaker.light={...WEAPONS.crownbreaker.light,t:.56,h0:.2,h1:.3};WEAPONS.crownbreaker.heavy={...WEAPONS.crownbreaker.heavy,t:.8,h0:.4,h1:.48}}
Object.assign(WEAPONS,PROG_WEAPONS);
if(typeof DESC!=='undefined')for(const[id,w]of Object.entries(PROG_WEAPONS))DESC[id]=DESC[id]||[`FOUND IN THE ${REGION_ORDER[w.prog.region].toUpperCase()}.`,`SCALES ${w.prog.stat.toUpperCase()} A. NEEDS ${w.prog.stat.toUpperCase()} ${w.req[w.prog.stat]}.`];
// chests: the region's first four chests (in CHESTS order) hold its STR / DEX / INT / FTH weapon
if(typeof Stage!=='undefined'){const SP=Stage.prototype,oc=SP.openChest,hm=SP.hitMimic;
 SP.progGrant=function(c){try{if(NET.guest())return;const L=(CHESTS[this.sid]||[]),j=L.findIndex(q=>q.id===c.id),g=(REGION_GEAR[this.sid]||[])[j];
   if(g&&!this.sv.inv.includes(g)){this.sv.inv.push(g);Save.write(this.sv);this.sigBanner={w:g,t:0,title:'WEAPON FOUND'};this.sfx('fanfare',.3);this.stats.progFound=(this.stats.progFound||0)+1}}catch(e){}};
 // plain chests give it on opening; mimics (they wake instead of opening) give it when slain
 SP.openChest=function(c,fromNet){const was=c.st;const r=oc.call(this,c,fromNet);if(was==='shut'&&c.st==='open')this.progGrant(c);return r};
 SP.hitMimic=function(c,ar,fromNet){const was=c.st;const r=hm.call(this,c,ar,fromNet);if(was==='awake'&&c.st==='dead')this.progGrant(c);return r}}
if(typeof module!=='undefined')module.exports={STARTER_BEFORE,TGT,REGION_ORDER,REGION_STAT,REGION_TARGET,PROG_WEAPONS,REGION_GEAR,SIG_TUNE,SIG_BEFORE,regionStats};
