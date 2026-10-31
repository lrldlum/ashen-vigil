// Weapon progression (pure data): per region, the best owned-by-then weapon for each stat climbs steadily; boss weapons beat every
// regular weapon of their region and climb boss to boss; starter weapons fall off. Prints the progression + boss tables.
import fs from 'fs';import vm from 'vm';
const ctx={console,Math,Object,JSON};vm.createContext(ctx);
for(const f of['rpg.js','story.js','loot.js','weapons.js'])vm.runInContext(fs.readFileSync(new URL('../'+f,import.meta.url),'utf8').replace(/^'use strict';/m,''),ctx,{filename:f});
const R=vm.runInContext('({STARTER_BEFORE,WEAPONS,RPG,REGION_ORDER,REGION_GEAR,regionStats,SIGNATURE,SIG_TUNE,SIG_BEFORE,REGION_STAT})',ctx);
let pass=0,fail=0;const ok=(n,c,d)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(d)))};
const {WEAPONS:W,RPG,REGION_ORDER:RO,REGION_GEAR:RG}=R;
const dps=(id,st)=>{const w=W[id],L=w.light;return RPG.ar(w,st)*(L.mul||1)*Math.min(2,L.n||1)/(L.t||.34)};
const starters=['longsword','dagger','spear','axe','greatsword','staff','bow'];
const rows=[];const best={str:[],dex:[],int:[],fth:[]};
RO.forEach((sid,i)=>{const row={region:sid};for(const k of['str','dex','int','fth']){const st=R.regionStats(i,k);const pool=[...starters,...RO.slice(0,i+1).flatMap(s=>RG[s])];
  let b=null,bv=0;for(const id of pool){const v=RPG.ar(W[id],st);if(v>bv){bv=v;b=id}}best[k].push(bv);row[k]=`${W[b].name} ${(bv*100).toFixed(0)}`}rows.push(row)});
for(const k of['str','dex','int','fth']){const a=best[k];let mono=true,minStep=9;for(let i=1;i<a.length;i++){const r=a[i]/a[i-1];if(r<1.05)mono=false;minStep=Math.min(minStep,r)}
 ok(k+'_best_climbs_each_region_>=5%',mono,a.map(x=>+x.toFixed(2)));ok(k+'_headroom_<=20%_per_region',a.every((x,i)=>!i||x/a[i-1]<=1.2),minStep)}
ok('each_region_has_4_stat_weapons',RO.every(s=>RG[s].length===4));
// starters fall off: by region 3 the regular best is >=40% above the starting longsword at that stat
ok('starters_fall_off',(()=>{const st=R.regionStats(3,'str');return best.str[3]>RPG.ar(W.longsword,st)*1.4&&best.str[3]>RPG.ar(W.greatsword,st)*1.25})());
// bosses
const brows=[];let prev=0,monoB=true,beats=true;
for(const[id,[k,l,i]]of Object.entries(R.SIG_TUNE)){const st=R.regionStats(i,k),w=W[id],B0=R.SIG_BEFORE[id];const best=Math.max(...[...starters,...RO.slice(0,i+1).flatMap(s=>RG[s])].map(x=>RPG.ar(W[x],st)));
 const bestDps=Math.max(...[...starters,...RO.slice(0,i+1).flatMap(s=>RG[s])].map(x=>dps(x,st)));
 const before={...w,base:B0.base,sc:B0.sc,req:B0.req,heavy:{...w.heavy,mul:B0.hmul}};const arB=RPG.ar(before,st),arA=RPG.ar(w,st);
 const dB=arB*w.light.mul*Math.min(2,w.light.n)/w.light.t,dA=dps(id,st);
 brows.push({w:w.name,region:RO[i],stat:k+' '+st[k],base:`${B0.base} -> ${w.base}`,ar:`${(arB*100)|0} -> ${(arA*100)|0}`,heavy:`${(arB*B0.hmul*100)|0} -> ${(arA*w.heavy.mul*100)|0}`,dpsVsBest:`${(dB/bestDps).toFixed(2)}x -> ${(dA/bestDps).toFixed(2)}x`,special:`pw ${'0.5ar(cap)'} -> ${w.spMul}ar, reach x${w.spR}, cd 1.5 -> 1.1s`});
 if(arA<arB*1.149||arA<=best*1.15||dA<bestDps*1.0){beats=false;console.log('BEAT?',id,arA,arB,best,dA,bestDps)}if(arA<=prev)monoB=false;prev=arA}
ok('boss_weapons_beat_region_best_by_15%',beats);ok('boss_weapons_monotonic',monoB);
ok('str_boss_weapons_scale_S',Object.entries(R.SIG_TUNE).filter(([,v])=>v[0]==='str').every(([id])=>W[id].sc.str==='S'));
if(process.env.TABLES){console.table(rows);console.table(brows)}
console.log(JSON.stringify({pass,fail}));process.exit(fail?1:0);
